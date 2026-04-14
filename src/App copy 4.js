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

function fixUrl(raw) {
  if (!raw?.trim()) return '';
  return /^https?:\/\//i.test(raw.trim()) ? raw.trim() : 'https://' + raw.trim();
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  white:   '#FFFFFF',
  cream:   '#FAFAF7',
  fog:     '#F4F3EE',
  mist:    '#ECEAE3',
  stone:   '#D8D5CC',
  pebble:  '#B4B0A6',
  ash:     '#7A7770',
  slate:   '#4A4845',
  ink:     '#1A1916',
  black:   '#0D0C0A',
  // Accent is pure black with subtle sheen
  accent:  '#0D0C0A',
  // Status
  emerald: '#166534',
  emeraldBg:'#F0FDF4',
  emeraldBorder:'#BBF7D0',
  crimson: '#991B1B',
  crimsonBg:'#FEF2F2',
  crimsonBorder:'#FECACA',
};

const F = {
  display: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
  body:    "'Outfit', 'DM Sans', system-ui, sans-serif",
  mono:    "'JetBrains Mono', 'Fira Code', monospace",
};

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Outfit:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }

body {
  background: ${T.cream};
  font-family: ${F.body};
  color: ${T.ink};
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

::selection { background: ${T.ink}; color: ${T.white}; }
::placeholder { color: ${T.stone} !important; }
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: ${T.cream}; }
::-webkit-scrollbar-thumb { background: ${T.stone}; border-radius: 2px; }

/* ── Animations ── */
@keyframes spin     { to { transform: rotate(360deg); } }
@keyframes ticker   { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes fadeUp   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
@keyframes slideUp  { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
@keyframes scaleIn  { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:scale(1); } }
@keyframes pulse    { 0%,100% { opacity:.5; transform:scale(1); } 50% { opacity:1; transform:scale(1.15); } }
@keyframes shimmer  {
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
}

.aFadeUp  { animation: fadeUp  .6s cubic-bezier(.16,1,.3,1) both; }
.aFadeUp1 { animation: fadeUp  .6s .08s cubic-bezier(.16,1,.3,1) both; }
.aFadeUp2 { animation: fadeUp  .6s .16s cubic-bezier(.16,1,.3,1) both; }
.aFadeUp3 { animation: fadeUp  .6s .24s cubic-bezier(.16,1,.3,1) both; }
.aFadeUp4 { animation: fadeUp  .6s .32s cubic-bezier(.16,1,.3,1) both; }
.aFadeUp5 { animation: fadeUp  .6s .40s cubic-bezier(.16,1,.3,1) both; }
.aSlideUp { animation: slideUp .5s cubic-bezier(.16,1,.3,1) both; }
.aScaleIn { animation: scaleIn .35s cubic-bezier(.16,1,.3,1) both; }

/* ── Ticker bar ── */
.ticker-wrap {
  overflow: hidden; white-space: nowrap;
  background: ${T.black}; padding: 10px 0;
}
.ticker-track { display: inline-flex; animation: ticker 28s linear infinite; }
.ticker-item {
  display: inline-flex; align-items: center; gap: 14px;
  padding: 0 24px; font-size: 10px; font-weight: 600;
  color: rgba(255,255,255,.45); letter-spacing: .12em; text-transform: uppercase;
}
.ticker-star { color: rgba(255,255,255,.2); font-size: 9px; }

/* ── Nav ── */
.nav {
  position: sticky; top: 0; z-index: 200;
  background: rgba(250,250,247,.96); backdrop-filter: blur(16px) saturate(1.2);
  border-bottom: 1px solid ${T.mist};
  height: 56px; display: flex; align-items: center;
}
.nav-inner {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; max-width: 1100px; margin: 0 auto; padding: 0 32px;
}
.nav-logo {
  font-family: ${F.display}; font-size: 22px; font-weight: 300; color: ${T.ink};
  letter-spacing: -.02em; cursor: pointer; background: none; border: none;
  text-decoration: none; display: flex; align-items: baseline; gap: 0;
}
.nav-logo em { font-style: italic; }
.nav-logo strong { font-weight: 600; }

.nav-live {
  display: flex; align-items: center; gap: 5px; padding: 4px 10px;
  background: ${T.emeraldBg}; border: 1px solid ${T.emeraldBorder}; border-radius: 100px;
  font-size: 10px; font-weight: 600; color: ${T.emerald}; letter-spacing: .06em;
}
.nav-live-dot {
  width: 5px; height: 5px; border-radius: 50%; background: ${T.emerald};
  animation: pulse 2.2s ease-in-out infinite;
}

/* ── Pill badge ── */
.pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 100px;
  font-size: 11px; font-weight: 600; letter-spacing: .03em;
  border: 1px solid ${T.mist}; background: ${T.white}; color: ${T.ash};
  transition: all .15s;
}
.pill:hover { border-color: ${T.ink}; color: ${T.ink}; background: ${T.fog}; }

/* ── Buttons ── */
.btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 9px;
  width: 100%; padding: 15px 28px;
  background: ${T.black}; border: none; border-radius: 6px;
  color: ${T.white}; font-family: ${F.body}; font-size: 15px; font-weight: 600;
  letter-spacing: -.01em; cursor: pointer;
  transition: background .15s, transform .15s, box-shadow .15s;
  box-shadow: 0 1px 2px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.08);
  -webkit-tap-highlight-color: transparent;
}
.btn-primary:hover:not(:disabled) {
  background: ${T.ink}; transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(13,12,10,.22), inset 0 1px 0 rgba(255,255,255,.08);
}
.btn-primary:active:not(:disabled) { transform: translateY(0); }
.btn-primary:disabled { background: ${T.stone}; color: ${T.pebble}; cursor: not-allowed; box-shadow: none; }

.btn-secondary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 14px 24px;
  background: transparent; border: 1.5px solid ${T.mist}; border-radius: 6px;
  color: ${T.slate}; font-family: ${F.body}; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all .15s; -webkit-tap-highlight-color: transparent;
}
.btn-secondary:hover { border-color: ${T.ink}; color: ${T.ink}; background: ${T.fog}; }

.btn-ghost {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px;
  background: transparent; border: 1.5px solid ${T.mist}; border-radius: 6px;
  color: ${T.ash}; font-family: ${F.body}; font-size: 12px; font-weight: 500;
  cursor: pointer; text-decoration: none; transition: all .15s; white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}
.btn-ghost:hover { border-color: ${T.ink}; color: ${T.ink}; background: ${T.fog}; }

/* ── Inputs ── */
.fi {
  width: 100%; padding: 12px 14px;
  background: ${T.white}; border: 1.5px solid ${T.mist}; border-radius: 6px;
  font-size: 14px; color: ${T.ink}; font-family: ${F.body};
  transition: border-color .15s, box-shadow .15s;
  outline: none; -webkit-appearance: none;
}
.fi:focus { border-color: ${T.ink}; box-shadow: 0 0 0 3px rgba(13,12,10,.06); }
.fi.err   { border-color: ${T.crimson}; box-shadow: 0 0 0 3px rgba(153,27,27,.06); }

.fta {
  width: 100%; padding: 12px 14px;
  background: ${T.white}; border: 1.5px solid ${T.mist}; border-radius: 6px;
  font-size: 14px; color: ${T.ink}; font-family: ${F.body};
  transition: border-color .15s; outline: none; resize: vertical;
  min-height: 90px; line-height: 1.65; -webkit-appearance: none;
}
.fta:focus { border-color: ${T.ink}; box-shadow: 0 0 0 3px rgba(13,12,10,.06); }

/* ── Gift amount ── */
.gift-row {
  display: flex; align-items: center; gap: 10px;
  margin-top: 10px; padding: 11px 14px;
  background: ${T.fog}; border: 1px solid ${T.mist}; border-radius: 6px;
  animation: fadeUp .3s ease both;
}
.gift-row label { font-size: 12px; color: ${T.ash}; white-space: nowrap; font-weight: 500; }
.gift-input {
  flex: 1; padding: 7px 10px;
  background: ${T.white}; border: 1.5px solid ${T.mist}; border-radius: 5px;
  font-size: 14px; color: ${T.ink}; font-family: ${F.body}; outline: none;
  transition: border-color .15s;
}
.gift-input:focus { border-color: ${T.ink}; }

/* ── Checkbox pills ── */
.cp {
  display: inline-flex; align-items: center; gap: 7px; padding: 8px 13px;
  background: ${T.white}; border: 1.5px solid ${T.mist}; border-radius: 6px;
  cursor: pointer; font-size: 13px; font-weight: 400; color: ${T.slate};
  transition: all .15s; user-select: none; -webkit-tap-highlight-color: transparent;
}
.cp:hover  { border-color: ${T.ink}; color: ${T.ink}; }
.cp.on     { border-color: ${T.ink}; background: ${T.ink}; color: ${T.white}; }
.cp input  { display: none; }
.cp-dot    {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
  border: 1.5px solid ${T.stone}; transition: all .15s;
}
.cp.on .cp-dot { background: rgba(255,255,255,.8); border-color: rgba(255,255,255,.4); }

/* ── Field label / group ── */
.fl {
  font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase;
  color: ${T.pebble}; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;
}
.fl-req   { color: ${T.ink}; font-size: 12px; line-height: 1; }
.fl-opt   {
  font-size: 8px; font-weight: 600; color: ${T.stone}; letter-spacing: .06em;
  background: ${T.fog}; border: 1px solid ${T.mist}; border-radius: 3px; padding: 2px 5px;
  text-transform: uppercase;
}
.field-err { font-size: 11.5px; color: ${T.crimson}; margin-top: 5px; display: flex; align-items: center; gap: 4px; }

/* ── Banners ── */
.banner-err {
  padding: 12px 16px; background: ${T.crimsonBg}; border: 1px solid ${T.crimsonBorder};
  border-radius: 8px; font-size: 13.5px; color: ${T.crimson}; font-weight: 500;
  margin-bottom: 18px; display: flex; gap: 10px; align-items: flex-start; line-height: 1.5;
}
.banner-ok {
  padding: 12px 16px; background: ${T.emeraldBg}; border: 1px solid ${T.emeraldBorder};
  border-radius: 8px; font-size: 13.5px; color: ${T.emerald}; font-weight: 500;
  margin-bottom: 18px; display: flex; gap: 10px; align-items: flex-start; line-height: 1.5;
}

/* ── Card ── */
.card {
  background: ${T.white}; border: 1px solid ${T.mist}; border-radius: 10px;
  overflow: hidden; margin-bottom: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 0 0 0 transparent;
  transition: border-color .2s, box-shadow .2s;
}
.card:hover { border-color: ${T.stone}; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
.card-head {
  padding: 13px 18px; border-bottom: 1px solid ${T.mist};
  display: flex; align-items: center; gap: 10px; background: ${T.fog};
}
.card-icon {
  width: 26px; height: 26px; border-radius: 6px; background: ${T.white};
  border: 1px solid ${T.mist}; display: flex; align-items: center;
  justify-content: center; font-size: 11px; flex-shrink: 0;
}
.card-title  { font-size: 13px; font-weight: 600; color: ${T.ink}; }
.card-sub    { font-size: 11px; color: ${T.pebble}; margin-top: 1px; }
.card-body   { padding: 18px; }

/* ── Copy button ── */
.copy-btn {
  padding: 7px 11px;
  background: ${T.fog}; border: 1px solid ${T.mist}; border-radius: 5px;
  color: ${T.ash}; font-family: ${F.body}; font-size: 10px; font-weight: 600;
  cursor: pointer; transition: all .15s; letter-spacing: .06em; white-space: nowrap;
}
.copy-btn:hover  { border-color: ${T.ink}; color: ${T.ink}; }
.copy-btn.copied { border-color: ${T.emerald}; color: ${T.emerald}; background: ${T.emeraldBg}; }

/* ── Share textarea ── */
.share-ta {
  width: 100%; padding: 12px 14px;
  background: ${T.fog}; border: 1.5px solid ${T.mist}; border-radius: 6px;
  font-family: ${F.body}; font-size: 13px; color: ${T.slate}; line-height: 1.7;
  resize: none; outline: none; transition: border-color .15s;
}
.share-ta:focus { border-color: ${T.ink}; background: ${T.white}; }

/* ── Share buttons ── */
.sh-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  flex: 1; min-width: 0; padding: 10px 8px; border: none; border-radius: 6px;
  font-family: ${F.body}; font-size: 12px; font-weight: 600; cursor: pointer;
  text-decoration: none; transition: all .15s; white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}
.sh-li { background: #0A66C2; color: #fff; }
.sh-li:hover { background: #0958a8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(10,102,194,.3); }
.sh-wa { background: #25D366; color: #fff; }
.sh-wa:hover { background: #1db954; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,211,102,.3); }
.sh-tw { background: ${T.fog}; color: ${T.ink}; border: 1.5px solid ${T.mist}; }
.sh-tw:hover { background: ${T.mist}; transform: translateY(-1px); }
.sh-ig { background: linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); color:#fff; }
.sh-ig:hover { opacity:.9; transform:translateY(-1px); box-shadow:0 4px 12px rgba(220,39,67,.3); }
.sh-sms { background: ${T.fog}; color: ${T.ink}; border: 1.5px solid ${T.mist}; }
.sh-sms:hover { background: ${T.mist}; transform: translateY(-1px); }

/* ── Stats strip ── */
.stat-strip {
  display: flex; border: 1px solid ${T.mist}; border-radius: 10px;
  overflow: hidden; background: ${T.white};
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
}
.stat-item { flex: 1; padding: 20px 16px; text-align: center; border-right: 1px solid ${T.mist}; }
.stat-item:last-child { border-right: none; }
.stat-num  { font-family: ${F.display}; font-size: 36px; font-weight: 300; font-style: italic; color: ${T.ink}; line-height: 1; margin-bottom: 5px; }
.stat-lbl  { font-size: 9px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: ${T.pebble}; }

/* ── Dashboard tab buttons ── */
.tab-btn {
  padding: 8px 16px; background: transparent; border: none; border-radius: 6px;
  font-family: ${F.body}; font-size: 13px; font-weight: 500; color: ${T.pebble};
  cursor: pointer; transition: all .15s; white-space: nowrap;
}
.tab-btn:hover:not(.active) { color: ${T.slate}; }
.tab-btn.active { background: ${T.ink}; color: ${T.white}; font-weight: 600; }

/* ── Sharer row ── */
.sharer-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 0; border-bottom: 1px solid ${T.fog}; gap: 10px; flex-wrap: wrap;
}
.sharer-row:last-child { border-bottom: none; }

/* ── Reward badge (public) ── */
.reward-badge {
  display: inline-flex; align-items: center;
  padding: 9px 16px; border-radius: 6px;
  background: ${T.ink}; color: ${T.white}; font-size: 13px; font-weight: 500;
}

/* ── Section eyebrow ── */
.eyebrow {
  font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
  color: ${T.pebble}; display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
}
.eyebrow::after { content:''; flex:1; height:1px; background:${T.mist}; }

/* ── Hero decorations ── */
.hero-number {
  font-family: ${F.display}; font-size: 11px; font-weight: 300; font-style: italic;
  color: ${T.stone}; letter-spacing: .06em;
}

/* ── Modal overlay ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(250,250,247,.88); backdrop-filter: blur(10px) saturate(1.3);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-box {
  background: ${T.white}; border: 1px solid ${T.mist}; border-radius: 14px;
  padding: 36px; width: 100%; max-width: 400px; position: relative;
  box-shadow: 0 8px 48px rgba(13,12,10,.14), 0 2px 8px rgba(13,12,10,.06);
  animation: scaleIn .3s cubic-bezier(.16,1,.3,1) both;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .hero-title    { font-size: clamp(52px, 14vw, 86px) !important; }
  .hero-pad      { padding: 52px 20px 0 !important; }
  .page-pad      { padding: 32px 20px 80px !important; }
  .form-pad      { padding: 0 20px 80px !important; }
  .nav-inner     { padding: 0 20px !important; }
  .stat-strip    { flex-wrap: wrap; }
  .stat-item     { flex: 1 1 50%; border-bottom: 1px solid ${T.mist}; }
  .stat-item:nth-child(2) { border-right: none; }
  .stat-item:nth-child(3),
  .stat-item:nth-child(4) { border-bottom: none; }
  .share-grid    { grid-template-columns: 1fr 1fr !important; }
  .tab-scroll    { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .tabs-row      { min-width: max-content; }
  .hero-cta-row  { flex-direction: column !important; }
  .hero-cta-row button,
  .hero-cta-row a { width: 100% !important; }
  .steps-row     { grid-template-columns: 1fr !important; }
  .testimonials  { grid-template-columns: 1fr !important; }
  .sharer-code   { display: none !important; }
  .modal-box     { padding: 28px 22px !important; }
  .dash-header   { flex-direction: column !important; align-items: flex-start !important; }
}
@media (max-width: 420px) {
  .share-grid { grid-template-columns: 1fr !important; }
}
`;

// ─── Micro helpers ────────────────────────────────────────────────────────────
function Spinner() {
  return <div style={{width:14,height:14,border:`2px solid rgba(255,255,255,.25)`,borderTop:'2px solid rgba(255,255,255,.9)',borderRadius:'50%',animation:'spin .7s linear infinite',flexShrink:0}}/>;
}
function SpinnerDark() {
  return <div style={{width:14,height:14,border:`2px solid ${T.mist}`,borderTop:`2px solid ${T.ink}`,borderRadius:'50%',animation:'spin .7s linear infinite',flexShrink:0}}/>;
}

function FL({ req, opt, children }) {
  return (
    <div className="fl">
      {children}
      {req && <span className="fl-req">*</span>}
      {opt && <span className="fl-opt">optional</span>}
    </div>
  );
}
function FG({ label, req, opt, err, children }) {
  return (
    <div style={{marginBottom:16}}>
      <FL req={req} opt={opt}>{label}</FL>
      {children}
      {err && <div className="field-err">⚠ {err}</div>}
    </div>
  );
}
function ErrBanner({msg})  { return msg ? <div className="banner-err"><span>⚠</span><span>{msg}</span></div> : null; }
function OkBanner({msg})   { return msg ? <div className="banner-ok"><span>✓</span><span>{msg}</span></div>  : null; }

function CopyBtn({ text }) {
  const [s,set] = useState('COPY');
  return (
    <button className={`copy-btn${s!=='COPY'?' copied':''}`}
      onClick={()=>{navigator.clipboard.writeText(text);set('COPIED!');setTimeout(()=>set('COPY'),2200)}}>
      {s}
    </button>
  );
}

function Card({ head, icon, title, sub, pad=true, dark, children }) {
  return (
    <div className="card" style={dark?{borderColor:T.ink}:{}}>
      {(head||icon||title) && (
        <div className="card-head" style={{...(dark?{background:T.ink,borderColor:'rgba(255,255,255,.08)'}:{}), justifyContent:'flex-start'}}>
          {icon && <div className="card-icon" style={dark?{background:'rgba(255,255,255,.08)',borderColor:'rgba(255,255,255,.12)',color:T.white}:{}}>{icon}</div>}
          <div style={{flex:1,minWidth:0}}>
            <div className="card-title" style={dark?{color:T.white}:{}}>{title}</div>
            {sub && <div className="card-sub" style={dark?{color:'rgba(255,255,255,.45)'}:{}}>{sub}</div>}
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
        <label key={opt} className={`cp${selected.includes(opt)?' on':''}`}>
          <input type="checkbox" name={name} value={opt} checked={selected.includes(opt)} onChange={onChange}/>
          <span className="cp-dot"/>
          {opt}
        </label>
      ))}
    </div>
  );
}

function GiftRow({ reward, value, onChange }) {
  return (
    <div className="gift-row">
      <label>{reward}</label>
      <span style={{fontWeight:600,color:T.ash,fontSize:13}}>$</span>
      <input className="gift-input" type="number" min="1" max="9999" placeholder="50" value={value} onChange={e=>onChange(e.target.value)}/>
      <span style={{fontSize:11,color:T.stone}}>USD</span>
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

function buildShareText(prog, name, link, isFounder=false) {
  const co = prog?.companyName||'my company';
  const rw = prog?.rewards?.length ? prog.rewards.join(' or ') : 'exclusive rewards';
  const ds = prog?.description||'';
  if (isFounder) return (
    `Hey 👋 I'm ${name||'the founder'} of ${co}.\n\n`+
    (ds?`${ds}\n\n`:'')+
    `We're building for ${prog?.audience?.join(' & ')||'teams like yours'}.\n\n`+
    `If anyone signs up through your link, I'll personally send you ${rw} 🙌\n\n→ ${link}`
  );
  return (
    `Just discovered ${co} — thought you'd love it!\n\n`+
    (ds?`${ds}\n\n`:'')+
    (prog?.audience?.length?`Perfect for ${prog.audience.join(' or ')}.\n\n`:'')+
    `Sign up via my referral link & earn: ${prog?.rewards?.join(', ')||'exclusive rewards'}.\n\n`+
    `${name?`Referred by ${name}.\n\n`:''}→ ${link}`
  );
}

function getShareLink(raw) {
  if (!raw) return '';
  try { return `${window.location.origin}${new URL(raw).pathname}`; }
  catch { return `${window.location.origin}${raw}`; }
}

// ─── Share actions panel ──────────────────────────────────────────────────────
function ShareActions({ link, shareText, programName }) {
  const enc    = encodeURIComponent;
  const liUrl  = `https://www.linkedin.com/sharing/share-offsite/?url=${enc(link)}`;
  const waUrl  = `https://wa.me/?text=${enc(shareText)}`;
  const twUrl  = `https://twitter.com/intent/tweet?text=${enc(shareText)}`;
  const smsUrl = `sms:?body=${enc(shareText)}`;
  const mailUrl= `mailto:?subject=${enc(`Check out ${programName||'this'}`)}&body=${enc(shareText)}`;
  const [igNote, setIgNote] = useState(false);

  return (
    <div>
      {/* Link row */}
      <FL>Your referral link</FL>
      <div style={{display:'flex',alignItems:'center',gap:9,background:T.fog,border:`1.5px solid ${T.mist}`,borderRadius:7,padding:'10px 13px',marginBottom:14}}>
        <code style={{flex:1,fontSize:11.5,color:T.ink,fontFamily:F.mono,wordBreak:'break-all',lineHeight:1.5,fontWeight:500}}>{link}</code>
        <CopyBtn text={link}/>
      </div>

      {/* Message box */}
      <FL>
        Suggested message
        <span style={{fontSize:10,color:T.stone,fontWeight:400,letterSpacing:0,textTransform:'none'}}>— click to select all</span>
      </FL>
      <div style={{position:'relative',marginBottom:14}}>
        <textarea className="share-ta" rows={5} defaultValue={shareText} onClick={e=>e.target.select()}/>
        <div style={{position:'absolute',top:9,right:9}}><CopyBtn text={shareText}/></div>
      </div>

      {/* Platform buttons */}
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
      {igNote && (
        <div style={{padding:'9px 13px',background:T.fog,border:`1px solid ${T.mist}`,borderRadius:6,fontSize:12,color:T.slate,lineHeight:1.5,animation:'fadeUp .3s ease'}}>
          ✓ Copied — open Instagram Stories and paste as text or add a link sticker.
        </div>
      )}
    </div>
  );
}

// ─── Landing hero ─────────────────────────────────────────────────────────────
function Hero({ onCreate, onSignIn }) {
  return (
    <>
      {/* Black ticker */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {[...TICKER_ITEMS,...TICKER_ITEMS].map((t,i)=>(
            <span key={i} className="ticker-item"><span className="ticker-star">✦</span>{t}</span>
          ))}
        </div>
      </div>

      <div className="hero-pad" style={{maxWidth:900,margin:'0 auto',padding:'80px 40px 0'}}>

        {/* Eyebrow */}
        <div className="aFadeUp" style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
          <div style={{width:32,height:1.5,background:T.ink}}/>
          <span style={{fontSize:10,fontWeight:600,letterSpacing:'.16em',textTransform:'uppercase',color:T.ash}}>
            Referral infrastructure · Founders
          </span>
        </div>

        {/* Headline — giant editorial serif */}
        <h1 className="aFadeUp1 hero-title" style={{
          fontFamily: F.display,
          fontSize: 'clamp(64px, 10vw, 100px)',
          fontWeight: 300,
          lineHeight: .91,
          letterSpacing: '-.03em',
          color: T.ink,
          marginBottom: 36,
        }}>
          The real word of mouth <br/>
          marketing<br/>
          <em style={{fontStyle:'italic',fontWeight:300}}></em>
        </h1>

        {/* Sub */}
        <p className="aFadeUp2" style={{fontSize:17,color:T.ash,lineHeight:1.75,maxWidth:460,marginBottom:44,fontWeight:300}}>
          A viral referral program, live in 3 minutes.<br/>No code. No friction. Pure word-of-mouth.
        </p>

        {/* CTAs */}
        <div className="aFadeUp3 hero-cta-row" style={{display:'flex',alignItems:'center',gap:10,marginBottom:80,flexWrap:'wrap'}}>
          <button onClick={onCreate} className="btn-primary" style={{width:'auto',padding:'13px 28px',fontSize:14,borderRadius:6}}>
            Create your program
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button onClick={onSignIn} className="btn-secondary" style={{width:'auto',padding:'12px 22px',fontSize:13}}>
            Sign in to dashboard →
          </button>
        </div>

        {/* Stats strip */}
        <div className="aFadeUp4 stat-strip" style={{marginBottom:88}}>
          {[
            {num:'3 min',  lbl:'average setup'},
            {num:'∞',      lbl:'viral chains'},
            {num:'0',      lbl:'lines of code'},
            {num:'24/7',   lbl:'link uptime'},
          ].map((s,i)=>(
            <div key={i} className="stat-item">
              <div className="stat-num">{s.num}</div>
              <div className="stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div style={{marginBottom:88}}>
          <div className="eyebrow">How it works</div>
          <div className="steps-row" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}>
            {[
              {n:'01',title:'Create',    body:'Fill in your company, pick a reward, done. Under 3 minutes.'},
              {n:'02',title:'Share',     body:'Post your link on LinkedIn, WhatsApp, email — anywhere your people are.'},
              {n:'03',title:'Go viral',  body:'Every visitor gets their own link. They share, you grow, everyone wins.'},
            ].map((s,i)=>(
              <div key={i} style={{paddingTop:20,borderTop:`1.5px solid ${T.mist}`}}>
                <div style={{fontFamily:F.display,fontStyle:'italic',fontSize:42,fontWeight:300,color:T.stone,lineHeight:1,marginBottom:14}}>{s.n}</div>
                <div style={{fontSize:15,fontWeight:600,color:T.ink,marginBottom:8,letterSpacing:'-.01em'}}>{s.title}</div>
                <div style={{fontSize:13,color:T.ash,lineHeight:1.7,fontWeight:300}}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div style={{marginBottom:88}}>
          <div className="eyebrow">What founders say</div>
          <div className="testimonials" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
            {[
              {q:'"12 warm leads from one LinkedIn post. Zero code."',          n:'Priya K.',  r:'Solo founder, B2B SaaS'},
              {q:'"My users sell for me now. Best $0 hire I ever made."',        n:'Marcus T.', r:'CEO, early-stage startup'},
              {q:'"Set it up on a train ride. Had a referral before arrival."',  n:'Sophie L.', r:'Indie hacker'},
            ].map((t,i)=>(
              <div key={i} style={{background:T.white,border:`1px solid ${T.mist}`,borderRadius:10,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
                <div style={{fontSize:15,color:T.slate,lineHeight:1.7,marginBottom:16,fontStyle:'italic',fontFamily:F.display,fontWeight:300}}>
                  {t.q}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:9}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:T.ink,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:T.white,flexShrink:0}}>{t.n[0]}</div>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:T.ink}}>{t.n}</div>
                    <div style={{fontSize:10,color:T.pebble,marginTop:1}}>{t.r}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider before form */}
        <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:52}}>
          <div style={{flex:1,height:1.5,background:T.ink}}/>
          <div style={{padding:'8px 20px',background:T.ink,color:T.white,fontSize:10,fontWeight:600,letterSpacing:'.12em',textTransform:'uppercase'}}>
            Create your program
          </div>
          <div style={{flex:1,height:1.5,background:T.ink}}/>
        </div>
      </div>
    </>
  );
}

// ─── Sign-in modal ────────────────────────────────────────────────────────────
function SignInModal({ onClose, onSuccess }) {
  const [email,setEmail]       = useState('');
  const [password,setPassword] = useState('');
  const [loading,setLoad]      = useState(false);
  const [error,setError]       = useState('');

  const submit = async e => {
    e.preventDefault(); setLoad(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Login failed');
      onSuccess(d);
    } catch(e) { setError(e.message); }
    finally { setLoad(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{position:'absolute',top:16,right:18,background:'none',border:'none',color:T.pebble,cursor:'pointer',fontSize:18,lineHeight:1,padding:4}}>✕</button>

        <div style={{fontFamily:F.display,fontSize:30,fontWeight:300,fontStyle:'italic',color:T.ink,marginBottom:4,lineHeight:1.1}}>
          Welcome back.
        </div>
        <p style={{fontSize:13,color:T.pebble,marginBottom:28,fontWeight:300}}>Sign in to view your dashboard & live stats.</p>

        <ErrBanner msg={error}/>
        <form onSubmit={submit}>
          <FG label="Email" req>
            <input className="fi" type="email" placeholder="you@company.com" value={email} onChange={e=>{setEmail(e.target.value);setError('')}} required autoFocus/>
          </FG>
          <FG label="Password" req>
            <input className="fi" type="password" placeholder="Your password" value={password} onChange={e=>{setPassword(e.target.value);setError('')}} required/>
          </FG>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading?<><Spinner/> Signing in…</>:<>Sign in →</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Parse gift-card amounts from a stored reward string ─────────────────────
// "Amazon Gift Card ($50)" → { baseReward: "Amazon Gift Card", amount: "50" }
function parseGiftCardReward(r) {
  const match = r.match(/^(.+?)\s*\(\$(\d+)\)$/);
  if (match && GIFT_CARD_REWARDS.includes(match[1])) return { base: match[1], amt: match[2] };
  return null;
}

// Convert saved rewards array to { selected[], gcAmounts{} }
function expandRewards(rewards = []) {
  const selected = [];
  const gcAmounts = {};
  for (const r of rewards) {
    const parsed = parseGiftCardReward(r);
    if (parsed) { selected.push(parsed.base); gcAmounts[parsed.base] = parsed.amt; }
    else selected.push(r);
  }
  return { selected, gcAmounts };
}

// ─── Edit panel (used in both Dashboard and homepage prefill) ─────────────────
function EditForm({ initial, auth, onSaved }) {
  const { selected: initSelected, gcAmounts: initGc } = expandRewards(initial.rewards);

  const [form, setForm] = useState({
    username:     initial.username     || '',
    companyName:  initial.companyName  || '',
    description:  initial.description  || '',
    website:      (initial.website||'').replace(/^https?:\/\//,''),
    rewards:      initSelected,
    audience:     initial.audience     || [],
    contactEmail: initial.contactEmail || '',
    calendlyLink: (initial.calendlyLink||'').replace(/^https?:\/\//,''),
  });
  const [gcAmt, setGcAmt]   = useState(initGc);
  const [saving, setSaving] = useState(false);
  const [fErr,  setFErr]    = useState({});
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  const handleChange = e => {
    const {name,value,checked} = e.target;
    if (name==='rewards')       setForm(p=>({...p,rewards: checked?[...p.rewards,value]:p.rewards.filter(r=>r!==value)}));
    else if (name==='audience') setForm(p=>({...p,audience:checked?[...p.audience,value]:p.audience.filter(a=>a!==value)}));
    else                        setForm(p=>({...p,[name]:value}));
    if (fErr[name]) setFErr(p=>({...p,[name]:''}));
    setError(''); setSaved(false);
  };

  const finalRewards = () => form.rewards.map(r =>
    GIFT_CARD_REWARDS.includes(r) && gcAmt[r] ? `${r} ($${gcAmt[r]})` : r
  );

  const validate = () => {
    const e = {};
    if (!form.username.trim())    e.username    = 'Username required';
    if (!form.companyName.trim()) e.companyName = 'Company name required';
    if (!form.description.trim()) e.description = 'Description required';
    if (!form.rewards.length)     e.rewards     = 'Pick at least one reward';
    for (const r of form.rewards)
      if (GIFT_CARD_REWARDS.includes(r) && !gcAmt[r]) e[`gc_${r}`] = `Amount required for ${r}`;
    setFErr(e);
    return !Object.keys(e).length;
  };

  const save = async e => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); setError(''); setSaved(false);
    try {
      const payload = {
        ...form,
        website:      fixUrl(form.website),
        calendlyLink: fixUrl(form.calendlyLink),
        rewards:      finalRewards(),
      };
      const r = await fetch(`${API_BASE}/dashboard/${auth.referralCode}?token=${auth.token}`, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to save');
      setSaved(true);
      if (onSaved) onSaved(payload);
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} noValidate>
      <ErrBanner msg={error}/>
      {saved && <OkBanner msg="Changes saved successfully!"/>}

      <Card icon="◎" title="Your details">
        <FG label="Display name" req err={fErr.username}>
          <input className={`fi${fErr.username?' err':''}`} name="username" placeholder="yourhandle" value={form.username} onChange={handleChange} autoCapitalize="none"/>
        </FG>
        <FG label="Company Name" req err={fErr.companyName}>
          <input className={`fi${fErr.companyName?' err':''}`} name="companyName" placeholder="Acme Inc." value={form.companyName} onChange={handleChange}/>
        </FG>
        <FG label="Description" req err={fErr.description}>
          <textarea className="fta" name="description" placeholder="One sentence about what you do" value={form.description} onChange={handleChange}/>
        </FG>
        <FG label="Website" opt>
          <input className="fi" name="website" placeholder="yourcompany.com" value={form.website} onChange={handleChange} inputMode="url" autoCapitalize="none"/>
          <div style={{fontSize:11,color:T.stone,marginTop:4}}>https:// added automatically</div>
        </FG>
      </Card>

      <Card icon="◈" title="Offer & audience">
        <FG label="Rewards" req err={fErr.rewards}>
          <CheckGrid options={REWARD_OPTIONS} selected={form.rewards} name="rewards" onChange={handleChange}/>
          {form.rewards.filter(r=>GIFT_CARD_REWARDS.includes(r)).map(r=>(
            <div key={r}>
              <GiftRow reward={r} value={gcAmt[r]||''} onChange={v=>setGcAmt(p=>({...p,[r]:v}))}/>
              {fErr[`gc_${r}`] && <div className="field-err">⚠ {fErr[`gc_${r}`]}</div>}
            </div>
          ))}
        </FG>
        <FG label="Target Audience" opt>
          <CheckGrid options={AUDIENCE_OPTIONS} selected={form.audience} name="audience" onChange={handleChange}/>
        </FG>
        <FG label="Contact Email" opt>
          <input className="fi" name="contactEmail" type="email" placeholder="hello@yourcompany.com" value={form.contactEmail} onChange={handleChange} inputMode="email" autoCapitalize="none"/>
        </FG>
        <FG label="Booking / Calendly Link" opt>
          <input className="fi" name="calendlyLink" placeholder="calendly.com/yourname" value={form.calendlyLink} onChange={handleChange} inputMode="url" autoCapitalize="none"/>
          <div style={{fontSize:11,color:T.stone,marginTop:4}}>https:// added automatically</div>
        </FG>
      </Card>

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? <><Spinner/> Saving changes…</> : <>Save changes →</>}
      </button>
      {saved && (
        <p style={{textAlign:'center',fontSize:12,color:T.emerald,marginTop:10,fontWeight:500}}>
          ✓ Your program has been updated
        </p>
      )}
    </form>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ auth, onSignOut, onProgramUpdated }) {
  const [data,  setData]  = useState(null);
  const [load,  setLoad]  = useState(true);
  const [error, setError] = useState('');
  const [tab,   setTab]   = useState('overview');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{ fetch_(); },[]);

  const fetch_ = async () => {
    setLoad(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/dashboard/${auth.referralCode}?token=${auth.token}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Failed to load');
      setData(d);
    } catch(e) { setError(e.message); }
    finally { setLoad(false); }
  };

  if (load) return (
    <div style={{display:'flex',alignItems:'center',gap:12,color:T.pebble,fontSize:13,padding:'80px 40px'}}>
      <SpinnerDark/> Loading your dashboard…
    </div>
  );
  if (error) return (
    <div style={{maxWidth:680,margin:'0 auto',padding:'80px 40px'}}>
      <ErrBanner msg={error}/>
      <button className="btn-secondary" style={{width:'auto',padding:'10px 20px'}} onClick={fetch_}>Retry</button>
    </div>
  );

  const { program, sharers, stats } = data;
  const shareText = buildShareText(program, program.username, program.programLink, true);
  const liUrl     = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(program.programLink)}`;

  const handleSaved = updates => {
    // Merge updates into local data so overview reflects changes instantly
    setData(prev => ({ ...prev, program: { ...prev.program, ...updates } }));
    if (onProgramUpdated) onProgramUpdated(updates);
  };

  return (
    <div className="aFadeUp page-pad" style={{maxWidth:820,margin:'0 auto',padding:'52px 40px 80px'}}>

      {/* Header */}
      <div className="dash-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:36,gap:14}}>
        <div>
          <div style={{fontSize:9,fontWeight:600,letterSpacing:'.14em',textTransform:'uppercase',color:T.pebble,marginBottom:10}}>Dashboard</div>
          <h1 style={{fontFamily:F.display,fontStyle:'italic',fontSize:'clamp(28px,5vw,44px)',fontWeight:300,lineHeight:.92,letterSpacing:'-.02em',color:T.ink}}>
            {program.companyName}
          </h1>
          <p style={{fontSize:12,color:T.pebble,marginTop:8,fontWeight:300}}>Logged in as <strong style={{fontWeight:600,color:T.slate}}>{program.username}</strong></p>
        </div>
        <button onClick={onSignOut} className="btn-ghost">Sign out</button>
      </div>

      {/* Stats */}
      <div className="stat-strip" style={{marginBottom:20}}>
        {[
          {num:stats.simulatedVisits||0, lbl:'Profile views'},
          {num:stats.totalSharers,        lbl:'Active referrers'},
          {num:program.rewards?.length||0,lbl:'Rewards offered'},
        ].map((s,i)=>(
          <div key={i} className="stat-item">
            <div className="stat-num" style={{fontSize:40}}>{s.num}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Share nudge */}
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

      {/* Tabs */}
      <div className="tab-scroll" style={{marginBottom:18}}>
        <div className="tabs-row" style={{display:'inline-flex',gap:3,background:T.fog,border:`1px solid ${T.mist}`,borderRadius:8,padding:3}}>
          {[['overview','Overview'],['sharers',`Referrers (${sharers.length})`],['link','Your Link'],['edit','Edit Program']].map(([id,lbl])=>(
            <button key={id} className={`tab-btn${tab===id?' active':''}`} onClick={()=>setTab(id)}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* Tab: overview */}
      {tab==='overview' && (
        <div className="aFadeUp">
          <Card icon="◈" title="Program info" head={
            <button onClick={()=>setTab('edit')} className="btn-ghost" style={{marginLeft:'auto',fontSize:11}}>
              ✎ Edit
            </button>
          }>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:18}}>
              {[
                {l:'Company',    v:program.companyName},
                {l:'Description',v:program.description||'—'},
                {l:'Website',    v:program.website?<a href={program.website} target="_blank" rel="noopener noreferrer" style={{color:T.ink,fontWeight:600,fontSize:13,textDecoration:'underline',textUnderlineOffset:3}}>{program.website}</a>:'—'},
                {l:'Contact',    v:program.contactEmail||'—'},
                {l:'Booking',    v:program.calendlyLink?<a href={program.calendlyLink} target="_blank" rel="noopener noreferrer" style={{color:T.ink,fontWeight:600,fontSize:13,textDecoration:'underline',textUnderlineOffset:3}}>{program.calendlyLink}</a>:'—'},
                {l:'Last digest',v:program.lastDigestSentAt?new Date(program.lastDigestSentAt).toLocaleString():'Not yet sent'},
              ].map(({l,v})=>(
                <div key={l}>
                  <div style={{fontSize:9,fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',color:T.pebble,marginBottom:4}}>{l}</div>
                  <div style={{fontSize:13,color:T.slate,wordBreak:'break-all',lineHeight:1.5,fontWeight:300}}>{v}</div>
                </div>
              ))}
            </div>
            {program.rewards?.length>0 && (
              <div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${T.fog}`}}>
                <div style={{fontSize:9,fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',color:T.pebble,marginBottom:10}}>Rewards</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                  {program.rewards.map(r=>(
                    <span key={r} style={{padding:'7px 12px',background:T.ink,color:T.white,borderRadius:5,fontSize:12,fontWeight:400}}>{r}</span>
                  ))}
                </div>
              </div>
            )}
          </Card>
          <div style={{background:T.fog,border:`1px solid ${T.mist}`,borderRadius:8,padding:'11px 16px',display:'flex',gap:9,alignItems:'flex-start'}}>
            <span style={{fontSize:12,flexShrink:0}}>📬</span>
            <p style={{fontSize:12,color:T.ash,lineHeight:1.6,fontWeight:300}}>Stats digest emails land every 2 days at <strong style={{fontWeight:600,color:T.slate}}>{program.email}</strong></p>
          </div>
        </div>
      )}

      {/* Tab: sharers */}
      {tab==='sharers' && (
        <div className="aFadeUp">
          <Card icon="👥" title={`Referrers (${sharers.length})`} sub="People who created personal links from your program" pad={false}>
            <div style={{padding:'0 18px'}}>
              {sharers.length===0 ? (
                <div style={{padding:'36px 0',textAlign:'center',color:T.pebble,fontSize:13,fontWeight:300}}>
                  No referrers yet — share your link to get the first ones in.
                </div>
              ) : sharers.map((s,i)=>(
                <div key={s.code} className="sharer-row">
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:T.ink,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,color:T.white,flexShrink:0,letterSpacing:'-.01em'}}>
                      {s.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:500,color:T.ink}}>{s.name}</div>
                      <div style={{fontSize:11,color:T.pebble,marginTop:1}}>{timeAgo(s.createdAt)}</div>
                    </div>
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

      {/* Tab: link */}
      {tab==='link' && (
        <div className="aFadeUp">
          <Card icon="🔗" title="Share your program" sub="The more you share, the more referrers you recruit">
            <ShareActions link={program.programLink} shareText={shareText} programName={program.companyName}/>
          </Card>
        </div>
      )}

      {/* Tab: edit */}
      {tab==='edit' && (
        <div className="aFadeUp">
          <div style={{marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:600,color:T.ink,marginBottom:4}}>Edit your program</div>
            <p style={{fontSize:13,color:T.ash,fontWeight:300}}>Changes are live immediately — your referral link stays the same.</p>
          </div>
          <EditForm initial={program} auth={auth} onSaved={handleSaved}/>
        </div>
      )}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [mode,    setMode]    = useState('create');
  const [code,    setCode]    = useState(null);
  const [program, setProgram] = useState(null);
  const [loading, setLoad]    = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [link,    setLink]    = useState('');
  const [showSignIn, setSI]   = useState(false);
  const [fErr,    setFErr]    = useState({});
  const [gcAmt,   setGcAmt]   = useState({});
  const [auth,    setAuth]    = useState(()=>{try{return JSON.parse(sessionStorage.getItem('re_auth')||'null')}catch{return null}});

  // prefillData: loaded from API when authed founder visits homepage
  const [prefill, setPrefill] = useState(null);
  const [prefillLoading, setPrefillLoad] = useState(false);

  const [cd, setCd] = useState({
    username:'', email:'', password:'', companyName:'',
    description:'', website:'', rewards:[], audience:[],
    contactEmail:'', calendlyLink:'',
  });
  const [sharerName, setSharerName] = useState('');

  useEffect(()=>{
    const path = window.location.pathname;
    if (path.startsWith('/refer/')) {
      const c = path.split('/refer/')[1]?.trim();
      if (c) { setCode(c); setMode('public'); loadProgram(c); }
      return;
    }
    const q = new URLSearchParams(window.location.search);
    if ((path==='/dashboard'||q.get('signin')==='1') && auth) { setMode('dashboard'); return; }
    // Homepage + authed → prefill form
    if (auth && path==='/') loadPrefill(auth);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Load founder's existing data to prefill homepage form
  const loadPrefill = async (authData) => {
    setPrefillLoad(true);
    try {
      const r = await fetch(`${API_BASE}/dashboard/${authData.referralCode}?token=${authData.token}`);
      const d = await r.json();
      if (!r.ok) return; // silently fail — just show blank form
      const p = d.program;
      const { selected, gcAmounts } = expandRewards(p.rewards || []);
      setPrefill(p);
      setCd({
        username:     p.username     || '',
        email:        p.email        || '',
        password:     '',  // never prefill password
        companyName:  p.companyName  || '',
        description:  p.description  || '',
        website:      (p.website||'').replace(/^https?:\/\//,''),
        rewards:      selected,
        audience:     p.audience     || [],
        contactEmail: p.contactEmail || '',
        calendlyLink: (p.calendlyLink||'').replace(/^https?:\/\//,''),
      });
      setGcAmt(gcAmounts);
    } catch(e) { /* silently ignore */ }
    finally { setPrefillLoad(false); }
  };

  const loadProgram = async c => {
    setLoad(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/${c}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Program not found');
      setProgram(d.program);
    } catch(e) { setError(e.message); }
    finally { setLoad(false); }
  };

  const handleChange = e => {
    const {name,value,checked} = e.target;
    if (name==='rewards')       setCd(p=>({...p,rewards: checked?[...p.rewards,value]:p.rewards.filter(r=>r!==value)}));
    else if (name==='audience') setCd(p=>({...p,audience:checked?[...p.audience,value]:p.audience.filter(a=>a!==value)}));
    else                        setCd(p=>({...p,[name]:value}));
    if (fErr[name]) setFErr(p=>({...p,[name]:''}));
    setError('');
  };

  const finalRewards = () => cd.rewards.map(r=>
    GIFT_CARD_REWARDS.includes(r)&&gcAmt[r] ? `${r} ($${gcAmt[r]})` : r
  );

  const validate = (isUpdate=false) => {
    const e={};
    if (!cd.username.trim())    e.username    = 'Username required';
    if (!isUpdate && !cd.email.trim())    e.email = 'Email required';
    if (!isUpdate && !cd.password)        e.password = 'Password required';
    if (!cd.companyName.trim()) e.companyName = 'Company name required';
    if (!cd.description.trim()) e.description = 'Short description required';
    if (!cd.rewards.length)     e.rewards     = 'Pick at least one reward';
    for (const r of cd.rewards)
      if (GIFT_CARD_REWARDS.includes(r)&&!gcAmt[r]) e[`gc_${r}`]=`Amount required for ${r}`;
    setFErr(e);
    return !Object.keys(e).length;
  };

  // isUpdate = founder already has a program; save via PATCH instead of POST
  const isUpdate = !!prefill && !!auth;

  const createProgram = async e => {
    e.preventDefault();
    if (!validate(isUpdate)) { document.getElementById('form-anchor')?.scrollIntoView({behavior:'smooth',block:'start'}); return; }
    setLoad(true); setError('');
    try {
      if (isUpdate) {
        // PATCH existing program
        const payload = {
          username:     cd.username,
          companyName:  cd.companyName,
          description:  cd.description,
          website:      fixUrl(cd.website),
          calendlyLink: fixUrl(cd.calendlyLink),
          rewards:      finalRewards(),
          audience:     cd.audience,
          contactEmail: cd.contactEmail,
        };
        const r = await fetch(`${API_BASE}/dashboard/${auth.referralCode}?token=${auth.token}`, {
          method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error||'Failed to update');
        const programLink = `${window.location.origin}/refer/${auth.referralCode}`;
        setLink(programLink);
        setSuccess(true);
        window.scrollTo({top:0,behavior:'smooth'});
      } else {
        // POST new program
        const payload = {...cd, website:fixUrl(cd.website), calendlyLink:fixUrl(cd.calendlyLink), rewards:finalRewards()};
        const r = await fetch(`${API_BASE}/register-program`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const d = await r.json();
        if (!r.ok) throw new Error(d.error||'Failed to create');
        setLink(getShareLink(d.programLink));
        setSuccess(true);
        window.scrollTo({top:0,behavior:'smooth'});
      }
    } catch(e) { setError(e.message); }
    finally { setLoad(false); }
  };

  const submitShare = async e => {
    e.preventDefault();
    if (!sharerName.trim()) { setFErr({sharerName:'Name required'}); return; }
    setLoad(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/${code}/share`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:sharerName.trim()})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Failed');
      setLink(getShareLink(d.personalShareLink));
      setSuccess(true);
      window.scrollTo({top:0,behavior:'smooth'});
    } catch(e) { setError(e.message); }
    finally { setLoad(false); }
  };

  const signInOk = d => {
    sessionStorage.setItem('re_auth',JSON.stringify(d));
    setAuth(d); setSI(false); setMode('dashboard');
  };
  const signOut = () => {
    sessionStorage.removeItem('re_auth');
    setAuth(null); setPrefill(null); setMode('create');
    setCd({username:'',email:'',password:'',companyName:'',description:'',website:'',rewards:[],audience:[],contactEmail:'',calendlyLink:''});
    setGcAmt({});
  };

  // When dashboard edit saves, also update prefill so homepage form stays in sync
  const handleDashboardSaved = updates => {
    setPrefill(prev => prev ? {...prev, ...updates} : prev);
  };

  const creatorText = buildShareText({...cd, rewards: finalRewards()}, cd.username, link, true);
  const publicText  = buildShareText(program, sharerName, link, false);

  return (
    <>
      <style>{CSS}</style>
      <div style={{minHeight:'100vh',background:T.cream,fontFamily:F.body,color:T.ink}}>

        {/* ── Nav ── */}
        <nav className="nav">
          <div className="nav-inner">
            <button className="nav-logo" onClick={()=>{setMode('create');setSuccess(false);}}>
              <em>Easy</em><strong>Recommend</strong>
            </button>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {mode==='dashboard' ? (
                <button onClick={signOut} className="btn-ghost">Sign out</button>
              ) : auth ? (
                <button onClick={()=>setMode('dashboard')} className="btn-primary" style={{width:'auto',padding:'8px 16px',fontSize:12,borderRadius:6}}>
                  Dashboard →
                </button>
              ) : (
                <button onClick={()=>setSI(true)} className="btn-ghost">Sign in</button>
              )}
              <div className="nav-live"><span className="nav-live-dot"/>Live</div>
            </div>
          </div>
        </nav>

        {showSignIn && <SignInModal onClose={()=>setSI(false)} onSuccess={signInOk}/>}

        {/* ── DASHBOARD ── */}
        {mode==='dashboard' && auth && <Dashboard auth={auth} onSignOut={signOut} onProgramUpdated={handleDashboardSaved}/>}

        {/* ── CREATE / EDIT — hero + form ── */}
        {mode==='create' && !success && (
          <>
            {/* Show hero only for brand-new visitors */}
            {!isUpdate && (
              <Hero
                onCreate={()=>document.getElementById('form-anchor')?.scrollIntoView({behavior:'smooth',block:'start'})}
                onSignIn={()=>setSI(true)}
              />
            )}

            {/* Prefill banner when authed */}
            {isUpdate && (
              <div style={{background:T.fog,borderBottom:`1px solid ${T.mist}`,padding:'16px 32px'}}>
                <div style={{maxWidth:680,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                  <div>
                    <span style={{fontSize:13,fontWeight:600,color:T.ink}}>Editing your program</span>
                    <span style={{fontSize:12,color:T.ash,marginLeft:10,fontWeight:300}}>Changes save immediately on submit</span>
                  </div>
                  <button onClick={()=>setMode('dashboard')} className="btn-ghost" style={{fontSize:12}}>
                    ← Back to dashboard
                  </button>
                </div>
              </div>
            )}

            <div id="form-anchor" className="form-pad" style={{maxWidth:680,margin:'0 auto',padding: isUpdate ? '32px 40px 80px' : '0 40px 80px'}}>

              {/* Loading prefill */}
              {prefillLoading && (
                <div style={{display:'flex',gap:10,alignItems:'center',color:T.pebble,fontSize:13,padding:'32px 0',fontWeight:300}}>
                  <SpinnerDark/> Loading your program details…
                </div>
              )}

              {!prefillLoading && (
                <>
                  <ErrBanner msg={error}/>
                  <form onSubmit={createProgram} noValidate className="aFadeUp">

                    {/* Account card — hide email/password when updating */}
                    <Card icon="◎" title={isUpdate ? 'Your details' : 'Account'} sub={isUpdate ? 'Update your display name' : 'Your login credentials'}>
                      <FG label="Display name" req err={fErr.username}>
                        <input className={`fi${fErr.username?' err':''}`} name="username" placeholder="yourhandle" value={cd.username} onChange={handleChange} autoCapitalize="none"/>
                      </FG>
                      {!isUpdate && (
                        <>
                          <FG label="Email" req err={fErr.email}>
                            <input className={`fi${fErr.email?' err':''}`} name="email" type="email" placeholder="you@company.com" value={cd.email} onChange={handleChange} inputMode="email" autoCapitalize="none"/>
                          </FG>
                          <FG label="Password" req err={fErr.password}>
                            <input className={`fi${fErr.password?' err':''}`} name="password" type="password" placeholder="Create a password" value={cd.password} onChange={handleChange}/>
                          </FG>
                        </>
                      )}
                      {isUpdate && (
                        <div style={{padding:'9px 12px',background:T.fog,border:`1px solid ${T.mist}`,borderRadius:6,fontSize:12,color:T.ash,fontWeight:300}}>
                          Signed in as <strong style={{fontWeight:600,color:T.slate}}>{prefill.email}</strong>
                          <span style={{color:T.stone,margin:'0 8px'}}>·</span>
                          <button type="button" onClick={()=>setSI(true)} style={{background:'none',border:'none',color:T.ink,fontSize:12,fontWeight:600,cursor:'pointer',padding:0,textDecoration:'underline',textUnderlineOffset:2}}>
                            Change account
                          </button>
                        </div>
                      )}
                    </Card>

                    {/* Program card */}
                    <Card icon="◈" title="Program Details" sub="What you're offering and who it's for">
                      <FG label="Company Name" req err={fErr.companyName}>
                        <input className={`fi${fErr.companyName?' err':''}`} name="companyName" placeholder="Acme Inc." value={cd.companyName} onChange={handleChange}/>
                      </FG>
                      <FG label="Description" req err={fErr.description}>
                        <textarea className="fta" name="description" placeholder="One sentence about what you do — used in auto-generated share messages" value={cd.description} onChange={handleChange}/>
                      </FG>
                      <FG label="Website" opt>
                        <input className="fi" name="website" placeholder="yourcompany.com" value={cd.website} onChange={handleChange} inputMode="url" autoCapitalize="none"/>
                        <div style={{fontSize:11,color:T.stone,marginTop:4}}>https:// added automatically</div>
                      </FG>
                      <FG label="Rewards" req err={fErr.rewards}>
                        <CheckGrid options={REWARD_OPTIONS} selected={cd.rewards} name="rewards" onChange={handleChange}/>
                        {cd.rewards.filter(r=>GIFT_CARD_REWARDS.includes(r)).map(r=>(
                          <div key={r}>
                            <GiftRow reward={r} value={gcAmt[r]||''} onChange={v=>setGcAmt(p=>({...p,[r]:v}))}/>
                            {fErr[`gc_${r}`] && <div className="field-err">⚠ {fErr[`gc_${r}`]}</div>}
                          </div>
                        ))}
                      </FG>
                      <FG label="Target Audience" opt>
                        <CheckGrid options={AUDIENCE_OPTIONS} selected={cd.audience} name="audience" onChange={handleChange}/>
                      </FG>
                      <FG label="Contact Email" opt>
                        <input className="fi" name="contactEmail" type="email" placeholder="hello@yourcompany.com" value={cd.contactEmail} onChange={handleChange} inputMode="email" autoCapitalize="none"/>
                      </FG>
                      <FG label="Booking / Calendly Link" opt>
                        <input className="fi" name="calendlyLink" placeholder="calendly.com/yourname" value={cd.calendlyLink} onChange={handleChange} inputMode="url" autoCapitalize="none"/>
                        <div style={{fontSize:11,color:T.stone,marginTop:4}}>https:// added automatically</div>
                      </FG>
                    </Card>

                    <button type="submit" disabled={loading} className="btn-primary">
                      {loading
                        ? <><Spinner/> {isUpdate ? 'Saving changes…' : 'Creating your program…'}</>
                        : isUpdate ? <>Save changes →</> : <>Create Program & Get Your Link →</>
                      }
                    </button>
                    {!isUpdate && (
                      <p style={{textAlign:'center',fontSize:11,color:T.pebble,marginTop:10,fontWeight:300}}>
                        Free forever · Every visitor gets their own referral link automatically
                      </p>
                    )}
                  </form>
                </>
              )}
            </div>
          </>
        )}

        {/* ── CREATE / UPDATE SUCCESS ── */}
        {mode==='create' && success && (
          <div className="aFadeUp page-pad" style={{maxWidth:680,margin:'0 auto',padding:'64px 40px 80px'}}>
            <div style={{marginBottom:48,paddingBottom:48,borderBottom:`1px solid ${T.mist}`}}>
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:T.ink,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 2px 8px rgba(0,0,0,.18)'}}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <h1 style={{fontFamily:F.display,fontStyle:'italic',fontSize:'clamp(38px,7vw,60px)',fontWeight:300,color:T.ink,lineHeight:.95,letterSpacing:'-.025em'}}>
                  {isUpdate ? 'Changes saved.' : 'You\'re live.'}
                </h1>
              </div>
              {isUpdate
                ? <p style={{fontSize:15,color:T.ash,lineHeight:1.7,fontWeight:300}}>Your program has been updated. All your existing referral links still work.</p>
                : <p style={{fontSize:15,color:T.ash,lineHeight:1.7,fontWeight:300}}>Your referral program is active. A welcome email is heading to your inbox.</p>
              }
              <p style={{fontSize:12,color:T.pebble,marginTop:6}}>Sign in anytime to track referrers and view stats.</p>
            </div>

            <Card dark icon="✓" title={isUpdate ? 'Your updated link' : 'Share your program'} sub={isUpdate ? 'Share it again to reach new audiences' : 'The more channels you post on, the more referrers you recruit'}>
              <ShareActions link={link} shareText={creatorText} programName={cd.companyName}/>
            </Card>

            <div style={{textAlign:'center',marginTop:16,display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
              {isUpdate && (
                <button onClick={()=>{setSuccess(false);}} className="btn-secondary" style={{width:'auto',padding:'12px 22px'}}>
                  ← Edit again
                </button>
              )}
              <button onClick={()=>{ if(auth) setMode('dashboard'); else setSI(true); }} className="btn-secondary" style={{width:'auto',padding:'12px 28px'}}>
                {auth ? 'View dashboard →' : 'Sign in to your dashboard →'}
              </button>
            </div>
          </div>
        )}

        {/* ── PUBLIC ── */}
        {mode==='public' && (
          <div className="page-pad" style={{maxWidth:620,margin:'0 auto',padding:'56px 40px 80px'}}>
            {loading && !program && (
              <div style={{display:'flex',gap:12,alignItems:'center',color:T.pebble,fontSize:13,padding:'48px 0',fontWeight:300}}>
                <SpinnerDark/> Loading program…
              </div>
            )}
            <ErrBanner msg={error}/>

            {program && !success && (
              <div className="aFadeUp">
                <div style={{marginBottom:36,paddingBottom:36,borderBottom:`2px solid ${T.ink}`}}>
                  <div style={{fontSize:9,fontWeight:600,letterSpacing:'.16em',textTransform:'uppercase',color:T.pebble,marginBottom:12}}>
                    You've been referred to
                  </div>
                  <h1 style={{fontFamily:F.display,fontStyle:'italic',fontSize:'clamp(42px,9vw,72px)',fontWeight:300,lineHeight:.9,letterSpacing:'-.03em',color:T.ink,marginBottom:12}}>
                    {program.companyName}
                  </h1>
                  <p style={{fontSize:13,color:T.ash,fontWeight:300}}>
                    via <strong style={{fontWeight:600,color:T.ink}}>{program.founderName||'a friend'}</strong>
                  </p>
                  {program.description && (
                    <p style={{fontSize:15,color:T.slate,lineHeight:1.7,maxWidth:440,marginTop:14,fontWeight:300}}>{program.description}</p>
                  )}
                  {program.website && (
                    <a href={fixUrl(program.website)} target="_blank" rel="noopener noreferrer"
                      style={{display:'inline-flex',alignItems:'center',gap:5,marginTop:12,fontSize:13,color:T.ink,fontWeight:500,textDecoration:'underline',textUnderlineOffset:3,wordBreak:'break-all'}}>
                      {program.website.replace(/^https?:\/\//,'')}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                    </a>
                  )}
                </div>

               

                {/* {program.audience?.length>0 && (
                  <div style={{marginBottom:24}}>
                    <div style={{fontSize:9,fontWeight:600,letterSpacing:'.12em',textTransform:'uppercase',color:T.pebble,marginBottom:9}}>Best for</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                      {program.audience.map(a=>(
                        <span key={a} style={{padding:'6px 12px',background:T.fog,border:`1px solid ${T.mist}`,borderRadius:5,fontSize:12,color:T.slate,fontWeight:400}}>{a}</span>
                      ))}
                    </div>
                  </div>
                )} */}

                {(program.calendlyLink||program.contactEmail) && (
                  <div style={{display:'flex',gap:9,marginBottom:28,flexWrap:'wrap'}}>
                    {program.calendlyLink && (
                      <a href={fixUrl(program.calendlyLink)} target="_blank" rel="noopener noreferrer"
                        style={{display:'inline-flex',alignItems:'center',gap:7,padding:'11px 22px',background:T.ink,borderRadius:6,color:T.white,fontWeight:500,fontSize:13,textDecoration:'none'}}>
                        Book a call →
                      </a>
                    )}
                    {program.contactEmail && (
                      <a href={`mailto:${program.contactEmail}`} className="btn-ghost" style={{fontSize:13}}>{program.contactEmail}</a>
                    )}
                  </div>
                )}

                <Card dark icon="🔗" title="Get your referral link" sub="Enter your name — your link is created instantly">
                {program.rewards?.length>0 && (
                  <div style={{marginBottom:24}}>
                    <div style={{fontSize:9,fontWeight:600,letterSpacing:'.12em',textTransform:'uppercase',color:T.pebble,marginBottom:10}}>Refer someone & earn</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                      {program.rewards.map(r=><span key={r} className="reward-badge">{r}</span>)}
                    </div>
                  </div>
                )}
                  <form onSubmit={submitShare}>
                    <FG label="Your Email" req err={fErr.sharerName}>
                      <input className={`fi${fErr.sharerName?' err':''}`} placeholder="How should we credit you?" value={sharerName}
                        onChange={e=>{setSharerName(e.target.value);setFErr({});setError('');}} autoFocus/>
                    </FG>
                    <button type="submit" disabled={loading} className="btn-primary">
                      {loading?<><Spinner/> Generating…</>:<>Get My Referral Link →</>}
                    </button>
                  </form>
                </Card>
              </div>
            )}

            {success && (
              <div className="aFadeUp">
                <OkBanner msg={`Your referral link for ${program?.companyName} is ready!`}/>
                <Card dark icon="✓" title="Your link is ready" sub={`Share it anywhere to earn rewards from ${program?.companyName}`}>
                  <ShareActions link={link} shareText={publicText} programName={program?.companyName}/>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <footer style={{background:T.black,padding:'22px 32px'}}>
          <div style={{maxWidth:900,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
            <div style={{fontFamily:F.display,fontSize:16,color:'rgba(255,255,255,.6)',fontWeight:300,fontStyle:'italic'}}>
              Recommend<strong style={{fontWeight:600}}>Easy</strong>
              <span style={{marginLeft:12,fontSize:11,color:'rgba(255,255,255,.25)',fontFamily:F.body}}>© 2026</span>
            </div>
            {mode==='public' && (
              <a href="/" style={{fontSize:12,color:'rgba(255,255,255,.4)',textDecoration:'none',fontWeight:400,transition:'color .15s'}}
                onMouseEnter={e=>e.target.style.color='rgba(255,255,255,.8)'}
                onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.4)'}>
                ← Create your own program
              </a>
            )}
          </div>
        </footer>
      </div>
    </>
  );
}