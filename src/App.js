// src/App.jsx
import { useState, useEffect } from 'react';

const API_BASE = 'https://learntok-backend-2026-24c204fe508e.herokuapp.com/refer';

const GIFT_CARD_REWARDS = ['Amazon Gift Card','Visa Gift Card','Apple Gift Card','Starbucks Gift Card'];
const REWARD_OPTIONS = [
  '$500 credit','Free month','10% revenue share','Custom gift',
  ...GIFT_CARD_REWARDS,
  'Cash via Venmo','Cash via PayPal','DoorDash credit','Airbnb credit',
];
const AUDIENCE_OPTIONS = [
  'SaaS Founders','Revenue Leaders','Customer Success Teams',
  'Product Managers','Sales Ops','Marketing Teams',
];
const TICKER_ITEMS = [
  'ZERO SETUP FEE','VIRAL BY DESIGN','WORKS IN MINUTES','NO CODE NEEDED',
  'INSTANT SHARE LINKS','REAL REFERRALS','BUILT FOR FOUNDERS','TRACKABLE GROWTH',
];

// ─── Consumer brands for influencer page ─────────────────────────────────────
const BRANDS = [
  { id:'amazon',      name:'Amazon',        commission:10, url:'https://amazon.com',        logo:'https://logo.clearbit.com/amazon.com' },
  { id:'nike',        name:'Nike',          commission:11, url:'https://nike.com',           logo:'https://logo.clearbit.com/nike.com' },
  { id:'adidas',      name:'Adidas',        commission:12, url:'https://adidas.com',         logo:'https://logo.clearbit.com/adidas.com' },
  { id:'sephora',     name:'Sephora',       commission:15, url:'https://sephora.com',        logo:'https://logo.clearbit.com/sephora.com' },
  { id:'ulta',        name:'Ulta Beauty',   commission:14, url:'https://ulta.com',           logo:'https://logo.clearbit.com/ulta.com' },
  { id:'nordstrom',   name:'Nordstrom',     commission:13, url:'https://nordstrom.com',      logo:'https://logo.clearbit.com/nordstrom.com' },
  { id:'target',      name:'Target',        commission:10, url:'https://target.com',         logo:'https://logo.clearbit.com/target.com' },
  { id:'walmart',     name:'Walmart',       commission:10, url:'https://walmart.com',        logo:'https://logo.clearbit.com/walmart.com' },
  { id:'macys',       name:"Macy's",        commission:12, url:'https://macys.com',          logo:'https://logo.clearbit.com/macys.com' },
  { id:'apple',       name:'Apple',         commission:12, url:'https://apple.com',          logo:'https://logo.clearbit.com/apple.com' },
  { id:'bestbuy',     name:'Best Buy',      commission:11, url:'https://bestbuy.com',        logo:'https://logo.clearbit.com/bestbuy.com' },
  { id:'samsung',     name:'Samsung',       commission:13, url:'https://samsung.com',        logo:'https://logo.clearbit.com/samsung.com' },
  { id:'dyson',       name:'Dyson',         commission:15, url:'https://dyson.com',          logo:'https://logo.clearbit.com/dyson.com' },
  { id:'lululemon',   name:'Lululemon',     commission:15, url:'https://lululemon.com',      logo:'https://logo.clearbit.com/lululemon.com' },
  { id:'gymshark',    name:'Gymshark',      commission:16, url:'https://gymshark.com',       logo:'https://logo.clearbit.com/gymshark.com' },
  { id:'underarmour', name:'Under Armour',  commission:12, url:'https://underarmour.com',    logo:'https://logo.clearbit.com/underarmour.com' },
  { id:'gap',         name:'Gap',           commission:11, url:'https://gap.com',            logo:'https://logo.clearbit.com/gap.com' },
  { id:'hm',          name:'H&M',           commission:10, url:'https://hm.com',             logo:'https://logo.clearbit.com/hm.com' },
  { id:'zara',        name:'Zara',          commission:11, url:'https://zara.com',           logo:'https://logo.clearbit.com/zara.com' },
  { id:'uniqlo',      name:'Uniqlo',        commission:12, url:'https://uniqlo.com',         logo:'https://logo.clearbit.com/uniqlo.com' },
  { id:'allbirds',    name:'Allbirds',      commission:17, url:'https://allbirds.com',       logo:'https://logo.clearbit.com/allbirds.com' },
  { id:'casper',      name:'Casper',        commission:18, url:'https://casper.com',         logo:'https://logo.clearbit.com/casper.com' },
  { id:'glossier',    name:'Glossier',      commission:18, url:'https://glossier.com',       logo:'https://logo.clearbit.com/glossier.com' },
  { id:'warbyparker', name:'Warby Parker',  commission:20, url:'https://warbyparker.com',    logo:'https://logo.clearbit.com/warbyparker.com' },
  { id:'everlane',    name:'Everlane',      commission:15, url:'https://everlane.com',       logo:'https://logo.clearbit.com/everlane.com' },
  { id:'skims',       name:'SKIMS',         commission:16, url:'https://skims.com',          logo:'https://logo.clearbit.com/skims.com' },
  { id:'fenty',       name:'Fenty Beauty',  commission:17, url:'https://fentybeauty.com',    logo:'https://logo.clearbit.com/fentybeauty.com' },
  { id:'laneige',     name:'Laneige',       commission:16, url:'https://laneige.com',        logo:'https://logo.clearbit.com/laneige.com' },
  { id:'rare',        name:'Rare Beauty',   commission:17, url:'https://rarebeauty.com',     logo:'https://logo.clearbit.com/rarebeauty.com' },
  { id:'crocs',       name:'Crocs',         commission:13, url:'https://crocs.com',          logo:'https://logo.clearbit.com/crocs.com' },
  { id:'ugg',         name:'UGG',           commission:14, url:'https://ugg.com',            logo:'https://logo.clearbit.com/ugg.com' },
  { id:'converse',    name:'Converse',      commission:12, url:'https://converse.com',       logo:'https://logo.clearbit.com/converse.com' },
];

function fixUrl(raw) {
  if (!raw?.trim()) return '';
  return /^https?:\/\//i.test(raw.trim()) ? raw.trim() : 'https://' + raw.trim();
}

// ─── Split / join description helpers ────────────────────────────────────────
function joinDescription({ about, feat1, feat2, feat3 }) {
  const parts = [about, feat1, feat2, feat3].map(p => p.trim()).filter(Boolean);
  return parts.join('\n\n');
}
function splitDescription(desc = '') {
  const parts = desc.split(/\n\n+/);
  return { about: parts[0]||'', feat1: parts[1]||'', feat2: parts[2]||'', feat3: parts[3]||'' };
}

// ─── Auth persistence ─────────────────────────────────────────────────────────
function loadAuth() { try { return JSON.parse(localStorage.getItem('re_auth')||'null'); } catch { return null; } }
function saveAuth(d) { localStorage.setItem('re_auth', JSON.stringify(d)); }
function clearAuth() { localStorage.removeItem('re_auth'); }

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  white:'#FFFFFF', cream:'#FAFAF7', fog:'#F4F3EE', mist:'#ECEAE3', stone:'#D8D5CC',
  pebble:'#B4B0A6', ash:'#7A7770', slate:'#4A4845', ink:'#1A1916', black:'#0D0C0A',
  emerald:'#166534', emeraldBg:'#F0FDF4', emeraldBorder:'#BBF7D0',
  crimson:'#991B1B', crimsonBg:'#FEF2F2', crimsonBorder:'#FECACA',
  accent:'#7C3AED', accentBg:'#F5F3FF', accentBorder:'#DDD6FE',
};
const F = {
  display:"'Cormorant Garamond', 'Playfair Display', Georgia, serif",
  body:"'Outfit', 'DM Sans', system-ui, sans-serif",
  mono:"'JetBrains Mono', 'Fira Code', monospace",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Outfit:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body { background: ${T.cream}; font-family: ${F.body}; color: ${T.ink}; min-height: 100vh; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
::selection { background: ${T.ink}; color: ${T.white}; }
::placeholder { color: ${T.stone} !important; }
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: ${T.cream}; }
::-webkit-scrollbar-thumb { background: ${T.stone}; border-radius: 2px; }

@keyframes spin    { to { transform: rotate(360deg); } }
@keyframes ticker  { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes fadeUp  { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
@keyframes scaleIn { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:scale(1); } }
@keyframes pulse   { 0%,100% { opacity:.5; transform:scale(1); } 50% { opacity:1; transform:scale(1.15); } }
@keyframes shimmer { 0% { background-position:-600px 0; } 100% { background-position:600px 0; } }
@keyframes gradX   { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

.aFadeUp  { animation: fadeUp .6s cubic-bezier(.16,1,.3,1) both; }
.aFadeUp1 { animation: fadeUp .6s .08s cubic-bezier(.16,1,.3,1) both; }
.aFadeUp2 { animation: fadeUp .6s .16s cubic-bezier(.16,1,.3,1) both; }
.aFadeUp3 { animation: fadeUp .6s .24s cubic-bezier(.16,1,.3,1) both; }
.aFadeUp4 { animation: fadeUp .6s .32s cubic-bezier(.16,1,.3,1) both; }
.aScaleIn { animation: scaleIn .35s cubic-bezier(.16,1,.3,1) both; }

/* ── Ticker ── */
.ticker-wrap { overflow:hidden; white-space:nowrap; background:${T.black}; padding:10px 0; }
.ticker-track { display:inline-flex; animation:ticker 28s linear infinite; }
.ticker-item { display:inline-flex; align-items:center; gap:14px; padding:0 24px; font-size:10px; font-weight:600; color:rgba(255,255,255,.45); letter-spacing:.12em; text-transform:uppercase; }
.ticker-star { color:rgba(255,255,255,.2); font-size:9px; }

/* ── Nav ── */
.nav { position:sticky; top:0; z-index:200; background:rgba(250,250,247,.96); backdrop-filter:blur(16px) saturate(1.2); border-bottom:1px solid ${T.mist}; height:56px; display:flex; align-items:center; }
.nav-inner { display:flex; align-items:center; justify-content:space-between; width:100%; max-width:1100px; margin:0 auto; padding:0 32px; }
.nav-logo { font-family:${F.display}; font-size:22px; font-weight:300; color:${T.ink}; letter-spacing:-.02em; cursor:pointer; background:none; border:none; text-decoration:none; display:flex; align-items:baseline; }
.nav-logo em { font-style:italic; }
.nav-logo strong { font-weight:600; }
.nav-live { display:flex; align-items:center; gap:5px; padding:4px 10px; background:${T.emeraldBg}; border:1px solid ${T.emeraldBorder}; border-radius:100px; font-size:10px; font-weight:600; color:${T.emerald}; }
.nav-live-dot { width:5px; height:5px; border-radius:50%; background:${T.emerald}; animation:pulse 2.2s ease-in-out infinite; }

/* ── Buttons ── */
.btn-primary { display:inline-flex; align-items:center; justify-content:center; gap:9px; width:100%; padding:15px 28px; background:${T.black}; border:none; border-radius:6px; color:${T.white}; font-family:${F.body}; font-size:15px; font-weight:600; letter-spacing:-.01em; cursor:pointer; transition:background .15s,transform .15s,box-shadow .15s; box-shadow:0 1px 2px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.08); -webkit-tap-highlight-color:transparent; }
.btn-primary:hover:not(:disabled) { background:${T.ink}; transform:translateY(-1px); box-shadow:0 4px 16px rgba(13,12,10,.22),inset 0 1px 0 rgba(255,255,255,.08); }
.btn-primary:active:not(:disabled) { transform:translateY(0); }
.btn-primary:disabled { background:${T.stone}; color:${T.pebble}; cursor:not-allowed; box-shadow:none; }
.btn-secondary { display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:14px 24px; background:transparent; border:1.5px solid ${T.mist}; border-radius:6px; color:${T.slate}; font-family:${F.body}; font-size:14px; font-weight:500; cursor:pointer; transition:all .15s; -webkit-tap-highlight-color:transparent; }
.btn-secondary:hover { border-color:${T.ink}; color:${T.ink}; background:${T.fog}; }
.btn-ghost { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; background:transparent; border:1.5px solid ${T.mist}; border-radius:6px; color:${T.ash}; font-family:${F.body}; font-size:12px; font-weight:500; cursor:pointer; text-decoration:none; transition:all .15s; white-space:nowrap; }
.btn-ghost:hover { border-color:${T.ink}; color:${T.ink}; background:${T.fog}; }
.btn-accent { display:inline-flex; align-items:center; justify-content:center; gap:9px; width:100%; padding:15px 28px; background:${T.accent}; border:none; border-radius:6px; color:${T.white}; font-family:${F.body}; font-size:15px; font-weight:600; cursor:pointer; transition:all .15s; }
.btn-accent:hover:not(:disabled) { background:#6d28d9; transform:translateY(-1px); box-shadow:0 4px 16px rgba(124,58,237,.3); }
.btn-accent:disabled { background:${T.stone}; color:${T.pebble}; cursor:not-allowed; }

/* ── Inputs ── */
.fi { width:100%; padding:12px 14px; background:${T.white}; border:1.5px solid ${T.mist}; border-radius:6px; font-size:14px; color:${T.ink}; font-family:${F.body}; transition:border-color .15s,box-shadow .15s; outline:none; -webkit-appearance:none; }
.fi:focus { border-color:${T.ink}; box-shadow:0 0 0 3px rgba(13,12,10,.06); }
.fi.err { border-color:${T.crimson}; }
.fta { width:100%; padding:12px 14px; background:${T.white}; border:1.5px solid ${T.mist}; border-radius:6px; font-size:14px; color:${T.ink}; font-family:${F.body}; transition:border-color .15s; outline:none; resize:vertical; min-height:90px; line-height:1.65; }
.fta:focus { border-color:${T.ink}; box-shadow:0 0 0 3px rgba(13,12,10,.06); }
.fta.sm { min-height:68px; }

/* ── Labels ── */
.fl { font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:${T.pebble}; margin-bottom:8px; display:flex; align-items:center; gap:6px; }
.fl-req { color:${T.ink}; font-size:12px; line-height:1; }
.fl-opt { font-size:8px; font-weight:600; color:${T.stone}; letter-spacing:.06em; background:${T.fog}; border:1px solid ${T.mist}; border-radius:3px; padding:2px 5px; text-transform:uppercase; }
.field-err { font-size:11.5px; color:${T.crimson}; margin-top:5px; display:flex; align-items:center; gap:4px; }

/* ── Banners ── */
.banner-err { padding:12px 16px; background:${T.crimsonBg}; border:1px solid ${T.crimsonBorder}; border-radius:8px; font-size:13.5px; color:${T.crimson}; font-weight:500; margin-bottom:18px; display:flex; gap:10px; align-items:flex-start; line-height:1.5; }
.banner-ok  { padding:12px 16px; background:${T.emeraldBg}; border:1px solid ${T.emeraldBorder}; border-radius:8px; font-size:13.5px; color:${T.emerald}; font-weight:500; margin-bottom:18px; display:flex; gap:10px; align-items:flex-start; line-height:1.5; }

/* ── Cards ── */
.card { background:${T.white}; border:1px solid ${T.mist}; border-radius:10px; overflow:hidden; margin-bottom:14px; box-shadow:0 1px 3px rgba(0,0,0,.04); transition:border-color .2s,box-shadow .2s; }
.card:hover { border-color:${T.stone}; box-shadow:0 2px 12px rgba(0,0,0,.06); }
.card-head { padding:13px 18px; border-bottom:1px solid ${T.mist}; display:flex; align-items:center; gap:10px; background:${T.fog}; }
.card-icon { width:26px; height:26px; border-radius:6px; background:${T.white}; border:1px solid ${T.mist}; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; }
.card-title { font-size:13px; font-weight:600; color:${T.ink}; }
.card-sub { font-size:11px; color:${T.pebble}; margin-top:1px; }
.card-body { padding:18px; }

/* ── Misc ── */
.copy-btn { padding:7px 11px; background:${T.fog}; border:1px solid ${T.mist}; border-radius:5px; color:${T.ash}; font-family:${F.body}; font-size:10px; font-weight:600; cursor:pointer; transition:all .15s; letter-spacing:.06em; white-space:nowrap; }
.copy-btn:hover { border-color:${T.ink}; color:${T.ink}; }
.copy-btn.copied { border-color:${T.emerald}; color:${T.emerald}; background:${T.emeraldBg}; }
.share-ta { width:100%; padding:12px 14px; background:${T.fog}; border:1.5px solid ${T.mist}; border-radius:6px; font-family:${F.body}; font-size:13px; color:${T.slate}; line-height:1.7; resize:none; outline:none; transition:border-color .15s; }
.share-ta:focus { border-color:${T.ink}; background:${T.white}; }
.sh-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; flex:1; min-width:0; padding:10px 8px; border:none; border-radius:6px; font-family:${F.body}; font-size:12px; font-weight:600; cursor:pointer; text-decoration:none; transition:all .15s; white-space:nowrap; }
.sh-li { background:#0A66C2; color:#fff; }
.sh-li:hover { background:#0958a8; transform:translateY(-1px); }
.sh-wa { background:#25D366; color:#fff; }
.sh-wa:hover { background:#1db954; transform:translateY(-1px); }
.sh-tw { background:${T.fog}; color:${T.ink}; border:1.5px solid ${T.mist}; }
.sh-tw:hover { background:${T.mist}; transform:translateY(-1px); }
.sh-ig { background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); color:#fff; }
.sh-ig:hover { opacity:.9; transform:translateY(-1px); }
.sh-sms { background:${T.fog}; color:${T.ink}; border:1.5px solid ${T.mist}; }
.sh-sms:hover { background:${T.mist}; transform:translateY(-1px); }
.stat-strip { display:flex; border:1px solid ${T.mist}; border-radius:10px; overflow:hidden; background:${T.white}; box-shadow:0 1px 4px rgba(0,0,0,.04); }
.stat-item { flex:1; padding:20px 16px; text-align:center; border-right:1px solid ${T.mist}; }
.stat-item:last-child { border-right:none; }
.stat-num { font-family:${F.display}; font-size:36px; font-weight:300; font-style:italic; color:${T.ink}; line-height:1; margin-bottom:5px; }
.stat-lbl { font-size:9px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:${T.pebble}; }
.tab-btn { padding:8px 16px; background:transparent; border:none; border-radius:6px; font-family:${F.body}; font-size:13px; font-weight:500; color:${T.pebble}; cursor:pointer; transition:all .15s; white-space:nowrap; }
.tab-btn:hover:not(.active) { color:${T.slate}; }
.tab-btn.active { background:${T.ink}; color:${T.white}; font-weight:600; }
.sharer-row { display:flex; align-items:center; justify-content:space-between; padding:11px 0; border-bottom:1px solid ${T.fog}; gap:10px; flex-wrap:wrap; }
.sharer-row:last-child { border-bottom:none; }
.reward-badge { display:inline-flex; align-items:center; padding:9px 16px; border-radius:6px; background:${T.ink}; color:${T.white}; font-size:13px; font-weight:500; }
.eyebrow { font-size:10px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:${T.pebble}; display:flex; align-items:center; gap:10px; margin-bottom:20px; }
.eyebrow::after { content:''; flex:1; height:1px; background:${T.mist}; }
.modal-overlay { position:fixed; inset:0; z-index:300; background:rgba(250,250,247,.88); backdrop-filter:blur(10px) saturate(1.3); display:flex; align-items:center; justify-content:center; padding:20px; }
.modal-box { background:${T.white}; border:1px solid ${T.mist}; border-radius:14px; padding:36px; width:100%; max-width:400px; position:relative; box-shadow:0 8px 48px rgba(13,12,10,.14); animation:scaleIn .3s cubic-bezier(.16,1,.3,1) both; }

/* ── Description sections ── */
.desc-section { border:1.5px solid ${T.mist}; border-radius:8px; overflow:hidden; }
.desc-section-head { padding:9px 13px; background:${T.fog}; border-bottom:1px solid ${T.mist}; font-size:10px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:${T.pebble}; display:flex; align-items:center; gap:8px; }
.desc-section-body { padding:12px 14px; }

/* ── Brand cards (influencer signup) ── */
.brand-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:10px; }
.brand-card { position:relative; display:flex; flex-direction:column; align-items:center; gap:8px; padding:16px 10px 12px; background:${T.white}; border:1.5px solid ${T.mist}; border-radius:10px; cursor:pointer; transition:all .18s; user-select:none; }
.brand-card:hover { border-color:${T.ink}; box-shadow:0 2px 10px rgba(0,0,0,.08); transform:translateY(-1px); }
.brand-card.selected { border-color:${T.ink}; background:${T.ink}; }
.brand-card.selected .brand-name { color:${T.white}; }
.brand-card.selected .brand-comm { color:rgba(255,255,255,.6); }
.brand-logo { width:44px; height:44px; border-radius:8px; object-fit:contain; background:${T.white}; padding:4px; }
.brand-card.selected .brand-logo { background:rgba(255,255,255,.12); border-radius:6px; }
.brand-name { font-size:12px; font-weight:600; color:${T.ink}; text-align:center; line-height:1.2; }
.brand-comm { font-size:10px; color:${T.ash}; font-weight:500; }
.brand-check { position:absolute; top:7px; right:7px; width:16px; height:16px; border-radius:50%; background:rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center; font-size:9px; color:${T.white}; }
.brand-card:not(.selected) .brand-check { display:none; }

/* ── Influencer public page ── */
.inf-hero { background:${T.black}; padding:56px 40px 48px; position:relative; overflow:hidden; }
.inf-hero::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at 60% 0%, rgba(124,58,237,.18) 0%, transparent 65%); pointer-events:none; }
.inf-brand-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:14px; }
.inf-brand-tile { display:flex; flex-direction:column; align-items:center; gap:10px; padding:24px 16px 18px; background:${T.white}; border:1px solid ${T.mist}; border-radius:12px; cursor:pointer; text-decoration:none; transition:all .2s; }
.inf-brand-tile:hover { border-color:${T.ink}; box-shadow:0 4px 20px rgba(0,0,0,.1); transform:translateY(-2px); }
.inf-brand-tile-logo { width:52px; height:52px; object-fit:contain; border-radius:8px; background:${T.fog}; padding:6px; }
.inf-brand-tile-name { font-size:13px; font-weight:600; color:${T.ink}; text-align:center; }
.inf-brand-tile-comm { font-size:11px; font-weight:600; color:${T.accent}; margin-top:1px; }
.inf-brand-tile-cta { margin-top:6px; font-size:11px; font-weight:500; color:${T.ash}; display:flex; align-items:center; gap:3px; }

/* ── Influencer signup hero ── */
.inf-signup-hero { background:linear-gradient(135deg,${T.black} 0%,#1a0a2e 100%); padding:60px 40px 52px; }

@media (max-width:640px) {
  .hero-title { font-size:clamp(52px,14vw,86px) !important; }
  .hero-pad { padding:52px 20px 0 !important; }
  .page-pad { padding:32px 20px 80px !important; }
  .form-pad { padding:0 20px 80px !important; }
  .nav-inner { padding:0 20px !important; }
  .stat-strip { flex-wrap:wrap; }
  .stat-item { flex:1 1 50%; border-bottom:1px solid ${T.mist}; }
  .share-grid { grid-template-columns:1fr 1fr !important; }
  .tab-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .tabs-row { min-width:max-content; }
  .hero-cta-row { flex-direction:column !important; }
  .steps-row { grid-template-columns:1fr !important; }
  .testimonials { grid-template-columns:1fr !important; }
  .sharer-code { display:none !important; }
  .modal-box { padding:28px 22px !important; }
  .dash-header { flex-direction:column !important; align-items:flex-start !important; }
  .brand-grid { grid-template-columns:repeat(auto-fill,minmax(100px,1fr)) !important; }
  .inf-brand-grid { grid-template-columns:repeat(auto-fill,minmax(130px,1fr)) !important; }
  .inf-hero { padding:40px 20px 36px !important; }
  .inf-signup-hero { padding:40px 20px 36px !important; }
}
@media (max-width:420px) {
  .share-grid { grid-template-columns:1fr !important; }
}
`;

// ─── Micro components ─────────────────────────────────────────────────────────
function Spinner() {
  return <div style={{width:14,height:14,border:'2px solid rgba(255,255,255,.25)',borderTop:'2px solid rgba(255,255,255,.9)',borderRadius:'50%',animation:'spin .7s linear infinite',flexShrink:0}}/>;
}
function SpinnerDark() {
  return <div style={{width:14,height:14,border:`2px solid ${T.mist}`,borderTop:`2px solid ${T.ink}`,borderRadius:'50%',animation:'spin .7s linear infinite',flexShrink:0}}/>;
}
function FL({ req, opt, children }) {
  return <div className="fl">{children}{req&&<span className="fl-req">*</span>}{opt&&<span className="fl-opt">optional</span>}</div>;
}
function FG({ label, req, opt, err, children }) {
  return (
    <div style={{marginBottom:16}}>
      <FL req={req} opt={opt}>{label}</FL>
      {children}
      {err&&<div className="field-err">⚠ {err}</div>}
    </div>
  );
}
function ErrBanner({msg}) { return msg?<div className="banner-err"><span>⚠</span><span>{msg}</span></div>:null; }
function OkBanner({msg})  { return msg?<div className="banner-ok"><span>✓</span><span>{msg}</span></div>:null; }
function CopyBtn({ text }) {
  const [s,set]=useState('COPY');
  return <button className={`copy-btn${s!=='COPY'?' copied':''}`} onClick={()=>{navigator.clipboard.writeText(text);set('COPIED!');setTimeout(()=>set('COPY'),2200)}}>{s}</button>;
}
function Card({ head, icon, title, sub, pad=true, dark, children }) {
  return (
    <div className="card" style={dark?{borderColor:T.ink}:{}}>
      {(head||icon||title)&&(
        <div className="card-head" style={dark?{background:T.ink,borderColor:'rgba(255,255,255,.08)'}:{}}>
          {icon&&<div className="card-icon" style={dark?{background:'rgba(255,255,255,.08)',borderColor:'rgba(255,255,255,.12)',color:T.white}:{}}>{icon}</div>}
          <div style={{flex:1,minWidth:0}}>
            <div className="card-title" style={dark?{color:T.white}:{}}>{title}</div>
            {sub&&<div className="card-sub" style={dark?{color:'rgba(255,255,255,.45)'}:{}}>{sub}</div>}
          </div>
          {head}
        </div>
      )}
      <div className={pad?'card-body':''}>{children}</div>
    </div>
  );
}
function CheckGrid({ options, selected, name, onChange }) {
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
      {options.map(opt=>(
        <label key={opt} className={`cp${selected.includes(opt)?' on':''}`} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'8px 13px',background:selected.includes(opt)?T.ink:T.white,border:`1.5px solid ${selected.includes(opt)?T.ink:T.mist}`,borderRadius:6,cursor:'pointer',fontSize:13,color:selected.includes(opt)?T.white:T.slate,transition:'all .15s',userSelect:'none'}}>
          <input type="checkbox" name={name} value={opt} checked={selected.includes(opt)} onChange={onChange} style={{display:'none'}}/>
          <span style={{width:6,height:6,borderRadius:'50%',flexShrink:0,border:`1.5px solid ${selected.includes(opt)?'rgba(255,255,255,.4)':T.stone}`,background:selected.includes(opt)?'rgba(255,255,255,.8)':'transparent',transition:'all .15s'}}/>
          {opt}
        </label>
      ))}
    </div>
  );
}
function GiftRow({ reward, value, onChange }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,marginTop:10,padding:'11px 14px',background:T.fog,border:`1px solid ${T.mist}`,borderRadius:6}}>
      <label style={{fontSize:12,color:T.ash,whiteSpace:'nowrap',fontWeight:500}}>{reward}</label>
      <span style={{fontWeight:600,color:T.ash,fontSize:13}}>$</span>
      <input style={{flex:1,padding:'7px 10px',background:T.white,border:`1.5px solid ${T.mist}`,borderRadius:5,fontSize:14,color:T.ink,fontFamily:F.body,outline:'none'}} type="number" min="1" max="9999" placeholder="50" value={value} onChange={e=>onChange(e.target.value)}/>
      <span style={{fontSize:11,color:T.stone}}>USD</span>
    </div>
  );
}
function DescriptionFields({ values, onChange, errors }) {
  const sections=[
    {key:'about',label:'About',icon:'◎',placeholder:'One sentence about what you do — your core value proposition',req:true},
    {key:'feat1',label:'Feature 1',icon:'①',placeholder:'Key feature or benefit #1',req:false},
    {key:'feat2',label:'Feature 2',icon:'②',placeholder:'Key feature or benefit #2',req:false},
    {key:'feat3',label:'Feature 3',icon:'③',placeholder:'Key feature or benefit #3',req:false},
  ];
  return (
    <div style={{marginBottom:16}}>
      <FL req>Description</FL>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {sections.map(({key,label,icon,placeholder,req})=>(
          <div key={key} className="desc-section">
            <div className="desc-section-head">
              <span style={{fontSize:11}}>{icon}</span>{label}
              {req&&<span style={{color:T.ink,fontSize:12,fontWeight:700}}>*</span>}
              {!req&&<span style={{fontSize:8,fontWeight:600,color:T.stone,letterSpacing:'.06em',background:T.white,border:`1px solid ${T.mist}`,borderRadius:3,padding:'2px 5px',textTransform:'uppercase',marginLeft:'auto'}}>optional</span>}
            </div>
            <div className="desc-section-body">
              <textarea className={`fta sm${errors?.[key]?' err':''}`} placeholder={placeholder} value={values[key]||''} onChange={e=>onChange(key,e.target.value)}/>
              {errors?.[key]&&<div className="field-err">⚠ {errors[key]}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function timeAgo(date) {
  const d=Date.now()-new Date(date),m=Math.floor(d/60000);
  if(m<60) return `${m}m ago`;
  const h=Math.floor(m/60);
  if(h<24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}
function buildShareText(prog,name,link,isFounder=false) {
  const co=prog?.companyName||'my company';
  const rw=prog?.rewards?.length?prog.rewards.join(' or '):'exclusive rewards';
  const ds=prog?.description||'';
  if(isFounder) return `Hey 👋 I'm ${name||'the founder'} of ${co}.\n\n${ds?ds+'\n\n':''}We're building for ${prog?.audience?.join(' & ')||'teams like yours'}.\n\nIf anyone signs up through your link, I'll personally send you ${rw} 🙌\n\n→ ${link}`;
  return `Just discovered ${co} — thought you'd love it!\n\n${ds?ds+'\n\n':''}${prog?.audience?.length?'Perfect for '+prog.audience.join(' or ')+'.\n\n':''}Sign up via my referral link & earn: ${prog?.rewards?.join(', ')||'exclusive rewards'}.\n\n${name?'Referred by '+name+'.\n\n':''}→ ${link}`;
}
function getShareLink(raw) {
  if(!raw) return '';
  try { return `${window.location.origin}${new URL(raw).pathname}`; }
  catch { return `${window.location.origin}${raw}`; }
}

// ─── ShareActions ─────────────────────────────────────────────────────────────
function ShareActions({ link, shareText, programName }) {
  const enc=encodeURIComponent;
  const liUrl=`https://www.linkedin.com/sharing/share-offsite/?url=${enc(link)}`;
  const waUrl=`https://wa.me/?text=${enc(shareText)}`;
  const twUrl=`https://twitter.com/intent/tweet?text=${enc(shareText)}`;
  const smsUrl=`sms:?body=${enc(shareText)}`;
  const mailUrl=`mailto:?subject=${enc('Check out '+(programName||'this'))}&body=${enc(shareText)}`;
  const [igNote,setIgNote]=useState(false);
  return (
    <div>
      <FL>Your referral link</FL>
      <div style={{display:'flex',alignItems:'center',gap:9,background:T.fog,border:`1.5px solid ${T.mist}`,borderRadius:7,padding:'10px 13px',marginBottom:14}}>
        <code style={{flex:1,fontSize:11.5,color:T.ink,fontFamily:F.mono,wordBreak:'break-all',lineHeight:1.5,fontWeight:500}}>{link}</code>
        <CopyBtn text={link}/>
      </div>
      <FL>Suggested message <span style={{fontSize:10,color:T.stone,fontWeight:400,letterSpacing:0,textTransform:'none'}}>— click to select all</span></FL>
      <div style={{position:'relative',marginBottom:14}}>
        <textarea className="share-ta" rows={5} defaultValue={shareText} onClick={e=>e.target.select()}/>
        <div style={{position:'absolute',top:9,right:9}}><CopyBtn text={shareText}/></div>
      </div>
      <FL>Share on</FL>
      <div className="share-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:8}}>
        <a className="sh-btn sh-li" href={liUrl} target="_blank" rel="noopener noreferrer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          LinkedIn
        </a>
        <a className="sh-btn sh-wa" href={waUrl} target="_blank" rel="noopener noreferrer">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>
        <a className="sh-btn sh-tw" href={twUrl} target="_blank" rel="noopener noreferrer">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          X/Twitter
        </a>
        <button className="sh-btn sh-ig" onClick={()=>{navigator.clipboard.writeText(shareText);setIgNote(true);setTimeout(()=>setIgNote(false),4000);}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          Instagram
        </button>
        <a className="sh-btn sh-sms" href={smsUrl}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          iMessage
        </a>
        <a className="sh-btn sh-sms" href={mailUrl}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Email
        </a>
      </div>
      {igNote&&<div style={{padding:'9px 13px',background:T.fog,border:`1px solid ${T.mist}`,borderRadius:6,fontSize:12,color:T.slate,lineHeight:1.5,animation:'fadeUp .3s ease'}}>✓ Copied — open Instagram Stories and paste as text or add a link sticker.</div>}
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ onCreate, onSignIn }) {
  return (
    <>
      <div className="ticker-wrap">
        <div className="ticker-track">
          {[...TICKER_ITEMS,...TICKER_ITEMS].map((t,i)=>(
            <span key={i} className="ticker-item"><span className="ticker-star">✦</span>{t}</span>
          ))}
        </div>
      </div>
      <div className="hero-pad" style={{maxWidth:900,margin:'0 auto',padding:'80px 40px 0'}}>
        <div className="aFadeUp" style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
          <div style={{width:32,height:1.5,background:T.ink}}/>
          <span style={{fontSize:10,fontWeight:600,letterSpacing:'.16em',textTransform:'uppercase',color:T.ash}}>Referral infrastructure · Founders</span>
        </div>
        <h1 className="aFadeUp1 hero-title" style={{fontFamily:F.display,fontSize:'clamp(64px,10vw,100px)',fontWeight:300,lineHeight:.91,letterSpacing:'-.03em',color:T.ink,marginBottom:36}}>
          The real word of mouth <br/>marketing<br/><em style={{fontStyle:'italic',fontWeight:300}}></em>
        </h1>
        <p className="aFadeUp2" style={{fontSize:17,color:T.ash,lineHeight:1.75,maxWidth:460,marginBottom:44,fontWeight:300}}>
          A viral referral program, live in 3 minutes.<br/>No code. No friction. Pure word-of-mouth.
        </p>
        <div className="aFadeUp3 hero-cta-row" style={{display:'flex',alignItems:'center',gap:10,marginBottom:80,flexWrap:'wrap'}}>
          <button onClick={onCreate} className="btn-primary" style={{width:'auto',padding:'13px 28px',fontSize:14,borderRadius:6}}>
            Create your program
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button onClick={onSignIn} className="btn-secondary" style={{width:'auto',padding:'12px 22px',fontSize:13}}>Sign in to dashboard →</button>
        </div>
        <div className="aFadeUp4 stat-strip" style={{marginBottom:88}}>
          {[{num:'3 min',lbl:'average setup'},{num:'∞',lbl:'viral chains'},{num:'0',lbl:'lines of code'},{num:'24/7',lbl:'link uptime'}].map((s,i)=>(
            <div key={i} className="stat-item"><div className="stat-num">{s.num}</div><div className="stat-lbl">{s.lbl}</div></div>
          ))}
        </div>
        <div style={{marginBottom:88}}>
          <div className="eyebrow">How it works</div>
          <div className="steps-row" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}>
            {[{n:'01',title:'Create',body:'Fill in your company, pick a reward, done. Under 3 minutes.'},{n:'02',title:'Share',body:'Post your link on LinkedIn, WhatsApp, email — anywhere your people are.'},{n:'03',title:'Go viral',body:'Every visitor gets their own link. They share, you grow, everyone wins.'}].map((s,i)=>(
              <div key={i} style={{paddingTop:20,borderTop:`1.5px solid ${T.mist}`}}>
                <div style={{fontFamily:F.display,fontStyle:'italic',fontSize:42,fontWeight:300,color:T.stone,lineHeight:1,marginBottom:14}}>{s.n}</div>
                <div style={{fontSize:15,fontWeight:600,color:T.ink,marginBottom:8,letterSpacing:'-.01em'}}>{s.title}</div>
                <div style={{fontSize:13,color:T.ash,lineHeight:1.7,fontWeight:300}}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{marginBottom:88}}>
          <div className="eyebrow">What founders say</div>
          <div className="testimonials" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
            {[{q:'"12 warm leads from one LinkedIn post. Zero code."',n:'Priya K.',r:'Solo founder, B2B SaaS'},{q:'"My users sell for me now. Best $0 hire I ever made."',n:'Marcus T.',r:'CEO, early-stage startup'},{q:'"Set it up on a train ride. Had a referral before arrival."',n:'Sophie L.',r:'Indie hacker'}].map((t,i)=>(
              <div key={i} style={{background:T.white,border:`1px solid ${T.mist}`,borderRadius:10,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
                <div style={{fontSize:15,color:T.slate,lineHeight:1.7,marginBottom:16,fontStyle:'italic',fontFamily:F.display,fontWeight:300}}>{t.q}</div>
                <div style={{display:'flex',alignItems:'center',gap:9}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:T.ink,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:T.white,flexShrink:0}}>{t.n[0]}</div>
                  <div><div style={{fontSize:12,fontWeight:600,color:T.ink}}>{t.n}</div><div style={{fontSize:10,color:T.pebble,marginTop:1}}>{t.r}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:52}}>
          <div style={{flex:1,height:1.5,background:T.ink}}/>
          <div style={{padding:'8px 20px',background:T.ink,color:T.white,fontSize:10,fontWeight:600,letterSpacing:'.12em',textTransform:'uppercase'}}>Create your program</div>
          <div style={{flex:1,height:1.5,background:T.ink}}/>
        </div>
      </div>
    </>
  );
}

// ─── Sign-in modal ────────────────────────────────────────────────────────────
function SignInModal({ onClose, onSuccess }) {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [loading,setLoad]=useState(false);
  const [error,setError]=useState('');
  const submit=async e=>{
    e.preventDefault();setLoad(true);setError('');
    try {
      const r=await fetch(`${API_BASE}/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||'Login failed');
      onSuccess(d);
    } catch(e){setError(e.message);}
    finally{setLoad(false);}
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{position:'absolute',top:16,right:18,background:'none',border:'none',color:T.pebble,cursor:'pointer',fontSize:18,lineHeight:1,padding:4}}>✕</button>
        <div style={{fontFamily:F.display,fontSize:30,fontWeight:300,fontStyle:'italic',color:T.ink,marginBottom:4,lineHeight:1.1}}>Welcome back.</div>
        <p style={{fontSize:13,color:T.pebble,marginBottom:28,fontWeight:300}}>Sign in to view your dashboard & live stats.</p>
        <ErrBanner msg={error}/>
        <form onSubmit={submit}>
          <FG label="Email" req><input className="fi" type="email" placeholder="you@company.com" value={email} onChange={e=>{setEmail(e.target.value);setError('')}} required autoFocus/></FG>
          <FG label="Password" req><input className="fi" type="password" placeholder="Your password" value={password} onChange={e=>{setPassword(e.target.value);setError('')}} required/></FG>
          <button type="submit" disabled={loading} className="btn-primary">{loading?<><Spinner/> Signing in…</>:<>Sign in →</>}</button>
        </form>
      </div>
    </div>
  );
}

// ─── Gift card helpers ────────────────────────────────────────────────────────
function parseGiftCardReward(r) {
  const match=r.match(/^(.+?)\s*\(\$(\d+)\)$/);
  if(match&&GIFT_CARD_REWARDS.includes(match[1])) return{base:match[1],amt:match[2]};
  return null;
}
function expandRewards(rewards=[]) {
  const selected=[],gcAmounts={};
  for(const r of rewards){
    const parsed=parseGiftCardReward(r);
    if(parsed){selected.push(parsed.base);gcAmounts[parsed.base]=parsed.amt;}
    else selected.push(r);
  }
  return{selected,gcAmounts};
}

// ─── Edit form (dashboard) ────────────────────────────────────────────────────
function EditForm({ initial, auth, onSaved }) {
  const{selected:initSelected,gcAmounts:initGc}=expandRewards(initial.rewards);
  const initDesc=splitDescription(initial.description||'');
  const[form,setForm]=useState({username:initial.username||'',companyName:initial.companyName||'',descAbout:initDesc.about,descFeat1:initDesc.feat1,descFeat2:initDesc.feat2,descFeat3:initDesc.feat3,website:(initial.website||'').replace(/^https?:\/\//,''),rewards:initSelected,audience:initial.audience||[],contactEmail:initial.contactEmail||'',calendlyLink:(initial.calendlyLink||'').replace(/^https?:\/\//,'')});
  const[gcAmt,setGcAmt]=useState(initGc);
  const[saving,setSaving]=useState(false);
  const[fErr,setFErr]=useState({});
  const[saved,setSaved]=useState(false);
  const[error,setError]=useState('');
  const handleChange=e=>{
    const{name,value,checked}=e.target;
    if(name==='rewards') setForm(p=>({...p,rewards:checked?[...p.rewards,value]:p.rewards.filter(r=>r!==value)}));
    else if(name==='audience') setForm(p=>({...p,audience:checked?[...p.audience,value]:p.audience.filter(a=>a!==value)}));
    else setForm(p=>({...p,[name]:value}));
    if(fErr[name]) setFErr(p=>({...p,[name]:''}));
    setError('');setSaved(false);
  };
  const handleDescChange=(key,val)=>{setForm(p=>({...p,[`desc${key.charAt(0).toUpperCase()+key.slice(1)}`]:val}));setError('');setSaved(false);};
  const finalRewards=()=>form.rewards.map(r=>GIFT_CARD_REWARDS.includes(r)&&gcAmt[r]?`${r} ($${gcAmt[r]})`:r);
  const validate=()=>{
    const e={};
    if(!form.username.trim()) e.username='Username required';
    if(!form.companyName.trim()) e.companyName='Company name required';
    if(!form.descAbout.trim()) e.descAbout='About is required';
    if(!form.rewards.length) e.rewards='Pick at least one reward';
    for(const r of form.rewards) if(GIFT_CARD_REWARDS.includes(r)&&!gcAmt[r]) e[`gc_${r}`]=`Amount required for ${r}`;
    setFErr(e);return!Object.keys(e).length;
  };
  const save=async e=>{
    e.preventDefault();if(!validate()) return;
    setSaving(true);setError('');setSaved(false);
    try {
      const description=joinDescription({about:form.descAbout,feat1:form.descFeat1,feat2:form.descFeat2,feat3:form.descFeat3});
      const payload={username:form.username,companyName:form.companyName,description,website:fixUrl(form.website),calendlyLink:fixUrl(form.calendlyLink),rewards:finalRewards(),audience:form.audience,contactEmail:form.contactEmail};
      const r=await fetch(`${API_BASE}/dashboard/${auth.referralCode}?token=${auth.token}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||'Failed to save');
      setSaved(true);if(onSaved) onSaved(payload);
    } catch(e){setError(e.message);}
    finally{setSaving(false);}
  };
  const descValues={about:form.descAbout,feat1:form.descFeat1,feat2:form.descFeat2,feat3:form.descFeat3};
  const descErrors={about:fErr.descAbout};
  return (
    <form onSubmit={save} noValidate>
      <ErrBanner msg={error}/>{saved&&<OkBanner msg="Changes saved successfully!"/>}
      <Card icon="◎" title="Your details">
        <FG label="Display name" req err={fErr.username}><input className={`fi${fErr.username?' err':''}`} name="username" placeholder="yourhandle" value={form.username} onChange={handleChange} autoCapitalize="none"/></FG>
        <FG label="Company Name" req err={fErr.companyName}><input className={`fi${fErr.companyName?' err':''}`} name="companyName" placeholder="Acme Inc." value={form.companyName} onChange={handleChange}/></FG>
        <DescriptionFields values={descValues} onChange={handleDescChange} errors={descErrors}/>
        <FG label="Website" opt><input className="fi" name="website" placeholder="yourcompany.com" value={form.website} onChange={handleChange} inputMode="url" autoCapitalize="none"/><div style={{fontSize:11,color:T.stone,marginTop:4}}>https:// added automatically</div></FG>
      </Card>
      <Card icon="◈" title="Offer & audience">
        <FG label="Rewards" req err={fErr.rewards}>
          <CheckGrid options={REWARD_OPTIONS} selected={form.rewards} name="rewards" onChange={handleChange}/>
          {form.rewards.filter(r=>GIFT_CARD_REWARDS.includes(r)).map(r=>(
            <div key={r}><GiftRow reward={r} value={gcAmt[r]||''} onChange={v=>setGcAmt(p=>({...p,[r]:v}))}/>{fErr[`gc_${r}`]&&<div className="field-err">⚠ {fErr[`gc_${r}`]}</div>}</div>
          ))}
        </FG>
        <FG label="Target Audience" opt><CheckGrid options={AUDIENCE_OPTIONS} selected={form.audience} name="audience" onChange={handleChange}/></FG>
        <FG label="Contact Email" opt><input className="fi" name="contactEmail" type="email" placeholder="hello@yourcompany.com" value={form.contactEmail} onChange={handleChange} inputMode="email" autoCapitalize="none"/></FG>
        <FG label="Booking / Calendly Link" opt><input className="fi" name="calendlyLink" placeholder="calendly.com/yourname" value={form.calendlyLink} onChange={handleChange} inputMode="url" autoCapitalize="none"/><div style={{fontSize:11,color:T.stone,marginTop:4}}>https:// added automatically</div></FG>
      </Card>
      <button type="submit" disabled={saving} className="btn-primary">{saving?<><Spinner/> Saving changes…</>:<>Save changes →</>}</button>
      {saved&&<p style={{textAlign:'center',fontSize:12,color:T.emerald,marginTop:10,fontWeight:500}}>✓ Your program has been updated</p>}
    </form>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ auth, onSignOut, onProgramUpdated }) {
  const[data,setData]=useState(null);
  const[load,setLoad]=useState(true);
  const[error,setError]=useState('');
  const[tab,setTab]=useState('overview');
  useEffect(()=>{fetch_();},[]);
  const fetch_=async()=>{
    setLoad(true);setError('');
    try{
      const r=await fetch(`${API_BASE}/dashboard/${auth.referralCode}?token=${auth.token}`);
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||'Failed to load');
      setData(d);
    }catch(e){setError(e.message);}
    finally{setLoad(false);}
  };
  if(load) return <div style={{display:'flex',alignItems:'center',gap:12,color:T.pebble,fontSize:13,padding:'80px 40px'}}><SpinnerDark/> Loading your dashboard…</div>;
  if(error) return <div style={{maxWidth:680,margin:'0 auto',padding:'80px 40px'}}><ErrBanner msg={error}/><button className="btn-secondary" style={{width:'auto',padding:'10px 20px'}} onClick={fetch_}>Retry</button></div>;
  const{program,sharers,stats}=data;
  const shareText=buildShareText(program,program.username,program.programLink,true);
  const liUrl=`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(program.programLink)}`;
  const handleSaved=updates=>{setData(prev=>({...prev,program:{...prev.program,...updates}}));if(onProgramUpdated) onProgramUpdated(updates);};
  return (
    <div className="aFadeUp page-pad" style={{maxWidth:820,margin:'0 auto',padding:'52px 40px 80px'}}>
      <div className="dash-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:36,gap:14}}>
        <div>
          <div style={{fontSize:9,fontWeight:600,letterSpacing:'.14em',textTransform:'uppercase',color:T.pebble,marginBottom:10}}>Dashboard</div>
          <h1 style={{fontFamily:F.display,fontStyle:'italic',fontSize:'clamp(28px,5vw,44px)',fontWeight:300,lineHeight:.92,letterSpacing:'-.02em',color:T.ink}}>{program.companyName}</h1>
          <p style={{fontSize:12,color:T.pebble,marginTop:8,fontWeight:300}}>Logged in as <strong style={{fontWeight:600,color:T.slate}}>{program.username}</strong></p>
        </div>
        <button onClick={onSignOut} className="btn-ghost">Sign out</button>
      </div>
      <div className="stat-strip" style={{marginBottom:20}}>
        {[{num:stats.simulatedVisits||0,lbl:'Profile views'},{num:stats.totalSharers,lbl:'Active referrers'},{num:program.rewards?.length||0,lbl:'Rewards offered'}].map((s,i)=>(
          <div key={i} className="stat-item"><div className="stat-num" style={{fontSize:40}}>{s.num}</div><div className="stat-lbl">{s.lbl}</div></div>
        ))}
      </div>
      <div style={{background:T.ink,borderRadius:10,padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,marginBottom:20,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:T.white,marginBottom:3}}>Keep sharing — every post can unlock new referrers</div>
          <p style={{fontSize:12,color:'rgba(255,255,255,.5)',fontWeight:300}}>The link works forever. Share it again on LinkedIn today.</p>
        </div>
        <a className="sh-btn sh-li" href={liUrl} target="_blank" rel="noopener noreferrer" style={{flexShrink:0,padding:'10px 18px',borderRadius:6}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          Share on LinkedIn
        </a>
      </div>
      <div className="tab-scroll" style={{marginBottom:18}}>
        <div className="tabs-row" style={{display:'inline-flex',gap:3,background:T.fog,border:`1px solid ${T.mist}`,borderRadius:8,padding:3}}>
          {[['overview','Overview'],['sharers',`Referrers (${sharers.length})`],['link','Your Link'],['edit','Edit Program']].map(([id,lbl])=>(
            <button key={id} className={`tab-btn${tab===id?' active':''}`} onClick={()=>setTab(id)}>{lbl}</button>
          ))}
        </div>
      </div>
      {tab==='overview'&&(
        <div className="aFadeUp">
          <Card icon="◈" title="Program info" head={<button onClick={()=>setTab('edit')} className="btn-ghost" style={{marginLeft:'auto',fontSize:11}}>✎ Edit</button>}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:18}}>
              {[{l:'Company',v:program.companyName},{l:'Description',v:program.description||'—'},{l:'Website',v:program.website?<a href={program.website} target="_blank" rel="noopener noreferrer" style={{color:T.ink,fontWeight:600,fontSize:13,textDecoration:'underline',textUnderlineOffset:3}}>{program.website}</a>:'—'},{l:'Contact',v:program.contactEmail||'—'},{l:'Booking',v:program.calendlyLink?<a href={program.calendlyLink} target="_blank" rel="noopener noreferrer" style={{color:T.ink,fontWeight:600,fontSize:13,textDecoration:'underline',textUnderlineOffset:3}}>{program.calendlyLink}</a>:'—'},{l:'Last digest',v:program.lastDigestSentAt?new Date(program.lastDigestSentAt).toLocaleString():'Not yet sent'}].map(({l,v})=>(
                <div key={l}><div style={{fontSize:9,fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',color:T.pebble,marginBottom:4}}>{l}</div><div style={{fontSize:13,color:T.slate,wordBreak:'break-all',lineHeight:1.5,fontWeight:300}}>{v}</div></div>
              ))}
            </div>
            {program.rewards?.length>0&&(
              <div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${T.fog}`}}>
                <div style={{fontSize:9,fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',color:T.pebble,marginBottom:10}}>Rewards</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:7}}>{program.rewards.map(r=><span key={r} style={{padding:'7px 12px',background:T.ink,color:T.white,borderRadius:5,fontSize:12,fontWeight:400}}>{r}</span>)}</div>
              </div>
            )}
          </Card>
          <div style={{background:T.fog,border:`1px solid ${T.mist}`,borderRadius:8,padding:'11px 16px',display:'flex',gap:9,alignItems:'flex-start'}}>
            <span style={{fontSize:12,flexShrink:0}}>📬</span>
            <p style={{fontSize:12,color:T.ash,lineHeight:1.6,fontWeight:300}}>Stats digest emails land every 2 days at <strong style={{fontWeight:600,color:T.slate}}>{program.email}</strong></p>
          </div>
        </div>
      )}
      {tab==='sharers'&&(
        <div className="aFadeUp">
          <Card icon="👥" title={`Referrers (${sharers.length})`} sub="People who created personal links from your program" pad={false}>
            <div style={{padding:'0 18px'}}>
              {sharers.length===0?<div style={{padding:'36px 0',textAlign:'center',color:T.pebble,fontSize:13,fontWeight:300}}>No referrers yet — share your link to get the first ones in.</div>:sharers.map(s=>(
                <div key={s.code} className="sharer-row">
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:T.ink,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,color:T.white,flexShrink:0}}>{s.name[0].toUpperCase()}</div>
                    <div><div style={{fontSize:13,fontWeight:500,color:T.ink}}>{s.name}</div><div style={{fontSize:11,color:T.pebble,marginTop:1}}>{timeAgo(s.createdAt)}</div></div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:7}}>
                    <code className="sharer-code" style={{fontSize:10,color:T.pebble,fontFamily:F.mono,background:T.fog,padding:'3px 7px',borderRadius:4,maxWidth:170,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.link}</code>
                    <CopyBtn text={s.link}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      {tab==='link'&&<div className="aFadeUp"><Card icon="🔗" title="Share your program" sub="The more you share, the more referrers you recruit"><ShareActions link={program.programLink} shareText={shareText} programName={program.companyName}/></Card></div>}
      {tab==='edit'&&(
        <div className="aFadeUp">
          <div style={{marginBottom:20}}><div style={{fontSize:14,fontWeight:600,color:T.ink,marginBottom:4}}>Edit your program</div><p style={{fontSize:13,color:T.ash,fontWeight:300}}>Changes are live immediately — your referral link stays the same.</p></div>
          <EditForm initial={program} auth={auth} onSaved={handleSaved}/>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ADMIN PAGE (/admin) — public stats dashboard ─────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function AdminPage() {
  const [stats, setStats] = useState(null);
  const [load,  setLoad]  = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/admin/stats`);
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Failed to load stats');
        setStats(d);
      } catch (e) { setError(e.message); }
      finally { setLoad(false); }
    })();
  }, []);

  // Animated counter hook
  function useCountUp(target, duration = 1400) {
    const [val, setVal] = useState(0);
    useEffect(() => {
      if (!target) return;
      let start = null;
      const step = ts => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        // ease out expo
        const ease = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setVal(Math.floor(ease * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, [target]);
    return val;
  }

  function StatCard({ value, label, icon, sub, accent }) {
    const display = useCountUp(typeof value === 'number' ? value : 0);
    return (
      <div style={{
        background: T.white, border: `1px solid ${T.mist}`, borderRadius: 16,
        padding: '36px 32px', position: 'relative', overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,.04)',
        transition: 'box-shadow .2s, transform .2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {/* Accent blob */}
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 110, height: 110, borderRadius: '50%',
          background: accent || T.ink, opacity: .05, pointerEvents: 'none',
        }}/>
        <div style={{ fontSize: 22, marginBottom: 14 }}>{icon}</div>
        <div style={{
          fontFamily: F.display, fontStyle: 'italic',
          fontSize: 'clamp(48px, 7vw, 72px)', fontWeight: 300,
          color: T.ink, lineHeight: 1, marginBottom: 8, letterSpacing: '-.03em',
        }}>
          {typeof value === 'number' ? display.toLocaleString() : value}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 4, letterSpacing: '-.01em' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: T.pebble, fontWeight: 400 }}>{sub}</div>}
      </div>
    );
  }

  function MiniStatRow({ label, value }) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 0', borderBottom: `1px solid ${T.fog}`,
      }}>
        <span style={{ fontSize: 13, color: T.ash, fontWeight: 400 }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: T.ink, fontFamily: F.display, fontStyle: 'italic' }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.cream }}>
      {/* Hero bar */}
      <div style={{
        background: T.black, padding: '52px 40px 44px',
        borderBottom: `1px solid rgba(255,255,255,.06)`,
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 2, background: 'rgba(255,255,255,.2)' }}/>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)' }}>
              Platform stats · Live
            </span>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.emerald, animation: 'pulse 2.2s ease-in-out infinite' }}/>
          </div>
          <h1 className="aFadeUp" style={{
            fontFamily: F.display, fontStyle: 'italic',
            fontSize: 'clamp(44px, 8vw, 80px)', fontWeight: 300,
            color: T.white, lineHeight: .9, letterSpacing: '-.03em', marginBottom: 14,
          }}>
            RecommendEasy<br/>by the numbers.
          </h1>
          <p className="aFadeUp1" style={{ fontSize: 15, color: 'rgba(255,255,255,.4)', fontWeight: 300, maxWidth: 420 }}>
            Real-time platform metrics. Updated every page load.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '52px 40px 80px' }}>

        {load && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: T.pebble, fontSize: 13, padding: '48px 0' }}>
            <SpinnerDark/> Loading stats…
          </div>
        )}

        {error && (
          <div style={{ padding: '48px 0' }}>
            <ErrBanner msg={error}/>
          </div>
        )}

        {stats && !load && (
          <>
            {/* Primary stat cards */}
            <div className="aFadeUp" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16, marginBottom: 32,
            }}>
              <StatCard
                value={stats.totalFounders}
                label="Founders on platform"
                icon="🚀"
                sub="Referral programs created"
                accent="#1A1916"
              />
              <StatCard
                value={stats.totalPageViews}
                label="Total page views"
                icon="👁"
                sub="Across all referral programs"
                accent="#7C3AED"
              />
              <StatCard
                value={stats.totalReferrers}
                label="Active referrers"
                icon="🔗"
                sub="Unique sharers with personal links"
                accent="#166534"
              />
              <StatCard
                value={stats.totalInfluencers}
                label="Influencer pages"
                icon="✨"
                sub="Brand affiliate pages live"
                accent="#DC2626"
              />
            </div>

            {/* Secondary breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Platform breakdown */}
              <div style={{ background: T.white, border: `1px solid ${T.mist}`, borderRadius: 12, padding: '24px 24px 8px', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: T.pebble, marginBottom: 16 }}>
                  Platform breakdown
                </div>
                <MiniStatRow label="Referral programs" value={stats.totalFounders} />
                <MiniStatRow label="Total sharers" value={stats.totalReferrers} />
                <MiniStatRow label="Simulated visits" value={stats.totalPageViews} />
                <MiniStatRow label="Influencer pages" value={stats.totalInfluencers} />
                <MiniStatRow label="Brands available" value={stats.totalBrands} />
                <div style={{ height: 16 }}/>
              </div>

              {/* Milestones / recent activity */}
              <div style={{ background: T.ink, border: `1px solid rgba(255,255,255,.06)`, borderRadius: 12, padding: '24px 24px 8px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 16 }}>
                  Milestones
                </div>
                {[
                  { label: 'Avg. referrers per program', value: stats.totalFounders > 0 ? (stats.totalReferrers / stats.totalFounders).toFixed(1) : '0' },
                  { label: 'Avg. views per program',     value: stats.totalFounders > 0 ? Math.round(stats.totalPageViews / stats.totalFounders).toLocaleString() : '0' },
                  { label: 'Platform launched',          value: '2026' },
                  { label: 'Setup time',                 value: '< 3 min' },
                  { label: 'Lines of code required',     value: '0' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', fontWeight: 400 }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: T.white, fontFamily: F.display, fontStyle: 'italic' }}>{value}</span>
                  </div>
                ))}
                <div style={{ height: 16 }}/>
              </div>

            </div>

            {/* CTA strip */}
            <div style={{
              marginTop: 32, background: T.fog, border: `1px solid ${T.mist}`,
              borderRadius: 12, padding: '24px 28px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.ink, marginBottom: 3 }}>Want to be part of these numbers?</div>
                <p style={{ fontSize: 13, color: T.ash, fontWeight: 300 }}>Create your referral program in under 3 minutes — free forever.</p>
              </div>
              <a href="/" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 22px', background: T.ink, color: T.white,
                borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                flexShrink: 0,
              }}>
                Create my program →
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── INFLUENCER SIGNUP PAGE (/influencer) ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function InfluencerSignup() {
  const[name,setName]=useState('');
  const[username,setUsername]=useState('');
  const[selectedBrands,setSelectedBrands]=useState([]);
  const[search,setSearch]=useState('');
  const[loading,setLoad]=useState(false);
  const[error,setError]=useState('');
  const[fErr,setFErr]=useState({});
  const[done,setDone]=useState(false);
  const[pageUrl,setPageUrl]=useState('');

  const filtered=BRANDS.filter(b=>b.name.toLowerCase().includes(search.toLowerCase()));

  const toggleBrand=id=>{
    setSelectedBrands(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  };
 
  const submit=async e=>{
    e.preventDefault();
    const errs={};
    if(!name.trim()) errs.name='Full name is required';
    if(!username.trim()) errs.username='Username is required';
    else if(!/^[a-z0-9_-]+$/i.test(username.trim())) errs.username='Username can only contain letters, numbers, _ and -';
    if(selectedBrands.length===0) errs.brands='Select at least one brand';
    setFErr(errs);
    if(Object.keys(errs).length) return;
    setLoad(true);setError('');
    try {
      const r=await fetch(`${API_BASE}/influencer/register`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name:name.trim(),username:username.trim().toLowerCase(),brandIds:selectedBrands}),
      });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||'Failed to create page');
      setPageUrl(`${window.location.origin}/influencerpage/${username.trim().toLowerCase()}`);
      setDone(true);window.scrollTo({top:0,behavior:'smooth'});
    } catch(e){setError(e.message);}
    finally{setLoad(false);}
  };

  if(done) return (
    <div className="aFadeUp" style={{maxWidth:640,margin:'0 auto',padding:'64px 40px 80px'}}>
      <div style={{textAlign:'center',marginBottom:40}}>
        <div style={{width:56,height:56,borderRadius:'50%',background:T.accent,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',boxShadow:`0 4px 20px rgba(124,58,237,.3)`}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h1 style={{fontFamily:F.display,fontStyle:'italic',fontSize:'clamp(36px,7vw,56px)',fontWeight:300,color:T.ink,lineHeight:.95,letterSpacing:'-.025em',marginBottom:12}}>Your page is live.</h1>
        <p style={{fontSize:15,color:T.ash,fontWeight:300,lineHeight:1.7,maxWidth:420,margin:'0 auto 28px'}}>Share your link with your audience — every click earns you commission.</p>
        <div style={{display:'flex',alignItems:'center',gap:9,background:T.fog,border:`1.5px solid ${T.mist}`,borderRadius:8,padding:'12px 16px',marginBottom:20}}>
          <code style={{flex:1,fontSize:13,color:T.ink,fontFamily:F.mono,wordBreak:'break-all',fontWeight:500}}>{pageUrl}</code>
          <CopyBtn text={pageUrl}/>
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
          <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="btn-accent" style={{width:'auto',padding:'12px 24px',fontSize:14}}>
            View my page →
          </a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener noreferrer" className="sh-btn sh-li" style={{flex:'none',padding:'12px 20px',borderRadius:6,fontSize:13}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            Share on LinkedIn
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Hero */}
      <div className="inf-signup-hero">
        <div style={{maxWidth:720,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
            <div style={{width:28,height:2,background:'rgba(124,58,237,.6)'}}/>
            <span style={{fontSize:10,fontWeight:600,letterSpacing:'.14em',textTransform:'uppercase',color:'rgba(255,255,255,.4)'}}>Influencer program</span>
          </div>
          <h1 className="aFadeUp" style={{fontFamily:F.display,fontSize:'clamp(44px,8vw,80px)',fontWeight:300,fontStyle:'italic',color:T.white,lineHeight:.9,letterSpacing:'-.03em',marginBottom:20}}>
            Get paid to<br/>recommend brands.
          </h1>
          <p className="aFadeUp1" style={{fontSize:16,color:'rgba(255,255,255,.5)',lineHeight:1.7,maxWidth:420,fontWeight:300}}>
            Pick the brands you love. Get your personal page. Earn 10–20% commission on every sale.
          </p>
          <div className="aFadeUp2" style={{display:'flex',gap:20,marginTop:28,flexWrap:'wrap'}}>
            {[{n:'32+',l:'Brands'},{n:'10–20%',l:'Commission'},{n:'Instant',l:'Setup'}].map((s,i)=>(
              <div key={i} style={{textAlign:'center'}}>
                <div style={{fontFamily:F.display,fontStyle:'italic',fontSize:28,fontWeight:300,color:T.white,lineHeight:1}}>{s.n}</div>
                <div style={{fontSize:10,fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,.3)',marginTop:3}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{maxWidth:720,margin:'0 auto',padding:'48px 40px 80px'}}>
        <ErrBanner msg={error}/>
        <form onSubmit={submit} noValidate>

          {/* Identity */}
          <div style={{marginBottom:28}}>
            <div style={{fontSize:14,fontWeight:600,color:T.ink,marginBottom:4}}>Your identity</div>
            <p style={{fontSize:13,color:T.ash,fontWeight:300,marginBottom:20}}>This is how you'll appear to your audience.</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <FG label="Full Name" req err={fErr.name}>
                <input className={`fi${fErr.name?' err':''}`} placeholder="Your full name" value={name} onChange={e=>{setName(e.target.value);setFErr(p=>({...p,name:''}));}} autoFocus/>
              </FG>
              <FG label="Username" req err={fErr.username}>
                <div style={{position:'relative'}}>
                  <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:14,color:T.pebble,fontWeight:500,pointerEvents:'none'}}>@</span>
                  <input className={`fi${fErr.username?' err':''}`} style={{paddingLeft:28}} placeholder="yourhandle" value={username}
                    onChange={e=>{setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g,''));setFErr(p=>({...p,username:''}));}}
                    autoCapitalize="none"/>
                </div>
                {username&&!fErr.username&&<div style={{fontSize:11,color:T.pebble,marginTop:4}}>Your page: /influencerpage/{username}</div>}
              </FG>
            </div>
          </div>

          {/* Brand selection */}
          <div style={{marginBottom:32}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4,flexWrap:'wrap',gap:8}}>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:T.ink}}>Choose your brands</div>
                <p style={{fontSize:13,color:T.ash,fontWeight:300,marginTop:2}}>Select every brand you want to feature on your page.</p>
              </div>
              {selectedBrands.length>0&&<div style={{fontSize:12,fontWeight:600,color:T.accent,background:T.accentBg,border:`1px solid ${T.accentBorder}`,borderRadius:100,padding:'4px 12px'}}>{selectedBrands.length} selected</div>}
            </div>
            {fErr.brands&&<div className="field-err" style={{marginBottom:10}}>⚠ {fErr.brands}</div>}

            {/* Search */}
            <div style={{position:'relative',marginBottom:16}}>
              <svg style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:T.pebble}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input className="fi" style={{paddingLeft:36}} placeholder="Search brands…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>

            <div className="brand-grid">
              {filtered.map(brand=>{
                const sel=selectedBrands.includes(brand.id);
                return (
                  <div key={brand.id} className={`brand-card${sel?' selected':''}`} onClick={()=>toggleBrand(brand.id)}>
                    {sel&&<div className="brand-check">✓</div>}
                    <img
                      className="brand-logo"
                      src={brand.logo}
                      alt={brand.name}
                      onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}}
                    />
                    <div style={{display:'none',width:44,height:44,background:sel?'rgba(255,255,255,.15)':T.fog,borderRadius:8,alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:sel?T.white:T.ash}}>
                      {brand.name[0]}
                    </div>
                    <span className="brand-name">{brand.name}</span>
                    <span className="brand-comm">{brand.commission}% commission</span>
                  </div>
                );
              })}
              {filtered.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:'32px 0',color:T.pebble,fontSize:13,fontWeight:300}}>No brands match "{search}"</div>}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-accent">
            {loading?<><Spinner/> Creating your page…</>:<>Create my influencer page →</>}
          </button>
          <p style={{textAlign:'center',fontSize:11,color:T.pebble,marginTop:10,fontWeight:300}}>Free forever · Your page goes live instantly</p>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── INFLUENCER PUBLIC PAGE (/influencerpage/:username) ───────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function InfluencerPublicPage({ username }) {
  const[data,setData]=useState(null);
  const[load,setLoad]=useState(true);
  const[error,setError]=useState('');

  useEffect(()=>{
    (async()=>{
      try {
        const r=await fetch(`${API_BASE}/influencer/${username}`);
        const d=await r.json();
        if(!r.ok) throw new Error(d.error||'Page not found');
        setData(d);
      }catch(e){setError(e.message);}
      finally{setLoad(false);}
    })();
  },[username]);

  if(load) return <div style={{display:'flex',alignItems:'center',gap:12,color:T.pebble,fontSize:13,padding:'80px 40px'}}><SpinnerDark/> Loading page…</div>;
  if(error) return (
    <div style={{maxWidth:480,margin:'80px auto',padding:'0 40px',textAlign:'center'}}>
      <div style={{fontSize:48,marginBottom:16}}>🔍</div>
      <h2 style={{fontFamily:F.display,fontStyle:'italic',fontSize:32,fontWeight:300,color:T.ink,marginBottom:8}}>Page not found</h2>
      <p style={{fontSize:14,color:T.ash,fontWeight:300}}>@{username} hasn't set up their influencer page yet.</p>
      <a href="/influencer" style={{display:'inline-flex',marginTop:20,padding:'12px 24px',background:T.accent,color:T.white,borderRadius:6,fontSize:13,fontWeight:600,textDecoration:'none'}}>Create your page →</a>
    </div>
  );

  const{influencer,brands}=data;

  return (
    <div>
      {/* Hero */}
      <div className="inf-hero">
        <div style={{maxWidth:760,margin:'0 auto',position:'relative',zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:24}}>
            <div style={{width:52,height:52,borderRadius:'50%',background:`linear-gradient(135deg,${T.accent},#a855f7)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:600,color:T.white,boxShadow:`0 4px 20px rgba(124,58,237,.4)`,flexShrink:0}}>
              {influencer.name[0].toUpperCase()}
            </div>
            <div>
              <h1 style={{fontFamily:F.display,fontStyle:'italic',fontSize:'clamp(32px,6vw,52px)',fontWeight:300,color:T.white,lineHeight:.95,letterSpacing:'-.02em'}}>{influencer.name}</h1>
              <div style={{fontSize:13,color:'rgba(255,255,255,.4)',marginTop:4,fontWeight:300}}>@{influencer.username}</div>
            </div>
          </div>
          <p style={{fontSize:15,color:'rgba(255,255,255,.55)',fontWeight:300,lineHeight:1.6,maxWidth:420,marginBottom:24}}>
            My curated collection of brands I use and recommend. Click any to shop & support my work.
          </p>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            <div style={{padding:'6px 14px',background:'rgba(124,58,237,.2)',border:'1px solid rgba(124,58,237,.3)',borderRadius:100,fontSize:11,fontWeight:600,color:'rgba(255,255,255,.7)',letterSpacing:'.06em'}}>
              {brands.length} BRANDS
            </div>
            <div style={{padding:'6px 14px',background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:100,fontSize:11,fontWeight:600,color:'rgba(255,255,255,.4)',letterSpacing:'.06em'}}>
              10–20% COMMISSION
            </div>
          </div>
        </div>
      </div>

      {/* Brands grid */}
      <div style={{maxWidth:760,margin:'0 auto',padding:'48px 40px 80px'}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:'.12em',textTransform:'uppercase',color:T.pebble,marginBottom:20,display:'flex',alignItems:'center',gap:10}}>
          Recommended brands
          <span style={{flex:1,height:1,background:T.mist,display:'block'}}/>
        </div>

        <div className="inf-brand-grid">
          {brands.map(brand=>(
            <a key={brand.id} className="inf-brand-tile" href={brand.url} target="_blank" rel="noopener noreferrer">
              <img
                className="inf-brand-tile-logo"
                src={brand.logo}
                alt={brand.name}
                onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}}
              />
              <div style={{display:'none',width:52,height:52,background:T.fog,borderRadius:8,alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:T.ash}}>
                {brand.name[0]}
              </div>
              <div className="inf-brand-tile-name">{brand.name}</div>
              <div className="inf-brand-tile-comm">{brand.commission}% commission</div>
              <div className="inf-brand-tile-cta">
                Shop now
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </a>
          ))}
        </div>

        <div style={{marginTop:48,padding:'20px 24px',background:T.fog,border:`1px solid ${T.mist}`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:T.ink,marginBottom:2}}>Want your own page?</div>
            <p style={{fontSize:12,color:T.ash,fontWeight:300}}>Set up your influencer page in under 2 minutes — it's free.</p>
          </div>
          <a href="/influencer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'10px 20px',background:T.accent,color:T.white,borderRadius:6,fontSize:13,fontWeight:600,textDecoration:'none',flexShrink:0}}>
            Create mine →
          </a>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Root App ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const[mode,setMode]=useState('create');
  const[code,setCode]=useState(null);
  const[program,setProgram]=useState(null);
  const[loading,setLoad]=useState(false);
  const[error,setError]=useState('');
  const[success,setSuccess]=useState(false);
  const[link,setLink]=useState('');
  const[showSignIn,setSI]=useState(false);
  const[fErr,setFErr]=useState({});
  const[gcAmt,setGcAmt]=useState({});
  const[auth,setAuth]=useState(()=>loadAuth());
  const[prefill,setPrefill]=useState(null);
  const[prefillLoading,setPrefillLoad]=useState(false);
  const[influencerUsername,setInfluencerUsername]=useState(null);

  const[cd,setCd]=useState({username:'',email:'',password:'',companyName:'',descAbout:'',descFeat1:'',descFeat2:'',descFeat3:'',website:'',rewards:[],audience:[],contactEmail:'',calendlyLink:''});
  const[sharerName,setSharerName]=useState('');

  useEffect(()=>{
    const path=window.location.pathname;
    // Admin stats page
    if(path==='/admin'||path==='/admin/'){setMode('admin');return;}
    // Influencer public page
    if(path.startsWith('/influencerpage/')) {
      const uname=path.split('/influencerpage/')[1]?.split('/')[0]?.trim();
      if(uname){setInfluencerUsername(uname);setMode('influencer-page');return;}
    }
    // Influencer signup
    if(path==='/influencer'||path==='/influencer/'){setMode('influencer-signup');return;}
    // Referral public page
    if(path.startsWith('/refer/')){
      const c=path.split('/refer/')[1]?.trim();
      if(c){setCode(c);setMode('public');loadProgram(c);}
      return;
    }
    const q=new URLSearchParams(window.location.search);
    if((path==='/dashboard'||q.get('signin')==='1')&&auth){setMode('dashboard');return;}
    if(auth&&path==='/') loadPrefill(auth);
  },[]);

  const loadPrefill=async authData=>{
    setPrefillLoad(true);
    try{
      const r=await fetch(`${API_BASE}/dashboard/${authData.referralCode}?token=${authData.token}`);
      const d=await r.json();
      if(!r.ok) return;
      const p=d.program;
      const{selected,gcAmounts}=expandRewards(p.rewards||[]);
      const desc=splitDescription(p.description||'');
      setPrefill(p);
      setCd({username:p.username||'',email:p.email||'',password:'',companyName:p.companyName||'',descAbout:desc.about,descFeat1:desc.feat1,descFeat2:desc.feat2,descFeat3:desc.feat3,website:(p.website||'').replace(/^https?:\/\//,''),rewards:selected,audience:p.audience||[],contactEmail:p.contactEmail||'',calendlyLink:(p.calendlyLink||'').replace(/^https?:\/\//,'')});
      setGcAmt(gcAmounts);
    }catch(e){}
    finally{setPrefillLoad(false);}
  };

  const loadProgram=async c=>{
    setLoad(true);setError('');
    try{
      const r=await fetch(`${API_BASE}/${c}`);
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||'Program not found');
      setProgram(d.program);
    }catch(e){setError(e.message);}
    finally{setLoad(false);}
  };

  const handleChange=e=>{
    const{name,value,checked}=e.target;
    if(name==='rewards') setCd(p=>({...p,rewards:checked?[...p.rewards,value]:p.rewards.filter(r=>r!==value)}));
    else if(name==='audience') setCd(p=>({...p,audience:checked?[...p.audience,value]:p.audience.filter(a=>a!==value)}));
    else setCd(p=>({...p,[name]:value}));
    if(fErr[name]) setFErr(p=>({...p,[name]:''}));
    setError('');
  };
  const handleDescChange=(key,val)=>{setCd(p=>({...p,[`desc${key.charAt(0).toUpperCase()+key.slice(1)}`]:val}));setError('');};
  const finalRewards=()=>cd.rewards.map(r=>GIFT_CARD_REWARDS.includes(r)&&gcAmt[r]?`${r} ($${gcAmt[r]})`:r);

  const validate=(isUpdate=false)=>{
    const e={};
    if(!cd.username.trim()) e.username='Username required';
    if(!isUpdate&&!cd.email.trim()) e.email='Email required';
    if(!isUpdate&&!cd.password) e.password='Password required';
    if(!cd.companyName.trim()) e.companyName='Company name required';
    if(!cd.descAbout.trim()) e.descAbout='About is required';
    if(!cd.rewards.length) e.rewards='Pick at least one reward';
    for(const r of cd.rewards) if(GIFT_CARD_REWARDS.includes(r)&&!gcAmt[r]) e[`gc_${r}`]=`Amount required for ${r}`;
    setFErr(e);return!Object.keys(e).length;
  };

  const isUpdate=!!prefill&&!!auth;

  const createProgram=async e=>{
    e.preventDefault();
    if(!validate(isUpdate)){document.getElementById('form-anchor')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    setLoad(true);setError('');
    try{
      const description=joinDescription({about:cd.descAbout,feat1:cd.descFeat1,feat2:cd.descFeat2,feat3:cd.descFeat3});
      if(isUpdate){
        const payload={username:cd.username,companyName:cd.companyName,description,website:fixUrl(cd.website),calendlyLink:fixUrl(cd.calendlyLink),rewards:finalRewards(),audience:cd.audience,contactEmail:cd.contactEmail};
        const r=await fetch(`${API_BASE}/dashboard/${auth.referralCode}?token=${auth.token}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const d=await r.json();
        if(!r.ok) throw new Error(d.error||'Failed to update');
        const programLink=`${window.location.origin}/refer/${auth.referralCode}`;
        setLink(programLink);setSuccess(true);window.scrollTo({top:0,behavior:'smooth'});
      } else {
        const payload={...cd,description,website:fixUrl(cd.website),calendlyLink:fixUrl(cd.calendlyLink),rewards:finalRewards()};
        delete payload.descAbout;delete payload.descFeat1;delete payload.descFeat2;delete payload.descFeat3;
        const r=await fetch(`${API_BASE}/register-program`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const d=await r.json();
        if(!r.ok) throw new Error(d.error||'Failed to create');
        if(d.token&&d.referralCode){const authData={token:d.token,referralCode:d.referralCode};saveAuth(authData);setAuth(authData);}
        setLink(getShareLink(d.programLink));setSuccess(true);window.scrollTo({top:0,behavior:'smooth'});
      }
    }catch(e){setError(e.message);}
    finally{setLoad(false);}
  };

  const submitShare=async e=>{
    e.preventDefault();
    if(!sharerName.trim()){setFErr({sharerName:'Name required'});return;}
    setLoad(true);setError('');
    try{
      const r=await fetch(`${API_BASE}/${code}/share`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:sharerName.trim()})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||'Failed');
      setLink(getShareLink(d.personalShareLink));setSuccess(true);window.scrollTo({top:0,behavior:'smooth'});
    }catch(e){setError(e.message);}
    finally{setLoad(false);}
  };

  const signInOk=d=>{saveAuth(d);setAuth(d);setSI(false);setMode('dashboard');};
  const signOut=()=>{clearAuth();setAuth(null);setPrefill(null);setMode('create');setCd({username:'',email:'',password:'',companyName:'',descAbout:'',descFeat1:'',descFeat2:'',descFeat3:'',website:'',rewards:[],audience:[],contactEmail:'',calendlyLink:''});setGcAmt({});};
  const handleDashboardSaved=updates=>setPrefill(prev=>prev?{...prev,...updates}:prev);

  const descValues={about:cd.descAbout,feat1:cd.descFeat1,feat2:cd.descFeat2,feat3:cd.descFeat3};
  const descErrors={about:fErr.descAbout};
  const creatorText=buildShareText({...cd,rewards:finalRewards(),description:joinDescription({about:cd.descAbout,feat1:cd.descFeat1,feat2:cd.descFeat2,feat3:cd.descFeat3})},cd.username,link,true);
  const publicText=buildShareText(program,sharerName,link,false);

  // ── ADMIN PAGE ──
  if(mode==='admin') {
    return (
      <>
        <style>{CSS}</style>
        <div style={{minHeight:'100vh',background:T.cream,fontFamily:F.body,color:T.ink}}>
          <nav className="nav">
            <div className="nav-inner">
              <a href="/" className="nav-logo"><em>Recommend</em><strong>Easy</strong></a>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <a href="/" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',background:'transparent',border:`1.5px solid ${T.mist}`,borderRadius:6,color:T.ash,fontSize:12,fontWeight:500,textDecoration:'none',cursor:'pointer'}}>← Home</a>
                <div className="nav-live"><span className="nav-live-dot"/>Live</div>
              </div>
            </div>
          </nav>
          <AdminPage/>
          <footer style={{background:T.black,padding:'22px 32px'}}>
            <div style={{maxWidth:900,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
              <div style={{fontFamily:F.display,fontSize:16,color:'rgba(255,255,255,.6)',fontWeight:300,fontStyle:'italic'}}>Recommend<strong style={{fontWeight:600}}>Easy</strong><span style={{marginLeft:12,fontSize:11,color:'rgba(255,255,255,.25)',fontFamily:F.body}}>© 2026</span></div>
            </div>
          </footer>
        </div>
      </>
    );
  }

  // Influencer modes — no main nav chrome needed
  if(mode==='influencer-page'&&influencerUsername) {
    return (
      <>
        <style>{CSS}</style>
        <div style={{minHeight:'100vh',background:T.cream,fontFamily:F.body,color:T.ink}}>
          <nav className="nav">
            <div className="nav-inner">
              <a href="/" className="nav-logo"><em>Recommend</em><strong>Easy</strong></a>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <a href="/influencer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',background:T.accent,color:T.white,border:'none',borderRadius:6,fontSize:12,fontWeight:600,textDecoration:'none',cursor:'pointer'}}>Become an influencer</a>
                <div className="nav-live"><span className="nav-live-dot"/>Live</div>
              </div>
            </div>
          </nav>
          <InfluencerPublicPage username={influencerUsername}/>
          <footer style={{background:T.black,padding:'22px 32px'}}>
            <div style={{maxWidth:900,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
              <div style={{fontFamily:F.display,fontSize:16,color:'rgba(255,255,255,.6)',fontWeight:300,fontStyle:'italic'}}>Recommend<strong style={{fontWeight:600}}>Easy</strong><span style={{marginLeft:12,fontSize:11,color:'rgba(255,255,255,.25)',fontFamily:F.body}}>© 2026</span></div>
              <a href="/influencer" style={{fontSize:12,color:'rgba(255,255,255,.4)',textDecoration:'none',fontWeight:400}} onMouseEnter={e=>e.target.style.color='rgba(255,255,255,.8)'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.4)'}>← Create your own influencer page</a>
            </div>
          </footer>
        </div>
      </>
    );
  }

  if(mode==='influencer-signup') {
    return (
      <>
        <style>{CSS}</style>
        <div style={{minHeight:'100vh',background:T.cream,fontFamily:F.body,color:T.ink}}>
          <nav className="nav">
            <div className="nav-inner">
              <a href="/" className="nav-logo"><em>Recommend</em><strong>Easy</strong></a>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {auth?<button onClick={()=>setMode('dashboard')} className="btn-primary" style={{width:'auto',padding:'8px 16px',fontSize:12,borderRadius:6}}>Dashboard →</button>:<button onClick={()=>setSI(true)} className="btn-ghost">Sign in</button>}
                <div className="nav-live"><span className="nav-live-dot"/>Live</div>
              </div>
            </div>
          </nav>
          {showSignIn&&<SignInModal onClose={()=>setSI(false)} onSuccess={signInOk}/>}
          <InfluencerSignup/>
          <footer style={{background:T.black,padding:'22px 32px'}}>
            <div style={{maxWidth:900,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
              <div style={{fontFamily:F.display,fontSize:16,color:'rgba(255,255,255,.6)',fontWeight:300,fontStyle:'italic'}}>Recommend<strong style={{fontWeight:600}}>Easy</strong><span style={{marginLeft:12,fontSize:11,color:'rgba(255,255,255,.25)',fontFamily:F.body}}>© 2026</span></div>
              <a href="/" style={{fontSize:12,color:'rgba(255,255,255,.4)',textDecoration:'none'}} onMouseEnter={e=>e.target.style.color='rgba(255,255,255,.8)'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.4)'}>← Back to main site</a>
            </div>
          </footer>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{minHeight:'100vh',background:T.cream,fontFamily:F.body,color:T.ink}}>
        <nav className="nav">
          <div className="nav-inner">
            <button className="nav-logo" onClick={()=>{setMode('create');setSuccess(false);}}><em>Recommend</em><strong>Easy</strong></button>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {mode==='dashboard'?<button onClick={signOut} className="btn-ghost">Sign out</button>:auth?<button onClick={()=>setMode('dashboard')} className="btn-primary" style={{width:'auto',padding:'8px 16px',fontSize:12,borderRadius:6}}>Dashboard →</button>:<button onClick={()=>setSI(true)} className="btn-ghost">Sign in</button>}
              <div className="nav-live"><span className="nav-live-dot"/>Live</div>
            </div>
          </div>
        </nav>
        {showSignIn&&<SignInModal onClose={()=>setSI(false)} onSuccess={signInOk}/>}

        {mode==='dashboard'&&auth&&<Dashboard auth={auth} onSignOut={signOut} onProgramUpdated={handleDashboardSaved}/>}

        {mode==='create'&&!success&&(
          <>
            {!isUpdate&&<Hero onCreate={()=>document.getElementById('form-anchor')?.scrollIntoView({behavior:'smooth',block:'start'})} onSignIn={()=>setSI(true)}/>}
            {isUpdate&&(
              <div style={{background:T.fog,borderBottom:`1px solid ${T.mist}`,padding:'16px 32px'}}>
                <div style={{maxWidth:680,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                  <div><span style={{fontSize:13,fontWeight:600,color:T.ink}}>Editing your program</span><span style={{fontSize:12,color:T.ash,marginLeft:10,fontWeight:300}}>Changes save immediately on submit</span></div>
                  <button onClick={()=>setMode('dashboard')} className="btn-ghost" style={{fontSize:12}}>← Back to dashboard</button>
                </div>
              </div>
            )}
            <div id="form-anchor" className="form-pad" style={{maxWidth:680,margin:'0 auto',padding:isUpdate?'32px 40px 80px':'0 40px 80px'}}>
              {prefillLoading&&<div style={{display:'flex',gap:10,alignItems:'center',color:T.pebble,fontSize:13,padding:'32px 0',fontWeight:300}}><SpinnerDark/> Loading your program details…</div>}
              {!prefillLoading&&(
                <>
                  <ErrBanner msg={error}/>
                  <form onSubmit={createProgram} noValidate className="aFadeUp">
                    <Card icon="◎" title={isUpdate?'Your details':'Account'} sub={isUpdate?'Update your display name':'Your login credentials'}>
                      <FG label="Display name" req err={fErr.username}><input className={`fi${fErr.username?' err':''}`} name="username" placeholder="yourhandle" value={cd.username} onChange={handleChange} autoCapitalize="none"/></FG>
                      {!isUpdate&&(<>
                        <FG label="Email" req err={fErr.email}><input className={`fi${fErr.email?' err':''}`} name="email" type="email" placeholder="you@company.com" value={cd.email} onChange={handleChange} inputMode="email" autoCapitalize="none"/></FG>
                        <FG label="Password" req err={fErr.password}><input className={`fi${fErr.password?' err':''}`} name="password" type="password" placeholder="Create a password" value={cd.password} onChange={handleChange}/></FG>
                      </>)}
                      {isUpdate&&<div style={{padding:'9px 12px',background:T.fog,border:`1px solid ${T.mist}`,borderRadius:6,fontSize:12,color:T.ash,fontWeight:300}}>Signed in as <strong style={{fontWeight:600,color:T.slate}}>{prefill.email}</strong><span style={{color:T.stone,margin:'0 8px'}}>·</span><button type="button" onClick={()=>setSI(true)} style={{background:'none',border:'none',color:T.ink,fontSize:12,fontWeight:600,cursor:'pointer',padding:0,textDecoration:'underline',textUnderlineOffset:2}}>Change account</button></div>}
                    </Card>
                    <Card icon="◈" title="Program Details" sub="What you're offering and who it's for">
                      <FG label="Company Name" req err={fErr.companyName}><input className={`fi${fErr.companyName?' err':''}`} name="companyName" placeholder="Acme Inc." value={cd.companyName} onChange={handleChange}/></FG>
                      <DescriptionFields values={descValues} onChange={handleDescChange} errors={descErrors}/>
                      <FG label="Website" opt><input className="fi" name="website" placeholder="yourcompany.com" value={cd.website} onChange={handleChange} inputMode="url" autoCapitalize="none"/><div style={{fontSize:11,color:T.stone,marginTop:4}}>https:// added automatically</div></FG>
                      <FG label="Rewards" req err={fErr.rewards}>
                        <CheckGrid options={REWARD_OPTIONS} selected={cd.rewards} name="rewards" onChange={handleChange}/>
                        {cd.rewards.filter(r=>GIFT_CARD_REWARDS.includes(r)).map(r=>(
                          <div key={r}><GiftRow reward={r} value={gcAmt[r]||''} onChange={v=>setGcAmt(p=>({...p,[r]:v}))}/>{fErr[`gc_${r}`]&&<div className="field-err">⚠ {fErr[`gc_${r}`]}</div>}</div>
                        ))}
                      </FG>
                      <FG label="Target Audience" opt><CheckGrid options={AUDIENCE_OPTIONS} selected={cd.audience} name="audience" onChange={handleChange}/></FG>
                      <FG label="Contact Email" opt><input className="fi" name="contactEmail" type="email" placeholder="hello@yourcompany.com" value={cd.contactEmail} onChange={handleChange} inputMode="email" autoCapitalize="none"/></FG>
                      <FG label="Booking / Calendly Link" opt><input className="fi" name="calendlyLink" placeholder="calendly.com/yourname" value={cd.calendlyLink} onChange={handleChange} inputMode="url" autoCapitalize="none"/><div style={{fontSize:11,color:T.stone,marginTop:4}}>https:// added automatically</div></FG>
                    </Card>
                    <button type="submit" disabled={loading} className="btn-primary">
                      {loading?<><Spinner/> {isUpdate?'Saving changes…':'Creating your program…'}</>:isUpdate?<>Save changes →</>:<>Create Program & Get Your Link →</>}
                    </button>
                    {!isUpdate&&<p style={{textAlign:'center',fontSize:11,color:T.pebble,marginTop:10,fontWeight:300}}>Free forever · Every visitor gets their own referral link automatically</p>}
                  </form>
                </>
              )}
            </div>
          </>
        )}

        {mode==='create'&&success&&(
          <div className="aFadeUp page-pad" style={{maxWidth:680,margin:'0 auto',padding:'64px 40px 80px'}}>
            <div style={{marginBottom:48,paddingBottom:48,borderBottom:`1px solid ${T.mist}`}}>
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:T.ink,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 2px 8px rgba(0,0,0,.18)'}}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <h1 style={{fontFamily:F.display,fontStyle:'italic',fontSize:'clamp(38px,7vw,60px)',fontWeight:300,color:T.ink,lineHeight:.95,letterSpacing:'-.025em'}}>{isUpdate?'Changes saved.':'You\'re live.'}</h1>
              </div>
              {isUpdate?<p style={{fontSize:15,color:T.ash,lineHeight:1.7,fontWeight:300}}>Your program has been updated. All your existing referral links still work.</p>:<p style={{fontSize:15,color:T.ash,lineHeight:1.7,fontWeight:300}}>Your referral program is active. A welcome email is heading to your inbox.</p>}
              <p style={{fontSize:12,color:T.pebble,marginTop:6}}>You're signed in — your session is saved for next time.</p>
            </div>
            <Card dark icon="✓" title={isUpdate?'Your updated link':'Share your program'} sub={isUpdate?'Share it again to reach new audiences':'The more channels you post on, the more referrers you recruit'}>
              <ShareActions link={link} shareText={creatorText} programName={cd.companyName}/>
            </Card>
            <div style={{textAlign:'center',marginTop:16,display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
              {isUpdate&&<button onClick={()=>{setSuccess(false);}} className="btn-secondary" style={{width:'auto',padding:'12px 22px'}}>← Edit again</button>}
              <button onClick={()=>setMode('dashboard')} className="btn-secondary" style={{width:'auto',padding:'12px 28px'}}>View dashboard →</button>
            </div>
          </div>
        )}

        {mode==='public'&&(
          <div className="page-pad" style={{maxWidth:620,margin:'0 auto',padding:'56px 40px 80px'}}>
            {loading&&!program&&<div style={{display:'flex',gap:12,alignItems:'center',color:T.pebble,fontSize:13,padding:'48px 0',fontWeight:300}}><SpinnerDark/> Loading program…</div>}
            <ErrBanner msg={error}/>
            {program&&!success&&(
              <div className="aFadeUp">
                <div style={{marginBottom:36,paddingBottom:36,borderBottom:`2px solid ${T.ink}`}}>
                  <div style={{fontSize:9,fontWeight:600,letterSpacing:'.16em',textTransform:'uppercase',color:T.pebble,marginBottom:12}}>You've been referred to</div>
                  <h1 style={{fontFamily:F.display,fontStyle:'italic',fontSize:'clamp(42px,9vw,72px)',fontWeight:300,lineHeight:.9,letterSpacing:'-.03em',color:T.ink,marginBottom:12}}>{program.companyName}</h1>
                  <p style={{fontSize:13,color:T.ash,fontWeight:300}}>via <strong style={{fontWeight:600,color:T.ink}}>{program.founderName||'a friend'}</strong></p>
                  {program.description&&(
                    <div style={{marginTop:14,maxWidth:440}}>
                      {program.description.split(/\n\n+/).map((para,i)=>(
                        <p key={i} style={{fontSize:i===0?15:14,color:i===0?T.slate:T.ash,lineHeight:1.7,fontWeight:300,marginBottom:i<program.description.split(/\n\n+/).length-1?10:0}}>{para}</p>
                      ))}
                    </div>
                  )}
                  {program.website&&<a href={fixUrl(program.website)} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:5,marginTop:12,fontSize:13,color:T.ink,fontWeight:500,textDecoration:'underline',textUnderlineOffset:3,wordBreak:'break-all'}}>{program.website.replace(/^https?:\/\//,'')} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg></a>}
                </div>
                {(program.calendlyLink||program.contactEmail)&&(
                  <div style={{display:'flex',gap:9,marginBottom:28,flexWrap:'wrap'}}>
                    {program.calendlyLink&&<a href={fixUrl(program.calendlyLink)} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:7,padding:'11px 22px',background:T.ink,borderRadius:6,color:T.white,fontWeight:500,fontSize:13,textDecoration:'none'}}>Book a call →</a>}
                    {program.contactEmail&&<a href={`mailto:${program.contactEmail}`} className="btn-ghost" style={{fontSize:13}}>{program.contactEmail}</a>}
                  </div>
                )}
                <Card dark icon="🔗" title="Get your referral link" sub="Enter your name — your link is created instantly">
                  {program.rewards?.length>0&&(
                    <div style={{marginBottom:24}}>
                      <div style={{fontSize:9,fontWeight:600,letterSpacing:'.12em',textTransform:'uppercase',color:T.pebble,marginBottom:10}}>Refer someone & earn</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:7}}>{program.rewards.map(r=><span key={r} className="reward-badge">{r}</span>)}</div>
                    </div>
                  )}
                  <form onSubmit={submitShare}>
                    <FG label="Your Email" req err={fErr.sharerName}><input className={`fi${fErr.sharerName?' err':''}`} placeholder="How should we credit you?" value={sharerName} onChange={e=>{setSharerName(e.target.value);setFErr({});setError('');}} autoFocus/></FG>
                    <button type="submit" disabled={loading} className="btn-primary">{loading?<><Spinner/> Generating…</>:<>Get My Referral Link →</>}</button>
                  </form>
                </Card>
              </div>
            )}
            {success&&(
              <div className="aFadeUp">
                <OkBanner msg={`Your referral link for ${program?.companyName} is ready!`}/>
                <Card dark icon="✓" title="Your link is ready" sub={`Share it anywhere to earn rewards from ${program?.companyName}`}>
                  <ShareActions link={link} shareText={publicText} programName={program?.companyName}/>
                </Card>
              </div>
            )}
          </div>
        )}

        <footer style={{background:T.black,padding:'22px 32px'}}>
          <div style={{maxWidth:900,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
            <div style={{fontFamily:F.display,fontSize:16,color:'rgba(255,255,255,.6)',fontWeight:300,fontStyle:'italic'}}>Recommend<strong style={{fontWeight:600}}>Easy</strong><span style={{marginLeft:12,fontSize:11,color:'rgba(255,255,255,.25)',fontFamily:F.body}}>© 2026</span></div>
            <div style={{display:'flex',gap:16,alignItems:'center'}}>
              {mode==='public'&&<a href="/" style={{fontSize:12,color:'rgba(255,255,255,.4)',textDecoration:'none'}} onMouseEnter={e=>e.target.style.color='rgba(255,255,255,.8)'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.4)'}>← Create your own program</a>}
              <a href="/influencer" style={{fontSize:12,color:'rgba(255,255,255,.4)',textDecoration:'none'}} onMouseEnter={e=>e.target.style.color='rgba(255,255,255,.8)'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.4)'}>Influencer program →</a>
              <a href="/admin" style={{fontSize:12,color:'rgba(255,255,255,.4)',textDecoration:'none'}} onMouseEnter={e=>e.target.style.color='rgba(255,255,255,.8)'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.4)'}>Stats</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}