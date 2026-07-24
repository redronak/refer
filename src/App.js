// ───────────────────────────────────────────────────────────────────────────
//  Easy Recommend — drop-in router for the shared Express project
//
//  Mount in your main server:
//     const easyrecommend = require('./projects/easyrecommend');
//     app.use('/easyrecommend', easyrecommend);
//
//  Single Mongo collection ("easyrecommend") with a `kind` discriminator.
//  OTP stored in Mongo. Admin gets an SMS on every major event. Commission
//  (percent / flat / both) is PRIVATE — never returned on public endpoints.
// ───────────────────────────────────────────────────────────────────────────
const express  = require('express');
const mongoose = require('mongoose');
const crypto   = require('crypto');
const router   = express.Router();

/* ── Config ─────────────────────────────────────────────────────────────── */
const ADMIN_PHONE  = '+18062248515';
const SMS_URL      = 'https://datingggo-d609631f502c.herokuapp.com/send-smsd';
const ADMIN_KEY    = process.env.EASYREC_ADMIN_KEY || '1997';
const PUBLIC_BASE  = process.env.EASYREC_BASE      || 'https://easyrecommend.co';
const MASTER_OTPS  = ['123123', '999999'];
const CATEGORIES   = ['Beauty', 'Legal', 'Education', 'Wellness', 'Fitness', 'Food & Drink', 'Home', 'Finance', 'Travel', 'Fashion', 'Software & SaaS', 'Apps', 'AI Tools', 'Online Courses', 'Gaming', 'Subscriptions', 'Creator Tools', 'Marketplaces', 'Other'];

/* ── Mongo (guarded so it doesn't double-connect alongside other routers) ── */
if (mongoose.connection.readyState === 0 && (process.env.MONGO_URI || process.env.MONGODB_URI)) {
  mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)
    .catch(e => console.error('[easyrecommend] mongo connect error:', e.message));
}

const recSchema = new mongoose.Schema({
  kind:       { type: String, index: true },   // business | influencer | link | review | otp
  createdAt:  { type: Date, default: Date.now },
  // business
  name: String, phone: String, email: String, website: String, categories: [String],
  city: String, online: Boolean,
  commissionType: { type: String, default: 'percent' },   // percent | flat | both
  commissionPct:  { type: Number, default: 0 },
  commissionFlat: { type: Number, default: 0 },
  discount: Number, photos: [String], blurb: String,
  status: { type: String, default: 'pending' },           // pending | approved | rejected
  passHash: String,                                        // brand email+password login
  hidePhone: Boolean, hideEmail: Boolean, hideWebsite: Boolean, // admin-controlled visibility
  // influencer
  username: String, image: String, bio: String,
  // session token (brand or creator)
  token: { type: String, index: true },
  // link / review
  businessId: mongoose.Schema.Types.ObjectId, influencer: String, slug: String,
  stars: Number, text: String,
  clicks: { type: Number, default: 0 }, sales: { type: Number, default: 0 },
  // otp
  code: String, expiresAt: Date,
}, { strict: false });

const Rec = mongoose.models.EasyRec || mongoose.model('EasyRec', recSchema, 'easyrecommend');

/* ── Helpers ────────────────────────────────────────────────────────────── */
const slugify = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function commissionLabel(b) {
  if (b.commissionType === 'flat') return `$${b.commissionFlat}`;
  if (b.commissionType === 'both') return `${b.commissionPct}% + $${b.commissionFlat}`;
  return `${b.commissionPct}%`;
}
async function sendSMS(messages) {
  try {
    await fetch(SMS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages }) });
  } catch (e) { console.error('[easyrecommend] SMS failed:', e.message); }
}
// Admin SMS is intentionally limited to payment events only (see notifyPay).
const notifyAdmin = _msg => {};
const notifyPay   = msg => sendSMS([{ message: msg, phoneNumber: ADMIN_PHONE }]);
const textUser    = (phone, msg) => phone && sendSMS([{ message: msg, phoneNumber: phone }]);

// High-income / wealthy countries by international dialing code. Used by the
// admin "rich countries only" bulk-SMS filter. Prefix match on the country code.
const RICH_PREFIXES = [
  '1',   // US / Canada (NANP — approximation; also covers some Caribbean)
  '44',  // UK
  '353', // Ireland
  '61',  // Australia
  '64',  // New Zealand
  '49',  // Germany
  '33',  // France
  '41',  // Switzerland
  '43',  // Austria
  '32',  // Belgium
  '31',  // Netherlands
  '352', // Luxembourg
  '45',  // Denmark
  '46',  // Sweden
  '47',  // Norway
  '358', // Finland
  '354', // Iceland
  '39',  // Italy
  '34',  // Spain
  '351', // Portugal
  '356', // Malta
  '357', // Cyprus
  '377', // Monaco
  '423', // Liechtenstein
  '65',  // Singapore
  '852', // Hong Kong
  '81',  // Japan
  '82',  // South Korea
  '886', // Taiwan
  '971', // UAE
  '974', // Qatar
  '965', // Kuwait
  '973', // Bahrain
  '968', // Oman
  '966', // Saudi Arabia
  '972', // Israel
];
function isRichNumber(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (!d) return false;
  if (d.startsWith('00')) d = d.slice(2);           // strip intl 00 prefix
  if (d.length === 10 && /^[2-9]/.test(d)) return true; // bare 10-digit NANP → US/Canada
  return RICH_PREFIXES.some(p => d.startsWith(p));
}

function publicBusiness(b) {   // strips commission, phone (sensitive), + any contact the admin hid
  return {
    id: b._id, name: b.name, categories: b.categories, city: b.city, online: b.online,
    discount: b.discount, photos: b.photos, blurb: b.blurb, status: b.status,
    premium: !!b.premium, paid: !!b.paid, products: Array.isArray(b.products) ? b.products : [],
    createdAt: b.createdAt || null, approvedAt: b.approvedAt || null,
    website: b.hideWebsite ? '' : (b.website || ''),
    email:   b.hideEmail   ? '' : (b.email || ''),
    // phone is intentionally omitted — never exposed publicly or to creators.
  };
}
function requireAdmin(req, res, next) {
  if (req.headers['x-admin-key'] !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}
const genToken = () => crypto.randomBytes(24).toString('hex');
function hashPassword(pw) { const salt = crypto.randomBytes(16).toString('hex'); return `${salt}:${crypto.scryptSync(String(pw), salt, 32).toString('hex')}`; }
function verifyPassword(pw, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, h] = stored.split(':'); const calc = crypto.scryptSync(String(pw), salt, 32).toString('hex');
  const a = Buffer.from(h, 'hex'), b = Buffer.from(calc, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const tokenFrom = req => (req.body && req.body.token) || req.query.token || '';
const creatorByToken = req => { const t = tokenFrom(req); return t ? Rec.findOne({ kind: 'influencer', token: t }) : null; };
function privateBusiness(b) {   // owner/admin context — real contact + visibility flags
  return {
    ...publicBusiness(b), website: b.website || '', phone: b.phone || '', email: b.email || '',
    hideWebsite: !!b.hideWebsite, hidePhone: !!b.hidePhone, hideEmail: !!b.hideEmail,
    commissionType: b.commissionType, commissionPct: b.commissionPct, commissionFlat: b.commissionFlat,
    paid: !!b.paid, plan: b.plan || '', premium: !!b.premium,
  };
}
// build { businessId -> [{username, image}] } for a set of business ids
async function backersFor(ids) {
  const links = await Rec.find({ kind: 'link', businessId: { $in: ids } });
  const handles = [...new Set(links.map(l => l.influencer))];
  const infs = await Rec.find({ kind: 'influencer', username: { $in: handles } });
  const imap = Object.fromEntries(infs.map(i => [i.username, i.image || '']));
  const out = {};
  for (const l of links) {
    const k = String(l.businessId);
    (out[k] = out[k] || []).push({ username: l.influencer, image: imap[l.influencer] || '' });
  }
  return out;
}

/* ════════════════════════════ OTP (brand signup) ═════════════════════════ */
router.post('/otp/send', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone required' });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await Rec.findOneAndUpdate({ kind: 'otp', phone },
    { kind: 'otp', phone, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }, { upsert: true });
  try { await textUser(phone, `Your Easy Recommend code is ${code}`); } catch (e) { /* SMS hiccup — code is still stored, request stays OK */ }
  res.json({ sent: true });
});
async function verifyOtp(phone, code) {
  if (MASTER_OTPS.includes(String(code))) return true;
  const doc = await Rec.findOne({ kind: 'otp', phone });
  return !!(doc && doc.code === String(code) && doc.expiresAt > new Date());
}

/* ════════════════════════════ Brand / business ═══════════════════════════ */
router.post('/business', async (req, res) => {
  const { name, phone, email, website, categories, city, online, commissionType, commissionPct, commissionFlat, discount, photos, blurb, otp, password, hideWebsite, hideEmail, hidePhone } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  // Mobile verification is required — businesses sign in with their phone via OTP.
  if (!phone || !String(phone).trim()) return res.status(400).json({ error: 'Mobile number is required' });
  if (!otp) return res.status(400).json({ error: 'Verification code is required' });
  if (!(await verifyOtp(phone, otp))) return res.status(401).json({ error: 'Invalid or expired code' });

  const cType = ['percent', 'flat', 'both'].includes(commissionType) ? commissionType : 'percent';
  const token = genToken();
  const doc = {
    kind: 'business', name, phone, email: email || '', website: website || '', token,
    categories: (categories || []).filter(c => CATEGORIES.includes(c)),
    city, online: !!online, commissionType: cType,
    commissionPct: Number(commissionPct) || 0, commissionFlat: Number(commissionFlat) || 0,
    discount: Number(discount) || 0, photos: photos || [], blurb: blurb || '', status: 'pending',
    hideWebsite: !!hideWebsite, hideEmail: !!hideEmail, hidePhone: !!hidePhone,
  };
  if (password && String(password).length >= 6) doc.passHash = hashPassword(password); // optional legacy email+password login
  const biz = await Rec.create(doc);
  await Rec.deleteOne({ kind: 'otp', phone });
  notifyAdmin(`🆕 New business pending: ${name} (${(categories || []).join(', ')}) · ${online ? 'Online' : city} · pays ${commissionLabel(biz)}. Approve in admin.`);
  res.json({ id: biz._id, status: 'pending', token });
});

/* ── Brand login + self-service editing ── */
const normPhone = s => String(s || '').replace(/\D/g, '');
// Verify OTP for a phone → token + the businesses owned by that number.
router.post('/business/login/verify', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone required' });
  if (!(await verifyOtp(phone, otp))) return res.status(401).json({ error: 'Invalid or expired code' });
  const target = normPhone(phone);
  const stripLead = p => normPhone(p).replace(/^1/, '');
  let list = await Rec.find({ kind: 'business', phone });
  if (!list.length && target) {
    const all = await Rec.find({ kind: 'business' });
    list = all.filter(b => normPhone(b.phone) === target || stripLead(b.phone) === stripLead(phone));
  }
  if (!list.length) return res.status(404).json({ error: 'No business found for that number. Use the same number you signed up with.' });
  const token = genToken();
  for (const b of list) { b.token = token; await b.save(); }
  await Rec.deleteOne({ kind: 'otp', phone });
  res.json({ token, phone, businesses: list.map(privateBusiness) });
});

router.get('/business/me', async (req, res) => {
  const t = req.query.token; if (!t) return res.status(401).json({ error: 'Not logged in' });
  const list = await Rec.find({ kind: 'business', token: t });
  res.json(list.map(privateBusiness));
});

// Email + password login.
const escapeRegex = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
router.post('/business/login/password', async (req, res) => {
  const email = String(req.body.email || '').trim();
  const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const list = await Rec.find({ kind: 'business', email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' } });
  if (!list.length) return res.status(404).json({ error: 'No business found for that email' });
  const acct = list.find(b => verifyPassword(password, b.passHash));
  if (!acct) return res.status(401).json({ error: 'Incorrect password' });
  const token = genToken();
  for (const b of list) { b.token = token; await b.save(); }
  res.json({ token, email, businesses: list.map(privateBusiness) });
});

// Delete own business account(s) (+ links, reviews, commission requests).
router.delete('/business/me', async (req, res) => {
  const mine = await businessesByToken(req);
  if (!mine.length) return res.status(401).json({ error: 'Not logged in' });
  const ids = mine.map(b => String(b._id));
  await Rec.deleteMany({ kind: { $in: ['link', 'review', 'commreq'] }, businessId: { $in: ids } });
  for (const b of mine) await Rec.deleteOne({ kind: 'business', _id: b._id });
  notifyAdmin(`🗑️ Business "${mine[0].name}" deleted their account.`);
  res.json({ ok: true });
});

router.patch('/business/me/:id', async (req, res) => {
  const t = tokenFrom(req); if (!t) return res.status(401).json({ error: 'Not logged in' });
  const b = await Rec.findOne({ kind: 'business', _id: req.params.id, token: t });
  if (!b) return res.status(403).json({ error: 'Not your listing' });
  const allow = ['name', 'blurb', 'categories', 'city', 'online', 'website', 'photos', 'discount', 'commissionType', 'commissionPct', 'commissionFlat', 'products'];
  for (const k of allow) if (k in req.body) b[k] = req.body[k];
  if (Array.isArray(b.products)) b.products = b.products.slice(0, 50).map(p => ({ name: String((p && p.name) || '').slice(0, 120), url: String((p && p.url) || '').slice(0, 400), note: String((p && p.note) || '').slice(0, 280) })).filter(p => p.name.trim());
  if (Array.isArray(b.categories)) b.categories = b.categories.filter(c => CATEGORIES.includes(c));
  await b.save();
  res.json(privateBusiness(b));
});

// Public: approved businesses (+ backer preview), commission stripped, 1 photo for the card.
router.get('/businesses', async (req, res) => {
  const q = { kind: 'business', status: 'approved' };
  if (req.query.category) q.categories = req.query.category;
  const rows = (await Rec.find(q).sort({ createdAt: -1 })).filter(b => b.name && String(b.name).trim());
  const bk = await backersFor(rows.map(r => r._id));
  res.json(rows.map(b => {
    const list = bk[String(b._id)] || [];
    return { ...publicBusiness(b), photos: (b.photos || []).slice(0, 1), backers: list.slice(0, 4), backerCount: list.length };
  }));
});

// Creators-only: the reward for a business. Requires a registered username.
router.get('/business/:id/reward', async (req, res) => {
  const handle = slugify(req.query.username || '');
  const inf = handle && await Rec.findOne({ kind: 'influencer', username: handle });
  if (!inf) return res.status(403).json({ error: 'Creators only — join as a creator first.' });
  let b;
  try { b = await Rec.findOne({ kind: 'business', _id: req.params.id, status: 'approved' }); }
  catch (e) { return res.status(400).json({ error: 'bad id' }); }
  if (!b) return res.status(404).json({ error: 'not found' });
  res.json({ earns: commissionLabel(b), commissionType: b.commissionType, commissionPct: b.commissionPct, commissionFlat: b.commissionFlat });
});

// Public: one business with its reviews + backers.
router.get('/business/:id', async (req, res) => {
  let b;
  try { b = await Rec.findOne({ kind: 'business', _id: req.params.id, status: 'approved' }); }
  catch (e) { return res.status(400).json({ error: 'bad id' }); }
  if (!b) return res.status(404).json({ error: 'not found' });
  const links = await Rec.find({ kind: 'link', businessId: b._id });
  const reviews = await Rec.find({ kind: 'review', businessId: b._id });
  const handles = [...new Set([...links.map(l => l.influencer), ...reviews.map(r => r.influencer)])];
  const infs = await Rec.find({ kind: 'influencer', username: { $in: handles } });
  const imap = Object.fromEntries(infs.map(i => [i.username, i.image || '']));
  res.json({
    ...publicBusiness(b),
    backers: [...new Set(links.map(l => l.influencer))].map(h => ({ username: h, image: imap[h] || '' })),
    reviews: reviews.map(r => ({ handle: r.influencer, stars: r.stars, text: r.text, image: imap[r.influencer] || '' })),
  });
});

router.get('/categories', (_req, res) => res.json(CATEGORIES));

/* ════════════════════════════ Admin ══════════════════════════════════════ */
router.get('/admin/businesses', requireAdmin, async (_req, res) => {
  const list = await Rec.find({ kind: 'business' }).sort({ createdAt: -1 });
  res.json(list.map(b => { const o = b.toObject(); delete o.token; delete o.passHash; return o; }));
});
router.post('/admin/business/:id/approve', requireAdmin, async (req, res) => {
  const biz = await Rec.findOneAndUpdate({ _id: req.params.id, kind: 'business' }, { status: 'approved', approvedAt: new Date() }, { new: true });
  if (!biz) return res.status(404).json({ error: 'not found' });
  textUser(biz.phone, `🎉 ${biz.name} is now live on www.easyrecommend.co under ${biz.categories.join(', ')}.`);
  res.json({ ok: true });
});
router.post('/admin/business/:id/reject', requireAdmin, async (req, res) => {
  await Rec.findOneAndUpdate({ _id: req.params.id, kind: 'business' }, { status: 'rejected' });
  res.json({ ok: true });
});
router.patch('/admin/business/:id', requireAdmin, async (req, res) => {
  const allow = ['name', 'categories', 'city', 'online', 'website', 'phone', 'email', 'commissionType', 'commissionPct', 'commissionFlat', 'discount', 'blurb', 'photos', 'status', 'hidePhone', 'hideEmail', 'hideWebsite'];
  const patch = {};
  for (const k of allow) if (k in req.body) patch[k] = req.body[k];
  if (Array.isArray(patch.categories)) patch.categories = patch.categories.filter(c => CATEGORIES.includes(c));
  const b = await Rec.findOneAndUpdate({ _id: req.params.id, kind: 'business' }, patch, { new: true });
  res.json(b ? privateBusiness(b) : null);
});
// Admin: turn a business's paid access on/off manually.
router.post('/admin/business/:id/set-paid', requireAdmin, async (req, res) => {
  const paid = !!(req.body && req.body.paid);
  const plan = String((req.body && req.body.plan) || '') || 'starter';
  const patch = paid
    ? { paid: true, plan, premium: plan === 'premium', paidAt: new Date(), chargeId: 'admin_grant' }
    : { paid: false, plan: '', premium: false };
  const b = await Rec.findOneAndUpdate({ _id: req.params.id, kind: 'business' }, patch, { new: true });
  if (!b) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true, paid: b.paid, plan: b.plan, premium: b.premium });
});
// Delete a business + any links/reviews that point at it.
router.delete('/admin/business/:id', requireAdmin, async (req, res) => {
  await Rec.deleteOne({ _id: req.params.id, kind: 'business' });
  await Rec.deleteMany({ kind: { $in: ['link', 'review'] }, businessId: req.params.id });
  res.json({ ok: true });
});

// Influencers — list + delete (removes their links/reviews too).
router.get('/admin/influencers', requireAdmin, async (_req, res) => {
  const infs = await Rec.find({ kind: 'influencer' }).sort({ createdAt: -1 });
  const out = [];
  for (const i of infs) {
    const count = await Rec.countDocuments({ kind: 'link', influencer: i.username });
    out.push({
      id: i._id, username: i.username, image: i.image || '', bio: i.bio || '', count,
      followers: i.followers || 0, followersLabel: fmtFollowers(i.followers || 0),
      featured: !!i.featured,
    });
  }
  res.json(out);
});
// Admin: mark a creator as featured (shown to businesses for hire).
router.post('/admin/influencer/:username/featured', requireAdmin, async (req, res) => {
  const handle = slugify(req.params.username);
  const featured = !!(req.body && req.body.featured);
  const inf = await Rec.findOneAndUpdate(
    { kind: 'influencer', username: handle },
    { $set: { featured } },
    { new: true }
  );
  if (!inf) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true, username: handle, featured: !!inf.featured });
});

router.delete('/admin/influencer/:username', requireAdmin, async (req, res) => {
  const handle = slugify(req.params.username);
  await Rec.deleteOne({ kind: 'influencer', username: handle });
  await Rec.deleteMany({ kind: { $in: ['link', 'review'] }, influencer: handle });
  res.json({ ok: true });
});

// Admin: send a bulk SMS to a pasted list and/or to every business on file.
router.post('/admin/bulk-sms', requireAdmin, async (req, res) => {
  const message = String((req.body && req.body.message) || '').trim();
  if (!message) return res.status(400).json({ error: 'Message is required' });
  let nums = [];
  const raw = (req.body && req.body.numbers) || '';
  if (Array.isArray(raw)) nums = raw.slice();
  else if (typeof raw === 'string') nums = raw.split(/[\s,;]+/);
  const audience = String((req.body && req.body.audience) || '');
  if (['approved', 'pending', 'all', 'businesses', 'paid', 'free'].includes(audience)) {
    const q = { kind: 'business' };
    if (audience === 'approved') q.status = 'approved';
    else if (audience === 'pending') q.status = 'pending';
    else if (audience === 'paid') q.paid = true;
    else if (audience === 'free') q.paid = { $ne: true };
    const bs = await Rec.find(q);
    nums = nums.concat(bs.map(b => b.phone).filter(Boolean));
  }
  const seen = new Set(); const final = [];
  for (const n of nums.map(x => String(x || '').trim())) { const k = n.replace(/\D/g, ''); if (k.length >= 7 && !seen.has(k)) { seen.add(k); final.push(n); } }
  let recipients = final;
  if (req.body && req.body.richOnly) recipients = final.filter(isRichNumber);
  if (!recipients.length) return res.status(400).json({ error: 'No valid recipients' });
  let sent = 0;
  for (let i = 0; i < recipients.length; i += 50) {
    const batch = recipients.slice(i, i + 50).map(phoneNumber => ({ message, phoneNumber }));
    try { await sendSMS(batch); sent += batch.length; } catch (e) { /* keep going */ }
  }
  res.json({ sent, recipients: recipients.length, skipped: final.length - recipients.length });
});

/* ════════════════════════════ Influencer ═════════════════════════════════ */
function fmtFollowers(n) {
  n = Number(n) || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return Math.round(n / 1e3) + 'k';
  return String(n);
}
// Normalize the creator's per-platform channels: [{platform, handle, followers}]
function cleanChannels(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(c => ({
      platform: String((c && c.platform) || '').slice(0, 40),
      handle: String((c && c.handle) || '').replace(/^@/, '').slice(0, 80),
      followers: Math.max(0, Math.round(Number(c && c.followers) || 0)),
    }))
    .filter(c => c.platform && c.handle)
    .slice(0, 8);
}
// Per-content rate card: what the creator charges for each content type.
function cleanRates(raw) {
  const r = raw || {};
  const one = v => Math.max(0, Math.round(Number(v) || 0));
  return { post: one(r.post), story: one(r.story), reel: one(r.reel) };
}
const totalFollowers = chans => (chans || []).reduce((n, c) => n + (Number(c.followers) || 0), 0);

router.post('/influencer', async (req, res) => {
  const { username, image, bio, followers, platform, social, channels, rates } = req.body;
  const handle = slugify(username);
  if (!handle) return res.status(400).json({ error: 'username required' });
  const chans = cleanChannels(channels);
  const rate = cleanRates(rates);
  // followers = sum of channels when provided, else the single legacy value
  const fol = chans.length ? totalFollowers(chans) : Math.max(0, Math.round(Number(followers) || 0));
  const plat = chans.length ? chans[0].platform : String(platform || '').slice(0, 40);
  const soc = chans.length ? chans[0].handle : String(social || '').slice(0, 80);
  const token = genToken();
  const exists = await Rec.findOne({ kind: 'influencer', username: handle });
  if (exists) {
    exists.token = token;
    if (chans.length) { exists.channels = chans; exists.followers = fol; exists.platform = plat; exists.social = soc; }
    else if (fol) exists.followers = fol;
    if (rates) exists.rates = rate;
    await exists.save();
    return res.status(200).json({ username: handle, token, existing: true, profileUrl: `${PUBLIC_BASE}/@${handle}` });
  }
  await Rec.create({ kind: 'influencer', username: handle, image: image || '', bio: bio || '', followers: fol, platform: plat, social: soc, channels: chans, rates: rate, token });
  res.json({ username: handle, token, profileUrl: `${PUBLIC_BASE}/@${handle}` });
});

// Creator login: username → token (no invite code required)
router.post('/creator/login', async (req, res) => {
  const { username } = req.body;
  const handle = slugify(username);
  const inf = await Rec.findOne({ kind: 'influencer', username: handle });
  if (!inf) return res.status(404).json({ error: 'No creator with that username' });
  inf.token = genToken(); await inf.save();
  res.json({ username: handle, token: inf.token, image: inf.image, bio: inf.bio, followers: inf.followers || 0, channels: inf.channels || [], rates: inf.rates || {}, profileUrl: `${PUBLIC_BASE}/@${handle}` });
});

// Update own profile (photo / bio / channels / rates)
router.patch('/creator/me', async (req, res) => {
  const inf = await creatorByToken(req);
  if (!inf) return res.status(401).json({ error: 'Not logged in' });
  if ('image' in req.body) inf.image = req.body.image || '';
  if ('bio' in req.body) inf.bio = req.body.bio || '';
  if ('channels' in req.body) {
    const chans = cleanChannels(req.body.channels);
    inf.channels = chans;
    inf.followers = totalFollowers(chans);
    if (chans.length) { inf.platform = chans[0].platform; inf.social = chans[0].handle; }
  } else if ('followers' in req.body) {
    inf.followers = Math.max(0, Math.round(Number(req.body.followers) || 0));
  }
  if ('rates' in req.body) inf.rates = cleanRates(req.body.rates);
  await inf.save();
  res.json({ username: inf.username, image: inf.image, bio: inf.bio, followers: inf.followers || 0, channels: inf.channels || [], rates: inf.rates || {} });
});

// Delete own creator account (+ links, reviews, commission requests).
router.delete('/creator/me', async (req, res) => {
  const inf = await creatorByToken(req);
  if (!inf) return res.status(401).json({ error: 'Not logged in' });
  await Rec.deleteMany({ kind: { $in: ['link', 'review', 'commreq'] }, influencer: inf.username });
  await Rec.deleteOne({ kind: 'influencer', _id: inf._id });
  notifyAdmin(`🗑️ Creator @${inf.username} deleted their account.`);
  res.json({ ok: true });
});

// Add a brand to back (+ optional review)
router.post('/creator/link', async (req, res) => {
  const inf = await creatorByToken(req);
  if (!inf) return res.status(401).json({ error: 'Not logged in' });
  const { businessId, stars, text } = req.body;
  const biz = await Rec.findOne({ kind: 'business', _id: businessId, status: 'approved' });
  if (!biz) return res.status(404).json({ error: 'business not found' });
  const handle = inf.username, sg = slugify(biz.name);
  if (!await Rec.findOne({ kind: 'link', influencer: handle, businessId })) await Rec.create({ kind: 'link', influencer: handle, businessId, slug: sg });
  if (stars) await Rec.findOneAndUpdate({ kind: 'review', influencer: handle, businessId }, { kind: 'review', influencer: handle, businessId, stars: Number(stars), text: text || '' }, { upsert: true });
  // Log an "added to recommendation list" approval request for the brand + text them.
  const fol = inf.followers ? ` (${fmtFollowers(inf.followers)} followers)` : '';
  if (!await Rec.findOne({ kind: 'commreq', influencer: handle, businessId, reqType: 'list' })) {
    await Rec.create({ kind: 'commreq', influencer: handle, businessId, reqType: 'list', requested: '', note: '', status: 'pending' });
    textUser(biz.phone, `Influencer @${handle}${fol} wants to add ${biz.name} to their recommendation list. Approve or reject it on www.easyrecommend.co`);
  }
  res.json({ referralUrl: `${PUBLIC_BASE}/r/${handle}/${sg}`, profileUrl: `${PUBLIC_BASE}/@${handle}`, earns: commissionLabel(biz), commissionType: biz.commissionType, commissionPct: biz.commissionPct, commissionFlat: biz.commissionFlat });
});

// Remove a backed brand (deletes the link + its review)
router.delete('/creator/link', async (req, res) => {
  const inf = await creatorByToken(req);
  if (!inf) return res.status(401).json({ error: 'Not logged in' });
  const { businessId } = req.body;
  await Rec.deleteOne({ kind: 'link', influencer: inf.username, businessId });
  await Rec.deleteOne({ kind: 'review', influencer: inf.username, businessId });
  res.json({ ok: true });
});

router.post('/link', async (req, res) => {
  const { username, businessId, stars, text } = req.body;
  const handle = slugify(username);
  const inf = await Rec.findOne({ kind: 'influencer', username: handle });
  const biz = await Rec.findOne({ kind: 'business', _id: businessId, status: 'approved' });
  if (!inf) return res.status(404).json({ error: 'creator not found' });
  if (!biz) return res.status(404).json({ error: 'business not found' });
  const sg = slugify(biz.name);
  let link = await Rec.findOne({ kind: 'link', influencer: handle, businessId });
  if (!link) link = await Rec.create({ kind: 'link', influencer: handle, businessId, slug: sg });
  if (stars) {
    await Rec.findOneAndUpdate({ kind: 'review', influencer: handle, businessId },
      { kind: 'review', influencer: handle, businessId, stars: Number(stars), text: text || '' }, { upsert: true });
  }
  notifyAdmin(`🔗 @${handle} generated a link for ${biz.name}${stars ? ` (${stars}★ review)` : ''}.`);
  res.json({
    referralUrl: `${PUBLIC_BASE}/r/${handle}/${sg}`,
    profileUrl: `${PUBLIC_BASE}/@${handle}`,
    commissionType: biz.commissionType, commissionPct: biz.commissionPct, commissionFlat: biz.commissionFlat,
    earns: commissionLabel(biz),
  });
});

router.post('/track', async (req, res) => {
  const { username, businessId, type } = req.body;
  const handle = slugify(username);
  const field = type === 'sale' ? 'sales' : 'clicks';
  const link = await Rec.findOneAndUpdate({ kind: 'link', influencer: handle, businessId }, { $inc: { [field]: 1 } }, { new: true });
  if (type === 'sale') {
    const biz = await Rec.findById(businessId);
    notifyAdmin(`💰 Sale via @${handle}${biz ? ` for ${biz.name} (pays ${commissionLabel(biz)})` : ''}. Total: ${link?.sales || 1}.`);
  }
  res.json({ ok: true });
});

/* ════════════════════════════ Demo requests ══════════════════════════════ */
router.post('/demo', async (req, res) => {
  const name = String((req.body && req.body.name) || '').trim();
  const email = String((req.body && req.body.email) || '').trim();
  const source = String((req.body && req.body.source) || '').trim();
  if (!name || !email) return res.status(400).json({ error: 'name and email required' });
  notifyAdmin(`📅 Demo request${source ? ` (${source})` : ''} — ${name} · ${email}`);
  res.json({ ok: true });
});

/* ════════════════════════════ AI review draft ════════════════════════════ */
// Generates a short, authentic first-person review draft for a creator to edit.
// Requires OPENAI_API_KEY (preferred) or ANTHROPIC_API_KEY in the environment.
router.post('/review/generate', async (req, res) => {
  const me = await creatorByToken(req);
  if (!me) return res.status(403).json({ error: 'Creators only' });
  const name = String((req.body && req.body.businessName) || '').trim();
  const stars = Math.min(5, Math.max(1, Number((req.body && req.body.stars)) || 5));
  if (!name) return res.status(400).json({ error: 'businessName required' });

  const tone = stars >= 5 ? 'genuinely enthusiastic' : stars >= 4 ? 'warm and positive' : stars >= 3 ? 'balanced and fair' : 'honest with a gentle caveat';
  const prompt = `Write a short, authentic first-person customer review of "${name}". One to two sentences, under 200 characters. Tone: ${tone}. Sound like a real person casually recommending it to a friend. No hashtags, no emojis, no surrounding quotes, no brand name repeated awkwardly.`;

  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    let text = '';

    if (openaiKey) {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 120, temperature: 0.85, messages: [{ role: 'user', content: prompt }] }),
      });
      const d = await r.json();
      if (!r.ok) return res.status(502).json({ error: (d && d.error && d.error.message) || 'AI request failed' });
      text = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
    } else if (anthropicKey) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 150, messages: [{ role: 'user', content: prompt }] }),
      });
      const d = await r.json();
      if (!r.ok) return res.status(502).json({ error: (d && d.error && d.error.message) || 'AI request failed' });
      text = d && d.content && d.content[0] && d.content[0].text;
    } else {
      return res.status(503).json({ error: 'AI is not configured yet.' });
    }

    text = String(text || '').trim().replace(/^["']|["']$/g, '');
    if (!text) return res.status(502).json({ error: 'No draft returned' });
    res.json({ text });
  } catch (e) {
    res.status(502).json({ error: 'AI request failed' });
  }
});

/* ════════════════════════════ Commission requests ════════════════════════ */
const businessesByToken = async (req) => {
  const t = tokenFrom(req); if (!t) return [];
  return Rec.find({ kind: 'business', token: t });
};

// Influencer requests a higher commission (free text) for a brand they back.
router.post('/creator/commission-request', async (req, res) => {
  const me = await creatorByToken(req);
  if (!me) return res.status(403).json({ error: 'Creators only' });
  const businessId = req.body && req.body.businessId;
  const reqType = ['list', 'story', 'tweet', 'reel', 'post'].includes(req.body && req.body.reqType) ? req.body.reqType : 'list';
  const pricing = ['commission', 'fixed'].includes(req.body && req.body.pricing) ? req.body.pricing : 'commission';
  const amount = Math.max(0, Number(req.body && req.body.amount) || 0);
  const note = String((req.body && req.body.note) || '').trim();
  const needsPrice = reqType !== 'list';
  if (!businessId) return res.status(400).json({ error: 'businessId is required' });
  if (needsPrice && amount <= 0) return res.status(400).json({ error: 'A value is required' });
  const requested = needsPrice ? (pricing === 'commission' ? `${amount}%` : `$${amount}`) : '';
  const biz = await Rec.findOne({ kind: 'business', _id: businessId }).catch(() => null);
  if (!biz) return res.status(404).json({ error: 'business not found' });
  let doc = await Rec.findOne({ kind: 'commreq', influencer: me.username, businessId, reqType });
  if (doc) {
    doc.reqType = reqType; doc.pricing = pricing; doc.amount = amount; doc.requested = requested; doc.note = note;
    doc.status = 'pending'; doc.brandMessage = ''; doc.decidedAt = null; doc.createdAt = new Date(); await doc.save();
  } else {
    doc = await Rec.create({ kind: 'commreq', influencer: me.username, businessId, reqType, pricing, amount, requested, note, status: 'pending' });
  }
  const fol = me.followers ? ` (${fmtFollowers(me.followers)} followers)` : '';
  const actionWord = { story: 'a story', tweet: 'a tweet', reel: 'a reel', post: 'a post' }[reqType];
  const priceWord = pricing === 'commission' ? `${amount}% commission` : `a flat $${amount}`;
  const msg = reqType === 'list'
    ? `Influencer @${me.username}${fol} wants to add ${biz.name} to their recommendation list.`
    : `Influencer @${me.username}${fol} offers to post ${actionWord} for ${biz.name} at ${priceWord}.`;
  textUser(biz.phone, `${msg} Approve or reject it on www.easyrecommend.co`);
  res.json({ id: doc._id, status: doc.status, requested: doc.requested, reqType: doc.reqType, pricing: doc.pricing });
});

// Influencer: cancel one of my requests.
router.delete('/creator/request/:id', async (req, res) => {
  const me = await creatorByToken(req);
  if (!me) return res.status(403).json({ error: 'Creators only' });
  const r = await Rec.findOne({ kind: 'commreq', _id: req.params.id, influencer: me.username }).catch(() => null);
  if (!r) return res.status(404).json({ error: 'not found' });
  await Rec.deleteOne({ _id: r._id });
  res.json({ ok: true });
});

// Influencer: my requests + their statuses (how the brand responded).
router.get('/creator/requests', async (req, res) => {
  const me = await creatorByToken(req);
  if (!me) return res.status(403).json({ error: 'Creators only' });
  const reqs = await Rec.find({ kind: 'commreq', influencer: me.username }).sort({ createdAt: -1 });
  const bids = [...new Set(reqs.map(r => String(r.businessId)))];
  const bs = await Rec.find({ kind: 'business', _id: { $in: bids } });
  const nameById = {}; bs.forEach(b => { nameById[String(b._id)] = b.name; });
  res.json(reqs.map(r => ({ id: r._id, businessId: r.businessId, businessName: nameById[String(r.businessId)] || '', reqType: r.reqType || 'list', pricing: r.pricing || 'commission', amount: r.amount || 0, requested: r.requested, note: r.note || '', status: r.status, brandMessage: r.brandMessage || '', createdAt: r.createdAt })));
});

// Brand: influencers who added (back) my businesses. Gated — requires a paid plan.
router.get('/business/me/influencers', async (req, res) => {
  const mine = await businessesByToken(req);
  if (!mine.length) return res.json([]);
  if (!mine.some(b => b.paid)) return res.status(402).json({ error: 'Payment required', locked: true });
  const ids = mine.map(b => b._id);
  const nameById = {}; mine.forEach(b => { nameById[String(b._id)] = b.name; });
  const links = await Rec.find({ kind: 'link', businessId: { $in: ids } }).sort({ createdAt: -1 });
  const handles = [...new Set(links.map(l => l.influencer))];
  const infs = await Rec.find({ kind: 'influencer', username: { $in: handles } });
  const imap = {}; infs.forEach(i => { imap[i.username] = i; });
  res.json(links.map(l => { const inf = imap[l.influencer] || {}; return {
    influencer: l.influencer, image: inf.image || '', followers: inf.followers || 0, followersLabel: fmtFollowers(inf.followers || 0),
    businessId: l.businessId, businessName: nameById[String(l.businessId)] || '',
    clicks: l.clicks || 0, sales: l.sales || 0, profileUrl: `${PUBLIC_BASE}/@${l.influencer}`,
  }; }));
});

// Ping admin when a business opens the payment box (someone is starting to pay).
router.post('/business/pay-start', async (req, res) => {
  const mine = await businessesByToken(req);
  const name = (mine[0] && mine[0].name) || String((req.body && req.body.name) || 'A business');
  const plan = String((req.body && req.body.plan) || '');
  const amount = Number(req.body && req.body.amount) || 0;
  notifyPay(`✍️ ${name} is entering payment for ${plan || 'a plan'}${amount ? ` ($${amount})` : ''} on www.easyrecommend.co`);
  res.json({ ok: true });
});

// Record a successful one-time payment (Stripe charge already captured via /partyevents/paycharge).
router.post('/business/pay', async (req, res) => {
  const mine = await businessesByToken(req);
  if (!mine.length) return res.status(403).json({ error: 'Not logged in' });
  const plan = String((req.body && req.body.plan) || '');
  const amount = Number(req.body && req.body.amount) || 0;
  const chargeId = String((req.body && req.body.chargeId) || '');
  const premium = plan === 'premium' || amount >= 899;
  for (const b of mine) { b.paid = true; b.plan = plan; b.premium = premium; b.paidAt = new Date(); b.chargeId = chargeId; await b.save(); }
  notifyPay(`💳 PAYMENT CONFIRMED — ${mine[0].name} purchased ${plan || 'a plan'} ($${amount})${premium ? ' [PREMIUM]' : ''}. charge ${chargeId || '-'}`);
  res.json({ paid: true, plan, premium });
});

// Brand: commission requests on my businesses. Gated — requires a paid plan.
// Count of pending requests — NOT gated on paid, so the paywall can tease it.
// ---- Global site settings (single doc) ----
// NOTE: the schema is strict:false, so assigning a brand-new path on a loaded doc
// isn't tracked by Mongoose and save() would silently write nothing. Always use $set.
async function getSettings() {
  let s = await Rec.findOne({ kind: 'settings' });
  if (!s) s = await Rec.create({ kind: 'settings', hireEnabled: false });
  return s;
}
// Public: which optional features are switched on.
router.get('/settings', async (_req, res) => {
  const s = await getSettings();
  res.json({ hireEnabled: !!s.hireEnabled });
});
// Admin: flip a feature on/off.
router.post('/admin/settings', requireAdmin, async (req, res) => {
  const body = req.body || {};
  const $set = {};
  if ('hireEnabled' in body) $set.hireEnabled = !!body.hireEnabled;
  if (!Object.keys($set).length) return res.status(400).json({ error: 'Nothing to update' });
  const s = await Rec.findOneAndUpdate(
    { kind: 'settings' },
    { $set, $setOnInsert: { kind: 'settings' } },
    { new: true, upsert: true }
  );
  res.json({ hireEnabled: !!s.hireEnabled });
});

// Businesses (paid): browse admin-approved creators available to hire.
router.get('/business/me/creators', async (req, res) => {
  const mine = await businessesByToken(req);
  if (!mine.length) return res.status(401).json({ error: 'Not logged in' });
  const st = await getSettings();
  if (!st.hireEnabled) return res.json([]);
  const infs = await Rec.find({ kind: 'influencer', featured: true }).sort({ followers: -1 }).limit(60);
  const ids = mine.map(b => String(b._id));
  const hires = await Rec.find({ kind: 'hire', businessId: { $in: ids } });
  res.json(infs.map(i => {
    const mine_ = hires.filter(h => h.influencer === i.username);
    return {
      username: i.username, image: i.image || '', bio: i.bio || '',
      followers: i.followers || 0, followersLabel: fmtFollowers(i.followers || 0),
      channels: (i.channels || []).map(c => ({ platform: c.platform, handle: c.handle, followers: c.followers || 0, followersLabel: fmtFollowers(c.followers || 0) })),
      rates: i.rates || { post: 0, story: 0, reel: 0 },
      profileUrl: `${PUBLIC_BASE}/@${i.username}`,
      hires: mine_.map(h => ({ id: h._id, contentType: h.contentType, price: h.price, status: h.status, createdAt: h.createdAt })),
    };
  }));
});

// Businesses (paid): hire a creator for a piece of content.
router.post('/business/hire', async (req, res) => {
  const mine = await businessesByToken(req);
  if (!mine.length) return res.status(401).json({ error: 'Not logged in' });
  const st = await getSettings();
  if (!st.hireEnabled) return res.status(403).json({ error: 'Hiring is not available yet' });
  const biz = mine.find(b => b.paid) || mine[0];
  const username = slugify((req.body && req.body.username) || '');
  const contentType = ['post', 'story', 'reel'].includes(req.body && req.body.contentType) ? req.body.contentType : 'post';
  const price = Math.max(0, Math.round(Number(req.body && req.body.price) || 0));
  const note = String((req.body && req.body.note) || '').trim();
  const inf = username && await Rec.findOne({ kind: 'influencer', username });
  if (!inf) return res.status(404).json({ error: 'creator not found' });
  const chargeId = String((req.body && req.body.chargeId) || '').trim();
  if (!price) return res.status(400).json({ error: 'A price is required' });
  if (!chargeId) return res.status(402).json({ error: 'Payment is required to book a creator' });
  const doc = await Rec.create({
    kind: 'hire', businessId: String(biz._id), influencer: username,
    contentType, price, note, chargeId, paid: true, paidAt: new Date(), status: 'booked',
  });
  notifyPay(`🤝 HIRE PAID $${price}: ${biz.name} booked @${username} (${fmtFollowers(inf.followers || 0)} followers) for a ${contentType}${note ? ` - "${note}"` : ''}. charge ${chargeId}`);
  res.json({ id: doc._id, status: doc.status, contentType, price });
});

router.get('/business/me/requests-count', async (req, res) => {
  const mine = await businessesByToken(req);
  if (!mine.length) return res.status(401).json({ error: 'Not logged in' });
  const ids = mine.map(b => String(b._id));
  const pending = await Rec.countDocuments({ kind: 'commreq', businessId: { $in: ids }, status: 'pending' });
  res.json({ pending });
});
router.get('/business/me/requests', async (req, res) => {
  const mine = await businessesByToken(req);
  if (!mine.length) return res.json([]);
  if (!mine.some(b => b.paid)) return res.status(402).json({ error: 'Payment required', locked: true });
  const ids = mine.map(b => b._id);
  const nameById = {}; mine.forEach(b => { nameById[String(b._id)] = b.name; });
  const reqs = await Rec.find({ kind: 'commreq', businessId: { $in: ids } }).sort({ createdAt: -1 });
  const handles = [...new Set(reqs.map(r => r.influencer))];
  const infs = await Rec.find({ kind: 'influencer', username: { $in: handles } });
  const imap = {}; infs.forEach(i => { imap[i.username] = i; });
  res.json(reqs.map(r => { const inf = imap[r.influencer] || {}; return {
    id: r._id, influencer: r.influencer, image: inf.image || '', followers: inf.followers || 0, followersLabel: fmtFollowers(inf.followers || 0),
    businessId: r.businessId, businessName: nameById[String(r.businessId)] || '',
    reqType: r.reqType || 'list', pricing: r.pricing || 'commission', amount: r.amount || 0, requested: r.requested, note: r.note || '', status: r.status, brandMessage: r.brandMessage || '', createdAt: r.createdAt,
  }; }));
});

// Brand: approve / reject a request with an optional message back to the creator.
router.patch('/business/request/:id', async (req, res) => {
  const mine = await businessesByToken(req);
  if (!mine.length) return res.status(403).json({ error: 'Not logged in' });
  const ids = new Set(mine.map(b => String(b._id)));
  const r = await Rec.findOne({ kind: 'commreq', _id: req.params.id }).catch(() => null);
  if (!r || !ids.has(String(r.businessId))) return res.status(404).json({ error: 'request not found' });
  const status = req.body && req.body.status;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'status must be approved or rejected' });
  r.status = status; r.brandMessage = String((req.body && req.body.message) || '').trim(); r.decidedAt = new Date();
  await r.save();
  const biz = mine.find(b => String(b._id) === String(r.businessId));
  const bn = (biz && biz.name) || 'A business';
  const rt = r.reqType === 'list' ? 'recommendation-list' : r.reqType === 'flat' ? 'flat-price promo' : 'commission';
  const val = r.requested ? ` (${r.requested})` : '';
  notifyPay(`${status === 'approved' ? '✅' : '❌'} ${bn} ${status} @${r.influencer}'s ${rt} request${val}${r.brandMessage ? ` — "${r.brandMessage}"` : ''}.`);
  res.json({ id: r._id, status: r.status, brandMessage: r.brandMessage });
});

/* ════════════════════════════ Creators ═══════════════════════════════════ */
router.get('/creators', async (_req, res) => {
  const infs = await Rec.find({ kind: 'influencer' }).sort({ createdAt: -1 });
  const links = await Rec.find({ kind: 'link' });
  const counts = {};
  for (const l of links) counts[l.influencer] = (counts[l.influencer] || 0) + 1;
  res.json(infs.map(i => ({ username: i.username, image: i.image, bio: i.bio, count: counts[i.username] || 0, followers: i.followers || 0, followersLabel: fmtFollowers(i.followers || 0), featured: !!i.featured })));
});

router.get('/creator/:username', async (req, res) => {
  const handle = slugify(req.params.username);
  const inf = await Rec.findOne({ kind: 'influencer', username: handle });
  if (!inf) return res.status(404).json({ error: 'creator not found' });
  const links = await Rec.find({ kind: 'link', influencer: handle });
  const ids = links.map(l => l.businessId);
  const bizRows = await Rec.find({ kind: 'business', _id: { $in: ids }, status: 'approved' });
  const reviews = await Rec.find({ kind: 'review', influencer: handle });
  const reviewFor = id => reviews.find(r => String(r.businessId) === String(id));
  const listReqs = await Rec.find({ kind: 'commreq', influencer: handle, reqType: 'list' });
  const approvedIds = new Set(listReqs.filter(r => r.status === 'approved').map(r => String(r.businessId)));
  const isOwner = !!tokenFrom(req) && tokenFrom(req) === inf.token;
  let recs = bizRows.map(b => ({
    ...publicBusiness(b),
    listApproved: approvedIds.has(String(b._id)),
    review: reviewFor(b._id) ? { stars: reviewFor(b._id).stars, text: reviewFor(b._id).text } : null,
    referralUrl: `${PUBLIC_BASE}/r/${handle}/${slugify(b.name)}`,
  }));
  if (!isOwner) recs = recs.filter(r => r.listApproved);   // public only sees brand-approved items
  res.json({
    username: inf.username, image: inf.image, bio: inf.bio, followers: inf.followers || 0, followersLabel: fmtFollowers(inf.followers || 0), platform: inf.platform || '', social: inf.social || '',
    channels: (inf.channels || []).map(c => ({ platform: c.platform, handle: c.handle, followers: c.followers || 0, followersLabel: fmtFollowers(c.followers || 0) })),
    rates: inf.rates || { post: 0, story: 0, reel: 0 },
    recommendations: recs,
  });
});

/* ════════════════════════════ Demo seed (admin) ══════════════════════════ */
// POST /easyrecommend/admin/seed  (x-admin-key)
// Additive + safe to re-run: inserts any missing demo brands without touching
// existing rows (uses $setOnInsert, matched by name / username).
router.post('/admin/seed', requireAdmin, async (_req, res) => {
  const before = await Rec.countDocuments({ kind: 'business' });

  // [name, [categories], city, online, type, pct, flat, discount, blurb, website]
  const DEFS = [
    // Beauty
    ['Glossier', ['Beauty'], 'New York', true, 'flat', 0, 12, 10, 'Skin-first makeup and the cult Balm Dotcom.', 'glossier.com'],
    ['The Ordinary', ['Beauty'], 'Online', true, 'percent', 10, 0, 0, 'No-nonsense actives at honest prices.', 'theordinary.com'],
    ['Fenty Beauty', ['Beauty'], 'Online', true, 'percent', 8, 0, 0, 'Shade-inclusive makeup for everyone.', 'fentybeauty.com'],
    ['Drunk Elephant', ['Beauty'], 'Online', true, 'flat', 0, 15, 10, 'Clean, biocompatible skincare.', 'drunkelephant.com'],
    // Legal
    ['LegalZoom', ['Legal'], 'Online', true, 'flat', 0, 40, 0, 'Business formation and legal docs, online.', 'legalzoom.com'],
    ['Rocket Lawyer', ['Legal'], 'Online', true, 'flat', 0, 30, 0, 'On-call lawyers and easy legal documents.', 'rocketlawyer.com'],
    ['Trust & Will', ['Legal'], 'Online', true, 'flat', 0, 25, 10, 'Estate planning and wills, done online.', 'trustandwill.com'],
    ['Hello Divorce', ['Legal'], 'Online', true, 'flat', 0, 50, 0, 'Flat-fee, low-conflict divorce support.', 'hellodivorce.com'],
    // Education
    ['Coursera', ['Education'], 'Online', true, 'percent', 20, 0, 0, 'University courses and certificates online.', 'coursera.org'],
    ['MasterClass', ['Education'], 'Online', true, 'flat', 0, 20, 10, 'Lessons from world-class instructors.', 'masterclass.com'],
    ['Skillshare', ['Education'], 'Online', true, 'flat', 0, 15, 0, 'Hands-on creative classes.', 'skillshare.com'],
    ['Outschool', ['Education'], 'Online', true, 'percent', 12, 0, 0, 'Live online classes for kids.', 'outschool.com'],
    // Wellness
    ['Headspace', ['Wellness'], 'Online', true, 'flat', 0, 10, 0, 'Guided meditation and better sleep.', 'headspace.com'],
    ['Calm', ['Wellness'], 'Online', true, 'flat', 0, 10, 0, 'Sleep stories, meditation, and focus.', 'calm.com'],
    ['Hims & Hers', ['Wellness'], 'Online', true, 'flat', 0, 25, 0, 'Telehealth for everyday health needs.', 'hims.com'],
    ['Talkspace', ['Wellness'], 'Online', true, 'flat', 0, 40, 0, 'Therapy by message or video.', 'talkspace.com'],
    // Fitness
    ['ClassPass', ['Fitness'], 'Online', true, 'flat', 0, 20, 10, 'One app, thousands of studios.', 'classpass.com'],
    ['Peloton', ['Fitness'], 'Online', true, 'flat', 0, 30, 0, 'Live and on-demand classes at home.', 'onepeloton.com'],
    ['Whoop', ['Fitness'], 'Online', true, 'flat', 0, 25, 0, 'Recovery, sleep, and strain tracking.', 'whoop.com'],
    ["Barry's", ['Fitness'], 'Los Angeles', false, 'percent', 12, 0, 15, 'The original Red Room HIIT workout.', 'barrys.com'],
    // Food & Drink
    ['Sweetgreen', ['Food & Drink'], 'Los Angeles', false, 'percent', 10, 0, 0, 'Seasonal salads and warm grain bowls.', 'sweetgreen.com'],
    ['HelloFresh', ['Food & Drink'], 'Online', true, 'flat', 0, 20, 20, 'Meal kits delivered weekly.', 'hellofresh.com'],
    ['Cava', ['Food & Drink'], 'Washington, DC', false, 'percent', 10, 0, 10, 'Mediterranean bowls and pitas.', 'cava.com'],
    ['Magnolia Bakery', ['Food & Drink'], 'New York', false, 'flat', 0, 8, 0, 'Famous banana pudding and cupcakes.', 'magnoliabakery.com'],
    // Home
    ['Brooklinen', ['Home'], 'Online', true, 'percent', 12, 0, 10, 'Luxury sheets without the markup.', 'brooklinen.com'],
    ['Parachute', ['Home'], 'Online', true, 'percent', 10, 0, 0, 'Bedding, bath, and home essentials.', 'parachutehome.com'],
    ['Article', ['Home'], 'Online', true, 'flat', 0, 30, 0, 'Modern furniture at fair prices.', 'article.com'],
    ['Ruggable', ['Home'], 'Online', true, 'flat', 0, 20, 15, 'Washable rugs for real life.', 'ruggable.com'],
    // Finance
    ['Wealthfront', ['Finance'], 'Online', true, 'flat', 0, 30, 0, 'Automated investing and high-yield cash.', 'wealthfront.com'],
    ['Betterment', ['Finance'], 'Online', true, 'flat', 0, 25, 0, 'Hands-off investing and retirement.', 'betterment.com'],
    ['SoFi', ['Finance'], 'Online', true, 'flat', 0, 50, 0, 'Loans, banking, and investing in one app.', 'sofi.com'],
    ['Mercury', ['Finance'], 'Online', true, 'flat', 0, 100, 0, 'Banking built for startups.', 'mercury.com'],
    // Travel
    ['Airbnb', ['Travel'], 'Online', true, 'flat', 0, 25, 0, 'Stays and experiences worldwide.', 'airbnb.com'],
    ['Going', ['Travel'], 'Online', true, 'flat', 0, 15, 20, 'Cheap flight alerts to your inbox.', 'going.com'],
    ['Hipcamp', ['Travel'], 'Online', true, 'flat', 0, 12, 0, 'Camp on private land and unique spots.', 'hipcamp.com'],
    ['Away', ['Travel'], 'Online', true, 'percent', 10, 0, 0, 'Thoughtful luggage that lasts.', 'awaytravel.com'],
    // Fashion
    ['Everlane', ['Fashion'], 'Online', true, 'percent', 12, 0, 10, 'Radically transparent, modern basics.', 'everlane.com'],
    ['Reformation', ['Fashion'], 'Online', true, 'percent', 12, 0, 0, 'Sustainable, of-the-moment womenswear.', 'thereformation.com'],
    ['Allbirds', ['Fashion'], 'Online', true, 'flat', 0, 15, 0, 'Comfortable shoes from natural materials.', 'allbirds.com'],
    ["Rothy's", ['Fashion'], 'Online', true, 'flat', 0, 20, 15, 'Stylish flats from recycled materials.', 'rothys.com'],
  ];

  const idByName = {};
  for (const [name, categories, city, online, type, pct, flat, discount, blurb, website] of DEFS) {
    const doc = await Rec.findOneAndUpdate(
      { kind: 'business', name },
      { $setOnInsert: { kind: 'business', name, categories, city, online, commissionType: type, commissionPct: pct, commissionFlat: flat, discount, blurb, status: 'approved', photos: [], website: website || '' } },
      { upsert: true, new: true }
    );
    // Backfill website on demo rows seeded before URLs existed (won't clobber a real one).
    if (website && !doc.website) { doc.website = website; await doc.save(); }
    idByName[name] = doc._id;
  }

  const creators = [
    ['miaglow', 'Skincare, slowly. Based in SF.'],
    ['thelegaledit', 'Making founder legal less scary.'],
    ['wellwithjo', 'Calm bodies, calmer minds.'],
    ['nycdesihangouts', 'NYC Desi hangouts — food, events & culture.', 'Instagram', 'nycdesihangouts', 45000],
  ];
  for (const [username, bio, platform, social, followers] of creators) {
    await Rec.findOneAndUpdate({ kind: 'influencer', username }, { $setOnInsert: { kind: 'influencer', username, image: '', bio, platform: platform || '', social: social || '', followers: followers || 0 } }, { upsert: true });
  }

  const links = [
    ['miaglow', 'Glossier'], ['miaglow', 'The Ordinary'], ['miaglow', 'Drunk Elephant'],
    ['thelegaledit', 'LegalZoom'], ['thelegaledit', 'Trust & Will'],
    ['wellwithjo', 'Headspace'], ['wellwithjo', 'ClassPass'], ['wellwithjo', 'Calm'],
  ];
  for (const [influencer, name] of links) {
    const businessId = idByName[name]; if (!businessId) continue;
    await Rec.findOneAndUpdate({ kind: 'link', influencer, businessId }, { $setOnInsert: { kind: 'link', influencer, businessId, slug: slugify(name) } }, { upsert: true });
  }

  const reviews = [
    ['miaglow', 'Glossier', 5, "Balm Dotcom never leaves my bag — the whole line just works."],
    ['miaglow', 'The Ordinary', 4, 'Best actives for the price, full stop.'],
    ['thelegaledit', 'LegalZoom', 5, 'Set up my LLC in an afternoon, no lawyer needed.'],
    ['wellwithjo', 'Headspace', 5, 'Ten minutes a day genuinely fixed my sleep.'],
    ['wellwithjo', 'ClassPass', 4, 'One app, every studio — I finally stay consistent.'],
  ];
  for (const [influencer, name, stars, text] of reviews) {
    const businessId = idByName[name]; if (!businessId) continue;
    await Rec.findOneAndUpdate({ kind: 'review', influencer, businessId }, { $setOnInsert: { kind: 'review', influencer, businessId, stars, text } }, { upsert: true });
  }

  const after = await Rec.countDocuments({ kind: 'business' });
  res.json({ seeded: true, added: after - before, total: after });
});

module.exports = router;