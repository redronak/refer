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

.lp-hero-bg {
  background: linear-gradient(135deg, #0F172A 0%, #0D4A45 40%, #065F46 70%, #0F172A 100%);
  background-size: 300% 300%;
  animation: gradShift 8s ease infinite;
  position: relative; overflow: hidden;
}
.lp-hero-bg::before {
  content:''; position:absolute; inset:0;
  background: radial-gradient(ellipse at 30% 50%, rgba(13,148,136,.25) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(16,185,129,.15) 0%, transparent 50%);
  pointer-events: none;
}
.lp-grid-overlay {
  position:absolute; inset:0; pointer-events:none;
  background-image: linear-gradient(rgba(13,148,136,.06) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(13,148,136,.06) 1px, transparent 1px);
  background-size: 40px 40px;
}
.lp-nav {
  position: fixed; top:0; left:0; right:0; z-index:100;
  backdrop-filter: blur(12px) saturate(1.5);
  background: rgba(15,23,42,.8);
  border-bottom: 1px solid rgba(13,148,136,.2);
  padding: 14px 24px; display:flex; align-items:center; justify-content:space-between;
  transition: all .3s;
}
.lp-badge {
  display:inline-flex; align-items:center; gap:6px;
  padding: 6px 14px; border-radius:100px;
  background: rgba(13,148,136,.15); border: 1px solid rgba(13,148,136,.3);
  font-size:12px; font-weight:600; color:#5EEAD4; letter-spacing:.04em;
}
.lp-badge-dot { width:6px; height:6px; border-radius:50%; background:#10B981; animation:pulse 2s ease-in-out infinite; }
.lp-headline {
  font-size: clamp(40px, 7vw, 72px); font-weight:800; line-height:1.05;
  letter-spacing:-.03em; color:#F8FAFC;
}
.lp-headline em { font-style:normal; color:#2DD4BF; }
.lp-sub { font-size:clamp(16px,2vw,20px); color:rgba(248,250,252,.65); line-height:1.7; font-weight:300; }
.lp-btn-primary {
  display:inline-flex; align-items:center; gap:10px; padding:16px 32px;
  background: linear-gradient(135deg, #0D9488, #059669); border:none; border-radius:12px;
  color:#fff; font-size:16px; font-weight:700; cursor:pointer;
  box-shadow: 0 4px 24px rgba(13,148,136,.4); transition:all .2s; text-decoration:none;
  letter-spacing:-.01em;
}
.lp-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(13,148,136,.5); }
.lp-btn-ghost {
  display:inline-flex; align-items:center; gap:8px; padding:15px 28px;
  background:transparent; border:1.5px solid rgba(255,255,255,.2); border-radius:12px;
  color:rgba(255,255,255,.8); font-size:15px; font-weight:600; cursor:pointer; transition:all .2s;
}
.lp-btn-ghost:hover { border-color:rgba(255,255,255,.5); color:#fff; background:rgba(255,255,255,.05); }
.lp-float-card {
  background:rgba(255,255,255,.06); backdrop-filter:blur(12px);
  border:1px solid rgba(255,255,255,.12); border-radius:16px; padding:20px;
  color:#F8FAFC;
}
.lp-stat {
  text-align:center; padding:28px 20px;
}
.lp-stat-num { font-size:clamp(36px,5vw,52px); font-weight:800; color:#0D9488; line-height:1; }
.lp-stat-lbl { font-size:14px; color:#64748B; margin-top:6px; font-weight:500; }
.lp-feature-icon {
  width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center;
  font-size:22px; margin-bottom:16px; flex-shrink:0;
}
.lp-step-num {
  width:40px; height:40px; border-radius:50%; background:rgba(13,148,136,.12); border:2px solid rgba(13,148,136,.3);
  display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:800; color:#0D9488; flex-shrink:0;
}
.lp-ticker-wrap { overflow:hidden; white-space:nowrap; background:#F8FAFC; border-top:1px solid #E8EDF5; border-bottom:1px solid #E8EDF5; padding:12px 0; }
.lp-ticker-track { display:inline-flex; animation:ticker 30s linear infinite; }
.lp-ticker-item { display:inline-flex; align-items:center; gap:10px; padding:0 24px; font-size:12px; font-weight:700; color:#94A3B8; letter-spacing:.08em; text-transform:uppercase; }
.lp-ticker-dot { width:4px; height:4px; border-radius:50%; background:#0D9488; }
.lp-section { padding:88px 24px; max-width:1100px; margin:0 auto; }
.lp-section-tag { display:inline-flex; align-items:center; gap:8px; padding:6px 14px; background:rgba(13,148,136,.08); border:1px solid rgba(13,148,136,.2); border-radius:100px; font-size:12px; font-weight:600; color:#0D9488; margin-bottom:16px; }
.lp-section-h { font-size:clamp(28px,4vw,40px); font-weight:800; color:#0F172A; line-height:1.15; letter-spacing:-.025em; margin-bottom:14px; }
.lp-section-sub { font-size:16px; color:#64748B; line-height:1.7; max-width:560px; }
.lp-card-hover { transition:transform .2s, box-shadow .2s; }
.lp-card-hover:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,.1)!important; }
.lp-testimonial { background:#fff; border:1px solid #E8EDF5; border-radius:16px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,.04); }
.lp-cta-section { background:linear-gradient(135deg,#0F172A 0%,#0D4A45 100%); padding:80px 24px; text-align:center; position:relative; overflow:hidden; }
.lp-footer { background:#0F172A; color:rgba(255,255,255,.5); padding:32px 24px; font-size:13px; }
@media(max-width:640px){
  .lp-section{padding:56px 20px}
  .lp-hero-content{padding:0 20px!important;grid-template-columns:1fr!important;gap:32px!important}
  .lp-features-grid{grid-template-columns:1fr!important}
  .lp-steps-grid{grid-template-columns:1fr!important}
  .lp-stats-grid{grid-template-columns:1fr 1fr!important}
  .lp-cta-btns{flex-direction:column!important}
  .lp-cta-btns button,.lp-cta-btns a{width:100%!important}
  .lp-section > div[style*="grid-template-columns:'1fr 1fr'"],.lp-section > div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}
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
// LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function LandingPage({ onGetStarted }) {
  const TICKER = ['Verified Referrals','Business Approved','Instant Payouts','Bank & Mobile Payouts','Multi-Clinic Ready','Fraud Protected','Real-Time Tracking','WhatsApp Sharing'];

  return (
    <div style={{minHeight:'100vh',background:'#F7F9FC',fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif"}}>

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,background:'linear-gradient(135deg,#0D9488,#059669)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(13,148,136,.4)'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.95 9.5 19.79 19.79 0 01.88 4.72 2 2 0 012.88 2.54h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L7.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
          </div>
          <span style={{fontWeight:800,fontSize:18,color:'#fff',letterSpacing:'-.02em'}}>Easy<span style={{color:'#2DD4BF'}}>Recommend</span></span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={onGetStarted} className="lp-btn-ghost" style={{padding:'9px 20px',fontSize:13}}>Sign in</button>
          <button onClick={onGetStarted} className="lp-btn-primary" style={{padding:'9px 20px',fontSize:13,boxShadow:'0 2px 12px rgba(13,148,136,.4)'}}>Get started →</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero-bg" style={{minHeight:'100vh',display:'flex',alignItems:'center',paddingTop:80}}>
        <div className="lp-grid-overlay"/>

        {/* Floating orbs */}
        <div style={{position:'absolute',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(13,148,136,.18) 0%,transparent 70%)',top:'10%',right:'-5%',pointerEvents:'none',animation:'floatSlow 7s ease-in-out infinite'}}/>
        <div style={{position:'absolute',width:250,height:250,borderRadius:'50%',background:'radial-gradient(circle,rgba(16,185,129,.12) 0%,transparent 70%)',bottom:'15%',left:'5%',pointerEvents:'none',animation:'float 5s ease-in-out infinite'}}>
          <div style={{position:'absolute',inset:0,borderRadius:'50%',border:'1px solid rgba(13,148,136,.2)',animation:'ripple 3s ease-out infinite'}}/>
        </div>

        <div className="lp-hero-content" style={{width:'100%',maxWidth:1100,margin:'0 auto',padding:'60px 40px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:60,alignItems:'center'}}>

          {/* Left: copy */}
          <div>
            <div className="au" style={{marginBottom:24}}>
              <div className="lp-badge"><span className="lp-badge-dot"/>The Referral Platform for Every Business</div>
            </div>
            <h1 className="au1 lp-headline" style={{marginBottom:22}}>
              Refer clients.<br/>
              Earn <em>real money.</em><br/>
              Instantly.
            </h1>
            <p className="au2 lp-sub" style={{marginBottom:36,maxWidth:480}}>
              Share your referral link with friends. Earn rewards when they become a client — works for clinics, law firms, real estate agents, and more.
            </p>
            <div className="au3" style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center',marginBottom:36}}>
              <button onClick={onGetStarted} className="lp-btn-primary">
                Start Earning Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button onClick={onGetStarted} className="lp-btn-ghost">
                I'm a Business →
              </button>
            </div>

            {/* Trust row */}
            <div className="au4" style={{display:'flex',gap:20,flexWrap:'wrap'}}>
              {[['✅','Business Verified'],['🔒','Fraud Protected'],['💸','Cash Payouts']].map(([ic,lb])=>(
                <div key={lb} style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'rgba(248,250,252,.7)',fontWeight:500}}>
                  <span>{ic}</span><span>{lb}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: floating UI mockup cards */}
          <div style={{position:'relative',height:420,display:'grid',placeItems:'center'}}>
            {/* Main card */}
            <div className="lp-float-card au2" style={{width:'100%',maxWidth:300,animation:'float 6s ease-in-out infinite'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                <div style={{width:36,height:36,borderRadius:10,background:'rgba(13,148,136,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>💊</div>
                <div><div style={{fontSize:14,fontWeight:700,color:'#F8FAFC'}}>Legal Consultation</div><div style={{fontSize:11,color:'rgba(248,250,252,.5)'}}>Hassan & Partners</div></div>
              </div>
              <div style={{background:'rgba(13,148,136,.15)',border:'1px dashed rgba(13,148,136,.4)',borderRadius:10,padding:16,textAlign:'center',marginBottom:14}}>
                <div style={{fontSize:22,fontWeight:800,letterSpacing:'.12em',color:'#2DD4BF',fontFamily:'monospace'}}>PT3A9F2B</div>
                <div style={{fontSize:11,color:'rgba(248,250,252,.5)',marginTop:4}}>Your referral code</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1,background:'#25D366',borderRadius:8,padding:'9px',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontSize:12,fontWeight:700,color:'#fff'}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </div>
                <div style={{flex:1,background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',borderRadius:8,padding:'9px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,color:'rgba(248,250,252,.8)'}}>Copy</div>
              </div>
            </div>

            {/* Floating notification pill — top right */}
            <div style={{position:'absolute',top:20,right:-10,background:'rgba(16,185,129,.15)',backdropFilter:'blur(10px)',border:'1px solid rgba(16,185,129,.3)',borderRadius:12,padding:'10px 14px',display:'flex',alignItems:'center',gap:8,animation:'float 4s ease-in-out infinite .5s'}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(16,185,129,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🎉</div>
              <div><div style={{fontSize:12,fontWeight:700,color:'#F8FAFC'}}>$500 approved!</div><div style={{fontSize:10,color:'rgba(248,250,252,.5)'}}>Legal consultation referral</div></div>
            </div>

            {/* Floating approved badge — bottom left */}
            <div style={{position:'absolute',bottom:30,left:-20,background:'rgba(15,23,42,.8)',backdropFilter:'blur(10px)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,padding:'10px 14px',animation:'float 5s ease-in-out infinite 1s'}}>
              <div style={{fontSize:11,color:'rgba(248,250,252,.5)',marginBottom:4}}>Referral status</div>
              <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:8,height:8,borderRadius:'50%',background:'#10B981',boxShadow:'0 0 6px rgba(16,185,129,.6)'}}/><span style={{fontSize:13,fontWeight:700,color:'#34D399'}}>✅ Approved by Business</span></div>
            </div>
          </div>
        </div>

        {/* Bottom hero gradient fade */}
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:120,background:'linear-gradient(to bottom,transparent,#F7F9FC)',pointerEvents:'none'}}/>
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
      <section style={{background:'#fff',borderBottom:'1px solid #E8EDF5'}}>
        <div className="lp-stats-grid" style={{maxWidth:900,margin:'0 auto',padding:'12px 24px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0}}>
          {[['5,000+','Referrals Logged'],['$2M+','Commissions Paid'],['200+','Businesses Onboarded'],['98%','Doctor Approval Rate']].map(([n,l],i)=>(
            <div key={l} className="lp-stat" style={{borderRight:i<3?'1px solid #E8EDF5':undefined}}>
              <div className="lp-stat-num">{n}</div>
              <div className="lp-stat-lbl">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{background:'#F7F9FC'}}>
        <div className="lp-section">
          <div style={{textAlign:'center',marginBottom:56}}>
            <div className="lp-section-tag">How it works</div>
            <h2 className="lp-section-h" style={{textAlign:'center'}}>Three steps to your first payout</h2>
            <p className="lp-section-sub" style={{textAlign:'center',margin:'0 auto'}}>No complicated setup. Just share, track, and get paid.</p>
          </div>
          <div className="lp-steps-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}>
            {[
              {n:'1',icon:'📱',title:'Get your code',body:"Sign up with your phone in 30 seconds. You'll instantly get a unique referral code and shareable link.",color:'rgba(13,148,136,.1)',border:'rgba(13,148,136,.2)'},
              {n:'2',icon:'🤝',title:'Refer someone',body:'Share your link on WhatsApp or with friends. When they visit the business, they mention your code.',color:'rgba(139,92,246,.08)',border:'rgba(139,92,246,.2)'},
              {n:'3',icon:'💰',title:'Get paid',body:"The business approves the referral and your commission drops into your wallet. Withdraw to your bank or mobile wallet.",color:'rgba(16,185,129,.08)',border:'rgba(16,185,129,.2)'},
            ].map((s,i)=>(
              <div key={s.n} className="card lp-card-hover" style={{padding:28,position:'relative',border:'1px solid #E8EDF5'}}>
                <div style={{position:'absolute',top:20,right:20,fontSize:60,fontWeight:900,color:'#F1F5F9',lineHeight:1,userSelect:'none'}}>{s.n}</div>
                <div style={{width:52,height:52,borderRadius:14,background:s.color,border:`1px solid ${s.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:16}}>{s.icon}</div>
                <div style={{fontSize:17,fontWeight:700,color:'#0F172A',marginBottom:8}}>{s.title}</div>
                <div style={{fontSize:14,color:'#64748B',lineHeight:1.7}}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES SPLIT ── */}
      <section style={{background:'#fff',borderTop:'1px solid #E8EDF5'}}>
        <div className="lp-section">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:72,alignItems:'center'}}>
            <div>
              <div className="lp-section-tag">For Referrers</div>
              <h2 className="lp-section-h">Earn while you connect friends with great businesses</h2>
              <p className="lp-section-sub" style={{marginBottom:32}}>Every successful referral puts real money in your pocket — no selling, no upfront cost, just sharing.</p>
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {[
                  {icon:'🔗',title:'Unique referral link',body:'Your personal link works with any partner business'},
                  {icon:'📊',title:'Real-time tracking',body:'Watch every referral move from pending → approved → paid'},
                  {icon:'💳',title:'Instant withdrawals',body:'Cash out to your bank account or mobile wallet'},
                  {icon:'🔔',title:'Smart notifications',body:"Get alerted the moment your referral is approved or paid"},
                ].map(f=>(
                  <div key={f.title} style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                    <div style={{width:40,height:40,borderRadius:10,background:'rgba(13,148,136,.08)',border:'1px solid rgba(13,148,136,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{f.icon}</div>
                    <div><div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:3}}>{f.title}</div><div style={{fontSize:13,color:'#64748B',lineHeight:1.6}}>{f.body}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:'linear-gradient(135deg,#0F172A,#0D4A45)',borderRadius:20,padding:28,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,right:0,width:150,height:150,borderRadius:'50%',background:'radial-gradient(circle,rgba(13,148,136,.25),transparent 70%)',pointerEvents:'none'}}/>
              <div style={{fontSize:13,fontWeight:600,color:'rgba(248,250,252,.5)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:16}}>Your Wallet</div>
              {[{lbl:'⏳ Pending Earnings',val:'$350',color:'#F59E0B'},{lbl:'✅ Approved',val:'$1,200',color:'#34D399'},{lbl:'💳 Withdrawable',val:'$850',color:'#2DD4BF'}].map(w=>(
                <div key={w.lbl} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.08)',borderRadius:10,marginBottom:10}}>
                  <span style={{fontSize:13,color:'rgba(248,250,252,.7)',fontWeight:500}}>{w.lbl}</span>
                  <span style={{fontSize:15,fontWeight:800,color:w.color}}>{w.val}</span>
                </div>
              ))}
              <button onClick={onGetStarted} style={{width:'100%',marginTop:8,padding:'12px',background:'linear-gradient(135deg,#0D9488,#059669)',border:'none',borderRadius:10,color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                Withdraw Now →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── DOCTOR SECTION ── */}
      <section style={{background:'#F7F9FC',borderTop:'1px solid #E8EDF5'}}>
        <div className="lp-section">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:72,alignItems:'center'}}>
            <div style={{order:2}}>
              <div className="lp-section-tag">For Businesses</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:14}}>
                {['🏥 Healthcare','⚖️ Legal','🏠 Real Estate','💼 Finance','💪 Fitness','🦷 Dental','🎓 Education','🛠 Services'].map(tag=>(
                  <span key={tag} style={{padding:'4px 12px',background:'#F1F5F9',borderRadius:100,fontSize:12,fontWeight:600,color:'#334155'}}>{tag}</span>
                ))}
              </div>
              <h2 className="lp-section-h">Grow your client base through word-of-mouth</h2>
              <p className="lp-section-sub" style={{marginBottom:32}}>Word-of-mouth is the most powerful growth channel. EasyRecommend turns it into a structured, trackable referral engine.</p>
              <div className="lp-features-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                {[
                  {icon:'💊',title:'Custom commissions',body:'Set fixed or % commission per referral',bg:'rgba(139,92,246,.08)',bc:'rgba(139,92,246,.2)'},
                  {icon:'✅',title:'Full approval control',body:'You decide every referral — no auto-payouts',bg:'rgba(16,185,129,.08)',bc:'rgba(16,185,129,.2)'},
                  {icon:'📈',title:'Conversion analytics',body:'Track referral rates and commission spend',bg:'rgba(14,165,233,.08)',bc:'rgba(14,165,233,.2)'},
                  {icon:'🛡️',title:'Fraud protection',body:'One referral per client, verified by phone',bg:'rgba(245,158,11,.08)',bc:'rgba(245,158,11,.2)'},
                ].map(f=>(
                  <div key={f.title} className="card lp-card-hover" style={{padding:18,border:'1px solid #E8EDF5'}}>
                    <div style={{width:36,height:36,borderRadius:10,background:f.bg,border:`1px solid ${f.bc}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,marginBottom:10}}>{f.icon}</div>
                    <div style={{fontSize:13,fontWeight:700,color:'#0F172A',marginBottom:4}}>{f.title}</div>
                    <div style={{fontSize:12,color:'#64748B',lineHeight:1.6}}>{f.body}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Doctor dashboard preview */}
            <div style={{order:1}}>
              <div className="card" style={{border:'1px solid #E8EDF5',overflow:'hidden'}}>
                <div style={{background:'#0F172A',padding:'12px 18px',display:'flex',alignItems:'center',gap:6}}>
                  {['#EF4444','#F59E0B','#10B981'].map(c=><div key={c} style={{width:10,height:10,borderRadius:'50%',background:c}}/>)}
                  <span style={{fontSize:11,color:'rgba(255,255,255,.4)',marginLeft:6}}>Business Dashboard</span>
                </div>
                <div style={{padding:18}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
                    {[{n:'47',l:'Total Referrals',c:'#0D9488'},{n:'38',l:'Approved',c:'#10B981'},{n:'81%',l:'Conversion',c:'#8B5CF6'},{n:'$19K',l:'Commission Paid',c:'#F59E0B'}].map(s=>(
                      <div key={s.l} style={{background:'#F7F9FC',borderRadius:10,padding:'12px 14px',border:'1px solid #E8EDF5'}}>
                        <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.n}</div>
                        <div style={{fontSize:10,color:'#94A3B8',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginTop:2}}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:'#F7F9FC',borderRadius:10,padding:'12px 14px',border:'1px solid #E8EDF5'}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>Recent Referrals</div>
                    {[{n:'James R.',t:'Legal Consultation',s:'approved',a:'500'},{n:'Sarah K.',t:'Property Viewing',s:'pending',a:'300'},{n:'Mike T.',t:'Fitness Plan',s:'visit_completed',a:'250'}].map(r=>(
                      <div key={r.n} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #E8EDF5'}}>
                        <div><div style={{fontSize:13,fontWeight:600,color:'#0F172A'}}>{r.n}</div><div style={{fontSize:11,color:'#94A3B8'}}>{r.t}</div></div>
                        <div style={{textAlign:'right'}}>
                          {statusBadge(r.s)}
                          <div style={{fontSize:11,fontWeight:700,color:'#0D9488',marginTop:3}}>{r.a}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{background:'#fff',borderTop:'1px solid #E8EDF5'}}>
        <div className="lp-section">
          <div style={{textAlign:'center',marginBottom:48}}>
            <div className="lp-section-tag">Testimonials</div>
            <h2 className="lp-section-h" style={{textAlign:'center'}}>People love earning with EasyRecommend</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18}}>
            {[
              {q:'"I earned $80 last month just by telling 3 friends about my dentist. The link made it so easy to share."',n:'Sarah M.',r:'Dubai',tag:'🏥 Healthcare',tagColor:'#0D9488',tagBg:'rgba(13,148,136,.08)'},
              {q:'"Our new client count went up 35% after joining EasyRecommend. The approval control gives us full confidence."',n:'James K.',r:'London',tag:'⚖️ Law Firm',tagColor:'#8B5CF6',tagBg:'rgba(139,92,246,.08)'},
              {q:'"I referred two families to my real estate agent and earned $400. Took me 5 minutes to share the link."',n:'Priya S.',r:'Toronto',tag:'🏠 Real Estate',tagColor:'#F59E0B',tagBg:'rgba(245,158,11,.08)'},
              {q:'"As a financial advisor, EasyRecommend turned my happy clients into my best marketing channel."',n:'David L.',r:'New York',tag:'💼 Finance',tagColor:'#0EA5E9',tagBg:'rgba(14,165,233,.08)'},
              {q:'"My gym set up a referral program in minutes. Members love earning rewards for bringing friends in."',n:'Marcus T.',r:'Sydney',tag:'💪 Fitness',tagColor:'#10B981',tagBg:'rgba(16,185,129,.08)'},
              {q:'"We use it for our dental practice. Patients refer friends and both sides get rewarded — win-win."',n:'Dr. Chen W.',r:'Singapore',tag:'🦷 Dental',tagColor:'#EF4444',tagBg:'rgba(239,68,68,.08)'},
            ].map((t,i)=>(
              <div key={i} className="lp-testimonial lp-card-hover">
                <div style={{display:'flex',gap:2,marginBottom:10}}>
                  {Array(5).fill(0).map((_,j)=><span key={j} style={{color:'#F59E0B',fontSize:14}}>★</span>)}
                </div>
                <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:100,fontSize:11,fontWeight:700,color:t.tagColor,background:t.tagBg,marginBottom:12}}>{t.tag}</span>
                <p style={{fontSize:14,color:'#334155',lineHeight:1.75,marginBottom:18}}>{t.q}</p>
                <div style={{display:'flex',alignItems:'center',gap:10,borderTop:'1px solid #F1F5F9',paddingTop:14}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${t.tagColor},${t.tagColor}99)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0}}>{t.n[0]}</div>
                  <div><div style={{fontSize:13,fontWeight:700,color:'#0F172A'}}>{t.n}</div><div style={{fontSize:11,color:'#94A3B8'}}>{t.r}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta-section">
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(13,148,136,.2) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',maxWidth:600,margin:'0 auto'}}>
          <div style={{fontSize:12,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#2DD4BF',marginBottom:14}}>Ready to start?</div>
          <p style={{fontSize:16,color:'rgba(248,250,252,.6)',lineHeight:1.7,marginBottom:36}}>
            Set up a referral program in minutes. Reward people for spreading the word.
          </p>
          <div className="lp-cta-btns" style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={onGetStarted} className="lp-btn-primary" style={{fontSize:16,padding:'16px 36px'}}>
              Sign Up Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button onClick={onGetStarted} className="lp-btn-ghost" style={{fontSize:15,padding:'15px 28px'}}>
              Join as a Business →
            </button>
          </div>
          <p style={{fontSize:12,color:'rgba(248,250,252,.35)',marginTop:20}}>Free to join · No hidden fees · Local currency payouts</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div style={{maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:28,height:28,background:'linear-gradient(135deg,#0D9488,#059669)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07"/></svg>
            </div>
            <span style={{fontWeight:700,color:'rgba(255,255,255,.7)',fontSize:14}}>EasyRecommend</span>
          </div>
          <div style={{display:'flex',gap:20,fontSize:13}}>
            {['Privacy','Terms','Support'].map(l=><span key={l} style={{cursor:'pointer',color:'rgba(255,255,255,.4)',transition:'color .15s'}} onMouseEnter={e=>e.target.style.color='rgba(255,255,255,.8)'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.4)'}>{l}</span>)}
          </div>
          <div>© 2026 EasyRecommend. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

// ─── Country codes ────────────────────────────────────────────────────────────
const COUNTRIES = [
  { code:'+92',  flag:'🇵🇰', name:'Pakistan',      placeholder:'3XX XXXXXXX' },
  { code:'+1',   flag:'🇺🇸', name:'USA / Canada',  placeholder:'XXX XXX XXXX' },
  { code:'+44',  flag:'🇬🇧', name:'UK',             placeholder:'7XXX XXXXXX' },
  { code:'+971', flag:'🇦🇪', name:'UAE',            placeholder:'5X XXX XXXX' },
  { code:'+966', flag:'🇸🇦', name:'Saudi Arabia',  placeholder:'5X XXX XXXX' },
  { code:'+974', flag:'🇶🇦', name:'Qatar',          placeholder:'3X XXX XXX' },
  { code:'+965', flag:'🇰🇼', name:'Kuwait',         placeholder:'X XXX XXXX' },
  { code:'+91',  flag:'🇮🇳', name:'India',          placeholder:'XXXXX XXXXX' },
  { code:'+880', flag:'🇧🇩', name:'Bangladesh',     placeholder:'1X XXXX XXXX' },
  { code:'+93',  flag:'🇦🇫', name:'Afghanistan',    placeholder:'7X XXX XXXX' },
  { code:'+90',  flag:'🇹🇷', name:'Turkey',         placeholder:'5XX XXX XXXX' },
  { code:'+49',  flag:'🇩🇪', name:'Germany',        placeholder:'XXX XXXXXXX' },
  { code:'+33',  flag:'🇫🇷', name:'France',         placeholder:'X XX XX XX XX' },
  { code:'+61',  flag:'🇦🇺', name:'Australia',      placeholder:'4XX XXX XXX' },
  { code:'+60',  flag:'🇲🇾', name:'Malaysia',       placeholder:'1X XXXX XXXX' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin, clinicId }) {
  const [step,    setStep]   = useState('phone');
  const [cc,      setCc]     = useState(COUNTRIES[0]); // country code object
  const [phone,   setPhone]  = useState('');
  const [otp,     setOtp]    = useState(['','','','','','']);
  const [name,    setName]   = useState('');
  const [role,    setRole]   = useState('patient');
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
      if(d.isNew||!d.user.name){setStep('profile');}
      else{saveAuth(d);onLogin(d);}
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
              <input className="fi" placeholder="Clinic name" value={clinic} onChange={e=>setClinic(e.target.value)}/>
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
  const [showBulk,   setShowBulk]   = useState(false);
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
      <button className="btn btn-secondary" style={{width:'100%',marginBottom:10,fontSize:13}} onClick={handleCopy}>
        {copied ? '✓ Copied!' : '📋 Copy message'}
      </button>

      {/* Bulk SMS toggle — hidden in compact mode */}
      {!compact && (
      <button
        className="btn btn-secondary"
        style={{width:'100%',fontSize:13,borderColor:'rgba(13,148,136,.3)',color:'#0D9488',background:'rgba(13,148,136,.04)'}}
        onClick={()=>setShowBulk(b=>!b)}
      >
        📤 {showBulk ? 'Hide' : 'Bulk SMS — upload contacts'}
      </button>
      )}

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
      </div>

      {showLog&&<LogReferralModal token={token} treatments={treatments} onClose={()=>setShowLog(false)} onDone={()=>{setShowLog(false);load();}}/>}
      {showTx&&<TreatmentModal token={token} initial={editTx} onClose={()=>setShowTx(false)} onDone={()=>{setShowTx(false);load();}}/>}

      <nav className="bottom-nav">
        {[{id:'home',lbl:'Home'},{id:'referrals',lbl:'Referrals'},{id:'treatments',lbl:'Treatments'},{id:'payouts',lbl:'Payouts'}].map(t=>(
          <button key={t.id} className={`bnav-btn${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>
            {t.id==='home'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
            {t.id==='referrals'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
            {t.id==='treatments'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
            {t.id==='payouts'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
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

  useEffect(()=>{
    api(`/clinic/${clinicId}`)
      .then(d=>setClinic(d.clinic))
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  if(loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F9FC'}}><Spin/></div>;
  if(error) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F9FC',padding:24}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:12}}>🏥</div>
        <div style={{fontSize:18,fontWeight:700,color:'#0F172A',marginBottom:8}}>Business not found</div>
        <button className="btn btn-primary" style={{width:'auto',padding:'12px 28px',marginTop:8}} onClick={onJoin}>Go to EasyRecommend →</button>
      </div>
    </div>
  );

  const waMsg = encodeURIComponent(`Hi! I found ${clinic.name} on EasyRecommend. I'd like to get in touch.`);

  return (
    <div style={{minHeight:'100vh',background:'#F7F9FC',fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif"}}>
      {/* Top bar */}
      <div style={{background:'#0D9488',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontWeight:800,fontSize:17,color:'#fff',letterSpacing:'-.02em'}}>Easy<span style={{color:'#CCFBF1'}}>Recommend</span></span>
        <button onClick={onJoin} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.3)',borderRadius:8,padding:'7px 16px',color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          Join & Earn
        </button>
      </div>

      <div style={{maxWidth:480,margin:'0 auto',padding:'24px 20px 80px'}}>

        {/* Clinic hero */}
        <div className="au card" style={{marginBottom:14,overflow:'hidden'}}>
          <div style={{background:'linear-gradient(135deg,#0D9488,#059669)',padding:'28px 20px 24px'}}>
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <div style={{width:60,height:60,borderRadius:16,background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0}}>🏥</div>
              <div>
                <div style={{fontSize:22,fontWeight:800,color:'#fff',lineHeight:1.1}}>{clinic.name}</div>
                <div style={{fontSize:14,color:'rgba(255,255,255,.75)',marginTop:4}}>{clinic.doctorName}</div>
              </div>
            </div>
          </div>

          {/* WhatsApp contact — prominent */}
          {clinic.phone && (
            <div style={{padding:'16px 20px',borderBottom:'1px solid #E8EDF5',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:'#0F172A'}}>Contact the business</div>
                <div style={{fontSize:12,color:'#64748B',marginTop:1}}>Chat directly</div>
              </div>
              <a
                href={`https://wa.me/${clinic.phone.replace(/[^0-9]/g,'')}?text=${waMsg}`}
                target="_blank" rel="noopener noreferrer"
                style={{display:'inline-flex',alignItems:'center',gap:7,padding:'11px 18px',background:'#25D366',borderRadius:9,color:'#fff',fontWeight:700,fontSize:14,textDecoration:'none',flexShrink:0,boxShadow:'0 2px 8px rgba(37,211,102,.3)'}}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </div>
          )}
        </div>

        {/* Reward */}
        {(clinic.rewards || clinic.patientReward) && (
          <div className="au1 card" style={{marginBottom:14,border:'1px solid rgba(13,148,136,.2)',background:'rgba(13,148,136,.04)'}}>
            <div className="card-body">
              <div style={{fontSize:11,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'#0D9488',marginBottom:10}}>🎁 Rewards</div>
              {clinic.rewards && (
                <div style={{marginBottom:clinic.patientReward?10:0}}>
                  <div style={{fontSize:10,color:'#64748B',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>You earn (referrer)</div>
                  <div style={{fontSize:15,fontWeight:700,color:'#0F172A'}}>{clinic.rewards}</div>
                </div>
              )}
              {clinic.patientReward && (
                <div style={{paddingTop:clinic.rewards?10:0,borderTop:clinic.rewards?'1px solid rgba(13,148,136,.15)':undefined}}>
                  <div style={{fontSize:10,color:'#F59E0B',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>Your friend gets</div>
                  <div style={{fontSize:15,fontWeight:700,color:'#0F172A'}}>{clinic.patientReward}</div>
                  <div style={{fontSize:11,color:'#64748B',marginTop:3}}>Discount applied on their first visit</div>
                </div>
              )}
              <div style={{fontSize:11,color:'#64748B',marginTop:10,paddingTop:8,borderTop:'1px solid rgba(13,148,136,.1)'}}>Credited after the business confirms your referral</div>
            </div>
          </div>
        )}

        {/* Treatments */}
        {clinic.treatments?.length>0 && (
          <div className="au2 card" style={{marginBottom:14}}>
            <div className="card-head"><span style={{fontSize:14,fontWeight:700}}>💊 Treatments</span></div>
            <div style={{padding:'0 18px'}}>
              {clinic.treatments.map((t,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:i<clinic.treatments.length-1?'1px solid #F1F5F9':undefined}}>
                  <span style={{fontSize:14,fontWeight:500,color:'#0F172A'}}>{t.name}</span>
                  <span style={{fontSize:13,fontWeight:700,color:'#0D9488'}}>{t.commission} referral fee</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="au3 disclaimer" style={{marginBottom:16}}>
          ⚠️ Referral rewards are credited only after the business confirms the referral. The business reserves the right to approve or reject any referral.
        </div>


        {/* EasyRecommend CTA section */}
        <div style={{background:'linear-gradient(135deg,#0F172A 0%,#0D4A45 100%)',borderRadius:16,padding:'28px 20px',textAlign:'center',position:'relative',overflow:'hidden',marginTop:4}}>
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(13,148,136,.2) 0%,transparent 70%)',pointerEvents:'none'}}/>
          <div style={{position:'relative'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,marginBottom:14}}>
              <div style={{width:28,height:28,background:'linear-gradient(135deg,#0D9488,#059669)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07"/></svg>
              </div>
              <span style={{fontWeight:800,fontSize:15,color:'#fff',letterSpacing:'-.01em'}}>Easy<span style={{color:'#2DD4BF'}}>Recommend</span></span>
            </div>
            <div style={{fontSize:12,fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',color:'#2DD4BF',marginBottom:10}}>Ready to start?</div>
            <h3 style={{fontSize:'clamp(20px,5vw,26px)',fontWeight:800,color:'#F8FAFC',lineHeight:1.2,letterSpacing:'-.02em',marginBottom:10}}>
              Turn word-of-mouth<br/>into a growth engine.
            </h3>
            <p style={{fontSize:13,color:'rgba(248,250,252,.6)',lineHeight:1.65,marginBottom:20}}>
              Set up a referral program in minutes. Reward people for spreading the word.
            </p>
            <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',marginBottom:12}}>
              <button onClick={onJoin} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'13px 24px',background:'linear-gradient(135deg,#0D9488,#059669)',border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:'0 4px 16px rgba(13,148,136,.35)'}}>
                Sign Up Free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button onClick={onJoin} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'12px 20px',background:'transparent',border:'1.5px solid rgba(255,255,255,.2)',borderRadius:10,color:'rgba(255,255,255,.8)',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                Join as a Business →
              </button>
            </div>
            <p style={{fontSize:11,color:'rgba(248,250,252,.35)'}}>Free to join · No hidden fees · Local currency payouts</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REFERRER PUBLIC PROFILE PAGE  (?r=CODE)
// ═══════════════════════════════════════════════════════════════════════════════
function ReferrerProfilePage({ refCode, onSignUp }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Inline auth state
  const [step,    setStep]    = useState('phone'); // 'phone' | 'otp' | 'done'
  const [cc,      setCc]      = useState(COUNTRIES[0]);
  const [ccOpen,  setCcOpen]  = useState(false);
  const [phone,   setPhone]   = useState('');
  const [otp,     setOtp]     = useState(['','','','','','']);
  const [authLoad,setAuthLoad]= useState(false);
  const [authErr, setAuthErr] = useState('');
  const [myCode,  setMyCode]  = useState(''); // personal referral code after auth
  const [myName,  setMyName]  = useState('');
  const [myToken, setMyToken] = useState('');
  const [nameStep,setNameStep]= useState(false); // if new user needs name
  const [nameVal, setNameVal] = useState('');
  const [copied,  setCopied]  = useState(false);

  const fullPhone = `${cc.code}${phone.replace(/\s/g,'')}`;

  useEffect(()=>{
    api(`/referrer/${refCode}`)
      .then(d=>setData(d))
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));

    // If already logged in, skip auth
    const a = getAuth();
    if(a?.token){
      api('/auth/me',{},a.token).then(d=>{
        if(d.user?.referralCode){ setMyCode(d.user.referralCode); setMyName(d.user.name||''); setMyToken(a.token); setStep('done'); }
      }).catch(()=>{});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

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
        // existing user — register with clinicId from refCode's clinic
        const reg=await api('/auth/register',{method:'POST',body:JSON.stringify({name:d.user.name,role:'patient',clinicId:data?.clinic?.id||undefined})},d.token);
        const auth={...reg,token:reg.token||d.token};
        saveAuth(auth);
        setMyCode(reg.user?.referralCode||d.user?.referralCode||'');
        setMyName(reg.user?.name||d.user?.name||'');
        setMyToken(reg.token||d.token);
        setStep('done');
      }
    }catch(e){setAuthErr(e.message);}finally{setAuthLoad(false);}
  };

  const saveName = async () => {
    if(!nameVal.trim()){setAuthErr('Enter your name');return;}
    setAuthLoad(true);setAuthErr('');
    try{
      const d=await api('/auth/register',{method:'POST',body:JSON.stringify({name:nameVal.trim(),role:'patient',clinicId:data?.clinic?.id||undefined})},myToken);
      const auth={...d,token:d.token||myToken};
      saveAuth(auth);
      setMyCode(d.user?.referralCode||'');
      setMyName(d.user?.name||nameVal.trim());
      setMyToken(d.token||myToken);
      setNameStep(false);
      setStep('done');
    }catch(e){setAuthErr(e.message);}finally{setAuthLoad(false);}
  };

  const handleOtpKey=(i,val)=>{
    if(!/^\d*$/.test(val))return;
    const n=[...otp];n[i]=val.slice(-1);setOtp(n);
    if(val&&i<5)document.getElementById(`ref-otp-${i+1}`)?.focus();
  };

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
  const waMsg = clinic?.phone ? encodeURIComponent(`Hi! I was referred by a friend and I'd like to get in touch.`) : '';
  const myShareLink = myCode ? `${APP_URL}?r=${myCode}` : '';
  const clinicName  = clinic?.name || 'this business';
  const rewardLine  = clinic?.patientReward
    ? `\n\nYou get: ${clinic.patientReward}.`
    : '';
  const myShareText = myCode
    ? `Hi! I'm ${myName} — I've been using ${clinicName} and they're great.\n\nIf you're looking for their services, I'd highly recommend them.${rewardLine}\n\nUse my referral link:\n${myShareLink}`
    : '';

  const WA_ICO = <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;

  return (
    <div style={{minHeight:'100vh',background:'#F7F9FC',fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif"}}>
      {/* Top bar */}
      <div style={{background:'#0D9488',padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontWeight:800,fontSize:16,color:'#fff',letterSpacing:'-.02em'}}>Easy<span style={{color:'#CCFBF1'}}>Recommend</span></span>
      </div>

      <div style={{maxWidth:480,margin:'0 auto',padding:'20px 20px 60px'}}>

        {/* Business card — compact */}
        <div className="au card" style={{marginBottom:14,overflow:'hidden'}}>
          <div style={{background:'linear-gradient(135deg,#0D9488,#059669)',padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:48,height:48,borderRadius:14,background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>🏢</div>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:'#fff',lineHeight:1.1}}>{clinic?.name || 'Business'}</div>
                {clinic?.doctorName && <div style={{fontSize:12,color:'rgba(255,255,255,.75)',marginTop:3}}>{clinic.doctorName}</div>}
              </div>
            </div>
          </div>
          {/* Contact */}
          {clinic?.phone && (
            <div style={{padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,borderBottom:'1px solid #F1F5F9'}}>
              <div style={{fontSize:13,color:'#64748B'}}>Contact the business</div>
              <div style={{display:'flex',gap:6}}>
                <a href={`https://wa.me/${clinic.phone.replace(/[^0-9]/g,'')}?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                  style={{display:'inline-flex',alignItems:'center',gap:5,padding:'7px 12px',background:'#25D366',borderRadius:8,color:'#fff',fontWeight:600,fontSize:12,textDecoration:'none'}}>
                  {WA_ICO} WhatsApp
                </a>
                <a href={`sms:${clinic.phone.replace(/[^0-9+]/g,'')}?body=${waMsg}`}
                  style={{display:'inline-flex',alignItems:'center',gap:5,padding:'7px 12px',background:'#334155',borderRadius:8,color:'#fff',fontWeight:600,fontSize:12,textDecoration:'none'}}>
                  💬 Text
                </a>
              </div>
            </div>
          )}
          {/* Discount */}
          {clinic?.patientReward && (
            <div style={{padding:'12px 16px',background:'#FFFBEB',borderBottom:'1px solid rgba(245,158,11,.15)'}}>
              <span style={{fontSize:11,fontWeight:700,color:'#F59E0B',textTransform:'uppercase',letterSpacing:'.06em'}}>🎟 Your offer: </span>
              <span style={{fontSize:13,fontWeight:700,color:'#0F172A'}}>{clinic.patientReward}</span>
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

        {/* ── INLINE AUTH + SHARE ── */}
        <div className="au1 card" style={{overflow:'hidden'}}>

          <div style={{padding:'16px 18px'}}>
            {authErr && <div style={{fontSize:12,color:'#EF4444',marginBottom:10,padding:'8px 10px',background:'#FEF2F2',borderRadius:6}}>⚠ {authErr}</div>}

            {/* STEP: phone */}
            {step==='phone' && !nameStep && (
              <>
                <div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:4}}>Get your personal referral link</div>
                <p style={{fontSize:12,color:'#64748B',marginBottom:12}}>Enter your number to generate your link and start sharing</p>
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

            {/* STEP: otp */}
            {step==='otp' && !nameStep && (
              <>
                <div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:4}}>Enter the code</div>
                <p style={{fontSize:12,color:'#64748B',marginBottom:12}}>Sent to {fullPhone}</p>
                <div className="otp-wrap" style={{marginBottom:12}}>
                  {otp.map((v,i)=>(
                    <input key={i} id={`ref-otp-${i}`} className="otp-input" maxLength={1} value={v} inputMode="numeric"
                      onChange={e=>handleOtpKey(i,e.target.value)}
                      onKeyDown={e=>{if(e.key==='Backspace'&&!v&&i>0)document.getElementById(`ref-otp-${i-1}`)?.focus();}}/>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={verifyOtp} disabled={authLoad} style={{fontSize:14,marginBottom:8}}>
                  {authLoad?<><Spin sm white/> Verifying…</>:'Continue →'}
                </button>
                <button className="btn btn-secondary" style={{fontSize:13}} onClick={()=>{setStep('phone');setOtp(['','','','','','']);setAuthErr('')}}>← Change number</button>
              </>
            )}

            {/* STEP: name (new user) */}
            {nameStep && (
              <>
                <div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:4}}>One last thing</div>
                <p style={{fontSize:12,color:'#64748B',marginBottom:12}}>Your name so the business knows who referred them</p>
                <input className="fi" placeholder="Your name" value={nameVal} onChange={e=>{setNameVal(e.target.value);setAuthErr('');}} style={{marginBottom:10}} autoFocus/>
                <button className="btn btn-primary" onClick={saveName} disabled={authLoad} style={{fontSize:14}}>
                  {authLoad?<><Spin sm white/> Saving…</>:'Get my link →'}
                </button>
              </>
            )}

            {/* STEP: done — show share options */}
            {step==='done' && myCode && (
              <>
                <div style={{fontSize:14,fontWeight:700,color:'#0D9488',marginBottom:4}}>✅ Your referral link is ready!</div>
                <div style={{background:'#F7F9FC',border:'1px solid #E8EDF5',borderRadius:8,padding:'10px 12px',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                  <code style={{flex:1,fontSize:12,color:'#0F172A',wordBreak:'break-all',fontFamily:'monospace'}}>{myShareLink}</code>
                  <CopyBtn text={myShareLink} label="Copy"/>
                </div>

                {/* Editable message */}
                <ShareMessageCard shareText={myShareText} shareUrl={myShareLink} token={myToken} compact/>
              </>
            )}
          </div>
        </div>

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
  const [clinicIdParam] = useState(()=>new URLSearchParams(window.location.search).get('b'));
  const [refCodeParam]  = useState(()=>new URLSearchParams(window.location.search).get('r'));

  useEffect(()=>{
    const a=getAuth();
    if(a?.token){
      api('/auth/me',{},a.token)
        .then(d=>{const next={...a,user:d.user};saveAuth(next);setAuthData(next);setScreen('app');})
        .catch(()=>{clearAuth();setAuthData(null);setScreen(refCodeParam?'ref':clinicIdParam?'clinic':'landing');})
        .finally(()=>setChecking(false));
    }else{
      setChecking(false);
      if (refCodeParam)       setScreen('ref');
      else if (clinicIdParam) setScreen('clinic');
      else setScreen('landing');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const handleLogin=d=>{saveAuth(d);setAuthData(d);setScreen('app');};
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
      {screen==='landing' && <LandingPage onGetStarted={()=>setScreen('login')}/>}
      {screen==='ref'     && <ReferrerProfilePage refCode={refCodeParam} onSignUp={()=>setScreen('login')}/>}
      {screen==='clinic'  && <ClinicProfilePage clinicId={clinicIdParam} onJoin={()=>setScreen('login')}/>}
      {screen==='login'   && <LoginScreen onLogin={handleLogin} clinicId={clinicIdParam}/>}
      {screen==='app' && user?.role==='patient' && <PatientDashboard  user={user} token={token} onSignOut={handleSignOut}/>}
      {screen==='app' && user?.role==='doctor'  && <DoctorDashboard   user={user} token={token} onSignOut={handleSignOut}/>}
      {screen==='app' && user?.role==='admin'   && <AdminDashboard    user={user} token={token} onSignOut={handleSignOut}/>}
    </>
  );
}