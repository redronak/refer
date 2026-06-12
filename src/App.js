import { useState, useEffect } from "react";

/* ============================================================================
   Easy Recommend — single-file React app
   - No external packages (icons are inline SVG)
   - No Tailwind: styling via inline styles + one injected <style> block,
     so it renders identically on any CRA / Netlify deploy.
   ========================================================================== */

const C = {
  ink: "#1C1A17", inkSoft: "#3A362F", paper: "#FDFCFA", panel: "#F4F1EA",
  line: "#E5DFD4", muted: "#6E675B", accent: "#0F6B4F", accentD: "#0A4F3A",
  accentSoft: "#E4F0EA", gold: "#D99A00",
};
const SERIF = "'Fraunces','Georgia',serif";

const CATS = {
  Beauty:         { color: "#B0566B", bg: "#F7E9EC" },
  Legal:          { color: "#2E4D71", bg: "#E9EFF5" },
  Education:      { color: "#9A6B1E", bg: "#F4EBD9" },
  Wellness:       { color: "#5E7F4E", bg: "#EBF0E4" },
  Fitness:        { color: "#B5572E", bg: "#F6E8DF" },
  "Food & Drink": { color: "#A33B3B", bg: "#F6E5E3" },
  Home:           { color: "#6B6242", bg: "#F0ECE0" },
  Finance:        { color: "#3D3A78", bg: "#ECEBF5" },
  Travel:         { color: "#2D6E8E", bg: "#E5F0F4" },
  Fashion:        { color: "#7A3E6B", bg: "#F2E7EF" },
};
const CAT_LIST = Object.keys(CATS);
const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* Commission can be a percentage, flat cash, or both. */
const commissionLabel = (b) => {
  if (b.commissionType === "flat") return `$${b.commissionFlat}`;
  if (b.commissionType === "both") return `${b.commissionPct}% + $${b.commissionFlat}`;
  return `${b.commissionPct}%`;
};

const INVITE_CODE = "EASY2025";
const DEMO_OTP = "123123";

/* ---------- Seed data ---------- */
const SEED_BUSINESSES = [
  { id: 1, name: "Lumière Skincare", categories: ["Beauty"], city: "San Francisco", online: true, commissionType: "percent", commissionPct: 15, commissionFlat: 0, discount: 10, status: "approved", blurb: "Clinical-grade serums and quiet, unhurried facials." },
  { id: 2, name: "Glow Bar", categories: ["Beauty"], city: "Austin", online: false, commissionType: "flat", commissionPct: 0, commissionFlat: 20, discount: 15, status: "approved", blurb: "Walk-in glow facials and a no-fuss lash bar." },
  { id: 3, name: "Hartwell Law", categories: ["Legal"], city: "New York", online: true, commissionType: "flat", commissionPct: 0, commissionFlat: 150, discount: 0, status: "approved", blurb: "Startup and IP counsel that talks like a human." },
  { id: 4, name: "Sterling Legal", categories: ["Legal"], city: "Chicago", online: false, commissionType: "percent", commissionPct: 10, commissionFlat: 0, discount: 0, status: "approved", blurb: "Immigration and family law, handled with care." },
  { id: 5, name: "BrightPath Tutoring", categories: ["Education"], city: "Boston", online: true, commissionType: "both", commissionPct: 15, commissionFlat: 10, discount: 10, status: "approved", blurb: "One-to-one SAT and STEM tutoring that actually sticks." },
  { id: 6, name: "CodeLeap Academy", categories: ["Education"], city: "Online", online: true, commissionType: "percent", commissionPct: 18, commissionFlat: 0, discount: 0, status: "approved", blurb: "Live cohort bootcamps for people who ship." },
  { id: 7, name: "Stillpoint Acupuncture", categories: ["Wellness"], city: "Portland", online: false, commissionType: "flat", commissionPct: 0, commissionFlat: 30, discount: 10, status: "approved", blurb: "Calm, careful sessions for stress and chronic pain." },
  { id: 8, name: "Iron & Oak Gym", categories: ["Fitness"], city: "Denver", online: false, commissionType: "both", commissionPct: 10, commissionFlat: 15, discount: 20, status: "approved", blurb: "Strength coaching without the ego." },
  { id: 9, name: "Maison Verde", categories: ["Food & Drink"], city: "Los Angeles", online: false, commissionType: "percent", commissionPct: 12, commissionFlat: 0, discount: 0, status: "approved", blurb: "Seasonal, plant-forward tasting menus." },
  { id: 10, name: "Northbeam Advisors", categories: ["Finance"], city: "New York", online: true, commissionType: "flat", commissionPct: 0, commissionFlat: 200, discount: 0, status: "approved", blurb: "Fee-only financial planning for founders." },
  { id: 11, name: "Wander Collective", categories: ["Travel"], city: "Online", online: true, commissionType: "both", commissionPct: 8, commissionFlat: 50, discount: 10, status: "approved", blurb: "Small-group trips to places worth the flight." },
  { id: 12, name: "Atelier Mode", categories: ["Fashion"], city: "Miami", online: true, commissionType: "percent", commissionPct: 20, commissionFlat: 0, discount: 15, status: "approved", blurb: "Made-to-measure essentials, ethically sourced." },
  { id: 13, name: "Velvet Beauty Co", categories: ["Beauty"], city: "Miami", online: false, commissionType: "both", commissionPct: 14, commissionFlat: 10, discount: 20, status: "pending", blurb: "A luxury bridal makeup studio." },
];
const SEED_INFLUENCERS = [
  { handle: "miaglow", name: "Mia Chen", image: "", bio: "Skincare, slowly. Based in SF." },
  { handle: "thelegaledit", name: "Sam Rivera", image: "", bio: "Making founder legal less scary." },
];
const SEED_LINKS = [
  { id: 1, handle: "miaglow", businessId: 1 },
  { id: 2, handle: "miaglow", businessId: 5 },
  { id: 3, handle: "thelegaledit", businessId: 3 },
];
const SEED_REVIEWS = [
  { id: 1, handle: "miaglow", businessId: 1, stars: 5, text: "My skin has never looked better — the vitamin C serum is unreal. I send everyone here." },
  { id: 2, handle: "miaglow", businessId: 5, stars: 4, text: "Patient, sharp tutors. My brother's score jumped 180 points." },
  { id: 3, handle: "thelegaledit", businessId: 3, stars: 5, text: "Handled our SAFE round in a week, founder-friendly the whole way." },
];

/* ---------- Inline SVG icons ---------- */
const Svg = ({ size = 18, sw = 1.7, color = "currentColor", fill = "none", children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>{children}</svg>
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
    <path d="M12 17.3 6.2 20.6l1.5-6.5L2.7 9.7l6.6-.6L12 3l2.7 6.1 6.6.6-5 4.4 1.5 6.5z" />
  </svg>
);
const Seal = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" fill={C.accent} />
    <path d="M8.3 12.2l2.4 2.4 5-5.2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---------- Atoms ---------- */
function Avatar({ name, image, size = 44 }) {
  if (image) return <img src={image} alt={name || ""} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }} />;
  const init = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", display: "grid", placeItems: "center", background: C.ink, color: C.paper, fontFamily: SERIF, fontWeight: 500, fontSize: size / 2.4, flexShrink: 0 }}>{init}</span>
  );
}
function Stars({ value = 5, size = 14 }) {
  return <span style={{ display: "inline-flex", gap: 2 }}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={size} on={n <= value} />)}</span>;
}
function StarPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
          <Star size={30} on={n <= value} />
        </button>
      ))}
    </div>
  );
}
function Field({ label, hint, children }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, marginBottom: 7, color: C.ink }}>{label}</span>
      {children}
      {hint && <span style={{ display: "block", fontSize: 12, color: C.muted, marginTop: 6 }}>{hint}</span>}
    </label>
  );
}
function Stepper({ step, total }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ height: 5, flex: 1, borderRadius: 99, background: i <= step ? C.ink : C.line }} />
      ))}
    </div>
  );
}
function Modal({ children, onClose, wide }) {
  return (
    <div className="er-modal-overlay" onClick={onClose}>
      <div className={`er-modal${wide ? " er-modal-wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <button className="er-close" onClick={onClose} aria-label="Close"><Close size={16} /></button>
        {children}
      </div>
    </div>
  );
}

/* ---------- Signature: recommendation card ---------- */
function RecCard({ name, handle, image, category, quote, brand, stars = 5, style }) {
  const cat = CATS[category] || CATS.Beauty;
  return (
    <div className="er-card" style={{ padding: "22px 22px 18px", ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <Avatar name={name} image={image} size={42} />
        <div style={{ lineHeight: 1.25 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>@{handle}</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: cat.color }}>{category}</span>
        </div>
        <div style={{ marginLeft: "auto" }}><Stars value={stars} /></div>
      </div>
      <p className="er-serif" style={{ margin: "16px 0 0", fontSize: 20.5, lineHeight: 1.36, fontWeight: 400, letterSpacing: "-.005em" }}>
        <span style={{ color: cat.color, fontSize: 30, lineHeight: 0, verticalAlign: "-7px", marginRight: 1 }}>&ldquo;</span>{quote}&rdquo;
      </p>
      <div style={{ height: 1, background: C.line, margin: "16px 0 12px" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: C.muted }}>
        <span>Recommends</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, color: C.ink }}><Seal size={15} /> {brand}</span>
      </div>
    </div>
  );
}

/* ---------- Business card ---------- */
function BusinessCard({ b, backers, onOpen }) {
  const cat = CATS[b.categories[0]] || CATS.Beauty;
  return (
    <div className="er-card er-card-h" role="button" tabIndex={0} onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      style={{ display: "flex", flexDirection: "column", overflow: "hidden", cursor: "pointer", textAlign: "left" }}>
      <div style={{ padding: "18px 18px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 999, background: cat.bg, color: cat.color }}>{b.categories[0]}</span>
        <Seal size={18} />
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
        {backers.length > 0 ? (
          <>
            <span style={{ display: "flex" }}>
              {backers.slice(0, 3).map((bk, i) => (
                <span key={i} style={{ marginLeft: i ? -8 : 0, border: "2px solid #fff", borderRadius: "50%", display: "flex" }}>
                  <Avatar name={bk.name} image={bk.image} size={24} />
                </span>
              ))}
            </span>
            <span style={{ fontSize: 12.5, color: C.muted }}>Backed by {backers.length} creator{backers.length > 1 ? "s" : ""}</span>
          </>
        ) : <span style={{ fontSize: 12.5, color: C.muted }}>Newly vetted</span>}
        <span style={{ marginLeft: "auto", color: C.ink }}><Arrow size={16} /></span>
      </div>
    </div>
  );
}

/* ---------- Business detail ---------- */
function BusinessDetail({ b, reviews, backers, onClose, onProfile, onRecommend }) {
  const cc = CATS[b.categories[0]] || CATS.Beauty;
  return (
    <Modal onClose={onClose} wide>
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
          {backers.length > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "flex" }}>{backers.slice(0, 4).map((bk, i) => (
                <span key={i} style={{ marginLeft: i ? -8 : 0, border: "2px solid #fff", borderRadius: "50%", display: "flex" }}><Avatar name={bk.name} image={bk.image} size={24} /></span>
              ))}</span>
              <span style={{ fontSize: 12.5, color: C.muted }}>{backers.length} backing</span>
            </span>
          )}
        </div>

        {reviews.length === 0 ? (
          <p style={{ background: C.panel, borderRadius: 14, padding: "26px 0", textAlign: "center", fontSize: 14, color: C.muted, margin: 0 }}>No reviews yet — be the first creator to recommend this.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reviews.map((r) => (
              <button key={r.id} onClick={() => onProfile(r.handle)} className="er-card er-row-h" style={{ textAlign: "left", cursor: "pointer", padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <Avatar name={r.inf ? r.inf.name : r.handle} image={r.inf ? r.inf.image : ""} size={38} />
                  <div style={{ flex: 1, lineHeight: 1.25 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>@{r.handle}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Tap to view profile</div>
                  </div>
                  <Stars value={r.stars} />
                </div>
                {r.text && <p className="er-serif" style={{ margin: "12px 0 0", fontSize: 16.5, lineHeight: 1.4, color: C.ink }}>&ldquo;{r.text}&rdquo;</p>}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}


function BrandModal({ onClose, onSubmit }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "", phone: "", email: "", categories: [], city: "", online: false, commissionType: "percent", commissionPct: 15, commissionFlat: 25, discount: 0, photos: 2 });
  const [otp, setOtp] = useState(""); const [otpSent, setOtpSent] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleCat = (c) => set("categories", f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c]);
  const commValid = (f.commissionType === "percent" && f.commissionPct > 0) || (f.commissionType === "flat" && f.commissionFlat > 0) || (f.commissionType === "both" && f.commissionPct > 0 && f.commissionFlat > 0);
  const valid = [f.name && f.phone && f.email, f.categories.length > 0 && (f.online || f.city), commValid, otp === DEMO_OTP];
  const titles = ["About your business", "Where to find you", "Your terms", "Verify your number"];
  const cat0 = CATS[f.categories[0]] || CATS.Beauty;

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
                {CAT_LIST.map((c) => {
                  const on = f.categories.includes(c); const cc = CATS[c];
                  return <button key={c} type="button" onClick={() => toggleCat(c)}
                    style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, padding: "9px 15px", borderRadius: 999, border: `1px solid ${on ? cc.color : C.line}`, background: on ? cc.bg : "#fff", color: on ? cc.color : C.inkSoft }}>{c}</button>;
                })}
              </div>
            </Field>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 16px" }}>
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>Online business</div><div style={{ fontSize: 12.5, color: C.muted }}>Serve customers anywhere.</div></div>
              <button type="button" onClick={() => set("online", !f.online)} style={{ position: "relative", width: 46, height: 27, borderRadius: 99, border: "none", cursor: "pointer", background: f.online ? C.accent : "#CFC8BA", transition: "background .15s" }}>
                <span style={{ position: "absolute", top: 3, left: f.online ? 22 : 3, width: 21, height: 21, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
              </button>
            </div>
            <Field label="City" hint={f.online ? "Optional for online businesses." : "Where customers visit you."}><input className="er-input" placeholder="San Francisco" value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
          </>}

          {step === 2 && <>
            <Field label="How you'll reward creators" hint="Kept private from the public — creators see it only when they generate a link.">
              <div style={{ display: "flex", gap: 8 }}>
                {[["percent", "Percentage"], ["flat", "Flat cash"], ["both", "Both"]].map(([t, lbl]) => {
                  const on = f.commissionType === t;
                  return <button key={t} type="button" onClick={() => set("commissionType", t)} style={{ flex: 1, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, padding: "10px 8px", borderRadius: 10, border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff", color: on ? C.accentD : C.inkSoft }}>{lbl}</button>;
                })}
              </div>
            </Field>
            {(f.commissionType === "percent" || f.commissionType === "both") && (
              <Field label="Percentage of each sale">
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <input type="range" min="1" max="40" value={f.commissionPct} onChange={(e) => set("commissionPct", +e.target.value)} style={{ flex: 1, accentColor: C.accent }} />
                  <span style={{ minWidth: 48, textAlign: "center", fontWeight: 700, fontSize: 14, padding: "5px 8px", borderRadius: 8, background: C.accentSoft, color: C.accentD }}>{f.commissionPct}%</span>
                </div>
              </Field>
            )}
            {(f.commissionType === "flat" || f.commissionType === "both") && (
              <Field label="Flat cash per sale" hint="A fixed amount paid on every conversion.">
                <div style={{ display: "flex", alignItems: "center", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 11, padding: "11px 14px", maxWidth: 180 }}>
                  <span style={{ fontSize: 15, color: C.muted, marginRight: 2 }}>$</span>
                  <input type="number" min="0" value={f.commissionFlat} onChange={(e) => set("commissionFlat", Math.max(0, +e.target.value))} style={{ flex: 1, border: "none", outline: "none", background: "none", fontFamily: "inherit", fontSize: 15, fontWeight: 600, color: C.ink, width: "100%" }} />
                </div>
              </Field>
            )}
            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px", fontSize: 13.5, color: C.inkSoft }}>
              Creators earn <b style={{ color: C.ink }}>{commValid ? commissionLabel(f) : "—"}</b> per sale.
            </div>
            <Field label="Customer perk" hint="Optional discount shown on your public listing.">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <input type="range" min="0" max="40" value={f.discount} onChange={(e) => set("discount", +e.target.value)} style={{ flex: 1, accentColor: C.accent }} />
                <span style={{ minWidth: 48, textAlign: "center", fontWeight: 700, fontSize: 14, padding: "5px 8px", borderRadius: 8, background: C.panel, color: C.ink }}>{f.discount}%</span>
              </div>
            </Field>
            <Field label="Photos" hint="Add a couple so creators can showcase you.">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {Array.from({ length: f.photos }).map((_, i) => (
                  <div key={i} style={{ position: "relative", width: 76, height: 76, borderRadius: 12, background: cat0.bg, border: `1px solid ${C.line}` }}>
                    <button type="button" onClick={() => set("photos", Math.max(0, f.photos - 1))} style={{ position: "absolute", top: -7, right: -7, width: 20, height: 20, borderRadius: "50%", border: "none", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.15)", cursor: "pointer", color: C.muted, display: "grid", placeItems: "center" }}><Close size={11} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => set("photos", f.photos + 1)} style={{ width: 76, height: 76, borderRadius: 12, border: `2px dashed ${C.line}`, background: "none", cursor: "pointer", color: C.muted, display: "grid", placeItems: "center" }}><Plus size={20} /></button>
              </div>
            </Field>
          </>}

          {step === 3 && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 16px", fontSize: 14, color: C.inkSoft }}>We sent a 6-digit code to <b style={{ color: C.ink }}>{f.phone || "your phone"}</b>.</div>
            {!otpSent ? (
              <button className="er-btn er-btn-primary er-btn-block" onClick={() => setOtpSent(true)}><Send size={16} /> Send verification code</button>
            ) : <>
              <Field label="Enter code" hint={`Demo code: ${DEMO_OTP}`}>
                <input className="er-input" style={{ letterSpacing: ".35em", fontWeight: 700, textAlign: "center" }} placeholder="••••••" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
              </Field>
              {otp && otp !== DEMO_OTP && <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "#C0392B" }}>That code doesn't match. Try {DEMO_OTP}.</p>}
            </>}
          </div>}
        </div>

        <div style={{ marginTop: 26, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {step > 0 ? <button className="er-btn er-btn-ghost" onClick={() => setStep(step - 1)}><ChevL size={16} /> Back</button> : <span />}
          {step < 3
            ? <button className="er-btn er-btn-primary" disabled={!valid[step]} onClick={() => setStep(step + 1)}>Continue <ChevR size={16} /></button>
            : <button className="er-btn er-btn-primary" disabled={!valid[3]} onClick={() => onSubmit(f)}><Check size={16} /> Submit for review</button>}
        </div>
      </div>
    </Modal>
  );
}

function BrandSuccess({ name, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: 32, textAlign: "center" }}>
        <div style={{ margin: "0 auto", width: 56, height: 56, display: "grid", placeItems: "center" }}><Seal size={52} /></div>
        <h2 className="er-serif" style={{ margin: "16px 0 0", fontSize: 24, fontWeight: 500 }}>You're in the queue</h2>
        <p style={{ margin: "10px 0 0", fontSize: 14.5, color: C.inkSoft, lineHeight: 1.5 }}><b>{name}</b> was submitted for review. We approve every business before it's listed under its category — you'll get a text once you're live.</p>
        <button className="er-btn er-btn-primary er-btn-block" style={{ marginTop: 24 }} onClick={onClose}>Done</button>
      </div>
    </Modal>
  );
}

/* ---------- Creator flow ---------- */
function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(value); } catch (e) { /* sandbox */ } setCopied(true); setTimeout(() => setCopied(false), 1600); };
  return (
    <div>
      <p style={{ margin: "0 0 7px", fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.muted }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 11, padding: "10px 12px" }}>
        <code style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13.5, color: C.ink }}>{value}</code>
        <button onClick={copy} className="er-btn er-btn-light er-btn-sm" style={{ color: copied ? C.accent : C.ink }}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</button>
      </div>
    </div>
  );
}

function CreatorModal({ businesses, initialBusinessId, onClose, onComplete, onViewProfile }) {
  const [step, setStep] = useState(0);
  const [code, setCode] = useState(""); const [username, setUsername] = useState(""); const [image, setImage] = useState("");
  const [pickedId, setPickedId] = useState(initialBusinessId || null); const [stars, setStars] = useState(0); const [text, setText] = useState("");
  const approved = businesses.filter((b) => b.status === "approved");
  const picked = approved.find((b) => b.id === pickedId);
  const handle = username.replace(/[^a-z0-9_]/gi, "").toLowerCase();

  const onPhoto = (e) => { const file = e.target.files && e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => setImage(r.result); r.readAsDataURL(file); };
  const finish = (withReview) => { onComplete({ handle, name: handle, image, businessId: pickedId, review: withReview && stars > 0 ? { stars, text } : null }); setStep(3); };
  const refUrl = picked ? `easyrecommend.co/r/${handle}/${slugify(picked.name)}` : "";
  const profileUrl = `easyrecommend.co/@${handle}`;

  return (
    <Modal onClose={onClose} wide>
      <div style={{ padding: "30px 28px" }}>
        {step < 3 && <><span className="er-eyebrow">For creators</span><div style={{ marginTop: 12 }}><Stepper step={step} total={3} /></div></>}

        {step === 0 && <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <div><h2 className="er-serif" style={{ margin: 0, fontSize: 27, fontWeight: 500 }}>Set up your profile</h2>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted }}>Invite-only. A photo and a username — that's the whole profile.</p></div>
          <Field label="Invite code" hint={`Demo code: ${INVITE_CODE}`}>
            <input className="er-input" style={{ letterSpacing: ".15em", fontWeight: 700 }} placeholder="EASY2025" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </Field>
          <Field label="Profile photo">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {image ? <img src={image} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
                : <span style={{ width: 64, height: 64, borderRadius: "50%", display: "grid", placeItems: "center", background: C.ink, color: C.paper }}><Spark size={24} /></span>}
              <label className="er-btn er-btn-light er-btn-sm" style={{ cursor: "pointer" }}>{image ? "Change photo" : "Upload photo"}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={onPhoto} /></label>
            </div>
          </Field>
          <Field label="Username" hint="This becomes your public profile link.">
            <div style={{ display: "flex", alignItems: "center", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 11, padding: "11px 14px" }}>
              <span style={{ fontSize: 14.5, color: C.muted }}>easyrecommend.co/@</span>
              <input style={{ flex: 1, border: "none", outline: "none", background: "none", fontSize: 14.5, fontFamily: "inherit", color: C.ink }} placeholder="miaglow" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
          </Field>
          <button className="er-btn er-btn-primary er-btn-block" disabled={code !== INVITE_CODE || !handle} onClick={() => setStep(1)}>Continue <Arrow size={16} /></button>
          {code && code !== INVITE_CODE && <p style={{ margin: 0, textAlign: "center", fontSize: 12.5, fontWeight: 600, color: "#C0392B" }}>Invalid code. Try {INVITE_CODE}.</p>}
        </div>}

        {step === 1 && <div style={{ marginTop: 22 }}>
          <h2 className="er-serif" style={{ margin: 0, fontSize: 27, fontWeight: 500 }}>Pick a business to back</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted }}>We generate a tracked link so you earn on every sale.</p>
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr", gap: 8, maxHeight: 280, overflowY: "auto" }}>
            {approved.map((b) => {
              const on = pickedId === b.id; const cc = CATS[b.categories[0]];
              return (
                <button key={b.id} onClick={() => setPickedId(b.id)} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: 12, borderRadius: 12, cursor: "pointer", border: `1.5px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff" }}>
                  <span style={{ width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center", background: cc.bg, color: cc.color, flexShrink: 0 }}><Store size={18} /></span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontWeight: 600, fontSize: 14.5, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.accent }}>You earn {commissionLabel(b)}</span>
                  </span>
                  {on && <Check size={18} color={C.accent} />}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between" }}>
            <button className="er-btn er-btn-ghost" onClick={() => setStep(0)}><ChevL size={16} /> Back</button>
            <button className="er-btn er-btn-primary" disabled={!pickedId} onClick={() => setStep(2)}>Continue <ChevR size={16} /></button>
          </div>
        </div>}

        {step === 2 && <div style={{ marginTop: 22 }}>
          <h2 className="er-serif" style={{ margin: 0, fontSize: 27, fontWeight: 500 }}>Leave a review</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted }}>Your honest take on <b style={{ color: C.ink }}>{picked?.name}</b> shows on your profile. Optional, but it's what builds trust.</p>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: C.panel, borderRadius: 16, padding: "20px 0" }}>
            <StarPicker value={stars} onChange={setStars} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.muted }}>{["Tap to rate", "Poor", "Fair", "Good", "Great", "Exceptional"][stars]}</span>
          </div>
          <textarea className="er-input" style={{ marginTop: 14 }} placeholder="What did you love about them?" value={text} onChange={(e) => setText(e.target.value)} />
          <div style={{ marginTop: 22, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button className="er-link" onClick={() => finish(false)} style={{ color: C.muted }}>Skip for now</button>
            <button className="er-btn er-btn-primary" onClick={() => finish(true)}><Spark size={16} /> Generate my link</button>
          </div>
        </div>}

        {step === 3 && <div style={{ textAlign: "center", paddingTop: 6 }}>
          <div style={{ margin: "0 auto", width: 56, height: 56, display: "grid", placeItems: "center" }}><Seal size={50} /></div>
          <h2 className="er-serif" style={{ margin: "14px 0 0", fontSize: 24, fontWeight: 500 }}>Your link is live</h2>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: C.muted }}>Share the referral link to earn {picked ? commissionLabel(picked) : ""} per sale, and drop your profile in your bio.</p>
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14, textAlign: "left" }}>
            <CopyRow label="Referral link" value={refUrl} />
            <CopyRow label="Your profile · add to bio" value={profileUrl} />
          </div>
          <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="er-btn er-btn-ghost" onClick={onClose}>Close</button>
            <button className="er-btn er-btn-primary" onClick={() => { onViewProfile(handle); onClose(); }}>View my profile <Arrow size={16} /></button>
          </div>
        </div>}
      </div>
    </Modal>
  );
}

/* ---------- Admin ---------- */
function AdminRow({ b, onApprove, onReject, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState(b.commissionType || "percent");
  const [pct, setPct] = useState(b.commissionPct || 0);
  const [flat, setFlat] = useState(b.commissionFlat || 0);
  const [d, setD] = useState(b.discount);
  const cc = CATS[b.categories[0]] || CATS.Beauty;
  return (
    <div className="er-card" style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 44, height: 44, borderRadius: 11, display: "grid", placeItems: "center", background: cc.bg, color: cc.color, flexShrink: 0 }}><Store size={18} /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p className="er-serif" style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>{b.name}</p>
          <p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>{b.categories.join(", ")} · {b.online ? "Online" : b.city}</p>
        </div>
        {!editing && <>
          <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 9px", borderRadius: 8, background: C.accentSoft, color: C.accentD, whiteSpace: "nowrap" }}>{commissionLabel(b)}</span>
          {b.discount > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 9px", borderRadius: 8, background: C.panel, color: C.ink }}>{b.discount}% off</span>}
        </>}
      </div>
      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[["percent", "%"], ["flat", "$"], ["both", "Both"]].map(([t, lbl]) => {
              const on = type === t;
              return <button key={t} onClick={() => setType(t)} style={{ flex: 1, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "8px 6px", borderRadius: 8, border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff", color: on ? C.accentD : C.inkSoft }}>{lbl}</button>;
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {(type === "percent" || type === "both") && <label style={{ fontSize: 12.5, color: C.muted }}>Percent <input type="number" value={pct} onChange={(e) => setPct(+e.target.value)} className="er-input" style={{ width: 66, display: "inline-block", padding: "6px 8px", marginLeft: 4 }} />%</label>}
            {(type === "flat" || type === "both") && <label style={{ fontSize: 12.5, color: C.muted }}>Flat $<input type="number" value={flat} onChange={(e) => setFlat(+e.target.value)} className="er-input" style={{ width: 70, display: "inline-block", padding: "6px 8px", marginLeft: 4 }} /></label>}
            <label style={{ fontSize: 12.5, color: C.muted }}>Discount <input type="number" value={d} onChange={(e) => setD(+e.target.value)} className="er-input" style={{ width: 66, display: "inline-block", padding: "6px 8px", marginLeft: 4 }} />%</label>
            <button className="er-btn er-btn-primary er-btn-sm" onClick={() => { onEdit(b.id, { commissionType: type, commissionPct: pct, commissionFlat: flat, discount: d }); setEditing(false); }}><Check size={14} /> Save</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {b.status === "pending" ? <>
            <button className="er-btn er-btn-ghost er-btn-sm" onClick={() => onReject(b.id)}><Close size={14} /> Reject</button>
            <button className="er-btn er-btn-accent er-btn-sm" onClick={() => onApprove(b.id)}><Check size={14} /> Approve</button>
          </> : <button className="er-btn er-btn-ghost er-btn-sm" onClick={() => setEditing(true)}><Edit size={14} /> Edit terms</button>}
        </div>
      )}
    </div>
  );
}
function AdminPanel({ businesses, onApprove, onReject, onEdit, onBack }) {
  const pending = businesses.filter((b) => b.status === "pending");
  const approved = businesses.filter((b) => b.status === "approved");
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 22px 80px" }}>
      <button className="er-link" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}><ChevL size={15} /> Back to site</button>
      <h1 className="er-serif" style={{ margin: 0, fontSize: 34, fontWeight: 500 }}>Admin review</h1>
      <p style={{ margin: "6px 0 0", fontSize: 14.5, color: C.muted }}>Approve businesses to list them under their category, or adjust their terms. Commission is admin-only.</p>

      <h2 style={{ margin: "32px 0 12px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft, display: "flex", alignItems: "center", gap: 8 }}>
        Pending {pending.length > 0 && <span style={{ background: "#D97706", color: "#fff", borderRadius: 999, fontSize: 11, padding: "1px 7px" }}>{pending.length}</span>}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {pending.length === 0 ? <p style={{ background: C.panel, borderRadius: 14, padding: "28px 0", textAlign: "center", fontSize: 14, color: C.muted, margin: 0 }}>Nothing waiting — you're all caught up.</p>
          : pending.map((b) => <AdminRow key={b.id} b={b} onApprove={onApprove} onReject={onReject} onEdit={onEdit} />)}
      </div>

      <h2 style={{ margin: "32px 0 12px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>Live ({approved.length})</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {approved.map((b) => <AdminRow key={b.id} b={b} onApprove={onApprove} onReject={onReject} onEdit={onEdit} />)}
      </div>
    </div>
  );
}

/* ---------- Influencer profile ---------- */
function InfluencerProfile({ handle, influencers, businesses, links, reviews, onBack, onBrowse }) {
  const inf = influencers.find((i) => i.handle === handle);
  if (!inf) return <div style={{ maxWidth: 560, margin: "0 auto", padding: "80px 22px", textAlign: "center" }}>
    <p style={{ color: C.muted }}>That profile doesn't exist yet.</p>
    <button className="er-btn er-btn-primary" style={{ marginTop: 16 }} onClick={onBack}>Back home</button>
  </div>;

  const myLinks = links.filter((l) => l.handle === handle);
  const ids = [...new Set(myLinks.map((l) => l.businessId))];
  const myBiz = ids.map((id) => businesses.find((b) => b.id === id)).filter(Boolean);
  const reviewFor = (id) => reviews.find((r) => r.handle === handle && r.businessId === id);

  return (
    <div>
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 22px 36px" }}>
          <button className="er-link" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><ChevL size={15} /> Easy Recommend</button>
          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 18 }}>
            <Avatar name={inf.name} image={inf.image} size={76} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 className="er-serif" style={{ margin: 0, fontSize: 30, fontWeight: 500 }}>@{inf.handle}</h1><Seal size={20} />
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 14.5, color: C.muted }}>{inf.bio || "Curating businesses worth trusting."}</p>
              <p style={{ margin: "8px 0 0", fontSize: 12.5, fontWeight: 600, color: C.inkSoft }}>{myBiz.length} recommendation{myBiz.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 22px 60px" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>Brands I back</h2>
        {myBiz.length === 0 ? <p style={{ background: C.panel, borderRadius: 14, padding: "40px 0", textAlign: "center", fontSize: 14, color: C.muted }}>No recommendations yet.</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {myBiz.map((b) => {
              const rev = reviewFor(b.id); const cc = CATS[b.categories[0]];
              return (
                <div key={b.id} className="er-card" style={{ overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16 }}>
                    <span style={{ width: 48, height: 48, borderRadius: 12, display: "grid", placeItems: "center", background: cc.bg, color: cc.color, flexShrink: 0 }}><Store size={19} /></span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h3 className="er-serif" style={{ margin: 0, fontSize: 19, fontWeight: 500 }}>{b.name}</h3>
                        <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 8px", borderRadius: 999, background: cc.bg, color: cc.color }}>{b.categories[0]}</span>
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: 12.5, color: C.muted }}>{b.online ? "Online" : b.city}{b.discount > 0 ? ` · ${b.discount}% off via this link` : ""}</p>
                    </div>
                    <button className="er-btn er-btn-primary er-btn-sm">Visit <Arrow size={14} /></button>
                  </div>
                  {rev && (
                    <div style={{ borderTop: `1px solid ${C.line}`, background: C.panel, padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Stars value={rev.stars} /><span style={{ fontSize: 12, fontWeight: 600, color: C.inkSoft }}>{inf.name.split(" ")[0]}'s review</span></div>
                      {rev.text && <p className="er-serif" style={{ margin: "8px 0 0", fontSize: 16, lineHeight: 1.45, color: C.inkSoft }}>&ldquo;{rev.text}&rdquo;</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div style={{ marginTop: 28, background: C.ink, borderRadius: 18, padding: "26px 24px", textAlign: "center" }}>
          <p className="er-serif" style={{ margin: 0, color: C.paper, fontSize: 19, fontWeight: 500 }}>Want recommendations like these?</p>
          <button className="er-btn er-btn-sm" style={{ marginTop: 14, background: C.paper, color: C.ink }} onClick={onBrowse}>Browse all brands <Arrow size={15} /></button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Landing ---------- */
function Landing({ activeCat, setActiveCat, businesses, links, influencers, onList, onCreator, onAdmin, onProfile, onOpenBusiness }) {
  const backersOf = (id) => links.filter((l) => l.businessId === id).map((l) => influencers.find((i) => i.handle === l.handle)).filter(Boolean);
  const visible = businesses.filter((b) => b.status === "approved" && b.categories.includes(activeCat));
  const top = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const steps = [
    { t: "Businesses apply", d: "They add their details and a customer perk. We review every one before it's listed." },
    { t: "Creators curate", d: "With an invite, a creator backs the businesses they trust and gets a tracked link." },
    { t: "Everyone wins", d: "Customers save, creators earn their cut, and businesses only pay on real results." },
  ];

  return (
    <div>
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(253,252,250,.82)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
        <div className="er-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <button onClick={top} style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer" }}>
            <Seal size={20} /><span className="er-serif" style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.01em", color: C.ink }}>Easy Recommend</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="er-nav" onClick={onAdmin}>Admin</button>
            <button className="er-btn er-btn-ghost er-btn-sm" onClick={onList}>List business</button>
            <button className="er-btn er-btn-primary er-btn-sm" onClick={onCreator}>Join as creator</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="er-wrap" style={{ padding: "70px 22px 60px" }}>
        <div className="er-hero">
          <div>
            <span className="er-eyebrow">Invite-only · creator network</span>
            <h1 className="er-serif" style={{ margin: "16px 0 0", fontSize: "clamp(38px,6vw,62px)", lineHeight: 1.04, fontWeight: 500, letterSpacing: "-.02em" }}>
              Send people somewhere good. Get paid when they go.
            </h1>
            <p style={{ margin: "22px 0 0", fontSize: 17.5, lineHeight: 1.55, color: C.inkSoft, maxWidth: 480 }}>
              A small network of creators sharing the beauty, legal, and education businesses they actually trust — earning on every customer who follows the link.
            </p>
            <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="er-btn er-btn-primary" onClick={onCreator}>Join as a creator <Arrow size={16} /></button>
              <button className="er-btn er-btn-ghost" onClick={onList}>List your business</button>
            </div>
            <p style={{ margin: "20px 0 0", fontSize: 13, color: C.muted, display: "flex", alignItems: "center", gap: 7 }}><Seal size={15} /> Every business is reviewed before it's listed.</p>
          </div>

          <div style={{ position: "relative" }}>
            <div className="er-card" style={{ position: "absolute", inset: 0, transform: "rotate(-3.5deg) translateY(12px)", background: C.panel }} />
            <RecCard style={{ position: "relative" }} name="Mia Chen" handle="miaglow" category="Beauty"
              quote="My skin has never looked better — the vitamin C serum is unreal. I send everyone here." brand="Lumière Skincare" stars={5} />
            <div className="er-card" style={{ position: "absolute", right: -8, bottom: -20, padding: "9px 13px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 12px 26px rgba(28,26,23,.14)" }}>
              <Stars value={5} size={13} /><span style={{ fontSize: 12.5, fontWeight: 600 }}>4,200+ booked</span>
            </div>
          </div>
        </div>
      </section>

      {/* Browse directory */}
      <section style={{ background: C.panel, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div className="er-wrap" style={{ padding: "72px 22px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <span className="er-eyebrow">The directory</span>
              <h2 className="er-serif" style={{ margin: "10px 0 0", fontSize: "clamp(28px,4vw,40px)", fontWeight: 500, letterSpacing: "-.01em" }}>Browsed and vouched for</h2>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {CAT_LIST.map((c) => {
                const on = activeCat === c; const cc = CATS[c];
                return <button key={c} onClick={() => setActiveCat(c)} style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, padding: "9px 16px", borderRadius: 999, border: `1px solid ${on ? C.ink : C.line}`, background: on ? C.ink : "#fff", color: on ? C.paper : C.inkSoft }}>{c}</button>;
              })}
            </div>
          </div>
          <div className="er-cards" style={{ marginTop: 28 }}>
            {visible.map((b) => <BusinessCard key={b.id} b={b} backers={backersOf(b.id)} onOpen={() => onOpenBusiness(b.id)} />)}
          </div>
          {visible.length === 0 && <p style={{ marginTop: 28, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: "44px 0", textAlign: "center", fontSize: 14, color: C.muted }}>No live businesses in {activeCat} yet.</p>}
        </div>
      </section>

      {/* Creators */}
      <section className="er-wrap" style={{ padding: "72px 22px" }}>
        <span className="er-eyebrow">The contributors</span>
        <h2 className="er-serif" style={{ margin: "10px 0 0", fontSize: "clamp(28px,4vw,40px)", fontWeight: 500, letterSpacing: "-.01em" }}>The people doing the recommending</h2>
        <p style={{ margin: "8px 0 0", fontSize: 15, color: C.muted }}>Tap a profile to see the brands they back and what they had to say.</p>
        <div className="er-creators" style={{ marginTop: 28 }}>
          {influencers.map((inf) => {
            const n = links.filter((l) => l.handle === inf.handle).length;
            return (
              <button key={inf.handle} onClick={() => onProfile(inf.handle)} className="er-card er-card-h" style={{ display: "flex", alignItems: "center", gap: 16, textAlign: "left", padding: 16, cursor: "pointer" }}>
                <Avatar name={inf.name} image={inf.image} size={48} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span className="er-serif" style={{ fontSize: 18, fontWeight: 500 }}>{inf.name}</span><Seal size={15} /></div>
                  <p style={{ margin: "1px 0 0", fontSize: 13, color: C.muted }}>@{inf.handle} · {n} recommendation{n !== 1 ? "s" : ""}</p>
                </div>
                <ChevR size={18} color={C.muted} />
              </button>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="er-wrap" style={{ padding: "0 22px 72px" }}>
        <div className="er-stepwork">
          {steps.map((s, i) => (
            <div key={i} style={{ padding: "28px 26px 28px 0", borderTop: `1px solid ${C.ink}` }}>
              <span className="er-eyebrow">0{i + 1}</span>
              <h3 className="er-serif" style={{ margin: "12px 0 6px", fontSize: 22, fontWeight: 500 }}>{s.t}</h3>
              <p style={{ margin: 0, fontSize: 14.5, color: C.muted, lineHeight: 1.5 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
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
.er-btn[disabled]{opacity:.4;cursor:not-allowed}
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
  const [businesses, setBusinesses] = useState(SEED_BUSINESSES);
  const [influencers, setInfluencers] = useState(SEED_INFLUENCERS);
  const [links, setLinks] = useState(SEED_LINKS);
  const [reviews, setReviews] = useState(SEED_REVIEWS);
  const [brandOpen, setBrandOpen] = useState(false);
  const [brandDone, setBrandDone] = useState(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creatorPreselect, setCreatorPreselect] = useState(null);
  const [detailId, setDetailId] = useState(null);

  // Load fonts + inject styles once.
  useEffect(() => {
    const f = document.createElement("link");
    f.rel = "stylesheet";
    f.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(f);
    const s = document.createElement("style");
    s.textContent = STYLES;
    document.head.appendChild(s);
    return () => { document.head.removeChild(f); document.head.removeChild(s); };
  }, []);

  const goProfile = (h) => { setProfileHandle(h); setView("profile"); window.scrollTo(0, 0); };
  const goHome = () => { setView("home"); window.scrollTo(0, 0); };

  const submitBrand = (f) => {
    setBusinesses((p) => [...p, { id: Date.now(), name: f.name, categories: f.categories, city: f.city, online: f.online, commissionType: f.commissionType, commissionPct: f.commissionPct, commissionFlat: f.commissionFlat, discount: f.discount, status: "pending", blurb: "Newly submitted business." }]);
    setBrandOpen(false); setBrandDone(f.name);
  };
  const completeCreator = ({ handle, name, image, businessId, review }) => {
    setInfluencers((p) => p.find((i) => i.handle === handle) ? p : [...p, { handle, name, image: image || "", bio: "Curating businesses worth trusting." }]);
    setLinks((p) => [...p, { id: Date.now(), handle, businessId }]);
    if (review) setReviews((p) => [...p, { id: Date.now() + 1, handle, businessId, stars: review.stars, text: review.text }]);
  };

  return (
    <div className="er-root">
      {view === "home" && (
        <Landing activeCat={activeCat} setActiveCat={setActiveCat} businesses={businesses} links={links} influencers={influencers}
          onList={() => setBrandOpen(true)} onCreator={() => { setCreatorPreselect(null); setCreatorOpen(true); }} onAdmin={() => { setView("admin"); window.scrollTo(0, 0); }} onProfile={goProfile} onOpenBusiness={(id) => setDetailId(id)} />
      )}
      {view === "admin" && (
        <AdminPanel businesses={businesses}
          onApprove={(id) => setBusinesses((p) => p.map((b) => b.id === id ? { ...b, status: "approved" } : b))}
          onReject={(id) => setBusinesses((p) => p.filter((b) => b.id !== id))}
          onEdit={(id, patch) => setBusinesses((p) => p.map((b) => b.id === id ? { ...b, ...patch } : b))}
          onBack={goHome} />
      )}
      {view === "profile" && (
        <InfluencerProfile handle={profileHandle} influencers={influencers} businesses={businesses} links={links} reviews={reviews} onBack={goHome} onBrowse={goHome} />
      )}  

      {detailId != null && (() => {
        const b = businesses.find((x) => x.id === detailId);
        if (!b) return null;
        const rv = reviews.filter((r) => r.businessId === b.id).map((r) => ({ ...r, inf: influencers.find((i) => i.handle === r.handle) }));
        const bk = links.filter((l) => l.businessId === b.id).map((l) => influencers.find((i) => i.handle === l.handle)).filter(Boolean);
        return <BusinessDetail b={b} reviews={rv} backers={bk}
          onClose={() => setDetailId(null)}
          onProfile={(h) => { setDetailId(null); goProfile(h); }}
          onRecommend={(id) => { setDetailId(null); setCreatorPreselect(id); setCreatorOpen(true); }} />;
      })()}

      {brandOpen && <BrandModal onClose={() => setBrandOpen(false)} onSubmit={submitBrand} />}
      {brandDone && <BrandSuccess name={brandDone} onClose={() => setBrandDone(null)} />}
      {creatorOpen && <CreatorModal businesses={businesses} initialBusinessId={creatorPreselect} onClose={() => setCreatorOpen(false)} onComplete={completeCreator} onViewProfile={goProfile} />}
    </div>
  );
}