import { useState, useEffect } from "react";

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

const ADMIN_KEY = "er-admin-9000"; // must match backend EASYREC_ADMIN_KEY

async function api(path, { method = "GET", body, admin } = {}) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(admin ? { "x-admin-key": ADMIN_KEY } : {}) },
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
};
const CAT_LIST = Object.keys(CATS);
const catOf = (b) => CATS[(b.categories || [])[0]] || CATS.Beauty;
const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const commissionLabel = (b) => b.commissionType === "flat" ? `$${b.commissionFlat}` : b.commissionType === "both" ? `${b.commissionPct}% + $${b.commissionFlat}` : `${b.commissionPct}%`;

const INVITE_CODE = "EASY2025";
const DEMO_OTP = "123123";

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
const Globe = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.4 2.5 2.4 15.5 0 18M12 3c-2.4 2.5-2.4 15.5 0 18" /></Svg>;
const Copy = (p) => <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2.2" /><path d="M5 15V6.2A1.2 1.2 0 0 1 6.2 5H15" /></Svg>;
const Edit = (p) => <Svg {...p}><path d="M12 20h9" /><path d="M16.4 3.6a2 2 0 0 1 2.9 2.8L7.6 18.1 3.5 19.2l1.1-4.1z" /></Svg>;
const Send = (p) => <Svg {...p}><path d="M21 3 3 10.6l7 2.4 2.4 7z" /><path d="M21 3 10 14" /></Svg>;
const Store = (p) => <Svg {...p}><path d="M4 9h16M5 9l1-4h12l1 4M5 9v10h14V9M9.5 19v-5h5v5" /></Svg>;
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
function Stepper({ step, total }) {
  return <div style={{ display: "flex", gap: 6 }}>{Array.from({ length: total }).map((_, i) => <span key={i} style={{ height: 5, flex: 1, borderRadius: 99, background: i <= step ? C.ink : C.line }} />)}</div>;
}
function Modal({ children, onClose, wide }) {
  return <div className="er-modal-overlay" onClick={onClose}><div className={`er-modal${wide ? " er-modal-wide" : ""}`} onClick={(e) => e.stopPropagation()}>
    <button className="er-close" onClick={onClose} aria-label="Close"><Close size={16} /></button>{children}</div></div>;
}
function ErrBox({ msg }) { return msg ? <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "#C0392B" }}>{msg}</p> : null; }

/* ---------- Signature: recommendation card ---------- */
function RecCard({ name, handle, image, category, quote, brand, stars = 5, style }) {
  const cc = CATS[category] || CATS.Beauty;
  return (
    <div className="er-card" style={{ padding: "22px 22px 18px", ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <Avatar name={name} image={image} size={42} />
        <div style={{ lineHeight: 1.25 }}><div style={{ fontWeight: 600, fontSize: 14.5 }}>@{handle}</div><span style={{ fontSize: 12, fontWeight: 600, color: cc.color }}>{category}</span></div>
        <div style={{ marginLeft: "auto" }}><Stars value={stars} /></div>
      </div>
      <p className="er-serif" style={{ margin: "16px 0 0", fontSize: 20.5, lineHeight: 1.36, fontWeight: 400, letterSpacing: "-.005em" }}>
        <span style={{ color: cc.color, fontSize: 30, lineHeight: 0, verticalAlign: "-7px", marginRight: 1 }}>&ldquo;</span>{quote}&rdquo;</p>
      <div style={{ height: 1, background: C.line, margin: "16px 0 12px" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: C.muted }}>
        <span>Recommends</span><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, color: C.ink }}><Seal size={15} /> {brand}</span></div>
    </div>
  );
}

/* ---------- Business card ---------- */
function BusinessCard({ b, onOpen }) {
  const cat = catOf(b); const backers = b.backers || []; const count = b.backerCount || 0;
  return (
    <div className="er-card er-card-h" role="button" tabIndex={0} onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      style={{ display: "flex", flexDirection: "column", overflow: "hidden", cursor: "pointer", textAlign: "left" }}>
      <div style={{ padding: "18px 18px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 999, background: cat.bg, color: cat.color }}>{b.categories[0]}</span><Seal size={18} />
      </div>
      <div style={{ padding: "13px 18px 0", flex: 1 }}>
        <h3 className="er-serif" style={{ margin: 0, fontSize: 21, fontWeight: 500, letterSpacing: "-.01em" }}>{b.name}</h3>
        <p style={{ margin: "5px 0 0", fontSize: 14, color: C.muted, lineHeight: 1.45 }}>{b.blurb}</p>
      </div>
      <div style={{ padding: "14px 18px 0", display: "flex", alignItems: "center", gap: 14, fontSize: 13, color: C.inkSoft }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>{b.online ? <Globe size={14} color={C.muted} /> : <Pin size={14} color={C.muted} />}{b.online ? "Online" : b.city}</span>
        {b.discount > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: C.accent, fontWeight: 600 }}>{b.discount}% member perk</span>}
      </div>
      <div style={{ height: 1, background: C.line, margin: "16px 18px 0" }} />
      <div style={{ padding: "12px 18px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        {count > 0 ? <>
          <span style={{ display: "flex" }}>{backers.slice(0, 3).map((bk, i) => (
            <span key={i} style={{ marginLeft: i ? -8 : 0, border: "2px solid #fff", borderRadius: "50%", display: "flex" }}><Avatar name={bk.username} image={bk.image} size={24} /></span>))}</span>
          <span style={{ fontSize: 12.5, color: C.muted }}>Backed by {count} creator{count > 1 ? "s" : ""}</span>
        </> : <span style={{ fontSize: 12.5, color: C.muted }}>Newly vetted</span>}
        <span style={{ marginLeft: "auto", color: C.ink }}><Arrow size={16} /></span>
      </div>
    </div>
  );
}

/* ---------- Business detail (fetches /business/:id) ---------- */
function BusinessDetail({ id, onClose, onProfile, onRecommend }) {
  const [b, setB] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { api(`/business/${id}`).then(setB).catch((e) => setErr(e.message)); }, [id]);
  const cc = b ? catOf(b) : CATS.Beauty;
  return (
    <Modal onClose={onClose} wide>
      {!b ? (
        <div style={{ padding: 48, textAlign: "center", color: C.muted }}>{err ? `Couldn't load: ${err}` : "Loading…"}</div>
      ) : (<>
        <div style={{ height: 120, background: cc.bg, display: "grid", placeItems: "center" }}>
          <span style={{ width: 56, height: 56, borderRadius: 15, display: "grid", placeItems: "center", background: "#fff", color: cc.color, boxShadow: "0 4px 14px rgba(0,0,0,.07)" }}><Store size={24} /></span>
        </div>
        <div style={{ padding: "22px 28px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 999, background: cc.bg, color: cc.color }}>{b.categories[0]}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: C.accent }}><Seal size={15} /> Verified</span>
          </div>
          <h2 className="er-serif" style={{ margin: "12px 0 0", fontSize: 28, fontWeight: 500, letterSpacing: "-.01em" }}>{b.name}</h2>
          <p style={{ margin: "6px 0 0", fontSize: 15, color: C.inkSoft, lineHeight: 1.5 }}>{b.blurb}</p>
          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13.5, color: C.inkSoft }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{b.online ? <Globe size={15} color={C.muted} /> : <Pin size={15} color={C.muted} />}{b.online ? "Online" : b.city}</span>
            {b.discount > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.accent, fontWeight: 600 }}>{b.discount}% member perk</span>}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <button className="er-btn er-btn-primary" onClick={() => onRecommend(b.id)}>Recommend &amp; earn <Arrow size={16} /></button>
            <button className="er-btn er-btn-ghost">Visit website</button>
          </div>
          <div style={{ height: 1, background: C.line, margin: "24px 0 18px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>What creators say</h3>
            {b.backers.length > 0 && <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "flex" }}>{b.backers.slice(0, 4).map((bk, i) => <span key={i} style={{ marginLeft: i ? -8 : 0, border: "2px solid #fff", borderRadius: "50%", display: "flex" }}><Avatar name={bk.username} image={bk.image} size={24} /></span>)}</span>
              <span style={{ fontSize: 12.5, color: C.muted }}>{b.backers.length} backing</span></span>}
          </div>
          {b.reviews.length === 0 ? (
            <p style={{ background: C.panel, borderRadius: 14, padding: "26px 0", textAlign: "center", fontSize: 14, color: C.muted, margin: 0 }}>No reviews yet — be the first creator to recommend this.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {b.reviews.map((r, i) => (
                <button key={i} onClick={() => onProfile(r.handle)} className="er-card er-row-h" style={{ textAlign: "left", cursor: "pointer", padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <Avatar name={r.handle} image={r.image} size={38} />
                    <div style={{ flex: 1, lineHeight: 1.25 }}><div style={{ fontWeight: 600, fontSize: 14 }}>@{r.handle}</div><div style={{ fontSize: 12, color: C.muted }}>Tap to view profile</div></div>
                    <Stars value={r.stars} />
                  </div>
                  {r.text && <p className="er-serif" style={{ margin: "12px 0 0", fontSize: 16.5, lineHeight: 1.4, color: C.ink }}>&ldquo;{r.text}&rdquo;</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      </>)}
    </Modal>
  );
}

/* ---------- Brand onboarding ---------- */
function BrandModal({ onClose, onDone, onRefresh }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "", phone: "", email: "", categories: [], city: "", online: false, commissionType: "percent", commissionPct: 15, commissionFlat: 25, discount: 0, photos: 2 });
  const [otp, setOtp] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleCat = (c) => set("categories", f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c]);
  const commValid = (f.commissionType === "percent" && f.commissionPct > 0) || (f.commissionType === "flat" && f.commissionFlat > 0) || (f.commissionType === "both" && f.commissionPct > 0 && f.commissionFlat > 0);
  const valid = [f.name && f.phone && f.email, f.categories.length > 0 && (f.online || f.city), commValid, otp.length >= 6];
  const titles = ["About your business", "Where to find you", "Your terms", "Verify your number"];
  const cat0 = CATS[f.categories[0]] || CATS.Beauty;

  const sendCode = async () => { setErr(""); try { await api("/otp/send", { method: "POST", body: { phone: f.phone } }); } catch (e) { setErr(e.message); } };
  const submit = async () => {
    setBusy(true); setErr("");
    try { await api("/business", { method: "POST", body: { ...f, otp } }); onRefresh(); onDone(f.name); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
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
            <Field label="Brand name"><input className="er-input" placeholder="Lumière Skincare" value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Phone number"><input className="er-input" placeholder="+1 555 010 2030" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="Email"><input className="er-input" placeholder="hello@brand.com" value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
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
            <Field label="Photos" hint="Add a couple so creators can showcase you.">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {Array.from({ length: f.photos }).map((_, i) => (
                  <div key={i} style={{ position: "relative", width: 76, height: 76, borderRadius: 12, background: cat0.bg, border: `1px solid ${C.line}` }}>
                    <button type="button" onClick={() => set("photos", Math.max(0, f.photos - 1))} style={{ position: "absolute", top: -7, right: -7, width: 20, height: 20, borderRadius: "50%", border: "none", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.15)", cursor: "pointer", color: C.muted, display: "grid", placeItems: "center" }}><Close size={11} /></button></div>))}
                <button type="button" onClick={() => set("photos", f.photos + 1)} style={{ width: 76, height: 76, borderRadius: 12, border: `2px dashed ${C.line}`, background: "none", cursor: "pointer", color: C.muted, display: "grid", placeItems: "center" }}><Plus size={20} /></button>
              </div></Field>
          </>}
          {step === 3 && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 16px", fontSize: 14, color: C.inkSoft }}>Enter the 6-digit code we texted <b style={{ color: C.ink }}>{f.phone || "your phone"}</b> — or use the demo code.</div>
            <Field label="Verification code" hint={`Demo code: ${DEMO_OTP}`}>
              <input className="er-input" style={{ letterSpacing: ".35em", fontWeight: 700, textAlign: "center" }} placeholder="••••••" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} /></Field>
            <button className="er-link" onClick={sendCode} style={{ alignSelf: "flex-start" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Send size={14} /> Text a code to my phone</span></button>
            <ErrBox msg={err} />
          </div>}
        </div>
        <div style={{ marginTop: 26, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {step > 0 ? <button className="er-btn er-btn-ghost" onClick={() => setStep(step - 1)}><ChevL size={16} /> Back</button> : <span />}
          {step < 3
            ? <button className="er-btn er-btn-primary" disabled={!valid[step]} onClick={() => setStep(step + 1)}>Continue <ChevR size={16} /></button>
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

/* ---------- Creator flow ---------- */
function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(value); } catch (e) { } setCopied(true); setTimeout(() => setCopied(false), 1600); };
  return <div>
    <p style={{ margin: "0 0 7px", fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.muted }}>{label}</p>
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 11, padding: "10px 12px" }}>
      <code style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13.5, color: C.ink }}>{value}</code>
      <button onClick={copy} className="er-btn er-btn-light er-btn-sm" style={{ color: copied ? C.accent : C.ink }}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</button></div></div>;
}
function CreatorModal({ businesses, initialBusinessId, onClose, onRefresh, onViewProfile }) {
  const [step, setStep] = useState(0);
  const [code, setCode] = useState(""); const [username, setUsername] = useState(""); const [image, setImage] = useState("");
  const [pickedId, setPickedId] = useState(initialBusinessId || null); const [stars, setStars] = useState(0); const [text, setText] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [result, setResult] = useState(null);
  const approved = businesses; const picked = approved.find((b) => b.id === pickedId);
  const handle = slugify(username);

  const onPhoto = (e) => { const file = e.target.files && e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => setImage(r.result); r.readAsDataURL(file); };
  const join = async () => { setBusy(true); setErr(""); try { await api("/influencer", { method: "POST", body: { inviteCode: code, username: handle, image } }); setStep(1); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  const finish = async (withReview) => {
    setBusy(true); setErr("");
    try {
      const body = { username: handle, businessId: pickedId };
      if (withReview && stars > 0) { body.stars = stars; body.text = text; }
      const r = await api("/link", { method: "POST", body }); setResult(r); setStep(3); onRefresh();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal onClose={onClose} wide>
      <div style={{ padding: "30px 28px" }}>
        {step < 3 && <><span className="er-eyebrow">For creators</span><div style={{ marginTop: 12 }}><Stepper step={step} total={3} /></div></>}
        {step === 0 && <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <div><h2 className="er-serif" style={{ margin: 0, fontSize: 27, fontWeight: 500 }}>Set up your profile</h2><p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted }}>Invite-only. A photo and a username — that's the whole profile.</p></div>
          <Field label="Invite code" hint={`Demo code: ${INVITE_CODE}`}><input className="er-input" style={{ letterSpacing: ".15em", fontWeight: 700 }} placeholder="EASY2025" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /></Field>
          <Field label="Profile photo">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {image ? <img src={image} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} /> : <span style={{ width: 64, height: 64, borderRadius: "50%", display: "grid", placeItems: "center", background: C.ink, color: C.paper }}><Spark size={24} /></span>}
              <label className="er-btn er-btn-light er-btn-sm" style={{ cursor: "pointer" }}>{image ? "Change photo" : "Upload photo"}<input type="file" accept="image/*" style={{ display: "none" }} onChange={onPhoto} /></label>
            </div></Field>
          <Field label="Username" hint="This becomes your public profile link.">
            <div style={{ display: "flex", alignItems: "center", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 11, padding: "11px 14px" }}>
              <span style={{ fontSize: 14.5, color: C.muted }}>easyrecommend.co/@</span>
              <input style={{ flex: 1, border: "none", outline: "none", background: "none", fontSize: 14.5, fontFamily: "inherit", color: C.ink }} placeholder="miaglow" value={username} onChange={(e) => setUsername(e.target.value)} /></div></Field>
          <button className="er-btn er-btn-primary er-btn-block" disabled={!code || !handle || busy} onClick={join}>{busy ? "Checking…" : <>Continue <Arrow size={16} /></>}</button>
          <ErrBox msg={err} />
        </div>}
        {step === 1 && <div style={{ marginTop: 22 }}>
          <h2 className="er-serif" style={{ margin: 0, fontSize: 27, fontWeight: 500 }}>Pick a business to back</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted }}>We generate a tracked link so you earn on every sale.</p>
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr", gap: 8, maxHeight: 300, overflowY: "auto" }}>
            {approved.map((b) => { const on = pickedId === b.id; const cc = catOf(b);
              return <button key={b.id} onClick={() => setPickedId(b.id)} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: 12, borderRadius: 12, cursor: "pointer", border: `1.5px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff" }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center", background: cc.bg, color: cc.color, flexShrink: 0 }}><Store size={18} /></span>
                <span style={{ minWidth: 0, flex: 1 }}><span style={{ display: "block", fontWeight: 600, fontSize: 14.5, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span><span style={{ display: "block", fontSize: 12.5, color: C.muted }}>{b.categories[0]} · {b.online ? "Online" : b.city}</span></span>
                {on && <Check size={18} color={C.accent} />}</button>; })}
          </div>
          <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between" }}>
            <button className="er-btn er-btn-ghost" onClick={() => setStep(0)}><ChevL size={16} /> Back</button>
            <button className="er-btn er-btn-primary" disabled={!pickedId} onClick={() => setStep(2)}>Continue <ChevR size={16} /></button></div>
        </div>}
        {step === 2 && <div style={{ marginTop: 22 }}>
          <h2 className="er-serif" style={{ margin: 0, fontSize: 27, fontWeight: 500 }}>Leave a review</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted }}>Your honest take on <b style={{ color: C.ink }}>{picked?.name}</b> shows on your profile. Optional, but it's what builds trust.</p>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: C.panel, borderRadius: 16, padding: "20px 0" }}>
            <StarPicker value={stars} onChange={setStars} /><span style={{ fontSize: 12.5, fontWeight: 600, color: C.muted }}>{["Tap to rate", "Poor", "Fair", "Good", "Great", "Exceptional"][stars]}</span></div>
          <textarea className="er-input" style={{ marginTop: 14 }} placeholder="What did you love about them?" value={text} onChange={(e) => setText(e.target.value)} />
          <ErrBox msg={err} />
          <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button className="er-link" onClick={() => finish(false)} style={{ color: C.muted }} disabled={busy}>Skip for now</button>
            <button className="er-btn er-btn-primary" onClick={() => finish(true)} disabled={busy}><Spark size={16} /> {busy ? "Generating…" : "Generate my link"}</button></div>
        </div>}
        {step === 3 && result && <div style={{ textAlign: "center", paddingTop: 6 }}>
          <div style={{ margin: "0 auto", width: 56, height: 56, display: "grid", placeItems: "center" }}><Seal size={50} /></div>
          <h2 className="er-serif" style={{ margin: "14px 0 0", fontSize: 24, fontWeight: 500 }}>Your link is live</h2>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: C.muted }}>Share the referral link to earn {result.earns} per sale, and drop your profile in your bio.</p>
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14, textAlign: "left" }}>
            <CopyRow label="Referral link" value={result.referralUrl} />
            <CopyRow label="Your profile · add to bio" value={result.profileUrl} /></div>
          <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="er-btn er-btn-ghost" onClick={onClose}>Close</button>
            <button className="er-btn er-btn-primary" onClick={() => { onViewProfile(handle); onClose(); }}>View my profile <Arrow size={16} /></button></div>
        </div>}
      </div>
    </Modal>
  );
}

/* ---------- Admin (fetches its own list) ---------- */
function AdminRow({ b, reload }) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState(b.commissionType || "percent");
  const [pct, setPct] = useState(b.commissionPct || 0); const [flat, setFlat] = useState(b.commissionFlat || 0); const [d, setD] = useState(b.discount || 0);
  const cc = catOf(b);
  const act = async (fn) => { try { await fn(); await reload(); } catch (e) { alert(e.message); } };
  return (
    <div className="er-card" style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 44, height: 44, borderRadius: 11, display: "grid", placeItems: "center", background: cc.bg, color: cc.color, flexShrink: 0 }}><Store size={18} /></span>
        <div style={{ minWidth: 0, flex: 1 }}><p className="er-serif" style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>{b.name}</p><p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>{(b.categories || []).join(", ")} · {b.online ? "Online" : b.city}</p></div>
        {!editing && <><span style={{ fontSize: 12, fontWeight: 700, padding: "5px 9px", borderRadius: 8, background: C.accentSoft, color: C.accentD, whiteSpace: "nowrap" }}>{commissionLabel(b)}</span>{b.discount > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 9px", borderRadius: 8, background: C.panel, color: C.ink }}>{b.discount}% off</span>}</>}
      </div>
      {editing ? <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>{[["percent", "%"], ["flat", "$"], ["both", "Both"]].map(([t, lbl]) => { const on = type === t;
          return <button key={t} onClick={() => setType(t)} style={{ flex: 1, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "8px 6px", borderRadius: 8, border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff", color: on ? C.accentD : C.inkSoft }}>{lbl}</button>; })}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {(type === "percent" || type === "both") && <label style={{ fontSize: 12.5, color: C.muted }}>Percent <input type="number" value={pct} onChange={(e) => setPct(+e.target.value)} className="er-input" style={{ width: 66, display: "inline-block", padding: "6px 8px", marginLeft: 4 }} />%</label>}
          {(type === "flat" || type === "both") && <label style={{ fontSize: 12.5, color: C.muted }}>Flat $<input type="number" value={flat} onChange={(e) => setFlat(+e.target.value)} className="er-input" style={{ width: 70, display: "inline-block", padding: "6px 8px", marginLeft: 4 }} /></label>}
          <label style={{ fontSize: 12.5, color: C.muted }}>Discount <input type="number" value={d} onChange={(e) => setD(+e.target.value)} className="er-input" style={{ width: 66, display: "inline-block", padding: "6px 8px", marginLeft: 4 }} />%</label>
          <button className="er-btn er-btn-primary er-btn-sm" onClick={() => act(async () => { await api(`/admin/business/${b._id}`, { method: "PATCH", admin: true, body: { commissionType: type, commissionPct: pct, commissionFlat: flat, discount: d } }); setEditing(false); })}><Check size={14} /> Save</button>
        </div>
      </div> : <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        {b.status === "pending" ? <>
          <button className="er-btn er-btn-ghost er-btn-sm" onClick={() => act(() => api(`/admin/business/${b._id}/reject`, { method: "POST", admin: true }))}><Close size={14} /> Reject</button>
          <button className="er-btn er-btn-accent er-btn-sm" onClick={() => act(() => api(`/admin/business/${b._id}/approve`, { method: "POST", admin: true }))}><Check size={14} /> Approve</button>
        </> : <button className="er-btn er-btn-ghost er-btn-sm" onClick={() => setEditing(true)}><Edit size={14} /> Edit terms</button>}
      </div>}
    </div>
  );
}
function AdminPanel({ onBack, onRefresh }) {
  const [rows, setRows] = useState(null); const [err, setErr] = useState(""); const [seeding, setSeeding] = useState(false);
  const reload = async () => { try { setRows(await api("/admin/businesses", { admin: true })); setErr(""); } catch (e) { setErr(e.message); } onRefresh(); };
  useEffect(() => { reload(); }, []);
  const seed = async () => { setSeeding(true); try { await api("/admin/seed", { method: "POST", admin: true }); await reload(); } catch (e) { alert(e.message); } finally { setSeeding(false); } };
  const pending = (rows || []).filter((b) => b.status === "pending");
  const approved = (rows || []).filter((b) => b.status === "approved");
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 22px 80px" }}>
      <button className="er-link" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}><ChevL size={15} /> Back to site</button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <h1 className="er-serif" style={{ margin: 0, fontSize: 34, fontWeight: 500 }}>Admin review</h1>
        <button className="er-btn er-btn-ghost er-btn-sm" onClick={seed} disabled={seeding}>{seeding ? "Loading…" : "Load demo data"}</button>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 14.5, color: C.muted }}>Approve businesses to list them under their category, or adjust their terms. Commission is admin-only.</p>
      {err && <p style={{ marginTop: 14, background: "#FBE9E7", border: "1px solid #F3C5BD", borderRadius: 12, padding: "12px 14px", fontSize: 13.5, color: "#9B3024" }}>Couldn't reach the backend ({err}). API base: {API_BASE}</p>}
      {rows === null && !err && <p style={{ color: C.muted, marginTop: 20 }}>Loading…</p>}
      {rows && <>
        <h2 style={{ margin: "32px 0 12px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft, display: "flex", alignItems: "center", gap: 8 }}>Pending {pending.length > 0 && <span style={{ background: "#D97706", color: "#fff", borderRadius: 999, fontSize: 11, padding: "1px 7px" }}>{pending.length}</span>}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pending.length === 0 ? <p style={{ background: C.panel, borderRadius: 14, padding: "28px 0", textAlign: "center", fontSize: 14, color: C.muted, margin: 0 }}>Nothing waiting — you're all caught up.</p> : pending.map((b) => <AdminRow key={b._id} b={b} reload={reload} />)}
        </div>
        <h2 style={{ margin: "32px 0 12px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>Live ({approved.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{approved.map((b) => <AdminRow key={b._id} b={b} reload={reload} />)}</div>
      </>}
    </div>
  );
}

/* ---------- Influencer profile (fetches /creator/:username) ---------- */
function InfluencerProfile({ handle, onBack, onBrowse }) {
  const [data, setData] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { api(`/creator/${handle}`).then(setData).catch((e) => setErr(e.message)); }, [handle]);
  if (err) return <div style={{ maxWidth: 560, margin: "0 auto", padding: "80px 22px", textAlign: "center" }}><p style={{ color: C.muted }}>Couldn't load @{handle}: {err}</p><button className="er-btn er-btn-primary" style={{ marginTop: 16 }} onClick={onBack}>Back home</button></div>;
  if (!data) return <div style={{ maxWidth: 560, margin: "0 auto", padding: "80px 22px", textAlign: "center", color: C.muted }}>Loading…</div>;
  const recs = data.recommendations || [];
  return (
    <div>
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 22px 36px" }}>
          <button className="er-link" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><ChevL size={15} /> Easy Recommend</button>
          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 18 }}>
            <Avatar name={data.username} image={data.image} size={76} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><h1 className="er-serif" style={{ margin: 0, fontSize: 30, fontWeight: 500 }}>@{data.username}</h1><Seal size={20} /></div>
              <p style={{ margin: "2px 0 0", fontSize: 14.5, color: C.muted }}>{data.bio || "Curating businesses worth trusting."}</p>
              <p style={{ margin: "8px 0 0", fontSize: 12.5, fontWeight: 600, color: C.inkSoft }}>{recs.length} recommendation{recs.length !== 1 ? "s" : ""}</p>
            </div></div>
        </div>
      </div>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 22px 60px" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>Brands I back</h2>
        {recs.length === 0 ? <p style={{ background: C.panel, borderRadius: 14, padding: "40px 0", textAlign: "center", fontSize: 14, color: C.muted }}>No recommendations yet.</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {recs.map((b) => { const cc = catOf(b);
              return <div key={b.id} className="er-card" style={{ overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16 }}>
                  <span style={{ width: 48, height: 48, borderRadius: 12, display: "grid", placeItems: "center", background: cc.bg, color: cc.color, flexShrink: 0 }}><Store size={19} /></span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><h3 className="er-serif" style={{ margin: 0, fontSize: 19, fontWeight: 500 }}>{b.name}</h3><span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 8px", borderRadius: 999, background: cc.bg, color: cc.color }}>{b.categories[0]}</span></div>
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, color: C.muted }}>{b.online ? "Online" : b.city}{b.discount > 0 ? ` · ${b.discount}% off via this link` : ""}</p></div>
                  <button className="er-btn er-btn-primary er-btn-sm">Visit <Arrow size={14} /></button>
                </div>
                {b.review && <div style={{ borderTop: `1px solid ${C.line}`, background: C.panel, padding: "13px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Stars value={b.review.stars} /><span style={{ fontSize: 12, fontWeight: 600, color: C.inkSoft }}>@{data.username}'s review</span></div>
                  {b.review.text && <p className="er-serif" style={{ margin: "8px 0 0", fontSize: 16, lineHeight: 1.45, color: C.inkSoft }}>&ldquo;{b.review.text}&rdquo;</p>}</div>}
              </div>; })}
          </div>
        )}
        <div style={{ marginTop: 28, background: C.ink, borderRadius: 18, padding: "26px 24px", textAlign: "center" }}>
          <p className="er-serif" style={{ margin: 0, color: C.paper, fontSize: 19, fontWeight: 500 }}>Want recommendations like these?</p>
          <button className="er-btn er-btn-sm" style={{ marginTop: 14, background: C.paper, color: C.ink }} onClick={onBrowse}>Browse all brands <Arrow size={15} /></button></div>
      </div>
    </div>
  );
}

/* ---------- Landing ---------- */
function Landing({ activeCat, setActiveCat, businesses, creators, loading, error, onList, onCreator, onAdmin, onProfile, onOpenBusiness }) {
  const top = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const visible = businesses.filter((b) => (b.categories || []).includes(activeCat));
  const steps = [
    { t: "Businesses apply", d: "They add their details and a customer perk. We review every one before it's listed." },
    { t: "Creators curate", d: "With an invite, a creator backs the businesses they trust and gets a tracked link." },
    { t: "Everyone wins", d: "Customers save, creators earn their cut, and businesses only pay on real results." },
  ];
  return (
    <div>
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(253,252,250,.82)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
        <div className="er-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <button onClick={top} style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer" }}><Seal size={20} /><span className="er-serif" style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.01em", color: C.ink }}>Easy Recommend</span></button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="er-nav" onClick={onAdmin}>Admin</button>
            <button className="er-btn er-btn-ghost er-btn-sm" onClick={onList}>List business</button>
            <button className="er-btn er-btn-primary er-btn-sm" onClick={onCreator}>Join as creator</button>
          </div>
        </div>
      </header>

      <section className="er-wrap" style={{ padding: "70px 22px 60px" }}>
        <div className="er-hero">
          <div>
            <span className="er-eyebrow">Invite-only · creator network</span>
            <h1 className="er-serif" style={{ margin: "16px 0 0", fontSize: "clamp(38px,6vw,62px)", lineHeight: 1.04, fontWeight: 500, letterSpacing: "-.02em" }}>Send people somewhere good. Get paid when they go.</h1>
            <p style={{ margin: "22px 0 0", fontSize: 17.5, lineHeight: 1.55, color: C.inkSoft, maxWidth: 480 }}>A small network of creators sharing the businesses they actually trust — earning on every customer who follows the link.</p>
            <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="er-btn er-btn-primary" onClick={onCreator}>Join as a creator <Arrow size={16} /></button>
              <button className="er-btn er-btn-ghost" onClick={onList}>List your business</button>
            </div>
            <p style={{ margin: "20px 0 0", fontSize: 13, color: C.muted, display: "flex", alignItems: "center", gap: 7 }}><Seal size={15} /> Every business is reviewed before it's listed.</p>
          </div>
          <div style={{ position: "relative" }}>
            <div className="er-card" style={{ position: "absolute", inset: 0, transform: "rotate(-3.5deg) translateY(12px)", background: C.panel }} />
            <RecCard style={{ position: "relative" }} name="Mia Chen" handle="miaglow" category="Beauty" quote="My skin has never looked better — the vitamin C serum is unreal. I send everyone here." brand="Lumière Skincare" stars={5} />
            <div className="er-card" style={{ position: "absolute", right: -8, bottom: -20, padding: "9px 13px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 12px 26px rgba(28,26,23,.14)" }}><Stars value={5} size={13} /><span style={{ fontSize: 12.5, fontWeight: 600 }}>vouched, not ads</span></div>
          </div>
        </div>
      </section>

      <section style={{ background: C.panel, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div className="er-wrap" style={{ padding: "72px 22px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between" }}>
            <div><span className="er-eyebrow">The directory</span><h2 className="er-serif" style={{ margin: "10px 0 0", fontSize: "clamp(28px,4vw,40px)", fontWeight: 500, letterSpacing: "-.01em" }}>Browsed and vouched for</h2></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CAT_LIST.map((c) => { const on = activeCat === c;
                return <button key={c} onClick={() => setActiveCat(c)} style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, padding: "9px 16px", borderRadius: 999, border: `1px solid ${on ? C.ink : C.line}`, background: on ? C.ink : "#fff", color: on ? C.paper : C.inkSoft }}>{c}</button>; })}
            </div>
          </div>
          {error && <p style={{ marginTop: 24, background: "#FBE9E7", border: "1px solid #F3C5BD", borderRadius: 14, padding: "16px 18px", fontSize: 14, color: "#9B3024" }}>Couldn't reach the backend ({error}). API base: {API_BASE} — make sure it's running, then reload. New install? Open Admin → "Load demo data".</p>}
          <div className="er-cards" style={{ marginTop: 28 }}>{visible.map((b) => <BusinessCard key={b.id} b={b} onOpen={() => onOpenBusiness(b.id)} />)}</div>
          {!error && !loading && visible.length === 0 && <p style={{ marginTop: 28, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: "44px 0", textAlign: "center", fontSize: 14, color: C.muted }}>No live businesses in {activeCat} yet. {businesses.length === 0 ? <>Open Admin → “Load demo data”.</> : null}</p>}
          {loading && <p style={{ marginTop: 28, textAlign: "center", color: C.muted }}>Loading…</p>}
        </div>
      </section>

      <section className="er-wrap" style={{ padding: "72px 22px" }}>
        <span className="er-eyebrow">The contributors</span>
        <h2 className="er-serif" style={{ margin: "10px 0 0", fontSize: "clamp(28px,4vw,40px)", fontWeight: 500, letterSpacing: "-.01em" }}>The people doing the recommending</h2>
        <p style={{ margin: "8px 0 0", fontSize: 15, color: C.muted }}>Tap a profile to see the brands they back and what they had to say.</p>
        {creators.length === 0 ? <p style={{ marginTop: 24, color: C.muted }}>No creators yet.</p> : (
          <div className="er-creators" style={{ marginTop: 28 }}>
            {creators.map((c) => (
              <button key={c.username} onClick={() => onProfile(c.username)} className="er-card er-card-h" style={{ display: "flex", alignItems: "center", gap: 16, textAlign: "left", padding: 16, cursor: "pointer" }}>
                <Avatar name={c.username} image={c.image} size={48} />
                <div style={{ flex: 1 }}><div style={{ display: "flex", alignItems: "center", gap: 7 }}><span className="er-serif" style={{ fontSize: 18, fontWeight: 500 }}>@{c.username}</span><Seal size={15} /></div><p style={{ margin: "1px 0 0", fontSize: 13, color: C.muted }}>{c.bio || "Curating brands worth trusting"} · {c.count} rec{c.count !== 1 ? "s" : ""}</p></div>
                <ChevR size={18} color={C.muted} />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="er-wrap" style={{ padding: "0 22px 72px" }}>
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
          <h2 className="er-serif" style={{ margin: 0, color: C.paper, fontSize: "clamp(28px,4.5vw,44px)", fontWeight: 500, letterSpacing: "-.01em" }}>Good taste, finally compensated.</h2>
          <p style={{ margin: "14px auto 0", maxWidth: 440, color: "rgba(253,252,250,.72)", fontSize: 16.5 }}>Join with an invite and start earning on the places you'd recommend anyway.</p>
          <div style={{ marginTop: 26, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="er-btn" style={{ background: C.paper, color: C.ink }} onClick={onCreator}>Join as a creator <Arrow size={16} /></button>
            <button className="er-btn er-btn-ghost" style={{ color: "#fff", borderColor: "rgba(255,255,255,.25)" }} onClick={onList}>List your business</button>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="er-wrap" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", padding: "26px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}><Seal size={18} /><span className="er-serif" style={{ fontSize: 17, fontWeight: 600 }}>Easy Recommend</span></div>
          <p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>© {new Date().getFullYear()} · Recommendations worth passing on</p>
          <button className="er-link" style={{ color: C.muted, fontWeight: 500 }} onClick={onAdmin}>Admin</button>
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
@media(min-width:560px){.er-modal-overlay{align-items:center;padding:18px}.er-modal{border-radius:22px}}
@media(max-width:559px){.er-nav{display:none}}
@media(min-width:680px){.er-cards{grid-template-columns:1fr 1fr}.er-creators{grid-template-columns:1fr 1fr}}
@media(min-width:1000px){.er-cards{grid-template-columns:1fr 1fr 1fr}.er-hero{grid-template-columns:1.05fr .95fr;gap:60px}.er-stepwork{grid-template-columns:1fr 1fr 1fr}}
.er-root button:focus-visible,.er-root input:focus-visible,.er-root a:focus-visible{outline:2px solid ${C.accent};outline-offset:2px}
@media(prefers-reduced-motion:reduce){.er-root *{transition:none!important}}
`;

/* ---------- Root ---------- */
export default function App() {
  const [view, setView] = useState("home");
  const [profileHandle, setProfileHandle] = useState(null);
  const [activeCat, setActiveCat] = useState("Beauty");
  const [businesses, setBusinesses] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brandOpen, setBrandOpen] = useState(false);
  const [brandDone, setBrandDone] = useState(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creatorPreselect, setCreatorPreselect] = useState(null);
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    const f = document.createElement("link"); f.rel = "stylesheet";
    f.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(f);
    const s = document.createElement("style"); s.textContent = STYLES; document.head.appendChild(s);
    return () => { document.head.removeChild(f); document.head.removeChild(s); };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const [bz, cr] = await Promise.all([api("/businesses"), api("/creators")]);
      setBusinesses(bz); setCreators(cr); setError("");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const goProfile = (h) => { setProfileHandle(h); setView("profile"); window.scrollTo(0, 0); };
  const goHome = () => { setView("home"); window.scrollTo(0, 0); };

  return (
    <div className="er-root">
      {view === "home" && <Landing activeCat={activeCat} setActiveCat={setActiveCat} businesses={businesses} creators={creators} loading={loading} error={error}
        onList={() => setBrandOpen(true)} onCreator={() => { setCreatorPreselect(null); setCreatorOpen(true); }} onAdmin={() => { setView("admin"); window.scrollTo(0, 0); }} onProfile={goProfile} onOpenBusiness={(id) => setDetailId(id)} />}
      {view === "admin" && <AdminPanel onBack={goHome} onRefresh={refresh} />}
      {view === "profile" && <InfluencerProfile handle={profileHandle} onBack={goHome} onBrowse={goHome} />}

      {detailId != null && <BusinessDetail id={detailId} onClose={() => setDetailId(null)} onProfile={(h) => { setDetailId(null); goProfile(h); }} onRecommend={(id) => { setDetailId(null); setCreatorPreselect(id); setCreatorOpen(true); }} />}
      {brandOpen && <BrandModal onClose={() => setBrandOpen(false)} onDone={(name) => { setBrandOpen(false); setBrandDone(name); }} onRefresh={refresh} />}
      {brandDone && <BrandSuccess name={brandDone} onClose={() => setBrandDone(null)} />}
      {creatorOpen && <CreatorModal businesses={businesses} initialBusinessId={creatorPreselect} onClose={() => setCreatorOpen(false)} onRefresh={refresh} onViewProfile={goProfile} />}
    </div>
  );
}