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
  const photo = (b.photos || [])[0]; const tint = tintFor(b.id || b.name);
  return (
    <div className="er-card er-card-h" role="button" tabIndex={0} onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      style={{ display: "flex", flexDirection: "column", overflow: "hidden", cursor: "pointer", textAlign: "left" }}>
      <div style={{ position: "relative", height: 128, background: photo ? cat.bg : tint.bg, display: "grid", placeItems: "center" }}>
        {photo ? <img src={photo} alt={b.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ color: tint.color, opacity: .7 }}><Store size={30} /></span>}
        <span style={{ position: "absolute", left: 12, top: 12, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,.92)", color: cat.color }}>{b.categories[0]}</span>
        <span style={{ position: "absolute", right: 12, top: 12, background: "#fff", borderRadius: 999, display: "flex", padding: 1 }}><Seal size={18} /></span>
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
          <h2 className="er-serif" style={{ margin: "12px 0 0", fontSize: 28, fontWeight: 500, letterSpacing: "-.01em" }}>{b.name}</h2>
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
              {b.phone && <a href={`tel:${b.phone}`} className="er-btn er-btn-light er-btn-sm" style={{ textDecoration: "none" }}><Phone size={14} /> {b.phone}</a>}
              {b.email && <a href={`mailto:${b.email}`} className="er-btn er-btn-light er-btn-sm" style={{ textDecoration: "none" }}><Mail size={14} /> Email</a>}
            </div>
          )}
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
function BrandModal({ onClose, onDone, onRefresh, onLogin }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "", phone: "", email: "", website: "", categories: [], city: "", online: false, commissionType: "percent", commissionPct: 15, commissionFlat: 25, discount: 0, photos: [] });
  const [otp, setOtp] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const onPhotos = async (e) => {
    const files = [...(e.target.files || [])]; if (!files.length) return;
    const urls = [];
    for (const file of files) { try { urls.push(await fileToDataURL(file, 1000, 0.82)); } catch (x) {} }
    setF((p) => ({ ...p, photos: [...p.photos, ...urls].slice(0, 6) }));
    e.target.value = "";
  };
  const toggleCat = (c) => set("categories", f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c]);
  const commValid = (f.commissionType === "percent" && f.commissionPct > 0) || (f.commissionType === "flat" && f.commissionFlat > 0) || (f.commissionType === "both" && f.commissionPct > 0 && f.commissionFlat > 0);
  const valid = [f.name && f.phone && f.email, f.categories.length > 0 && (f.online || f.city), commValid, otp.length >= 6];
  const titles = ["About your business", "Where to find you", "Your terms", "Verify your number"];

  const sendCode = async () => { setErr(""); try { await api("/otp/send", { method: "POST", body: { phone: f.phone } }); } catch (e) { setErr(e.message); } };
  const submit = async (via = "phone") => {
    setBusy(true); setErr("");
    try {
      const body = via === "email" ? { ...f, via: "email" } : { ...f, otp };
      const r = await api("/business", { method: "POST", body });
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
            <Field label="Brand name"><input className="er-input" placeholder="Lumière Skincare" value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Phone number" hint="Used to verify you — and shown on your listing so customers can reach you."><input className="er-input" placeholder="+1 555 010 2030" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="Email" hint="Shown on your listing."><input className="er-input" placeholder="hello@brand.com" value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Website" hint="Optional — the link customers visit."><input className="er-input" placeholder="brand.com" value={f.website} onChange={(e) => set("website", e.target.value)} /></Field>
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
            <Field label="Photos" hint="Upload a few so creators can showcase you.">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {f.photos.map((src, i) => (
                  <div key={i} style={{ position: "relative", width: 76, height: 76, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.line}` }}>
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <button type="button" onClick={() => set("photos", f.photos.filter((_, j) => j !== i))} style={{ position: "absolute", top: -7, right: -7, width: 20, height: 20, borderRadius: "50%", border: "none", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.25)", cursor: "pointer", color: C.muted, display: "grid", placeItems: "center" }}><Close size={11} /></button>
                  </div>))}
                {f.photos.length < 6 && (
                  <label style={{ width: 76, height: 76, borderRadius: 12, border: `2px dashed ${C.line}`, display: "grid", placeItems: "center", cursor: "pointer", color: C.muted }}>
                    <Plus size={20} /><input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onPhotos} />
                  </label>)}
              </div>
            </Field>
          </>}
          {step === 3 && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 16px", fontSize: 14, color: C.inkSoft }}>Enter the 6-digit code we texted <b style={{ color: C.ink }}>{f.phone || "your phone"}</b>.</div>
            <Field label="Verification code">
              <input className="er-input" style={{ letterSpacing: ".35em", fontWeight: 700, textAlign: "center" }} placeholder="••••••" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} /></Field>
            <button className="er-link" onClick={sendCode} style={{ alignSelf: "flex-start" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Send size={14} /> Text a code to my phone</span></button>
            <ErrBox msg={err} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.muted, fontSize: 12.5 }}><div style={{ flex: 1, height: 1, background: C.line }} />or<div style={{ flex: 1, height: 1, background: C.line }} /></div>
            <button className="er-btn er-btn-ghost er-btn-block" disabled={!f.email || busy} onClick={() => submit("email")}><Mail size={15} /> Continue with email — no code</button>
          </div>}
        </div>
        <div style={{ marginTop: 26, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {step > 0 ? <button className="er-btn er-btn-ghost" onClick={() => setStep(step - 1)}><ChevL size={16} /> Back</button> : <span />}
          {step < 3
            ? <button className="er-btn er-btn-primary" disabled={!valid[step]} onClick={() => setStep(step + 1)}>Continue <ChevR size={16} /></button>
            : <button className="er-btn er-btn-primary" disabled={!valid[3] || busy} onClick={() => submit("phone")}><Check size={16} /> {busy ? "Submitting…" : "Submit for review"}</button>}
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
  const [cName, setCName] = useState(""); const [cCode, setCCode] = useState("");
  // brand
  const [bmethod, setBmethod] = useState("phone");
  const [phone, setPhone] = useState(""); const [email, setEmail] = useState(""); const [otp, setOtp] = useState(""); const [sent, setSent] = useState(false);

  const creatorLogin = async () => {
    setBusy(true); setErr("");
    try { const r = await api("/creator/login", { method: "POST", body: { username: cName, inviteCode: cCode } }); onLogin({ role: "creator", token: r.token, username: r.username }); onAfterCreator(r.username); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const sendCode = async () => { setErr(""); try { await api("/otp/send", { method: "POST", body: { phone } }); setSent(true); } catch (e) { setErr(e.message); } };
  const brandLogin = async () => {
    setBusy(true); setErr("");
    try { const r = await api("/business/login/verify", { method: "POST", body: { phone, otp } }); onLogin({ role: "brand", token: r.token, phone }); onAfterBrand(); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const emailLogin = async () => {
    setBusy(true); setErr("");
    try { const r = await api("/business/login/email", { method: "POST", body: { email } }); onLogin({ role: "brand", token: r.token, email }); onAfterBrand(); }
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
          <Field label="Invite code"><input className="er-input" style={{ letterSpacing: ".15em", fontWeight: 700 }} placeholder="Enter your invite code" value={cCode} onChange={(e) => setCCode(e.target.value.toUpperCase())} /></Field>
          <ErrBox msg={err} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button className="er-btn er-btn-ghost" onClick={() => setMode(null)}><ChevL size={16} /> Back</button>
            <button className="er-btn er-btn-primary" disabled={!cName || !cCode || busy} onClick={creatorLogin}>{busy ? "…" : "Log in"} <Arrow size={16} /></button>
          </div>
        </div>}

        {mode === "brand" && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[["phone", "Phone"], ["email", "Email"]].map(([m, lbl]) => { const on = bmethod === m;
              return <button key={m} type="button" onClick={() => { setBmethod(m); setErr(""); setSent(false); }} style={{ flex: 1, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, padding: "10px 8px", borderRadius: 10, border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff", color: on ? C.accentD : C.inkSoft }}>{lbl}</button>; })}
          </div>
          {bmethod === "phone" ? <>
            <Field label="Phone number" hint="We'll text a code to the number you signed up with."><input className="er-input" placeholder="+1 555 010 2030" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            {!sent ? <button className="er-btn er-btn-primary er-btn-block" disabled={!phone} onClick={sendCode}><Send size={16} /> Send code</button>
              : <>
                <Field label="Verification code"><input className="er-input" style={{ letterSpacing: ".35em", fontWeight: 700, textAlign: "center" }} placeholder="••••••" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} /></Field>
                <button className="er-btn er-btn-primary er-btn-block" disabled={otp.length < 6 || busy} onClick={brandLogin}>{busy ? "…" : "Log in"}</button>
              </>}
          </> : <>
            <Field label="Email" hint="The email you listed your business with. No code needed."><input className="er-input" placeholder="hello@brand.com" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <button className="er-btn er-btn-primary er-btn-block" disabled={!email || busy} onClick={emailLogin}>{busy ? "…" : "Log in"} <Arrow size={16} /></button>
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
  const [d, setD] = useState({ name: b.name, blurb: b.blurb || "", city: b.city || "", online: !!b.online, website: b.website || "", discount: b.discount || 0, categories: b.categories || [], commissionType: b.commissionType || "percent", commissionPct: b.commissionPct || 0, commissionFlat: b.commissionFlat || 0, photos: b.photos || [] });
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
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
function MyBusiness({ session, onBack, onRefresh }) {
  const [rows, setRows] = useState(null); const [err, setErr] = useState("");
  const reload = async () => { try { setRows(await api(`/business/me?token=${encodeURIComponent(session.token)}`)); setErr(""); } catch (e) { setErr(e.message); } onRefresh(); };
  useEffect(() => { reload(); }, []);
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 22px 80px" }}>
      <button className="er-link" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}><ChevL size={15} /> Back to site</button>
      <h1 className="er-serif" style={{ margin: 0, fontSize: 32, fontWeight: 500 }}>My business</h1>
      <p style={{ margin: "6px 0 24px", fontSize: 14.5, color: C.muted }}>Edit your listing, perk, and creator reward anytime.</p>
      {err && <p style={{ background: "#FBE9E7", border: "1px solid #F3C5BD", borderRadius: 12, padding: "12px 14px", fontSize: 13.5, color: "#9B3024" }}>{err}</p>}
      {rows === null && !err && <p style={{ color: C.muted }}>Loading…</p>}
      {rows && rows.length === 0 && <p style={{ background: C.panel, borderRadius: 14, padding: "32px 0", textAlign: "center", color: C.muted }}>No business found on this account.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{(rows || []).map((b) => <BizEditCard key={b.id} b={b} token={session.token} reload={reload} />)}</div>
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
  const [code, setCode] = useState(""); const [username, setUsername] = useState(loggedIn ? sess.username : ""); const [image, setImage] = useState("");
  const [token, setToken] = useState(loggedIn ? sess.token : "");
  const [picked, setPicked] = useState(initialBusinessId ? [initialBusinessId] : []);
  const [reviews, setReviews] = useState({});
  const [query, setQuery] = useState("");
  const approved = businesses;
  const initialCat = initialBusinessId ? ((approved.find((b) => b.id === initialBusinessId)?.categories || [])[0] || null) : null;
  const [openCat, setOpenCat] = useState(initialCat);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [results, setResults] = useState(null);
  const handle = loggedIn ? sess.username : slugify(username);
  const RATING = ["", "Poor", "Fair", "Good", "Great", "Exceptional"];

  const toggle = (id) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const setReview = (id, patch) => setReviews((prev) => ({ ...prev, [id]: { stars: 0, text: "", ...prev[id], ...patch } }));
  const onPhoto = async (e) => { const file = e.target.files && e.target.files[0]; if (!file) return; try { setImage(await fileToDataURL(file, 400, 0.85)); } catch (x) {} };
  const join = async () => {
    setBusy(true); setErr("");
    try {
      const r = await api("/influencer", { method: "POST", body: { inviteCode: code, username: handle, image } });
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
  const match = (b) => !q || b.name.toLowerCase().includes(q);
  const byCat = {}; approved.forEach((b) => { const c = (b.categories || [])[0] || "Other"; (byCat[c] = byCat[c] || []).push(b); });
  const cats = [...CAT_LIST.filter((c) => byCat[c]), ...Object.keys(byCat).filter((c) => !CAT_LIST.includes(c))];
  const noMatches = q && cats.every((c) => !byCat[c].filter(match).length);

  return (
    <Modal onClose={onClose} wide>
      <div style={{ padding: "30px 28px" }}>
        {step < 3 && <><span className="er-eyebrow">For creators</span><div style={{ marginTop: 12 }}><Stepper step={step} total={3} /></div></>}
        {step === 0 && <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <div><h2 className="er-serif" style={{ margin: 0, fontSize: 27, fontWeight: 500 }}>Set up your profile</h2><p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted }}>Invite-only. A photo and a username — that's the whole profile.</p></div>
          <Field label="Invite code" hint="Invite-only — ask your inviter for the code."><input className="er-input" style={{ letterSpacing: ".15em", fontWeight: 700 }} placeholder="Enter your invite code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /></Field>
          <Field label="Profile photo">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {image ? <img src={image} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} /> : <span style={{ width: 64, height: 64, borderRadius: "50%", display: "grid", placeItems: "center", background: C.ink, color: C.paper }}><Spark size={24} /></span>}
              <label className="er-btn er-btn-light er-btn-sm" style={{ cursor: "pointer" }}>{image ? "Change photo" : "Upload photo"}<input type="file" accept="image/*" style={{ display: "none" }} onChange={onPhoto} /></label>
            </div></Field>
          <Field label="Username" hint="This becomes your public profile link.">
            <div style={{ display: "flex", alignItems: "center", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 11, padding: "11px 14px" }}>
              <span style={{ fontSize: 14.5, color: C.muted }}>easyrecommend.co/@</span>
              <input style={{ flex: 1, border: "none", outline: "none", background: "none", fontSize: 14.5, fontFamily: "inherit", color: C.ink }} placeholder="yourname" value={username} onChange={(e) => setUsername(e.target.value)} /></div></Field>
          <button className="er-btn er-btn-primary er-btn-block" disabled={!code || !handle || busy} onClick={join}>{busy ? "Checking…" : <>Continue <Arrow size={16} /></>}</button>
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
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto" }}>
            {cats.map((c) => { const list = byCat[c].filter(match); if (q && !list.length) return null; const open = q ? true : openCat === c; const x = CATS[c] || CATS.Beauty; const selCount = list.filter((b) => picked.includes(b.id)).length;
              return <div key={c} style={{ border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden" }}>
                <button onClick={() => { if (!q) setOpenCat(open ? null : c); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", background: "#fff", border: "none", cursor: q ? "default" : "pointer", textAlign: "left" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: x.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 15, color: C.ink }}>{c}</span>
                  {selCount > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, color: x.color, background: x.bg, borderRadius: 999, padding: "2px 9px" }}>{selCount} picked</span>}
                  <span style={{ fontSize: 12.5, color: C.muted }}>{list.length}</span>
                  <span style={{ color: C.muted, display: "flex", transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}><ChevR size={16} /></span>
                </button>
                {open && <div>
                  {list.map((b) => { const on = picked.includes(b.id);
                    return <button key={b.id} onClick={() => toggle(b.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: "11px 14px", border: "none", borderTop: `1px solid ${C.line}`, background: on ? C.accentSoft : "#fff", cursor: "pointer" }}>
                      <span style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: "grid", placeItems: "center", border: `1.5px solid ${on ? C.accent : "#CFC8BA"}`, background: on ? C.accent : "#fff", color: "#fff" }}>{on && <Check size={14} />}</span>
                      <span style={{ minWidth: 0, flex: 1 }}><span style={{ display: "block", fontWeight: 600, fontSize: 14.5, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span><span style={{ display: "block", fontSize: 12.5, color: C.muted }}>{b.online ? "Online" : b.city}</span></span>
                    </button>; })}
                </div>}
              </div>; })}
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
                {r.stars > 0 && <textarea className="er-input" style={{ marginTop: 10 }} placeholder={`What did you love about ${b.name}?`} value={r.text} onChange={(e) => setReview(id, { text: e.target.value })} />}
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
  const [authed, setAuthed] = useState(() => !!adminKey());
  const [keyInput, setKeyInput] = useState(""); const [authErr, setAuthErr] = useState(""); const [authBusy, setAuthBusy] = useState(false);
  const [rows, setRows] = useState(null); const [err, setErr] = useState(""); const [seeding, setSeeding] = useState(false);

  const reload = async () => {
    try { setRows(await api("/admin/businesses", { admin: true })); setErr(""); }
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
function EditProfileModal({ token, current, onClose, onSaved }) {
  const [image, setImage] = useState(current.image || ""); const [bio, setBio] = useState(current.bio || "");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const onPhoto = async (e) => { const file = e.target.files && e.target.files[0]; if (!file) return; try { setImage(await fileToDataURL(file, 400, 0.85)); } catch (x) {} };
  const save = async () => { setBusy(true); setErr(""); try { await api("/creator/me", { method: "PATCH", body: { token, image, bio } }); onSaved(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
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
        <ErrBox msg={err} />
        <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="er-btn er-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="er-btn er-btn-primary" disabled={busy} onClick={save}><Check size={16} /> {busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </Modal>
  );
}
function InfluencerProfile({ handle, session, dataVersion, onBack, onBrowse, onOpenBusiness, onAddBrand, onRefresh }) {
  const [data, setData] = useState(null); const [err, setErr] = useState(""); const [editing, setEditing] = useState(false); const [copied, setCopied] = useState(false);
  const isOwner = session && session.role === "creator" && session.username === handle;
  const profileUrl = `${window.location.origin}/@${handle}`;
  const copyLink = async () => { try { await navigator.clipboard.writeText(profileUrl); } catch (e) {} setCopied(true); setTimeout(() => setCopied(false), 1600); };
  const load = () => api(`/creator/${handle}`).then(setData).catch((e) => setErr(e.message));
  useEffect(() => { setData(null); setErr(""); load(); }, [handle, dataVersion]);
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
              <p style={{ margin: "8px 0 0", fontSize: 12.5, fontWeight: 600, color: C.inkSoft }}>{recs.length} recommendation{recs.length !== 1 ? "s" : ""}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
              <button className="er-btn er-btn-light er-btn-sm" onClick={copyLink} style={{ color: copied ? C.accent : C.ink }}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}</button>
              {isOwner && <button className="er-btn er-btn-light er-btn-sm" onClick={() => setEditing(true)}><Edit size={14} /> Edit profile</button>}
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 22px 60px" }}>
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
                      <p style={{ margin: "2px 0 0", fontSize: 12.5, color: C.muted }}>{b.online ? "Online" : b.city}{b.discount > 0 ? ` · ${b.discount}% off via this link` : ""}</p></div>
                    {isOwner && <button className="er-btn er-btn-ghost er-btn-sm" onClick={() => removeBrand(b.id)}><Close size={14} /> Remove</button>}
                  </div>
                  {!isOwner && hasContact && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 13 }}>
                    {b.website && <button className="er-btn er-btn-primary er-btn-sm" onClick={() => { trackClick(data.username, b.id); openSite(b.website); }}><Globe size={14} /> {site}</button>}
                    {b.email && <a href={`mailto:${b.email}`} className="er-btn er-btn-light er-btn-sm" style={{ textDecoration: "none" }}><Mail size={14} /> {b.email}</a>}
                    {b.phone && <a href={`tel:${b.phone}`} className="er-btn er-btn-light er-btn-sm" style={{ textDecoration: "none" }}><Phone size={14} /> {b.phone}</a>}
                  </div>}
                  {!isOwner && !hasContact && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: C.muted }}>Contact details coming soon.</p>}
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
function Landing({ activeCat, setActiveCat, businesses, creators, loading, error, session, onList, onCreator, onAdmin, onProfile, onOpenBusiness, onLogin, onLogout, onMyProfile, onMyBiz }) {
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
          <button onClick={top} style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}><Seal size={20} /><span className="er-serif" style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.01em", color: C.ink, whiteSpace: "nowrap" }}>Easy Recommend</span></button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {session ? <>
              {session.role === "creator"
                ? <button className="er-btn er-btn-ghost er-btn-sm" onClick={onMyProfile}>My profile</button>
                : <button className="er-btn er-btn-ghost er-btn-sm" onClick={onMyBiz}>My business</button>}
              <button className="er-btn er-btn-ghost er-btn-sm" onClick={onLogout}>Log out</button>
            </> : <>
              <button className="er-btn er-btn-ghost er-btn-sm" onClick={onLogin}>Log in</button>
              <button className="er-btn er-btn-ghost er-btn-sm er-hide-sm" onClick={onList}>List business</button>
              <button className="er-btn er-btn-primary er-btn-sm" onClick={onCreator}>Join</button>
            </>}
          </div>
        </div>
      </header>

      <section className="er-wrap" style={{ padding: "70px 22px 60px" }}>
        <div className="er-hero">
          <div>
            <span className="er-eyebrow">Invite-only · creator network</span>
            <h1 className="er-serif" style={{ margin: "16px 0 0", fontSize: "clamp(38px,6vw,62px)", lineHeight: 1.04, fontWeight: 500, letterSpacing: "-.02em" }}>Make recommendations and get paid for them.</h1>
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
          {error && <p style={{ marginTop: 24, background: "#FBE9E7", border: "1px solid #F3C5BD", borderRadius: 14, padding: "16px 18px", fontSize: 14, color: "#9B3024" }}>Something went wrong loading businesses. Please reload in a moment.</p>}
          <div className="er-cards" style={{ marginTop: 28 }}>{visible.map((b) => <BusinessCard key={b.id} b={b} onOpen={() => onOpenBusiness(b.id)} />)}</div>
          {!error && !loading && visible.length === 0 && <p style={{ marginTop: 28, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: "44px 0", textAlign: "center", fontSize: 14, color: C.muted }}>No businesses in {activeCat} yet — check back soon.</p>}
          {loading && <p style={{ marginTop: 28, textAlign: "center", color: C.muted }}>Loading…</p>}
        </div>
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
        <div className="er-wrap" style={{ padding: "34px 22px 6px" }}>
          <span className="er-eyebrow">How tracking works</span>
          <div style={{ marginTop: 14, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", maxWidth: 900 }}>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: C.muted }}><b style={{ color: C.ink }}>A link for every recommendation.</b> When a creator backs a business, we mint a unique tracked link for that pairing — so each recommendation is measured on its own.</p>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: C.muted }}><b style={{ color: C.ink }}>Clicks are attributed.</b> Tapping a creator's link records the click and tags the visit to that creator, then sends the customer to the business.</p>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: C.muted }}><b style={{ color: C.ink }}>Sales close the loop.</b> When a tagged visit becomes a purchase, the business confirms it and the creator earns the agreed commission — visible on their account.</p>
          </div>
          <p style={{ margin: "16px 0 0", fontSize: 12, color: C.muted, maxWidth: 900 }}>Commission terms are set by each business and may run through their own affiliate program. Attribution windows and payout timing can vary by business.</p>
        </div>
        <div className="er-wrap" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", padding: "26px 22px", marginTop: 22, borderTop: `1px solid ${C.line}` }}>
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
@media(max-width:559px){.er-nav{display:none}.er-hide-sm{display:none}}
@media(max-width:400px){.er-hide-xs{display:none}}
@media(min-width:680px){.er-cards{grid-template-columns:1fr 1fr}.er-creators{grid-template-columns:1fr 1fr}}
@media(min-width:1000px){.er-cards{grid-template-columns:1fr 1fr 1fr}.er-hero{grid-template-columns:1.05fr .95fr;gap:60px}.er-stepwork{grid-template-columns:1fr 1fr 1fr}}
.er-root button:focus-visible,.er-root input:focus-visible,.er-root a:focus-visible{outline:2px solid ${C.accent};outline-offset:2px}
@media(prefers-reduced-motion:reduce){.er-root *{transition:none!important}}
`;

/* ---------- Root ---------- */
export default function App() {
  const initial = parseRoute();
  const [view, setView] = useState(initial.view);
  const [profileHandle, setProfileHandle] = useState(initial.handle);
  const [activeCat, setActiveCat] = useState("Beauty");
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
      setBusinesses(bz); setCreators(cr); setError(""); setVer((v) => v + 1);
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
      {view === "home" && <Landing activeCat={activeCat} setActiveCat={setActiveCat} businesses={businesses} creators={creators} loading={loading} error={error} session={session}
        onList={() => setBrandOpen(true)} onCreator={() => { setCreatorPreselect(null); setCreatorOpen(true); }} onAdmin={goAdmin} onProfile={goProfile} onOpenBusiness={(id) => setDetailId(id)}
        onLogin={() => setLoginOpen(true)} onLogout={logout} onMyProfile={() => session && goProfile(session.username)} onMyBiz={() => { setView("mybiz"); nav("/my-business"); }} />}
      {view === "admin" && <AdminPanel onBack={goHome} onRefresh={refresh} />}
      {view === "mybiz" && session && <MyBusiness session={session} onBack={goHome} onRefresh={refresh} />}
      {view === "profile" && <InfluencerProfile handle={profileHandle} session={session} dataVersion={ver} onBack={goHome} onBrowse={goHome} onOpenBusiness={(id) => setDetailId(id)} onAddBrand={() => { setCreatorPreselect(null); setCreatorOpen(true); }} onRefresh={refresh} />}

      {detailId != null && <BusinessDetail id={detailId} onClose={() => setDetailId(null)} onProfile={(h) => { setDetailId(null); goProfile(h); }} onRecommend={(id) => { setDetailId(null); setCreatorPreselect(id); setCreatorOpen(true); }} />}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onLogin={login} onAfterCreator={(u) => { setLoginOpen(false); goProfile(u); }} onAfterBrand={() => { setLoginOpen(false); setView("mybiz"); nav("/my-business"); }} />}
      {brandOpen && <BrandModal onClose={() => setBrandOpen(false)} onDone={(name) => { setBrandOpen(false); setBrandDone(name); }} onRefresh={refresh} onLogin={login} />}
      {brandDone && <BrandSuccess name={brandDone} onClose={() => setBrandDone(null)} />}
      {creatorOpen && <CreatorModal businesses={businesses} initialBusinessId={creatorPreselect} onClose={() => setCreatorOpen(false)} onRefresh={refresh} onLogin={login} onViewProfile={goProfile} />}
    </div>
  );
}