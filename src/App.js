import { useState, useEffect, useRef } from "react";

/* ============================================================================
   Easy Recommend — wired to the Express backend (router mounted at /easyrecommend)
   - Local dev (frontend on localhost) → http://localhost:9000
   - Anywhere else → Heroku
   - No external packages, no Tailwind (inline styles + injected <style>).
   ========================================================================== */

const API_BASE =
  (typeof window !== "undefined" && /localhost|127\.0\.0\.1/.test(window.location.hostname)
    ? "http://localhost:9000"
    : "https://learntok-backend-2026-24c204fe508e.herokuapp.com") + "/easyrecommend";

// Admin key is entered at runtime (verified against the server), never shipped in the bundle.
function adminKey() { try { return sessionStorage.getItem("er_admin_key") || ""; } catch (e) { return ""; } }

async function api(path, { method = "GET", body, admin } = {}) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(admin ? { "x-admin-key": adminKey() } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) throw new Error((data && data.error) || `HTTP ${res.status}`);
  return data;
}

const C = {
  ink: "#1C1A17", inkSoft: "#3A362F", paper: "#FDFCFA", panel: "#F4F1EA",
  line: "#E5DFD4", muted: "#6E675B", accent: "#0F6B4F", accentD: "#0A4F3A",
  accentSoft: "#E4F0EA", gold: "#D99A00",
};
const SERIF = "'Fraunces','Georgia',serif";
const CATS = {
  Beauty: { color: "#B0566B", bg: "#F7E9EC" }, Legal: { color: "#2E4D71", bg: "#E9EFF5" },
  Education: { color: "#9A6B1E", bg: "#F4EBD9" }, Wellness: { color: "#5E7F4E", bg: "#EBF0E4" },
  Fitness: { color: "#B5572E", bg: "#F6E8DF" }, "Food & Drink": { color: "#A33B3B", bg: "#F6E5E3" },
  Home: { color: "#6B6242", bg: "#F0ECE0" }, Finance: { color: "#3D3A78", bg: "#ECEBF5" },
  Travel: { color: "#2D6E8E", bg: "#E5F0F4" }, Fashion: { color: "#7A3E6B", bg: "#F2E7EF" },
  "Software & SaaS": { color: "#2F6F6A", bg: "#E2F0EE" }, Apps: { color: "#3E51A8", bg: "#EAEDF8" },
  "AI Tools": { color: "#6C3FA0", bg: "#EFE8F6" }, "Online Courses": { color: "#1E7A8C", bg: "#E3F1F4" },
  Gaming: { color: "#9A3B6E", bg: "#F5E7EF" }, Subscriptions: { color: "#7A6A2A", bg: "#F2EEDD" },
  "Creator Tools": { color: "#A84A86", bg: "#F5E8F0" }, Marketplaces: { color: "#4F7A3D", bg: "#E9F1E2" },
  Other: { color: "#6E675B", bg: "#EEEBE4" },
};
const CAT_LIST = Object.keys(CATS);
const catOf = (b) => CATS[(b.categories || [])[0]] || CATS.Beauty;
// Stable-but-varied light tint per brand (used when there's no cover photo).
function hashStr(s) { let h = 0; const str = String(s || ""); for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
function tintFor(seed) { const h = hashStr(seed) % 360; return { bg: `hsl(${h}, 64%, 93%)`, color: `hsl(${h}, 42%, 52%)` }; }
const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const commissionLabel = (b) => b.commissionType === "flat" ? `$${b.commissionFlat}` : b.commissionType === "both" ? `${b.commissionPct}% + $${b.commissionFlat}` : `${b.commissionPct}%`;

// Downscale an uploaded image to a small JPEG data URL (keeps payloads light).
function fileToDataURL(file, max = 1000, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > max) { height = Math.round(height * max / width); width = max; }
      else if (height >= width && height > max) { width = Math.round(width * max / height); height = max; }
      const c = document.createElement("canvas"); c.width = width; c.height = height;
      c.getContext("2d").drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url); resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
    img.src = url;
  });
}
// Persistent login session: { role:'creator'|'brand', token, username?, phone? }
function getSession() { try { return JSON.parse(localStorage.getItem("er_session") || "null"); } catch (e) { return null; } }
function saveSession(s) { try { localStorage.setItem("er_session", JSON.stringify(s)); } catch (e) {} }
function clearSession() { try { localStorage.removeItem("er_session"); } catch (e) {} }
// A signed-up/logged-in creator unlocks rewards site-wide.
function creatorHandle() { const s = getSession(); return s && s.role === "creator" ? s.username : ""; }

// Open an external website in a new tab, adding https:// if missing.
function openSite(url) { if (!url) return; const u = /^https?:\/\//i.test(url) ? url : `https://${url}`; window.open(u, "_blank", "noopener"); }
const trackClick = (username, businessId) => { try { api("/track", { method: "POST", body: { username, businessId, type: "click" } }); } catch (e) {} };

// Parse the current URL into a view: "/" → home, "/admin" (or #admin) → admin, "/@handle" → profile.
function parseRoute() {
  if (typeof window === "undefined") return { view: "home", handle: null };
  const p = decodeURIComponent(window.location.pathname || "/");
  if (p === "/admin" || window.location.hash === "#admin") return { view: "admin", handle: null };
  if (p === "/my-business") return { view: getSession() ? "mybiz" : "home", handle: null };
  if (p === "/settings") return { view: getSession() ? "settings" : "home", handle: null };
  if (p === "/business") return { view: "business", handle: null };
  if (p === "/influencers") return { view: "influencers", handle: null };
  const m = p.match(/^\/@([A-Za-z0-9_]+)/);
  if (m) return { view: "profile", handle: m[1].toLowerCase() };
  return { view: "home", handle: null };
}

/* ---------- Inline SVG icons ---------- */
const Svg = ({ size = 18, sw = 1.7, color = "currentColor", fill = "none", children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>{children}</svg>
);
const Check = (p) => <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>;
const Close = (p) => <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>;
const Arrow = (p) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
const ChevL = (p) => <Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>;
const ChevR = (p) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>;
const Plus = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
const Pin = (p) => <Svg {...p}><path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.6" /></Svg>;
const Search = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Svg>;
const Globe = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.4 2.5 2.4 15.5 0 18M12 3c-2.4 2.5-2.4 15.5 0 18" /></Svg>;
const Copy = (p) => <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2.2" /><path d="M5 15V6.2A1.2 1.2 0 0 1 6.2 5H15" /></Svg>;
const Edit = (p) => <Svg {...p}><path d="M12 20h9" /><path d="M16.4 3.6a2 2 0 0 1 2.9 2.8L7.6 18.1 3.5 19.2l1.1-4.1z" /></Svg>;
const Send = (p) => <Svg {...p}><path d="M21 3 3 10.6l7 2.4 2.4 7z" /><path d="M21 3 10 14" /></Svg>;
const Store = (p) => <Svg {...p}><path d="M4 9h16M5 9l1-4h12l1 4M5 9v10h14V9M9.5 19v-5h5v5" /></Svg>;
const Lock = (p) => <Svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 1 1 8 0v3" /></Svg>;
const Trash = (p) => <Svg {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></Svg>;
const Phone = (p) => <Svg {...p}><path d="M6.6 10.8a11 11 0 0 0 6.6 6.6l1.6-1.6a1 1 0 0 1 1-.24 9 9 0 0 0 2.8.45 1 1 0 0 1 1 1V19a1 1 0 0 1-1 1A16 16 0 0 1 4 6a1 1 0 0 1 1-1h2.3a1 1 0 0 1 1 1 9 9 0 0 0 .45 2.8 1 1 0 0 1-.24 1z" /></Svg>;
const Mail = (p) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M4 7.5l8 5.5 8-5.5" /></Svg>;
const Spark = (p) => <Svg {...p}><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z" /></Svg>;
const Star = ({ size = 16, on = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={on ? C.gold : "none"} stroke={on ? C.gold : "#D9D2C5"} strokeWidth="1.2" strokeLinejoin="round" style={{ display: "block" }}>
    <path d="M12 17.3 6.2 20.6l1.5-6.5L2.7 9.7l6.6-.6L12 3l2.7 6.1 6.6.6-5 4.4 1.5 6.5z" /></svg>
);
const Seal = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" fill={C.accent} />
    <path d="M8.3 12.2l2.4 2.4 5-5.2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/* ---------- Atoms ---------- */
function Avatar({ name, image, size = 44 }) {
  if (image) return <img src={image} alt={name || ""} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }} />;
  const init = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <span style={{ width: size, height: size, borderRadius: "50%", display: "grid", placeItems: "center", background: C.ink, color: C.paper, fontFamily: SERIF, fontWeight: 500, fontSize: size / 2.4, flexShrink: 0 }}>{init}</span>;
}
function Stars({ value = 5, size = 14 }) { return <span style={{ display: "inline-flex", gap: 2 }}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={size} on={n <= value} />)}</span>; }
function StarPicker({ value, onChange }) {
  return <div style={{ display: "flex", gap: 6 }}>{[1, 2, 3, 4, 5].map((n) => (
    <button key={n} type="button" onClick={() => onChange(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Star size={30} on={n <= value} /></button>))}</div>;
}
function Field({ label, hint, children }) {
  return <label style={{ display: "block" }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 600, marginBottom: 7, color: C.ink }}>{label}</span>{children}{hint && <span style={{ display: "block", fontSize: 12, color: C.muted, marginTop: 6 }}>{hint}</span>}</label>;
}
const COUNTRY_CODES = [
  { c: "US", d: "+1", f: "🇺🇸" }, { c: "CA", d: "+1", f: "🇨🇦" }, { c: "GB", d: "+44", f: "🇬🇧" },
  { c: "IN", d: "+91", f: "🇮🇳" }, { c: "AU", d: "+61", f: "🇦🇺" }, { c: "DE", d: "+49", f: "🇩🇪" },
  { c: "FR", d: "+33", f: "🇫🇷" }, { c: "ES", d: "+34", f: "🇪🇸" }, { c: "IT", d: "+39", f: "🇮🇹" },
  { c: "NL", d: "+31", f: "🇳🇱" }, { c: "AE", d: "+971", f: "🇦🇪" }, { c: "SG", d: "+65", f: "🇸🇬" },
  { c: "BR", d: "+55", f: "🇧🇷" }, { c: "MX", d: "+52", f: "🇲🇽" }, { c: "JP", d: "+81", f: "🇯🇵" },
  { c: "ZA", d: "+27", f: "🇿🇦" }, { c: "NG", d: "+234", f: "🇳🇬" }, { c: "IE", d: "+353", f: "🇮🇪" },
];
// Combines a country code + local number into an E.164-ish string for `onChange`.
function PhoneInput({ value, onChange, autoFocus }) {
  const [code, setCode] = useState("+1");
  const [local, setLocal] = useState("");
  const emit = (cd, lc) => { const digits = lc.replace(/\D/g, ""); onChange(digits ? cd + digits : ""); };
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <select className="er-input" style={{ flex: "0 0 auto", width: 104, padding: "0 8px" }} value={code} onChange={(e) => { setCode(e.target.value); emit(e.target.value, local); }}>
        {COUNTRY_CODES.map((c, i) => <option key={c.c + i} value={c.d}>{c.f} {c.d}</option>)}
      </select>
      <input className="er-input" style={{ flex: 1 }} type="tel" autoFocus={autoFocus} placeholder="555 010 2030" value={local} onChange={(e) => { setLocal(e.target.value); emit(code, e.target.value); }} />
    </div>
  );
}
function Stepper({ step, total }) {
  return <div style={{ display: "flex", gap: 6 }}>{Array.from({ length: total }).map((_, i) => <span key={i} style={{ height: 5, flex: 1, borderRadius: 99, background: i <= step ? C.ink : C.line }} />)}</div>;
}
function Modal({ children, onClose, wide }) {
  return <div className="er-modal-overlay" onClick={onClose}><div className={`er-modal${wide ? " er-modal-wide" : ""}`} onClick={(e) => e.stopPropagation()}>
    <button className="er-close" onClick={onClose} aria-label="Close"><Close size={16} /></button>{children}</div></div>;
}
function ErrBox({ msg }) { return msg ? <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "#C0392B" }}>{msg}</p> : null; }

/* ---------- Business detail (fetches /business/:id) ---------- */
function BusinessDetail({ id, onClose, onRecommend }) {
  const [b, setB] = useState(null); const [err, setErr] = useState("");
  const [reward, setReward] = useState(null);
  const handle = creatorHandle();
  useEffect(() => { api(`/business/${id}`).then(setB).catch((e) => setErr(e.message)); }, [id]);
  useEffect(() => { if (handle) api(`/business/${id}/reward?username=${encodeURIComponent(handle)}`).then((r) => setReward(r.earns)).catch(() => {}); }, [id, handle]);
  const cc = b ? catOf(b) : CATS.Beauty;
  const photo = b && (b.photos || [])[0];
  const tint = b ? tintFor(b.id || b.name) : cc;
  return (
    <Modal onClose={onClose} wide>
      {!b ? (
        <div style={{ padding: 48, textAlign: "center", color: C.muted }}>{err ? `Couldn't load: ${err}` : "Loading…"}</div>
      ) : (<>
        {photo ? (
          <div style={{ height: 200, background: cc.bg }}><img src={photo} alt={b.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>
        ) : (
          <div style={{ height: 120, background: tint.bg, display: "grid", placeItems: "center" }}>
            <span style={{ width: 56, height: 56, borderRadius: 15, display: "grid", placeItems: "center", background: "#fff", color: tint.color, boxShadow: "0 4px 14px rgba(0,0,0,.07)" }}><Store size={24} /></span>
          </div>
        )}
        <div style={{ padding: "22px 28px 28px" }}>
          {b.photos && b.photos.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
              {b.photos.slice(1, 6).map((p, i) => <img key={i} src={p} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: `1px solid ${C.line}` }} />)}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 999, background: cc.bg, color: cc.color }}>{b.categories[0]}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: C.accent }}><Seal size={15} /> Verified</span>
          </div>
          <h2 className="er-serif" style={{ margin: "12px 0 0", fontSize: 28, fontWeight: 500, letterSpacing: "-.01em", display: "flex", alignItems: "center", gap: 8 }}>{b.name}{b.premium && <span title="Premium verified" style={{ color: C.accent, display: "inline-flex" }}><Seal size={20} /></span>}</h2>
          <p style={{ margin: "6px 0 0", fontSize: 15, color: C.inkSoft, lineHeight: 1.5 }}>{b.blurb}</p>
          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13.5, color: C.inkSoft }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{b.online ? <Globe size={15} color={C.muted} /> : <Pin size={15} color={C.muted} />}{b.online ? "Online" : b.city}</span>
            {b.discount > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.accent, fontWeight: 600 }}>{b.discount}% member perk</span>}
          </div>

          <div style={{ marginTop: 18, border: `1px solid ${C.line}`, borderRadius: 14, padding: "13px 16px", background: C.panel, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", background: "#fff", color: reward ? C.accent : C.muted, border: `1px solid ${C.line}`, flexShrink: 0 }}>{reward ? <Spark size={18} /> : <Lock size={18} />}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.muted }}>Creator reward</div>
              {reward ? <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{reward} per sale</div>
                : <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.ink, filter: "blur(5px)", userSelect: "none" }}>00% + $00</span>
                    <span style={{ fontSize: 12, color: C.muted }}>Join to view</span>
                  </div>}
            </div>
            {!reward && <button className="er-btn er-btn-accent er-btn-sm" onClick={() => onRecommend(b.id)}><Lock size={14} /> Unlock</button>}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button className="er-btn er-btn-primary" onClick={() => onRecommend(b.id)}>Recommend &amp; earn <Arrow size={16} /></button>
            {b.website && <button className="er-btn er-btn-ghost" onClick={() => { trackClick(handle, b.id); openSite(b.website); }}>Visit website</button>}
          </div>
          {(b.phone || b.email) && (
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {b.phone && <a href={`tel:${b.phone}`} onClick={() => trackClick(handle, b.id)} className="er-btn er-btn-light er-btn-sm" style={{ textDecoration: "none" }}><Phone size={14} /> {b.phone}</a>}
              {b.email && <a href={`mailto:${b.email}`} onClick={() => trackClick(handle, b.id)} className="er-btn er-btn-light er-btn-sm" style={{ textDecoration: "none" }}><Mail size={14} /> Email</a>}
            </div>
          )}
          {(b.products || []).length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>Products</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {b.products.map((p, i) => (
                  <div key={i} className="er-card" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", background: C.panel, color: C.muted, flexShrink: 0 }}><Store size={15} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: C.ink }}>{p.name}</div>
                      {p.note && <div style={{ fontSize: 12.5, color: C.muted }}>{p.note}</div>}
                    </div>
                    {p.url && <button className="er-btn er-btn-light er-btn-sm" style={{ flexShrink: 0 }} onClick={() => { trackClick(handle, b.id); openSite(p.url); }}>View</button>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </>)}
    </Modal>
  );
}

/* ---------- Brand onboarding ---------- */
function BrandModal({ onClose, onDone, onRefresh, onLogin }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "", phone: "", email: "", website: "", categories: [], city: "", online: false, commissionType: "percent", commissionPct: 15, commissionFlat: 25, discount: 0, photos: [], contacts: ["website"] });
  const [otp, setOtp] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleCat = (c) => set("categories", f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c]);
  const commValid = (f.commissionType === "percent" && f.commissionPct > 0) || (f.commissionType === "flat" && f.commissionFlat > 0) || (f.commissionType === "both" && f.commissionPct > 0 && f.commissionFlat > 0);
  const contactsFilled = !!f.website.trim();
  const valid = [f.name && f.phone.trim() && contactsFilled, f.categories.length > 0 && (f.online || f.city), commValid, otp.length >= 6];
  const titles = ["About your business", "Where to find you", "Your terms", "Verify your number"];

  const sendCode = async () => { setErr(""); try { await api("/otp/send", { method: "POST", body: { phone: f.phone } }); } catch (e) { setErr(e.message); } };
  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const vis = { hideWebsite: !f.contacts.includes("website"), hideEmail: !f.contacts.includes("email"), hidePhone: !f.contacts.includes("phone") };
      const r = await api("/business", { method: "POST", body: { ...f, ...vis, otp } });
      if (r && r.token) onLogin({ role: "brand", token: r.token, phone: f.phone, email: f.email });
      onRefresh(); onDone(f.name);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal onClose={onClose} wide>
      <div style={{ padding: "30px 28px" }}>
        <span className="er-eyebrow">List your business</span>
        <h2 className="er-serif" style={{ margin: "8px 0 4px", fontSize: 27, fontWeight: 500 }}>{titles[step]}</h2>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: C.muted }}>Step {step + 1} of 4 · You only pay creators when a referral converts.</p>
        <Stepper step={step} total={4} />
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          {step === 0 && <>
            <Field label="Brand, product, or app name"><input className="er-input" placeholder="Lumière Skincare, Focusly app, etc." value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Mobile number" hint="We'll text a 6-digit code. You'll sign in with this number from now on."><PhoneInput value={f.phone} onChange={(v) => set("phone", v)} /></Field>
            <Field label="Website" hint="The link customers visit — shown on your public page."><input className="er-input" placeholder="brand.com" value={f.website} onChange={(e) => set("website", e.target.value)} /></Field>
          </>}
          {step === 1 && <>
            <Field label="Categories" hint="Pick all that apply.">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CAT_LIST.map((c) => { const on = f.categories.includes(c); const cc = CATS[c];
                  return <button key={c} type="button" onClick={() => toggleCat(c)} style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, padding: "9px 15px", borderRadius: 999, border: `1px solid ${on ? cc.color : C.line}`, background: on ? cc.bg : "#fff", color: on ? cc.color : C.inkSoft }}>{c}</button>; })}
              </div>
            </Field>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 16px" }}>
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>Online business</div><div style={{ fontSize: 12.5, color: C.muted }}>Serve customers anywhere.</div></div>
              <button type="button" onClick={() => set("online", !f.online)} style={{ position: "relative", width: 46, height: 27, borderRadius: 99, border: "none", cursor: "pointer", background: f.online ? C.accent : "#CFC8BA", transition: "background .15s" }}>
                <span style={{ position: "absolute", top: 3, left: f.online ? 22 : 3, width: 21, height: 21, borderRadius: "50%", background: "#fff", transition: "left .15s" }} /></button>
            </div>
            <Field label="City" hint={f.online ? "Optional for online businesses." : "Where customers visit you."}><input className="er-input" placeholder="San Francisco" value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
          </>}
          {step === 2 && <>
            <Field label="How you'll reward creators" hint="Kept private — creators see it only when they generate a link.">
              <div style={{ display: "flex", gap: 8 }}>
                {[["percent", "Percentage"], ["flat", "Flat cash"], ["both", "Both"]].map(([t, lbl]) => { const on = f.commissionType === t;
                  return <button key={t} type="button" onClick={() => set("commissionType", t)} style={{ flex: 1, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, padding: "10px 8px", borderRadius: 10, border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff", color: on ? C.accentD : C.inkSoft }}>{lbl}</button>; })}
              </div>
            </Field>
            {(f.commissionType === "percent" || f.commissionType === "both") && <Field label="Percentage of each sale">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <input type="range" min="1" max="40" value={f.commissionPct} onChange={(e) => set("commissionPct", +e.target.value)} style={{ flex: 1, accentColor: C.accent }} />
                <span style={{ minWidth: 48, textAlign: "center", fontWeight: 700, fontSize: 14, padding: "5px 8px", borderRadius: 8, background: C.accentSoft, color: C.accentD }}>{f.commissionPct}%</span></div></Field>}
            {(f.commissionType === "flat" || f.commissionType === "both") && <Field label="Flat cash per sale" hint="A fixed amount paid on every conversion.">
              <div style={{ display: "flex", alignItems: "center", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 11, padding: "11px 14px", maxWidth: 180 }}>
                <span style={{ fontSize: 15, color: C.muted, marginRight: 2 }}>$</span>
                <input type="number" min="0" value={f.commissionFlat} onChange={(e) => set("commissionFlat", Math.max(0, +e.target.value))} style={{ flex: 1, border: "none", outline: "none", background: "none", fontFamily: "inherit", fontSize: 15, fontWeight: 600, color: C.ink, width: "100%" }} /></div></Field>}
            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px", fontSize: 13.5, color: C.inkSoft }}>Creators earn <b style={{ color: C.ink }}>{commValid ? commissionLabel(f) : "—"}</b> per sale.</div>
            <Field label="Customer perk" hint="Optional discount shown on your public listing.">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <input type="range" min="0" max="40" value={f.discount} onChange={(e) => set("discount", +e.target.value)} style={{ flex: 1, accentColor: C.accent }} />
                <span style={{ minWidth: 48, textAlign: "center", fontWeight: 700, fontSize: 14, padding: "5px 8px", borderRadius: 8, background: C.panel, color: C.ink }}>{f.discount}%</span></div></Field>
            {f.discount > 0 && <div style={{ background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.accentD, marginBottom: 4 }}>Shown to shoppers</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Get {f.discount}% off when you shop {f.name || "us"} through this link{f.website ? ` at ${f.website}` : ""}.</div>
            </div>}
          </>}
          {step === 3 && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 16px", fontSize: 14, color: C.inkSoft }}>Enter the 6-digit code we texted <b style={{ color: C.ink }}>{f.phone}</b>.</div>
            <Field label="Verification code">
              <input className="er-input" style={{ letterSpacing: ".35em", fontWeight: 700, textAlign: "center" }} placeholder="••••••" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} /></Field>
            <button className="er-link" onClick={sendCode} style={{ alignSelf: "flex-start" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Send size={14} /> Text me a code</span></button>
            <ErrBox msg={err} />
          </div>}
        </div>
        <div style={{ marginTop: 26, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {step > 0 ? <button className="er-btn er-btn-ghost" onClick={() => setStep(step - 1)}><ChevL size={16} /> Back</button> : <span />}
          {step < 3
            ? <button className="er-btn er-btn-primary" disabled={!valid[step]} onClick={() => { const next = step + 1; setStep(next); if (next === 3) sendCode(); }}>Continue <ChevR size={16} /></button>
            : <button className="er-btn er-btn-primary" disabled={!valid[3] || busy} onClick={submit}><Check size={16} /> {busy ? "Submitting…" : "Submit for review"}</button>}
        </div>
      </div>
    </Modal>
  );
}
function BrandSuccess({ name, onClose }) {
  return <Modal onClose={onClose}><div style={{ padding: 32, textAlign: "center" }}>
    <div style={{ margin: "0 auto", width: 56, height: 56, display: "grid", placeItems: "center" }}><Seal size={52} /></div>
    <h2 className="er-serif" style={{ margin: "16px 0 0", fontSize: 24, fontWeight: 500 }}>You're in the queue</h2>
    <p style={{ margin: "10px 0 0", fontSize: 14.5, color: C.inkSoft, lineHeight: 1.5 }}><b>{name}</b> was submitted for review. We approve every business before it's listed — you'll get a text once you're live.</p>
    <button className="er-btn er-btn-primary er-btn-block" style={{ marginTop: 24 }} onClick={onClose}>Done</button></div></Modal>;
}

/* ---------- Login ---------- */
function LoginModal({ onClose, onLogin, onAfterCreator, onAfterBrand }) {
  const [mode, setMode] = useState(null); // null | creator | brand
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  // creator
  const [cName, setCName] = useState("");
  // brand
  const [phone, setPhone] = useState(""); const [otp, setOtp] = useState(""); const [sent, setSent] = useState(false);

  const creatorLogin = async () => {
    setBusy(true); setErr("");
    try { const r = await api("/creator/login", { method: "POST", body: { username: cName } }); onLogin({ role: "creator", token: r.token, username: r.username }); onAfterCreator(r.username); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const sendCode = async () => { setErr(""); try { await api("/otp/send", { method: "POST", body: { phone } }); setSent(true); } catch (e) { setErr(e.message); } };
  const brandLogin = async () => {
    setBusy(true); setErr("");
    try { const r = await api("/business/login/verify", { method: "POST", body: { phone, otp } }); onLogin({ role: "brand", token: r.token, phone }); onAfterBrand(); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "30px 28px" }}>
        <span className="er-eyebrow">Welcome back</span>
        <h2 className="er-serif" style={{ margin: "8px 0 16px", fontSize: 27, fontWeight: 500 }}>Log in</h2>

        {!mode && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button className="er-card er-row-h" onClick={() => { setErr(""); setMode("creator"); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, textAlign: "left", cursor: "pointer" }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center", background: C.panel, color: C.ink }}><Spark size={18} /></span>
            <span style={{ flex: 1 }}><span style={{ display: "block", fontWeight: 600 }}>I'm a creator</span><span style={{ fontSize: 13, color: C.muted }}>Manage your profile and brands</span></span><ChevR size={18} color={C.muted} />
          </button>
          <button className="er-card er-row-h" onClick={() => { setErr(""); setMode("brand"); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, textAlign: "left", cursor: "pointer" }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center", background: C.panel, color: C.ink }}><Store size={18} /></span>
            <span style={{ flex: 1 }}><span style={{ display: "block", fontWeight: 600 }}>I'm a business</span><span style={{ fontSize: 13, color: C.muted }}>Edit your listing</span></span><ChevR size={18} color={C.muted} />
          </button>
        </div>}

        {mode === "creator" && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Username"><input className="er-input" placeholder="miaglow" value={cName} onChange={(e) => setCName(e.target.value)} /></Field>
          <ErrBox msg={err} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button className="er-btn er-btn-ghost" onClick={() => setMode(null)}><ChevL size={16} /> Back</button>
            <button className="er-btn er-btn-primary" disabled={!cName || busy} onClick={creatorLogin}>{busy ? "…" : "Log in"} <Arrow size={16} /></button>
          </div>
        </div>}

        {mode === "brand" && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Mobile number" hint="We'll text a code to the number you signed up with."><PhoneInput value={phone} onChange={setPhone} /></Field>
          {!sent ? <button className="er-btn er-btn-primary er-btn-block" disabled={!phone} onClick={sendCode}><Send size={16} /> Send code</button>
            : <>
              <Field label="Verification code"><input className="er-input" style={{ letterSpacing: ".35em", fontWeight: 700, textAlign: "center" }} placeholder="••••••" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} /></Field>
              <button className="er-btn er-btn-primary er-btn-block" disabled={otp.length < 6 || busy} onClick={brandLogin}>{busy ? "…" : "Log in"}</button>
            </>}
          <ErrBox msg={err} />
          <button className="er-btn er-btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => { setMode(null); setSent(false); }}><ChevL size={16} /> Back</button>
        </div>}
      </div>
    </Modal>
  );
}

/* ---------- My business (brand self-service) ---------- */
function BizEditCard({ b, token, reload }) {
  const [edit, setEdit] = useState(false); const [busy, setBusy] = useState(false);
  const [d, setD] = useState({ name: b.name, blurb: b.blurb || "", city: b.city || "", online: !!b.online, website: b.website || "", discount: b.discount || 0, categories: b.categories || [], commissionType: b.commissionType || "percent", commissionPct: b.commissionPct || 0, commissionFlat: b.commissionFlat || 0, photos: b.photos || [], products: b.products || [] });
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const addProduct = () => set("products", [...(d.products || []), { name: "", url: "", note: "" }]);
  const setProduct = (i, k, v) => set("products", d.products.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  const removeProduct = (i) => set("products", d.products.filter((_, j) => j !== i));
  const toggleCat = (c) => set("categories", d.categories.includes(c) ? d.categories.filter((x) => x !== c) : [...d.categories, c]);
  const onPhotos = async (e) => { const files = [...(e.target.files || [])]; if (!files.length) return; const urls = []; for (const file of files) { try { urls.push(await fileToDataURL(file, 1000, 0.82)); } catch (x) {} } set("photos", [...d.photos, ...urls].slice(0, 6)); e.target.value = ""; };
  const save = async () => { setBusy(true); try { await api(`/business/me/${b.id}`, { method: "PATCH", body: { token, ...d } }); setEdit(false); await reload(); } catch (e) { alert(e.message); } finally { setBusy(false); } };
  const cc = catOf(b);
  return (
    <div className="er-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 44, height: 44, borderRadius: 11, display: "grid", placeItems: "center", background: cc.bg, color: cc.color, flexShrink: 0, overflow: "hidden" }}>{(b.photos || [])[0] ? <img src={b.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Store size={18} />}</span>
        <div style={{ flex: 1, minWidth: 0 }}><p className="er-serif" style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>{b.name}</p>
          <p style={{ margin: 0, fontSize: 12.5, color: b.status === "approved" ? C.accent : "#B26A00", fontWeight: 600 }}>{b.status === "approved" ? "Live" : "Pending review"}</p></div>
        {!edit && <button className="er-btn er-btn-ghost er-btn-sm" onClick={() => setEdit(true)}><Edit size={14} /> Edit</button>}
      </div>
      {edit && <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Name"><input className="er-input" value={d.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Description"><textarea className="er-input" value={d.blurb} onChange={(e) => set("blurb", e.target.value)} /></Field>
        <Field label="Website"><input className="er-input" placeholder="brand.com" value={d.website} onChange={(e) => set("website", e.target.value)} /></Field>
        <Field label="Products" hint="List the products, apps, or services you want promoted — add as many as you like.">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(d.products || []).map((p, i) => (
              <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, paddingRight: 34, display: "flex", flexDirection: "column", gap: 8, position: "relative", background: C.panel }}>
                <input className="er-input" placeholder="Product name" value={p.name || ""} onChange={(e) => setProduct(i, "name", e.target.value)} />
                <input className="er-input" placeholder="Link (optional)" value={p.url || ""} onChange={(e) => setProduct(i, "url", e.target.value)} />
                <input className="er-input" placeholder="Short note (optional)" value={p.note || ""} onChange={(e) => setProduct(i, "note", e.target.value)} />
                <button type="button" onClick={() => removeProduct(i)} title="Remove" style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", color: C.muted, display: "grid", placeItems: "center" }}><Close size={15} /></button>
              </div>
            ))}
            <button type="button" className="er-btn er-btn-light er-btn-sm" style={{ alignSelf: "flex-start" }} onClick={addProduct}><Plus size={14} /> Add product</button>
          </div>
        </Field>
        <Field label="Categories">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CAT_LIST.map((c) => { const on = d.categories.includes(c); const x = CATS[c];
              return <button key={c} type="button" onClick={() => toggleCat(c)} style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, padding: "8px 13px", borderRadius: 999, border: `1px solid ${on ? x.color : C.line}`, background: on ? x.bg : "#fff", color: on ? x.color : C.inkSoft }}>{c}</button>; })}
          </div>
        </Field>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Field label="City"><input className="er-input" style={{ width: 160 }} value={d.city} onChange={(e) => set("city", e.target.value)} /></Field>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600 }}>
            <button type="button" onClick={() => set("online", !d.online)} style={{ position: "relative", width: 44, height: 26, borderRadius: 99, border: "none", cursor: "pointer", background: d.online ? C.accent : "#CFC8BA" }}><span style={{ position: "absolute", top: 3, left: d.online ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff" }} /></button> Online
          </label>
        </div>
        <Field label="Customer perk (%)"><input type="number" className="er-input" style={{ width: 120 }} value={d.discount} onChange={(e) => set("discount", +e.target.value)} /></Field>
        <Field label="Creator reward" hint="Private — only creators see it.">
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            {[["percent", "%"], ["flat", "$"], ["both", "Both"]].map(([t, l]) => { const on = d.commissionType === t;
              return <button key={t} type="button" onClick={() => set("commissionType", t)} style={{ flex: 1, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "8px", borderRadius: 9, border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff", color: on ? C.accentD : C.inkSoft }}>{l}</button>; })}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {(d.commissionType === "percent" || d.commissionType === "both") && <input type="number" className="er-input" style={{ width: 100 }} placeholder="%" value={d.commissionPct} onChange={(e) => set("commissionPct", +e.target.value)} />}
            {(d.commissionType === "flat" || d.commissionType === "both") && <input type="number" className="er-input" style={{ width: 100 }} placeholder="$" value={d.commissionFlat} onChange={(e) => set("commissionFlat", +e.target.value)} />}
          </div>
        </Field>
        <Field label="Photos">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {d.photos.map((src, i) => <div key={i} style={{ position: "relative", width: 64, height: 64, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.line}` }}><img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /><button type="button" onClick={() => set("photos", d.photos.filter((_, j) => j !== i))} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", border: "none", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.3)", cursor: "pointer", display: "grid", placeItems: "center", color: C.muted }}><Close size={10} /></button></div>)}
            {d.photos.length < 6 && <label style={{ width: 64, height: 64, borderRadius: 10, border: `2px dashed ${C.line}`, display: "grid", placeItems: "center", cursor: "pointer", color: C.muted }}><Plus size={18} /><input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onPhotos} /></label>}
          </div>
        </Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="er-btn er-btn-ghost er-btn-sm" onClick={() => setEdit(false)}>Cancel</button>
          <button className="er-btn er-btn-primary er-btn-sm" disabled={busy} onClick={save}><Check size={14} /> {busy ? "Saving…" : "Save"}</button>
        </div>
      </div>}
    </div>
  );
}
function ReqDecision({ r, onDecide }) {
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const decided = r.status !== "pending";
  const act = async (status) => { setBusy(true); try { await onDecide(r.id, status, msg); } catch (e) { alert(e.message); } finally { setBusy(false); } };
  const badge = r.status === "approved" ? { t: "Approved", c: C.accent, bg: C.accentSoft } : { t: "Rejected", c: "#9B3024", bg: "#FBE9E7" };
  return (
    <div className="er-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name={r.influencer} image={r.image} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>@{r.influencer}{r.followers > 0 && <span style={{ fontWeight: 600, color: C.accent }}> · {r.followersLabel} followers</span>}</div>
          <div style={{ fontSize: 12.5, color: C.muted }}>{r.businessName}</div>
        </div>
        {decided && <span style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: badge.bg, color: badge.c }}>{badge.t}</span>}
      </div>
      <div style={{ marginTop: 12, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px" }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.muted }}>Requested commission</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginTop: 2 }}>{r.requested}</div>
        {r.note && <p style={{ margin: "8px 0 0", fontSize: 13.5, color: C.inkSoft, lineHeight: 1.4 }}>&ldquo;{r.note}&rdquo;</p>}
      </div>
      {decided ? (r.brandMessage ? <p style={{ margin: "10px 0 0", fontSize: 13, color: C.muted }}>Your reply: &ldquo;{r.brandMessage}&rdquo;</p> : null)
        : <>
          <textarea className="er-input" style={{ marginTop: 10 }} placeholder="Optional message back to the creator…" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
            <button className="er-btn er-btn-primary er-btn-sm" disabled={busy} onClick={() => act("approved")}><Check size={14} /> Approve</button>
            <button className="er-btn er-btn-ghost er-btn-sm" disabled={busy} onClick={() => act("rejected")}><Close size={14} /> Reject</button>
          </div>
        </>}
    </div>
  );
}
const STRIPE_PK = "pk_live_51KLZlpDW3FwkTm7hlBeiuq9CrbzprsKJ6japvWBhrcaJvY7i4jhzBFvPj1bCOJmYX5mpQDU3FXL2jB8zR1TphQkZ00sCZhaEsZ";
const PLANS = [
  { key: "starter", amount: 70, title: "Starter", tag: "Up to 500 creators",
    points: [
      { t: "Get your App/Website recommended by up to 1000+ influencers", hint: "A recommendation means an influencer features your product with a testimonial and adds your link to their recommendation list, which they put in their bio." },
      { t: "See influencer requests — approve or reject them" },
    ] },
  { key: "growth", amount: 159, title: "Growth", tag: "Up to 1,000 creators", featured: true,
    points: [
      { t: "Get your product recommended by up to 1,000+ influencers" },
      { t: "Get your product promoted by up to 1,000+ influencers", hint: "A promotion means an influencer publishes an organic or sponsored post about your product." },
      { t: "Everything in Starter" },
    ] },
  { key: "premium", amount: 499, title: "Professional", tag: "Up to 2,000 creators", premium: true,
    points: [
      { t: "Get your product recommended by up to 2,000+ influencers" },
      { t: "Get your product promoted by up to 1,000+ influencers", hint: "A promotion means an influencer publishes an organic or sponsored post about your product." },
      { t: "Everything in Growth and Starter" },
    ] },
];
function loadCheckout() {
  return new Promise((resolve, reject) => {
    if (window.StripeCheckout) return resolve(window.StripeCheckout);
    const s = document.createElement("script");
    s.src = "https://checkout.stripe.com/checkout.js";
    s.onload = () => resolve(window.StripeCheckout);
    s.onerror = () => reject(new Error("Couldn't load Stripe Checkout."));
    document.body.appendChild(s);
  });
}
async function payWithCheckout({ plan, business, sessionToken, onPaid, onErr }) {
  const host = (typeof window !== "undefined" && window.location.hostname) || "";
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host.endsWith(".local");
  let devPay = false;
  try { devPay = localStorage.getItem("er_devpay") === "ronak-skip-1997"; } catch (e) {}
  if (isLocal || devPay) {
    // Local dev / dev-flag: bypass Stripe entirely and unlock so you can test without paying.
    try {
      await api("/business/pay", { method: "POST", body: { token: sessionToken, plan: plan.key, amount: plan.amount, chargeId: "dev_test_" + Date.now() } });
      onPaid();
    } catch (e) { onErr(e.message); }
    return;
  }
  try {
    const StripeCheckout = await loadCheckout();
    const handler = StripeCheckout.configure({
      key: STRIPE_PK, locale: "auto", name: "Easy Recommend",
      description: `${plan.title} — ${plan.tag}`, currency: "usd", amount: plan.amount * 100,
      email: business.email || "", panelLabel: "Pay {{amount}}",
      token: async (token) => {
        try {
          const res = await fetch("https://learntok-backend-2026-24c204fe508e.herokuapp.com/partyevents/paycharge", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: business.name, amount: plan.amount, token: token.id, email: token.email || business.email || "", customerName: (token.card && token.card.name) || "", phoneNumber: business.phone || "", streetAddress: "" }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) throw new Error(data.error || "Card was declined.");
          await api("/business/pay", { method: "POST", body: { token: sessionToken, plan: plan.key, amount: plan.amount, chargeId: data.chargeId || "" } });
          onPaid();
        } catch (e) { onErr(e.message); }
      },
    });
    api("/business/pay-start", { method: "POST", body: { token: sessionToken, plan: plan.key, amount: plan.amount } }).catch(() => {});
    handler.open();
  } catch (e) { onErr(e.message); }
}
function WhyOneTimeLink({ center }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div style={{ textAlign: center ? "center" : "left" }}>
        <button onClick={() => setOpen(true)} className="er-link" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, color: C.accentD, fontWeight: 600, textDecoration: "underline" }}>Why a one-time fee instead of monthly?</button>
      </div>
      {open && <Modal onClose={() => setOpen(false)}>
        <div style={{ padding: "30px 28px" }}>
          <h2 className="er-serif" style={{ margin: "0 0 12px", fontSize: 23, fontWeight: 500 }}>Why we charge a one-time fee, not monthly</h2>
          <p style={{ margin: "0 0 12px", fontSize: 14.5, lineHeight: 1.6, color: C.inkSoft }}>Commissions and conversions don't happen overnight. Influencer marketing is a long game: it takes time for creators to discover your product, post about it, and for their audiences to act.</p>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: C.inkSoft }}>Because results compound over months rather than days, we charge a single one-time fee that covers your full 12-month campaign — no recurring bills and no pressure to cancel. You focus on the outcomes, not a monthly subscription.</p>
          <button className="er-btn er-btn-primary er-btn-sm" style={{ marginTop: 22 }} onClick={() => setOpen(false)}>Got it</button>
        </div>
      </Modal>}
    </>
  );
}
function Paywall({ business, sessionToken, onPaid }) {
  const [busy, setBusy] = useState(""); const [err, setErr] = useState("");
  const ghost = ["████ ██████ ███", "███████ ██ █████", "█████ ████████ ██", "██████ ███ ███████", "████████ █ ████"];
  const choose = (p) => { setErr(""); setBusy(p.key); payWithCheckout({ plan: p, business, sessionToken, onPaid, onErr: (m) => { setErr(m); setBusy(""); } }); };
  return (
    <div>
      <div style={{ position: "relative", minHeight: 230 }}>
        <div aria-hidden style={{ filter: "blur(7px)", opacity: 0.5, userSelect: "none", pointerEvents: "none", display: "flex", flexDirection: "column", gap: 12 }}>
          {ghost.map((g, i) => <div key={i} className="er-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 38, height: 38, borderRadius: "50%", background: C.line, flexShrink: 0 }} />
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, color: C.ink }}>{g}</div><div style={{ fontSize: 12.5, color: C.muted }}>████████ ████</div></div>
            <span style={{ width: 72, height: 26, borderRadius: 8, background: C.line, flexShrink: 0 }} />
          </div>)}
        </div>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 16 }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ width: 48, height: 48, borderRadius: 14, display: "inline-grid", placeItems: "center", background: C.ink, color: C.paper }}><Lock size={22} /></span>
            <p className="er-serif" style={{ margin: "12px 0 0", fontSize: 23, fontWeight: 500 }}>Unlock Influencer Requests</p>
            <p style={{ margin: "4px auto 0", fontSize: 14, color: C.muted, maxWidth: 380 }}>Choose the Starter plan to view the influencer request. Upgrade to the Growth plan to unlock the full list of influencers and send recommendation requests to any of them.</p>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 30, display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(212px,1fr))" }}>
        {PLANS.map((p) => <div key={p.key} className="er-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12, border: p.featured ? `2px solid ${C.accent}` : `1px solid ${C.line}`, position: "relative" }}>
          {p.featured && <span style={{ position: "absolute", top: -11, left: 18, background: C.accent, color: "#fff", fontSize: 10.5, fontWeight: 700, letterSpacing: ".04em", padding: "3px 10px", borderRadius: 999 }}>MOST POPULAR</span>}
          <div><div className="er-serif" style={{ fontSize: 20, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>{p.title}{p.premium && <Seal size={16} />}</div><div style={{ fontSize: 13, color: C.muted }}>{p.tag}</div></div>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.ink }}>${p.amount}<span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}> one-time</span></div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {p.points.map((pt, i) => <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: pt.off ? C.muted : C.inkSoft, lineHeight: 1.4 }}><span style={{ color: pt.off ? C.muted : C.accent, flexShrink: 0, marginTop: 1 }}>{pt.off ? <Close size={15} /> : <Check size={15} />}</span><span>{pt.t}{pt.hint && <span style={{ display: "block", fontSize: 11.5, color: C.muted, marginTop: 3, lineHeight: 1.4 }}>{pt.hint}</span>}</span></li>)}
          </ul>
          <button className="er-btn er-btn-primary er-btn-block" style={{ marginTop: "auto" }} disabled={!!busy} onClick={() => choose(p)}>{busy === p.key ? "Opening…" : `Choose ${p.title}`}</button>
        </div>)}
      </div>
      <div style={{ marginTop: 16 }}><WhyOneTimeLink center /></div>
      {err && <div style={{ marginTop: 14 }}><ErrBox msg={err} /></div>}
    </div>
  );
}
function VerifyNotice({ onClose }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "30px 28px" }}>
        <span style={{ width: 48, height: 48, borderRadius: 14, display: "inline-grid", placeItems: "center", background: C.accentSoft, color: C.accentD }}><Check size={24} /></span>
        <h2 className="er-serif" style={{ margin: "14px 0 4px", fontSize: 24, fontWeight: 500 }}>Payment received — thank you!</h2>
        <p style={{ margin: "0 0 16px", fontSize: 14.5, lineHeight: 1.6, color: C.inkSoft }}>Before promotion begins, we review every product for compliance.</p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
          <li style={{ display: "flex", gap: 10, fontSize: 13.5, color: C.inkSoft, lineHeight: 1.5 }}><span style={{ color: C.accent, flexShrink: 0, marginTop: 1 }}><Seal size={16} /></span><span>For GDPR and consumer-protection compliance, we verify your product before creators are matched. This usually takes up to <b>24 hours</b>.</span></li>
          <li style={{ display: "flex", gap: 10, fontSize: 13.5, color: C.inkSoft, lineHeight: 1.5 }}><span style={{ color: C.accent, flexShrink: 0, marginTop: 1 }}><Lock size={16} /></span><span>Adult products, regulated goods, and anything unsafe or illegal are not permitted and won't be approved. If your product can't be verified, you'll receive a full refund.</span></li>
          <li style={{ display: "flex", gap: 10, fontSize: 13.5, color: C.inkSoft, lineHeight: 1.5 }}><span style={{ color: C.accent, flexShrink: 0, marginTop: 1 }}><Send size={16} /></span><span>We'll notify you once verification is complete and promotion goes live.</span></li>
        </ul>
        <button className="er-btn er-btn-primary er-btn-block" style={{ marginTop: 22 }} onClick={onClose}>Got it</button>
      </div>
    </Modal>
  );
}
function MyBusiness({ session, onBack, onRefresh }) {
  const [tab, setTab] = useState("info");
  const [rows, setRows] = useState(null); const [err, setErr] = useState("");
  const [reqs, setReqs] = useState(null);
  const t = encodeURIComponent(session.token);
  const reload = async () => { try { setRows(await api(`/business/me?token=${t}`)); setErr(""); } catch (e) { setErr(e.message); } onRefresh(); };
  const reloadReqs = async () => { try { setReqs(await api(`/business/me/requests?token=${t}`)); } catch (e) { setReqs([]); } };
  useEffect(() => { reload(); }, []);
  const paid = (rows || []).some((b) => b.paid);
  const premium = (rows || []).some((b) => b.premium);
  const business = (rows || [])[0] || null;
  useEffect(() => { if (paid) reloadReqs(); }, [paid]);
  const decide = async (id, status, message) => { await api(`/business/request/${id}`, { method: "PATCH", body: { token: session.token, status, message } }); await reloadReqs(); };
  const pending = (reqs || []).filter((r) => r.status === "pending").length;
  const [showVerify, setShowVerify] = useState(false);
  const onPaid = async () => { await reload(); setTab("promo"); setShowVerify(true); };
  const tabs = [["info", "My information"], ["promo", paid ? `Requests${pending ? ` · ${pending}` : ""}` : "Approve/Reject Influencer request"]];
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 22px 80px" }}>
      {showVerify && <VerifyNotice onClose={() => setShowVerify(false)} />}
      <button className="er-link" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}><ChevL size={15} /> Back to site</button>
      <h1 className="er-serif" style={{ margin: 0, fontSize: 32, fontWeight: 500 }}>My business</h1>
      <p style={{ margin: "6px 0 20px", fontSize: 14.5, color: C.muted }}>Edit your listing for free. Unlock creator promotion and requests with a one-time plan.</p>
      <div style={{ display: "flex", gap: 26, borderBottom: `1px solid ${C.line}`, marginBottom: 22, flexWrap: "wrap" }}>
        {tabs.map(([k, lbl]) => <button key={k} onClick={() => setTab(k)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 600, padding: "12px 0", color: tab === k ? C.ink : C.muted, borderBottom: `2.5px solid ${tab === k ? C.accent : "transparent"}`, marginBottom: -1, display: "inline-flex", alignItems: "center", gap: 7 }}>{lbl}{k === "promo" && !paid && <Lock size={15} />}</button>)}
      </div>
      {err && <p style={{ background: "#FBE9E7", border: "1px solid #F3C5BD", borderRadius: 12, padding: "12px 14px", fontSize: 13.5, color: "#9B3024" }}>{err}</p>}

      {tab === "info" && <>
        {rows === null && !err && <p style={{ color: C.muted }}>Loading…</p>}
        {rows && rows.length === 0 && <p style={{ background: C.panel, borderRadius: 14, padding: "32px 0", textAlign: "center", color: C.muted }}>No business found on this account.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{(rows || []).map((b) => <BizEditCard key={b.id} b={b} token={session.token} reload={reload} />)}</div>
      </>}

      {tab === "promo" && (rows === null
        ? <p style={{ color: C.muted }}>Loading…</p>
        : paid
          ? <>
            <div style={{ background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: 14, padding: "14px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: C.accentD, display: "flex" }}>{premium ? <Seal size={20} /> : <Check size={20} />}</span>
              <div style={{ fontSize: 13.5, color: C.accentD }}><b>You're live for promotion{premium ? " · Premium" : ""}.</b> Creators are being matched to your brand. Their requests show up below.</div>
            </div>
            {reqs === null && <p style={{ color: C.muted }}>Loading…</p>}
            {reqs && reqs.length === 0 && <p style={{ background: C.panel, borderRadius: 14, padding: "32px 0", textAlign: "center", color: C.muted }}>No commission requests yet. When a creator asks for a higher rate, it shows up here.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{(reqs || []).map((r) => <ReqDecision key={r.id} r={r} onDecide={decide} />)}</div>
          </>
          : business ? <Paywall business={business} sessionToken={session.token} onPaid={onPaid} /> : <p style={{ color: C.muted }}>No business found.</p>)}
    </div>
  );
}
function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(value); } catch (e) { } setCopied(true); setTimeout(() => setCopied(false), 1600); };
  return <div>
    <p style={{ margin: "0 0 7px", fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.muted }}>{label}</p>
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 11, padding: "10px 12px" }}>
      <code style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13.5, color: C.ink }}>{value}</code>
      <button onClick={copy} className="er-btn er-btn-light er-btn-sm" style={{ color: copied ? C.accent : C.ink }}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</button></div></div>;
}
function CreatorModal({ businesses, initialBusinessId, onClose, onRefresh, onLogin, onViewProfile }) {
  const sess = getSession();
  const loggedIn = sess && sess.role === "creator";
  const [step, setStep] = useState(loggedIn ? 1 : 0);
  const [username, setUsername] = useState(loggedIn ? sess.username : ""); const [image, setImage] = useState(""); const [followers, setFollowers] = useState("");
  const [token, setToken] = useState(loggedIn ? sess.token : "");
  const [picked, setPicked] = useState(initialBusinessId ? [initialBusinessId] : []);
  const [reviews, setReviews] = useState({});
  const [query, setQuery] = useState("");
  const approved = businesses;
  const initialCat = initialBusinessId ? ((approved.find((b) => b.id === initialBusinessId)?.categories || [])[0] || null) : null;
  const [openCat, setOpenCat] = useState(initialCat);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [results, setResults] = useState(null);
  const [genId, setGenId] = useState(null);
  const aiReview = async (id, name, stars) => {
    setGenId(id); setErr("");
    try { const r = await api("/review/generate", { method: "POST", body: { businessName: name, stars: stars || 5, token } }); if (r && r.text) setReview(id, { text: r.text }); }
    catch (e) { setErr(e.message); } finally { setGenId(null); }
  };
  const handle = loggedIn ? sess.username : slugify(username);
  const RATING = ["", "Poor", "Fair", "Good", "Great", "Exceptional"];

  const toggle = (id) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const setReview = (id, patch) => setReviews((prev) => ({ ...prev, [id]: { stars: 0, text: "", ...prev[id], ...patch } }));
  const onPhoto = async (e) => { const file = e.target.files && e.target.files[0]; if (!file) return; try { setImage(await fileToDataURL(file, 400, 0.85)); } catch (x) {} };
  const join = async () => {
    setBusy(true); setErr("");
    try {
      const r = await api("/influencer", { method: "POST", body: { username: handle, image, followers: Number(followers) || 0 } });
      setToken(r.token); onLogin({ role: "creator", token: r.token, username: r.username }); setStep(1);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const finish = async () => {
    setBusy(true); setErr("");
    try {
      const out = [];
      for (const id of picked) {
        const r = reviews[id] || {}; const body = { token, businessId: id };
        if (r.stars > 0) { body.stars = r.stars; body.text = r.text || ""; }
        const res = await api("/creator/link", { method: "POST", body });
        const b = approved.find((x) => x.id === id);
        out.push({ ...res, name: b ? b.name : "" });
      }
      setResults(out); setStep(3); onRefresh();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const q = query.trim().toLowerCase();
  const match = (b) => !q || (b.name || "").toLowerCase().includes(q);
  const byCat = {}; approved.forEach((b) => { if (!(b && b.name && b.name.trim())) return; const c = ((b.categories || []).find((x) => CATS[x])) || "Other"; (byCat[c] = byCat[c] || []).push(b); });
  const cats = CAT_LIST.filter((c) => byCat[c]);
  const noMatches = q && cats.every((c) => !byCat[c].filter(match).length);

  return (
    <Modal onClose={onClose} wide>
      <div style={{ padding: "30px 28px" }}>
        {step < 3 && <><span className="er-eyebrow">For creators</span><div style={{ marginTop: 12 }}><Stepper step={step} total={3} /></div></>}
        {step === 0 && <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <div><h2 className="er-serif" style={{ margin: 0, fontSize: 27, fontWeight: 500 }}>Set up your profile</h2><p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted }}>A photo, a username, and your following — that's the whole profile.</p></div>
          <Field label="Profile photo">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {image ? <img src={image} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} /> : <span style={{ width: 64, height: 64, borderRadius: "50%", display: "grid", placeItems: "center", background: C.ink, color: C.paper }}><Spark size={24} /></span>}
              <label className="er-btn er-btn-light er-btn-sm" style={{ cursor: "pointer" }}>{image ? "Change photo" : "Upload photo"}<input type="file" accept="image/*" style={{ display: "none" }} onChange={onPhoto} /></label>
            </div></Field>
          <Field label="Username" hint="This becomes your public profile link.">
            <div style={{ display: "flex", alignItems: "center", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 11, padding: "11px 14px" }}>
              <span style={{ fontSize: 14.5, color: C.muted }}>easyrecommend.co/@</span>
              <input style={{ flex: 1, border: "none", outline: "none", background: "none", fontSize: 14.5, fontFamily: "inherit", color: C.ink }} placeholder="yourname" value={username} onChange={(e) => setUsername(e.target.value)} /></div></Field>
          <Field label="Follower count" hint="Your total audience across platforms. Brands see this when you request commission.">
            <input className="er-input" type="number" min="0" placeholder="e.g. 188000" value={followers} onChange={(e) => setFollowers(e.target.value)} /></Field>
          <button className="er-btn er-btn-primary er-btn-block" disabled={!handle || busy} onClick={join}>{busy ? "Checking…" : <>Continue <Arrow size={16} /></>}</button>
          <ErrBox msg={err} />
        </div>}

        {step === 1 && <div style={{ marginTop: 22 }}>
          <h2 className="er-serif" style={{ margin: 0, fontSize: 27, fontWeight: 500 }}>Pick businesses to back</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted }}>Choose as many as you like — we generate a tracked link for each, so you earn on every sale.</p>
          <div style={{ marginTop: 16, position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted, display: "flex" }}><Search size={16} /></span>
            <input className="er-input" style={{ paddingLeft: 38 }} placeholder="Search brands" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {picked.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {picked.map((id) => { const b = approved.find((x) => x.id === id); if (!b) return null;
              return <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.ink, color: C.paper, borderRadius: 999, padding: "5px 6px 5px 12px", fontSize: 13, fontWeight: 600 }}>{b.name}<button onClick={() => toggle(id)} style={{ display: "grid", placeItems: "center", width: 18, height: 18, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.22)", color: C.paper, cursor: "pointer" }}><Close size={11} /></button></span>; })}
          </div>}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12, maxHeight: 420, overflowY: "auto", paddingRight: 2 }}>
            {cats.map((c) => { const all = byCat[c]; const list = all.filter(match); if (q && !list.length) return null; const open = q ? true : openCat === c; const x = CATS[c] || CATS.Beauty; const selCount = all.filter((b) => picked.includes(b.id)).length;
              return <div key={c} style={{ border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden", background: "#fff", flexShrink: 0 }}>
                <button type="button" onClick={() => { if (!q) setOpenCat(open ? null : c); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, minHeight: 64, padding: "16px", background: open ? x.bg : C.panel, border: "none", cursor: q ? "default" : "pointer", textAlign: "left" }}>
                  <span style={{ width: 13, height: 13, borderRadius: "50%", background: x.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 16.5, lineHeight: 1.2, color: C.ink }}>{c}</span>
                  {selCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: x.color, borderRadius: 999, padding: "4px 11px", flexShrink: 0 }}>{selCount} picked</span>}
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: C.muted, flexShrink: 0 }}>{list.length}</span>
                  <span style={{ color: C.muted, display: "flex", flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}><ChevR size={17} /></span>
                </button>
                {open && <div style={{ borderTop: `1px solid ${C.line}` }}>
                  {list.map((b) => { const on = picked.includes(b.id); const bt = tintFor(b.id || b.name); const photo = (b.photos || [])[0];
                    return <button key={b.id} type="button" onClick={() => toggle(b.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, textAlign: "left", padding: "14px 16px", border: "none", borderTop: `1px solid ${C.line}`, background: on ? C.accentSoft : "#fff", cursor: "pointer" }}>
                      <span style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: "grid", placeItems: "center", border: `1.5px solid ${on ? C.accent : "#CFC8BA"}`, background: on ? C.accent : "#fff", color: "#fff" }}>{on && <Check size={15} />}</span>
                      <span style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center", background: bt.bg, color: bt.color, overflow: "hidden" }}>{photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Store size={16} />}</span>
                      <span style={{ minWidth: 0, flex: 1 }}><span style={{ display: "block", fontWeight: 600, fontSize: 15, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span><span style={{ display: "block", fontSize: 13, color: C.muted, marginTop: 1 }}>{b.online ? "Online" : (b.city || "—")}</span></span>
                    </button>; })}
                </div>}
              </div>; })}
            {!cats.length && <p style={{ textAlign: "center", color: C.muted, fontSize: 13.5, padding: "24px 0" }}>No live businesses yet — check back soon.</p>}
            {noMatches && <p style={{ textAlign: "center", color: C.muted, fontSize: 13.5, padding: "20px 0" }}>No brands match &ldquo;{query}&rdquo;.</p>}
          </div>
          <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {loggedIn ? <span /> : <button className="er-btn er-btn-ghost" onClick={() => setStep(0)}><ChevL size={16} /> Back</button>}
            <button className="er-btn er-btn-primary" disabled={!picked.length} onClick={() => setStep(2)}>Continue{picked.length ? ` · ${picked.length}` : ""} <ChevR size={16} /></button></div>
        </div>}

        {step === 2 && <div style={{ marginTop: 22 }}>
          <h2 className="er-serif" style={{ margin: 0, fontSize: 27, fontWeight: 500 }}>Add your reviews</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted }}>A rating and a note for each brand show on your profile. All optional — but it's what builds trust.</p>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12, maxHeight: 380, overflowY: "auto" }}>
            {picked.map((id) => { const b = approved.find((x) => x.id === id); if (!b) return null; const r = reviews[id] || { stars: 0, text: "" }; const cc = catOf(b);
              return <div key={id} style={{ border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 9, display: "grid", placeItems: "center", background: cc.bg, color: cc.color, flexShrink: 0 }}><Store size={16} /></span>
                  <span style={{ fontWeight: 600, fontSize: 15.5, color: C.ink, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: r.stars ? C.accent : C.muted }}>{r.stars ? RATING[r.stars] : "Optional"}</span>
                </div>
                <div style={{ marginTop: 10 }}><StarPicker value={r.stars} onChange={(v) => setReview(id, { stars: v })} /></div>
                {r.stars > 0 && <div style={{ marginTop: 10 }}>
                  <textarea className="er-input" placeholder={`What did you love about ${b.name}?`} value={r.text} onChange={(e) => setReview(id, { text: e.target.value })} />
                  <button type="button" onClick={() => aiReview(id, b.name, r.stars)} disabled={genId === id} style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: C.accentD, background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: 999, padding: "6px 12px", cursor: genId === id ? "default" : "pointer", opacity: genId === id ? 0.7 : 1 }}><Spark size={13} /> {genId === id ? "Writing…" : (r.text ? "Rewrite with AI" : "Write with AI")}</button>
                </div>}
              </div>; })}
          </div>
          <ErrBox msg={err} />
          <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button className="er-btn er-btn-ghost" onClick={() => setStep(1)} disabled={busy}><ChevL size={16} /> Back</button>
            <button className="er-btn er-btn-primary" onClick={finish} disabled={busy}><Spark size={16} /> {busy ? "Generating…" : `Generate ${picked.length > 1 ? `${picked.length} links` : "my link"}`}</button></div>
        </div>}

        {step === 3 && results && <div style={{ paddingTop: 6 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ margin: "0 auto", width: 56, height: 56, display: "grid", placeItems: "center" }}><Seal size={50} /></div>
            <h2 className="er-serif" style={{ margin: "14px 0 0", fontSize: 24, fontWeight: 500 }}>{results.length > 1 ? `You're backing ${results.length} brands` : "Your link is live"}</h2>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: C.muted }}>Share each referral link to earn, and drop your profile in your bio.</p>
          </div>
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14, textAlign: "left", maxHeight: 300, overflowY: "auto" }}>
            {results.map((r, i) => <CopyRow key={i} label={`${r.name} · earn ${r.earns}`} value={r.referralUrl} />)}
            <CopyRow label="Your profile · add to bio" value={results[0].profileUrl} />
          </div>
          <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="er-btn er-btn-ghost" onClick={onClose}>Close</button>
            <button className="er-btn er-btn-primary" onClick={() => { onViewProfile(handle); onClose(); }}>View my profile <Arrow size={16} /></button></div>
        </div>}
      </div>
    </Modal>
  );
}

/* ---------- Admin (fetches its own list) ---------- */
function VisToggle({ label, value, sub, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0" }}>
      <button type="button" onClick={() => onChange(!value)} style={{ position: "relative", width: 42, height: 25, borderRadius: 99, border: "none", cursor: "pointer", background: value ? C.accent : "#CFC8BA", flexShrink: 0 }}><span style={{ position: "absolute", top: 3, left: value ? 20 : 3, width: 19, height: 19, borderRadius: "50%", background: "#fff" }} /></button>
      <span style={{ minWidth: 0 }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: C.ink }}>{label}</span>{sub && <span style={{ display: "block", fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</span>}</span>
    </label>
  );
}
function AdminRow({ b, reload }) {
  const [editing, setEditing] = useState(false); const [busy, setBusy] = useState(false);
  const init = () => ({
    name: b.name || "", blurb: b.blurb || "", website: b.website || "", categories: b.categories || [],
    city: b.city || "", online: !!b.online, commissionType: b.commissionType || "percent",
    commissionPct: b.commissionPct || 0, commissionFlat: b.commissionFlat || 0, discount: b.discount || 0,
    photos: b.photos || [], phone: b.phone || "", email: b.email || "",
    hidePhone: !!b.hidePhone, hideEmail: !!b.hideEmail, hideWebsite: !!b.hideWebsite,
  });
  const [d, setDraft] = useState(init);
  const set = (k, v) => setDraft((p) => ({ ...p, [k]: v }));
  const cc = catOf(b);
  const act = async (fn) => { try { await fn(); await reload(); } catch (e) { alert(e.message); } };
  const onPhotos = async (e) => { const files = [...(e.target.files || [])]; if (!files.length) return; const urls = []; for (const file of files) { try { urls.push(await fileToDataURL(file, 1000, 0.82)); } catch (x) {} } set("photos", [...d.photos, ...urls].slice(0, 6)); e.target.value = ""; };
  const toggleCat = (c) => set("categories", d.categories.includes(c) ? d.categories.filter((x) => x !== c) : [...d.categories, c]);
  const save = async (then) => { setBusy(true); try { await api(`/admin/business/${b._id}`, { method: "PATCH", admin: true, body: d }); if (then) await then(); setEditing(false); await reload(); } catch (e) { alert(e.message); } finally { setBusy(false); } };
  const openEdit = () => { setDraft(init()); setEditing(true); };

  return (
    <div className="er-card" style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 44, height: 44, borderRadius: 11, display: "grid", placeItems: "center", background: cc.bg, color: cc.color, flexShrink: 0, overflow: "hidden" }}>{(b.photos || [])[0] ? <img src={b.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Store size={18} />}</span>
        <div style={{ minWidth: 0, flex: 1 }}><p className="er-serif" style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>{b.name}</p><p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>{(b.categories || []).join(", ") || "No category"} · {b.online ? "Online" : (b.city || "—")}</p></div>
        {!editing && <><span style={{ fontSize: 12, fontWeight: 700, padding: "5px 9px", borderRadius: 8, background: C.accentSoft, color: C.accentD, whiteSpace: "nowrap" }}>{commissionLabel(b)}</span>{b.discount > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 9px", borderRadius: 8, background: C.panel, color: C.ink }}>{b.discount}% off</span>}</>}
      </div>

      {editing && <div style={{ display: "flex", flexDirection: "column", gap: 14, borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
        <Field label="Name"><input className="er-input" value={d.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Description"><textarea className="er-input" value={d.blurb} onChange={(e) => set("blurb", e.target.value)} /></Field>
        <Field label="Categories">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CAT_LIST.map((c) => { const on = d.categories.includes(c); const x = CATS[c];
              return <button key={c} type="button" onClick={() => toggleCat(c)} style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "7px 12px", borderRadius: 999, border: `1px solid ${on ? x.color : C.line}`, background: on ? x.bg : "#fff", color: on ? x.color : C.inkSoft }}>{c}</button>; })}
          </div>
        </Field>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Field label="City"><input className="er-input" style={{ width: 150 }} value={d.city} onChange={(e) => set("city", e.target.value)} /></Field>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600 }}>
            <button type="button" onClick={() => set("online", !d.online)} style={{ position: "relative", width: 44, height: 26, borderRadius: 99, border: "none", cursor: "pointer", background: d.online ? C.accent : "#CFC8BA" }}><span style={{ position: "absolute", top: 3, left: d.online ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff" }} /></button> Online
          </label>
        </div>
        <div style={{ display: "flex", gap: 6 }}>{[["percent", "%"], ["flat", "$"], ["both", "Both"]].map(([t, lbl]) => { const on = d.commissionType === t;
          return <button key={t} onClick={() => set("commissionType", t)} style={{ flex: 1, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "8px 6px", borderRadius: 8, border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff", color: on ? C.accentD : C.inkSoft }}>{lbl}</button>; })}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {(d.commissionType === "percent" || d.commissionType === "both") && <label style={{ fontSize: 12.5, color: C.muted }}>Percent <input type="number" value={d.commissionPct} onChange={(e) => set("commissionPct", +e.target.value)} className="er-input" style={{ width: 66, display: "inline-block", padding: "6px 8px", marginLeft: 4 }} />%</label>}
          {(d.commissionType === "flat" || d.commissionType === "both") && <label style={{ fontSize: 12.5, color: C.muted }}>Flat $<input type="number" value={d.commissionFlat} onChange={(e) => set("commissionFlat", +e.target.value)} className="er-input" style={{ width: 70, display: "inline-block", padding: "6px 8px", marginLeft: 4 }} /></label>}
          <label style={{ fontSize: 12.5, color: C.muted }}>Discount <input type="number" value={d.discount} onChange={(e) => set("discount", +e.target.value)} className="er-input" style={{ width: 66, display: "inline-block", padding: "6px 8px", marginLeft: 4 }} />%</label>
        </div>
        <Field label="Photos">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {d.photos.map((src, i) => <div key={i} style={{ position: "relative", width: 60, height: 60, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.line}` }}><img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /><button type="button" onClick={() => set("photos", d.photos.filter((_, j) => j !== i))} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", border: "none", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.3)", cursor: "pointer", display: "grid", placeItems: "center", color: C.muted }}><Close size={10} /></button></div>)}
            {d.photos.length < 6 && <label style={{ width: 60, height: 60, borderRadius: 10, border: `2px dashed ${C.line}`, display: "grid", placeItems: "center", cursor: "pointer", color: C.muted }}><Plus size={16} /><input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onPhotos} /></label>}
          </div>
        </Field>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Field label="Mobile number (sign-in)" hint="Used for the business's OTP login. Set this to let a legacy account log in."><input className="er-input" style={{ width: 210 }} value={d.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+15550102030" /></Field>
          <Field label="Contact email"><input className="er-input" style={{ width: 210 }} value={d.email} onChange={(e) => set("email", e.target.value)} placeholder="hello@brand.com" /></Field>
        </div>
        <Field label="Website"><input className="er-input" value={d.website} onChange={(e) => set("website", e.target.value)} placeholder="brand.com" /></Field>
        <div style={{ background: C.panel, borderRadius: 12, padding: "6px 14px" }}>
          <p style={{ margin: "8px 0 2px", fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.inkSoft }}>Show on public listing</p>
          <VisToggle label="Website" sub={d.website || "none on file"} value={!d.hideWebsite} onChange={(v) => set("hideWebsite", !v)} />
          <VisToggle label="Email" sub={d.email || "none on file"} value={!d.hideEmail} onChange={(v) => set("hideEmail", !v)} />
          <VisToggle label="Phone" sub={d.phone || "none on file"} value={!d.hidePhone} onChange={(v) => set("hidePhone", !v)} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="er-btn er-btn-ghost er-btn-sm" onClick={() => setEditing(false)} disabled={busy}>Cancel</button>
          <button className="er-btn er-btn-primary er-btn-sm" onClick={() => save()} disabled={busy}><Check size={14} /> {busy ? "Saving…" : "Save changes"}</button>
        </div>
      </div>}

      {!editing && <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button className="er-btn er-btn-ghost er-btn-sm" style={{ marginRight: "auto", color: "#C0392B" }} onClick={() => { if (window.confirm(`Delete ${b.name}? This removes the listing and any creator links to it. This can't be undone.`)) act(() => api(`/admin/business/${b._id}`, { method: "DELETE", admin: true })); }}><Trash size={14} /> Delete</button>
        <button className="er-btn er-btn-ghost er-btn-sm" onClick={openEdit}><Edit size={14} /> Review &amp; edit</button>
        {b.status === "pending" ? <>
          <button className="er-btn er-btn-ghost er-btn-sm" onClick={() => act(() => api(`/admin/business/${b._id}/reject`, { method: "POST", admin: true }))}><Close size={14} /> Reject</button>
          <button className="er-btn er-btn-accent er-btn-sm" onClick={() => act(() => api(`/admin/business/${b._id}/approve`, { method: "POST", admin: true }))}><Check size={14} /> Approve</button>
        </> : <button className="er-btn er-btn-ghost er-btn-sm" onClick={() => act(() => api(`/admin/business/${b._id}`, { method: "PATCH", admin: true, body: { status: "pending" } }))}>Unpublish</button>}
      </div>}
    </div>
  );
}
function BulkSms() {
  const [msg, setMsg] = useState(""); const [nums, setNums] = useState(""); const [aud, setAud] = useState("approved"); const [richOnly, setRichOnly] = useState(false);
  const [busy, setBusy] = useState(false); const [res, setRes] = useState(""); const [err, setErr] = useState("");
  const send = async () => {
    if (!msg.trim()) { setErr("Write a message first."); return; }
    if (aud === "none" && !nums.trim()) { setErr("Pick a business group or paste some numbers."); return; }
    if (!window.confirm("Send this SMS now?")) return;
    setBusy(true); setErr(""); setRes("");
    try {
      const r = await api("/admin/bulk-sms", { method: "POST", admin: true, body: { message: msg, numbers: nums, audience: aud === "none" ? "" : aud, richOnly } });
      setRes(`Sent to ${r.sent} of ${r.recipients} recipient(s).${r.skipped ? ` Skipped ${r.skipped} non-rich number(s).` : ""}`);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="er-card" style={{ padding: 18, marginTop: 22 }}>
      <h2 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>Bulk SMS</h2>
      <p style={{ margin: "6px 0 14px", fontSize: 13.5, color: C.muted }}>Pick which businesses to text, and/or paste extra numbers below.</p>
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>Businesses on file</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[["approved", "Approved only"], ["pending", "Pending only"], ["all", "All businesses"], ["none", "None"]].map(([k, l]) => { const on = aud === k;
          return <button key={k} type="button" onClick={() => setAud(k)} style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "8px 13px", borderRadius: 999, border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff", color: on ? C.accentD : C.inkSoft }}>{l}</button>; })}
      </div>
      <textarea className="er-input" style={{ minHeight: 88 }} placeholder="Your message…" value={msg} onChange={(e) => setMsg(e.target.value)} />
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.muted, margin: "14px 0 8px" }}>Extra numbers (optional)</div>
      <textarea className="er-input" style={{ minHeight: 60 }} placeholder="Phone numbers — separate by commas, spaces, or new lines (e.g. +15550102030)" value={nums} onChange={(e) => setNums(e.target.value)} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px", marginTop: 14 }}>
        <div><div style={{ fontSize: 14, fontWeight: 600 }}>Rich countries only</div><div style={{ fontSize: 12.5, color: C.muted }}>Only send to numbers in high-income countries (US, UK, EU, Gulf, etc.).</div></div>
        <button type="button" onClick={() => setRichOnly(!richOnly)} style={{ position: "relative", width: 46, height: 27, borderRadius: 99, border: "none", cursor: "pointer", background: richOnly ? C.accent : "#CFC8BA", transition: "background .15s", flexShrink: 0 }}>
          <span style={{ position: "absolute", top: 3, left: richOnly ? 22 : 3, width: 21, height: 21, borderRadius: "50%", background: "#fff", transition: "left .15s" }} /></button>
      </div>
      {err && <p style={{ margin: "10px 0 0", fontSize: 13, color: "#C0392B" }}>{err}</p>}
      {res && <p style={{ margin: "10px 0 0", fontSize: 13, color: C.accent, fontWeight: 600 }}>{res}</p>}
      <button className="er-btn er-btn-primary er-btn-sm" style={{ marginTop: 12 }} disabled={busy} onClick={send}><Send size={14} /> {busy ? "Sending…" : "Send bulk SMS"}</button>
    </div>
  );
}
function AdminPanel({ onBack, onRefresh }) {
  const [authed, setAuthed] = useState(() => !!adminKey());
  const [keyInput, setKeyInput] = useState(""); const [authErr, setAuthErr] = useState(""); const [authBusy, setAuthBusy] = useState(false);
  const [rows, setRows] = useState(null); const [infs, setInfs] = useState([]); const [err, setErr] = useState(""); const [seeding, setSeeding] = useState(false);

  const reload = async () => {
    try {
      const [bz, cr] = await Promise.all([api("/admin/businesses", { admin: true }), api("/admin/influencers", { admin: true }).catch(() => [])]);
      setRows(bz); setInfs(cr || []); setErr("");
    }
    catch (e) {
      if (e.message === "Unauthorized") { try { sessionStorage.removeItem("er_admin_key"); } catch (x) {} setAuthed(false); setAuthErr("That passcode didn't work."); }
      else setErr(e.message);
    }
    onRefresh();
  };
  useEffect(() => { if (authed) reload(); }, [authed]);

  const unlock = async () => {
    const k = keyInput.trim(); if (!k) return;
    setAuthBusy(true); setAuthErr("");
    try { sessionStorage.setItem("er_admin_key", k); } catch (e) {}
    try { setRows(await api("/admin/businesses", { admin: true })); setAuthed(true); }
    catch (e) { try { sessionStorage.removeItem("er_admin_key"); } catch (x) {} setAuthErr(e.message === "Unauthorized" ? "That passcode didn't work." : `Couldn't reach the backend (${e.message}).`); }
    finally { setAuthBusy(false); }
  };
  const signOut = () => { try { sessionStorage.removeItem("er_admin_key"); } catch (e) {} setRows(null); setAuthed(false); };

  if (!authed) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "72px 22px" }}>
        <button className="er-link" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 28 }}><ChevL size={15} /> Back to site</button>
        <div className="er-card" style={{ padding: "32px 28px", textAlign: "center" }}>
          <div style={{ margin: "0 auto", width: 52, height: 52, borderRadius: 14, display: "grid", placeItems: "center", background: C.panel, color: C.ink }}><Lock size={22} /></div>
          <h1 className="er-serif" style={{ margin: "16px 0 0", fontSize: 26, fontWeight: 500 }}>Admin access</h1>
          <p style={{ margin: "6px 0 22px", fontSize: 14, color: C.muted }}>Enter the admin passcode to manage listings.</p>
          <input className="er-input" type="password" placeholder="Passcode" value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") unlock(); }}
            style={{ textAlign: "center", letterSpacing: ".06em" }} autoFocus />
          {authErr && <p style={{ margin: "12px 0 0", fontSize: 12.5, fontWeight: 600, color: "#C0392B" }}>{authErr}</p>}
          <button className="er-btn er-btn-primary er-btn-block" style={{ marginTop: 18 }} disabled={!keyInput.trim() || authBusy} onClick={unlock}>{authBusy ? "Checking…" : <><Lock size={15} /> Unlock</>}</button>
        </div>
      </div>
    );
  }

  const seed = async () => { setSeeding(true); try { await api("/admin/seed", { method: "POST", admin: true }); await reload(); } catch (e) { alert(e.message); } finally { setSeeding(false); } };
  const pending = (rows || []).filter((b) => b.status === "pending");
  const approved = (rows || []).filter((b) => b.status === "approved");
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 22px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button className="er-link" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><ChevL size={15} /> Back to site</button>
        <button className="er-link" onClick={signOut} style={{ color: C.muted }}>Sign out</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <h1 className="er-serif" style={{ margin: 0, fontSize: 34, fontWeight: 500 }}>Admin review</h1>
        <button className="er-btn er-btn-ghost er-btn-sm" onClick={seed} disabled={seeding}>{seeding ? "Loading…" : "Load demo data"}</button>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 14.5, color: C.muted }}>Approve businesses to list them under their category, or adjust their terms. Commission is admin-only.</p>
      <BulkSms />
      {err && <p style={{ marginTop: 14, background: "#FBE9E7", border: "1px solid #F3C5BD", borderRadius: 12, padding: "12px 14px", fontSize: 13.5, color: "#9B3024" }}>Couldn't reach the backend ({err}). API base: {API_BASE}</p>}
      {rows === null && !err && <p style={{ color: C.muted, marginTop: 20 }}>Loading…</p>}
      {rows && <>
        <h2 style={{ margin: "32px 0 12px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft, display: "flex", alignItems: "center", gap: 8 }}>Pending {pending.length > 0 && <span style={{ background: "#D97706", color: "#fff", borderRadius: 999, fontSize: 11, padding: "1px 7px" }}>{pending.length}</span>}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pending.length === 0 ? <p style={{ background: C.panel, borderRadius: 14, padding: "28px 0", textAlign: "center", fontSize: 14, color: C.muted, margin: 0 }}>Nothing waiting — you're all caught up.</p> : pending.map((b) => <AdminRow key={b._id} b={b} reload={reload} />)}
        </div>
        <h2 style={{ margin: "32px 0 12px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>Live ({approved.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{approved.map((b) => <AdminRow key={b._id} b={b} reload={reload} />)}</div>

        <h2 style={{ margin: "36px 0 12px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>Creators ({infs.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {infs.length === 0 ? <p style={{ background: C.panel, borderRadius: 14, padding: "24px 0", textAlign: "center", fontSize: 14, color: C.muted, margin: 0 }}>No creators yet.</p> : infs.map((i) => (
            <div key={i.id} className="er-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
              <Avatar name={i.username} image={i.image} size={40} />
              <div style={{ minWidth: 0, flex: 1 }}><p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>@{i.username}</p><p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>{i.count} recommendation{i.count !== 1 ? "s" : ""}</p></div>
              <button className="er-btn er-btn-ghost er-btn-sm" style={{ color: "#C0392B" }} onClick={() => { if (window.confirm(`Delete @${i.username}? This removes their profile and all their recommendations. This can't be undone.`)) (async () => { try { await api(`/admin/influencer/${i.username}`, { method: "DELETE", admin: true }); await reload(); } catch (e) { alert(e.message); } })(); }}><Trash size={14} /> Delete</button>
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}

/* ---------- Influencer profile (fetches /creator/:username) ---------- */
function EditProfileModal({ token, current, onClose, onSaved }) {
  const [image, setImage] = useState(current.image || ""); const [bio, setBio] = useState(current.bio || ""); const [followers, setFollowers] = useState(current.followers || "");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const onPhoto = async (e) => { const file = e.target.files && e.target.files[0]; if (!file) return; try { setImage(await fileToDataURL(file, 400, 0.85)); } catch (x) {} };
  const save = async () => { setBusy(true); setErr(""); try { await api("/creator/me", { method: "PATCH", body: { token, image, bio, followers: Number(followers) || 0 } }); onSaved(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "30px 28px" }}>
        <h2 className="er-serif" style={{ margin: "0 0 18px", fontSize: 24, fontWeight: 500 }}>Edit profile</h2>
        <Field label="Profile photo">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {image ? <img src={image} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} /> : <span style={{ width: 64, height: 64, borderRadius: "50%", background: C.ink }} />}
            <label className="er-btn er-btn-light er-btn-sm" style={{ cursor: "pointer" }}>Change photo<input type="file" accept="image/*" style={{ display: "none" }} onChange={onPhoto} /></label>
          </div>
        </Field>
        <div style={{ height: 14 }} />
        <Field label="Bio"><textarea className="er-input" placeholder="Curating brands worth trusting." value={bio} onChange={(e) => setBio(e.target.value)} /></Field>
        <div style={{ height: 14 }} />
        <Field label="Follower count" hint="Your total audience across platforms."><input className="er-input" type="number" min="0" placeholder="e.g. 188000" value={followers} onChange={(e) => setFollowers(e.target.value)} /></Field>
        <ErrBox msg={err} />
        <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="er-btn er-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="er-btn er-btn-primary" disabled={busy} onClick={save}><Check size={16} /> {busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </Modal>
  );
}
function CommissionRequest({ token, businessId, existing, onDone }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(existing ? existing.requested : "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const submit = async () => {
    if (!val.trim()) { setErr("Enter the commission you'd like."); return; }
    setBusy(true); setErr("");
    try { await api("/creator/commission-request", { method: "POST", body: { token, businessId, requested: val, note } }); setOpen(false); setNote(""); await onDone(); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const badge = existing && (existing.status === "approved" ? { t: "Approved", c: C.accent, bg: C.accentSoft } : existing.status === "rejected" ? { t: "Rejected", c: "#9B3024", bg: "#FBE9E7" } : { t: "Pending", c: C.inkSoft, bg: C.panel });
  return (
    <div style={{ marginTop: 12, borderTop: `1px dashed ${C.line}`, paddingTop: 12 }}>
      {existing && <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: open ? 10 : 0 }}>
        <span style={{ fontSize: 12.5, color: C.muted }}>Requested <b style={{ color: C.ink }}>{existing.requested}</b></span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: badge.bg, color: badge.c }}>{badge.t}</span>
        {existing.status !== "pending" && existing.brandMessage && <span style={{ fontSize: 12, color: C.muted, width: "100%" }}>Brand: &ldquo;{existing.brandMessage}&rdquo;</span>}
      </div>}
      {open ? <div>
        <input className="er-input" placeholder="e.g. 25% or $40 per sale" value={val} onChange={(e) => setVal(e.target.value)} />
        <textarea className="er-input" style={{ marginTop: 8 }} placeholder="Why? (optional — e.g. a dedicated reel + story)" value={note} onChange={(e) => setNote(e.target.value)} />
        {err && <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#9B3024" }}>{err}</p>}
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button className="er-btn er-btn-primary er-btn-sm" disabled={busy} onClick={submit}>{busy ? "Sending…" : "Send request"}</button>
          <button className="er-btn er-btn-ghost er-btn-sm" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </div> : <button className="er-btn er-btn-light er-btn-sm" onClick={() => setOpen(true)}><Spark size={13} /> {existing ? "Update commission request" : "Request higher commission"}</button>}
    </div>
  );
}
function InfluencerProfile({ handle, session, dataVersion, onBack, onBrowse, onOpenBusiness, onAddBrand, onRefresh }) {
  const [data, setData] = useState(null); const [err, setErr] = useState(""); const [editing, setEditing] = useState(false); const [copied, setCopied] = useState(false);
  const [myReqs, setMyReqs] = useState({}); const [reqList, setReqList] = useState([]);
  const isOwner = session && session.role === "creator" && session.username === handle;
  const profileUrl = `${window.location.origin}/@${handle}`;
  const copyLink = async () => { try { await navigator.clipboard.writeText(profileUrl); } catch (e) {} setCopied(true); setTimeout(() => setCopied(false), 1600); };
  const load = () => api(`/creator/${handle}`).then(setData).catch((e) => setErr(e.message));
  const loadReqs = async () => { if (!(session && session.role === "creator" && session.username === handle)) return; try { const list = await api(`/creator/requests?token=${encodeURIComponent(session.token)}`); const m = {}; list.forEach((r) => { m[String(r.businessId)] = r; }); setMyReqs(m); setReqList(list); } catch (e) {} };
  useEffect(() => { setData(null); setErr(""); load(); loadReqs(); }, [handle, dataVersion]);
  const removeBrand = async (businessId) => { try { await api("/creator/link", { method: "DELETE", body: { token: session.token, businessId } }); await load(); onRefresh(); } catch (e) { alert(e.message); } };

  if (err) return <div style={{ maxWidth: 560, margin: "0 auto", padding: "80px 22px", textAlign: "center" }}><p style={{ color: C.muted }}>Couldn't load @{handle}: {err}</p><button className="er-btn er-btn-primary" style={{ marginTop: 16 }} onClick={onBack}>Back home</button></div>;
  if (!data) return <div style={{ maxWidth: 560, margin: "0 auto", padding: "80px 22px", textAlign: "center", color: C.muted }}>Loading…</div>;
  const recs = data.recommendations || [];
  return (
    <div>
      {editing && <EditProfileModal token={session.token} current={data} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />}
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 22px 36px" }}>
          <button className="er-link" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><ChevL size={15} /> Easy Recommend</button>
          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 18 }}>
            <Avatar name={data.username} image={data.image} size={76} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><h1 className="er-serif" style={{ margin: 0, fontSize: 30, fontWeight: 500 }}>@{data.username}</h1><Seal size={20} /></div>
              <p style={{ margin: "2px 0 0", fontSize: 14.5, color: C.muted }}>{data.bio || "Curating businesses worth trusting."}</p>
              <p style={{ margin: "8px 0 0", fontSize: 12.5, fontWeight: 600, color: C.inkSoft }}>{data.followers > 0 ? `${data.followersLabel} followers · ` : ""}{recs.length} recommendation{recs.length !== 1 ? "s" : ""}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
              <button className="er-btn er-btn-light er-btn-sm" onClick={copyLink} style={{ color: copied ? C.accent : C.ink }}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}</button>
              {isOwner && <button className="er-btn er-btn-light er-btn-sm" onClick={() => setEditing(true)}><Edit size={14} /> Edit profile</button>}
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 22px 60px" }}>
        {isOwner && reqList.length > 0 && <div style={{ marginBottom: 36 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>My commission requests</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reqList.map((r) => { const badge = r.status === "approved" ? { t: "Approved", c: C.accent, bg: C.accentSoft } : r.status === "rejected" ? { t: "Rejected", c: "#9B3024", bg: "#FBE9E7" } : { t: "Pending", c: C.inkSoft, bg: C.panel };
              return <div key={r.id} className="er-card" style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: 15, flex: 1, minWidth: 0 }}>{r.businessName || "Brand"}</span>
                  <span style={{ fontSize: 13, color: C.muted }}>Requested <b style={{ color: C.ink }}>{r.requested}</b></span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: badge.bg, color: badge.c }}>{badge.t}</span>
                </div>
                {r.note && <p style={{ margin: "8px 0 0", fontSize: 13, color: C.inkSoft }}>You: &ldquo;{r.note}&rdquo;</p>}
                {r.status !== "pending" && r.brandMessage && <p style={{ margin: "6px 0 0", fontSize: 13, color: C.muted }}>Brand: &ldquo;{r.brandMessage}&rdquo;</p>}
              </div>; })}
          </div>
        </div>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>Brands I back</h2>
          {isOwner && <button className="er-btn er-btn-primary er-btn-sm" onClick={onAddBrand}><Plus size={14} /> Add a brand</button>}
        </div>
        {recs.length === 0 ? <p style={{ background: C.panel, borderRadius: 14, padding: "40px 0", textAlign: "center", fontSize: 14, color: C.muted }}>No recommendations yet.{isOwner ? " Add a brand to get started." : ""}</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {recs.map((b) => { const cc = catOf(b); const photo = (b.photos || [])[0]; const site = (b.website || "").replace(/^https?:\/\//i, "").replace(/\/$/, ""); const hasContact = b.website || b.phone || b.email;
              return <div key={b.id} className="er-card" style={{ overflow: "hidden" }}>
                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {photo ? <img src={photo} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} /> : <span style={{ width: 48, height: 48, borderRadius: 12, display: "grid", placeItems: "center", background: cc.bg, color: cc.color, flexShrink: 0 }}><Store size={19} /></span>}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><h3 className="er-serif" style={{ margin: 0, fontSize: 19, fontWeight: 500 }}>{b.name}</h3><span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 8px", borderRadius: 999, background: cc.bg, color: cc.color }}>{b.categories[0]}</span></div>
                      <p style={{ margin: "2px 0 0", fontSize: 12.5, color: C.muted }}>{b.online ? "Online" : b.city}</p></div>
                    {isOwner && <button className="er-btn er-btn-ghost er-btn-sm" onClick={() => removeBrand(b.id)}><Close size={14} /> Remove</button>}
                  </div>
                  {b.discount > 0 && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 13, background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: 10, padding: "9px 12px" }}><span style={{ color: C.accentD, flexShrink: 0 }}><Seal size={16} /></span><span style={{ fontSize: 13, fontWeight: 600, color: C.accentD }}>Get {b.discount}% off when you shop {b.name} through this link{site ? ` at ${site}` : ""}.</span></div>}
                  {!isOwner && hasContact && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 13 }}>
                    {b.website && <button className="er-btn er-btn-primary er-btn-sm" onClick={() => { trackClick(data.username, b.id); openSite(b.website); }}><Globe size={14} /> {site}</button>}
                    {b.email && <a href={`mailto:${b.email}`} onClick={() => trackClick(data.username, b.id)} className="er-btn er-btn-light er-btn-sm" style={{ textDecoration: "none" }}><Mail size={14} /> {b.email}</a>}
                    {b.phone && <a href={`tel:${b.phone}`} onClick={() => trackClick(data.username, b.id)} className="er-btn er-btn-light er-btn-sm" style={{ textDecoration: "none" }}><Phone size={14} /> {b.phone}</a>}
                  </div>}
                  {!isOwner && !hasContact && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: C.muted }}>Contact details coming soon.</p>}
                  {isOwner && <CommissionRequest token={session.token} businessId={b.id} existing={myReqs[String(b.id)]} onDone={loadReqs} />}
                </div>
                {b.review && <div style={{ borderTop: `1px solid ${C.line}`, background: C.panel, padding: "13px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Stars value={b.review.stars} /><span style={{ fontSize: 12, fontWeight: 600, color: C.inkSoft }}>@{data.username}'s review</span></div>
                  {b.review.text && <p className="er-serif" style={{ margin: "8px 0 0", fontSize: 16, lineHeight: 1.45, color: C.inkSoft }}>&ldquo;{b.review.text}&rdquo;</p>}</div>}
              </div>; })}
          </div>
        )}
        {!isOwner && <div style={{ marginTop: 28, background: C.ink, borderRadius: 18, padding: "26px 24px", textAlign: "center" }}>
          <p className="er-serif" style={{ margin: 0, color: C.paper, fontSize: 19, fontWeight: 500 }}>Want recommendations like these?</p>
          <button className="er-btn er-btn-sm" style={{ marginTop: 14, background: C.paper, color: C.ink }} onClick={onBrowse}>Browse all brands <Arrow size={15} /></button></div>}
      </div>
    </div>
  );
}

/* ---------- Landing ---------- */
function VidTile({ v }) {
  const ref = useRef(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);
  const poster = v.poster || (v.src && v.src.endsWith(".mp4") ? v.src.slice(0, -4) + ".jpg" : undefined);
  const start = () => { const el = ref.current; if (!el) return; setLoading(true); el.play().catch(() => {}); };
  const stop = () => { const el = ref.current; if (!el) return; el.pause(); el.currentTime = 0; setPlaying(false); setLoading(false); };
  const toggle = () => { const el = ref.current; if (!el) return; if (el.paused) start(); else { el.pause(); setPlaying(false); } };
  const onProg = () => { const el = ref.current; if (!el || !el.duration) return; try { const end = el.buffered.length ? el.buffered.end(el.buffered.length - 1) : 0; setProg(Math.min(100, Math.round((end / el.duration) * 100))); } catch (e) {} };
  return (
    <div className="er-vid-tile" style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ position: "relative", aspectRatio: "9 / 16", background: C.ink }}>
        {v.src ? <>
          <video ref={ref} src={v.src} muted loop playsInline preload="none" poster={poster}
            onMouseEnter={start} onMouseLeave={stop} onClick={toggle}
            onWaiting={() => setLoading(true)} onPlaying={() => { setLoading(false); setPlaying(true); }}
            onCanPlay={() => setLoading(false)} onProgress={onProg} onPause={() => setPlaying(false)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", background: poster ? "transparent" : "#000", cursor: "pointer" }} />
          {loading && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(28,26,23,.5)", pointerEvents: "none" }}>
            <div style={{ textAlign: "center" }}>
              <span className="er-spin" style={{ display: "inline-block", width: 34, height: 34, borderRadius: "50%", border: "3px solid rgba(255,255,255,.25)", borderTopColor: "#fff" }} />
              <p style={{ margin: "10px 0 0", fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,.85)" }}>Loading HD{prog ? ` · ${prog}%` : "…"}</p>
            </div>
          </div>}
          {!playing && !loading && <span className="er-vid-play" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 52, height: 52, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(0,0,0,.45)", color: "#fff", pointerEvents: "none" }}><Play size={20} /></span>}
          {loading && prog > 0 && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 4, background: "rgba(255,255,255,.22)" }}><div style={{ height: "100%", width: `${prog}%`, background: C.accent, transition: "width .25s" }} /></div>}
        </> : v.yt ? (
          <iframe title={v.title || "video"} src={`https://www.youtube.com/embed/${v.yt}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ width: 52, height: 52, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(255,255,255,.14)", color: "#fff", margin: "0 auto" }}><Play size={20} /></span>
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "rgba(253,252,250,.6)" }}>Video coming soon</p>
            </div>
          </div>
        )}
      </div>
      {(v.title || v.sub) && <div style={{ padding: "13px 15px" }}>
        {v.title && <p style={{ margin: 0, fontWeight: 600, fontSize: 14.5, color: C.ink }}>{v.title}</p>}
        {v.sub && <p style={{ margin: "2px 0 0", fontSize: 12.5, color: C.muted }}>{v.sub}</p>}
      </div>}
    </div>
  );
}
function PageHeader({ onHome, onLogin, right }) {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(253,252,250,.82)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
      <div className="er-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <button onClick={onHome} style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer" }}><Seal size={20} /><span className="er-serif" style={{ fontSize: 19, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>Easy Recommend</span></button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="er-btn er-btn-ghost er-btn-sm" onClick={onLogin}>Log in</button>
          {right}
        </div>
      </div>
    </header>
  );
}
function HowStep({ n, title, body }) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: C.ink, color: C.paper, fontWeight: 700, fontSize: 15 }}>{n}</span>
      <div><h3 className="er-serif" style={{ margin: 0, fontSize: 19, fontWeight: 500 }}>{title}</h3><p style={{ margin: "4px 0 0", fontSize: 14.5, lineHeight: 1.55, color: C.inkSoft }}>{body}</p></div>
    </div>
  );
}
function PageFooter({ onLegal }) {
  return (
    <footer style={{ borderTop: `1px solid ${C.line}`, background: C.paper }}>
      <div className="er-wrap" style={{ padding: "28px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>© {new Date().getFullYear()} Easy Recommend</p>
        <div style={{ display: "flex", gap: 16 }}>
          <button onClick={onLegal} className="er-link" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, color: C.muted, fontWeight: 500 }}>Privacy &amp; Cookies</button>
          <a href="mailto:ronak@retentionbase.com" className="er-link" style={{ color: C.muted, fontWeight: 500, textDecoration: "none", fontSize: 12.5 }}>ronak@builderHQ.co</a>
        </div>
      </div>
    </footer>
  );
}
function BusinessPage({ onHome, onList, onCreator, onLogin, onLegal }) {
  return (
    <div>
      <PageHeader onHome={onHome} onLogin={onLogin} right={<button className="er-btn er-btn-primary er-btn-sm" onClick={onList}>List your business</button>} />
      <section className="er-wrap" style={{ padding: "70px 22px 50px" }}>
        <div style={{ maxWidth: 760 }}>
          <span className="er-eyebrow">For businesses</span>
          <h1 className="er-serif" style={{ margin: "16px 0 0", fontSize: "clamp(34px,5.5vw,56px)", lineHeight: 1.05, fontWeight: 500, letterSpacing: "-.02em" }}>Get your App/Website recommended by the right influencers.</h1>
          <p style={{ margin: "20px 0 0", fontSize: 17, lineHeight: 1.55, color: C.inkSoft, maxWidth: 560 }}>List your brand, product, or app and let vetted creators recommend it to their audience. You set the commission and only pay when a referral converts — no retainers, no upfront ad spend.</p>
          <div style={{ marginTop: 26, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="er-btn er-btn-primary" onClick={onList}>List your business <Arrow size={16} /></button>
            <button className="er-btn er-btn-ghost" onClick={onCreator}>I'm a creator</button>
          </div>
        </div>
      </section>
      <section style={{ background: C.panel, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div className="er-wrap" style={{ padding: "56px 22px" }}>
          <div style={{ maxWidth: 640 }}>
            <h2 className="er-serif" style={{ margin: "0 0 28px", fontSize: "clamp(24px,3.5vw,34px)", fontWeight: 500 }}>How it works</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <HowStep n={1} title="List your product" body="Add your brand, set your commission and any customer perk, and choose your categories." />
              <HowStep n={2} title="Influencers recommend you" body="Creators add your product to their recommendation list and share the link in their bio." />
              <HowStep n={3} title="They create content" body="Influencers promote your product to their audience — testimonials, posts, and sponsored content." />
              <HowStep n={4} title="You pay on results" body="Commission is paid only on tracked sales. Every click and conversion is attributed to the creator who drove it." />
            </div>
          </div>
        </div>
      </section>
      <section className="er-wrap" style={{ padding: "10px 22px 64px", textAlign: "center" }}>
        <button className="er-btn er-btn-primary" onClick={onList}>List your business <Arrow size={16} /></button>
      </section>
      <PageFooter onLegal={onLegal} />
    </div>
  );
}
function InfluencerPage({ onHome, onCreator, onList, onLogin, onLegal }) {
  return (
    <div>
      <PageHeader onHome={onHome} onLogin={onLogin} right={<button className="er-btn er-btn-primary er-btn-sm" onClick={onCreator}>Join as a creator</button>} />
      <section className="er-wrap" style={{ padding: "70px 22px 50px" }}>
        <div style={{ maxWidth: 760 }}>
          <span className="er-eyebrow">For creators</span>
          <h1 className="er-serif" style={{ margin: "16px 0 0", fontSize: "clamp(34px,5.5vw,56px)", lineHeight: 1.05, fontWeight: 500, letterSpacing: "-.02em" }}>Recommend brands you love. Get paid for it.</h1>
          <p style={{ margin: "20px 0 0", fontSize: 17, lineHeight: 1.55, color: C.inkSoft, maxWidth: 560 }}>Build a recommendation list of the products you actually use, share one link in your bio, and earn commission on every sale. Want more? Create content or sponsored posts for higher rates.</p>
          <div style={{ marginTop: 26, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="er-btn er-btn-primary" onClick={onCreator}>Join as a creator <Arrow size={16} /></button>
            <button className="er-btn er-btn-ghost" onClick={onList}>I'm a business</button>
          </div>
        </div>
      </section>
      <section style={{ background: C.panel, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div className="er-wrap" style={{ padding: "56px 22px" }}>
          <div style={{ maxWidth: 640 }}>
            <h2 className="er-serif" style={{ margin: "0 0 28px", fontSize: "clamp(24px,3.5vw,34px)", fontWeight: 500 }}>How it works</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <HowStep n={1} title="Sign up free" body="Create your creator profile in under a minute — username, photo, and your follower count." />
              <HowStep n={2} title="Build your recommendation list" body="Pick the brands and products you genuinely back. Each one gets its own tracked referral link." />
              <HowStep n={3} title="Share it in your bio" body="One link to everything you recommend. Your audience taps through and shops." />
              <HowStep n={4} title="Get paid commission" body="Earn on every sale that comes through your links — automatically tracked and attributed to you." />
              <HowStep n={5} title="Promote for more" body="Create content or sponsored posts for brands to unlock higher commission or a sponsorship fee." />
            </div>
          </div>
        </div>
      </section>
      <section className="er-wrap" style={{ padding: "56px 22px", textAlign: "center" }}>
        <h2 className="er-serif" style={{ margin: 0, fontSize: "clamp(24px,3.5vw,34px)", fontWeight: 500 }}>Start earning on what you already recommend.</h2>
        <div style={{ marginTop: 20 }}><button className="er-btn er-btn-primary" onClick={onCreator}>Join as a creator <Arrow size={16} /></button></div>
      </section>
      <PageFooter onLegal={onLegal} />
    </div>
  );
}
function Landing({ creators, session, onList, onCreator, onAdmin, onProfile, onLogin, onLogout, onMyProfile, onMyBiz, onSettings, onLegal, onBusinessPage, onInfluencerPage }) {
  const top = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const steps = [
    { t: "Businesses apply", d: "They add their details and a customer perk. We review every one before it's listed." },
    { t: "Creators curate", d: "A creator backs the businesses they trust and gets a tracked link." },
    { t: "Everyone wins", d: "Customers save, creators earn their cut, and businesses only pay on real results." },
  ];
  return (
    <div>
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(253,252,250,.82)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
        <div className="er-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <button onClick={top} style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}><Seal size={20} /><span className="er-serif" style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.01em", color: C.ink, whiteSpace: "nowrap" }}>Easy Recommend</span></button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {session ? <>
              {session.role === "creator"
                ? <button className="er-btn er-btn-ghost er-btn-sm" onClick={onMyProfile}>My profile</button>
                : <button className="er-btn er-btn-ghost er-btn-sm" onClick={onMyBiz}>My business</button>}
              <button className="er-btn er-btn-ghost er-btn-sm er-hide-sm" onClick={onSettings}>Settings</button>
              <button className="er-btn er-btn-ghost er-btn-sm" onClick={onLogout}>Log out</button>
            </> : <>
              <button className="er-btn er-btn-ghost er-btn-sm er-hide-sm" onClick={onBusinessPage}>For business</button>
              <button className="er-btn er-btn-ghost er-btn-sm er-hide-sm" onClick={onInfluencerPage}>For creators</button>
              <button className="er-btn er-btn-ghost er-btn-sm" onClick={onLogin}>Log in</button>
              <button className="er-btn er-btn-primary er-btn-sm" onClick={onCreator}>Join</button>
            </>}
          </div>
        </div>
      </header>

      <section className="er-wrap" style={{ padding: "70px 22px 60px" }}>
        <div style={{ maxWidth: 760 }}>
          <span className="er-eyebrow">Commission-based influencer marketing</span>
          <h1 className="er-serif" style={{ margin: "16px 0 0", fontSize: "clamp(38px,6vw,62px)", lineHeight: 1.04, fontWeight: 500, letterSpacing: "-.02em" }}>Get your App/Website recommended by influencers.</h1>
          <p style={{ margin: "22px 0 0", fontSize: 17.5, lineHeight: 1.55, color: C.inkSoft, maxWidth: 540 }}>Built for indie builders, brands, and companies ranging from startups to the Fortune 500.</p>
          <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="er-btn er-btn-primary" onClick={onBusinessPage}>For businesses <Arrow size={16} /></button>
            <button className="er-btn er-btn-ghost" onClick={onInfluencerPage}>For creators</button>
          </div>
          <p style={{ margin: "20px 0 0", fontSize: 13, color: C.muted, display: "flex", alignItems: "center", gap: 7 }}><Seal size={15} /> Trusted by 1,000+ products · you only pay commission on real, tracked sales.</p>
        </div>
      </section>

      <section style={{ background: C.paper }}>
        <div className="er-wrap" style={{ padding: "10px 22px 56px", textAlign: "center" }}>
          <span className="er-eyebrow">Watch it work</span>
          <h2 className="er-serif" style={{ margin: "10px 0 0", fontSize: "clamp(26px,4vw,40px)", fontWeight: 500, letterSpacing: "-.01em", color: C.ink }}>See real creators in action</h2>
          <p style={{ margin: "10px auto 14px", fontSize: 15.5, color: C.muted, maxWidth: 600 }}>Short clips of creators showing off apps, tools, and products — and earning on every signup.</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 999, padding: "7px 15px", fontSize: 12.5, fontWeight: 600, color: C.inkSoft, marginBottom: 26 }}>
            <Play size={13} /> Videos are high-definition, so they may take a few seconds to load.
          </div>
          <div className="er-videos-grid">
            {ER_VIDEOS.map((v, i) => <VidTile key={v.src || v.title || i} v={v} />)}
          </div>
        </div>
      </section>

      <section style={{ background: C.ink }}>
        <div className="er-wrap" style={{ padding: "44px 22px", display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", textAlign: "center" }}>
          {[["1,000+", "products using it"], ["$300,000", "in sales driven"], ["3000+", "creators earning"], ["4.9★", "average rating"]].map(([n, l]) => (
            <div key={l}>
              <div className="er-serif" style={{ fontSize: "clamp(30px,4.5vw,44px)", fontWeight: 500, color: C.paper, letterSpacing: "-.02em" }}>{n}</div>
              <div style={{ marginTop: 4, fontSize: 13, color: "rgba(253,252,250,.66)" }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: C.paper }}>
        <div className="er-wrap" style={{ padding: "44px 22px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: C.muted }}>Used by</p>
          <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "20px 36px" }}>
            {["Notion", "Linear", "Figma", "Vercel", "Cursor", "Canva", "Framer", "Webflow", "Raycast", "Superhuman"].map((b) => (
              <span key={b} className="er-serif" style={{ fontSize: "clamp(18px,2.8vw,27px)", fontWeight: 600, color: C.inkSoft, opacity: 0.7, letterSpacing: "-.01em" }}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="er-how" className="er-wrap" style={{ padding: "0 22px 72px", scrollMarginTop: 70 }}>
        <div className="er-stepwork">
          {steps.map((s, i) => (
            <div key={i} style={{ padding: "28px 26px 28px 0", borderTop: `1px solid ${C.ink}` }}>
              <span className="er-eyebrow">0{i + 1}</span>
              <h3 className="er-serif" style={{ margin: "12px 0 6px", fontSize: 22, fontWeight: 500 }}>{s.t}</h3>
              <p style={{ margin: 0, fontSize: 14.5, color: C.muted, lineHeight: 1.5 }}>{s.d}</p>
            </div>))}
        </div>
      </section>

      <section className="er-wrap" style={{ padding: "0 22px 80px" }}>
        <div style={{ background: C.ink, borderRadius: 24, padding: "60px 32px", textAlign: "center" }}>
          <h2 className="er-serif" style={{ margin: 0, color: C.paper, fontSize: "clamp(28px,4.5vw,44px)", fontWeight: 500, letterSpacing: "-.01em" }}>Growth that pays for itself.</h2>
          <p style={{ margin: "14px auto 0", maxWidth: 460, color: "rgba(253,252,250,.72)", fontSize: 16.5 }}>List your app or product, set your commission, and let trusted creators bring you users. You only pay when it converts.</p>
          <div style={{ marginTop: 26, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="er-btn" style={{ background: C.paper, color: C.ink }} onClick={onList}>List your app or brand <Arrow size={16} /></button>
            <button className="er-btn er-btn-ghost" style={{ color: "#fff", borderColor: "rgba(255,255,255,.25)" }} onClick={onCreator}>Join as a creator</button>
          </div>
        </div>
      </section>


      <section id="er-tracking" className="er-wrap" style={{ padding: "8px 22px 64px", scrollMarginTop: 70 }}>
        <span className="er-eyebrow">How tracking works</span>
        <div style={{ marginTop: 14, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", maxWidth: 900 }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: C.muted }}><b style={{ color: C.ink }}>A link for every recommendation.</b> When a creator backs a business, we mint a unique tracked link for that pairing — so each recommendation is measured on its own.</p>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: C.muted }}><b style={{ color: C.ink }}>Clicks are attributed.</b> Tapping a creator's link records the click and tags the visit to that creator, then sends the customer to the business.</p>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: C.muted }}><b style={{ color: C.ink }}>Sales close the loop.</b> When a tagged visit becomes a purchase, the business confirms it and the creator earns the agreed commission — visible on their account.</p>
        </div>
        <p style={{ margin: "16px 0 0", fontSize: 12, color: C.muted, maxWidth: 900 }}>Commission terms are set by each business and may run through their own affiliate program. Attribution windows and payout timing can vary by business.</p>
      </section>

      <footer style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="er-wrap" style={{ padding: "44px 22px 6px", display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
          <div style={{ minWidth: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}><Seal size={18} /><span className="er-serif" style={{ fontSize: 18, fontWeight: 600 }}>Easy Recommend</span></div>
            <p style={{ margin: "10px 0 0", fontSize: 13.5, color: C.muted, lineHeight: 1.5, maxWidth: 260 }}>A network where creators earn on the businesses they actually trust.</p>
            <a href="mailto:ronak@builderHQ.co" className="er-link" style={{ display: "inline-block", marginTop: 12, fontSize: 13.5, color: C.inkSoft, fontWeight: 500, textDecoration: "none" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Mail size={14} /> ronak@builderHQ.co</span></a>
          </div>
          {[
            { h: "For creators", links: [["Join as a creator", onCreator], ["Creator log in", onLogin]] },
            { h: "For businesses", links: [["List your business", onList], ["Business log in", onLogin]] },
            { h: "Explore", links: [["For businesses", onBusinessPage], ["For creators", onInfluencerPage], ["How it works", () => document.getElementById("er-how")?.scrollIntoView({ behavior: "smooth" })], ["Back to top", () => window.scrollTo({ top: 0, behavior: "smooth" })]] },
          ].map((col) => (
            <div key={col.h}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>{col.h}</p>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 9, alignItems: "flex-start" }}>
                {col.links.map(([label, fn]) => <button key={label} onClick={fn} className="er-foot-link" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, color: C.muted, textAlign: "left" }}>{label}</button>)}
              </div>
            </div>
          ))}
        </div>
        <div className="er-wrap" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", padding: "26px 22px", marginTop: 22, borderTop: `1px solid ${C.line}` }}>
          <p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>© {new Date().getFullYear()} Easy Recommend · Recommendations worth passing on</p>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <button onClick={onLegal} className="er-link" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, color: C.muted, fontWeight: 500 }}>Privacy &amp; Cookies</button>
            <a href="mailto:ronak@builderHQ.co" className="er-link" style={{ color: C.muted, fontWeight: 500, textDecoration: "none" }}>ronak@builderHQ.co</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Injected stylesheet ---------- */
const STYLES = `
.er-root{background:${C.paper};color:${C.ink};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;min-height:100vh}
.er-root *{box-sizing:border-box}
.er-serif{font-family:${SERIF}}
.er-wrap{max-width:1120px;margin:0 auto;padding:0 22px}
.er-eyebrow{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${C.accent}}
.er-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:inherit;font-weight:600;font-size:15px;line-height:1;padding:13px 20px;border-radius:11px;border:1px solid transparent;cursor:pointer;transition:transform .12s ease,background .15s ease,box-shadow .15s ease,border-color .15s ease;text-decoration:none}
.er-btn:active{transform:translateY(1px)}
.er-btn[disabled]{opacity:.45;cursor:not-allowed}
.er-btn-primary{background:${C.ink};color:${C.paper}}
.er-btn-primary:hover:not([disabled]){background:#000;box-shadow:0 6px 18px rgba(28,26,23,.18)}
.er-btn-accent{background:${C.accent};color:#fff}
.er-btn-accent:hover:not([disabled]){background:${C.accentD}}
.er-btn-ghost{background:transparent;color:${C.ink};border-color:${C.line}}
.er-btn-ghost:hover:not([disabled]){background:#fff;border-color:#CFC8BA}
.er-btn-light{background:#fff;color:${C.ink};border-color:${C.line}}
.er-btn-light:hover:not([disabled]){border-color:#CFC8BA}
.er-btn-sm{padding:9px 14px;font-size:13.5px;border-radius:9px}
.er-btn-block{width:100%}
.er-input{width:100%;font-family:inherit;font-size:15px;color:${C.ink};background:#fff;border:1px solid ${C.line};border-radius:11px;padding:12px 14px;outline:none;transition:border-color .15s,box-shadow .15s}
.er-input:focus{border-color:${C.accent};box-shadow:0 0 0 3px ${C.accentSoft}}
.er-input::placeholder{color:#A9A296}
.er-card{background:#fff;border:1px solid ${C.line};border-radius:18px}
.er-card-h{transition:transform .15s ease,box-shadow .15s ease}
.er-card-h:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(28,26,23,.10)}
.er-row-h{transition:border-color .15s ease}
.er-row-h:hover{border-color:#CFC8BA}
.er-link{background:none;border:none;padding:0;cursor:pointer;font-family:inherit;font-size:14px;font-weight:600;color:${C.accent}}
.er-foot-link:hover{color:${C.ink}}
.er-link[disabled]{opacity:.5;cursor:not-allowed}
.er-nav{background:none;border:none;cursor:pointer;font-family:inherit;font-size:14px;font-weight:500;color:${C.muted};padding:8px 10px;border-radius:8px}
.er-nav:hover{color:${C.ink}}
.er-modal-overlay{position:fixed;inset:0;z-index:50;background:rgba(28,26,23,.42);backdrop-filter:blur(3px);display:flex;align-items:flex-end;justify-content:center}
.er-modal{position:relative;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;background:${C.paper};border-radius:22px 22px 0 0;box-shadow:0 30px 70px rgba(28,26,23,.30)}
.er-modal-wide{max-width:680px}
.er-close{position:absolute;right:16px;top:16px;z-index:5;width:34px;height:34px;border-radius:999px;border:1px solid ${C.line};background:#fff;display:grid;place-items:center;cursor:pointer;color:${C.muted}}
.er-close:hover{color:${C.ink}}
.er-hero{display:grid;grid-template-columns:1fr;gap:48px;align-items:center}
.er-cards{display:grid;grid-template-columns:1fr;gap:18px}
.er-creators{display:grid;grid-template-columns:1fr;gap:14px}
.er-stepwork{display:grid;grid-template-columns:1fr;gap:0}
.er-videos-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;max-width:780px;margin:0 auto}
.er-vid-tile{flex:0 0 calc(33.333% - 8px);max-width:240px;text-align:left}
.er-vid-play{opacity:1;transition:opacity .15s ease}
.er-vid-tile:hover .er-vid-play{opacity:0}
@keyframes er-spin{to{transform:rotate(360deg)}}
.er-spin{animation:er-spin .9s linear infinite}
@media(min-width:560px){.er-modal-overlay{align-items:center;padding:18px}.er-modal{border-radius:22px}}
@media(max-width:559px){.er-nav{display:none}.er-hide-sm{display:none}}
@media(max-width:400px){.er-hide-xs{display:none}}
@media(min-width:680px){.er-cards{grid-template-columns:1fr 1fr}.er-creators{grid-template-columns:1fr 1fr}.er-videos-grid{grid-template-columns:1fr 1fr}}
@media(min-width:1000px){.er-cards{grid-template-columns:1fr 1fr 1fr}.er-hero{grid-template-columns:1.05fr .95fr;gap:60px}.er-stepwork{grid-template-columns:1fr 1fr 1fr}.er-videos-grid{grid-template-columns:1fr 1fr 1fr}}
.er-root button:focus-visible,.er-root input:focus-visible,.er-root a:focus-visible{outline:2px solid ${C.accent};outline-offset:2px}
@media(prefers-reduced-motion:reduce){.er-root *{transition:none!important}}
`;

/* ---------- Root ---------- */
/* ===========================================================================
   RetentionBase — marketing site, rendered at "/". Reuses the shared tokens,
   icons (Svg, Arrow, Check, Close, ChevR, Search, Spark, Seal, Mail) and
   API_BASE defined above. The EasyRecommend influencer app (EasyApp, below)
   is served at "/Commision".
   =========================================================================== */
const SITE_URL = "https://easyrecommend.co";
const Users = (p) => <Svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6.1M17.5 19a5.5 5.5 0 0 0-3-4.9" /></Svg>;
const Chat = (p) => <Svg {...p}><path d="M4 5h16v11H8l-4 4V5Z" /><path d="M8 9.5h8M8 12.5h5" /></Svg>;
const Pulse = (p) => <Svg {...p}><path d="M3 12h4l2.5-6 4 13 2.5-7H21" /></Svg>;
const Share = (p) => <Svg {...p}><circle cx="6" cy="12" r="2.6" /><circle cx="17" cy="6" r="2.6" /><circle cx="17" cy="18" r="2.6" /><path d="M8.3 10.8l6.4-3.5M8.3 13.2l6.4 3.5" /></Svg>;
const Play = (p) => <Svg {...p}><path d="M8 5.5l11 6.5-11 6.5v-13Z" /></Svg>;

const RB_AGENTS = [
  { key: "influencer", tag: "Advocacy", name: "Influencer Agent", color: "#0F6B4F", bg: "#E4F0EA", icon: Users,
    line: "Commission-based influence, fully automated.",
    body: "Recruits the right creators, hands each a tracked link, and pays only when a referral converts. No flat fees, no agencies — performance only.",
    points: ["Finds + vets creators by niche", "Tracked links, per-sale attribution", "Pays on conversion, not posts"],
    link: SITE_URL + "/Commision", cta: "See Influencer" },
  { key: "messaging", tag: "Lifecycle", name: "Messaging Agent", color: "#2D5B8E", bg: "#E7EDF6", icon: Chat,
    line: "Extremely personalized SMS & email.",
    body: "Writes and sends one-to-one messages that read like a human wrote them for that customer — timed to behavior, not a blast calendar.",
    points: ["Per-customer copy, not templates", "Triggered by real behavior", "SMS + email in one thread"] },
  { key: "churn", tag: "Retention", name: "Churn Agent", color: "#B5572E", bg: "#F6E8DF", icon: Pulse,
    line: "Detect churn early — by listening.",
    body: "Reads the quiet signals (usage dips, sentiment, support tone) and flags an at-risk customer before they leave, then steps in with a save.",
    points: ["Listens across product + support", "Risk scores days ahead", "Auto-launches save plays"] },
  { key: "answer", tag: "Discovery", name: "Answer-Engine Agent", color: "#6C3FA0", bg: "#EFE8F6", icon: Search,
    line: "Get featured on ChatGPT.",
    body: "Optimizes how your brand is described across the web so AI assistants recommend you when buyers ask — the new front page of search.",
    points: ["Structures your AI-readable story", "Targets assistant answers", "Tracks share-of-answer"] },
  { key: "referral", tag: "Growth", name: "Referral Agent", color: "#0E7C86", bg: "#E2F1F2", icon: Share,
    line: "AI-driven referrals on autopilot.",
    body: "Spots your happiest customers, picks the perfect moment, and invites them to refer with an offer tuned to each person — then closes the loop.",
    points: ["Finds advocates automatically", "Personalized invites + offers", "Reward only on success"] },
];
// Videos for the homepage. Files in public/: /video1.mp4 … /video18.mp4, with
// posters /image1.jpeg … /image18.jpeg. Plays on hover (desktop) / tap (mobile).
const ER_VIDEOS = Array.from({ length: 18 }, (_, i) => ({ src: `/video${i + 1}.mp4`, poster: `/image${i + 1}.jpeg`, title: "" }));

function RBtn({ children, kind = "primary", as = "button", href, onClick, style }) {
  const cls = `rb-btn rb-btn-${kind}`;
  if (as === "a") return <a className={cls} href={href} style={style}>{children}</a>;
  return <button className={cls} onClick={onClick} style={style}>{children}</button>;
}
function AgentCard({ a }) {
  const Icon = a.icon;
  return (
    <div className="rb-card rb-agent">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 46, height: 46, borderRadius: 13, display: "grid", placeItems: "center", background: a.bg, color: a.color, flexShrink: 0 }}><Icon size={22} /></span>
        <div>
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: a.color }}>{a.tag}</span>
          <h3 className="rb-serif" style={{ margin: "1px 0 0", fontSize: 21, fontWeight: 500, color: C.ink }}>{a.name}</h3>
        </div>
      </div>
      <p className="rb-serif" style={{ margin: "16px 0 0", fontSize: 18, lineHeight: 1.35, color: C.ink }}>{a.line}</p>
      <p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.55, color: C.muted }}>{a.body}</p>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 9 }}>
        {a.points.map((p) => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: C.inkSoft }}>
            <span style={{ width: 18, height: 18, borderRadius: 6, display: "grid", placeItems: "center", background: a.bg, color: a.color, flexShrink: 0 }}><Check size={12} /></span>{p}
          </div>
        ))}
      </div>
      {a.link && <div style={{ marginTop: 18 }}><a className="rb-btn rb-btn-ghost rb-btn-sm" href={a.link} style={{ borderColor: a.color, color: a.color }}>{a.cta} <Arrow size={15} /></a></div>}
    </div>
  );
}
function RetentionPage() {
  const influencer = RB_AGENTS[0];
  return (
    <div className="rb-root">
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(251,250,248,.86)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
        <div className="rb-wrap" style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href={SITE_URL} style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flexShrink: 0 }}>
            <Seal size={21} /><span className="rb-serif" style={{ fontSize: 19.5, fontWeight: 600, letterSpacing: "-.01em", color: C.ink, whiteSpace: "nowrap" }}>Easy Recommend</span>
          </a>
          <RBtn kind="primary" as="a" href={SITE_URL} style={{ padding: "10px 16px", fontSize: 14 }}>Go to easyrecommend.co</RBtn>
        </div>
      </header>

      <section className="rb-wrap" style={{ padding: "84px 22px 56px", textAlign: "center" }}>
        <span className="rb-eyebrow">We've changed our name</span>
        <h1 className="rb-serif" style={{ margin: "16px auto 0", maxWidth: 760, fontSize: "clamp(38px,6vw,64px)", lineHeight: 1.04, fontWeight: 500, letterSpacing: "-.02em", color: C.ink }}>RetentionBase is now Easy&nbsp;Recommend.</h1>
        <p style={{ margin: "20px auto 0", maxWidth: 560, fontSize: "clamp(16px,2.2vw,19px)", lineHeight: 1.5, color: C.inkSoft }}>Same team, same product — new name and a new home. You can now find us at <b style={{ color: C.ink }}>easyrecommend.co</b>.</p>
        <div style={{ marginTop: 30, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <RBtn kind="primary" as="a" href={SITE_URL}>Visit easyrecommend.co <Arrow size={17} /></RBtn>
        </div>
      </section>

      <section className="rb-wrap" style={{ padding: "8px 22px 84px" }}>
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          <AgentCard a={influencer} />
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="rb-wrap" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", padding: "26px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}><Seal size={18} /><span className="rb-serif" style={{ fontSize: 16, fontWeight: 600 }}>Easy Recommend</span></div>
          <p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>© {new Date().getFullYear()} Easy Recommend · formerly RetentionBase</p>
          <a href={SITE_URL} className="rb-foot-link" style={{ fontSize: 13.5, color: C.inkSoft, fontWeight: 500, textDecoration: "none" }}>easyrecommend.co</a>
        </div>
      </footer>
    </div>
  );
}
const RB_STYLES = `
.rb-root{background:${C.paper};color:${C.ink};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;min-height:100vh}
.rb-root *{box-sizing:border-box}
.rb-serif{font-family:${SERIF}}
.rb-wrap{max-width:1120px;margin:0 auto;padding:0 22px}
.rb-eyebrow{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${C.accent}}
.rb-nav{background:none;border:none;cursor:pointer;font-family:inherit;font-size:14.5px;font-weight:600;color:${C.inkSoft};padding:8px 10px;border-radius:9px}
.rb-nav:hover{color:${C.ink};background:${C.panel}}
.rb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:inherit;font-weight:600;font-size:15px;line-height:1;padding:13px 22px;border-radius:12px;border:1px solid transparent;cursor:pointer;transition:transform .12s ease,background .15s ease,box-shadow .15s ease;text-decoration:none}
.rb-btn:active{transform:translateY(1px)}
.rb-btn-primary{background:${C.ink};color:${C.paper}}
.rb-btn-primary:hover{background:#000;box-shadow:0 8px 22px rgba(22,24,29,.2)}
.rb-btn-ghost{background:#fff;color:${C.ink};border-color:${C.line}}
.rb-btn-ghost:hover{border-color:${C.ink}}
.rb-btn-light{background:${C.paper};color:${C.ink}}
.rb-btn-light:hover{background:#fff}
.rb-btn-outline{background:transparent;color:#fff;border-color:rgba(255,255,255,.28)}
.rb-btn-outline:hover{border-color:#fff}
.rb-btn-sm{padding:9px 15px;font-size:13.5px;border-radius:10px}
.rb-card{background:#fff;border:1px solid ${C.line};border-radius:18px;padding:24px}
.rb-agent{transition:transform .15s ease,box-shadow .15s ease}
.rb-agent:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(22,24,29,.08)}
.rb-agents-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.rb-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.rb-videos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.rb-foot-link:hover{color:${C.ink}}
.rb-input{width:100%;font-family:inherit;font-size:15px;color:${C.ink};background:#fff;border:1px solid ${C.line};border-radius:11px;padding:12px 14px;outline:none}
.rb-input:focus{border-color:${C.accent};box-shadow:0 0 0 3px ${C.accentSoft}}
@media(max-width:900px){.rb-agents-grid{grid-template-columns:repeat(2,1fr)}.rb-steps{grid-template-columns:1fr}.rb-videos-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.rb-agents-grid{grid-template-columns:1fr}.rb-videos-grid{grid-template-columns:1fr}.rb-hide-sm{display:none}}
`;
function RetentionApp() {
  useEffect(() => {
    if (!document.getElementById("er-fonts")) {
      const l = document.createElement("link"); l.id = "er-fonts"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";
      document.head.appendChild(l);
    }
    if (!document.getElementById("rb-styles")) {
      const s = document.createElement("style"); s.id = "rb-styles"; s.textContent = RB_STYLES;
      document.head.appendChild(s);
    }
  }, []);
  return <RetentionPage />;
}

function CookieBar({ onLearnMore }) {
  const [show, setShow] = useState(false);
  useEffect(() => { try { setShow(localStorage.getItem("er_cookie_ok") == null); } catch (e) { setShow(true); } }, []);
  const decide = (v) => { try { localStorage.setItem("er_cookie_ok", v); } catch (e) {} setShow(false); };
  if (!show) return null;
  return (
    <div style={{ position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 60, maxWidth: 720, margin: "0 auto", background: C.ink, color: C.paper, borderRadius: 16, padding: "16px 18px", boxShadow: "0 12px 44px rgba(0,0,0,.28)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, flex: 1, minWidth: 210, color: "rgba(253,252,250,.85)" }}>We use essential cookies to keep you signed in and improve Easy Recommend. See our <button onClick={onLearnMore} style={{ background: "none", border: "none", color: C.paper, textDecoration: "underline", cursor: "pointer", font: "inherit", padding: 0 }}>Privacy &amp; Cookie Policy</button>.</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="er-btn er-btn-ghost er-btn-sm" style={{ color: "#fff", borderColor: "rgba(255,255,255,.3)" }} onClick={() => decide("declined")}>Decline</button>
        <button className="er-btn er-btn-sm" style={{ background: C.paper, color: C.ink }} onClick={() => decide("accepted")}>Accept</button>
      </div>
    </div>
  );
}
function LegalModal({ onClose }) {
  const sections = [
    ["1. Introduction", "Easy Recommend (\"Easy Recommend,\" \"we,\" \"us,\" or \"our\") operates the website easyrecommend.co and related services (the \"Service\"), a commission-based marketing platform that connects brands, products, and apps with creators and influencers who promote them. This Privacy & Cookie Policy explains what information we collect, how we use and share it, and the rights and choices you have. By using the Service, you agree to the practices described here. If you do not agree, please do not use the Service."],
    ["2. Who this applies to", "This policy applies to everyone who uses the Service, including businesses that list a brand, product, or app; creators and influencers who join to promote them; and visitors who browse the site. Some sections apply only to a specific group and are noted where relevant."],
    ["3. Information you provide to us", ["Business accounts: brand/product/app name, mobile number (used for sign-in and verification), optional contact email and website, listing description, categories, products, commission terms, customer discounts, and uploaded images.", "Creator accounts: username, profile photo, bio, and self-reported follower count.", "Commission requests and messages: the commission you request from a brand, any note you add, and a brand's approval/rejection reply.", "Payments: when a business purchases a plan, billing details are entered directly into our payment processor's secure checkout (see Section 9).", "Communications: information you include when you contact support or respond to our messages."]],
    ["4. Information we collect automatically", ["Activity data: referral-link clicks, sales/conversion attribution, listings viewed, and actions taken on the Service.", "Device and log data: IP address, browser type, device and operating-system information, referring pages, and timestamps.", "Cookies and local storage: small data files and browser storage used to keep you signed in and remember preferences (see Section 8)."]],
    ["5. How we use your information", ["Create, operate, and secure your account and the Service.", "Match creators with brands and generate and track referral links and attribution.", "Process plan payments and prevent fraud and abuse.", "Send you service and transactional messages by SMS and email (for example, verification codes, commission requests, and account notices).", "Provide customer support and respond to your requests.", "Monitor, analyze, and improve the Service and develop new features.", "Comply with legal obligations and enforce our terms."]],
    ["6. Legal bases for processing", "Where applicable law (such as the EU/UK GDPR) requires it, we process personal data on these bases: performance of a contract (to provide the Service you sign up for); your consent (for example, SMS marketing, which you can withdraw at any time); our legitimate interests (to secure, improve, and promote the Service in a way that does not override your rights); and compliance with legal obligations."],
    ["7. SMS / text-message program", "If you provide a mobile number, you consent to receive account and activity text messages from Easy Recommend — for example, one-time verification codes and notices when a creator requests a commission. Message frequency varies. Message and data rates may apply. Reply STOP to opt out of non-essential texts and HELP for help. Opting out of transactional messages such as verification codes may limit your ability to use parts of the Service. Carriers are not liable for delayed or undelivered messages."],
    ["8. Cookies, local storage & tracking", ["Strictly necessary: keep you signed in (we store a session token in your browser's local storage) and remember your cookie choice. The Service cannot function without these.", "Preference: remember settings and choices you make.", "Analytics: help us understand how the Service is used so we can improve it.", "We do not use cookies to sell your personal data. You can accept or decline non-essential cookies in our banner, and you can clear cookies and local storage in your browser at any time; doing so may sign you out or reset preferences."]],
    ["9. Payments", "One-time plan payments are processed by our third-party payment processor, Stripe. Card details are submitted directly to Stripe's secure checkout; we do not collect or store full card numbers on our servers. Stripe processes your payment information under its own privacy policy and security standards (PCI-DSS). We retain limited records of transactions (such as plan, amount, and a charge reference) for accounting and refund purposes."],
    ["10. How we share information", ["Between users of the Service: when a creator requests a commission, the relevant brand sees the creator's username, follower count, and request details; public listings and creator profiles are visible to other users and visitors.", "Service providers: vendors who host our infrastructure, send SMS/email, and process payments, acting on our instructions.", "Legal and safety: when required by law, to respond to legal process, or to protect the rights, safety, and security of users, the public, or Easy Recommend.", "Business transfers: in connection with a merger, acquisition, financing, or sale of assets, subject to this policy.", "We do not sell your personal information."]],
    ["11. Data retention", "We keep personal data for as long as your account is active or as needed to provide the Service, then for any additional period required to comply with legal, tax, accounting, or dispute-resolution obligations. When you delete your account, we remove your profile and associated links, reviews, and commission requests, though some records (such as transaction logs) may be retained where required. Backups are purged on a rolling schedule."],
    ["12. Data security", "We use reasonable technical and organizational measures to protect personal data, including encrypted connections (HTTPS), access controls, and tokenized authentication. No method of transmission or storage is completely secure, so we cannot guarantee absolute security. Please keep your account and device credentials confidential and notify us of any suspected unauthorized access."],
    ["13. Your rights and choices", ["Access, correct, or update most details from Account settings.", "Delete your account at any time from Account settings, which removes your profile and related data.", "Opt out of non-essential SMS (reply STOP) and manage cookies via our banner and your browser.", "Depending on where you live, you may also have rights to access, port, restrict, or object to processing, and to lodge a complaint with a supervisory authority. To exercise these, contact us at ronak@builderHQ.co; we may need to verify your identity before responding."]],
    ["14. California privacy rights", "If you are a California resident, the CCPA/CPRA gives you rights to know what personal information we collect, to access and delete it, to correct inaccuracies, and to opt out of the \"sale\" or \"sharing\" of personal information. We do not sell or share personal information as those terms are defined, and we do not discriminate against you for exercising your rights. Submit requests to ronak@builderHQ.co."],
    ["15. European & UK users", "If you are in the EEA, UK, or Switzerland, you have rights under the GDPR/UK GDPR described in Section 13, including access, rectification, erasure, restriction, portability, and objection. Where we transfer data outside your region, we rely on appropriate safeguards such as standard contractual clauses."],
    ["16. International data transfers", "We and our service providers may process and store information in countries other than the one in which you live, including the United States. Where required, we put safeguards in place to protect your information consistent with this policy and applicable law."],
    ["17. Children's privacy", "The Service is not directed to children, and we do not knowingly collect personal information from anyone under 18. If you believe a minor has provided us information, contact us and we will delete it."],
    ["18. Third-party links and services", "The Service may contain links to third-party sites and products (for example, a brand's website or a creator's social profiles). We are not responsible for the privacy practices of those third parties; review their policies before providing information."],
    ["19. Changes to this policy", "We may update this policy from time to time. When we make material changes, we will update the \"Last updated\" date and, where appropriate, provide additional notice. Your continued use of the Service after changes take effect constitutes acceptance of the updated policy."],
    ["20. Contact us", "Questions, requests, or complaints about this policy or your data? Email us at ronak@builderHQ.co and we'll be glad to help."],
  ];
  return (
    <Modal onClose={onClose} wide>
      <div style={{ padding: "30px 28px", maxHeight: "82vh", overflowY: "auto" }}>
        <h2 className="er-serif" style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 500 }}>Privacy &amp; Cookie Policy</h2>
        <p style={{ margin: "0 0 20px", fontSize: 12.5, color: C.muted }}>Last updated {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        {sections.map(([h, b]) => (
          <div key={h} style={{ marginBottom: 18 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: C.ink }}>{h}</h3>
            {Array.isArray(b)
              ? <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>{b.map((li, i) => <li key={i} style={{ fontSize: 13.5, lineHeight: 1.55, color: C.inkSoft }}>{li}</li>)}</ul>
              : <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: C.inkSoft }}>{b}</p>}
          </div>
        ))}
        <p style={{ margin: "8px 0 18px", fontSize: 12, color: C.muted, fontStyle: "italic" }}>This policy is provided for transparency and does not constitute legal advice. Consider having counsel review it for your jurisdiction.</p>
        <button className="er-btn er-btn-primary er-btn-sm" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
function SettingRow({ label, value, action, danger }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0", borderBottom: `1px solid ${C.line}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5, color: danger ? "#C0392B" : C.ink }}>{label}</div>
        {value && <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{value}</div>}
      </div>
      {action}
    </div>
  );
}
function AccountSettings({ session, onBack, onLogout, onEditProfile, onMyBiz, onLegal, onDeleted }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const isCreator = session.role === "creator";
  const del = async () => {
    if (!window.confirm("Delete your account permanently? This removes your profile and cannot be undone.")) return;
    setBusy(true); setErr("");
    try { await api(isCreator ? "/creator/me" : "/business/me", { method: "DELETE", body: { token: session.token } }); onDeleted(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };
  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "40px 22px 80px" }}>
      <button className="er-link" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}><ChevL size={15} /> Back to site</button>
      <h1 className="er-serif" style={{ margin: 0, fontSize: 32, fontWeight: 500 }}>Account settings</h1>
      <p style={{ margin: "6px 0 24px", fontSize: 14.5, color: C.muted }}>Manage your {isCreator ? "creator" : "business"} account.</p>
      <SettingRow label="Account type" value={isCreator ? "Creator" : "Business"} />
      <SettingRow label={isCreator ? "Username" : "Sign-in"} value={isCreator ? `@${session.username}` : (session.phone || session.email || "—")} />
      {isCreator
        ? <SettingRow label="Profile" value="Photo, bio, and follower count" action={<button className="er-btn er-btn-light er-btn-sm" onClick={onEditProfile}>Edit profile</button>} />
        : <SettingRow label="Listing & products" value="Edit your business and products" action={<button className="er-btn er-btn-light er-btn-sm" onClick={onMyBiz}>Edit listing</button>} />}
      <SettingRow label="Privacy & cookies" value="Read how we handle your data" action={<button className="er-btn er-btn-light er-btn-sm" onClick={onLegal}>View policy</button>} />
      <SettingRow label="Sign out" value="Log out on this device" action={<button className="er-btn er-btn-ghost er-btn-sm" onClick={onLogout}>Sign out</button>} />
      <SettingRow label="Delete account" value="Permanently remove your account and data" danger action={<button className="er-btn er-btn-sm" style={{ background: "#C0392B", color: "#fff" }} disabled={busy} onClick={del}>{busy ? "Deleting…" : "Delete"}</button>} />
      {err && <p style={{ marginTop: 14, fontSize: 13, color: "#C0392B" }}>{err}</p>}
    </div>
  );
}
function EasyApp() {
  const initial = parseRoute();
  const [view, setView] = useState(initial.view);
  const [profileHandle, setProfileHandle] = useState(initial.handle);
  const [businesses, setBusinesses] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSessionState] = useState(getSession());
  const [loginOpen, setLoginOpen] = useState(false);
  const [ver, setVer] = useState(0);
  const [brandOpen, setBrandOpen] = useState(false);
  const [brandDone, setBrandDone] = useState(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creatorPreselect, setCreatorPreselect] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const login = (s) => { saveSession(s); setSessionState(s); };
  const logout = () => { clearSession(); setSessionState(null); setView("home"); nav("/"); };
  const [legalOpen, setLegalOpen] = useState(false);
  const goSettings = () => { setView("settings"); nav("/settings"); };
  const goBusinessPage = () => { setView("business"); nav("/business"); window.scrollTo(0, 0); };
  const goInfluencerPage = () => { setView("influencers"); nav("/influencers"); window.scrollTo(0, 0); };

  useEffect(() => {
    const f = document.createElement("link"); f.rel = "stylesheet";
    f.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(f);
    const s = document.createElement("style"); s.textContent = STYLES; document.head.appendChild(s);
    let rb = null;
    if (!document.getElementById("rb-styles")) {
      rb = document.createElement("style"); rb.id = "rb-styles"; rb.textContent = RB_STYLES; document.head.appendChild(rb);
    }
    return () => { document.head.removeChild(f); document.head.removeChild(s); if (rb) document.head.removeChild(rb); };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const [bz, cr] = await Promise.all([api("/businesses"), api("/creators")]);
      setBusinesses((bz || []).filter((b) => b && b.name && b.name.trim())); setCreators(cr || []); setError(""); setVer((v) => v + 1);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const nav = (path) => { try { window.history.pushState({}, "", path); } catch (e) {} window.scrollTo(0, 0); };
  const goProfile = (h) => { setProfileHandle(h); setView("profile"); nav(`/@${h}`); };
  const goHome = () => { setView("home"); nav("/"); };
  const goAdmin = () => { setView("admin"); nav("/admin"); };

  useEffect(() => {
    const onPop = () => { const r = parseRoute(); setView(r.view); setProfileHandle(r.handle); };
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    return () => { window.removeEventListener("popstate", onPop); window.removeEventListener("hashchange", onPop); };
  }, []);

  return (
    <div className="er-root">
      {view === "home" && <Landing businesses={businesses} creators={creators} loading={loading} error={error} session={session}
        onList={() => setBrandOpen(true)} onCreator={() => { setCreatorPreselect(null); setCreatorOpen(true); }} onAdmin={goAdmin} onProfile={goProfile} onOpenBusiness={(id) => setDetailId(id)}
        onLogin={() => setLoginOpen(true)} onLogout={logout} onMyProfile={() => session && goProfile(session.username)} onMyBiz={() => { setView("mybiz"); nav("/my-business"); }} onSettings={goSettings} onLegal={() => setLegalOpen(true)} onBusinessPage={goBusinessPage} onInfluencerPage={goInfluencerPage} />}
      {view === "business" && <BusinessPage onHome={goHome} onList={() => setBrandOpen(true)} onCreator={() => { setCreatorPreselect(null); setCreatorOpen(true); }} onLogin={() => setLoginOpen(true)} onLegal={() => setLegalOpen(true)} />}
      {view === "influencers" && <InfluencerPage onHome={goHome} onCreator={() => { setCreatorPreselect(null); setCreatorOpen(true); }} onList={() => setBrandOpen(true)} onLogin={() => setLoginOpen(true)} onLegal={() => setLegalOpen(true)} />}
      {view === "admin" && <AdminPanel onBack={goHome} onRefresh={refresh} />}
      {view === "mybiz" && session && <MyBusiness session={session} onBack={goHome} onRefresh={refresh} />}
      {view === "settings" && session && <AccountSettings session={session} onBack={goHome} onLogout={logout} onEditProfile={() => goProfile(session.username)} onMyBiz={() => { setView("mybiz"); nav("/my-business"); }} onLegal={() => setLegalOpen(true)} onDeleted={() => { logout(); }} />}
      {view === "settings" && !session && <Landing businesses={businesses} creators={creators} loading={loading} error={error} session={session} onList={() => setBrandOpen(true)} onCreator={() => { setCreatorPreselect(null); setCreatorOpen(true); }} onAdmin={goAdmin} onProfile={goProfile} onOpenBusiness={(id) => setDetailId(id)} onLogin={() => setLoginOpen(true)} onLogout={logout} onMyProfile={() => {}} onMyBiz={() => {}} onSettings={goSettings} onLegal={() => setLegalOpen(true)} onBusinessPage={goBusinessPage} onInfluencerPage={goInfluencerPage} />}
      {view === "profile" && <InfluencerProfile handle={profileHandle} session={session} dataVersion={ver} onBack={goHome} onBrowse={goHome} onOpenBusiness={(id) => setDetailId(id)} onAddBrand={() => { setCreatorPreselect(null); setCreatorOpen(true); }} onRefresh={refresh} />}

      <CookieBar onLearnMore={() => setLegalOpen(true)} />
      {legalOpen && <LegalModal onClose={() => setLegalOpen(false)} />}

      {detailId != null && <BusinessDetail id={detailId} onClose={() => setDetailId(null)} onProfile={(h) => { setDetailId(null); goProfile(h); }} onRecommend={(id) => { setDetailId(null); setCreatorPreselect(id); setCreatorOpen(true); }} />}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onLogin={login} onAfterCreator={(u) => { setLoginOpen(false); goProfile(u); }} onAfterBrand={() => { setLoginOpen(false); setView("mybiz"); nav("/my-business"); }} />}
      {brandOpen && <BrandModal onClose={() => setBrandOpen(false)} onDone={(name) => { setBrandOpen(false); setBrandDone(name); }} onRefresh={refresh} onLogin={login} />}
      {brandDone && <BrandSuccess name={brandDone} onClose={() => setBrandDone(null)} />}
      {creatorOpen && <CreatorModal businesses={businesses} initialBusinessId={creatorPreselect} onClose={() => setCreatorOpen(false)} onRefresh={refresh} onLogin={login} onViewProfile={goProfile} />}
    </div>
  );
}

/* ===========================================================================
   Top-level router — Easy Recommend is the main site (the influencer landing).
   Visitors arriving on the old retentionbase.com domain see the rename notice.
   Preview the rename page anywhere with ?renamed=1.
   =========================================================================== */
function showRenameNotice() {
  const host = (window.location.hostname || "").toLowerCase();
  return host.includes("retentionbase") || /[?&]renamed=1/.test(window.location.search);
}
export default function App() {
  const [renamed] = useState(showRenameNotice());
  return renamed ? <RetentionApp /> : <EasyApp />;
}