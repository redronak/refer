// src/App.jsx  — EasyRecommend
import { useState, useEffect, useCallback } from 'react';

const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API = IS_LOCAL
  ? 'http://localhost:9000/refer'
  : 'https://learntok-backend-2026-24c204fe508e.herokuapp.com/refer';
const APP_URL = IS_LOCAL
  ? window.location.origin
  : 'https://www.easyrecommend.co';

// Load SheetJS for Excel parsing
if (!window.XLSX) {
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  document.head.appendChild(s);
}

const C = {
  bg:'#F7F9FC',white:'#FFFFFF',surface:'#FFFFFF',border:'#E8EDF5',borderMd:'#CBD5E8',
  teal:'#0D9488',tealDark:'#0F766E',tealLight:'#CCFBF1',tealDim:'rgba(13,148,136,.08)',
  sky:'#0EA5E9',ink:'#0F172A',slate:'#334155',mid:'#64748B',faint:'#94A3B8',ghost:'#F1F5F9',
  amber:'#F59E0B',amberBg:'#FFFBEB',red:'#EF4444',redBg:'#FEF2F2',
  green:'#10B981',greenBg:'#ECFDF5',purple:'#8B5CF6',
};
const F = { body:"'Plus Jakarta Sans','DM Sans',sans-serif" };

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{background:#F7F9FC;font-family:'Plus Jakarta Sans','DM Sans',sans-serif;color:#0F172A;min-height:100vh;-webkit-font-smoothing:antialiased}
::placeholder{color:#94A3B8!important}
::selection{background:#CCFBF1;color:#0F766E}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:#CBD5E8;border-radius:2px}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.2);opacity:1}}
.au {animation:fadeUp .45s cubic-bezier(.16,1,.3,1) both}
.au1{animation:fadeUp .45s .06s cubic-bezier(.16,1,.3,1) both}
.au2{animation:fadeUp .45s .12s cubic-bezier(.16,1,.3,1) both}
.au3{animation:fadeUp .45s .18s cubic-bezier(.16,1,.3,1) both}
.au4{animation:fadeUp .45s .24s cubic-bezier(.16,1,.3,1) both}
.fi{width:100%;padding:12px 14px;background:#fff;border:1.5px solid #E8EDF5;border-radius:10px;font-size:15px;color:#0F172A;font-family:'Plus Jakarta Sans','DM Sans',sans-serif;outline:none;transition:border-color .15s,box-shadow .15s;-webkit-appearance:none}
.fi:focus{border-color:#0D9488;box-shadow:0 0 0 3px rgba(13,148,136,.1)}
.fi.err{border-color:#EF4444;box-shadow:0 0 0 3px rgba(239,68,68,.08)}
select.fi{cursor:pointer}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px 20px;border:none;border-radius:10px;font-family:'Plus Jakarta Sans','DM Sans',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:all .15s;-webkit-tap-highlight-color:transparent;touch-action:manipulation;letter-spacing:-.01em}
.btn-primary{background:#0D9488;color:#fff;box-shadow:0 1px 2px rgba(0,0,0,.1),0 4px 12px rgba(13,148,136,.25)}
.btn-primary:hover:not(:disabled){background:#0F766E;transform:translateY(-1px)}
.btn-primary:disabled{background:#CBD5E8;color:#94A3B8;cursor:not-allowed;box-shadow:none}
.btn-secondary{background:#F1F5F9;color:#334155;border:1.5px solid #E8EDF5}
.btn-secondary:hover{background:#E8EDF5;color:#0F172A}
.btn-danger{background:#FEF2F2;color:#EF4444;border:1.5px solid rgba(239,68,68,.2)}
.btn-danger:hover{background:#EF4444;color:#fff}
.btn-success{background:#ECFDF5;color:#10B981;border:1.5px solid rgba(16,185,129,.2)}
.btn-success:hover{background:#10B981;color:#fff}
.btn-sm{padding:8px 14px;font-size:13px;border-radius:8px;width:auto}
.btn-xs{padding:5px 10px;font-size:12px;border-radius:6px;width:auto;font-weight:500}
.btn-wa{background:#25D366;color:#fff;box-shadow:0 4px 12px rgba(37,211,102,.3)}
.btn-wa:hover{background:#1db954;transform:translateY(-1px)}
.card{background:#fff;border:1px solid #E8EDF5;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.04);overflow:hidden}
.card-head{padding:14px 18px;border-bottom:1px solid #E8EDF5;display:flex;align-items:center;justify-content:space-between;gap:10px}
.card-body{padding:18px}
.badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:100px;font-size:11px;font-weight:600;letter-spacing:.02em;white-space:nowrap}
.badge-pending{background:#FFFBEB;color:#F59E0B;border:1px solid rgba(245,158,11,.2)}
.badge-visit{background:rgba(13,148,136,.08);color:#0D9488;border:1px solid rgba(13,148,136,.2)}
.badge-treatment{background:#EEF2FF;color:#8B5CF6;border:1px solid rgba(139,92,246,.2)}
.badge-approved{background:#ECFDF5;color:#10B981;border:1px solid rgba(16,185,129,.2)}
.badge-rejected{background:#FEF2F2;color:#EF4444;border:1px solid rgba(239,68,68,.2)}
.badge-paid{background:#ECFDF5;color:#10B981;border:1px solid rgba(16,185,129,.2)}
.badge-requested{background:#FFFBEB;color:#F59E0B;border:1px solid rgba(245,158,11,.2)}
.badge-processing{background:#EEF2FF;color:#8B5CF6;border:1px solid rgba(139,92,246,.2)}
.bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:100;background:#fff;border-top:1px solid #E8EDF5;display:flex;align-items:stretch;padding-bottom:env(safe-area-inset-bottom);box-shadow:0 -4px 20px rgba(0,0,0,.06)}
.bnav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:10px 4px;background:none;border:none;cursor:pointer;font-family:'Plus Jakarta Sans','DM Sans',sans-serif;font-size:10px;font-weight:500;color:#94A3B8;transition:color .15s;-webkit-tap-highlight-color:transparent}
.bnav-btn.active{color:#0D9488;font-weight:600}
.stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px}
.stat-card{background:#fff;border:1px solid #E8EDF5;border-radius:12px;padding:16px}
.stat-num{font-size:26px;font-weight:800;color:#0F172A;line-height:1}
.stat-lbl{font-size:10px;color:#94A3B8;font-weight:600;margin-top:4px;letter-spacing:.04em;text-transform:uppercase}
.stat-sub{font-size:12px;color:#64748B;margin-top:2px}
.otp-wrap{display:flex;gap:8px;justify-content:center;margin:8px 0}
.otp-input{width:44px;height:52px;text-align:center;font-size:20px;font-weight:700;background:#fff;border:2px solid #E8EDF5;border-radius:10px;color:#0F172A;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:border-color .15s,box-shadow .15s;-webkit-appearance:none}
.otp-input:focus{border-color:#0D9488;box-shadow:0 0 0 3px rgba(13,148,136,.1)}
.fg{margin-bottom:14px}
.fl{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#64748B;margin-bottom:6px;display:block}
.alert{padding:12px 16px;border-radius:10px;font-size:13px;font-weight:500;margin-bottom:14px;display:flex;gap:9px;align-items:flex-start;line-height:1.5}
.alert-err{background:#FEF2F2;color:#EF4444;border:1px solid rgba(239,68,68,.2)}
.alert-ok{background:#ECFDF5;color:#10B981;border:1px solid rgba(16,185,129,.2)}
.alert-info{background:rgba(13,148,136,.08);color:#0F766E;border:1px solid rgba(13,148,136,.2)}
.alert-warn{background:#FFFBEB;color:#92400E;border:1px solid rgba(245,158,11,.2)}
.empty{text-align:center;padding:48px 20px}
.empty-icon{font-size:40px;margin-bottom:12px}
.empty-title{font-size:16px;font-weight:600;color:#334155;margin-bottom:6px}
.empty-sub{font-size:13px;color:#94A3B8}
.row-item{padding:14px 0;border-bottom:1px solid #E8EDF5;display:flex;align-items:flex-start;gap:12px}
.row-item:last-child{border-bottom:none}
.modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);z-index:300;display:flex;align-items:flex-end;justify-content:center}
.modal-box{background:#fff;border-radius:20px 20px 0 0;padding:24px 20px 40px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;animation:fadeUp .3s cubic-bezier(.16,1,.3,1) both}
@media(min-width:600px){.modal-overlay{align-items:center;padding:20px}.modal-box{border-radius:16px}}
.top-bar{background:#fff;border-bottom:1px solid #E8EDF5;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50}
.code-box{background:rgba(13,148,136,.08);border:2px dashed rgba(13,148,136,.3);border-radius:12px;padding:20px;text-align:center}
.code-text{font-size:28px;font-weight:800;color:#0D9488;letter-spacing:.1em;font-family:monospace}
.switch{position:relative;width:42px;height:24px;flex-shrink:0}
.switch input{opacity:0;width:0;height:0}
.switch-slider{position:absolute;inset:0;background:#CBD5E8;border-radius:100px;cursor:pointer;transition:.2s}
.switch-slider::before{content:'';position:absolute;width:18px;height:18px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
input:checked+.switch-slider{background:#0D9488}
input:checked+.switch-slider::before{transform:translateX(18px)}
.disclaimer{background:#FFFBEB;border:1px solid rgba(245,158,11,.25);border-radius:10px;padding:14px 16px;font-size:12px;color:#78350F;line-height:1.6}
@media(max-width:480px){.stat-num{font-size:22px}.card-body{padding:14px}}

/* ── Landing page ── */
@keyframes float{0%,100%{transform:translateY(0px)}50%{transform:translateY(-10px)}}
@keyframes floatSlow{0%,100%{transform:translateY(0px) rotate(-2deg)}50%{transform:translateY(-14px) rotate(2deg)}}
@keyframes gradShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes ripple{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.2);opacity:0}}
@keyframes slideRight{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}

.lp-nav {
  position: fixed; top:0; left:0; right:0; z-index:100;
  height: 64px; padding: 0 28px;
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(20px) saturate(1.8);
  border-bottom: 1px solid rgba(10,37,64,.07);
  transition: all .3s;
}
.lp-logo { font-size:17px; font-weight:800; color:#0A2540; letter-spacing:-.03em; }
.lp-logo em { font-style:normal; color:#635BFF; }
.lp-nav-links { display:flex; align-items:center; gap:2px; }
.lp-nav-link { padding:7px 13px; border-radius:8px; font-size:14px; font-weight:500; color:#425466; background:transparent; border:none; cursor:pointer; font-family:inherit; transition:all .15s; }
.lp-nav-link:hover { background:#F6F9FC; color:#0A2540; }
.lp-btn-ghost {
  display:inline-flex; align-items:center; gap:7px;
  padding:9px 20px; border-radius:9px;
  background:#fff; color:#0A2540;
  border: 1.5px solid rgba(10,37,64,.15);
  font-size:14px; font-weight:600; cursor:pointer;
  font-family:inherit; transition:all .2s; letter-spacing:-.01em;
}
.lp-btn-ghost:hover { border-color:#0A2540; background:#F6F9FC; }
.lp-btn-primary {
  display:inline-flex; align-items:center; gap:8px;
  padding:11px 24px; border-radius:9px;
  background:#635BFF; color:#fff; border:none;
  font-size:14px; font-weight:600; cursor:pointer;
  font-family:inherit;
  box-shadow: 0 2px 12px rgba(99,91,255,.3);
  transition:all .2s; letter-spacing:-.01em; text-decoration:none;
}
.lp-btn-primary:hover { background:#5851DB; transform:translateY(-1px); box-shadow:0 6px 24px rgba(99,91,255,.4); }
.lp-hero-bg {
  min-height:100vh; padding-top:64px;
  background: #fff;
  display:flex; align-items:center;
  position:relative; overflow:hidden;
}
.lp-hero-bg::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(ellipse 90% 60% at 60% -10%, rgba(99,91,255,.09) 0%, transparent 65%),
    radial-gradient(ellipse 60% 40% at 10% 80%, rgba(0,212,255,.06) 0%, transparent 60%);
}
.lp-grid-overlay { display:none; }
.lp-badge {
  display:inline-flex; align-items:center; gap:7px;
  padding:6px 14px; border-radius:100px;
  background:rgba(99,91,255,.08); border:1px solid rgba(99,91,255,.18);
  font-size:12px; font-weight:600; color:#635BFF; letter-spacing:.04em;
}
.lp-badge-dot { width:6px; height:6px; border-radius:50%; background:#635BFF; animation:pulse 2s ease-in-out infinite; }
.lp-headline {
  font-size:clamp(38px,7vw,74px); font-weight:900; line-height:1.02;
  letter-spacing:-.04em; color:#0A2540;
}
.lp-headline em { font-style:normal; background:linear-gradient(135deg,#635BFF,#00D4FF); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.lp-sub { font-size:clamp(15px,2vw,19px); color:#425466; line-height:1.75; font-weight:400; }
.lp-float-card {
  background:#fff;
  border:1px solid rgba(10,37,64,.08);
  box-shadow:0 4px 24px rgba(10,37,64,.08),0 1px 4px rgba(10,37,64,.04);
  border-radius:16px; padding:20px; color:#0A2540;
}
.lp-stat { text-align:center; padding:28px 20px; }
.lp-stat-num { font-size:clamp(32px,5vw,48px); font-weight:900; color:#635BFF; line-height:1; letter-spacing:-.03em; }
.lp-stat-lbl { font-size:13px; color:#697386; margin-top:6px; font-weight:500; }
.lp-feature-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; margin-bottom:14px; flex-shrink:0; }
.lp-step-num { width:36px; height:36px; border-radius:50%; background:rgba(99,91,255,.1); border:1.5px solid rgba(99,91,255,.2); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:#635BFF; flex-shrink:0; }
.lp-ticker-wrap { overflow:hidden; white-space:nowrap; background:#F6F9FC; border-top:1px solid rgba(10,37,64,.06); border-bottom:1px solid rgba(10,37,64,.06); padding:13px 0; }
.lp-ticker-track { display:inline-flex; animation:ticker 28s linear infinite; }
.lp-ticker-item { display:inline-flex; align-items:center; gap:10px; padding:0 28px; font-size:11px; font-weight:700; color:#8898AA; letter-spacing:.1em; text-transform:uppercase; }
.lp-ticker-dot { width:4px; height:4px; border-radius:50%; background:#CBD5E1; }
.lp-section { padding:96px 24px; max-width:1080px; margin:0 auto; }
.lp-section-tag { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; background:rgba(99,91,255,.08); border:1px solid rgba(99,91,255,.15); border-radius:100px; font-size:11px; font-weight:700; color:#635BFF; letter-spacing:.06em; text-transform:uppercase; margin-bottom:16px; }
.lp-section-h { font-size:clamp(26px,4vw,42px); font-weight:800; color:#0A2540; line-height:1.12; letter-spacing:-.03em; margin-bottom:14px; }
.lp-section-sub { font-size:16px; color:#697386; line-height:1.75; max-width:540px; }
.lp-card-hover { transition:transform .2s, box-shadow .2s; }
.lp-card-hover:hover { transform:translateY(-3px); box-shadow:0 12px 36px rgba(10,37,64,.1)!important; }
.lp-testimonial { background:#fff; border:1px solid rgba(10,37,64,.07); border-radius:16px; padding:28px; box-shadow:0 2px 8px rgba(10,37,64,.04); }
.lp-cta-section { background:linear-gradient(160deg,#0A2540 0%,#1a1060 100%); padding:100px 24px; text-align:center; position:relative; overflow:hidden; }
.lp-footer { background:#0A2540; color:rgba(255,255,255,.45); padding:36px 24px; font-size:13px; }
@media(max-width:768px){
  .lp-nav-links{display:none}
  .lp-hero-content{grid-template-columns:1fr!important;gap:40px!important;padding:60px 20px 80px!important}
  .lp-features-grid{grid-template-columns:1fr!important}
  .lp-steps-grid{grid-template-columns:1fr!important}
  .lp-stats-grid{grid-template-columns:1fr 1fr!important}
  .lp-cta-btns{flex-direction:column!important;align-items:center!important}
  .lp-cta-btns button,.lp-cta-btns a{width:100%!important;max-width:320px!important}
  .lp-section{padding:64px 20px}
  .lp-testimonials-grid{grid-template-columns:1fr!important}
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Spin = ({ sm, white }) => (
  <div style={{width:sm?14:18,height:sm?14:18,border:`2px solid ${white?'rgba(255,255,255,.3)':'#E8EDF5'}`,borderTop:`2px solid ${white?'#fff':'#0D9488'}`,borderRadius:'50%',animation:'spin .7s linear infinite',flexShrink:0}}/>
);
const ErrAlert = ({ msg }) => msg ? <div className="alert alert-err">⚠ {msg}</div> : null;
const OkAlert  = ({ msg }) => msg ? <div className="alert alert-ok">✓ {msg}</div>  : null;
function fmt(n) { return (n||0).toLocaleString('en-US'); }
function tAgo(d) {
  const m=Math.floor((Date.now()-new Date(d))/60000);
  if(m<1) return 'just now'; if(m<60) return m+'m ago';
  const h=Math.floor(m/60); if(h<24) return h+'h ago';
  return Math.floor(h/24)+'d ago';
}
function statusBadge(s) {
  const map={
    pending:['badge-pending','⏳ Pending'],visit_completed:['badge-visit','🏥 Visit Done'],
    treatment_completed:['badge-treatment','💊 Treatment Done'],approved:['badge-approved','✅ Approved'],
    rejected:['badge-rejected','❌ Rejected'],requested:['badge-requested','📤 Requested'],
    processing:['badge-processing','⚙️ Processing'],paid:['badge-paid','✅ Paid'],
  };
  const [cls,lbl]=map[s]||['badge-pending',s];
  return <span className={`badge ${cls}`}>{lbl}</span>;
}
function Avatar({ name, size=36 }) {
  const i=(name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return <div style={{width:size,height:size,borderRadius:'50%',background:'#CCFBF1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.36,fontWeight:700,color:'#0D9488',flexShrink:0}}>{i}</div>;
}
function CopyBtn({ text, label='Copy' }) {
  const [s,set]=useState(label);
  return <button className="btn btn-secondary btn-xs" onClick={()=>{navigator.clipboard.writeText(text);set('Copied!');setTimeout(()=>set(label),2000)}}>{s}</button>;
}

// ─── Auth + API ───────────────────────────────────────────────────────────────
const getAuth  = () => { try{return JSON.parse(localStorage.getItem('cr_auth')||'null')}catch{return null} };
const saveAuth = d  => localStorage.setItem('cr_auth', JSON.stringify(d));
const clearAuth= () => localStorage.removeItem('cr_auth');

async function api(path, opts={}, token=null) {
  const headers={'Content-Type':'application/json'};
  if(token) headers['Authorization']=`Bearer ${token}`;
  const r=await fetch(`${API}${path}`,{...opts,headers});
  const d=await r.json();
  if(!r.ok) throw new Error(d.error||'Request failed');
  return d;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INFLUENCER TRY PAGE  (#/influencertry)
// ═══════════════════════════════════════════════════════════════════════════════
const INF_CATEGORIES = ['Beauty', 'Legal', 'Education'];
const INF_CITIES = ['San Francisco','Los Angeles','New York','Chicago','Miami','Austin','Seattle','Boston','Denver','Atlanta'];
const INF_CAT_META = {
  Beauty:    { icon:'💄', color:'#DB2777', bg:'rgba(219,39,119,.08)', desc:'Salons, spas, aesthetics & wellness brands' },
  Legal:     { icon:'⚖️', color:'#7C3AED', bg:'rgba(124,58,237,.08)', desc:'Law firms rewarding client referrals' },
  Education: { icon:'🎓', color:'#0EA5E9', bg:'rgba(14,165,233,.08)', desc:'Courses, bootcamps & tutoring services' },
};

function InfluencerPage({ onBack }) {
  const [brands,    setBrands]    = useState([]);
  const [catFilter, setCatFilter] = useState('All');
  const [cityFilter,setCityFilter]= useState('All');
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [formType,  setFormType]  = useState('brand'); // 'brand' | 'influencer'
  const [step,      setStep]      = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const [formErr,   setFormErr]   = useState('');
  const [citySearch,setCitySearch]= useState('');
  const [catSearch, setCatSearch] = useState('');

  // Invite code gate
  const [unlocked,  setUnlocked]  = useState(()=>localStorage.getItem('inf_unlocked')==='1');
  const [codeInput, setCodeInput] = useState('');
  const [codeErr,   setCodeErr]   = useState('');
  const VALID_CODES = ['RONAK2025','EASY100','INFLUENCER','PARTNER','VIP2025'];
  const tryCode = () => {
    if(VALID_CODES.includes(codeInput.trim().toUpperCase())){
      localStorage.setItem('inf_unlocked','1'); setUnlocked(true); setCodeErr('');
    } else { setCodeErr('Invalid code. DM @ronaksure on Instagram to get access.'); }
  };

  // ── BRAND FORM (5 steps: info → category+location → details+photos → commission → OTP)
  const [f, setF] = useState({ name:'', email:'', phone:'', city:'', category:'', description:'', cashPerReferral:'', customerDiscount:'', photos:[], isOnline:false });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const [brandOtp, setBrandOtp]   = useState(['','','','','','']);
  const [brandOtpSent, setBrandOtpSent] = useState(false);
  const [photoUrl, setPhotoUrl]   = useState('');

  const sendBrandOtp = async () => {
    if(!f.phone.trim()){setFormErr('Enter phone number.');return;}
    setSubmitting(true);setFormErr('');
    try{ await api('/inf-brand/send-otp',{method:'POST',body:JSON.stringify({phone:f.phone})}); setBrandOtpSent(true); setStep(5); }
    catch(e){setFormErr(e.message);}
    setSubmitting(false);
  };
  const handleBrandOtpKey = (i,val) => {
    if(!/^\d*$/.test(val)) return;
    const n=[...brandOtp]; n[i]=val.slice(-1); setBrandOtp(n);
    if(val&&i<5) document.getElementById(`botp-${i+1}`)?.focus();
  };
  const submitBrand = async () => {
    const code=brandOtp.join('');
    if(code.length<6){setFormErr('Enter the 6-digit code.');return;}
    setSubmitting(true);setFormErr('');
    try{
      await api('/inf-brand/submit',{method:'POST',body:JSON.stringify({...f,otp:code})});
      setSubmitted(true);setShowForm(false);
    }catch(e){setFormErr(e.message);}
    setSubmitting(false);
  };

  // ── INFLUENCER AUTH + REVIEW + URL GENERATION
  const [invCode,   setInvCode]   = useState('');
  const [infPhone,  setInfPhone]  = useState('');
  const [infOtp,    setInfOtp]    = useState(['','','','','','']);
  const [infToken,  setInfToken]  = useState(()=>localStorage.getItem('inf_token')||'');
  const [infProfile,setInfProfile]= useState(null);
  const [selectedBrandForReview, setSelectedBrandForReview] = useState(null);
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewText,  setReviewText]  = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [urlCopied, setUrlCopied] = useState(false);

  const PLATFORMS = ['Instagram','TikTok','YouTube','Twitter/X','LinkedIn','Facebook','Blog'];
  const FOLLOWER_RANGES = ['Under 1K','1K–10K','10K–50K','50K–100K','100K+'];
  const [inf, setInf] = useState({ name:'', handle:'', platforms:[], followers:'', categories:[], city:'', bio:'' });
  const setI = (k,v) => setInf(p=>({...p,[k]:v}));
  const toggleArr = (k,v) => setInf(p=>({...p,[k]: p[k].includes(v)?p[k].filter(x=>x!==v):[...p[k],v]}));

  const sendInfOtp = async () => {
    if(!invCode.trim()){setFormErr('Enter invite code.');return;}
    if(!infPhone.trim()){setFormErr('Enter phone number.');return;}
    setSubmitting(true);setFormErr('');
    try{ await api('/influencer/send-otp',{method:'POST',body:JSON.stringify({phone:infPhone,inviteCode:invCode})}); setStep(3); }
    catch(e){setFormErr(e.message);}
    setSubmitting(false);
  };
  const handleInfOtpKey = (i,val) => {
    if(!/^\d*$/.test(val)) return;
    const n=[...infOtp]; n[i]=val.slice(-1); setInfOtp(n);
    if(val&&i<5) document.getElementById(`iotp-${i+1}`)?.focus();
  };
  const verifyInfOtp = async () => {
    const code=infOtp.join('');
    if(code.length<6){setFormErr('Enter the 6-digit code.');return;}
    setSubmitting(true);setFormErr('');
    try{
      const d = await api('/influencer/verify',{method:'POST',body:JSON.stringify({phone:infPhone,otp:code,inviteCode:invCode})});
      localStorage.setItem('inf_token',d.token);
      setInfToken(d.token); setInfProfile(d.profile);
      // If new user or no name, go to profile setup
      if(d.isNew || !d.profile.name) { setStep(4); }
      else { setSelectedBrandForReview(null); setStep(6); } // go to review/url step
    }catch(e){setFormErr(e.message);}
    setSubmitting(false);
  };
  const saveInfProfile = async () => {
    if(!inf.name.trim()){setFormErr('Enter your name.');return;}
    setSubmitting(true);setFormErr('');
    try{
      const d = await api('/influencer/profile',{method:'PATCH',body:JSON.stringify(inf)},infToken);
      setInfProfile(d.profile); setStep(6);
    }catch(e){setFormErr(e.message);}
    setSubmitting(false);
  };
  const submitReview = async (brandId, skip=false) => {
    try {
      await api('/influencer/review',{method:'POST',body:JSON.stringify({brandId,stars:reviewStars||null,text:reviewText,skipped:skip})},infToken);
    } catch(e){console.error(e);}
    setSelectedBrandForReview(null); setReviewStars(0); setReviewText('');
    // Generate profile URL
    generateProfileUrl(brandId);
  };
  const generateProfileUrl = async (brandId) => {
    try{
      const d = await api('/influencer/generate-url',{method:'POST',body:JSON.stringify({brandId})},infToken);
      setGeneratedUrl(d.url);
      setStep(7);
    }catch(e){setFormErr(e.message);}
  };
  const copyUrl = () => {
    navigator.clipboard.writeText(generatedUrl);
    setUrlCopied(true); setTimeout(()=>setUrlCopied(false),2500);
  };

  useEffect(()=>{ loadBrands('All','All'); },[]);
  const loadBrands = async (cat, city) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cat && cat !== 'All') params.set('category', cat);
      if (city && city !== 'All') params.set('city', city);
      const d = await api(`/influencer-brands${params.toString()?`?${params}`:''}`);
      setBrands(d.brands||[]);
    } catch(e){ console.error(e); }
    setLoading(false);
  };

  const filteredCities = INF_CITIES.filter(c=>c.toLowerCase().includes(citySearch.toLowerCase()));
  const filteredCats   = INF_CATEGORIES.filter(c=>c.toLowerCase().includes(catSearch.toLowerCase()));
  const darkInput = {width:'100%',padding:'12px 14px',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,color:'#fff',fontSize:14,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:'none',boxSizing:'border-box'};
  const darkLabel = {fontSize:12,fontWeight:600,color:'rgba(255,255,255,.45)',display:'block',marginBottom:6};
  const Chip = ({label,active,onClick})=>(
    <button onClick={onClick} style={{padding:'7px 14px',borderRadius:100,border:`1.5px solid ${active?'rgba(219,39,119,.6)':'rgba(255,255,255,.1)'}`,background:active?'rgba(219,39,119,.15)':'transparent',color:active?'#F472B6':'rgba(255,255,255,.5)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif",transition:'all .15s'}}>
      {label}
    </button>
  );

  return (
    <div style={{minHeight:'100vh',fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif",background:'#0A0A0F',color:'#F8FAFC'}}>
      {/* Header */}
      <div style={{borderBottom:'1px solid rgba(255,255,255,.07)',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(255,255,255,.02)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button onClick={onBack} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,padding:'6px 12px',color:'rgba(255,255,255,.6)',fontSize:13,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>← Back</button>
          <span style={{fontWeight:800,fontSize:17,letterSpacing:'-.02em'}}>Easy<span style={{color:'#2DD4BF'}}>Recommend</span></span>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>{setShowForm(true);setFormType('influencer');setStep(1);setFormErr('');}} style={{padding:'9px 16px',background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.15)',borderRadius:10,color:'rgba(255,255,255,.8)',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            I'm an Influencer
          </button>
          <button onClick={()=>{setShowForm(true);setFormType('brand');setStep(1);setFormErr('');}} style={{padding:'9px 20px',background:'linear-gradient(135deg,#DB2777,#9333EA)',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:'0 4px 16px rgba(219,39,119,.35)'}}>
            List your brand →
          </button>
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{maxWidth:760,margin:'0 auto',padding:'64px 24px 0',textAlign:'center'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',borderRadius:100,background:'rgba(219,39,119,.12)',border:'1px solid rgba(219,39,119,.25)',marginBottom:24}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:'#F472B6',animation:'pulse 2s ease-in-out infinite',display:'inline-block'}}/>
          <span style={{fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'#F472B6'}}>Influencer Partnership Program</span>
        </div>
        <h1 style={{fontSize:'clamp(32px,6vw,60px)',fontWeight:900,lineHeight:1.02,letterSpacing:'-.04em',marginBottom:18,background:'linear-gradient(135deg,#fff 40%,rgba(255,255,255,.45))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          One link in your bio.<br/>Brands pay you for every client.
        </h1>
        <p style={{fontSize:16,color:'rgba(255,255,255,.45)',lineHeight:1.75,marginBottom:36,maxWidth:520,margin:'0 auto 36px'}}>
          Sign up, get your unique tracking URL, drop it in your bio. When your followers contact a brand through your link — you get paid. No chasing invoices. No brand deals.
        </p>
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:52}}>
          <button onClick={()=>{setShowForm(true);setFormType('influencer');setStep(1);setFormErr('');}}
            style={{padding:'14px 28px',background:'linear-gradient(135deg,#DB2777,#9333EA)',border:'none',borderRadius:10,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:'0 4px 20px rgba(219,39,119,.4)'}}>
            Apply as an influencer →
          </button>
          <button onClick={()=>{setShowForm(true);setFormType('brand');setStep(1);setFormErr('');}}
            style={{padding:'13px 24px',background:'transparent',border:'1.5px solid rgba(255,255,255,.15)',borderRadius:10,color:'rgba(255,255,255,.7)',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            List your brand
          </button>
        </div>

        {/* Stats strip */}
        <div style={{display:'flex',gap:0,borderRadius:14,overflow:'hidden',border:'1px solid rgba(255,255,255,.07)',background:'rgba(255,255,255,.03)',marginBottom:72,maxWidth:560,margin:'0 auto 72px'}}>
          {[['20+','Active brands'],['$20–$300','Per referral'],['3','Categories'],['1 link','In your bio']].map(([n,l],i)=>(
            <div key={i} style={{flex:1,padding:'16px 8px',textAlign:'center',borderRight:i<3?'1px solid rgba(255,255,255,.07)':undefined}}>
              <div style={{fontSize:16,fontWeight:800,color:'#fff',letterSpacing:'-.02em'}}>{n}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,.3)',marginTop:3,fontWeight:500}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{maxWidth:900,margin:'0 auto',padding:'0 24px 72px'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,.3)',marginBottom:10}}>How it works</div>
          <h2 style={{fontSize:'clamp(22px,4vw,36px)',fontWeight:800,color:'#fff',letterSpacing:'-.03em'}}>Simple. Transparent. Trackable.</h2>
        </div>

        {/* Flow steps */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:64}}>
          {[
            {n:'01',icon:'🔑',title:'Get invited',body:'Receive your invite code from us. Enter it to unlock all brand listings and commissions.'},
            {n:'02',icon:'🔗',title:'Get your link',body:'Sign up in 30 seconds. You receive a unique tracking URL — one link covers all brands.'},
            {n:'03',icon:'📲',title:'Drop it in bio',body:'Add your link to your Instagram, TikTok, or any profile bio. Share it anywhere.'},
            {n:'04',icon:'💰',title:'Get paid',body:'When followers contact a brand through your link, you earn. We track, verify, and pay.'},
          ].map((s,i)=>(
            <div key={s.n} style={{padding:'20px 16px',borderRadius:14,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',position:'relative'}}>
              <div style={{position:'absolute',top:14,right:14,fontSize:28,fontWeight:900,color:'rgba(255,255,255,.05)',lineHeight:1,fontFamily:'monospace'}}>{s.n}</div>
              <div style={{fontSize:26,marginBottom:12}}>{s.icon}</div>
              <div style={{fontSize:14,fontWeight:700,color:'#fff',marginBottom:6,letterSpacing:'-.01em'}}>{s.title}</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,.38)',lineHeight:1.65}}>{s.body}</div>
            </div>
          ))}
        </div>

        {/* What your followers see — visual mockup */}
        <div style={{borderRadius:20,overflow:'hidden',border:'1px solid rgba(255,255,255,.08)',background:'rgba(255,255,255,.02)',marginBottom:64}}>
          <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(255,255,255,.06)',display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'rgba(255,255,255,.15)'}}/>
            <div style={{flex:1,background:'rgba(255,255,255,.05)',borderRadius:6,padding:'5px 12px',fontFamily:'monospace',fontSize:12,color:'rgba(255,255,255,.35)'}}>
              easyrecommend.co/i/<span style={{color:'#F472B6'}}>@yourhandle</span>
            </div>
          </div>
          <div style={{padding:'24px'}}>
            <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:16}}>What your followers see</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
              {[
                {name:'The Glow Lab SF',cat:'💄 Beauty',city:'San Francisco',reward:'$35 off first facial',color:'#DB2777',bg:'rgba(219,39,119,.08)'},
                {name:'Bright Path Immigration',cat:'⚖️ Legal',city:'San Francisco',reward:'Free consultation',color:'#7C3AED',bg:'rgba(124,58,237,.08)'},
                {name:'Bay Area Code School',cat:'🎓 Education',city:'San Francisco',reward:'$100 off enrollment',color:'#0EA5E9',bg:'rgba(14,165,233,.08)'},
              ].map((b,i)=>(
                <div key={i} style={{borderRadius:12,overflow:'hidden',border:`1px solid rgba(255,255,255,.06)`,background:'rgba(255,255,255,.03)'}}>
                  <div style={{height:3,background:`linear-gradient(90deg,${b.color},${b.color}44)`}}/>
                  <div style={{padding:'14px 12px'}}>
                    <div style={{fontSize:11,fontWeight:700,color:b.color,marginBottom:6}}>{b.cat}</div>
                    <div style={{fontSize:13,fontWeight:800,color:'#fff',marginBottom:2,lineHeight:1.2}}>{b.name}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,.3)',marginBottom:10}}>📍 {b.city}</div>
                    <div style={{padding:'6px 8px',background:b.bg,borderRadius:7,marginBottom:10}}>
                      <div style={{fontSize:9,fontWeight:700,color:b.color,textTransform:'uppercase',letterSpacing:'.04em'}}>🎟 You get</div>
                      <div style={{fontSize:11,fontWeight:700,color:'#fff',marginTop:2}}>{b.reward}</div>
                    </div>
                    <div style={{display:'flex',gap:5}}>
                      <div style={{flex:1,background:'rgba(37,211,102,.15)',border:'1px solid rgba(37,211,102,.2)',borderRadius:6,padding:'5px',textAlign:'center',fontSize:10,fontWeight:700,color:'#4ADE80'}}>WhatsApp</div>
                      <div style={{flex:1,background:'rgba(255,255,255,.06)',borderRadius:6,padding:'5px',textAlign:'center',fontSize:10,fontWeight:600,color:'rgba(255,255,255,.4)'}}>Email</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust & tracking */}
        <div style={{borderRadius:16,padding:'28px 24px',background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.06)',marginBottom:48}}>
          <div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:16}}>How we track & verify every referral</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[
              {icon:'🔗',title:'Unique URL per influencer',body:'Every influencer gets a different link. We know exactly who sent each visitor.'},
              {icon:'🖥️',title:'Back-office verification',body:'Our team manually reviews every lead before any commission is approved.'},
              {icon:'🛡️',title:'Routine fraud checks',body:'Automated + manual checks on every claim to protect brands and influencers.'},
              {icon:'📞',title:'10+ customer calls',body:'We call the brand to verify the client actually came through your link before paying.'},
            ].map(t=>(
              <div key={t.title} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                <div style={{width:36,height:36,borderRadius:9,background:'rgba(219,39,119,.1)',border:'1px solid rgba(219,39,119,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{t.icon}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:3}}>{t.title}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,.38)',lineHeight:1.6}}>{t.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invite code gate */}
        {!unlocked && (
          <div style={{padding:'28px',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.1)',borderRadius:16,textAlign:'center',marginBottom:40}}>
            <div style={{fontSize:24,marginBottom:8}}>🔒</div>
            <div style={{fontSize:16,fontWeight:800,color:'#fff',marginBottom:6}}>Brand listings are invite-only</div>
            <p style={{fontSize:13,color:'rgba(255,255,255,.4)',lineHeight:1.6,marginBottom:20}}>
              Have an invite code? Enter it below.<br/>
              No code? <a href="https://instagram.com/ronaksure" target="_blank" rel="noopener noreferrer" style={{color:'#F472B6',fontWeight:700,textDecoration:'none'}}>DM @ronaksure on Instagram</a> and say hello 👋
            </p>
            <div style={{display:'flex',gap:8,maxWidth:340,margin:'0 auto'}}>
              <input value={codeInput} onChange={e=>{setCodeInput(e.target.value);setCodeErr('');}}
                onKeyDown={e=>e.key==='Enter'&&tryCode()} placeholder="Enter invite code"
                style={{flex:1,padding:'12px 14px',background:'rgba(255,255,255,.06)',border:`1px solid ${codeErr?'rgba(248,113,113,.4)':'rgba(255,255,255,.12)'}`,borderRadius:9,color:'#fff',fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:'none'}}/>
              <button onClick={tryCode} style={{padding:'12px 20px',background:'linear-gradient(135deg,#DB2777,#9333EA)',border:'none',borderRadius:9,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif",whiteSpace:'nowrap'}}>Unlock</button>
            </div>
            {codeErr && <div style={{fontSize:12,color:'#F87171',marginTop:10}}>{codeErr} <a href="https://instagram.com/ronaksure" target="_blank" rel="noopener noreferrer" style={{color:'#F472B6',fontWeight:700,textDecoration:'none'}}>@ronaksure</a></div>}
          </div>
        )}
        {unlocked && (
          <div style={{textAlign:'center',marginBottom:32}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 16px',background:'rgba(52,211,153,.1)',border:'1px solid rgba(52,211,153,.2)',borderRadius:100,fontSize:12,fontWeight:600,color:'#34D399',marginBottom:4}}>
              ✅ Full access unlocked — browse all brands below
            </div>
          </div>
        )}
      </div>

      {/* Brands */}
      <div style={{maxWidth:900,margin:'0 auto',padding:'0 24px 60px'}}>
        {/* Category filters */}
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12}}>
          {['All',...INF_CATEGORIES].map(cat=>{
            const m=INF_CAT_META[cat]; const active=catFilter===cat;
            return (
              <button key={cat} onClick={()=>{setCatFilter(cat);loadBrands(cat,cityFilter);}}
                style={{display:'flex',alignItems:'center',gap:7,padding:'10px 18px',borderRadius:100,border:`1.5px solid ${active?(m?.color||'#0D9488'):'rgba(255,255,255,.1)'}`,background:active?(m?.bg||'rgba(13,148,136,.12)'):'transparent',color:active?(m?.color||'#2DD4BF'):'rgba(255,255,255,.5)',fontSize:13,fontWeight:700,cursor:'pointer',transition:'all .15s',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                {m?.icon||'✨'} {cat}
              </button>
            );
          })}
        </div>

        {/* City filters */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:28}}>
          {['All',...INF_CITIES].map(city=>{
            const active=cityFilter===city;
            return (
              <button key={city} onClick={()=>{setCityFilter(city);loadBrands(catFilter,city);}}
                style={{padding:'6px 14px',borderRadius:100,border:`1.5px solid ${active?'rgba(99,91,255,.6)':'rgba(255,255,255,.08)'}`,background:active?'rgba(99,91,255,.15)':'transparent',color:active?'#818CF8':'rgba(255,255,255,.4)',fontSize:12,fontWeight:600,cursor:'pointer',transition:'all .15s',fontFamily:"'Plus Jakarta Sans',sans-serif",whiteSpace:'nowrap'}}>
                {city==='All'?'📍 All cities':`📍 ${city}`}
              </button>
            );
          })}
        </div>

        {/* Category intro */}
        {catFilter==='All' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:36}}>
            {INF_CATEGORIES.map(cat=>{
              const m=INF_CAT_META[cat];
              return (
                <button key={cat} onClick={()=>{setCatFilter(cat);loadBrands(cat);}}
                  style={{textAlign:'left',padding:'20px',borderRadius:14,border:`1px solid ${m.color}22`,background:m.bg,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  <div style={{fontSize:28,marginBottom:10}}>{m.icon}</div>
                  <div style={{fontSize:15,fontWeight:800,color:'#fff',marginBottom:4}}>{cat}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,.45)',lineHeight:1.5}}>{m.desc}</div>
                  <div style={{marginTop:12,fontSize:11,fontWeight:700,color:m.color}}>Browse brands →</div>
                </button>
              );
            })}
          </div>
        )}

        {submitted && <div style={{padding:'14px 18px',background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.2)',borderRadius:10,marginBottom:20,fontSize:13,color:'#34D399',fontWeight:600,textAlign:'center'}}>✅ Submitted! We'll review and publish within 24 hours.</div>}

        <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:16}}>
          {loading?'Loading…':`${brands.length} brand${brands.length!==1?'s':''} ${catFilter!=='All'?`in ${catFilter}`:''}`}
        </div>

        {loading ? <div style={{textAlign:'center',padding:60}}><Spin/></div> : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16,marginBottom:48}}>
            {brands.map((b,i)=>{
              const m=INF_CAT_META[b.category]||{color:'#0D9488',bg:'rgba(13,148,136,.08)',icon:'🏢'};
              return (
                <div key={b._id||i} style={{borderRadius:16,border:'1px solid rgba(255,255,255,.06)',background:'rgba(255,255,255,.03)',overflow:'hidden'}}>
                  <div style={{height:4,background:`linear-gradient(90deg,${m.color},${m.color}44)`}}/>
                  {b.imageUrl && <img src={b.imageUrl} alt={b.name} style={{width:'100%',height:120,objectFit:'cover',display:'block'}}/>}
                  <div style={{padding:'18px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
                      <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:100,background:m.bg,color:m.color,border:`1px solid ${m.color}33`}}>{m.icon} {b.category}</span>
                      {b.featured&&<span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:100,background:'rgba(245,158,11,.1)',color:'#F59E0B'}}>⭐</span>}
                    </div>
                    <div style={{fontSize:16,fontWeight:800,color:'#fff',marginBottom:3}}>{b.name}</div>
                    {b.city&&<div style={{fontSize:11,color:'rgba(255,255,255,.35)',marginBottom:10}}>📍 {b.city}</div>}
                    {b.description&&<p style={{fontSize:12,color:'rgba(255,255,255,.4)',lineHeight:1.6,marginBottom:12}}>{b.description}</p>}
                    <div style={{padding:'10px 12px',borderRadius:9,background:m.bg,border:`1px solid ${m.color}22`,marginBottom:10,position:'relative',overflow:'hidden'}}>
                      <div style={{fontSize:10,fontWeight:700,color:m.color,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:2}}>💰 You earn</div>
                      {unlocked ? (
                        <div style={{fontSize:15,fontWeight:800,color:'#fff'}}>{b.cashPerReferral||'Contact for details'}</div>
                      ) : (
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{fontSize:14,fontWeight:800,color:'#fff',filter:'blur(5px)',userSelect:'none',pointerEvents:'none'}}>$XX per referral</div>
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:100,background:'rgba(255,255,255,.1)',color:'rgba(255,255,255,.6)',border:'1px solid rgba(255,255,255,.15)',whiteSpace:'nowrap'}}>🔒 Invite only</span>
                        </div>
                      )}
                    </div>

                    {/* How we track */}
                    <div style={{padding:'10px 12px',borderRadius:9,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',marginBottom:14}}>
                      <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>🔍 How we track & verify</div>
                      <div style={{display:'flex',flexDirection:'column',gap:5}}>
                        {[
                          ['🔗','Unique URL tracking per influencer'],
                          ['🖥️','Back-office manual verification'],
                          ['🛡️','Routine fraud checks on all claims'],
                          ['📞','10+ customer calls before approval'],
                        ].map(([ic,txt])=>(
                          <div key={txt} style={{display:'flex',alignItems:'center',gap:7,fontSize:11,color:'rgba(255,255,255,.4)',fontWeight:500}}>
                            <span style={{fontSize:12,flexShrink:0}}>{ic}</span>
                            <span>{txt}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button onClick={()=>{setShowForm(true);setFormType('influencer');setStep(1);}} style={{width:'100%',padding:'10px',background:`linear-gradient(135deg,${m.color},${m.color}aa)`,border:'none',borderRadius:9,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      Partner with this brand →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <div style={{padding:'32px',borderRadius:18,border:'1px solid rgba(219,39,119,.2)',background:'rgba(219,39,119,.05)',textAlign:'center'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div style={{padding:'20px',borderRadius:12,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)'}}>
              <div style={{fontSize:24,marginBottom:8}}>🏢</div>
              <div style={{fontSize:15,fontWeight:800,color:'#fff',marginBottom:6}}>Are you a brand?</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginBottom:16,lineHeight:1.5}}>List your business and start paying influencers for real results.</div>
              <button onClick={()=>{setShowForm(true);setFormType('brand');setStep(1);}} style={{width:'100%',padding:'11px',background:'linear-gradient(135deg,#DB2777,#9333EA)',border:'none',borderRadius:9,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                List your brand →
              </button>
            </div>
            <div style={{padding:'20px',borderRadius:12,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)'}}>
              <div style={{fontSize:24,marginBottom:8}}>📸</div>
              <div style={{fontSize:15,fontWeight:800,color:'#fff',marginBottom:6}}>Are you an influencer?</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginBottom:16,lineHeight:1.5}}>Join our network and get matched with brands paying cash per referral.</div>
              <button onClick={()=>{setShowForm(true);setFormType('influencer');setStep(1);}} style={{width:'100%',padding:'11px',background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.15)',borderRadius:9,color:'rgba(255,255,255,.8)',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                Join as influencer →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.85)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget){setShowForm(false);setStep(1);}}}>
          <div style={{width:'100%',maxWidth:520,background:'#13131A',borderRadius:'20px 20px 0 0',padding:'24px 22px 40px',maxHeight:'90vh',overflowY:'auto',border:'1px solid rgba(255,255,255,.08)'}}>
            <div style={{width:40,height:4,background:'rgba(255,255,255,.15)',borderRadius:2,margin:'0 auto 20px'}}/>

            {/* Form type toggle */}
            <div style={{display:'flex',gap:6,background:'rgba(255,255,255,.05)',padding:4,borderRadius:10,marginBottom:20}}>
              {[['brand','🏢 Brand'],['influencer','📸 Influencer']].map(([t,l])=>(
                <button key={t} onClick={()=>{setFormType(t);setStep(1);setFormErr('');}}
                  style={{flex:1,padding:'9px',borderRadius:8,border:'none',background:formType===t?'rgba(219,39,119,.25)':'transparent',color:formType===t?'#F472B6':'rgba(255,255,255,.4)',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif",transition:'all .15s'}}>
                  {l}
                </button>
              ))}
            </div>

            {formErr&&<div style={{fontSize:12,color:'#F87171',marginBottom:12,padding:'8px 12px',background:'rgba(239,68,68,.1)',borderRadius:8}}>⚠ {formErr}</div>}

            {/* ══ BRAND FLOW ══ */}
            {formType==='brand'&&(<>
              {/* Step progress */}
              {step<=5&&<div style={{display:'flex',gap:4,marginBottom:20}}>{[1,2,3,4,5].map(s=><div key={s} style={{flex:1,height:3,borderRadius:2,background:step>=s?'#DB2777':'rgba(255,255,255,.08)'}}/>)}</div>}

              {step===1&&(<>
                <div style={{fontSize:16,fontWeight:800,color:'#fff',marginBottom:4}}>Tell us about your brand</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:20}}>Step 1 of 5 — Basic info</div>
                <label style={darkLabel}>Business name *</label>
                <input value={f.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. The Glow Lab SF" style={{...darkInput,marginBottom:14}}/>
                <label style={darkLabel}>Email *</label>
                <input value={f.email} onChange={e=>set('email',e.target.value)} placeholder="hello@yourbrand.com" type="email" style={{...darkInput,marginBottom:14}}/>
                <label style={darkLabel}>Phone * (for OTP verification)</label>
                <input value={f.phone} onChange={e=>set('phone',e.target.value)} placeholder="+1 415 000 0000" type="tel" style={{...darkInput,marginBottom:22}}/>
                <button onClick={()=>{if(!f.name.trim()||!f.email.trim()||!f.phone.trim()){setFormErr('All fields required.');return;}setFormErr('');setStep(2);}} style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#DB2777,#9333EA)',border:'none',borderRadius:11,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Continue →</button>
              </>)}

              {step===2&&(<>
                <div style={{fontSize:16,fontWeight:800,color:'#fff',marginBottom:4}}>Category & location</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:20}}>Step 2 of 5</div>
                <label style={darkLabel}>Category *</label>
                <input value={catSearch} onChange={e=>setCatSearch(e.target.value)} placeholder="Search…" style={{...darkInput,marginBottom:8,fontSize:13}}/>
                <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:16,maxHeight:130,overflowY:'auto'}}>
                  {filteredCats.map(cat=>{const m=INF_CAT_META[cat];return(
                    <button key={cat} onClick={()=>{set('category',cat);setCatSearch('');}} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:f.category===cat?m.bg:'rgba(255,255,255,.03)',border:`1px solid ${f.category===cat?m.color:'rgba(255,255,255,.06)'}`,borderRadius:9,color:f.category===cat?m.color:'rgba(255,255,255,.55)',fontSize:13,fontWeight:600,cursor:'pointer',textAlign:'left',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      {m.icon} {cat}{f.category===cat&&<span style={{marginLeft:'auto'}}>✓</span>}
                    </button>
                  );})}
                </div>
                <label style={darkLabel}>Is this an online business?</label>
                <div style={{display:'flex',gap:8,marginBottom:14}}>
                  {['Yes — online only','No — local/physical'].map(opt=>(
                    <button key={opt} onClick={()=>set('isOnline',opt.startsWith('Yes'))}
                      style={{flex:1,padding:'10px 8px',borderRadius:9,border:`1px solid ${(f.isOnline===(opt.startsWith('Yes')))?'rgba(219,39,119,.5)':'rgba(255,255,255,.08)'}`,background:(f.isOnline===(opt.startsWith('Yes')))?'rgba(219,39,119,.12)':'rgba(255,255,255,.03)',color:(f.isOnline===(opt.startsWith('Yes')))?'#F472B6':'rgba(255,255,255,.5)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif",textAlign:'center'}}>
                      {opt.startsWith('Yes')?'🌐 Online':'📍 Local'}
                    </button>
                  ))}
                </div>
                {!f.isOnline&&(<>
                  <label style={darkLabel}>City</label>
                  <input value={citySearch||f.city} onChange={e=>{setCitySearch(e.target.value);set('city',e.target.value);}} placeholder="Type city…" style={{...darkInput,marginBottom:6,fontSize:13}}/>
                  {citySearch&&filteredCities.length>0&&(
                    <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:10,maxHeight:110,overflowY:'auto'}}>
                      {filteredCities.map(city=>(
                        <button key={city} onClick={()=>{set('city',city);setCitySearch('');}} style={{padding:'8px 12px',background:f.city===city?'rgba(219,39,119,.1)':'rgba(255,255,255,.03)',border:`1px solid ${f.city===city?'#DB2777':'rgba(255,255,255,.06)'}`,borderRadius:8,color:f.city===city?'#F472B6':'rgba(255,255,255,.55)',fontSize:13,cursor:'pointer',textAlign:'left',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📍 {city}</button>
                      ))}
                    </div>
                  )}
                </>)}
                <div style={{display:'flex',gap:10,marginTop:14}}>
                  <button onClick={()=>setStep(1)} style={{flex:1,padding:'12px',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,color:'rgba(255,255,255,.6)',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>← Back</button>
                  <button onClick={()=>{if(!f.category){setFormErr('Select a category.');return;}setFormErr('');setStep(3);}} style={{flex:2,padding:'12px',background:'linear-gradient(135deg,#DB2777,#9333EA)',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Continue →</button>
                </div>
              </>)}

              {step===3&&(<>
                <div style={{fontSize:16,fontWeight:800,color:'#fff',marginBottom:4}}>Describe your brand</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:20}}>Step 3 of 5 — Details & photos</div>
                <label style={darkLabel}>Description</label>
                <textarea value={f.description} onChange={e=>set('description',e.target.value)} rows={3} placeholder="Tell influencers about your brand and ideal customers…" style={{...darkInput,resize:'vertical',marginBottom:14}}/>
                <label style={darkLabel}>Photos (paste image URLs, one per line)</label>
                <div style={{marginBottom:14}}>
                  <div style={{display:'flex',gap:8,marginBottom:8}}>
                    <input value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} placeholder="https://…" style={{...darkInput,fontSize:12}}/>
                    <button onClick={()=>{if(photoUrl.trim()&&f.photos.length<5){set('photos',[...f.photos,photoUrl.trim()]);setPhotoUrl('');}}} style={{padding:'12px 14px',background:'rgba(219,39,119,.2)',border:'1px solid rgba(219,39,119,.3)',borderRadius:9,color:'#F472B6',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif",whiteSpace:'nowrap'}}>Add</button>
                  </div>
                  {f.photos.length>0&&(
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      {f.photos.map((p,i)=>(
                        <div key={i} style={{position:'relative'}}>
                          <img src={p} alt="" style={{width:64,height:64,objectFit:'cover',borderRadius:8,border:'1px solid rgba(255,255,255,.1)'}} onError={e=>e.target.style.display='none'}/>
                          <button onClick={()=>set('photos',f.photos.filter((_,j)=>j!==i))} style={{position:'absolute',top:-4,right:-4,width:18,height:18,borderRadius:'50%',background:'#EF4444',border:'none',color:'#fff',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{display:'flex',gap:10}}>
                  <button onClick={()=>setStep(2)} style={{flex:1,padding:'12px',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,color:'rgba(255,255,255,.6)',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>← Back</button>
                  <button onClick={()=>setStep(4)} style={{flex:2,padding:'12px',background:'linear-gradient(135deg,#DB2777,#9333EA)',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Continue →</button>
                </div>
              </>)}

              {step===4&&(<>
                <div style={{fontSize:16,fontWeight:800,color:'#fff',marginBottom:4}}>Commission & rewards</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:20}}>Step 4 of 5</div>
                <label style={darkLabel}>Commission to influencer</label>
                <input value={f.cashPerReferral} onChange={e=>set('cashPerReferral',e.target.value)} placeholder="e.g. $50 per booking, 10% of sale" style={{...darkInput,marginBottom:14}}/>
                <label style={darkLabel}>Discount for customers they refer</label>
                <input value={f.customerDiscount} onChange={e=>set('customerDiscount',e.target.value)} placeholder="e.g. 20% off first visit, free consultation" style={{...darkInput,marginBottom:22}}/>
                <div style={{display:'flex',gap:10}}>
                  <button onClick={()=>setStep(3)} style={{flex:1,padding:'12px',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,color:'rgba(255,255,255,.6)',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>← Back</button>
                  <button onClick={sendBrandOtp} disabled={submitting} style={{flex:2,padding:'12px',background:'linear-gradient(135deg,#DB2777,#9333EA)',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    {submitting?<><Spin sm white/> Sending…</>:'Send verification code →'}
                  </button>
                </div>
              </>)}

              {step===5&&(<>
                <div style={{fontSize:16,fontWeight:800,color:'#fff',marginBottom:4}}>Verify your phone</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:20}}>Step 5 of 5 — Enter the code sent to {f.phone}</div>
                <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:20}}>
                  {brandOtp.map((v,i)=>(
                    <input key={i} id={`botp-${i}`} maxLength={1} value={v} inputMode="numeric"
                      onChange={e=>{if(!/^\d*$/.test(e.target.value))return;const n=[...brandOtp];n[i]=e.target.value.slice(-1);setBrandOtp(n);if(e.target.value&&i<5)document.getElementById(`botp-${i+1}`)?.focus();}}
                      onKeyDown={e=>{if(e.key==='Backspace'&&!v&&i>0)document.getElementById(`botp-${i-1}`)?.focus();}}
                      style={{width:44,height:52,textAlign:'center',fontSize:22,fontWeight:700,background:'rgba(255,255,255,.06)',border:'1.5px solid rgba(255,255,255,.15)',borderRadius:10,color:'#fff',fontFamily:'monospace',outline:'none'}}/>
                  ))}
                </div>
                <button onClick={submitBrand} disabled={submitting} style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#DB2777,#9333EA)',border:'none',borderRadius:11,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  {submitting?<><Spin sm white/> Submitting…</>:'Submit brand →'}
                </button>
                <div style={{fontSize:11,color:'rgba(255,255,255,.3)',textAlign:'center',marginTop:10}}>Admin will review and approve within 24h. You'll get an SMS when live.</div>
              </>)}
            </>)}

            {/* ══ INFLUENCER FLOW ══ */}
            {formType==='influencer'&&(<>
              {step<=4&&<div style={{display:'flex',gap:4,marginBottom:20}}>{[1,2,3,4].map(s=><div key={s} style={{flex:1,height:3,borderRadius:2,background:step>=s?'#818CF8':'rgba(255,255,255,.08)'}}/>)}</div>}

              {/* Step 1 — invite code + phone */}
              {step===1&&(<>
                <div style={{fontSize:16,fontWeight:800,color:'#fff',marginBottom:4}}>Join as an influencer</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:20}}>Step 1 — Enter your invite code and phone</div>
                <label style={darkLabel}>Invite code *</label>
                <input value={invCode} onChange={e=>{setInvCode(e.target.value.toUpperCase());setFormErr('');}} placeholder="e.g. EASY100" style={{...darkInput,marginBottom:14,letterSpacing:'.1em',fontFamily:'monospace',fontSize:16}}/>
                <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginBottom:14}}>No code? <a href="https://instagram.com/ronaksure" target="_blank" rel="noopener noreferrer" style={{color:'#F472B6',fontWeight:700,textDecoration:'none'}}>DM @ronaksure on Instagram</a></div>
                <label style={darkLabel}>Phone number *</label>
                <input value={infPhone} onChange={e=>setInfPhone(e.target.value)} placeholder="+1 415 000 0000" type="tel" style={{...darkInput,marginBottom:22}}/>
                <button onClick={sendInfOtp} disabled={submitting} style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#8B5CF6,#6366F1)',border:'none',borderRadius:11,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  {submitting?<><Spin sm white/> Sending…</>:'Get verification code →'}
                </button>
              </>)}

              {/* Step 3 — OTP */}
              {step===3&&(<>
                <div style={{fontSize:16,fontWeight:800,color:'#fff',marginBottom:4}}>Enter the code</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:20}}>Sent to {infPhone}</div>
                <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:20}}>
                  {infOtp.map((v,i)=>(
                    <input key={i} id={`iotp-${i}`} maxLength={1} value={v} inputMode="numeric"
                      onChange={e=>handleInfOtpKey(i,e.target.value)}
                      onKeyDown={e=>{if(e.key==='Backspace'&&!v&&i>0)document.getElementById(`iotp-${i-1}`)?.focus();}}
                      style={{width:44,height:52,textAlign:'center',fontSize:22,fontWeight:700,background:'rgba(255,255,255,.06)',border:'1.5px solid rgba(255,255,255,.15)',borderRadius:10,color:'#fff',fontFamily:'monospace',outline:'none'}}/>
                  ))}
                </div>
                <button onClick={verifyInfOtp} disabled={submitting} style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#8B5CF6,#6366F1)',border:'none',borderRadius:11,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  {submitting?<><Spin sm white/> Verifying…</>:'Continue →'}
                </button>
                <button onClick={()=>setStep(1)} style={{width:'100%',marginTop:8,padding:'11px',background:'transparent',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,color:'rgba(255,255,255,.5)',fontSize:13,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>← Change number</button>
              </>)}

              {/* Step 4 — profile details (new users) */}
              {step===4&&(<>
                <div style={{fontSize:16,fontWeight:800,color:'#fff',marginBottom:4}}>Your profile</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:20}}>Tell brands about you</div>
                <label style={darkLabel}>Your name *</label>
                <input value={inf.name} onChange={e=>setI('name',e.target.value)} placeholder="Your name" style={{...darkInput,marginBottom:14}}/>
                <label style={darkLabel}>Handle (your @username)</label>
                <input value={inf.handle} onChange={e=>setI('handle',e.target.value)} placeholder="@yourhandle" style={{...darkInput,marginBottom:14}}/>
                <label style={darkLabel}>Platforms</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:14}}>
                  {PLATFORMS.map(p=><Chip key={p} label={p} active={inf.platforms.includes(p)} onClick={()=>toggleArr('platforms',p)}/>)}
                </div>
                <label style={darkLabel}>Approximate follower count</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:14}}>
                  {FOLLOWER_RANGES.map(r=><Chip key={r} label={r} active={inf.followers===r} onClick={()=>setI('followers',r)}/>)}
                </div>
                <label style={darkLabel}>City</label>
                <input value={inf.city} onChange={e=>setI('city',e.target.value)} placeholder="San Francisco" style={{...darkInput,marginBottom:22}}/>
                <button onClick={saveInfProfile} disabled={submitting} style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#8B5CF6,#6366F1)',border:'none',borderRadius:11,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  {submitting?<><Spin sm white/> Saving…</>:'Save & continue →'}
                </button>
              </>)}

              {/* Step 6 — pick brand to review + generate URL */}
              {step===6&&(<>
                <div style={{fontSize:16,fontWeight:800,color:'#fff',marginBottom:4}}>👋 Welcome{infProfile?.name?`, ${infProfile.name}`:''}!</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:20}}>Pick a brand to feature in your bio link and share your experience</div>
                <div style={{maxHeight:320,overflowY:'auto',display:'flex',flexDirection:'column',gap:10}}>
                  {brands.filter(b=>b.approved!==false).map(b=>{
                    const m=INF_CAT_META[b.category]||{color:'#0D9488',bg:'rgba(13,148,136,.08)',icon:'🏢'};
                    return(
                      <button key={b._id} onClick={()=>setSelectedBrandForReview(b)}
                        style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:selectedBrandForReview?._id===b._id?m.bg:'rgba(255,255,255,.03)',border:`1px solid ${selectedBrandForReview?._id===b._id?m.color:'rgba(255,255,255,.08)'}`,borderRadius:10,cursor:'pointer',textAlign:'left',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                        <div style={{width:36,height:36,borderRadius:9,background:m.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{m.icon}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{b.name}</div>
                          <div style={{fontSize:11,color:'rgba(255,255,255,.35)'}}>{b.category}{b.city?` · 📍${b.city}`:''}</div>
                        </div>
                        {selectedBrandForReview?._id===b._id&&<span style={{color:m.color,fontSize:14}}>✓</span>}
                      </button>
                    );
                  })}
                </div>
                {selectedBrandForReview&&(
                  <div style={{marginTop:16}}>
                    {/* Star rating */}
                    <div style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,.5)',marginBottom:8}}>Rate {selectedBrandForReview.name} (optional)</div>
                    <div style={{display:'flex',gap:4,marginBottom:10}}>
                      {[1,2,3,4,5].map(s=>(
                        <button key={s} onClick={()=>setReviewStars(s)} style={{fontSize:28,background:'none',border:'none',cursor:'pointer',opacity:reviewStars>=s?1:.25,transition:'opacity .15s'}}>⭐</button>
                      ))}
                    </div>
                    {reviewStars>0&&(
                      <textarea value={reviewText} onChange={e=>setReviewText(e.target.value)} rows={2} placeholder="Share your experience with this brand… (optional)"
                        style={{...darkInput,resize:'none',marginBottom:14,fontSize:13}}/>
                    )}
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>submitReview(selectedBrandForReview._id, true)} style={{flex:1,padding:'12px',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,color:'rgba(255,255,255,.5)',fontSize:13,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Skip →</button>
                      <button onClick={()=>submitReview(selectedBrandForReview._id, false)} disabled={submitting} style={{flex:2,padding:'12px',background:'linear-gradient(135deg,#8B5CF6,#6366F1)',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                        {reviewStars>0?'Submit & get my link →':'Generate my link →'}
                      </button>
                    </div>
                  </div>
                )}
              </>)}

              {/* Step 7 — show generated URL */}
              {step===7&&generatedUrl&&(<>
                <div style={{textAlign:'center',marginBottom:20}}>
                  <div style={{fontSize:32,marginBottom:10}}>🎉</div>
                  <div style={{fontSize:17,fontWeight:800,color:'#fff',marginBottom:6}}>Your bio link is ready!</div>
                  <div style={{fontSize:13,color:'rgba(255,255,255,.4)',lineHeight:1.6}}>Add this to your Instagram, TikTok, or any profile bio. When followers open it, they'll see the brands you feature.</div>
                </div>
                <div style={{background:'rgba(99,91,255,.1)',border:'1px solid rgba(99,91,255,.3)',borderRadius:12,padding:'14px 16px',marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:600,color:'#818CF8',marginBottom:6}}>Your unique link</div>
                  <div style={{fontFamily:'monospace',fontSize:13,color:'#fff',wordBreak:'break-all',marginBottom:10}}>{generatedUrl}</div>
                  <button onClick={copyUrl} style={{width:'100%',padding:'10px',background:urlCopied?'rgba(16,185,129,.2)':'rgba(99,91,255,.25)',border:`1px solid ${urlCopied?'rgba(16,185,129,.4)':'rgba(99,91,255,.4)'}`,borderRadius:8,color:urlCopied?'#34D399':'#818CF8',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif",transition:'all .2s'}}>
                    {urlCopied?'✅ Copied!':'📋 Copy link'}
                  </button>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`Check out my referral page: ${generatedUrl}`)}`} target="_blank" rel="noopener noreferrer"
                    style={{flex:1,padding:'11px',background:'#25D366',borderRadius:10,color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none',textAlign:'center',display:'block'}}>
                    Share on WhatsApp
                  </a>
                  <button onClick={()=>setStep(6)} style={{flex:1,padding:'11px',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,color:'rgba(255,255,255,.6)',fontSize:13,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    Feature another brand
                  </button>
                </div>
              </>)}
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURED BUSINESSES PAGE  (/featured)
// ═══════════════════════════════════════════════════════════════════════════════
function FeaturedPage({ onGetStarted }) {
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities,     setCities]     = useState([]);
  const [catFilter,  setCatFilter]  = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name:'', category:'', city:'', description:'', website:'', phone:'', email:'' });
  const [formErr, setFormErr] = useState('');

  const load = async (cat, city, q) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cat && cat !== 'All') params.set('category', cat);
      if (city && city !== 'All') params.set('city', city);
      if (q) params.set('q', q);
      const d = await api(`/featured?${params}`);
      setBusinesses(d.businesses || []);
      if (d.categories?.length) setCategories(['All', ...d.categories]);
      if (d.cities?.length)     setCities(['All', ...d.cities]);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(()=>{ load('All','All',''); },[]);

  const handleFilter = (cat, city) => {
    setCatFilter(cat); setCityFilter(city);
    load(cat, city, search);
  };

  const handleSearch = (q) => {
    setSearch(q);
    load(catFilter, cityFilter, q);
  };

  const submitBusiness = async () => {
    if (!form.name.trim() || !form.category.trim() || !form.city.trim()) {
      setFormErr('Name, category, and city are required.'); return;
    }
    setSubmitting(true); setFormErr('');
    try {
      await api('/featured', { method:'POST', body: JSON.stringify(form) });
      setSubmitted(true); setShowForm(false);
    } catch(e) { setFormErr(e.message); }
    setSubmitting(false);
  };

  const CATEGORY_ICONS = {
    'Real Estate':'🏠', 'Dental':'🦷', 'Legal':'⚖️', 'Finance':'💼',
    'Fitness':'💪', 'Healthcare':'🏥', 'Education':'🎓', 'Services':'🛠',
    'Other':'🏢', 'All':'✨',
  };
  const icon = (cat) => CATEGORY_ICONS[cat] || '🏢';

  return (
    <div style={{minHeight:'100vh',background:'#F7F9FC',fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif"}}>
      {/* Header */}
      <div style={{background:'#0D9488',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontWeight:800,fontSize:17,color:'#fff',letterSpacing:'-.02em',cursor:'pointer'}} onClick={()=>{window.location.hash='';window.history.back();}}>
          Easy<span style={{color:'#CCFBF1'}}>Recommend</span>
        </span>
        <button onClick={onGetStarted} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.3)',borderRadius:8,padding:'7px 16px',color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          Sign in →
        </button>
      </div>

      <div style={{maxWidth:640,margin:'0 auto',padding:'24px 16px 60px'}}>
        {/* Hero */}
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'#0D9488',marginBottom:8}}>Featured Businesses</div>
          <h1 style={{fontSize:24,fontWeight:800,color:'#0F172A',marginBottom:8,lineHeight:1.2}}>Find businesses with referral programs</h1>
          <p style={{fontSize:13,color:'#64748B',marginBottom:0}}>Refer friends, earn rewards. Browse businesses actively rewarding referrals.</p>
        </div>

        {/* Search */}
        <div style={{position:'relative',marginBottom:14}}>
          <svg style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className="fi" placeholder="Search businesses…" value={search} onChange={e=>handleSearch(e.target.value)}
            style={{paddingLeft:36,fontSize:14}}/>
        </div>

        {/* Category filter */}
        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4,marginBottom:10,WebkitOverflowScrolling:'touch'}}>
          {(categories.length ? categories : ['All','Real Estate','Dental','Legal','Finance','Fitness']).map(cat=>(
            <button key={cat} onClick={()=>handleFilter(cat, cityFilter)}
              style={{flexShrink:0,padding:'6px 14px',borderRadius:100,fontSize:12,fontWeight:600,cursor:'pointer',border:'1.5px solid',
                borderColor:catFilter===cat?'#0D9488':'#E2E8F0',
                background:catFilter===cat?'#0D9488':'#fff',
                color:catFilter===cat?'#fff':'#334155',
                fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              {icon(cat)} {cat}
            </button>
          ))}
        </div>

        {/* City filter */}
        {cities.length > 2 && (
          <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4,marginBottom:14,WebkitOverflowScrolling:'touch'}}>
            {cities.map(city=>(
              <button key={city} onClick={()=>handleFilter(catFilter, city)}
                style={{flexShrink:0,padding:'5px 12px',borderRadius:100,fontSize:11,fontWeight:600,cursor:'pointer',border:'1.5px solid',
                  borderColor:cityFilter===city?'#8B5CF6':'#E2E8F0',
                  background:cityFilter===city?'#8B5CF6':'#fff',
                  color:cityFilter===city?'#fff':'#334155',
                  fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                📍 {city}
              </button>
            ))}
          </div>
        )}

        {/* Submit banner */}
        {submitted ? (
          <div style={{padding:'14px 18px',background:'#ECFDF5',border:'1px solid rgba(16,185,129,.2)',borderRadius:10,marginBottom:14,fontSize:13,color:'#10B981',fontWeight:600,textAlign:'center'}}>
            ✅ Business submitted! We'll review and publish it shortly.
          </div>
        ) : (
          <button onClick={()=>setShowForm(f=>!f)}
            style={{width:'100%',padding:'12px',background:showForm?'#F1F5F9':'linear-gradient(135deg,#0D9488,#059669)',border:'none',borderRadius:10,color:showForm?'#334155':'#fff',fontSize:13,fontWeight:700,cursor:'pointer',marginBottom:14,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            {showForm ? 'Cancel' : '+ Add Your Business Free'}
          </button>
        )}

        {/* Submit form */}
        {showForm && (
          <div className="card" style={{marginBottom:14,padding:18}}>
            <div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:14}}>Add your business</div>
            {formErr && <div style={{fontSize:12,color:'#EF4444',marginBottom:10,padding:'8px 10px',background:'#FEF2F2',borderRadius:6}}>⚠ {formErr}</div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
              <div className="fg" style={{margin:0}}><input className="fi" placeholder="Business name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
              <div className="fg" style={{margin:0}}><input className="fi" placeholder="City *" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}/></div>
            </div>
            <div className="fg" style={{marginBottom:10}}>
              <select className="fi" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                <option value="">Select category *</option>
                {['Real Estate','Dental','Legal','Finance','Fitness','Healthcare','Education','Services','Other'].map(c=>(
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="fg" style={{marginBottom:10}}><input className="fi" placeholder="Short description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              <div className="fg" style={{margin:0}}><input className="fi" placeholder="Website" value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))}/></div>
              <div className="fg" style={{margin:0}}><input className="fi" placeholder="Phone" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
            </div>
            <div className="fg" style={{marginBottom:14}}><input className="fi" placeholder="Email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
            <button className="btn btn-primary" onClick={submitBusiness} disabled={submitting}>
              {submitting ? <><Spin sm white/> Submitting…</> : 'Submit Business →'}
            </button>
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <div style={{fontSize:12,color:'#94A3B8',marginBottom:12,fontWeight:500}}>
            {businesses.length} {businesses.length===1?'business':'businesses'} found
            {catFilter!=='All'&&` in ${catFilter}`}{cityFilter!=='All'&&` · ${cityFilter}`}
          </div>
        )}

        {/* Business cards */}
        {loading ? (
          <div style={{textAlign:'center',padding:40}}><Spin/></div>
        ) : businesses.length===0 ? (
          <div style={{textAlign:'center',padding:40}}>
            <div style={{fontSize:32,marginBottom:12}}>🏢</div>
            <div style={{fontSize:15,fontWeight:700,color:'#0F172A',marginBottom:6}}>No businesses found</div>
            <div style={{fontSize:13,color:'#64748B'}}>Try a different filter or be the first to add one!</div>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {businesses.map((b,i)=>(
              <div key={b._id||i} className="card" style={{padding:0,overflow:'hidden',border:'1px solid #E8EDF5'}}>
                <div style={{padding:'16px 18px'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:10}}>
                    <div style={{width:44,height:44,borderRadius:12,background:'linear-gradient(135deg,rgba(13,148,136,.12),rgba(5,150,105,.08))',border:'1px solid rgba(13,148,136,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                      {icon(b.category)}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                        <div style={{fontSize:15,fontWeight:700,color:'#0F172A'}}>{b.name}</div>
                        {b.featured && <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:100,background:'rgba(245,158,11,.12)',color:'#D97706',border:'1px solid rgba(245,158,11,.2)'}}>⭐ Featured</span>}
                      </div>
                      <div style={{display:'flex',gap:6,marginTop:4,flexWrap:'wrap'}}>
                        <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:100,background:'rgba(13,148,136,.08)',color:'#0D9488'}}>{b.category}</span>
                        <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:100,background:'rgba(139,92,246,.08)',color:'#7C3AED'}}>📍 {b.city}</span>
                      </div>
                    </div>
                  </div>
                  {b.description && <p style={{fontSize:13,color:'#64748B',lineHeight:1.6,margin:'0 0 10px'}}>{b.description}</p>}
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {b.website && (
                      <a href={b.website.startsWith('http')?b.website:`https://${b.website}`} target="_blank" rel="noopener noreferrer"
                        style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',background:'#F1F5F9',borderRadius:7,fontSize:12,fontWeight:600,color:'#334155',textDecoration:'none'}}>
                        🌐 Website
                      </a>
                    )}
                    {b.phone && (
                      <a href={`tel:${b.phone}`}
                        style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',background:'#F1F5F9',borderRadius:7,fontSize:12,fontWeight:600,color:'#334155',textDecoration:'none'}}>
                        📞 {b.phone}
                      </a>
                    )}
                    <button onClick={onGetStarted}
                      style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 14px',background:'linear-gradient(135deg,#0D9488,#059669)',border:'none',borderRadius:7,fontSize:12,fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      Refer & Earn →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <CtaBanner onJoin={(role)=>onGetStarted(role)}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function LandingPage({ onGetStarted, onFeatured, onInfluencer }) {
  const TICKER = ['5,000+ referrals tracked','$2M+ paid out','Verified businesses','Real-time tracking','Instant payouts','Fraud protection','WhatsApp sharing','200+ businesses'];
  const [brands,    setBrands]    = useState([]);
  const [catFilter, setCatFilter] = useState('All');
  const [brandsLoading, setBrandsLoading] = useState(true);
  const CAT_ICONS = {'Real Estate':'🏠','Dental':'🦷','Legal':'⚖️','Finance':'💼','Fitness':'💪','Healthcare':'🏥','Education':'🎓','Services':'🛠','All':'✨'};

  useEffect(()=>{
    api('/featured?').then(d=>{setBrands(d.businesses||[]);}).catch(()=>{}).finally(()=>setBrandsLoading(false));
  },[]);

  const filtered = catFilter==='All' ? brands : brands.filter(b=>b.category===catFilter);
  const cats = ['All',...[...new Set(brands.map(b=>b.category))].sort()];

  return (
    <div style={{minHeight:'100vh',background:'#fff',fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",color:'#0A2540'}}>

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,background:'#635BFF',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(99,91,255,.4)'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <span className="lp-logo">Easy<em>Recommend</em></span>
        </div>
        <div className="lp-nav-links">
          <button className="lp-nav-link" onClick={onFeatured}>Browse</button>
          <button className="lp-nav-link" onClick={onInfluencer}>Influencers</button>
          <button className="lp-nav-link" onClick={onGetStarted}>Sign in</button>
        </div>
        <button className="lp-btn-primary" onClick={onGetStarted} style={{padding:'9px 20px',fontSize:14}}>
          Get started →
        </button>
      </nav>

      {/* ── HERO — compact ── */}
      <section style={{background:'linear-gradient(180deg,#F6F9FC 0%,#fff 100%)',paddingTop:64,paddingBottom:0,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 50% at 50% 0%,rgba(99,91,255,.07) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{maxWidth:680,margin:'0 auto',padding:'48px 24px 36px',textAlign:'center',position:'relative'}}>
          <div className="lp-badge" style={{marginBottom:16,display:'inline-flex'}}>
            <span className="lp-badge-dot"/>Referral programs for every business
          </div>
          <h1 style={{fontSize:'clamp(32px,6vw,56px)',fontWeight:900,lineHeight:1.05,letterSpacing:'-.04em',color:'#0A2540',marginBottom:16}}>
            Earn by referring friends<br/>to <em style={{fontStyle:'normal',background:'linear-gradient(135deg,#635BFF,#00D4FF)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>businesses you love.</em>
          </h1>
          <p style={{fontSize:17,color:'#697386',lineHeight:1.7,marginBottom:28,maxWidth:460,margin:'0 auto 28px'}}>
            Browse businesses with referral programs. Share your link — get paid when friends become clients.
          </p>
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',marginBottom:0}}>
            <button className="lp-btn-primary" onClick={onGetStarted} style={{padding:'13px 28px',fontSize:15}}>
              Start earning free →
            </button>
            <button onClick={()=>onGetStarted('doctor')} style={{display:'inline-flex',alignItems:'center',padding:'12px 22px',borderRadius:9,background:'#fff',color:'#0A2540',border:'1.5px solid rgba(10,37,64,.15)',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
              List my business
            </button>
          </div>
        </div>
      </section>

      {/* ── BRAND DIRECTORY ── */}
      <section style={{background:'#fff',padding:'0 24px 72px'}}>
        <div style={{maxWidth:1080,margin:'0 auto'}}>

          {/* Category filters */}
          <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4,paddingTop:32,WebkitOverflowScrolling:'touch',marginBottom:28}}>
            {cats.map(cat=>(
              <button key={cat} onClick={()=>setCatFilter(cat)}
                style={{flexShrink:0,padding:'7px 16px',borderRadius:100,fontSize:13,fontWeight:600,cursor:'pointer',border:'1.5px solid',fontFamily:'inherit',transition:'all .15s',
                  borderColor:catFilter===cat?'#635BFF':'#E2E8F0',
                  background:catFilter===cat?'#635BFF':'#fff',
                  color:catFilter===cat?'#fff':'#425466'}}>
                {CAT_ICONS[cat]||'🏢'} {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          {brandsLoading ? (
            <div style={{textAlign:'center',padding:'48px 0'}}><Spin/></div>
          ) : filtered.length===0 ? (
            <div style={{textAlign:'center',padding:'48px 0',color:'#697386'}}>No businesses in this category yet.</div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20}}>
              {filtered.slice(0,12).map((b,i)=>(
                <div key={b._id||i} style={{borderRadius:16,border:'1px solid rgba(10,37,64,.07)',overflow:'hidden',background:'#fff',boxShadow:'0 2px 8px rgba(10,37,64,.04)',transition:'all .2s',cursor:'pointer'}}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(10,37,64,.1)';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 2px 8px rgba(10,37,64,.04)';}}>
                  <div style={{padding:'18px 18px 14px'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:10}}>
                      <div style={{width:44,height:44,borderRadius:11,background:'rgba(99,91,255,.08)',border:'1px solid rgba(99,91,255,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                        {CAT_ICONS[b.category]||'🏢'}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:15,fontWeight:700,color:'#0A2540',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</div>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:100,background:'rgba(99,91,255,.08)',color:'#635BFF'}}>{b.category}</span>
                          {b.city&&<span style={{fontSize:11,fontWeight:500,padding:'2px 8px',borderRadius:100,background:'#F6F9FC',color:'#697386'}}>📍 {b.city}</span>}
                          {b.featured&&<span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:100,background:'rgba(245,158,11,.1)',color:'#D97706'}}>⭐</span>}
                        </div>
                      </div>
                    </div>
                    {b.description&&<p style={{fontSize:12,color:'#697386',lineHeight:1.6,margin:'0 0 14px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{b.description}</p>}
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      {b.phone&&<a href={`tel:${b.phone}`} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'6px 10px',background:'#F6F9FC',borderRadius:7,fontSize:11,fontWeight:600,color:'#425466',textDecoration:'none'}}>📞 Call</a>}
                      {b.website&&<a href={b.website.startsWith('http')?b.website:`https://${b.website}`} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:4,padding:'6px 10px',background:'#F6F9FC',borderRadius:7,fontSize:11,fontWeight:600,color:'#425466',textDecoration:'none'}}>🌐 Website</a>}
                      <button onClick={onGetStarted} style={{marginLeft:'auto',padding:'6px 12px',background:'#635BFF',border:'none',borderRadius:7,fontSize:11,fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'inherit'}}>
                        Refer & Earn →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* See all */}
          {filtered.length > 12 && (
            <div style={{textAlign:'center',marginTop:28}}>
              <button onClick={onFeatured} style={{padding:'12px 28px',background:'transparent',border:'1.5px solid rgba(10,37,64,.15)',borderRadius:10,fontSize:14,fontWeight:600,color:'#425466',cursor:'pointer',fontFamily:'inherit'}}>
                See all {filtered.length} businesses →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="lp-ticker-wrap">
        <div className="lp-ticker-track">
          {[...TICKER,...TICKER].map((t,i)=>(
            <span key={i} className="lp-ticker-item"><span className="lp-ticker-dot"/>{t}</span>
          ))}
        </div>
      </div>
      {/* ── STATS ── */}
      <section style={{background:'#0A2540',padding:'56px 24px'}}>
        <div className="lp-stats-grid" style={{maxWidth:960,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0}}>
          {[['5,000+','Referrals logged'],['$2M+','Paid out'],['200+','Active businesses'],['98%','Satisfaction rate']].map(([n,l],i)=>(
            <div key={l} className="lp-stat" style={{borderRight:i<3?'1px solid rgba(255,255,255,.07)':undefined}}>
              <div className="lp-stat-num" style={{background:'linear-gradient(135deg,#635BFF,#00D4FF)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{n}</div>
              <div className="lp-stat-lbl">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{background:'#F6F9FC',borderTop:'1px solid rgba(10,37,64,.06)',borderBottom:'1px solid rgba(10,37,64,.06)'}}>
        <div className="lp-section" style={{textAlign:'center'}}>
          <div className="lp-section-tag">How it works</div>
          <h2 className="lp-section-h" style={{textAlign:'center'}}>Three steps to your first payout</h2>
          <p className="lp-section-sub" style={{margin:'0 auto 56px'}}>No complicated setup. Share, track, and get paid.</p>
          <div className="lp-steps-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:28,textAlign:'left'}}>
            {[
              {n:'1',icon:'📱',title:'Get your link',body:'Sign up with your phone in 30 seconds. Instantly get a unique referral code and shareable link.'},
              {n:'2',icon:'🤝',title:'Refer someone',body:'Share your link on WhatsApp or with friends. When they visit, they mention your code.'},
              {n:'3',icon:'💰',title:'Get paid',body:'The business approves the visit and your commission drops into your wallet. Withdraw anytime.'},
            ].map((s,i)=>(
              <div key={s.n} style={{background:'#fff',borderRadius:16,padding:28,border:'1px solid rgba(10,37,64,.07)',boxShadow:'0 2px 8px rgba(10,37,64,.04)',position:'relative'}}>
                <div style={{position:'absolute',top:20,right:20,fontSize:52,fontWeight:900,color:'#F0F4F8',lineHeight:1,userSelect:'none'}}>{s.n}</div>
                <div className="lp-step-num" style={{marginBottom:16}}>{s.n}</div>
                <div style={{fontSize:28,marginBottom:12}}>{s.icon}</div>
                <div style={{fontSize:17,fontWeight:700,color:'#0A2540',marginBottom:8,letterSpacing:'-.01em'}}>{s.title}</div>
                <div style={{fontSize:14,color:'#697386',lineHeight:1.7}}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR REFERRERS ── */}
      <section style={{background:'#fff'}}>
        <div className="lp-section">
          <div className="lp-feat-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:72,alignItems:'center'}}>
            <div>
              <div className="lp-section-tag">For Referrers</div>
              <h2 className="lp-section-h">Earn while you connect friends with great businesses</h2>
              <p className="lp-section-sub" style={{marginBottom:36}}>Every successful referral puts real money in your pocket — no selling, no upfront cost, just sharing.</p>
              <div style={{display:'flex',flexDirection:'column',gap:20}}>
                {[
                  {icon:'🔗',title:'Your unique link',body:'Works with any partner business',bg:'rgba(99,91,255,.08)'},
                  {icon:'📊',title:'Real-time tracking',body:'Watch referrals go from pending → paid',bg:'rgba(0,212,255,.08)'},
                  {icon:'💳',title:'Instant withdrawal',body:'Cash out to bank or mobile wallet',bg:'rgba(16,185,129,.08)'},
                  {icon:'🔔',title:'Instant notifications',body:'Alerted the moment you\'re approved',bg:'rgba(245,158,11,.08)'},
                ].map(f=>(
                  <div key={f.title} style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                    <div style={{width:40,height:40,borderRadius:10,background:f.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0}}>{f.icon}</div>
                    <div><div style={{fontSize:14,fontWeight:700,color:'#0A2540',marginBottom:3}}>{f.title}</div><div style={{fontSize:13,color:'#697386',lineHeight:1.6}}>{f.body}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:'#0A2540',borderRadius:20,padding:28,position:'relative',overflow:'hidden',boxShadow:'0 24px 64px rgba(10,37,64,.25)'}}>
              <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,91,255,.25),transparent 70%)',pointerEvents:'none'}}/>
              <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,.4)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:20}}>Your Wallet</div>
              {[{lbl:'⏳ Pending',val:'$350',color:'#F59E0B'},{lbl:'✅ Approved',val:'$1,200',color:'#34D399'},{lbl:'💳 Withdrawable',val:'$850',color:'#818CF8'}].map(w=>(
                <div key={w.lbl} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.07)',borderRadius:10,marginBottom:10}}>
                  <span style={{fontSize:13,color:'rgba(255,255,255,.6)',fontWeight:500}}>{w.lbl}</span>
                  <span style={{fontSize:16,fontWeight:800,color:w.color}}>{w.val}</span>
                </div>
              ))}
              <button onClick={onGetStarted} style={{width:'100%',marginTop:8,padding:'13px',background:'#635BFF',border:'none',borderRadius:10,color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 16px rgba(99,91,255,.4)'}}>
                Start earning →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR BUSINESSES ── */}
      <section style={{background:'#F6F9FC',borderTop:'1px solid rgba(10,37,64,.06)'}}>
        <div className="lp-section">
          <div className="lp-feat-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:72,alignItems:'center'}}>
            {/* Dashboard mockup */}
            <div style={{background:'#fff',borderRadius:16,overflow:'hidden',border:'1px solid rgba(10,37,64,.08)',boxShadow:'0 8px 32px rgba(10,37,64,.08)'}}>
              <div style={{background:'#F6F9FC',padding:'12px 16px',display:'flex',alignItems:'center',gap:6,borderBottom:'1px solid rgba(10,37,64,.07)'}}>
                {['#EF4444','#F59E0B','#10B981'].map(c=><div key={c} style={{width:10,height:10,borderRadius:'50%',background:c}}/>)}
                <span style={{fontSize:11,color:'#697386',marginLeft:6,fontFamily:'monospace'}}>dashboard.easyrecommend.co</span>
              </div>
              <div style={{padding:20}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
                  {[{n:'47',l:'Referrals',c:'#635BFF'},{n:'38',l:'Approved',c:'#10B981'},{n:'81%',l:'Conversion',c:'#F59E0B'},{n:'$19K',l:'Paid Out',c:'#0EA5E9'}].map(s=>(
                    <div key={s.l} style={{background:'#F6F9FC',borderRadius:10,padding:'14px',border:'1px solid rgba(10,37,64,.06)'}}>
                      <div style={{fontSize:22,fontWeight:800,color:s.c,letterSpacing:'-.02em'}}>{s.n}</div>
                      <div style={{fontSize:11,color:'#8898AA',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginTop:3}}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:'#F6F9FC',borderRadius:10,padding:14,border:'1px solid rgba(10,37,64,.06)'}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#8898AA',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:12}}>Recent referrals</div>
                  {[{n:'James R.',t:'Legal Consultation',s:'approved'},{n:'Sarah K.',t:'Property Viewing',s:'pending'},{n:'Mike T.',t:'Fitness Plan',s:'visit_completed'}].map(r=>(
                    <div key={r.n} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid rgba(10,37,64,.06)'}}>
                      <div><div style={{fontSize:13,fontWeight:600,color:'#0A2540'}}>{r.n}</div><div style={{fontSize:11,color:'#8898AA'}}>{r.t}</div></div>
                      {statusBadge(r.s)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="lp-section-tag">For Businesses</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:16}}>
                {['🏥 Healthcare','⚖️ Legal','🏠 Real Estate','💼 Finance','💪 Fitness','🦷 Dental'].map(tag=>(
                  <span key={tag} style={{padding:'4px 10px',background:'#fff',border:'1px solid rgba(10,37,64,.1)',borderRadius:100,fontSize:12,fontWeight:500,color:'#425466'}}>{tag}</span>
                ))}
              </div>
              <h2 className="lp-section-h">Grow through word-of-mouth</h2>
              <p className="lp-section-sub" style={{marginBottom:32}}>Turn your happy customers into your best marketing channel. Structured, trackable, fraud-protected.</p>
              <div className="lp-features-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {[
                  {icon:'💰',title:'Custom commissions',body:'Fixed or % per referral',bg:'rgba(99,91,255,.08)'},
                  {icon:'✅',title:'Full control',body:'Approve every referral manually',bg:'rgba(16,185,129,.08)'},
                  {icon:'📈',title:'Analytics',body:'Track rates and spend',bg:'rgba(14,165,233,.08)'},
                  {icon:'🛡️',title:'Fraud protection',body:'Verified by phone, one per client',bg:'rgba(245,158,11,.08)'},
                ].map(f=>(
                  <div key={f.title} style={{background:'#fff',borderRadius:12,padding:18,border:'1px solid rgba(10,37,64,.07)'}}>
                    <div style={{width:36,height:36,borderRadius:9,background:f.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,marginBottom:10}}>{f.icon}</div>
                    <div style={{fontSize:13,fontWeight:700,color:'#0A2540',marginBottom:3}}>{f.title}</div>
                    <div style={{fontSize:12,color:'#697386',lineHeight:1.6}}>{f.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{background:'#fff',borderTop:'1px solid rgba(10,37,64,.06)'}}>
        <div className="lp-section">
          <div style={{textAlign:'center',marginBottom:52}}>
            <div className="lp-section-tag">Testimonials</div>
            <h2 className="lp-section-h" style={{textAlign:'center'}}>People love earning with EasyRecommend</h2>
          </div>
          <div className="lp-testimonials-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
            {[
              {q:'I earned $80 last month just by telling 3 friends about my dentist. The link made it so easy.',n:'Sarah M.',r:'Dubai',tag:'🏥 Healthcare',c:'#10B981'},
              {q:'Our client count went up 35% after joining EasyRecommend. The approval control gives us confidence.',n:'James K.',r:'London',tag:'⚖️ Legal',c:'#635BFF'},
              {q:'I referred two families to my realtor and earned $400. Took 5 minutes to share the link.',n:'Priya S.',r:'Toronto',tag:'🏠 Real Estate',c:'#F59E0B'},
              {q:'As a financial advisor, EasyRecommend turned my happy clients into my best marketing channel.',n:'David L.',r:'New York',tag:'💼 Finance',c:'#0EA5E9'},
              {q:'My gym set up a referral program in minutes. Members love earning rewards for bringing friends in.',n:'Marcus T.',r:'Sydney',tag:'💪 Fitness',c:'#10B981'},
              {q:'We use it for our dental practice. Patients refer friends and both sides get rewarded — win-win.',n:'Dr. Chen W.',r:'Singapore',tag:'🦷 Dental',c:'#EF4444'},
            ].map((t,i)=>(
              <div key={i} className="lp-testimonial lp-card-hover">
                <div style={{display:'flex',gap:2,marginBottom:12}}>
                  {Array(5).fill(0).map((_,j)=><span key={j} style={{color:'#F59E0B',fontSize:13}}>★</span>)}
                </div>
                <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 9px',borderRadius:100,fontSize:11,fontWeight:700,color:t.c,background:`${t.c}14`,marginBottom:12,border:`1px solid ${t.c}22`}}>{t.tag}</span>
                <p style={{fontSize:14,color:'#425466',lineHeight:1.75,marginBottom:18}}>{t.q}</p>
                <div style={{display:'flex',alignItems:'center',gap:10,borderTop:'1px solid rgba(10,37,64,.06)',paddingTop:14}}>
                  <div style={{width:34,height:34,borderRadius:'50%',background:t.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff',flexShrink:0}}>{t.n[0]}</div>
                  <div><div style={{fontSize:13,fontWeight:700,color:'#0A2540'}}>{t.n}</div><div style={{fontSize:11,color:'#697386'}}>{t.r}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta-section">
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(99,91,255,.3) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',maxWidth:580,margin:'0 auto'}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#818CF8',marginBottom:16}}>Ready to start?</div>
          <h2 style={{fontSize:'clamp(28px,5vw,48px)',fontWeight:900,color:'#fff',lineHeight:1.05,letterSpacing:'-.03em',marginBottom:16}}>
            Set up your referral<br/>program in minutes.
          </h2>
          <p style={{fontSize:16,color:'rgba(255,255,255,.55)',lineHeight:1.7,marginBottom:40}}>
            Reward people for spreading the word. No contracts, no setup fees.
          </p>
          <div className="lp-cta-btns" style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={onGetStarted} className="lp-btn-primary" style={{fontSize:16,padding:'15px 36px',background:'#635BFF',boxShadow:'0 4px 24px rgba(99,91,255,.5)'}}>
              Sign up free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button onClick={()=>onGetStarted('doctor')} style={{display:'inline-flex',alignItems:'center',padding:'14px 28px',borderRadius:10,background:'transparent',border:'1.5px solid rgba(255,255,255,.25)',color:'rgba(255,255,255,.8)',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
              Join as a Business →
            </button>
          </div>
          <p style={{fontSize:12,color:'rgba(255,255,255,.3)',marginTop:20}}>Free to join · No hidden fees · Local currency payouts</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div style={{maxWidth:1080,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:26,height:26,background:'#635BFF',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
            <span style={{fontWeight:700,color:'rgba(255,255,255,.6)',fontSize:13}}>EasyRecommend</span>
          </div>
          <div style={{display:'flex',gap:24,fontSize:13}}>
            {['Privacy','Terms','Support'].map(l=><span key={l} style={{cursor:'pointer',color:'rgba(255,255,255,.35)',transition:'color .15s'}} onMouseEnter={e=>e.target.style.color='rgba(255,255,255,.7)'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.35)'}>{l}</span>)}
          </div>
          <div style={{fontSize:12}}>© 2026 EasyRecommend.</div>
        </div>
      </footer>
    </div>
  );
}

// ─── Country codes ────────────────────────────────────────────────────────────
const COUNTRIES = [
  { code:'+1',   flag:'🇺🇸', name:'USA / Canada',  placeholder:'XXX XXX XXXX' },
  { code:'+44',  flag:'🇬🇧', name:'UK',             placeholder:'7XXX XXXXXX' },
  { code:'+971', flag:'🇦🇪', name:'UAE',            placeholder:'5X XXX XXXX' },
  { code:'+966', flag:'🇸🇦', name:'Saudi Arabia',  placeholder:'5X XXX XXXX' },
  { code:'+92',  flag:'🇵🇰', name:'Pakistan',      placeholder:'3XX XXXXXXX' },
  { code:'+91',  flag:'🇮🇳', name:'India',          placeholder:'XXXXX XXXXX' },
  { code:'+974', flag:'🇶🇦', name:'Qatar',          placeholder:'3X XXX XXX' },
  { code:'+965', flag:'🇰🇼', name:'Kuwait',         placeholder:'X XXX XXXX' },
  { code:'+880', flag:'🇧🇩', name:'Bangladesh',     placeholder:'1X XXXX XXXX' },
  { code:'+93',  flag:'🇦🇫', name:'Afghanistan',    placeholder:'7X XXX XXXX' },
  { code:'+90',  flag:'🇹🇷', name:'Turkey',         placeholder:'5XX XXX XXXX' },
  { code:'+49',  flag:'🇩🇪', name:'Germany',        placeholder:'XXX XXXXXXX' },
  { code:'+33',  flag:'🇫🇷', name:'France',         placeholder:'X XX XX XX XX' },
  { code:'+61',  flag:'🇦🇺', name:'Australia',      placeholder:'4XX XXX XXX' },
  { code:'+60',  flag:'🇲🇾', name:'Malaysia',       placeholder:'1X XXXX XXXX' },
];

// ─── Reusable CTA banner (bottom of public pages) ────────────────────────────
function CtaBanner({ onJoin }) {
  const [showForm, setShowForm] = useState(false);
  const [bizName, setBizName]   = useState('');
  const [sending,  setSending]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [err,      setErr]      = useState('');

  const submit = async () => {
    if (!bizName.trim()) { setErr('Please enter your business name.'); return; }
    setSending(true); setErr('');
    try {
      await fetch('https://datingggo-d609631f502c.herokuapp.com/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ phoneNumber: '+18062248515', message: `🚀 New campaign interest!\nBusiness: ${bizName.trim()}\nSource: EasyRecommend CTA` }] }),
      });
      setDone(true); setShowForm(false);
    } catch { setErr('Something went wrong. Try again.'); }
    setSending(false);
  };

  return (
    <div style={{margin:'24px 0 0'}}>
      {/* Campaign interest card */}
      <div style={{background:'#fff',border:'1.5px solid rgba(13,148,136,.2)',borderRadius:14,padding:'16px 18px',marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:4}}>
          Want to run a similar referral campaign for your business?
        </div>
        <div style={{fontSize:12,color:'#64748B',marginBottom:12,lineHeight:1.5}}>
          Share it with your existing customers and get more — we'll set it up for you.
        </div>
        {done ? (
          <div style={{fontSize:13,fontWeight:600,color:'#10B981'}}>✅ Got it! We'll be in touch shortly.</div>
        ) : showForm ? (
          <div>
            {err && <div style={{fontSize:11,color:'#EF4444',marginBottom:8}}>⚠ {err}</div>}
            <div style={{display:'flex',gap:8}}>
              <input className="fi" placeholder="Your business name" value={bizName} onChange={e=>{setBizName(e.target.value);setErr('');}}
                style={{flex:1,fontSize:13}} autoFocus onKeyDown={e=>e.key==='Enter'&&submit()}/>
              <button className="btn btn-primary btn-sm" onClick={submit} disabled={sending} style={{flexShrink:0}}>
                {sending?<Spin sm white/>:'Submit →'}
              </button>
            </div>
            <button style={{background:'none',border:'none',fontSize:11,color:'#94A3B8',cursor:'pointer',marginTop:8,fontFamily:"'Plus Jakarta Sans',sans-serif"}} onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        ) : (
          <button onClick={()=>setShowForm(true)}
            style={{display:'inline-flex',alignItems:'center',gap:6,padding:'9px 18px',background:'linear-gradient(135deg,#0D9488,#059669)',border:'none',borderRadius:8,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:'0 3px 12px rgba(13,148,136,.3)'}}>
            Get started free →
          </button>
        )}
      </div>

      {/* Main dark CTA */}
      <div style={{background:'linear-gradient(135deg,#0F172A,#0D4A45)',borderRadius:16,padding:'28px 24px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(13,148,136,.2) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'relative'}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#2DD4BF',marginBottom:8}}>Ready to start?</div>
          <p style={{fontSize:14,color:'rgba(248,250,252,.65)',lineHeight:1.6,marginBottom:20}}>
            Set up a referral program in minutes. Reward people for spreading the word.
          </p>
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={()=>onJoin('doctor')}
              style={{display:'inline-flex',alignItems:'center',gap:8,padding:'12px 24px',background:'linear-gradient(135deg,#0D9488,#059669)',border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:'0 4px 16px rgba(13,148,136,.35)'}}>
              I'm a Business →
            </button>
            <button onClick={()=>onJoin('patient')}
              style={{display:'inline-flex',alignItems:'center',gap:8,padding:'12px 24px',background:'transparent',border:'1.5px solid rgba(255,255,255,.2)',borderRadius:10,color:'rgba(255,255,255,.8)',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              I'm a Referrer →
            </button>
          </div>
          <p style={{fontSize:11,color:'rgba(248,250,252,.3)',marginTop:14}}>Free to join · No hidden fees</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin, clinicId, initialRole }) {
  const [step,    setStep]   = useState('phone');
  const [cc,      setCc]     = useState(COUNTRIES[0]); // country code object
  const [phone,   setPhone]  = useState('');
  const [otp,     setOtp]    = useState(['','','','','','']);
  const [name,    setName]   = useState('');
  const [role,    setRole]   = useState(initialRole || 'patient');
  const [clinic,  setClinic] = useState('');
  const [token,   setTok]    = useState('');
  const [load,    setLoad]   = useState(false);
  const [err,     setErr]    = useState('');
  const [ccOpen,  setCcOpen] = useState(false);

  // Full phone = country code + local number (stripped of spaces)
  const fullPhone = `${cc.code}${phone.replace(/\s/g,'')}`;

  const sendOtp=async()=>{
    if(!phone.trim()){setErr('Enter your phone number');return;}
    setLoad(true);setErr('');
    try{await api('/auth/send-otp',{method:'POST',body:JSON.stringify({phone:fullPhone})});setStep('otp');}
    catch(e){setErr(e.message);}finally{setLoad(false);}
  };
  const verifyOtp=async()=>{
    const code=otp.join('');
    if(code.length<6){setErr('Enter the 6-digit code');return;}
    setLoad(true);setErr('');
    try{
      const d=await api('/auth/verify-otp',{method:'POST',body:JSON.stringify({phone:fullPhone,otp:code})});
      setTok(d.token);
      if(d.isNew || !d.user?.name?.trim()){
        // New user — show profile step
        setStep('profile');
      } else {
        // Existing user with name — fetch fresh profile and log them in directly
        try {
          const me = await api('/auth/me',{},d.token);
          const auth = {...d, user: me.user, token: d.token};
          saveAuth(auth);
          onLogin(auth);
        } catch {
          // Fallback to verify-otp data if /me fails
          saveAuth(d); onLogin(d);
        }
      }
    }catch(e){setErr(e.message);}finally{setLoad(false);}
  };
  const completeProfile=async()=>{
    if(!name.trim()){setErr('Enter your full name');return;}
    setLoad(true);setErr('');
    try{
      const effectiveRole=clinicId?'patient':role;
      const d=await api('/auth/register',{method:'POST',body:JSON.stringify({name,role:effectiveRole,clinicName:clinic,clinicId:clinicId||undefined})},token);
      // Use the fresh token from register (has correct role), not the stale OTP token
      const a={...d,token:d.token||token};saveAuth(a);onLogin(a);
    }catch(e){setErr(e.message);}finally{setLoad(false);}
  };
  const handleOtpKey=(i,val)=>{
    if(!/^\d*$/.test(val))return;
    const n=[...otp];n[i]=val.slice(-1);setOtp(n);
    if(val&&i<5)document.getElementById(`otp-${i+1}`)?.focus();
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px 20px',background:'linear-gradient(160deg,rgba(13,148,136,.08) 0%,#F7F9FC 50%)'}}>
      <div style={{width:'100%',maxWidth:380}}>
        {clinicId&&(
          <div className="au" style={{background:'linear-gradient(135deg,#0D9488,#059669)',borderRadius:12,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🏥</div>
            <div><div style={{fontSize:13,fontWeight:700,color:'#fff'}}>You've been invited!</div><div style={{fontSize:12,color:'rgba(255,255,255,.75)'}}>Enter your number to get your referral code.</div></div>
          </div>
        )}
        <div className="au" style={{textAlign:'center',marginBottom:24}}>
          <div style={{width:52,height:52,background:'linear-gradient(135deg,#0D9488,#059669)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',boxShadow:'0 4px 16px rgba(13,148,136,.3)'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.95 9.5 19.79 19.79 0 01.88 4.72 2 2 0 012.88 2.54h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L7.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
          </div>
          <h1 style={{fontSize:22,fontWeight:800,color:'#0F172A'}}>EasyRecommend</h1>
          <p style={{fontSize:13,color:'#64748B',marginTop:3}}>Earn rewards by referring friends & clients</p>
        </div>

        <div className="card au1" style={{padding:24}}>
          <ErrAlert msg={err}/>

          {step==='phone'&&(<>
            <div style={{fontSize:17,fontWeight:700,marginBottom:2}}>Enter your number</div>
            <p style={{fontSize:13,color:'#64748B',marginBottom:18}}>We'll send you a quick verification code</p>
            <div className="fg">
              <div style={{display:'flex',gap:8,alignItems:'stretch'}}>
                <div style={{position:'relative',flexShrink:0}}>
                  <button
                    type="button"
                    onClick={()=>setCcOpen(o=>!o)}
                    style={{height:'100%',minWidth:90,padding:'12px 10px',background:'#fff',border:'1.5px solid #E8EDF5',borderRadius:10,display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:600,color:'#0F172A',whiteSpace:'nowrap',transition:'border-color .15s'}}
                  >
                    <span style={{fontSize:18,lineHeight:1}}>{cc.flag}</span>
                    <span>{cc.code}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" style={{transform:ccOpen?'rotate(180deg)':'none',transition:'transform .15s'}}><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  {ccOpen && (
                    <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,zIndex:200,background:'#fff',border:'1px solid #E8EDF5',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,.12)',minWidth:220,maxHeight:260,overflowY:'auto'}}>
                      {COUNTRIES.map(c=>(
                        <button key={c.code} type="button" onClick={()=>{setCc(c);setCcOpen(false);setPhone('');}}
                          style={{width:'100%',padding:'10px 14px',background:c.code===cc.code?'rgba(13,148,136,.06)':'transparent',border:'none',borderBottom:'1px solid #F1F5F9',display:'flex',alignItems:'center',gap:10,cursor:'pointer',textAlign:'left',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                          <span style={{fontSize:20,lineHeight:1,flexShrink:0}}>{c.flag}</span>
                          <span style={{fontSize:13,fontWeight:500,color:'#0F172A',flex:1}}>{c.name}</span>
                          <span style={{fontSize:13,fontWeight:700,color:'#64748B'}}>{c.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input className="fi" type="tel" placeholder={cc.placeholder} value={phone}
                  onChange={e=>{setPhone(e.target.value.replace(/[^\d\s]/g,''));setErr('');}}
                  onKeyDown={e=>e.key==='Enter'&&sendOtp()} inputMode="numeric" style={{flex:1}}/>
              </div>
              {phone.trim()&&<div style={{fontSize:11,color:'#94A3B8',marginTop:5}}>Sending to: <strong style={{color:'#64748B'}}>{fullPhone}</strong></div>}
            </div>
            {ccOpen&&<div style={{position:'fixed',inset:0,zIndex:100}} onClick={()=>setCcOpen(false)}/>}
            <button className="btn btn-primary" onClick={sendOtp} disabled={load}>
              {load?<><Spin sm white/> Sending…</>:'Get code →'}
            </button>
          </>)}

          {step==='otp'&&(<>
            <div style={{fontSize:17,fontWeight:700,marginBottom:2}}>Enter the code</div>
            <p style={{fontSize:13,color:'#64748B',marginBottom:16}}>Sent to <strong>{fullPhone}</strong></p>
            <div className="otp-wrap">
              {otp.map((v,i)=>(
                <input key={i} id={`otp-${i}`} className="otp-input" maxLength={1} value={v} inputMode="numeric"
                  onChange={e=>handleOtpKey(i,e.target.value)}
                  onKeyDown={e=>{if(e.key==='Backspace'&&!v&&i>0)document.getElementById(`otp-${i-1}`)?.focus();}}/>
              ))}
            </div>
            <button className="btn btn-primary" style={{marginTop:16}} onClick={verifyOtp} disabled={load}>{load?<><Spin sm white/> Checking…</>:'Continue →'}</button>
            <button className="btn btn-secondary" style={{marginTop:8}} onClick={()=>{setStep('phone');setOtp(['','','','','','']);setErr('')}}>← Change number</button>
          </>)}

          {step==='profile'&&(<>
            <div style={{fontSize:17,fontWeight:700,marginBottom:2}}>One last thing</div>
            <p style={{fontSize:13,color:'#64748B',marginBottom:18}}>Just your name so businesses know who referred them</p>
            <div className="fg">
              <input className="fi" placeholder="Your name" value={name} onChange={e=>{setName(e.target.value);setErr('')}}/>
            </div>
            {!clinicId&&(<div className="fg">
              <select className="fi" value={role} onChange={e=>setRole(e.target.value)}>
                <option value="patient">I'm a referrer</option>
                <option value="doctor">I'm a business</option>
              </select>
            </div>)}
            {clinicId&&<div style={{fontSize:12,color:'#64748B',marginBottom:14,padding:'8px 12px',background:'rgba(13,148,136,.06)',borderRadius:8,border:'1px solid rgba(13,148,136,.15)'}}>🏥 You'll be linked to this business automatically.</div>}
            {role==='doctor'&&!clinicId&&<div className="fg">
              <input className="fi" placeholder="Business name" value={clinic} onChange={e=>setClinic(e.target.value)}/>
            </div>}
            <button className="btn btn-primary" onClick={completeProfile} disabled={load}>{load?<><Spin sm white/> Saving…</>:'Done →'}</button>
          </>)}
        </div>
      </div>
    </div>
  );
}

// ─── Editable share message card ─────────────────────────────────────────────
function ShareMessageCard({ shareText, waText: _waText, shareUrl, token, compact }) {
  const [msg,        setMsg]        = useState(shareText);
  const [editing,    setEditing]    = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [showQr,     setShowQr]     = useState(false);
  const [showBulk,   setShowBulk]   = useState(false);
  const [showSingle, setShowSingle] = useState(false);
  const [singlePhone, setSinglePhone] = useState('');
  const [sendingSingle, setSendingSingle] = useState(false);
  const [singleResult, setSingleResult] = useState(null);
  const [contacts,   setContacts]   = useState([]); // current active list [{name,phone}]
  const [selected,   setSelected]   = useState(new Set());
  const [sending,    setSending]    = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [fileErr,    setFileErr]    = useState('');
  const [savedLists, setSavedLists] = useState([]); // lists from backend
  const [activeListId, setActiveListId] = useState(null); // which saved list is loaded
  const [savingList, setSavingList] = useState(false);
  const [listName,   setListName]   = useState('');
  const isDirty = msg !== shareText;
  const url = shareUrl || '';

  // Load saved lists on mount
  useEffect(()=>{
    if (!token) return;
    api('/contacts', {}, token)
      .then(d=>setSavedLists(d.lists || []))
      .catch(()=>{});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg);
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  };

  const loadSavedList = (list) => {
    setContacts(list.contacts);
    setSelected(new Set(list.contacts.map((_,i)=>i)));
    setActiveListId(list._id);
    setSendResult(null);
  };

  const deleteSavedList = async (listId) => {
    try {
      await api(`/contacts/${listId}`, { method:'DELETE' }, token);
      setSavedLists(l => l.filter(x => x._id !== listId));
      if (activeListId === listId) { setContacts([]); setSelected(new Set()); setActiveListId(null); }
    } catch(e) { alert(e.message); }
  };

  const saveCurrentList = async () => {
    if (!contacts.length) return;
    setSavingList(true);
    try {
      const name = listName.trim() || `Upload ${new Date().toLocaleDateString()}`;
      const d = await api('/contacts', { method:'POST', body:JSON.stringify({ name, contacts }) }, token);
      setSavedLists(l => [d.list, ...l]);
      setActiveListId(d.list._id);
      setListName('');
    } catch(e) { alert(e.message); }
    finally { setSavingList(false); }
  };

  // Parse CSV or Excel file
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileErr(''); setContacts([]); setSelected(new Set()); setSendResult(null); setActiveListId(null);
    const ext = file.name.split('.').pop().toLowerCase();
    try {
      let rows = [];
      if (ext === 'csv' || ext === 'txt') {
        const text = await file.text();
        const lines = text.trim().split('\n');
        const hasHeader = /name|phone|mobile|contact|number/i.test(lines[0]);
        const dataLines = hasHeader ? lines.slice(1) : lines;
        rows = dataLines.map(l => {
          const parts = l.split(/[,;\t]/);
          const phone = parts.find(p => /\d{7,}/.test(p.replace(/[\s\-\+\(\)]/g,'')))?.trim() || '';
          const name  = parts.find(p => p && !/\d{5,}/.test(p))?.trim() || '';
          return { name, phone };
        }).filter(r => r.phone);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const XLSX = window.XLSX;
        if (!XLSX) { setFileErr('Excel support requires SheetJS. Please save as CSV instead.'); return; }
        const buf = await file.arrayBuffer();
        const wb  = XLSX.read(buf, { type: 'array' });
        const ws  = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const hasHeader = /name|phone|mobile/i.test(String(data[0]));
        const dataRows = hasHeader ? data.slice(1) : data;
        rows = dataRows.map(r => {
          const phone = String(r.find?.(c => /\d{7,}/.test(String(c).replace(/[\s\-\+\(\)]/g,''))) || '').trim();
          const name  = String(r.find?.(c => c && !/\d{5,}/.test(String(c))) || '').trim();
          return { name, phone };
        }).filter(r => r.phone);
      } else {
        setFileErr('Please upload a .csv or .xlsx file.'); return;
      }
      if (rows.length === 0) { setFileErr('No valid phone numbers found.'); return; }
      setContacts(rows);
      setSelected(new Set(rows.map((_,i)=>i)));
      setListName(file.name.replace(/\.[^.]+$/, ''));
    } catch(err) {
      setFileErr('Failed to parse file: ' + err.message);
    }
  };

  const toggleAll = () => {
    if (selected.size === contacts.length) setSelected(new Set());
    else setSelected(new Set(contacts.map((_,i)=>i)));
  };
  const toggleOne = (i) => {
    const s = new Set(selected);
    s.has(i) ? s.delete(i) : s.add(i);
    setSelected(s);
  };

  const sendBulk = async () => {
    const targets = contacts.filter((_,i) => selected.has(i));
    if (!targets.length) return;
    setSending(true); setSendResult(null);
    let sent = 0, failed = 0;
    for (const c of targets) {
      try {
        const res = await fetch('https://datingggo-d609631f502c.herokuapp.com/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ phoneNumber: c.phone, message: msg }] }),
        });
        if (res.ok) sent++; else failed++;
      } catch { failed++; }
    }
    setSending(false);
    setSendResult({ sent, failed });
  };

  const trackShare = (channel) => {
    api('/share-event', { method:'POST', body:JSON.stringify({ channel, refCode: url?.split('r=')?.[1] || url?.split('b=')?.[1] || '' }) })
      .catch(()=>{});
  };

  const WA_ICO = <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;

  return (
    <div style={{marginTop:12}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
        <div style={{fontSize:11,fontWeight:600,color:'#64748B',letterSpacing:'.05em',textTransform:'uppercase'}}>Share message</div>
        <div style={{display:'flex',gap:6}}>
          {isDirty&&<button className="btn btn-secondary btn-xs" onClick={()=>setMsg(shareText)} style={{fontSize:10}}>Reset</button>}
          <button className="btn btn-secondary btn-xs" onClick={()=>setEditing(e=>!e)}>{editing?'Done':'✏️ Edit'}</button>
        </div>
      </div>

      {/* Message */}
      {editing ? (
        <textarea value={msg} onChange={e=>setMsg(e.target.value)} autoFocus
          style={{width:'100%',minHeight:110,padding:'10px 12px',background:'#F7F9FC',border:'1.5px solid #0D9488',borderRadius:10,fontSize:13,color:'#0F172A',fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1.6,resize:'vertical',outline:'none',boxSizing:'border-box',marginBottom:10}}/>
      ) : (
        <div onClick={()=>setEditing(true)} style={{background:'#F7F9FC',border:'1px solid #E8EDF5',borderRadius:10,padding:'10px 12px',fontSize:13,color:'#334155',lineHeight:1.6,whiteSpace:'pre-wrap',cursor:'text',marginBottom:10}}>
          {msg}
          <div style={{fontSize:10,color:'#94A3B8',marginTop:4}}>Tap to edit</div>
        </div>
      )}

      {/* Share channels row 1: WhatsApp + SMS */}
      <div style={{display:'flex',gap:8,marginBottom:8}}>
        <a className="btn btn-wa" style={{flex:1,textDecoration:'none',fontSize:13,padding:'10px 12px'}}
          href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"
          onClick={()=>trackShare('whatsapp')}>
          {WA_ICO} WhatsApp
        </a>
        <a className="btn btn-secondary" style={{flex:1,textDecoration:'none',fontSize:13,padding:'10px 12px',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6}}
          href={`sms:?body=${encodeURIComponent(msg)}`}
          onClick={()=>trackShare('sms')}>
          💬 Text
        </a>
      </div>

      {/* Share channels row 2: LinkedIn + Facebook */}
      <div style={{display:'flex',gap:8,marginBottom:8}}>
        <a className="btn btn-secondary" style={{flex:1,textDecoration:'none',fontSize:13,padding:'10px 12px',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,background:'#0A66C2',color:'#fff',border:'none'}}
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url||APP_URL)}&summary=${encodeURIComponent(msg)}`}
          target="_blank" rel="noopener noreferrer"
          onClick={()=>trackShare('linkedin')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
          LinkedIn
        </a>
        <a className="btn btn-secondary" style={{flex:1,textDecoration:'none',fontSize:13,padding:'10px 12px',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,background:'#1877F2',color:'#fff',border:'none'}}
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url||APP_URL)}&quote=${encodeURIComponent(msg)}`}
          target="_blank" rel="noopener noreferrer"
          onClick={()=>trackShare('facebook')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
          Facebook
        </a>
      </div>

      {/* Copy button */}
      <button className="btn btn-secondary" style={{width:'100%',marginBottom:8,fontSize:13}} onClick={handleCopy}>
        {copied ? '✓ Copied!' : '📋 Copy message'}
      </button>

      {/* QR code button */}
      <button className="btn btn-secondary" style={{width:'100%',marginBottom:10,fontSize:13}} onClick={()=>setShowQr(q=>!q)}>
        {showQr ? 'Hide QR Code' : '📲 Show QR Code'}
      </button>

      {/* QR code display */}
      {showQr && url && (
        <div style={{textAlign:'center',padding:'16px',background:'#fff',border:'1px solid #E8EDF5',borderRadius:10,marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:600,color:'#64748B',letterSpacing:'.05em',textTransform:'uppercase',marginBottom:12}}>Scan to open link</div>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}&color=0D9488&bgcolor=FFFFFF&margin=10`}
            alt="QR Code"
            style={{width:180,height:180,borderRadius:8,display:'block',margin:'0 auto'}}
          />
          <div style={{fontSize:11,color:'#94A3B8',marginTop:10,wordBreak:'break-all'}}>{url}</div>
          <a href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&color=0D9488&bgcolor=FFFFFF&margin=10`}
            download="referral-qr.png" target="_blank" rel="noopener noreferrer"
            style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:10,padding:'8px 16px',background:'#F1F5F9',borderRadius:8,fontSize:12,fontWeight:600,color:'#334155',textDecoration:'none'}}>
            ⬇️ Download QR
          </a>
        </div>
      )}

      {/* Bulk SMS toggle — hidden in compact mode */}
      {!compact && (<>
        {/* Single SMS */}
        <button className="btn btn-secondary" style={{width:'100%',marginBottom:8,fontSize:13,borderColor:'rgba(13,148,136,.3)',color:'#0D9488',background:'rgba(13,148,136,.04)'}}
          onClick={()=>{setShowSingle(s=>!s);setShowBulk(false);}}>
          💬 {showSingle?'Hide':'Send to one number'}
        </button>
        {showSingle && (
          <div style={{marginBottom:10,padding:14,background:'#F7F9FC',border:'1px solid #E8EDF5',borderRadius:10}}>
            <div style={{fontSize:12,fontWeight:600,color:'#0F172A',marginBottom:8}}>Send SMS to one person</div>
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              <input className="fi" type="tel" placeholder="+1 555 000 0000" value={singlePhone}
                onChange={e=>setSinglePhone(e.target.value)} inputMode="numeric" style={{flex:1,fontSize:13}}/>
              <button className="btn btn-primary btn-sm" style={{flexShrink:0}} disabled={sendingSingle||!singlePhone.trim()}
                onClick={async()=>{
                  setSendingSingle(true);setSingleResult(null);
                  try{
                    const res=await fetch('https://datingggo-d609631f502c.herokuapp.com/send-sms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{phoneNumber:singlePhone.trim(),message:msg}]})});
                    setSingleResult(res.ok?'✅ Sent!':'⚠ Failed');
                  }catch{setSingleResult('⚠ Failed');}
                  setSendingSingle(false);
                }}>
                {sendingSingle?<Spin sm white/>:'Send'}
              </button>
            </div>
            {singleResult&&<div style={{fontSize:12,fontWeight:600,color:singleResult.includes('✅')?'#10B981':'#EF4444'}}>{singleResult}</div>}
          </div>
        )}

        {/* Bulk SMS toggle */}
        <button
          className="btn btn-secondary"
          style={{width:'100%',fontSize:13,borderColor:'rgba(13,148,136,.3)',color:'#0D9488',background:'rgba(13,148,136,.04)'}}
          onClick={()=>{setShowBulk(b=>!b);setShowSingle(false);}}>
          📤 {showBulk ? 'Hide' : 'Bulk SMS — upload contacts'}
        </button>
      </>)}

      {/* Bulk SMS panel */}
      {showBulk && (
        <div style={{marginTop:10,padding:14,background:'#F7F9FC',border:'1px solid #E8EDF5',borderRadius:10}}>

          {/* Saved lists */}
          {savedLists.length > 0 && (
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:600,color:'#64748B',letterSpacing:'.05em',textTransform:'uppercase',marginBottom:8}}>Saved contact lists</div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {savedLists.map(list=>(
                  <div key={list._id} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 12px',background:activeListId===list._id?'rgba(13,148,136,.08)':'#fff',border:`1px solid ${activeListId===list._id?'rgba(13,148,136,.3)':'#E8EDF5'}`,borderRadius:8,cursor:'pointer'}}
                    onClick={()=>loadSavedList(list)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#0F172A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{list.name}</div>
                      <div style={{fontSize:11,color:'#94A3B8'}}>{list.contacts.length} contacts · {new Date(list.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button className="btn btn-danger btn-xs" style={{flexShrink:0}} onClick={e=>{e.stopPropagation();deleteSavedList(list._id);}}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{height:1,background:'#E8EDF5',margin:'14px 0'}}/>
            </div>
          )}

          {/* Upload new */}
          <div style={{fontSize:12,fontWeight:600,color:'#0F172A',marginBottom:6}}>Upload new list</div>
          <div style={{fontSize:11,color:'#94A3B8',marginBottom:10}}>CSV or Excel — columns for name and phone. First row can be a header.</div>
          <label style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'12px',background:'#fff',border:'2px dashed #CBD5E8',borderRadius:8,cursor:'pointer',fontSize:13,color:'#64748B',marginBottom:10}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Choose .csv or .xlsx
            <input type="file" accept=".csv,.xlsx,.xls,.txt" onChange={handleFile} style={{display:'none'}}/>
          </label>

          {fileErr && <div style={{fontSize:12,color:'#EF4444',marginBottom:8,padding:'8px 10px',background:'#FEF2F2',borderRadius:6}}>⚠ {fileErr}</div>}

          {contacts.length > 0 && (
            <>
              {/* Save this list */}
              {!activeListId && (
                <div style={{display:'flex',gap:8,marginBottom:12}}>
                  <input className="fi" placeholder="Name this list (e.g. March clients)"
                    value={listName} onChange={e=>setListName(e.target.value)}
                    style={{flex:1,fontSize:12,padding:'8px 10px'}}/>
                  <button className="btn btn-primary btn-sm" onClick={saveCurrentList} disabled={savingList} style={{flexShrink:0}}>
                    {savingList?<Spin sm white/>:'💾 Save'}
                  </button>
                </div>
              )}
              {activeListId && (
                <div style={{fontSize:11,color:'#0D9488',fontWeight:600,marginBottom:10}}>✓ Using saved list — changes won't auto-save</div>
              )}

              {/* Select all + count */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,fontWeight:600,color:'#0F172A'}}>
                  <input type="checkbox" checked={selected.size===contacts.length} onChange={toggleAll}
                    style={{width:16,height:16,accentColor:'#0D9488'}}/>
                  Select all ({contacts.length})
                </label>
                <span style={{fontSize:12,color:'#64748B'}}>{selected.size} selected</span>
              </div>

              {/* Contact list */}
              <div style={{maxHeight:200,overflowY:'auto',border:'1px solid #E8EDF5',borderRadius:8,background:'#fff',marginBottom:10}}>
                {contacts.map((c,i)=>(
                  <label key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderBottom:i<contacts.length-1?'1px solid #F1F5F9':'none',cursor:'pointer'}}>
                    <input type="checkbox" checked={selected.has(i)} onChange={()=>toggleOne(i)}
                      style={{width:15,height:15,accentColor:'#0D9488',flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      {c.name && <div style={{fontSize:13,fontWeight:500,color:'#0F172A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>}
                      <div style={{fontSize:12,color:'#64748B'}}>{c.phone}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Send button */}
              {sendResult ? (
                <div style={{padding:'10px 14px',background:sendResult.failed===0?'#ECFDF5':'#FFFBEB',border:`1px solid ${sendResult.failed===0?'rgba(16,185,129,.2)':'rgba(245,158,11,.2)'}`,borderRadius:8,fontSize:13,fontWeight:600,color:sendResult.failed===0?'#10B981':'#92400E',textAlign:'center'}}>
                  {sendResult.failed===0
                    ? `✅ All ${sendResult.sent} messages sent!`
                    : `✅ ${sendResult.sent} sent · ⚠ ${sendResult.failed} failed`}
                  <button className="btn btn-secondary btn-xs" style={{marginLeft:10}} onClick={()=>setSendResult(null)}>Send again</button>
                </div>
              ) : (
                <button className="btn btn-primary" onClick={sendBulk} disabled={sending||selected.size===0}>
                  {sending ? <><Spin sm white/> Sending {selected.size} messages…</> : `📤 Send SMS to ${selected.size} contacts`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function PatientDashboard({ user, token, onSignOut }) {
  const [tab,setTab]=useState('home');
  const [referrals,setReferrals]=useState([]);
  const [wallet,setWallet]=useState(null);
  const [withdrawals,setWithdrawals]=useState([]);
  const [notifs,setNotifs]=useState([]);
  const [loading,setLoading]=useState(false);
  const [showW,setShowW]=useState(false);
  const [clinicData,setClinicData]=useState(null);

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const [r1,r2,r3]=await Promise.all([api('/my/referrals',{},token),api('/wallet',{},token),api('/notifications',{},token)]);
      setReferrals(r1.referrals);setWallet(r2.wallet);setWithdrawals(r2.withdrawals);setNotifs(r3.notifications);
    }catch(e){console.error(e);}finally{setLoading(false);}
  },[token]);

  useEffect(()=>{
    load();
    // Load clinic rewards if patient is linked to a clinic
    if(user.clinicId){
      api(`/clinic/${user.clinicId}`)
        .then(d=>setClinicData(d.clinic))
        .catch(()=>{});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Always share via ?r= so the friend's visit is credited to this referrer
  const shareLink  = `${APP_URL}?r=${user.referralCode}`;
  // clinicName: prefer clinicData (fetched from API) over user.clinicName which may be stale
  const clinicName = clinicData?.name || user.clinicName || 'this business';
  const rewardLine = clinicData?.rewards || clinicData?.patientReward
    ? `\n\n${clinicData.rewards ? `I get: ${clinicData.rewards}` : ''}${clinicData.rewards && clinicData.patientReward ? ', and ' : ''}${clinicData.patientReward ? `you'll get: ${clinicData.patientReward}` : ''}.`
    : '';
  const shareText  = `Hi! I'm ${user.name} — I've been using ${clinicName} and they're great.\n\nIf you're looking for their services, I'd highly recommend them.${rewardLine}\n\nUse my referral link to sign up:\n${shareLink}`;
  const waText=encodeURIComponent(shareText);
  const unread=notifs.filter(n=>!n.isRead).length;

  return (
    <div style={{minHeight:'100vh',background:'#F7F9FC',paddingBottom:80}}>
      <div className="top-bar">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Avatar name={user.name} size={34}/>
          <div><div style={{fontSize:15,fontWeight:700,lineHeight:1.2}}>{user.name}</div><div style={{fontSize:11,color:'#94A3B8'}}>Patient</div></div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {unread>0&&<span style={{background:'#EF4444',color:'#fff',fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:100}}>{unread}</span>}
          <button className="btn btn-secondary btn-xs" onClick={onSignOut}>Sign out</button>
        </div>
      </div>

      <div style={{maxWidth:480,margin:'0 auto',padding:'16px 16px 0'}}>
        {tab==='home'&&(
          <div className="au">
            <div className="card" style={{marginBottom:12}}>
              <div className="card-body">
                <div style={{fontSize:12,fontWeight:600,color:'#64748B',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:10}}>Your Referral Code</div>
                <div className="code-box">
                  <div className="code-text">{user.referralCode}</div>
                  <div style={{fontSize:12,color:'#64748B',marginTop:6}}>Share this code with your network</div>
                </div>
                <ShareMessageCard shareText={shareText} shareUrl={shareLink} token={token}/>
              </div>
            </div>
            <div className="stat-grid">
              <div className="stat-card"><div style={{fontSize:10,color:'#94A3B8',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>⏳ Pending</div><div className="stat-num" style={{color:'#F59E0B'}}>{fmt(wallet?.pendingEarnings)}</div><div className="stat-sub">Awaiting approval</div></div>
              <div className="stat-card"><div style={{fontSize:10,color:'#94A3B8',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>💰 Withdrawable</div><div className="stat-num" style={{color:'#0D9488'}}>{fmt(wallet?.withdrawableBalance)}</div><div className="stat-sub">Ready to withdraw</div></div>
            </div>

            {clinicData && (clinicData.rewards || clinicData.patientReward || clinicData.treatments?.length>0) && (
              <div className="card" style={{marginBottom:12,border:'1px solid rgba(13,148,136,.2)',background:'rgba(13,148,136,.04)'}}>
                <div className="card-body">
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'#0D9488',marginBottom:10}}>🎁 Your Rewards at {clinicData.name}</div>
                  {clinicData.rewards && (
                    <div style={{marginBottom:8}}>
                      <div style={{fontSize:10,color:'#64748B',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>You earn per referral</div>
                      <div style={{fontSize:15,fontWeight:700,color:'#0F172A'}}>{clinicData.rewards}</div>
                    </div>
                  )}
                  {clinicData.patientReward && (
                    <div style={{paddingTop:8,borderTop:clinicData.rewards?'1px solid rgba(13,148,136,.12)':undefined,marginBottom:clinicData.treatments?.length?8:0}}>
                      <div style={{fontSize:10,color:'#F59E0B',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3}}>Your friend gets</div>
                      <div style={{fontSize:14,fontWeight:700,color:'#0F172A'}}>{clinicData.patientReward}</div>
                    </div>
                  )}
                  {clinicData.treatments?.length>0 && (
                    <div style={{paddingTop:8,borderTop:(clinicData.rewards||clinicData.patientReward)?'1px solid rgba(13,148,136,.12)':undefined}}>
                      <div style={{fontSize:10,color:'#64748B',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>Treatments</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {clinicData.treatments.map((t,i)=>(
                          <div key={i} style={{padding:'5px 10px',background:'#fff',border:'1px solid rgba(13,148,136,.2)',borderRadius:6,display:'flex',alignItems:'center',gap:5}}>
                            <span style={{fontSize:12,fontWeight:500,color:'#0F172A'}}>{t.name}</span>
                            <span style={{fontSize:11,fontWeight:700,color:'#0D9488'}}>{t.commission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {clinicData.phone && (
                    <div style={{marginTop:12,paddingTop:10,borderTop:'1px solid rgba(13,148,136,.12)',display:'flex',justifyContent:'flex-end'}}>
                      <a href={`https://wa.me/${clinicData.phone.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(`Hi! I'd like to get in touch with ${clinicData.name}.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{display:'inline-flex',alignItems:'center',gap:5,padding:'8px 14px',background:'#25D366',borderRadius:8,color:'#fff',fontWeight:600,fontSize:12,textDecoration:'none'}}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Contact Clinic
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="card">
              <div className="card-head"><span style={{fontSize:14,fontWeight:700}}>Recent Referrals</span><button className="btn btn-secondary btn-xs" onClick={()=>setTab('referrals')}>See all</button></div>
              <div className="card-body" style={{padding:'8px 18px'}}>
                {referrals.slice(0,3).length===0?<div className="empty"><div className="empty-icon">📋</div><div className="empty-title">No referrals yet</div><div className="empty-sub">Share your code to start earning</div></div>:
                referrals.slice(0,3).map(r=>(
                  <div key={r._id} className="row-item">
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600}}>{r.treatmentName||'General visit'}</div>
                      <div style={{fontSize:11,color:'#94A3B8',marginTop:2}}>{r.doctorId?.clinicName||'Clinic'} · {tAgo(r.createdAt)}</div>
                    </div>
                    {statusBadge(r.status)}
                  </div>
                ))}
              </div>
            </div>
            <div className="disclaimer" style={{marginTop:12}}>ℹ️ <strong>Reward Policy:</strong> Referral rewards are credited only after the business confirms the referral. The business reserves the right to approve or reject any referral.</div>
          </div>
        )}

        {tab==='referrals'&&(
          <div className="au">
            <div style={{fontSize:18,fontWeight:700,marginBottom:14}}>My Referrals</div>
            {loading?<div style={{display:'flex',justifyContent:'center',padding:40}}><Spin/></div>:
            referrals.length===0?<div className="empty card card-body"><div className="empty-icon">📋</div><div className="empty-title">No referrals yet</div></div>:
            referrals.map(r=>(
              <div key={r._id} className="card" style={{marginBottom:10}}>
                <div className="card-body">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <div><div style={{fontSize:14,fontWeight:700}}>{r.treatmentName||'General visit'}</div><div style={{fontSize:12,color:'#64748B',marginTop:2}}>{r.doctorId?.clinicName||'Clinic'}</div></div>
                    {statusBadge(r.status)}
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:12,color:'#94A3B8'}}>{new Date(r.createdAt).toLocaleDateString('en-US')}</span>
                    {r.commissionAmount>0&&<span style={{fontSize:13,fontWeight:700,color:r.status==='approved'?'#10B981':'#F59E0B'}}>{fmt(r.commissionAmount)}</span>}
                  </div>
                  {r.doctorNotes&&<div style={{fontSize:12,color:'#64748B',marginTop:8,padding:'8px 10px',background:'#F1F5F9',borderRadius:7}}>Note: {r.doctorNotes}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==='wallet'&&(
          <div className="au">
            <div style={{fontSize:18,fontWeight:700,marginBottom:14}}>My Wallet</div>
            <div className="stat-grid" style={{gridTemplateColumns:'1fr 1fr'}}>
              {[{lbl:'⏳ Pending',val:wallet?.pendingEarnings,color:'#F59E0B',sub:'Awaiting approval'},{lbl:'✅ Approved',val:wallet?.approvedEarnings,color:'#10B981',sub:'Total approved'},{lbl:'💳 Withdrawable',val:wallet?.withdrawableBalance,color:'#0D9488',sub:'Available now'},{lbl:'📤 Withdrawn',val:wallet?.totalWithdrawn,color:'#8B5CF6',sub:'Total withdrawn'}].map(s=>(
                <div key={s.lbl} className="stat-card"><div style={{fontSize:10,color:'#94A3B8',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>{s.lbl}</div><div className="stat-num" style={{color:s.color}}>{fmt(s.val)}</div><div className="stat-sub">{s.sub}</div></div>
              ))}
            </div>
            {(wallet?.withdrawableBalance||0)>0&&<button className="btn btn-primary" style={{marginBottom:14}} onClick={()=>setShowW(true)}>Request Withdrawal →</button>}
            <div className="card">
              <div className="card-head"><span style={{fontSize:14,fontWeight:700}}>Withdrawal History</span></div>
              <div style={{padding:'0 18px'}}>
                {withdrawals.length===0?<div className="empty"><div className="empty-icon">💸</div><div className="empty-title">No withdrawals yet</div></div>:
                withdrawals.map(w=>(
                  <div key={w._id} className="row-item">
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{fmt(w.amount)}</div><div style={{fontSize:11,color:'#64748B',marginTop:2}}>{w.method.toUpperCase()} · {w.accountDetails}</div><div style={{fontSize:11,color:'#94A3B8'}}>{tAgo(w.createdAt)}</div></div>
                    {statusBadge(w.status)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==='notifs'&&(
          <div className="au">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{fontSize:18,fontWeight:700}}>Notifications</div>
              {unread>0&&<button className="btn btn-secondary btn-xs" onClick={async()=>{await api('/notifications/read-all',{method:'PATCH'},token);load();}}>Mark all read</button>}
            </div>
            {notifs.length===0?<div className="empty card card-body"><div className="empty-icon">🔔</div><div className="empty-title">No notifications</div></div>:
            notifs.map(n=>(
              <div key={n._id} className="card" style={{marginBottom:8,borderLeft:n.isRead?undefined:'3px solid #0D9488'}}>
                <div className="card-body" style={{display:'flex',gap:10}}>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:n.isRead?400:600}}>{n.message}</div><div style={{fontSize:11,color:'#94A3B8',marginTop:4}}>{tAgo(n.createdAt)}</div></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showW&&<WithdrawModal token={token} balance={wallet?.withdrawableBalance||0} onClose={()=>setShowW(false)} onDone={()=>{setShowW(false);load();}}/>}

      <nav className="bottom-nav">
        {[{id:'home',lbl:'Home',icon:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z'},{id:'referrals',lbl:'Referrals'},{id:'wallet',lbl:'Wallet'},{id:'notifs',lbl:`Alerts${unread>0?` (${unread})`:''}`}].map(t=>(
          <button key={t.id} className={`bnav-btn${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>
            {t.id==='home'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
            {t.id==='referrals'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
            {t.id==='wallet'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
            {t.id==='notifs'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>}
            <span>{t.lbl}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function WithdrawModal({ token, balance, onClose, onDone }) {
  const [amount,setAmount]=useState('');
  const [method,setMethod]=useState('jazzcash');
  const [account,setAccount]=useState('');
  const [load,setLoad]=useState(false);
  const [err,setErr]=useState('');
  const submit=async()=>{
    if(!amount||+amount<=0){setErr('Enter a valid amount');return;}
    if(+amount>balance){setErr(`Max: ${fmt(balance)}`);return;}
    if(!account.trim()){setErr('Enter account details');return;}
    setLoad(true);setErr('');
    try{await api('/withdrawals',{method:'POST',body:JSON.stringify({amount:+amount,method:method,accountDetails:account})},token);onDone();}
    catch(e){setErr(e.message);}finally{setLoad(false);}
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Request Withdrawal</div>
        <p style={{fontSize:13,color:'#64748B',marginBottom:18}}>Available: <strong style={{color:'#0D9488'}}>{fmt(balance)}</strong></p>
        <ErrAlert msg={err}/>
        <div className="fg"><label className="fl">Amount</label><input className="fi" type="number" placeholder="0" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
        <div className="fg"><label className="fl">Payment Method</label>
          <select className="fi" value={method} onChange={e=>setMethod(e.target.value)}>
            <option value="bank">Bank Transfer</option><option value="mobile">Mobile Wallet</option><option value="other">Other</option>
          </select></div>
        <div className="fg"><label className="fl">{method==='bank'?'IBAN / Account Number':'Wallet / Account Number'}</label>
          <input className="fi" placeholder={method==='bank'?'Account number':'Wallet number'} value={account} onChange={e=>setAccount(e.target.value)}/></div>
        <button className="btn btn-primary" onClick={submit} disabled={load}>{load?<><Spin sm white/> Submitting…</>:'Submit Request'}</button>
        <button className="btn btn-secondary" style={{marginTop:8}} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Rewards Setup Card (doctor) ─────────────────────────────────────────────
function RewardsSetupCard({ user, token }) {
  const [saved_rewards,       setSavedRewards]      = useState(user.rewards || '');
  const [saved_patientReward, setSavedPatientReward] = useState(user.patientReward || '');
  const [draftR,   setDraftR]  = useState(user.rewards || '');
  const [draftP,   setDraftP]  = useState(user.patientReward || '');
  const [saving,   setSaving]  = useState(false);
  const [saveOk,   setSaveOk]  = useState(false);
  const [editing,  setEditing] = useState(!user.rewards);
  const [err,      setErr]     = useState('');

  const save = async () => {
    if (!draftR.trim()) { setErr('Enter a referrer reward description'); return; }
    setSaving(true); setSaveOk(false); setErr('');
    try {
      await api('/profile', { method:'PATCH', body:JSON.stringify({ rewards: draftR.trim(), patientReward: draftP.trim() }) }, token);
      setSavedRewards(draftR.trim());
      setSavedPatientReward(draftP.trim());
      setSaveOk(true); setEditing(false);
      setTimeout(()=>setSaveOk(false), 3000);
    } catch(e) { setErr(e.message || 'Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  const hasRewards = !!saved_rewards;

  return (
    <div className="card" style={{marginBottom:12,border:hasRewards?'1px solid #E8EDF5':'1.5px solid #F59E0B',background:hasRewards?'#fff':'#FFFBEB'}}>
      <div className="card-body">
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:'#0F172A'}}>🎁 Referral Rewards</div>
            <div style={{fontSize:12,color:'#64748B',marginTop:2}}>Shown on your public referral page</div>
          </div>
          {!editing && hasRewards && (
            <button className="btn btn-secondary btn-xs" onClick={()=>{setDraftR(saved_rewards);setDraftP(saved_patientReward);setEditing(true);setSaveOk(false);}}>Edit</button>
          )}
        </div>

        {err && <div style={{fontSize:12,color:'#EF4444',marginBottom:8,padding:'8px 10px',background:'#FEF2F2',borderRadius:6}}>⚠ {err}</div>}

        {editing ? (
          <>
            <div style={{fontSize:11,fontWeight:600,color:'#64748B',letterSpacing:'.05em',textTransform:'uppercase',marginBottom:6}}>For the referrer (person who shares)</div>
            <input
              className="fi"
              placeholder="e.g. $50 cash per referral · $100 for consultation"
              value={draftR}
              onChange={e=>{setDraftR(e.target.value);setErr('');setSaveOk(false);}}
              onKeyDown={e=>e.key==='Enter'&&save()}
              style={{marginBottom:12}}
              autoFocus
            />
            <div style={{fontSize:11,fontWeight:600,color:'#64748B',letterSpacing:'.05em',textTransform:'uppercase',marginBottom:6}}>For the referred client (discount they get)</div>
            <input
              className="fi"
              placeholder="e.g. 10% off first treatment · Free consultation"
              value={draftP}
              onChange={e=>{setDraftP(e.target.value);setSaveOk(false);}}
              style={{marginBottom:6}}
            />
            <div style={{fontSize:11,color:'#94A3B8',marginBottom:10}}>This discount appears in share messages so friends know what they'll get.</div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving||!draftR.trim()}>
                {saving?<><Spin sm white/> Saving…</>:'Save →'}
              </button>
              {hasRewards && (
                <button className="btn btn-secondary btn-xs" onClick={()=>{setDraftR(saved_rewards);setDraftP(saved_patientReward);setEditing(false);setErr('');}}>Cancel</button>
              )}
            </div>
          </>
        ) : hasRewards ? (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{background:'rgba(13,148,136,.06)',border:'1px solid rgba(13,148,136,.2)',borderRadius:8,padding:'10px 14px'}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'#0D9488',marginBottom:4}}>Referrer earns</div>
              <div style={{fontSize:14,fontWeight:700,color:'#0F172A'}}>{saved_rewards}</div>
            </div>
            {saved_patientReward && (
              <div style={{background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.2)',borderRadius:8,padding:'10px 14px'}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'#F59E0B',marginBottom:4}}>Referred client gets</div>
                <div style={{fontSize:14,fontWeight:700,color:'#0F172A'}}>{saved_patientReward}</div>
              </div>
            )}
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={()=>setEditing(true)}>Set up rewards →</button>
        )}

        {saveOk && <div style={{fontSize:12,color:'#10B981',marginTop:8,fontWeight:500}}>✓ Rewards saved successfully</div>}
      </div>
    </div>
  );
}

// ─── Business Settings Tab ────────────────────────────────────────────────────
function BusinessSettingsTab({ user, token, onSaved }) {
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const [err,    setErr]      = useState('');
  const [d, setD] = useState({
    name:               user.name            || '',
    clinicName:         user.clinicName      || '',
    businessPhone:      user.businessPhone   || '',
    businessEmail:      user.businessEmail   || '',
    businessWebsite:    user.businessWebsite || '',
    businessCity:       user.businessCity    || '',
    businessCategory:   user.businessCategory|| '',
    businessDescription:user.businessDescription||'',
    rewards:            user.rewards         || '',
    patientReward:      user.patientReward   || '',
    showWhatsapp: user.showWhatsapp !== false,
    showPhone:    user.showPhone    === true,
    showEmail:    user.showEmail    === true,
  });

  const set = (k, v) => setD(prev => ({...prev, [k]: v}));

  const save = async () => {
    setSaving(true); setSaved(false); setErr('');
    try {
      const res = await api('/profile', { method:'PATCH', body: JSON.stringify(d) }, token);
      onSaved?.(res);
      setSaved(true);
      setTimeout(()=>setSaved(false), 3000);
    } catch(e) { setErr(e.message); }
    setSaving(false);
  };

  const Section = ({title, children}) => (
    <div className="card" style={{marginBottom:12}}>
      <div className="card-head"><span style={{fontSize:14,fontWeight:700}}>{title}</span></div>
      <div className="card-body" style={{paddingTop:4}}>{children}</div>
    </div>
  );

  const Field = ({label, ...props}) => (
    <div className="fg" style={{marginBottom:10}}>
      <label className="fl">{label}</label>
      <input className="fi" {...props} onChange={e=>set(props.name, e.target.value)}/>
    </div>
  );

  const Toggle = ({label, sub, field}) => (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #F1F5F9'}}>
      <div>
        <div style={{fontSize:13,fontWeight:600,color:'#0F172A'}}>{label}</div>
        {sub&&<div style={{fontSize:11,color:'#94A3B8',marginTop:2}}>{sub}</div>}
      </div>
      <label className="switch">
        <input type="checkbox" checked={d[field]} onChange={e=>set(field, e.target.checked)}/>
        <span className="switch-slider"/>
      </label>
    </div>
  );

  return (
    <div className="au">
      <div style={{fontSize:18,fontWeight:700,marginBottom:14}}>Settings</div>

      <Section title="🏢 Business Info">
        <Field label="Your name" name="name" placeholder="Your name" value={d.name}/>
        <Field label="Business name" name="clinicName" placeholder="Business name" value={d.clinicName}/>
        <Field label="City" name="businessCity" placeholder="San Francisco" value={d.businessCity}/>
        <div className="fg" style={{marginBottom:10}}>
          <label className="fl">Category</label>
          <select className="fi" value={d.businessCategory} onChange={e=>set('businessCategory',e.target.value)}>
            <option value="">Select category</option>
            {['Real Estate','Dental','Legal','Finance','Fitness','Healthcare','Education','Services','Other'].map(c=>(
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="fg" style={{marginBottom:0}}>
          <label className="fl">Description</label>
          <textarea className="fi" rows={3} placeholder="Short description of your business" value={d.businessDescription}
            onChange={e=>set('businessDescription',e.target.value)} style={{resize:'vertical'}}/>
        </div>
      </Section>

      <Section title="📞 Contact Details">
        <div style={{fontSize:11,color:'#94A3B8',marginBottom:12}}>These appear on your public referral page based on your visibility settings below.</div>
        <Field label="WhatsApp / Business phone" name="businessPhone" placeholder="+1 415 000 0000" value={d.businessPhone} type="tel"/>
        <Field label="Email" name="businessEmail" placeholder="hello@yourbusiness.com" value={d.businessEmail} type="email"/>
        <Field label="Website" name="businessWebsite" placeholder="yourbusiness.com" value={d.businessWebsite}/>
      </Section>

      <Section title="👁 What visitors can see">
        <div style={{fontSize:11,color:'#94A3B8',marginBottom:8}}>Choose what contact options appear on your public page</div>
        <Toggle label="WhatsApp button" sub={d.businessPhone||'Set a phone number above'} field="showWhatsapp"/>
        <Toggle label="Phone number" sub={d.businessPhone||'Set a phone number above'} field="showPhone"/>
        <Toggle label="Email address" sub={d.businessEmail||'Set an email above'} field="showEmail"/>
      </Section>

      <Section title="💰 Rewards">
        <div className="fg" style={{marginBottom:10}}>
          <label className="fl">What referrers earn</label>
          <input className="fi" placeholder="e.g. $50 gift card per referral" value={d.rewards} onChange={e=>set('rewards',e.target.value)}/>
        </div>
        <div className="fg" style={{marginBottom:0}}>
          <label className="fl">What referred clients get</label>
          <input className="fi" placeholder="e.g. 10% off first visit" value={d.patientReward} onChange={e=>set('patientReward',e.target.value)}/>
        </div>
      </Section>

      {err&&<div style={{fontSize:12,color:'#EF4444',marginBottom:10,padding:'8px 10px',background:'#FEF2F2',borderRadius:6}}>⚠ {err}</div>}

      <button className="btn btn-primary" onClick={save} disabled={saving}>
        {saving ? <><Spin sm white/> Saving…</> : saved ? '✅ Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCTOR DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function DoctorDashboard({ user, token, onSignOut }) {
  const [tab,setTab]=useState('home');
  const [referrals,setReferrals]=useState([]);
  const [treatments,setTreatments]=useState([]);
  const [withdrawals,setWithdrawals]=useState([]);
  const [analytics,setAnalytics]=useState({});
  const [loading,setLoading]=useState(false);
  const [showLog,setShowLog]=useState(false);
  const [showTx,setShowTx]=useState(false);
  const [editTx,setEditTx]=useState(null);

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const [r1,r2,r3]=await Promise.all([api('/referrals',{},token),api('/my/treatments',{},token),api('/withdrawals',{},token)]);
      setReferrals(r1.referrals);setAnalytics(r1.analytics);setTreatments(r2.treatments);setWithdrawals(r3.withdrawals);
    }catch(e){console.error(e);}finally{setLoading(false);}
  },[token]);

  useEffect(()=>{load();},[load]);

  const updateStatus=async(id,status,notes='',commissionAmount)=>{
    try{await api(`/referrals/${id}/status`,{method:'PATCH',body:JSON.stringify({status,doctorNotes:notes,commissionAmount})},token);load();}
    catch(e){alert(e.message);}
  };
  const markW=async(id,status)=>{
    try{await api(`/withdrawals/${id}`,{method:'PATCH',body:JSON.stringify({status})},token);load();}
    catch(e){alert(e.message);}
  };

  return (
    <div style={{minHeight:'100vh',background:'#F7F9FC',paddingBottom:80}}>
      <div className="top-bar">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Avatar name={user.clinicName||user.name} size={34}/>
          <div><div style={{fontSize:15,fontWeight:700,lineHeight:1.2}}>{user.clinicName||user.name}</div><div style={{fontSize:11,color:'#94A3B8'}}>Doctor</div></div>
        </div>
        <button className="btn btn-secondary btn-xs" onClick={onSignOut}>Sign out</button>
      </div>
      <div style={{maxWidth:600,margin:'0 auto',padding:'16px 16px 0'}}>

        {tab==='home'&&(
          <div className="au">
            <div className="stat-grid" style={{gridTemplateColumns:'repeat(2,1fr)'}}>
              {[{lbl:'Total Referrals',val:analytics.total||0,color:'#0D9488',icon:'📋'},{lbl:'Approved',val:analytics.approved||0,color:'#10B981',icon:'✅'},{lbl:'Conversion',val:`${analytics.conversionRate||0}%`,color:'#8B5CF6',icon:'📈'},{lbl:'Commission Paid',val:`${fmt(analytics.totalPaid)}`,color:'#F59E0B',icon:'💰'}].map(s=>(
                <div key={s.lbl} className="stat-card"><div style={{fontSize:20,marginBottom:4}}>{s.icon}</div><div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.val}</div><div style={{fontSize:10,color:'#94A3B8',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginTop:3}}>{s.lbl}</div></div>
              ))}
            </div>
            <button className="btn btn-primary" style={{marginBottom:10}} onClick={()=>setShowLog(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Log New Referral Visit
            </button>

            {/* Rewards Setup */}
            <RewardsSetupCard user={user} token={token}/>

            {/* Clinic share link */}
            {user.id && (()=>{
              const clinicUrl = `${APP_URL}?b=${user.id}`;
              const rewardLine = user.rewards
                ? `\n\nRefer a friend and you'll get: ${user.rewards}${user.patientReward ? `, and they also get: ${user.patientReward}` : ''}.`
                : '\n\nRefer a friend and earn rewards for every successful referral.';
              const defaultMsg = `Hi! I'm ${user.name} from ${user.clinicName||user.name}.\n\nIt was great having you as our customer. If you liked our services, please recommend us to your friends and family.${rewardLine}\n\nSign up here:\n${clinicUrl}`;
              return (
                <div className="card" style={{marginBottom:12,border:'1.5px solid rgba(13,148,136,.25)',background:'rgba(13,148,136,.04)'}}>
                  <div className="card-body">
                    <div style={{fontSize:12,fontWeight:700,color:'#0D9488',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:4}}>🔗 Your Business Invite Link</div>
                    <div style={{background:'#fff',border:'1px solid #E8EDF5',borderRadius:8,padding:'8px 12px',display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                      <code style={{flex:1,fontSize:11,color:'#0F172A',wordBreak:'break-all',fontFamily:'monospace'}}>{clinicUrl}</code>
                      <CopyBtn text={clinicUrl} label="Copy"/>
                    </div>
                    <ShareMessageCard shareText={defaultMsg} shareUrl={clinicUrl} token={token}/>
                  </div>
                </div>
              );
            })()}
            <div className="card">
              <div className="card-head"><span style={{fontSize:14,fontWeight:700}}>Recent Referrals</span><button className="btn btn-secondary btn-xs" onClick={()=>setTab('referrals')}>See all</button></div>
              <div style={{padding:'0 18px'}}>
                {referrals.slice(0,4).map(r=>(
                  <div key={r._id} className="row-item" style={{flexDirection:'column',gap:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div><div style={{fontSize:13,fontWeight:600}}>{r.referrerId?.name||'Unknown'}</div><div style={{fontSize:11,color:'#64748B'}}>{r.referredPhone} · {r.treatmentName||'General'} · {fmt(r.commissionAmount)}</div><div style={{fontSize:11,color:'#94A3B8'}}>{tAgo(r.createdAt)}</div></div>
                      {statusBadge(r.status)}
                    </div>
                    {!['approved','rejected'].includes(r.status)&&(
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {r.status==='pending'&&<button className="btn btn-secondary btn-xs" onClick={()=>updateStatus(r._id,'visit_completed')}>Visit Done ✓</button>}
                        {r.status==='visit_completed'&&<button className="btn btn-secondary btn-xs" onClick={()=>updateStatus(r._id,'treatment_completed')}>Treatment Done ✓</button>}
                        <button className="btn btn-success btn-xs" onClick={()=>{const a=window.prompt('Confirm commission amount:',r.commissionAmount);if(a!==null)updateStatus(r._id,'approved','',+a||r.commissionAmount);}}>✅ Approve</button>
                        <button className="btn btn-danger btn-xs" onClick={()=>{const n=window.prompt('Rejection reason (optional):');if(n!==null)updateStatus(r._id,'rejected',n);}}>❌ Reject</button>
                      </div>
                    )}
                  </div>
                ))}
                {referrals.length===0&&<div className="empty"><div className="empty-icon">📋</div><div className="empty-title">No referrals yet</div></div>}
              </div>
            </div>
          </div>
        )}

        {tab==='referrals'&&(
          <div className="au">
            <div style={{fontSize:18,fontWeight:700,marginBottom:14}}>All Referrals</div>
            {loading?<div style={{display:'flex',justifyContent:'center',padding:40}}><Spin/></div>:
            referrals.length===0?<div className="empty card card-body"><div className="empty-icon">📋</div><div className="empty-title">No referrals yet</div></div>:
            referrals.map(r=>(
              <div key={r._id} className="card" style={{marginBottom:10}}>
                <div className="card-body">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <div><div style={{fontSize:14,fontWeight:700}}>{r.referrerId?.name||'Unknown'}</div><div style={{fontSize:12,color:'#64748B'}}>Code: {r.referrerId?.referralCode}</div><div style={{fontSize:12,color:'#64748B'}}>Patient: {r.referredPhone} · {r.treatmentName||'General'}</div><div style={{fontSize:12,fontWeight:600,color:'#0D9488'}}>{fmt(r.commissionAmount)}</div><div style={{fontSize:11,color:'#94A3B8'}}>{new Date(r.createdAt).toLocaleDateString('en-US')}</div></div>
                    {statusBadge(r.status)}
                  </div>
                  {r.doctorNotes&&<div style={{fontSize:12,color:'#64748B',padding:'6px 10px',background:'#F1F5F9',borderRadius:6,marginBottom:8}}>Note: {r.doctorNotes}</div>}
                  {!['approved','rejected'].includes(r.status)&&(
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      {r.status==='pending'&&<button className="btn btn-secondary btn-xs" onClick={()=>updateStatus(r._id,'visit_completed')}>Visit Done</button>}
                      {r.status==='visit_completed'&&<button className="btn btn-secondary btn-xs" onClick={()=>updateStatus(r._id,'treatment_completed')}>Treatment Done</button>}
                      <button className="btn btn-success btn-xs" onClick={()=>{const a=window.prompt('Commission amount:',r.commissionAmount);if(a!==null)updateStatus(r._id,'approved','',+a||r.commissionAmount);}}>✅ Approve</button>
                      <button className="btn btn-danger btn-xs" onClick={()=>{const n=window.prompt('Rejection reason:');if(n!==null)updateStatus(r._id,'rejected',n);}}>❌ Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==='treatments'&&(
          <div className="au">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{fontSize:18,fontWeight:700}}>Treatments</div>
              <button className="btn btn-primary btn-sm" onClick={()=>{setEditTx(null);setShowTx(true);}}>+ Add</button>
            </div>
            {treatments.length===0?<div className="empty card card-body"><div className="empty-icon">💊</div><div className="empty-title">No treatments yet</div><div className="empty-sub">Add treatments to assign commissions</div></div>:
            treatments.map(t=>(
              <div key={t._id} className="card" style={{marginBottom:10}}>
                <div className="card-body">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700}}>{t.name}</div>{t.description&&<div style={{fontSize:12,color:'#64748B',marginTop:2}}>{t.description}</div>}<div style={{fontSize:13,fontWeight:600,color:'#0D9488',marginTop:6}}>{t.commissionType==='fixed'?`${fmt(t.commissionValue)}`:`${t.commissionValue}%`} commission</div></div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
                      <label className="switch"><input type="checkbox" checked={t.isActive} onChange={async()=>{await api(`/treatments/${t._id}`,{method:'PATCH',body:JSON.stringify({isActive:!t.isActive})},token);load();}}/><span className="switch-slider"/></label>
                      <button className="btn btn-secondary btn-xs" onClick={()=>{setEditTx(t);setShowTx(true);}}>Edit</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==='payouts'&&(
          <div className="au">
            <div style={{fontSize:18,fontWeight:700,marginBottom:14}}>Payout Requests</div>
            {withdrawals.length===0?<div className="empty card card-body"><div className="empty-icon">💸</div><div className="empty-title">No payout requests</div></div>:
            withdrawals.map(w=>(
              <div key={w._id} className="card" style={{marginBottom:10}}>
                <div className="card-body">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <div><div style={{fontSize:14,fontWeight:700}}>{fmt(w.amount)}</div><div style={{fontSize:12,color:'#64748B'}}>{w.userId?.name} · {w.userId?.phone}</div><div style={{fontSize:12,color:'#64748B'}}>{w.method.toUpperCase()}: {w.accountDetails}</div><div style={{fontSize:11,color:'#94A3B8'}}>{tAgo(w.createdAt)}</div></div>
                    {statusBadge(w.status)}
                  </div>
                  {!['paid','rejected'].includes(w.status)&&<div style={{display:'flex',gap:6}}><button className="btn btn-success btn-xs" onClick={()=>markW(w._id,'paid')}>✅ Mark Paid</button><button className="btn btn-danger btn-xs" onClick={()=>markW(w._id,'rejected')}>❌ Reject</button></div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==='settings'&&(
          <BusinessSettingsTab user={user} token={token} onSaved={(updated)=>{
            // Merge updated fields into user so dashboard reflects changes
            Object.assign(user, updated);
          }}/>
        )}
      </div>

      {showLog&&<LogReferralModal token={token} treatments={treatments} onClose={()=>setShowLog(false)} onDone={()=>{setShowLog(false);load();}}/>}
      {showTx&&<TreatmentModal token={token} initial={editTx} onClose={()=>setShowTx(false)} onDone={()=>{setShowTx(false);load();}}/>}

      <nav className="bottom-nav">
        {[{id:'home',lbl:'Home'},{id:'referrals',lbl:'Referrals'},{id:'treatments',lbl:'Treatments'},{id:'payouts',lbl:'Payouts'},{id:'settings',lbl:'Settings'}].map(t=>(
          <button key={t.id} className={`bnav-btn${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>
            {t.id==='home'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
            {t.id==='referrals'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
            {t.id==='treatments'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
            {t.id==='payouts'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
            {t.id==='settings'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>}
            <span>{t.lbl}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function LogReferralModal({ token, treatments, onClose, onDone }) {
  const [code,setCode]=useState('');
  const [phone,setPhone]=useState('');
  const [txId,setTxId]=useState('');
  const [load,setLoad]=useState(false);
  const [err,setErr]=useState('');
  const submit=async()=>{
    setLoad(true);setErr('');
    try{await api('/referrals/log',{method:'POST',body:JSON.stringify({referralCode:code.trim().toUpperCase(),referredPhone:phone.trim(),treatmentId:txId||undefined})},token);onDone();}
    catch(e){setErr(e.message);}finally{setLoad(false);}
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Log Referral Visit</div>
        <p style={{fontSize:13,color:'#64748B',marginBottom:18}}>Client provides their referrer's code at the front desk</p>
        <ErrAlert msg={err}/>
        <div className="fg"><label className="fl">Referrer's Code</label><input className="fi" placeholder="e.g. PT3A9F2B" value={code} onChange={e=>{setCode(e.target.value.toUpperCase());setErr('')}} style={{textTransform:'uppercase',letterSpacing:'.1em',fontWeight:700}}/></div>
        <div className="fg"><label className="fl">Patient Phone</label><input className="fi" type="tel" placeholder="+92 3XX XXXXXXX" value={phone} onChange={e=>{setPhone(e.target.value);setErr('')}} inputMode="tel"/></div>
        <div className="fg"><label className="fl">Treatment (optional)</label>
          <select className="fi" value={txId} onChange={e=>setTxId(e.target.value)}>
            <option value="">— Select treatment —</option>
            {treatments.filter(t=>t.isActive).map(t=><option key={t._id} value={t._id}>{t.name} ({t.commissionType==='fixed'?`${fmt(t.commissionValue)}`:`${t.commissionValue}%`})</option>)}
          </select></div>
        <div className="disclaimer" style={{marginBottom:16}}>Commission credited only after you explicitly approve this referral.</div>
        <button className="btn btn-primary" onClick={submit} disabled={load}>{load?<><Spin sm white/> Logging…</>:'Log Visit'}</button>
        <button className="btn btn-secondary" style={{marginTop:8}} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

function TreatmentModal({ token, initial, onClose, onDone }) {
  const [name,setName]=useState(initial?.name||'');
  const [desc,setDesc]=useState(initial?.description||'');
  const [type,setType]=useState(initial?.commissionType||'fixed');
  const [val,setVal]=useState(initial?.commissionValue||'');
  const [load,setLoad]=useState(false);
  const [err,setErr]=useState('');
  const submit=async()=>{
    setLoad(true);setErr('');
    try{
      const p={name,description:desc,commissionType:type,commissionValue:+val};
      if(initial)await api(`/treatments/${initial._id}`,{method:'PATCH',body:JSON.stringify(p)},token);
      else await api('/treatments',{method:'POST',body:JSON.stringify(p)},token);
      onDone();
    }catch(e){setErr(e.message);}finally{setLoad(false);}
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:18,fontWeight:700,marginBottom:16}}>{initial?'Edit':'Add'} Treatment</div>
        <ErrAlert msg={err}/>
        <div className="fg"><label className="fl">Treatment Name</label><input className="fi" placeholder="e.g. Consultation, Property Tour" value={name} onChange={e=>setName(e.target.value)}/></div>
        <div className="fg"><label className="fl">Description</label><input className="fi" placeholder="Brief description (optional)" value={desc} onChange={e=>setDesc(e.target.value)}/></div>
        <div className="fg"><label className="fl">Commission Type</label>
          <select className="fi" value={type} onChange={e=>setType(e.target.value)}><option value="fixed">Fixed Amount (PKR)</option><option value="percentage">Percentage (%)</option></select></div>
        <div className="fg"><label className="fl">{type==='fixed'?'Amount':'Percentage (%)'}</label><input className="fi" type="number" placeholder={type==='fixed'?'e.g. 500':'e.g. 10'} value={val} onChange={e=>setVal(e.target.value)}/></div>
        <button className="btn btn-primary" onClick={submit} disabled={load}>{load?<><Spin sm white/> Saving…</>:'Save Treatment'}</button>
        <button className="btn btn-secondary" style={{marginTop:8}} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function AdminDashboard({ user, token, onSignOut }) {
  const [tab,setTab]=useState('stats');
  const [stats,setStats]=useState({});
  const [users,setUsers]=useState([]);
  const [referrals,setReferrals]=useState([]);
  const [withdrawals,setW]=useState([]);
  const [loading,setLoading]=useState(false);

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const [r1,r2,r3,r4]=await Promise.all([api('/admin/stats',{},token),api('/admin/users',{},token),api('/referrals',{},token),api('/withdrawals',{},token)]);
      setStats(r1.stats);setUsers(r2.users);setReferrals(r3.referrals);setW(r4.withdrawals);
    }catch(e){console.error(e);}finally{setLoading(false);}
  },[token]);

  useEffect(()=>{load();},[load]);

  const toggleUser=async(id,isActive)=>{await api(`/admin/users/${id}`,{method:'PATCH',body:JSON.stringify({isActive})},token);load();};

  return (
    <div style={{minHeight:'100vh',background:'#F7F9FC',paddingBottom:20}}>
      <div className="top-bar"><div style={{fontSize:16,fontWeight:700}}>⚙️ Admin Panel</div><button className="btn btn-secondary btn-xs" onClick={onSignOut}>Sign out</button></div>
      <div style={{maxWidth:700,margin:'0 auto',padding:'16px 16px 0'}}>
        <div style={{display:'flex',gap:6,marginBottom:16,overflowX:'auto',paddingBottom:4}}>
          {[['stats','📊 Stats'],['users','👥 Users'],['referrals','📋 Referrals'],['payouts','💸 Payouts']].map(([id,lbl])=>(
            <button key={id} className={`btn btn-${tab===id?'primary':'secondary'} btn-sm`} onClick={()=>setTab(id)} style={{whiteSpace:'nowrap'}}>{lbl}</button>
          ))}
        </div>

        {tab==='stats'&&(
          <div className="au stat-grid" style={{gridTemplateColumns:'repeat(2,1fr)'}}>
            {[{lbl:'Patients',val:stats.totalUsers,icon:'👥',color:'#0D9488'},{lbl:'Doctors',val:stats.totalDoctors,icon:'🏥',color:'#0EA5E9'},{lbl:'Referrals',val:stats.totalReferrals,icon:'📋',color:'#8B5CF6'},{lbl:'Approved',val:stats.totalApproved,icon:'✅',color:'#10B981'},{lbl:'Total Paid',val:`${fmt(stats.totalPaidOut)}`,icon:'💰',color:'#F59E0B'}].map(s=>(
              <div key={s.lbl} className="stat-card"><div style={{fontSize:20,marginBottom:4}}>{s.icon}</div><div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.val}</div><div style={{fontSize:10,color:'#94A3B8',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginTop:3}}>{s.lbl}</div></div>
            ))}
          </div>
        )}
        {tab==='users'&&(
          <div className="au">
            {users.map(u=>(
              <div key={u._id} className="card" style={{marginBottom:8}}>
                <div className="card-body" style={{display:'flex',alignItems:'center',gap:12}}>
                  <Avatar name={u.name} size={38}/>
                  <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:700}}>{u.name||'—'} <span style={{fontSize:11,color:'#64748B'}}>({u.role})</span></div><div style={{fontSize:12,color:'#64748B'}}>{u.phone}</div>{u.clinicName&&<div style={{fontSize:11,color:'#94A3B8'}}>{u.clinicName}</div>}</div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                    <span className={`badge ${u.isActive?'badge-approved':'badge-rejected'}`}>{u.isActive?'Active':'Suspended'}</span>
                    <button className={`btn btn-xs ${u.isActive?'btn-danger':'btn-success'}`} onClick={()=>toggleUser(u._id,!u.isActive)}>{u.isActive?'Suspend':'Restore'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab==='referrals'&&(
          <div className="au">
            {referrals.map(r=>(
              <div key={r._id} className="card" style={{marginBottom:8}}>
                <div className="card-body">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div><div style={{fontSize:13,fontWeight:700}}>{r.referrerId?.name} → {r.referredPhone}</div><div style={{fontSize:12,color:'#64748B'}}>{r.treatmentName||'General'} · {fmt(r.commissionAmount)}</div><div style={{fontSize:11,color:'#94A3B8'}}>{new Date(r.createdAt).toLocaleDateString('en-US')}</div></div>
                    {statusBadge(r.status)}
                  </div>
                </div>
              </div>
            ))}
            {referrals.length===0&&<div className="empty card card-body"><div className="empty-icon">📋</div><div className="empty-title">No referrals</div></div>}
          </div>
        )}
        {tab==='payouts'&&(
          <div className="au">
            {withdrawals.map(w=>(
              <div key={w._id} className="card" style={{marginBottom:8}}>
                <div className="card-body" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div><div style={{fontSize:14,fontWeight:700}}>{fmt(w.amount)}</div><div style={{fontSize:12,color:'#64748B'}}>{w.userId?.name} · {w.method.toUpperCase()}</div><div style={{fontSize:11,color:'#94A3B8'}}>{w.accountDetails} · {tAgo(w.createdAt)}</div></div>
                  {statusBadge(w.status)}
                </div>
              </div>
            ))}
            {withdrawals.length===0&&<div className="empty card card-body"><div className="empty-icon">💸</div><div className="empty-title">No withdrawal requests</div></div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLINIC PUBLIC PROFILE PAGE  (?b=ID)
// ═══════════════════════════════════════════════════════════════════════════════
function ClinicProfilePage({ clinicId, onJoin }) {
  const [clinic,  setClinic]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Inline auth
  const [step,    setStep]    = useState('phone');
  const [cc,      setCc]      = useState(COUNTRIES[0]);
  const [ccOpen,  setCcOpen]  = useState(false);
  const [phone,   setPhone]   = useState('');
  const [otp,     setOtp]     = useState(['','','','','','']);
  const [authLoad,setAuthLoad]= useState(false);
  const [authErr, setAuthErr] = useState('');
  const [myCode,  setMyCode]  = useState('');
  const [myName,  setMyName]  = useState('');
  const [myToken, setMyToken] = useState('');
  const [nameStep,setNameStep]= useState(false);
  const [nameVal, setNameVal] = useState('');

  const fullPhone = `${cc.code}${phone.replace(/\s/g,'')}`;

  useEffect(()=>{
    api(`/clinic/${clinicId}`)
      .then(d=>setClinic(d.clinic))
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
    // Skip auth if already logged in
    const a = getAuth();
    if(a?.token){
      api('/auth/me',{},a.token).then(d=>{
        if(d.user?.referralCode){ setMyCode(d.user.referralCode); setMyName(d.user.name||''); setMyToken(a.token); setStep('done'); }
      }).catch(()=>{});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const handleOtpKey=(i,val)=>{
    if(!/^\d*$/.test(val))return;
    const n=[...otp];n[i]=val.slice(-1);setOtp(n);
    if(val&&i<5)document.getElementById(`b-otp-${i+1}`)?.focus();
  };

  const sendOtp = async () => {
    if(!phone.trim()){setAuthErr('Enter your number');return;}
    setAuthLoad(true);setAuthErr('');
    try{ await api('/auth/send-otp',{method:'POST',body:JSON.stringify({phone:fullPhone})}); setStep('otp'); }
    catch(e){setAuthErr(e.message);}finally{setAuthLoad(false);}
  };

  const verifyOtp = async () => {
    const code=otp.join('');
    if(code.length<6){setAuthErr('Enter the 6-digit code');return;}
    setAuthLoad(true);setAuthErr('');
    try{
      const d=await api('/auth/verify-otp',{method:'POST',body:JSON.stringify({phone:fullPhone,otp:code})});
      if(d.isNew||!d.user?.name){ setMyToken(d.token); setNameStep(true); }
      else{
        const reg=await api('/auth/register',{method:'POST',body:JSON.stringify({name:d.user.name,role:'patient',clinicId})},d.token);
        const auth={...reg,token:reg.token||d.token}; saveAuth(auth);
        setMyCode(reg.user?.referralCode||d.user?.referralCode||'');
        setMyName(reg.user?.name||d.user?.name||''); setMyToken(reg.token||d.token); setStep('done');
      }
    }catch(e){setAuthErr(e.message);}finally{setAuthLoad(false);}
  };

  const saveName = async () => {
    if(!nameVal.trim()){setAuthErr('Enter your name');return;}
    setAuthLoad(true);setAuthErr('');
    try{
      const d=await api('/auth/register',{method:'POST',body:JSON.stringify({name:nameVal.trim(),role:'patient',clinicId})},myToken);
      const auth={...d,token:d.token||myToken}; saveAuth(auth);
      setMyCode(d.user?.referralCode||''); setMyName(d.user?.name||nameVal.trim());
      setMyToken(d.token||myToken); setNameStep(false); setStep('done');
    }catch(e){setAuthErr(e.message);}finally{setAuthLoad(false);}
  };

  if(loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F9FC'}}><Spin/></div>;
  if(error) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F9FC',padding:24}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:12}}>🏢</div>
        <div style={{fontSize:18,fontWeight:700,color:'#0F172A',marginBottom:8}}>Business not found</div>
        <button className="btn btn-primary" style={{width:'auto',padding:'12px 28px',marginTop:8}} onClick={onJoin}>Go to EasyRecommend →</button>
      </div>
    </div>
  );

  const waMsg = encodeURIComponent(`Hi! I found ${clinic.name} on EasyRecommend. I'd like to get in touch.`);
  const myShareLink = myCode ? `${APP_URL}?r=${myCode}` : '';
  const clinicName = clinic.name || 'this business';
  const rewardLine = clinic.patientReward ? `\n\nYou get: ${clinic.patientReward}.` : '';
  const myShareText = myCode
    ? `Hi! I'm ${myName} — I've been using ${clinicName} and they're great.\n\nIf you're looking for their services, I'd highly recommend them.${rewardLine}\n\nUse my referral link:\n${myShareLink}`
    : '';

  const WA_ICO = <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;

  return (
    <div style={{minHeight:'100vh',background:'#F7F9FC',fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif"}}>
      <div style={{background:'#0D9488',padding:'12px 20px'}}>
        <span style={{fontWeight:800,fontSize:16,color:'#fff',letterSpacing:'-.02em'}}>Easy<span style={{color:'#CCFBF1'}}>Recommend</span></span>
      </div>

      <div style={{maxWidth:480,margin:'0 auto',padding:'20px 20px 60px'}}>

        {/* Business card */}
        <div className="au card" style={{marginBottom:14,overflow:'hidden'}}>
          <div style={{background:'linear-gradient(135deg,#0D9488,#059669)',padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:48,height:48,borderRadius:14,background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>🏢</div>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:'#fff',lineHeight:1.1}}>{clinic.name}</div>
              </div>
            </div>
          </div>
          {(clinic.showWhatsapp||clinic.showPhone||clinic.showEmail) && clinic.phone && (
            <div style={{padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,borderBottom:'1px solid #F1F5F9'}}>
              <div style={{fontSize:13,color:'#64748B'}}>Contact the business</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {clinic.showWhatsapp && clinic.phone && (
                  <a href={`https://wa.me/${clinic.phone.replace(/[^0-9]/g,'')}?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                    style={{display:'inline-flex',alignItems:'center',gap:5,padding:'7px 12px',background:'#25D366',borderRadius:8,color:'#fff',fontWeight:600,fontSize:12,textDecoration:'none'}}>
                    {WA_ICO} WhatsApp
                  </a>
                )}
                {clinic.showPhone && clinic.phone && (
                  <a href={`tel:${clinic.phone}`}
                    style={{display:'inline-flex',alignItems:'center',gap:5,padding:'7px 12px',background:'#334155',borderRadius:8,color:'#fff',fontWeight:600,fontSize:12,textDecoration:'none'}}>
                    📞 {clinic.phone}
                  </a>
                )}
                {clinic.showEmail && clinic.email && (
                  <a href={`mailto:${clinic.email}`}
                    style={{display:'inline-flex',alignItems:'center',gap:5,padding:'7px 12px',background:'#0EA5E9',borderRadius:8,color:'#fff',fontWeight:600,fontSize:12,textDecoration:'none'}}>
                    ✉️ Email
                  </a>
                )}
              </div>
            </div>
          )}
          {clinic.rewards && (
            <div style={{padding:'10px 16px',background:'#ECFDF5',borderBottom:'1px solid rgba(16,185,129,.15)'}}>
              <span style={{fontSize:11,fontWeight:700,color:'#10B981',textTransform:'uppercase',letterSpacing:'.06em'}}>💰 You earn: </span>
              <span style={{fontSize:13,fontWeight:700,color:'#0F172A'}}>{clinic.rewards}</span>
            </div>
          )}
          {clinic.treatments?.length>0 && (
            <div style={{padding:'10px 16px'}}>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {clinic.treatments.map((t,i)=>(
                  <span key={i} style={{padding:'4px 10px',background:'#F1F5F9',borderRadius:100,fontSize:12,color:'#334155',fontWeight:500}}>{t.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Inline auth + referral link */}
        <div className="au1 card" style={{overflow:'hidden'}}>
          <div style={{padding:'16px 18px'}}>
            {authErr && <div style={{fontSize:12,color:'#EF4444',marginBottom:10,padding:'8px 10px',background:'#FEF2F2',borderRadius:6}}>⚠ {authErr}</div>}

            {step==='phone' && !nameStep && (
              <>
                <div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:4}}>Get your referral link</div>
                <p style={{fontSize:12,color:'#64748B',marginBottom:12}}>Enter your number to generate your personal link and start earning</p>
                <div style={{display:'flex',gap:8,marginBottom:10}}>
                  <div style={{position:'relative',flexShrink:0}}>
                    <button type="button" onClick={()=>setCcOpen(o=>!o)}
                      style={{height:'100%',minWidth:80,padding:'10px 8px',background:'#fff',border:'1.5px solid #E8EDF5',borderRadius:10,display:'flex',alignItems:'center',gap:5,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:600,color:'#0F172A',whiteSpace:'nowrap'}}>
                      <span style={{fontSize:16}}>{cc.flag}</span><span>{cc.code}</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" style={{transform:ccOpen?'rotate(180deg)':'none'}}><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    {ccOpen && (
                      <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,zIndex:200,background:'#fff',border:'1px solid #E8EDF5',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,.1)',minWidth:200,maxHeight:220,overflowY:'auto'}}>
                        {COUNTRIES.map(c=>(
                          <button key={c.code} type="button" onClick={()=>{setCc(c);setCcOpen(false);setPhone('');}}
                            style={{width:'100%',padding:'9px 12px',background:c.code===cc.code?'rgba(13,148,136,.06)':'transparent',border:'none',borderBottom:'1px solid #F1F5F9',display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                            <span style={{fontSize:16}}>{c.flag}</span>
                            <span style={{fontSize:12,flex:1,textAlign:'left',color:'#0F172A'}}>{c.name}</span>
                            <span style={{fontSize:12,color:'#64748B',fontWeight:600}}>{c.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input className="fi" type="tel" placeholder={cc.placeholder} value={phone}
                    onChange={e=>{setPhone(e.target.value.replace(/[^\d\s]/g,''));setAuthErr('');}}
                    onKeyDown={e=>e.key==='Enter'&&sendOtp()} inputMode="numeric" style={{flex:1,fontSize:14}}/>
                </div>
                {ccOpen&&<div style={{position:'fixed',inset:0,zIndex:100}} onClick={()=>setCcOpen(false)}/>}
                <button className="btn btn-primary" onClick={sendOtp} disabled={authLoad} style={{fontSize:14}}>
                  {authLoad?<><Spin sm white/> Sending…</>:'Get my link →'}
                </button>
              </>
            )}

            {step==='otp' && !nameStep && (
              <>
                <div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:4}}>Enter the code</div>
                <p style={{fontSize:12,color:'#64748B',marginBottom:12}}>Sent to {fullPhone}</p>
                <div className="otp-wrap" style={{marginBottom:12}}>
                  {otp.map((v,i)=>(
                    <input key={i} id={`b-otp-${i}`} className="otp-input" maxLength={1} value={v} inputMode="numeric"
                      onChange={e=>handleOtpKey(i,e.target.value)}
                      onKeyDown={e=>{if(e.key==='Backspace'&&!v&&i>0)document.getElementById(`b-otp-${i-1}`)?.focus();}}/>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={verifyOtp} disabled={authLoad} style={{fontSize:14,marginBottom:8}}>
                  {authLoad?<><Spin sm white/> Verifying…</>:'Continue →'}
                </button>
                <button className="btn btn-secondary" style={{fontSize:13}} onClick={()=>{setStep('phone');setOtp(['','','','','','']);setAuthErr('')}}>← Change number</button>
              </>
            )}

            {nameStep && (
              <>
                <div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:4}}>One last thing</div>
                <p style={{fontSize:12,color:'#64748B',marginBottom:12}}>Your name so the business knows who referred</p>
                <input className="fi" placeholder="Your name" value={nameVal} onChange={e=>{setNameVal(e.target.value);setAuthErr('');}} style={{marginBottom:10}} autoFocus/>
                <button className="btn btn-primary" onClick={saveName} disabled={authLoad} style={{fontSize:14}}>
                  {authLoad?<><Spin sm white/> Saving…</>:'Get my link →'}
                </button>
              </>
            )}

            {step==='done' && myCode && (
              <>
                <div style={{fontSize:14,fontWeight:700,color:'#0D9488',marginBottom:8}}>✅ Your referral link is ready!</div>
                <div style={{background:'#F7F9FC',border:'1px solid #E8EDF5',borderRadius:8,padding:'10px 12px',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                  <code style={{flex:1,fontSize:12,color:'#0F172A',wordBreak:'break-all',fontFamily:'monospace'}}>{myShareLink}</code>
                  <CopyBtn text={myShareLink} label="Copy"/>
                </div>
                <ShareMessageCard shareText={myShareText} shareUrl={myShareLink} token={myToken} compact/>
              </>
            )}
          </div>
        </div>

        <CtaBanner onJoin={onJoin}/>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REFERRER PUBLIC PROFILE PAGE  (?r=CODE)
// Friend of a referrer lands here — sees business info, their reward, referral code
// ═══════════════════════════════════════════════════════════════════════════════
function ReferrerProfilePage({ refCode, onSignUp }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(()=>{
    api(`/referrer/${refCode}`)
      .then(d=>setData(d))
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  if(loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F9FC'}}><Spin/></div>;

  if(error) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F9FC',padding:24}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:12}}>🔗</div>
        <div style={{fontSize:18,fontWeight:700,color:'#0F172A',marginBottom:8}}>Link not found</div>
        <p style={{fontSize:14,color:'#64748B',marginBottom:20}}>This referral link may be invalid or expired.</p>
        <button className="btn btn-primary" style={{width:'auto',padding:'12px 28px'}} onClick={onSignUp}>Go to EasyRecommend →</button>
      </div>
    </div>
  );

  const { referrer, clinic } = data;
  const waMsg = encodeURIComponent(`Hi! I was referred by ${referrer?.name||'a friend'} and I'd like to get in touch.`);

  const WA_ICO = <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;

  return (
    <div style={{minHeight:'100vh',background:'#F7F9FC',fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif"}}>
      <div style={{background:'#0D9488',padding:'12px 20px'}}>
        <span style={{fontWeight:800,fontSize:16,color:'#fff',letterSpacing:'-.02em'}}>Easy<span style={{color:'#CCFBF1'}}>Recommend</span></span>
      </div>

      <div style={{maxWidth:480,margin:'0 auto',padding:'20px 20px 60px'}}>

        {/* Referred by banner */}
        {referrer?.name && (
          <div className="au" style={{background:'rgba(13,148,136,.06)',border:'1px solid rgba(13,148,136,.15)',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:13,color:'#0F172A'}}>
            👋 <strong>{referrer.name}</strong> recommended this business to you
          </div>
        )}

        {/* Business card */}
        <div className="au1 card" style={{marginBottom:14,overflow:'hidden'}}>
          <div style={{background:'linear-gradient(135deg,#0D9488,#059669)',padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:48,height:48,borderRadius:14,background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>🏢</div>
              <div style={{fontSize:18,fontWeight:800,color:'#fff',lineHeight:1.1}}>{clinic?.name || 'Business'}</div>
            </div>
          </div>

          {/* Contact */}
          {(clinic?.showWhatsapp||clinic?.showPhone||clinic?.showEmail) && (
            <div style={{padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,borderBottom:'1px solid #F1F5F9'}}>
              <div style={{fontSize:13,color:'#64748B'}}>Contact the business</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {clinic.showWhatsapp && clinic.phone && (
                  <a href={`https://wa.me/${clinic.phone.replace(/[^0-9]/g,'')}?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                    style={{display:'inline-flex',alignItems:'center',gap:5,padding:'7px 12px',background:'#25D366',borderRadius:8,color:'#fff',fontWeight:600,fontSize:12,textDecoration:'none'}}>
                    {WA_ICO} WhatsApp
                  </a>
                )}
                {clinic.showPhone && clinic.phone && (
                  <a href={`tel:${clinic.phone}`}
                    style={{display:'inline-flex',alignItems:'center',gap:5,padding:'7px 12px',background:'#334155',borderRadius:8,color:'#fff',fontWeight:600,fontSize:12,textDecoration:'none'}}>
                    📞 {clinic.phone}
                  </a>
                )}
                {clinic.showEmail && clinic.email && (
                  <a href={`mailto:${clinic.email}`}
                    style={{display:'inline-flex',alignItems:'center',gap:5,padding:'7px 12px',background:'#0EA5E9',borderRadius:8,color:'#fff',fontWeight:600,fontSize:12,textDecoration:'none'}}>
                    ✉️ Email
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Services */}
          {clinic?.treatments?.length>0 && (
            <div style={{padding:'10px 16px'}}>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {clinic.treatments.map((t,i)=>(
                  <span key={i} style={{padding:'4px 10px',background:'#F1F5F9',borderRadius:100,fontSize:12,color:'#334155',fontWeight:500}}>{t.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reward for the friend */}
        {clinic?.patientReward && (
          <div className="au2 card" style={{marginBottom:14,border:'1.5px solid rgba(245,158,11,.25)',background:'#FFFBEB'}}>
            <div className="card-body">
              <div style={{fontSize:11,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'#F59E0B',marginBottom:6}}>🎟 Your reward</div>
              <div style={{fontSize:18,fontWeight:800,color:'#0F172A'}}>{clinic.patientReward}</div>
              <div style={{fontSize:12,color:'#92400E',marginTop:4}}>Mention your referral code when you visit</div>
            </div>
          </div>
        )}

        {/* Referral code */}
        <div className="au3 card">
          <div className="card-body">
            <div style={{fontSize:11,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'#64748B',marginBottom:10}}>Show this code when you visit</div>
            <div className="code-box">
              <div className="code-text">{refCode}</div>
            </div>
          </div>
        </div>

        <CtaBanner onJoin={onSignUp}/>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [authData,setAuthData]=useState(()=>getAuth());
  const [checking,setChecking]=useState(true);
  const [screen,setScreen]=useState('landing');
  const [loginRole,setLoginRole]=useState('patient');
  const [clinicIdParam] = useState(()=>new URLSearchParams(window.location.search).get('b'));
  const [refCodeParam]  = useState(()=>new URLSearchParams(window.location.search).get('r'));
  const [featuredParam]   = useState(()=>window.location.hash==='#/featured'  ||window.location.pathname==='/featured');
  const [influencerParam] = useState(()=>window.location.hash==='#/influencertry'||window.location.pathname==='/influencertry');

  useEffect(()=>{
    const a=getAuth();
    if(a?.token){
      api('/auth/me',{},a.token)
        .then(d=>{
          const next={...a,user:d.user};
          saveAuth(next);setAuthData(next);
          // Check if they navigated to featured — show it even when logged in
          if(featuredParam)   setScreen('featured');
          else if(influencerParam) setScreen('influencer');
          else setScreen('app');
        })
        .catch(e=>{
          if(e.message?.includes('401')||e.message?.includes('Session expired')||e.message?.includes('authenticated')){
            clearAuth();setAuthData(null);
            setScreen(featuredParam?'featured':influencerParam?'influencer':refCodeParam?'ref':clinicIdParam?'clinic':'landing');
          } else {
            setScreen(featuredParam?'featured':influencerParam?'influencer':'app');
          }
        })
        .finally(()=>setChecking(false));
    }else{
      setChecking(false);
      if (featuredParam)          setScreen('featured');
      else if (influencerParam)   setScreen('influencer');
      else if (refCodeParam)      setScreen('ref');
      else if (clinicIdParam)     setScreen('clinic');
      else setScreen('landing');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const handleLogin=d=>{saveAuth(d);setAuthData(d);window.location.hash='';setScreen('app');};
  const handleSignOut=()=>{clearAuth();setAuthData(null);setScreen('landing');};

  if(checking) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F9FC'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:48,height:48,background:'#0D9488',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 4px 16px rgba(13,148,136,.3)'}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07"/></svg>
        </div>
        <Spin/>
      </div>
    </div>
  );

  const {user,token}=authData||{};
  return (
    <>
      <style>{CSS}</style>
      {screen==='influencer' && <InfluencerPage onBack={()=>{window.location.hash='';setScreen('landing');}}/>}
      {screen==='featured'   && <FeaturedPage onGetStarted={(role)=>{setLoginRole(role||'patient');setScreen('login');window.history.replaceState(null,'',window.location.pathname);}}/>}
      {screen==='landing' && <LandingPage onGetStarted={()=>{setLoginRole('patient');setScreen('login');}} onFeatured={()=>{setScreen('featured');window.location.hash='#/featured';}} onInfluencer={()=>{setScreen('influencer');window.location.hash='#/influencertry';}}/>}
      {screen==='ref'     && <ReferrerProfilePage refCode={refCodeParam} onSignUp={()=>{setLoginRole('patient');setScreen('login');}}/>}
      {screen==='clinic'  && <ClinicProfilePage clinicId={clinicIdParam} onJoin={(role)=>{setLoginRole(role||'patient');setScreen('login');}}/>}
      {screen==='login'   && <LoginScreen onLogin={handleLogin} clinicId={loginRole==='patient'?clinicIdParam:undefined} initialRole={loginRole}/>}
      {screen==='app' && user?.role==='patient' && <PatientDashboard  user={user} token={token} onSignOut={handleSignOut}/>}
      {screen==='app' && user?.role==='doctor'  && <DoctorDashboard   user={user} token={token} onSignOut={handleSignOut}/>}
      {screen==='app' && user?.role==='admin'   && <AdminDashboard    user={user} token={token} onSignOut={handleSignOut}/>}
    </>
  );
}