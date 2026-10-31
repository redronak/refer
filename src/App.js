import { useState, useEffect, useRef, Fragment } from "react";

/* ============================================================================
   Easy Recommend, wired to the Express backend (router mounted at /easyrecommend)
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
// Shown to businesses awaiting approval.
const catOf = (b) => CATS[(b.categories || [])[0]] || CATS.Beauty;
// Stable-but-varied light tint per brand (used when there's no cover photo).
function hashStr(s) { let h = 0; const str = String(s || ""); for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
function tintFor(seed) { const h = hashStr(seed) % 360; return { bg: `hsl(${h}, 64%, 93%)`, color: `hsl(${h}, 42%, 52%)` }; }
const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const emailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
// Country → local payout methods. Each method: [key, label, placeholder].
const PAYOUT_BY_COUNTRY = {
  "United States": [["venmo", "Venmo", "@your-venmo"], ["zelle", "Zelle", "Email or phone"], ["paypal", "PayPal", "PayPal email"], ["cashapp", "Cash App", "$cashtag"], ["bank", "Bank (ACH)", "Routing + account"]],
  "India": [["upi", "UPI", "yourname@upi"], ["paytm", "Paytm", "Paytm number"], ["bank", "Bank (IMPS/NEFT)", "Account + IFSC"], ["paypal", "PayPal", "PayPal email"]],
  "United Kingdom": [["bank", "Bank transfer", "Sort code + account"], ["paypal", "PayPal", "PayPal email"], ["wise", "Wise", "Wise email"], ["revolut", "Revolut", "@revtag"]],
  "Canada": [["interac", "Interac e-Transfer", "Email or phone"], ["paypal", "PayPal", "PayPal email"], ["bank", "Bank (EFT)", "Transit + account"]],
  "Australia": [["payid", "PayID", "Email or phone"], ["bank", "Bank (BSB)", "BSB + account"], ["paypal", "PayPal", "PayPal email"]],
  "United Arab Emirates": [["bank", "Bank transfer", "IBAN"], ["paypal", "PayPal", "PayPal email"], ["wise", "Wise", "Wise email"]],
  "Singapore": [["paynow", "PayNow", "Phone or NRIC"], ["bank", "Bank transfer", "Account number"], ["paypal", "PayPal", "PayPal email"]],
  "Germany": [["bank", "SEPA transfer", "IBAN"], ["paypal", "PayPal", "PayPal email"], ["wise", "Wise", "Wise email"]],
  "Nigeria": [["bank", "Bank transfer", "Account + bank"], ["paystack", "Paystack", "Paystack email"], ["paypal", "PayPal", "PayPal email"]],
  "Brazil": [["pix", "Pix", "Pix key"], ["bank", "Bank transfer", "Account details"], ["paypal", "PayPal", "PayPal email"]],
  "Mexico": [["spei", "SPEI", "CLABE"], ["bank", "Bank transfer", "Account details"], ["paypal", "PayPal", "PayPal email"]],
  "Other": [["paypal", "PayPal", "PayPal email"], ["wise", "Wise", "Wise email"], ["bank", "Bank transfer", "Account details"]],
};
const PAYOUT_COUNTRIES = Object.keys(PAYOUT_BY_COUNTRY);
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
// Brand list, shared across pages: instant from memory/session cache, then refreshed in the background.
const BIZ_CACHE_KEY = "er_biz_cache_v1";
let bizMem = null;
function cachedBusinesses() { if (bizMem) return bizMem; try { const v = JSON.parse(sessionStorage.getItem(BIZ_CACHE_KEY) || "null"); if (Array.isArray(v)) bizMem = v; } catch (e) {} return bizMem; }
async function fetchBusinesses(token) {
  const r = await api(`/businesses${token ? `?token=${encodeURIComponent(token)}` : ""}`);
  const list = Array.isArray(r) ? r : [];
  if (!token) { bizMem = list; try { sessionStorage.setItem(BIZ_CACHE_KEY, JSON.stringify(list)); } catch (e) {} }
  return list;
}
// ── Money in the viewer's own currency (₹ for India, $ elsewhere) ──
const FX_USD_INR = 88;
const VIEWER_CUR = (() => { try { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; const lang = navigator.language || ""; return /Asia\/(Kolkata|Calcutta)/.test(tz) || /-IN$/i.test(lang) ? "INR" : "USD"; } catch (e) { return "USD"; } })();
function money(n, cur = VIEWER_CUR) { const v = Math.round(Number(n) || 0); try { return new Intl.NumberFormat(cur === "INR" ? "en-IN" : "en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(v); } catch (e) { return (cur === "INR" ? "₹" : "$") + v; } }
const toViewer = (n, from, fx) => (from === VIEWER_CUR ? n : from === "USD" ? n * (fx || FX_USD_INR) : n / (fx || FX_USD_INR));
// Rounded example amount for demos/mockups, given in USD.
const demoMoney = (usd) => money(VIEWER_CUR === "INR" ? Math.max(50, Math.round((usd * FX_USD_INR) / 50) * 50) : usd);
// What a creator earns on a brand, in the viewer's currency. null when the brand hasn't set a commission.
function earnInfo(b) {
  const e = b && b.earn; if (!e || (!(e.pct > 0) && !(e.flat > 0))) return null;
  const est = money(toViewer(e.est, e.currency, e.fx)), flat = e.flat > 0 ? money(toViewer(e.flat, e.currency, e.fx)) : "";
  const line = flat && e.pct > 0 ? `You earn ${flat} + ${e.pct}% of every sale` : flat ? `You earn ${flat} on every sale` : `You earn ${e.pct}% of every sale`;
  const sub = e.pct > 0 ? `That's about ${est} on a ${money(toViewer(e.aov, e.currency, e.fx))} order` : "";
  return { line, sub, est, short: `earn ${e.pct > 0 ? "≈" : ""}${est}/sale` };
}
// Brand sections used everywhere brands are listed.
const SECTION_CHIPS = ["__popular", "__online", "__physical", ""];
const SECTION_LABEL = { __popular: "⭐ Popular", __products: "🧴 Popular products", __online: "💻 Online products", __physical: "🛍️ Physical brands", "": "All" };
// Share & earn and Affiliate pages also get a Popular products tab.
const PRODUCT_CHIPS = ["__popular", "__products", "__online", "__physical", ""];
const chipShown = (c, all) => !c || c === "__products" || all.some((b) => inSection(b, c, []));
const inSection = (b, cat, all) => !cat || (cat === "__popular" ? (b.popular || !all.some((x) => x.popular)) : cat === "__online" ? (!b.popular && b.online) : cat === "__physical" ? (!b.popular && !b.online) : (b.categories || []).includes(cat));
// Shopper discount label: exact % when set, else the brand's range (e.g. "15–30% off" for onboarded partners).
const offText = (b) => (b && b.discountText) || (b && b.discount > 0 ? `${b.discount}% off` : "");
function creatorHandle() { const s = getSession(); return s && s.role === "creator" ? s.username : ""; }

// Open an external website in a new tab, adding https:// if missing.
const trackClick = (username, businessId) => { try { api("/track", { method: "POST", body: { username, businessId, type: "click" } }); } catch (e) {} };
function erClickId() { try { const a = new Uint8Array(12); (window.crypto || window.msCrypto).getRandomValues(a); return Array.from(a, (x) => x.toString(16).padStart(2, "0")).join(""); } catch (e) { return Date.now().toString(16) + Math.random().toString(16).slice(2); } }
// Log the click (link counter + attributable click record) and open the brand site with a ref id appended.
function goToBrand(username, businessId, url) {
  const clickId = erClickId();
  try { api("/track", { method: "POST", body: { username, businessId, type: "click" } }); } catch (e) {}
  try { api("/click", { method: "POST", body: { clickId, handle: username, businessId } }); } catch (e) {}
  if (!url) return;
  const base = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  window.open(base + (base.includes("?") ? "&" : "?") + "er_click=" + clickId, "_blank", "noopener");
}

// Parse the current URL into a view: "/" → home, "/admin" (or #admin) → admin, "/@handle" → profile.
function parseRoute() {
  if (typeof window === "undefined") return { view: "home", handle: null };
  const p = decodeURIComponent(window.location.pathname || "/");
  if (p === "/admin" || window.location.hash === "#admin") return { view: "admin", handle: null };
  if (p === "/my-business") return { view: getSession() ? "mybiz" : "home", handle: null };
  if (p === "/settings") return { view: getSession() ? "settings" : "home", handle: null };
  if (p === "/business") return { view: "business", handle: null };
  if (p === "/brands") return { view: "brands", handle: null };
  if (p === "/share") return { view: "share", handle: null };
  if (p === "/affiliate") return { view: "affiliate", handle: null };
  if (p === "/list") return { view: "listpage", handle: null };
  if (p === "/influencers") return { view: "influencers", handle: null };
  // Creator links (easyrecommend.co/r/name/brand) are tracked + redirected by the backend.
  if (/^\/r\/[^/]+\/[^/]+/.test(p)) { window.location.replace(API_BASE + window.location.pathname + (window.location.search || "")); return { view: "redirecting", handle: null }; }
  if (p === "/claim") return { view: "claim", handle: null };
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
const IgIcon = (p) => <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" /></Svg>;
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
function OffPlatformNotice({ url, platform, username, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "30px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, display: "grid", placeItems: "center", background: C.accentSoft, color: C.accentD, flexShrink: 0 }}><Seal size={22} /></span>
          <h2 className="er-serif" style={{ margin: 0, fontSize: 23, fontWeight: 500 }}>Hire through Easy Recommend</h2>
        </div>
        <p style={{ margin: "14px 0 0", fontSize: 14.5, color: C.inkSoft, lineHeight: 1.55 }}>
          You're about to visit {username ? <b>@{String(username).replace(/^@/, "")}</b> : "this creator"} on {platform || "their social platform"}. Feel free to check out their content, but book the work here.
        </p>
        <div style={{ marginTop: 16, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.muted, marginBottom: 9 }}>Why it's safer here</div>
          {[
            "Your payment is held until the content goes live, so you're covered if a creator doesn't deliver what was agreed.",
            "Every creator in our hire list is verified by our team before they can take work.",
            "Deliverables, timing, and price are agreed in writing, so there's a record if something goes wrong.",
            "We step in and mediate if the work doesn't match what was promised.",
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: i ? 9 : 0 }}>
              <span style={{ color: C.accent, flexShrink: 0, marginTop: 1 }}><Check size={15} /></span>
              <span style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.45 }}>{t}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: "13px 0 0", fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>Deals arranged off-platform aren't covered by our protection and we can't help recover your money.</p>
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 9 }}>
          <button className="er-btn er-btn-primary er-btn-block" onClick={onClose}>Got it, hire here</button>
          <a className="er-btn er-btn-ghost er-btn-block" href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} onClick={onClose}>Continue to {platform || "their profile"}</a>
        </div>
      </div>
    </Modal>
  );
}
function socialUrl(platform, handle) {
  let h = String(handle || "").trim().replace(/^@/, "");
  if (!h) return "";
  if (/^https?:\/\//i.test(h)) return h;
  const p = String(platform || "").toLowerCase();
  if (p.includes("instagram")) return `https://www.instagram.com/${h}/`;
  if (p.includes("tiktok")) return `https://www.tiktok.com/@${h}`;
  if (p.includes("youtube")) return `https://www.youtube.com/@${h}`;
  if (p.includes("twitter") || p.startsWith("x")) return `https://x.com/${h}`;
  if (p.includes("facebook")) return `https://www.facebook.com/${h}`;
  if (p.includes("linkedin")) return `https://www.linkedin.com/in/${h}`;
  if (p.includes("twitch")) return `https://www.twitch.tv/${h}`;
  if (p.includes("pinterest")) return `https://www.pinterest.com/${h}/`;
  if (p.includes("snapchat")) return `https://www.snapchat.com/add/${h}`;
  if (p.includes("threads")) return `https://www.threads.net/@${h}`;
  return "";
}
function PhoneInput({ value, onChange, autoFocus, disabled }) {
  const [code, setCode] = useState("+1");
  const [local, setLocal] = useState("");
  const emit = (cd, lc) => { const digits = lc.replace(/\D/g, ""); onChange(digits ? cd + digits : ""); };
  return (
    <div style={{ display: "flex", gap: 8, opacity: disabled ? 0.6 : 1 }}>
      <select className="er-input" disabled={disabled} style={{ flex: "0 0 auto", width: 104, padding: "0 8px" }} value={code} onChange={(e) => { setCode(e.target.value); emit(e.target.value, local); }}>
        {COUNTRY_CODES.map((c, i) => <option key={c.c + i} value={c.d}>{c.f} {c.d}</option>)}
      </select>
      <input className="er-input" disabled={disabled} style={{ flex: 1 }} type="tel" autoFocus={autoFocus} placeholder="555 010 2030" value={local} onChange={(e) => { setLocal(e.target.value); emit(code, e.target.value); }} />
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
/* Shopper lands here from a creator link when the brand has a discount code. */
function ClaimPage() {
  const q = new URLSearchParams(window.location.search);
  const to = q.get("to") || ""; const ok = /^https?:\/\//i.test(to);
  const code = q.get("code") || ""; const off = q.get("off") || ""; const name = q.get("name") || "this brand"; const pct = Number(q.get("pct")) || 0; const by = (q.get("by") || "").replace(/[^a-z0-9_.-]/gi, "");
  const id = (q.get("id") || "").replace(/[^a-f0-9]/gi, "");
  const [copied, setCopied] = useState(false); const [img, setImg] = useState(""); const [biz, setBiz] = useState(null);
  useEffect(() => { if (id) api(`/business/${id}`).then((b) => { setBiz(b); setImg(b.offerImage || ""); }).catch(() => {}); }, [id]);
  const site = to ? to.replace(/^https?:\/\/(www\.)?/i, "").split(/[/?#]/)[0] : "";
  const copy = async () => { try { await navigator.clipboard.writeText(code); } catch (e) {} setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const go = async () => { if (code) { try { await navigator.clipboard.writeText(code); } catch (e) {} } if (ok) window.location.href = to; };
  return (
    <div style={{ minHeight: "100vh", background: C.panel, padding: "28px 20px 50px" }}>
      <div className="er-card" style={{ maxWidth: 420, width: "100%", margin: "0 auto", padding: 0, textAlign: "center", overflow: "hidden" }}>
        {img ? <img src={img} alt={name} style={{ display: "block", width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />
          : <BrandArt b={biz || { name, photos: [] }} style={{ width: "100%", aspectRatio: "16/9" }} />}
        <div style={{ padding: "22px 26px 28px" }}>
        {by && <p style={{ margin: "12px 0 0", fontSize: 13.5, color: C.muted }}>@{by} {code || pct > 0 || off ? "sent you a discount" : "recommends this"}</p>}
        <h1 className="er-serif" style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 500 }}>{off ? `${off.replace(/ off$/i, "")} off ${name}` : pct > 0 ? `${pct}% off ${name}` : code ? `A discount for ${name}` : name}</h1>
        {biz && biz.blurb && <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.5, color: C.inkSoft }}>{biz.blurb}</p>}
        {code && <>
        <p style={{ margin: "12px 0 0", fontSize: 14, color: C.inkSoft }}>Use this code at checkout:</p>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, border: `2px dashed ${C.accent}`, borderRadius: 12, padding: "12px 14px", background: C.accentSoft }}>
          <span style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 20, fontWeight: 700, letterSpacing: ".08em", color: C.accentD }}>{code}</span>
          <button className="er-btn er-btn-sm" onClick={copy} style={{ background: copied ? C.accent : C.ink, color: "#fff", border: "none" }}>{copied ? "Copied" : "Copy"}</button>
        </div></>}
        <button className="er-btn er-btn-primary er-btn-block" style={{ marginTop: 18 }} disabled={!ok} onClick={go}>{code ? <>Copy code &amp; continue to {name}</> : <>Continue to {name}</>} <Arrow size={16} /></button>
        {site && <p style={{ margin: "8px 0 0", fontSize: 12, color: C.muted }}>Takes you to {site}</p>}
        <p style={{ margin: "14px 0 0", fontSize: 12, color: C.muted }}>Powered by <a href="/" style={{ color: C.inkSoft, fontWeight: 600 }}>Easy Recommend</a></p>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: "40px auto 0", borderTop: `1px solid ${C.line}`, paddingTop: 30 }}>
        <ExploreHowTo initial="share" heading={by ? `Earn like @${by} did` : "Share brands you love and earn"} />
      </div>
    </div>
  );
}

/* ---------- Global share alerts ----------
   toast("…")                     → big "✓ Link copied" style confirmation
   startIgShare(url, run)         → copies the link, then a clear "add a LINK sticker" guide;
                                     its Continue button runs the actual Instagram share */
const erEmit = (type, detail) => { try { window.dispatchEvent(new CustomEvent(type, { detail })); } catch (e) {} };
function toast(msg) { erEmit("er:toast", msg); }
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch (e) {}
  try {   // fallback for browsers/contexts without the async clipboard API
    const ta = document.createElement("textarea"); ta.value = t; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta);
    ta.select(); ta.setSelectionRange(0, t.length); const ok = document.execCommand("copy"); document.body.removeChild(ta); return !!ok;
  } catch (e) { return false; }
}
async function startIgShare(url, run) { const copied = await copyText(url); erEmit("er:igshare", { url, run, copied }); }
function GlobalAlerts() {
  const [msg, setMsg] = useState(""); const [ig, setIg] = useState(null); const [busy, setBusy] = useState(false); const [copied, setCopied] = useState(false);
  useEffect(() => {
    let t; const onT = (e) => { setMsg(e.detail || ""); clearTimeout(t); t = setTimeout(() => setMsg(""), 3200); };
    const onI = (e) => { setIg(e.detail); setCopied(!!(e.detail && e.detail.copied)); setBusy(false); };
    window.addEventListener("er:toast", onT); window.addEventListener("er:igshare", onI);
    return () => { clearTimeout(t); window.removeEventListener("er:toast", onT); window.removeEventListener("er:igshare", onI); };
  }, []);
  const igGrad = "linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)";
  const go = async () => {
    setBusy(true);
    try { await copyText(ig.url); const r = await ig.run(); setIg(null); toast(r === "saved" ? "✓ Image saved · link copied. Add the LINK sticker in your story!" : "✓ Link copied · add the LINK sticker and paste it"); }
    catch (e) { setBusy(false); if (e && e.name === "AbortError") { setIg(null); toast("✓ Link copied · add the LINK sticker and paste it"); } else toast("Couldn't create the image. Try again."); }
  };
  const step = (n, body) => <div style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}><span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: C.ink, color: "#fff", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800 }}>{n}</span><div style={{ fontSize: 14, color: C.ink, lineHeight: 1.4 }}>{body}</div></div>;
  return (<>
    {msg && <div role="status" aria-live="polite" className="er-toast" style={{ background: msg.startsWith("✓") ? C.accentD : "#111" }}>{msg}</div>}
    {ig && <div className="er-modal-overlay" style={{ zIndex: 80 }} onClick={() => !busy && setIg(null)}>
      <div className="er-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div style={{ padding: "26px 22px 22px", textAlign: "center" }}>
          <div style={{ margin: "0 auto", width: 58, height: 58, borderRadius: "50%", background: copied ? C.accent : C.ink, color: "#fff", display: "grid", placeItems: "center" }}>{copied ? <Check size={30} /> : <Copy size={26} />}</div>
          <h2 className="er-serif" style={{ margin: "12px 0 0", fontSize: 26, fontWeight: 500 }}>{copied ? "Your link is copied!" : "Copy your link"}</h2>
          <button type="button" onClick={async () => { const ok = await copyText(ig.url); setCopied(ok); if (ok) toast("✓ Link copied"); }} style={{ marginTop: 12, width: "100%", display: "flex", alignItems: "center", gap: 8, background: copied ? C.accentSoft : C.panel, border: `1.5px solid ${copied ? C.accent : C.line}`, borderRadius: 12, padding: "10px 12px", cursor: "pointer", fontFamily: "inherit" }}>
            <span style={{ flex: 1, minWidth: 0, textAlign: "left", fontSize: 13, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ig.url.replace(/^https?:\/\/(www\.)?/i, "")}</span>
            <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 800, color: copied ? C.accentD : C.ink }}>{copied ? "Copied ✓" : "Copy"}</span>
          </button>
          <div style={{ marginTop: 16, background: "#FFF7ED", border: "1.5px solid #FDBA74", borderRadius: 14, padding: "13px 14px", textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#9A3412", marginBottom: 10 }}>⚠️ Don't forget the link sticker, or friends can't tap through</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {step(1, <>Tap <b>Continue</b> and pick <b>Instagram → Story</b></>)}
              {step(2, <>Tap the sticker icon <span style={{ display: "inline-grid", placeItems: "center", width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${C.ink}`, fontSize: 11, verticalAlign: "middle" }}>☺</span> and choose <span style={{ display: "inline-block", background: "#fff", color: "#0095F6", border: "1px solid #CFE6FB", borderRadius: 6, padding: "1px 7px", fontSize: 12, fontWeight: 800 }}>🔗 LINK</span></>)}
              {step(3, <><b>Paste</b> your link and tap <b>Done</b></>)}
            </div>
          </div>
          <button className="er-btn er-btn-block" disabled={busy} onClick={go} style={{ marginTop: 16, border: "none", color: "#fff", background: igGrad, boxShadow: "0 4px 14px rgba(214,41,118,.3)" }}><IgIcon size={16} /> {busy ? "Creating image…" : "Continue to Instagram"}</button>
          <button type="button" className="er-link" disabled={busy} onClick={() => setIg(null)} style={{ marginTop: 10, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: C.muted }}>Not now</button>
        </div>
      </div>
    </div>}
  </>);
}
/* Story image (1080×1920) for ONE brand: its colours, big name, and the discount. */
async function drawBrandStory(b) {
  const W = 1080, H = 1920, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d"); const name = String(b.name || "Brand").trim(); const { pal } = artFor(name);
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, pal[0]); bg.addColorStop(1, pal[1]); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const blob = (x, y, r, a) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = `rgba(255,255,255,${a})`; g.fill(); };
  blob(W * 0.92, H * 0.1, 420, 0.18); blob(W * 0.05, H * 0.86, 360, 0.14); blob(W * 0.15, H * 0.2, 120, 0.12);
  const round = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const sans = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  g.textAlign = "center"; g.textBaseline = "alphabetic";
  g.fillStyle = "rgba(255,255,255,0.9)"; g.font = `800 40px ${sans}`; g.fillText("MY PICK", W / 2, 300);
  // brand photo (only data: URLs are safe to draw), framed in a rounded card
  const photo = (b.photos || [])[0];
  let y = 420;
  if (photo && (/^data:image\//.test(photo) || photo.startsWith(API_BASE))) {   // our photo URLs send CORS headers, so the canvas stays shareable
    try {
      const img = await new Promise((res, rej) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => res(im); im.onerror = rej; im.src = photo; });
      const cw = 760, ch = b.brandName ? 480 : 560, cx = (W - cw) / 2; g.save(); round(cx, y, cw, ch, 48); g.clip();
      if (b.brandName) { g.fillStyle = "#fff"; g.fillRect(cx, y, cw, ch); }
      const sc = (b.brandName ? Math.min : Math.max)(cw / img.width, ch / img.height) * (b.brandName ? 0.9 : 1); g.drawImage(img, cx + (cw - img.width * sc) / 2, y + (ch - img.height * sc) / 2, img.width * sc, img.height * sc); g.restore();
      y += ch + 140;
    } catch (e) { y = 820; }
  } else y = 860;
  if (b.brandName) {   // a product: brand name small, product name wrapped over up to 3 lines
    g.fillStyle = "rgba(255,255,255,0.9)"; g.font = `800 46px ${sans}`; g.fillText(String(b.brandName).toUpperCase(), W / 2, y - 40);
    g.font = `900 76px ${sans}`; const words = name.split(/\s+/), lines = []; let cur = "";
    for (const w of words) { const t = cur ? cur + " " + w : w; if (g.measureText(t).width > W - 160 && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur); if (lines.length > 3) { lines.length = 3; lines[2] = lines[2].replace(/\s*\S*$/, "") + "…"; }
    g.fillStyle = "#fff"; g.shadowColor = "rgba(0,0,0,.18)"; g.shadowBlur = 30;
    lines.forEach((l, k) => g.fillText(l, W / 2, y + 50 + k * 92)); g.shadowBlur = 0; y += 50 + (lines.length - 1) * 92 - 70;
  } else {
    let fs = 170; g.font = `900 ${fs}px ${sans}`; while (fs > 70 && g.measureText(name).width > W - 140) { fs -= 6; g.font = `900 ${fs}px ${sans}`; }
    g.fillStyle = "#fff"; g.shadowColor = "rgba(0,0,0,.18)"; g.shadowBlur = 30; g.fillText(name, W / 2, y); g.shadowBlur = 0;
    const cat = (b.categories || [])[0]; if (cat) { g.fillStyle = "rgba(255,255,255,0.85)"; g.font = `600 44px ${sans}`; g.fillText(cat, W / 2, y + 80); }
  }
  if (offText(b)) {
    const txt = offText(b).toUpperCase(); g.font = `900 92px ${sans}`; const bw = g.measureText(txt).width + 120, bx = (W - bw) / 2, by = y + 150;
    round(bx, by, bw, 150, 75); g.fillStyle = "#fff"; g.fill(); g.fillStyle = pal[0]; g.fillText(txt, W / 2, by + 108);
    g.fillStyle = "#fff"; g.font = `600 42px ${sans}`; g.fillText(b.discountCode ? `with code ${b.discountCode}` : "with my link", W / 2, by + 220);
  }
  const pw = 640, ph = 116, px = (W - pw) / 2, py = H - 300; round(px, py, pw, ph, 58); g.fillStyle = "rgba(17,17,17,0.85)"; g.fill();
  g.fillStyle = "#fff"; g.font = `800 46px ${sans}`; g.fillText("Tap the link to shop →", W / 2, py + 74);
  g.fillStyle = "rgba(255,255,255,0.85)"; g.font = `600 36px ${sans}`; g.fillText("easyrecommend.co", W / 2, H - 110);
  return cv;
}
async function shareBrandToStory(b, url) {
  try { await navigator.clipboard.writeText(url); } catch (e) {}
  const cv = await drawBrandStory(b);
  const blob = await new Promise((res) => cv.toBlob(res, "image/png")); if (!blob) throw new Error("render failed");
  const file = new File([blob], slugify(b.name || "brand") + "-story.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: b.name, text: url }); return "shared"; }
  const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 5000);
  return "saved";
}
/* Share one brand to your Instagram story with your own link (auto-copied for the link sticker). */
function LinkPopup({ business, onClose }) {
  const sess = getSession();
  const [url, setUrl] = useState(""); const [err, setErr] = useState(""); const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!sess || sess.role !== "creator") { setErr("Log in to get your link."); return; }
    api("/creator/link", { method: "POST", body: { token: sess.token, businessId: business.id } }).then((r) => setUrl(r.referralUrl + "?src=share")).catch((e) => setErr(e.message));
    drawBrandStory(business).then((cv) => setPreview(cv.toDataURL("image/jpeg", 0.8))).catch(() => {});
  }, [business.id]);
  const copy = async () => { const ok = await copyText(url); if (ok) toast("✓ Link copied"); setCopied(ok); setTimeout(() => setCopied(false), 1800); };
  const shareIg = () => startIgShare(url, () => shareBrandToStory(business, url));
  const igGrad = "linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)";
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "26px 24px", textAlign: "center" }}>
        <h2 className="er-serif" style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 500 }}>Share {business.name} on your story</h2>
        <p style={{ margin: 0, fontSize: 13.5, color: C.muted }}>{offText(business) ? `Friends get ${offText(business)}, and you earn when they buy.` : "You earn when friends buy through your link."}</p>
        <div style={{ margin: "16px auto 0", width: 170, aspectRatio: "9/16", borderRadius: 16, overflow: "hidden", background: C.panel, boxShadow: "0 14px 30px -14px rgba(0,0,0,.4)" }}>
          {preview ? <img src={preview} alt={`${business.name} story`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <BrandArt b={business} style={{ width: "100%", height: "100%" }} />}
        </div>
        {err ? <p style={{ marginTop: 14, fontSize: 13.5, color: "#9B3024" }}>{err}</p> : <>
          <button className="er-btn er-btn-block" disabled={!url} onClick={shareIg} style={{ marginTop: 18, border: "none", color: "#fff", background: igGrad, boxShadow: "0 2px 10px rgba(214,41,118,.3)" }}><IgIcon size={15} /> Share on Instagram story</button>
          <p style={{ margin: "8px 0 0", fontSize: 12.5, color: C.muted }}>We copy your link. In your story, add a <b>🔗 LINK</b> sticker and paste it.</p>
          <button type="button" onClick={copy} disabled={!url} style={{ marginTop: 12, width: "100%", display: "flex", alignItems: "center", gap: 8, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "9px 12px", cursor: url ? "pointer" : "default", fontFamily: "inherit" }}>
            <span style={{ flex: 1, minWidth: 0, textAlign: "left", fontSize: 13, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url ? url.replace(/^https?:\/\/(www\.)?/i, "") : "Creating your link…"}</span>
            <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: copied ? C.accentD : C.ink, display: "inline-flex", alignItems: "center", gap: 4 }}>{copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}</span>
          </button>
        </>}
      </div>
    </Modal>
  );
}
function BusinessDetail({ id, onClose, onRecommend, autoLink, onAuth }) {
  const [linkMode, setLinkMode] = useState(null); const [joinMode, setJoinMode] = useState(null);
  const [b, setB] = useState(null); const [err, setErr] = useState("");
  const [reward, setReward] = useState(null);
  const handle = creatorHandle();
  useEffect(() => { api(`/business/${id}`).then(setB).catch((e) => setErr(e.message)); }, [id]);
  useEffect(() => { if (b && autoLink && handle) setLinkMode(autoLink); }, [b, autoLink]);
  const openLink = (m) => { if (handle) setLinkMode(m); else if (onAuth) setJoinMode(m); else onRecommend(b.id); };
  useEffect(() => { if (handle) api(`/business/${id}/reward?username=${encodeURIComponent(handle)}`).then((r) => setReward(earnInfo(r))).catch(() => {}); }, [id, handle]);
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
              {reward ? <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{reward.line}{reward.sub && <div style={{ fontSize: 12.5, fontWeight: 600, color: C.muted, marginTop: 1 }}>{reward.sub}</div>}</div>
                : <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.ink, filter: "blur(5px)", userSelect: "none" }}>00% + $00</span>
                    <span style={{ fontSize: 12, color: C.muted }}>Join to view</span>
                  </div>}
            </div>
            {!reward && <button className="er-btn er-btn-accent er-btn-sm" onClick={() => onRecommend(b.id)}><Lock size={14} /> Unlock</button>}
          </div>

          <div style={{ marginTop: 16, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.line}` }}>
            <div style={{ background: "linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)", padding: "11px 16px", display: "flex", alignItems: "center", gap: 9 }}>
              <Seal size={16} style={{ color: "#fff" }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "#fff", letterSpacing: ".01em" }}>Easy Recommend</span>
              <IgIcon size={16} style={{ color: "#fff", marginLeft: "auto" }} />
            </div>
            <div style={{ padding: "15px 16px", background: "#fff" }}>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink, lineHeight: 1.35 }}>Share {b.name} with friends on Instagram{reward ? <> and earn about <span style={{ color: C.accentD }}>{reward.est}</span></> : " and earn"} on every sale.</div>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: C.muted, lineHeight: 1.5 }}>Drop your link in a story, friends tap through and shop, and you get paid, no following required.</p>
              <button className="er-btn er-btn-block" style={{ marginTop: 12, border: "none", color: "#fff", background: "linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)", boxShadow: "0 2px 10px rgba(214,41,118,.3)" }} onClick={() => openLink("share")}>
                <IgIcon size={15} /> Share on Instagram story
              </button>
            </div>
          </div>
          {b.website && <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button className="er-btn er-btn-ghost" onClick={() => goToBrand(handle, b.id, b.website)}>Visit website</button>
          </div>}
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
                    <span style={{ width: 44, height: 44, borderRadius: 10, display: "grid", placeItems: "center", background: C.panel, color: C.muted, flexShrink: 0, overflow: "hidden" }}>{p.image ? <img src={p.image} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Store size={15} />}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: C.ink }}>{p.name}</div>
                      {priceText(p, b.currency) && <div style={{ fontSize: 12.5, color: C.inkSoft }}>{priceText(p, b.currency)}</div>}
                      {p.note && <div style={{ fontSize: 12.5, color: C.muted }}>{p.note}</div>}
                    </div>
                    {p.url && <button className="er-btn er-btn-light er-btn-sm" style={{ flexShrink: 0 }} onClick={() => goToBrand(handle, b.id, p.url)}>View</button>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {linkMode && <LinkPopup business={b} onClose={() => setLinkMode(null)} />}
        {joinMode && <QuickJoin brand={b} onClose={() => setJoinMode(null)} onDone={(sess) => { const m = joinMode; setJoinMode(null); onAuth(sess); setLinkMode(m); }} />}
      </>)}
    </Modal>
  );
}

/* ---------- Brand onboarding ---------- */
function BrandModal({ onClose, onDone, onRefresh, onLogin }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "", phone: "", website: "", categories: [], city: "", online: false, commissionType: "percent", commissionPct: 15, commissionFlat: 25, discount: 0 });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [searching, setSearching] = useState(false); const [revealed, setRevealed] = useState(false);
  const [otp, setOtp] = useState(""); const [sent, setSent] = useState(false); const [sending, setSending] = useState(false);
  const incentiveRef = useRef(null);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleCat = (c) => set("categories", f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c]);
  const commValid = (f.commissionType === "percent" && f.commissionPct > 0) || (f.commissionType === "flat" && f.commissionFlat > 0) || (f.commissionType === "both" && f.commissionPct > 0 && f.commissionFlat > 0);
  const valid = [f.website.trim() && f.categories.length > 0, f.name.trim() && f.phone.trim() && (f.online || f.city.trim()), commValid, /^\d{6}$/.test(otp.trim())];
  const titles = ["Get discovered", "About your business", "Your terms", "Verify your number"];
  const sendCode = async () => { if (!f.phone.trim()) return; setSending(true); setErr(""); try { await api("/otp/send", { method: "POST", body: { phone: f.phone } }); setSent(true); } catch (e) { setErr(e.message); } finally { setSending(false); } };
  useEffect(() => { if (step === 3 && !sent && f.phone.trim()) sendCode(); }, [step]);

  // When URL + category are filled, run a brief "searching" animation, then reveal the numbers.
  useEffect(() => {
    if (step !== 0) return;
    if (valid[0]) {
      if (revealed || searching) return;
      setSearching(true);
      const t = setTimeout(() => { setSearching(false); setRevealed(true); }, 1900);
      return () => clearTimeout(t);
    } else { setSearching(false); setRevealed(false); }
  }, [valid[0], step]);
  // Scroll the reveal into view once it appears.
  useEffect(() => { if ((searching || revealed) && incentiveRef.current) { try { incentiveRef.current.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {} } }, [searching, revealed]);

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const r = await api("/business", { method: "POST", body: { name: f.name, phone: f.phone, otp: otp.trim(), website: f.website, categories: f.categories, city: f.city, online: f.online, commissionType: f.commissionType, commissionPct: f.commissionPct, commissionFlat: f.commissionFlat, discount: f.discount, contacts: ["website"] } });
      if (r && r.token) onLogin({ role: "brand", token: r.token, phone: f.phone });
      onRefresh(); onDone({ name: f.name, live: r && r.status === "approved" });
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
            <Field label="Website or app URL" hint="Where customers go to buy or sign up."><input className="er-input" placeholder="brand.com" value={f.website} onChange={(e) => set("website", e.target.value)} /></Field>
            <Field label="Category" hint="Pick all that apply.">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CAT_LIST.map((c) => { const on = f.categories.includes(c); const cc = CATS[c];
                  return <button key={c} type="button" onClick={() => toggleCat(c)} style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, padding: "9px 15px", borderRadius: 999, border: `1px solid ${on ? cc.color : C.line}`, background: on ? cc.bg : "#fff", color: on ? cc.color : C.inkSoft }}>{c}</button>; })}
              </div>
            </Field>
            {searching && <div ref={incentiveRef} style={{ background: C.ink, color: C.paper, borderRadius: 16, padding: "30px 20px", textAlign: "center" }}>
              <span style={{ display: "inline-block", width: 30, height: 30, borderRadius: "50%", border: "3px solid rgba(253,252,250,.25)", borderTopColor: C.paper, animation: "er-spin .8s linear infinite" }} />
              <p style={{ margin: "16px 0 0", fontSize: 15, fontWeight: 600, color: "rgba(253,252,250,.9)" }}>Finding influencers in {f.categories[0]}…</p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(253,252,250,.55)" }}>Matching creators to your product</p>
            </div>}
            {revealed && <div ref={incentiveRef} style={{ background: C.ink, color: C.paper, borderRadius: 16, padding: "22px 20px", textAlign: "center", animation: "er-fade .4s ease" }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(253,252,250,.6)" }}>Good news</div>
              <div className="er-serif" style={{ fontSize: "clamp(30px,7vw,42px)", fontWeight: 500, lineHeight: 1.05, margin: "8px 0 2px" }}>100,000+ influencers</div>
              <div style={{ fontSize: 15.5, color: "rgba(253,252,250,.82)" }}>available in {f.categories[0]} right now</div>
              <div style={{ height: 1, background: "rgba(253,252,250,.14)", margin: "16px 0" }} />
              <div style={{ fontSize: 15.5, color: "rgba(253,252,250,.82)" }}>Get your product seen by</div>
              <div className="er-serif" style={{ fontSize: "clamp(26px,6vw,36px)", fontWeight: 500, lineHeight: 1.1 }}>20,000+ users</div>
              <p style={{ margin: "14px 0 0", fontSize: 13, color: "rgba(253,252,250,.6)" }}>Finish signing up to start getting recommended on commission, you only pay on results.</p>
            </div>}
          </>}
          {step === 1 && <>
            <Field label="Brand, product, or app name"><input className="er-input" placeholder="Lumière Skincare, Focusly app, etc." value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Mobile number" hint="We'll text a 6-digit code. You'll sign in with this number from now on."><PhoneInput value={f.phone} onChange={(v) => set("phone", v)} /></Field>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 16px" }}>
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>Online Global</div><div style={{ fontSize: 12.5, color: C.muted }}>Software-only business, served anywhere.</div></div>
              <button type="button" onClick={() => set("online", !f.online)} style={{ position: "relative", width: 46, height: 27, borderRadius: 99, border: "none", cursor: "pointer", background: f.online ? C.accent : "#CFC8BA", transition: "background .15s" }}>
                <span style={{ position: "absolute", top: 3, left: f.online ? 22 : 3, width: 21, height: 21, borderRadius: "50%", background: "#fff", transition: "left .15s" }} /></button>
            </div>
            <Field label="Country" hint={f.online ? "Optional for online businesses." : "Where your business is based."}><input className="er-input" placeholder="United States" value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
          </>}
          {step === 2 && <>
            <Field label="How you'll reward creators" hint="Kept private, creators see it only when they generate a link.">
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
            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px", fontSize: 13.5, color: C.inkSoft }}>Creators earn <b style={{ color: C.ink }}>{commValid ? commissionLabel(f) : "-"}</b> per sale.</div>
            <Field label="Customer perk" hint="Optional discount shown on your public listing.">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <input type="range" min="0" max="40" value={f.discount} onChange={(e) => set("discount", +e.target.value)} style={{ flex: 1, accentColor: C.accent }} />
                <span style={{ minWidth: 48, textAlign: "center", fontWeight: 700, fontSize: 14, padding: "5px 8px", borderRadius: 8, background: C.panel, color: C.ink }}>{f.discount}%</span></div></Field>
            {f.discount > 0 && <div style={{ background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.accentD, marginBottom: 4 }}>Shown to shoppers</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Get {f.discount}% off when you shop {f.name || "us"} through this link{f.website ? ` at ${f.website}` : ""}.</div>
            </div>}
          </>}
          {step === 3 && <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 14, color: C.muted }}>We texted a 6-digit code to <b style={{ color: C.ink }}>{f.phone}</b>. Enter it to finish, we'll review your listing shortly.</p>
            <Field label="Verification code">
              <input className="er-input" inputMode="numeric" maxLength={6} placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} style={{ letterSpacing: ".3em", fontSize: 18, textAlign: "center" }} autoFocus />
            </Field>
            <button type="button" onClick={sendCode} disabled={sending} style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, cursor: sending ? "default" : "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: C.accentD }}>{sending ? "Sending…" : sent ? "Resend code" : "Send code"}</button>
            <ErrBox msg={err} />
          </div>}
        </div>
        <div style={{ marginTop: 26, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {step > 0 ? <button className="er-btn er-btn-ghost" onClick={() => setStep(step - 1)}><ChevL size={16} /> Back</button> : <span />}
          {step < 3
            ? <button className="er-btn er-btn-primary" disabled={!valid[step]} onClick={() => setStep(step + 1)}>Continue <ChevR size={16} /></button>
            : <button className="er-btn er-btn-primary" disabled={busy || !valid[3]} onClick={submit}><Check size={16} /> {busy ? "Submitting…" : f.online ? "Submit for review" : "Go live"}</button>}
        </div>
      </div>
    </Modal>
  );
}
function BrandSuccess({ name, onClose, onDashboard }) {
  const n = typeof name === "object" && name ? name.name : name; const live = typeof name === "object" && name ? name.live : false;
  return <Modal onClose={onClose}><div style={{ padding: 32, textAlign: "center" }}>
    <div style={{ margin: "0 auto", width: 56, height: 56, display: "grid", placeItems: "center" }}><Seal size={52} /></div>
    <h2 className="er-serif" style={{ margin: "16px 0 0", fontSize: 24, fontWeight: 500 }}>{live ? "You're live! 🎉" : "Submitted for review"}</h2>
    <p style={{ margin: "10px 0 0", fontSize: 14.5, color: C.inkSoft, lineHeight: 1.5 }}>{live
      ? <><b>{n}</b> is now on Easy Recommend. Creators can add you to their lists and share you right away.</>
      : <><b>{n}</b> is an online-only product, so we review it before it goes live, usually within 24 hours. You'll get a text once you're live.</>}</p>
    <div style={{ marginTop: 16, background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: 12, padding: "11px 14px", fontSize: 13.5, fontWeight: 600, color: C.accentD }}>Next: add one line to your site so sales are tracked. Takes 2 minutes.</div>
    <button className="er-btn er-btn-primary er-btn-block" style={{ marginTop: 24 }} onClick={onDashboard}>Set up tracking <Arrow size={16} /></button>
    <button className="er-btn er-btn-ghost er-btn-block" style={{ marginTop: 10 }} onClick={onClose}>Not now</button></div></Modal>;
}

/* ---------- Login ---------- */
function LoginModal({ onClose, onLogin, onAfterCreator, onAfterBrand }) {
  const [mode, setMode] = useState(null); // null | creator | brand
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  // creator
  const [cName, setCName] = useState(""); const [cPass, setCPass] = useState("");
  // brand
  const [phone, setPhone] = useState(""); const [bOtp, setBOtp] = useState(""); const [bSent, setBSent] = useState(false);
  const sendBrandCode = async () => { if (!phone) return; setBusy(true); setErr(""); try { await api("/otp/send", { method: "POST", body: { phone } }); setBSent(true); } catch (e) { setErr(e.message); } finally { setBusy(false); } };

  const creatorLogin = async () => {
    setBusy(true); setErr("");
    const id = cName.trim();
    const isPhone = /^[+\d\s().-]+$/.test(id) && id.replace(/\D/g, "").length >= 7;
    const body = id.includes("@") || isPhone ? { email: id, password: cPass } : { username: id, password: cPass };
    try { const r = await api("/creator/login", { method: "POST", body }); onLogin({ role: "creator", token: r.token, username: r.username }); onAfterCreator(r.username); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const brandLogin = async () => {
    setBusy(true); setErr("");
    try { const r = await api("/business/login/verify", { method: "POST", body: { phone, otp: bOtp.trim() } }); onLogin({ role: "brand", token: r.token, phone }); onAfterBrand(); }
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
          <Field label="Email, phone or username"><input className="er-input" placeholder="you@email.com or phone" value={cName} onChange={(e) => setCName(e.target.value)} /></Field>
          <Field label="Password"><input className="er-input" type="password" placeholder="Your password" value={cPass} onChange={(e) => setCPass(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && cName && !busy) creatorLogin(); }} /></Field>
          <ErrBox msg={err} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button className="er-btn er-btn-ghost" onClick={() => setMode(null)}><ChevL size={16} /> Back</button>
            <button className="er-btn er-btn-primary" disabled={!cName || busy} onClick={creatorLogin}>{busy ? "…" : "Log in"} <Arrow size={16} /></button>
          </div>
        </div>}

        {mode === "brand" && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Mobile number" hint="The number you signed up with."><PhoneInput value={phone} onChange={setPhone} disabled={bSent} /></Field>
          {!bSent
            ? <button className="er-btn er-btn-primary er-btn-block" disabled={!phone || busy} onClick={sendBrandCode}>{busy ? "Sending…" : "Send code"}</button>
            : <>
                <Field label="Verification code"><input className="er-input" inputMode="numeric" maxLength={6} placeholder="123456" value={bOtp} onChange={(e) => setBOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={(e) => { if (e.key === "Enter" && /^\d{6}$/.test(bOtp) && !busy) brandLogin(); }} style={{ letterSpacing: ".3em", fontSize: 18, textAlign: "center" }} autoFocus /></Field>
                <button className="er-btn er-btn-primary er-btn-block" disabled={!/^\d{6}$/.test(bOtp) || busy} onClick={brandLogin}>{busy ? "…" : "Log in"}</button>
                <button type="button" onClick={sendBrandCode} disabled={busy} style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: C.accentD }}>Resend code</button>
              </>}
          <ErrBox msg={err} />
          <button className="er-btn er-btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => setMode(null)}><ChevL size={16} /> Back</button>
        </div>}
      </div>
    </Modal>
  );
}

/* ---------- My business (brand self-service) ---------- */
function BizEditCard({ b, token, reload }) {
  const [edit, setEdit] = useState(false); const [busy, setBusy] = useState(false);
  const [d, setD] = useState({ currency: b.currency || "USD", name: b.name, blurb: b.blurb || "", city: b.city || "", online: !!b.online, website: b.website || "", discount: (b.pendingOffer ? b.pendingOffer.discount : b.discount) || 0, discountCode: (b.pendingOffer ? b.pendingOffer.discountCode : b.discountCode) || "", offerImage: (b.pendingOffer ? b.pendingOffer.offerImage : b.offerImage) || "", categories: b.categories || [], commissionType: b.commissionType || "percent", commissionPct: b.commissionPct || 0, commissionFlat: b.commissionFlat || 0, photos: b.photos || [] });
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const toggleCat = (c) => set("categories", d.categories.includes(c) ? d.categories.filter((x) => x !== c) : [...d.categories, c]);
  const onPhotos = async (e) => { const files = [...(e.target.files || [])]; if (!files.length) return; const urls = []; for (const file of files) { try { urls.push(await fileToDataURL(file, 1000, 0.82)); } catch (x) {} } set("photos", [...d.photos, ...urls].slice(0, 6)); e.target.value = ""; };
  const onOfferImg = async (e) => { const f = (e.target.files || [])[0]; if (!f) return; try { set("offerImage", await fileToDataURL(f, 1200, 0.85)); } catch (x) {} e.target.value = ""; };
  const save = async () => { setBusy(true); try { await api(`/business/me/${b.id}`, { method: "PATCH", body: { token, ...d } }); setEdit(false); await reload(); } catch (e) { alert(e.message); } finally { setBusy(false); } };
  const cc = catOf(b);
  return (
    <div className="er-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 44, height: 44, borderRadius: 11, display: "grid", placeItems: "center", background: cc.bg, color: cc.color, flexShrink: 0, overflow: "hidden" }}>{(b.photos || [])[0] ? <img src={b.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Store size={18} />}</span>
        <div style={{ flex: 1, minWidth: 0 }}><p className="er-serif" style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>{b.name}</p>
          <p style={{ margin: 0, fontSize: 12.5, color: b.status === "approved" ? C.accent : "#B26A00", fontWeight: 600 }}>{b.status === "approved" ? "Live" : "Waiting on approval"}{b.status === "approved" && b.pendingOffer ? <span style={{ color: "#B26A00" }}> · New offer waiting on approval</span> : null}</p></div>
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
          <Field label="Country"><input className="er-input" style={{ width: 160 }} placeholder="United States" value={d.city} onChange={(e) => set("city", e.target.value)} /></Field>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600 }}>
            <button type="button" onClick={() => set("online", !d.online)} style={{ position: "relative", width: 44, height: 26, borderRadius: 99, border: "none", cursor: "pointer", background: d.online ? C.accent : "#CFC8BA" }}><span style={{ position: "absolute", top: 3, left: d.online ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff" }} /></button> Online Global
          </label>
        </div>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, background: C.panel, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700 }}>Offer for shoppers from creator links</p>
            <p style={{ margin: "3px 0 0", fontSize: 12.5, color: C.muted }}>People who tap a creator's link see this image and discount before they reach your site.{b.status === "approved" && b.online ? " Changes go live after our team approves them." : ""}</p>
          </div>
          {b.status === "approved" && b.pendingOffer && <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "#B26A00", background: "#FFF6E5", border: "1px solid #F3D9A4", borderRadius: 10, padding: "8px 10px" }}>Waiting on approval. Shoppers still see your current offer until then.</p>}
          <Field label="Offer image" hint="A product shot or promo banner. Wide images look best.">
            {d.offerImage
              ? <div style={{ position: "relative", maxWidth: 320, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.line}` }}><img src={d.offerImage} alt="" style={{ display: "block", width: "100%", aspectRatio: "16/9", objectFit: "cover" }} /><button type="button" onClick={() => set("offerImage", "")} title="Remove" style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", border: "none", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.3)", cursor: "pointer", display: "grid", placeItems: "center", color: C.muted }}><Close size={12} /></button></div>
              : <label style={{ maxWidth: 320, aspectRatio: "16/9", borderRadius: 12, border: `2px dashed ${C.line}`, display: "grid", placeItems: "center", cursor: "pointer", color: C.muted, fontSize: 13, fontWeight: 600, background: "#fff" }}><span style={{ display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} /> Upload image</span><input type="file" accept="image/*" style={{ display: "none" }} onChange={onOfferImg} /></label>}
          </Field>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Field label="Discount (%)"><input type="number" min="0" max="90" className="er-input" style={{ width: 110 }} value={d.discount} onChange={(e) => set("discount", Math.max(0, Math.min(90, +e.target.value || 0)))} /></Field>
            <Field label="Discount code" hint="Create it in your store first."><input className="er-input" style={{ maxWidth: 220 }} placeholder="EASY15" value={d.discountCode} onChange={(e) => set("discountCode", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 30))} /></Field>
          </div>
        </div>
        <Field label="Your store's currency" hint="Creators see what they earn in their own currency.">
          <div style={{ display: "flex", gap: 8 }}>{[["INR", "₹ INR"], ["USD", "$ USD"]].map(([k, l]) => <button key={k} type="button" onClick={() => set("currency", k)} style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 9, border: `1px solid ${d.currency === k ? C.accent : C.line}`, background: d.currency === k ? C.accentSoft : "#fff", color: d.currency === k ? C.accentD : C.inkSoft }}>{l}</button>)}</div>
        </Field>
        <Field label="Creator reward" hint="Private, only creators see it. We keep 20% of it as our fee; the creator gets the rest.">
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            {[["percent", "%"], ["flat", d.currency === "INR" ? "₹" : "$"], ["both", "Both"]].map(([t, l]) => { const on = d.commissionType === t;
              return <button key={t} type="button" onClick={() => set("commissionType", t)} style={{ flex: 1, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "8px", borderRadius: 9, border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff", color: on ? C.accentD : C.inkSoft }}>{l}</button>; })}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {(d.commissionType === "percent" || d.commissionType === "both") && <input type="number" className="er-input" style={{ width: 100 }} placeholder="%" value={d.commissionPct} onChange={(e) => set("commissionPct", +e.target.value)} />}
            {(d.commissionType === "flat" || d.commissionType === "both") && <input type="number" className="er-input" style={{ width: 100 }} placeholder={d.currency === "INR" ? "₹" : "$"} value={d.commissionFlat} onChange={(e) => set("commissionFlat", +e.target.value)} />}
          </div>
        </Field>
        {!(Number(d.commissionPct) > 0) && !(Number(d.commissionFlat) > 0) && <p style={{ margin: "-6px 0 0", fontSize: 12.5, fontWeight: 600, color: "#B26A00" }}>No commission set, so the default 8% of each sale applies.</p>}
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
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.muted }}>{r.reqType === "list" ? "Wants to be added to recommendation list" : `${({ story: "Story", tweet: "Tweet", reel: "Reel", post: "Post" }[r.reqType] || "Promotion")}, ${r.pricing === "fixed" ? "fixed price" : "commission"}`}</div>
        {r.requested && <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginTop: 2 }}>{r.requested}</div>}
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
  { key: "free", amount: 0, title: "Free", tag: "Get discovered",
    points: [
      { t: "Visible to 100,000+ influencers" },
      { t: "Influencers won't promote or add your product to their recommendation list", off: true },
    ] },
  { key: "starter", amount: 29, title: "Get recommended", tag: "One-time fee", featured: true,
    points: [
      { t: "See and approve influencer requests" },
      { t: "Get added to 100,000+ influencers' recommendation lists" },
      { t: "Set the reward you give influencers" },
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
      description: `${plan.title}, ${plan.tag}`, currency: "usd", amount: plan.amount * 100,
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
// Real payment for hiring a creator, same Stripe component as plans.
async function payForHire({ creator, contentType, price, note, business, sessionToken, onDone, onErr }) {
  const record = (chargeId) => api("/business/hire", {
    method: "POST",
    body: { token: sessionToken, username: creator.username, contentType, price, note, chargeId },
  });
  const host = (typeof window !== "undefined" && window.location.hostname) || "";
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host.endsWith(".local");
  let devPay = false;
  try { devPay = localStorage.getItem("er_devpay") === "ronak-skip-1997"; } catch (e) {}
  if (isLocal || devPay) {
    try { await record("dev_test_" + Date.now()); onDone(); } catch (e) { onErr(e.message); }
    return;
  }
  try {
    const StripeCheckout = await loadCheckout();
    const handler = StripeCheckout.configure({
      key: STRIPE_PK, locale: "auto", name: "Easy Recommend",
      description: `${contentType} by @${creator.username}`, currency: "usd", amount: Math.round(price * 100),
      email: (business && business.email) || "", panelLabel: "Pay {{amount}}",
      token: async (token) => {
        try {
          const res = await fetch("https://learntok-backend-2026-24c204fe508e.herokuapp.com/partyevents/paycharge", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: (business && business.name) || "", amount: price, token: token.id, email: token.email || (business && business.email) || "", customerName: (token.card && token.card.name) || "", phoneNumber: (business && business.phone) || "", streetAddress: "" }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) throw new Error(data.error || "Card was declined.");
          await record(data.chargeId || "");
          onDone();
        } catch (e) { onErr(e.message); }
      },
    });
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
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: C.inkSoft }}>Because results compound over months rather than days, we charge a single one-time fee that covers your full 12-month campaign, no recurring bills and no pressure to cancel. You focus on the outcomes, not a monthly subscription.</p>
          <button className="er-btn er-btn-primary er-btn-sm" style={{ marginTop: 22 }} onClick={() => setOpen(false)}>Got it</button>
        </div>
      </Modal>}
    </>
  );
}
function Paywall({ business, sessionToken, onPaid }) {
  const [busy, setBusy] = useState(""); const [err, setErr] = useState(""); const [pending, setPending] = useState(0);
  useEffect(() => { let on = true; api(`/business/me/requests-count?token=${encodeURIComponent(sessionToken)}`).then((r) => { if (on) setPending(r.pending || 0); }).catch(() => {}); return () => { on = false; }; }, [sessionToken]);
  const ghost = ["████ ██████ ███", "███████ ██ █████", "█████ ████████ ██", "██████ ███ ███████", "████████ █ ████"];
  const choose = (p) => { setErr(""); setBusy(p.key); payWithCheckout({ plan: p, business, sessionToken, onPaid, onErr: (m) => { setErr(m); setBusy(""); } }); };
  return (
    <div>
      {pending > 0 && <div style={{ display: "flex", gap: 12, alignItems: "flex-start", background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
        <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 15 }}>{pending}</span>
        <div><div style={{ fontSize: 14.5, fontWeight: 700, color: C.accentD }}>You have {pending} request{pending === 1 ? "" : "s"} waiting for approval</div><div style={{ fontSize: 13, color: C.inkSoft, marginTop: 2, lineHeight: 1.45 }}>Creators won't recommend or promote your product until you approve their request. Choose a plan to review and approve them.</div></div>
      </div>}
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
          <div style={{ fontSize: 30, fontWeight: 700, color: C.ink }}>{p.amount === 0 ? "Free" : <>${p.amount}<span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}> one-time</span></>}</div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {p.points.map((pt, i) => <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: pt.off ? C.muted : C.inkSoft, lineHeight: 1.4 }}><span style={{ color: pt.off ? C.muted : C.accent, flexShrink: 0, marginTop: 1 }}>{pt.off ? <Close size={15} /> : <Check size={15} />}</span><span>{pt.t}{pt.hint && <span style={{ display: "block", fontSize: 11.5, color: C.muted, marginTop: 3, lineHeight: 1.4 }}>{pt.hint}</span>}</span></li>)}
          </ul>
          {p.amount === 0
            ? <div className="er-btn er-btn-light er-btn-block" style={{ marginTop: "auto", cursor: "default", color: C.muted }}>Your current plan</div>
            : <button className="er-btn er-btn-primary er-btn-block" style={{ marginTop: "auto" }} disabled={!!busy} onClick={() => choose(p)}>{busy === p.key ? "Opening…" : `Choose ${p.title}`}</button>}
        </div>)}
      </div>
      <div style={{ marginTop: 18, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 16px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 13.5, color: C.inkSoft, lineHeight: 1.5 }}>Want sponsored content? Paid brands can <b style={{ color: C.ink }}>hire featured influencers</b> directly for posts, stories, and reels, at each creator's own rate.</p>
      </div>
      <div style={{ marginTop: 16 }}><WhyOneTimeLink center /></div>
      {err && <div style={{ marginTop: 14 }}><ErrBox msg={err} /></div>}
      <div style={{ marginTop: 40, borderTop: `1px solid ${C.line}` }}><PlatformSteps /></div>
    </div>
  );
}
function RewardPrompt({ business, token, onClose, onSaved }) {
  const [type, setType] = useState(business.commissionType || "percent");
  const [pct, setPct] = useState(business.commissionPct || 15);
  const [flat, setFlat] = useState(business.commissionFlat || 25);
  const [discount, setDiscount] = useState(business.discount || 0);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const valid = (type === "percent" && pct > 0) || (type === "flat" && flat > 0) || (type === "both" && pct > 0 && flat > 0);
  const save = async () => {
    if (!valid) { setErr("Set a reward greater than 0."); return; }
    setBusy(true); setErr("");
    try { await api(`/business/me/${business.id}`, { method: "PATCH", body: { token, commissionType: type, commissionPct: pct, commissionFlat: flat, discount } }); await onSaved(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "30px 28px" }}>
        <span className="er-eyebrow">You're unlocked</span>
        <h2 className="er-serif" style={{ margin: "8px 0 4px", fontSize: 25, fontWeight: 500 }}>What do you offer influencers?</h2>
        <p style={{ margin: "0 0 18px", fontSize: 14, color: C.muted }}>This is the reward creators earn per sale. It's private, they see it only when they add you.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Reward type">
            <div style={{ display: "flex", gap: 8 }}>
              {[["percent", "Percentage"], ["flat", "Flat cash"], ["both", "Both"]].map(([t, lbl]) => { const on = type === t;
                return <button key={t} type="button" onClick={() => setType(t)} style={{ flex: 1, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, padding: "10px 8px", borderRadius: 10, border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff", color: on ? C.accentD : C.inkSoft }}>{lbl}</button>; })}
            </div>
          </Field>
          {(type === "percent" || type === "both") && <Field label="Percentage of each sale">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <input type="range" min="1" max="40" value={pct} onChange={(e) => setPct(+e.target.value)} style={{ flex: 1, accentColor: C.accent }} />
              <span style={{ minWidth: 48, textAlign: "center", fontWeight: 700, fontSize: 14, padding: "5px 8px", borderRadius: 8, background: C.accentSoft, color: C.accentD }}>{pct}%</span></div></Field>}
          {(type === "flat" || type === "both") && <Field label="Flat cash per sale">
            <div style={{ display: "flex", alignItems: "center", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 11, padding: "11px 14px", maxWidth: 180 }}>
              <span style={{ fontSize: 15, color: C.muted, marginRight: 2 }}>$</span>
              <input type="number" min="0" value={flat} onChange={(e) => setFlat(Math.max(0, +e.target.value))} style={{ flex: 1, border: "none", outline: "none", background: "none", fontFamily: "inherit", fontSize: 15, fontWeight: 600, color: C.ink, width: "100%" }} /></div></Field>}
          <Field label="Customer discount" hint="Optional, shown to shoppers who use a creator's link.">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <input type="range" min="0" max="40" value={discount} onChange={(e) => setDiscount(+e.target.value)} style={{ flex: 1, accentColor: C.accent }} />
              <span style={{ minWidth: 48, textAlign: "center", fontWeight: 700, fontSize: 14, padding: "5px 8px", borderRadius: 8, background: C.panel, color: C.ink }}>{discount}%</span></div></Field>
          <ErrBox msg={err} />
          <button className="er-btn er-btn-primary er-btn-block" disabled={busy || !valid} onClick={save}><Check size={16} /> {busy ? "Saving…" : "Save reward"}</button>
        </div>
      </div>
    </Modal>
  );
}
function VerifyNotice({ onClose }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "30px 28px" }}>
        <span style={{ width: 48, height: 48, borderRadius: 14, display: "inline-grid", placeItems: "center", background: C.accentSoft, color: C.accentD }}><Check size={24} /></span>
        <h2 className="er-serif" style={{ margin: "14px 0 4px", fontSize: 24, fontWeight: 500 }}>Payment received, thank you!</h2>
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
function CopyBox({ text, label }) {
  const [done, setDone] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(text); } catch (e) {} setDone(true); setTimeout(() => setDone(false), 1500); };
  return (
    <div style={{ position: "relative", marginTop: 8 }}>
      <pre style={{ margin: 0, background: C.ink, color: "#EDE9E1", borderRadius: 10, padding: "12px 14px", fontSize: 12, lineHeight: 1.5, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{text}</pre>
      <button type="button" onClick={copy} className="er-btn er-btn-sm" style={{ position: "absolute", top: 8, right: 8, background: done ? C.accent : "#fff", color: done ? "#fff" : C.ink, border: "none", padding: "4px 10px" }}>{done ? "Copied" : (label || "Copy")}</button>
    </div>
  );
}
function OrRule() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "4px 0 22px" }}>
      <span style={{ flex: 1, height: 1, background: C.line }} />
      <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".12em", color: C.muted, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 999, padding: "4px 14px" }}>OR</span>
      <span style={{ flex: 1, height: 1, background: C.line }} />
    </div>
  );
}
/* Setup: one line in the site's <head> does all the tracking. Ask for the store address,
   detect the platform, then show the exact 2–3 steps for that platform. */
const PLATFORM_STEPS = {
  shopify: { name: "Shopify", note: "Shopify keeps checkout separate from your theme, so it uses our Shopify pixel instead of the line. Still one paste.", shopify: true,
    steps: ["In Shopify admin, go to Settings → Customer events → Add custom pixel. Name it “Easy Recommend”.", "Delete the sample code, paste the code below, then click Save and Connect."] },
  woocommerce: { name: "WooCommerce", steps: ["In WordPress, go to Plugins → Add New, install the free plugin “WPCode” and activate it.", "Go to Code Snippets → Header & Footer, paste the line in the Header box, and click Save."], alt: "No plugins? Appearance → Theme File Editor → header.php, paste it just before </head>." },
  wordpress: { name: "WordPress", steps: ["In WordPress, go to Plugins → Add New, install the free plugin “WPCode” and activate it.", "Go to Code Snippets → Header & Footer, paste the line in the Header box, and click Save."], alt: "No plugins? Appearance → Theme File Editor → header.php, paste it just before </head>." },
  wix: { name: "Wix", steps: ["In your Wix dashboard, go to Settings → Custom code (under Advanced) → + Add Custom Code.", "Paste the line. Choose “All pages”, “Load code once” and place it in “Head”. Click Apply."] },
  squarespace: { name: "Squarespace", steps: ["Go to Settings → Advanced → Code Injection.", "Paste the line in the Header box.", "Selling with Squarespace? Paste it in the Order Confirmation Page box too, then Save."] },
  bigcommerce: { name: "BigCommerce", steps: ["Go to Storefront → Script Manager → Create a Script.", "Location: Head. Pages: All pages. Script type: Script. Paste the line and Save."] },
  webflow: { name: "Webflow", steps: ["Open Site settings → Custom code.", "Paste the line in “Head code”, Save, then Publish your site."] },
  framer: { name: "Framer", steps: ["Open Site Settings → General → Custom Code.", "Paste the line in “End of <head> tag”, then Publish."] },
  godaddy: { name: "GoDaddy", steps: ["In Website Builder, open Settings → Site-wide code.", "Paste the line in the head code box, then Publish."] },
  magento: { name: "Magento / Adobe Commerce", steps: ["Go to Content → Design → Configuration and edit your store view.", "Open HTML Head → Scripts and Style Sheets, paste the line, and Save."] },
  nextjs: { name: "Next.js / React", steps: ["Paste the line inside <head> in your main layout (app/layout or pages/_document).", "Deploy your site."] },
  custom: { name: "Custom website", steps: ["Open your site's index.html (or the shared header/layout file).", "Paste the line inside <head>, then save and publish."] },
};
function timeAgo(d) { const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000); return s < 90 ? "just now" : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} days ago`; }
function SetupTab({ token, business, onLive }) {
  const [px, setPx] = useState(null);
  const [site, setSite] = useState(business && business.website ? business.website : "");
  const [det, setDet] = useState(null); const [detecting, setDetecting] = useState(false); const [platform, setPlatform] = useState("");
  const [checking, setChecking] = useState(false);
  const [plat, setPlat] = useState("Shopify"); const [url, setUrl] = useState(business && business.website ? business.website : "");
  const [note, setNote] = useState(""); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false); const [err, setErr] = useState("");
  const loadPx = () => api(`/business/me/pixel?token=${encodeURIComponent(token)}`).then((r) => { setPx(r); if (r.platform && !platform) setPlatform(r.platform); return r; }).catch(() => null);
  useEffect(() => { loadPx(); }, [token]);
  const key = (px && px.pixelKey) || "your-key";
  const pixelUrl = (px && px.pixelUrl) || `https://learntok-backend-2026-24c204fe508e.herokuapp.com/easyrecommend/px.js?key=${key}`;
  const convUrl = (px && px.conversionUrl) || pixelUrl.replace(/\/px\.js.*$/, "/conversion");
  const oneLine = (px && px.oneLine) || `<script src="${pixelUrl}" async></script>`;
  const detect = async () => {
    if (!site.trim()) return; setDetecting(true);
    try { const r = await api(`/business/me/detect-platform?token=${encodeURIComponent(token)}&url=${encodeURIComponent(site.trim())}`); setDet(r); setPlatform(r.platform || "custom"); }
    catch (e) { setDet({ reachable: false }); setPlatform("custom"); } finally { setDetecting(false); }
  };
  const recheck = async () => { setChecking(true); const r = await loadPx(); setChecking(false); if (r && r.lastPixelAt && onLive) onLive(); };
  const submit = async () => {
    setBusy(true); setErr("");
    try { await api("/business/me/setup-request", { method: "POST", body: { token, platform: plat, siteUrl: url.trim(), note: note.trim() } }); setSent(true); }
    catch (e) { setErr(e.message || "Couldn't send."); } finally { setBusy(false); }
  };
  const widgetSnippet = `<script src="${pixelUrl.replace("/px.js", "/widget.js")}" data-mode="both"></script>`;
  const shopifyPixel = `var EASYREC_KEY = "${key}";\nvar EASYREC_ENDPOINT = "${convUrl}";\nanalytics.subscribe("page_viewed", async (e) => { try { var h=(e.context.document.location.href)||""; var m=h.match(/[?&]er_click=([^&#]+)/); if(m) await browser.localStorage.setItem("er_click", decodeURIComponent(m[1])); } catch(_){} });\nanalytics.subscribe("checkout_completed", async (e) => { try { var cid=await browser.localStorage.getItem("er_click"); if(!cid) return; var co=(e.data&&e.data.checkout)||{}; var v=(co.subtotalPrice&&co.subtotalPrice.amount)||(co.totalPrice&&co.totalPrice.amount)||0; var oid=(co.order&&co.order.id)||co.token||""; await fetch(EASYREC_ENDPOINT,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify({key:EASYREC_KEY,clickId:cid,orderId:String(oid),value:Number(v),via:"shopify"}),keepalive:true}); } catch(_){} });`;
  const P = PLATFORM_STEPS[platform] || null;
  const live = px && px.lastPixelAt;
  const num = (n, on) => <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", background: on ? C.ink : C.panel, color: on ? "#fff" : C.muted, fontWeight: 800, fontSize: 14 }}>{n}</span>;
  const card = { padding: 20, marginBottom: 14 };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: live ? C.accentSoft : "#FFF7ED", border: `1px solid ${live ? C.accent : "#FDBA74"}`, borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: live ? C.accent : "#F59E0B", flexShrink: 0 }} />
        <div style={{ flex: "1 1 220px", fontSize: 13.5, color: live ? C.accentD : "#9A3412" }}>{live ? <><b>Tracking is live</b>{px.lastPixelHost ? ` on ${px.lastPixelHost}` : ""} · last seen {timeAgo(px.lastPixelAt)}</> : <><b>Tracking isn't set up yet.</b> One line on your site and you're done.</>}</div>
        <button className="er-btn er-btn-light er-btn-sm" disabled={checking} onClick={recheck}>{checking ? "Checking…" : "Check again"}</button>
      </div>

      <p style={{ margin: "0 0 16px", fontSize: 14, color: C.inkSoft, lineHeight: 1.55 }}>One line on your site does everything: it remembers which creator sent each visitor, spots your order-confirmation page, and reports the sale. No other code needed.</p>

      <div className="er-card" style={card}>
        <div style={{ display: "flex", gap: 12 }}>{num(1, true)}<div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>What's your store's website?</div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input className="er-input" style={{ flex: "1 1 220px" }} placeholder="yourstore.com" value={site} onChange={(e) => setSite(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") detect(); }} />
            <button className="er-btn er-btn-primary" disabled={!site.trim() || detecting} onClick={detect}>{detecting ? "Checking…" : <>Check my store <Arrow size={15} /></>}</button>
          </div>
          {det && <p style={{ margin: "10px 0 0", fontSize: 13.5, color: C.inkSoft }}>{det.reachable === false ? "We couldn't open that site, so pick your platform below." : <>Looks like <b>{(PLATFORM_STEPS[det.platform] || PLATFORM_STEPS.custom).name}</b>{det.alreadyInstalled ? <> · <b style={{ color: C.accentD }}>the line is already on your homepage ✓</b></> : ""}.</>}</p>}
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.keys(PLATFORM_STEPS).map((k) => <button key={k} type="button" onClick={() => setPlatform(k)} style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "5px 10px", borderRadius: 999, border: `1px solid ${platform === k ? C.ink : C.line}`, background: platform === k ? C.ink : "#fff", color: platform === k ? C.paper : C.inkSoft }}>{PLATFORM_STEPS[k].name}</button>)}
          </div>
        </div></div>
      </div>

      {P && <div className="er-card" style={card}>
        <div style={{ display: "flex", gap: 12 }}>{num(2, true)}<div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{P.shopify ? "Add our Shopify pixel" : `Add one line to your ${P.name} site`}</div>
          {P.note && <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{P.note}</p>}
          <ol style={{ margin: "12px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {P.steps.map((t, i) => <li key={i} style={{ display: "flex", gap: 9, fontSize: 14, lineHeight: 1.5, color: C.ink }}><span style={{ flexShrink: 0, width: 20, height: 20, marginTop: 1, borderRadius: "50%", background: C.accentSoft, color: C.accentD, fontSize: 11.5, fontWeight: 800, display: "grid", placeItems: "center" }}>{String.fromCharCode(97 + i)}</span><span>{t}</span></li>)}
          </ol>
          <CopyBox text={P.shopify ? shopifyPixel : oneLine} label={P.shopify ? "Copy pixel" : "Copy line"} />
          {P.alt && <p style={{ margin: "8px 0 0", fontSize: 12.5, color: C.muted }}>{P.alt}</p>}
        </div></div>
      </div>}

      {P && <div className="er-card" style={card}>
        <div style={{ display: "flex", gap: 12 }}>{num(3, true)}<div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Check it's working</div>
          <p style={{ margin: "4px 0 0", fontSize: 13.5, color: C.inkSoft, lineHeight: 1.55 }}>Open your website in a new tab, then come back and tap <b>Check again</b>. When it turns green, you're done. Sales from creator links will show up automatically.</p>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {site.trim() && <a className="er-btn er-btn-light er-btn-sm" href={/^https?:\/\//i.test(site.trim()) ? site.trim() : `https://${site.trim()}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>Open my site <Arrow size={13} /></a>}
            <button className="er-btn er-btn-primary er-btn-sm" disabled={checking} onClick={recheck}>{checking ? "Checking…" : live ? "✓ Live, check again" : "Check again"}</button>
          </div>
          {P.shopify && <p style={{ margin: "8px 0 0", fontSize: 12.5, color: C.muted }}>Shopify pixels only run once someone visits from a creator link, so this check may stay amber until your first creator visit.</p>}
        </div></div>
      </div>}

      <details style={{ margin: "4px 0 18px", fontSize: 13.5, color: C.inkSoft }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Unusual checkout or sales not showing up?</summary>
        <p style={{ margin: "8px 0 0", lineHeight: 1.55 }}>The line reads your order-confirmation page (order number and total) and also picks up Google Analytics purchase events. If your thank-you page is unusual, add this on it with your real order ID and amount:</p>
        <CopyBox text={`<script>\n  EasyRec.conversion({ orderId: "ORDER_ID", value: 49.00 });\n</script>`} />
        <p style={{ margin: "10px 0 0", lineHeight: 1.55 }}>Or report sales from your server when a payment succeeds (read the er_click cookie):</p>
        <CopyBox text={`curl -X POST ${convUrl} \\\n  -H "Content-Type: application/json" \\\n  -d '{"key":"${key}","clickId":"ER_CLICK_COOKIE","orderId":"ORDER_ID","value":49.00}'`} />
      </details>

      <OrRule />

      <div className="er-card" style={{ padding: 20, marginBottom: 22 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Let our team do it, free</div>
        <p style={{ margin: "4px 0 12px", fontSize: 13.5, color: C.muted }}>Send us your site and we'll add the line for you, then confirm when it's live.</p>
        {sent ? <div style={{ background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}><span style={{ color: C.accentD }}><Check size={18} /></span><span style={{ fontSize: 13.5, color: C.accentD }}>Got it. Our team will set up tracking and let you know once it's live.</span></div>
        : <>
          <Field label="Your store / website URL"><input className="er-input" placeholder="https://yourstore.com" value={url} onChange={(e) => setUrl(e.target.value)} /></Field>
          <div style={{ marginTop: 12 }}><Field label="Platform"><select className="er-input" value={plat} onChange={(e) => setPlat(e.target.value)}>{["Shopify", "WooCommerce / WordPress", "Wix", "Squarespace", "BigCommerce", "Webflow", "Framer", "Custom / Other"].map((o) => <option key={o}>{o}</option>)}</select></Field></div>
          <div style={{ marginTop: 12 }}><Field label="Anything we should know? (optional)"><textarea className="er-input" placeholder="Store login access, platform details, etc." value={note} onChange={(e) => setNote(e.target.value)} /></Field></div>
          {err && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#9B3024" }}>{err}</p>}
          <button className="er-btn er-btn-primary" style={{ marginTop: 14 }} disabled={busy || !url.trim()} onClick={submit}>{busy ? "Sending…" : <>Request free setup <Arrow size={15} /></>}</button>
        </>}
      </div>

      <div className="er-card" style={{ padding: "22px", marginTop: 8, border: `1px solid ${C.accent}` }}>
        <span style={{ display: "inline-block", fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.accentD, background: C.accentSoft, borderRadius: 999, padding: "4px 10px" }}>Optional · after tracking is set up</span>
        <h3 className="er-serif" style={{ margin: "12px 0 0", fontSize: 20, fontWeight: 500 }}>Add &ldquo;Share &amp; earn&rdquo; buttons to your site</h3>
        <p style={{ margin: "8px 0 0", fontSize: 13.5, color: C.muted, lineHeight: 1.55 }}>A small floating button where customers can <b>share you with friends</b> (friends get your discount, they earn) or <b>become an affiliate</b>. Each person gets their own tracked link.</p>
        <CopyBox text={widgetSnippet} />
        <p style={{ margin: "8px 0 0", fontSize: 12.5, color: C.muted }}>Paste it before <code>&lt;/body&gt;</code>. Use <code>data-mode="share"</code> or <code>data-mode="affiliate"</code> to show one option, and <code>data-position="left"</code> to move it.</p>
      </div>
    </div>
  );
}
function fmtFol(n) { n = Number(n) || 0; if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M"; return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "K" : String(n); }
function InfluencerDirectory({ token }) {
  const [data, setData] = useState(null); const [err, setErr] = useState(""); const [cat, setCat] = useState(""); const [q, setQ] = useState("");
  useEffect(() => { setData(null); api(`/business/me/directory?token=${encodeURIComponent(token)}${cat ? `&cat=${encodeURIComponent(cat)}` : ""}`).then(setData).catch((e) => { setErr(e.message); setData({ items: [], cats: {} }); }); }, [token, cat]);
  if (data === null) return <p style={{ color: C.muted }}>Loading…</p>;
  const counts = data.cats || {};
  const cats = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  const t = q.trim().toLowerCase();
  const shown = (data.items || []).filter((x) => !t || [x.name, x.niche, x.location, x.category].join(" ").toLowerCase().includes(t));
  const chip = (key, label) => <button key={key || "all"} className="er-btn er-btn-sm" onClick={() => setCat(key)} style={{ border: `1px solid ${cat === key ? C.ink : C.line}`, background: cat === key ? C.ink : "#fff", color: cat === key ? C.paper : C.inkSoft, textTransform: "capitalize" }}>{label}</button>;
  return (
    <div>
      <p style={{ margin: "0 0 14px", fontSize: 14, color: C.muted }}>100,000+ creators open to brand work. To protect them from spam, handles are hidden.</p>
      {err && <p style={{ color: "#9B3024", fontSize: 13 }}>{err}</p>}
      <input className="er-input" placeholder="Search creators by name, niche or location" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {chip("", "All")}
        {cats.map((c) => chip(c, c))}
      </div>
      <p style={{ margin: "0 0 10px", fontSize: 12.5, fontWeight: 600, color: C.muted }}>Showing {shown.length} creator{shown.length === 1 ? "" : "s"}</p>
      {shown.length === 0 && <p style={{ background: C.panel, borderRadius: 14, padding: "24px 0", textAlign: "center", fontSize: 14, color: C.muted, margin: 0 }}>No creators match “{q}”.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {shown.map((x) => { const capCat = (x.category || "").charAt(0).toUpperCase() + (x.category || "").slice(1); const cc = CATS[capCat] || tintFor(x.category); return (
          <div key={x.id} className="er-card" style={{ padding: "13px 15px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", background: cc.bg, color: cc.color, fontWeight: 700, flexShrink: 0 }}>{(x.name || "?")[0]}</span>
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: C.ink }}>{x.name} <span aria-label="Handle hidden" style={{ fontWeight: 600, fontSize: 13, color: C.accentD, filter: "blur(4px)", userSelect: "none" }}>{x.handle}</span></div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{x.niche} · {x.location}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.inkSoft, background: C.panel, borderRadius: 999, padding: "4px 10px", flexShrink: 0 }}>{fmtFol(x.followers)} followers</span>
            <button type="button" className="er-btn er-btn-light er-btn-sm" style={{ flexShrink: 0 }}><Send size={13} /> Request intro</button>
          </div>); })}
      </div>
      <div style={{ marginTop: 14, background: C.panel, border: `1px dashed ${C.line}`, borderRadius: 14, padding: "16px", textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: C.ink }}>+ 100,000 more creators</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Request an intro to any creator above and we'll match you with more like them.</div>
      </div>
    </div>
  );
}
/* ---------- Brand products: get them from the website, or add by hand ---------- */
function priceText(p, fallbackCur) {
  if (!p || !Number(p.price)) return "";
  const cur = p.currency || fallbackCur || VIEWER_CUR;
  try { return new Intl.NumberFormat(cur === "INR" ? "en-IN" : "en-US", { style: "currency", currency: cur, maximumFractionDigits: Number(p.price) % 1 ? 2 : 0 }).format(Number(p.price)); } catch (e) { return `${cur} ${p.price}`; }
}
function ProductTile({ p, cur, picked, onToggle, onRemove, added }) {
  const [bad, setBad] = useState(false);
  return (
    <div onClick={onToggle} style={{ position: "relative", border: `1.5px solid ${picked ? C.accent : C.line}`, borderRadius: 12, overflow: "hidden", background: "#fff", cursor: onToggle ? "pointer" : "default", opacity: added ? 0.55 : 1 }}>
      <div style={{ aspectRatio: "1 / 1", background: C.panel, display: "grid", placeItems: "center", color: C.muted }}>
        {p.image && !bad ? <img src={p.image} alt="" loading="lazy" onError={() => setBad(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Store size={22} />}
      </div>
      <div style={{ padding: "8px 10px 10px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.name}</div>
        {priceText(p, cur) && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 3 }}>{priceText(p, cur)}</div>}
        {added && <div style={{ fontSize: 11.5, fontWeight: 700, color: C.accentD, marginTop: 3 }}>Already added</div>}
      </div>
      {onToggle && !added && <span style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", background: picked ? C.accent : "rgba(255,255,255,.92)", border: `1.5px solid ${picked ? C.accent : C.line}`, color: "#fff" }}>{picked && <Check size={14} />}</span>}
      {onRemove && <button type="button" title="Remove" onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: 8, border: `1px solid ${C.line}`, background: "rgba(255,255,255,.95)", cursor: "pointer", display: "grid", placeItems: "center", color: C.inkSoft }}><Close size={14} /></button>}
    </div>
  );
}
function ProductsCard({ b, token }) {
  const cur = b.currency || "USD";
  const [items, setItems] = useState(b.products || []);
  const [saving, setSaving] = useState(false); const [err, setErr] = useState("");
  const [url, setUrl] = useState(b.website || "");
  const [busy, setBusy] = useState(false); const [found, setFound] = useState(null); const [picked, setPicked] = useState([]); const [msg, setMsg] = useState("");
  const [manual, setManual] = useState(false);
  const blank = { name: "", url: "", price: "", image: "" };
  const [m, setM] = useState(blank);
  const keyOf = (p) => String(p.url || p.name || "").toLowerCase().replace(/\/$/, "");
  const have = new Set(items.map(keyOf));
  const save = async (list) => {
    setSaving(true); setErr("");
    try { const r = await api(`/business/me/${b.id}`, { method: "PATCH", body: { token, products: list } }); setItems(r.products || list); return true; }
    catch (e) { setErr(e.message); return false; } finally { setSaving(false); }
  };
  const find = async () => {
    if (!url.trim()) { setMsg("Paste your website or a product link first."); return; }
    setBusy(true); setMsg(""); setFound(null);
    try {
      const r = await api("/business/me/products/scrape", { method: "POST", body: { token, url: url.trim() } });
      const list = r.products || [];
      setFound(list); setPicked(list.map((p, i) => (have.has(keyOf(p)) ? -1 : i)).filter((i) => i >= 0));
      if (!list.length) setMsg(r.error || "We couldn't find products on that page. Try a product page link, or add them by hand below.");
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  };
  const addPicked = async () => {
    const add = picked.map((i) => found[i]).filter((p) => p && !have.has(keyOf(p)));
    if (await save([...items, ...add].slice(0, 100))) { setFound(null); setPicked([]); toast(`Added ${add.length} product${add.length === 1 ? "" : "s"}`); }
  };
  const addManual = async () => {
    if (!m.name.trim()) { setErr("Add the product name."); return; }
    if (await save([...items, { name: m.name.trim(), url: m.url.trim(), price: Number(String(m.price).replace(/[^0-9.]/g, "")) || 0, currency: cur, image: m.image }].slice(0, 100))) { setM(blank); setManual(false); toast("Product added"); }
  };
  const onImg = async (e) => { const f = (e.target.files || [])[0]; if (!f) return; try { const img = await fileToDataURL(f, 700, 0.8); setM((x) => ({ ...x, image: img })); } catch (x) {} e.target.value = ""; };
  const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))", gap: 10 };
  const freshIdx = found ? found.map((p, i) => (have.has(keyOf(p)) ? -1 : i)).filter((i) => i >= 0) : [];
  return (
    <div className="er-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <p className="er-serif" style={{ margin: 0, fontSize: 19, fontWeight: 500 }}>Your products {items.length > 0 && <span style={{ fontSize: 14, color: C.muted }}>· {items.length}</span>}</p>
        <p style={{ margin: "4px 0 0", fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>Creators can share a specific product, not just your brand. Get them from your website in one go, or add them one by one.</p>
      </div>

      <div style={{ border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, background: C.panel, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700 }}>🔎 Get products from your website</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>Paste your store's address (we'll find your products) or a single product page link.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input className="er-input" style={{ flex: "1 1 220px" }} placeholder="yourstore.com or a product link" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") find(); }} />
          <button className="er-btn er-btn-primary" disabled={busy} onClick={find}>{busy ? "Looking…" : <><Search size={15} /> Find products</>}</button>
        </div>
        {busy && <div style={{ fontSize: 13, color: C.inkSoft }}>Reading your store… this can take up to 20 seconds.</div>}
        {msg && <div style={{ fontSize: 13, color: "#9A3412" }}>{msg}</div>}
        {found && found.length > 0 && <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, flex: 1 }}>Found {found.length} product{found.length === 1 ? "" : "s"}. Tap to pick the ones creators can share.</div>
            {freshIdx.length > 0 && <button className="er-link" style={{ fontSize: 13 }} onClick={() => setPicked(picked.length ? [] : freshIdx)}>{picked.length ? "Select none" : "Select all"}</button>}
          </div>
          <div style={{ ...grid, maxHeight: 520, overflowY: "auto", paddingRight: 2 }}>
            {found.map((p, i) => { const added = have.has(keyOf(p)); return <ProductTile key={i} p={p} cur={cur} added={added} picked={picked.includes(i)} onToggle={added ? undefined : () => setPicked((x) => (x.includes(i) ? x.filter((j) => j !== i) : [...x, i]))} />; })}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="er-btn er-btn-primary" disabled={!picked.length || saving} onClick={addPicked}>{saving ? "Adding…" : <><Plus size={15} /> Add {picked.length} product{picked.length === 1 ? "" : "s"}</>}</button>
            <button className="er-btn er-btn-ghost" onClick={() => { setFound(null); setPicked([]); }}>Cancel</button>
          </div>
        </>}
      </div>

      {!manual ? <button type="button" className="er-btn er-btn-light er-btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setManual(true)}><Plus size={14} /> Add a product by hand</button>
        : <div style={{ border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>Add a product</div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            <label style={{ width: 96, height: 96, borderRadius: 12, border: `1.5px dashed ${C.line}`, background: C.panel, display: "grid", placeItems: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0, fontSize: 12, color: C.muted, textAlign: "center" }}>
              {m.image ? <img src={m.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span><Plus size={16} /><br />Photo</span>}
              <input type="file" accept="image/*" onChange={onImg} style={{ display: "none" }} />
            </label>
            <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: 8 }}>
              <input className="er-input" placeholder="Product name" value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} />
              <input className="er-input" placeholder="Product link (yourstore.com/...)" value={m.url} onChange={(e) => setM({ ...m, url: e.target.value })} />
              <input className="er-input" inputMode="decimal" placeholder={`Price in ${cur} (optional)`} value={m.price} onChange={(e) => setM({ ...m, price: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="er-btn er-btn-primary er-btn-sm" disabled={saving} onClick={addManual}>{saving ? "Saving…" : "Add product"}</button>
            <button className="er-btn er-btn-ghost er-btn-sm" onClick={() => { setManual(false); setM(blank); setErr(""); }}>Cancel</button>
          </div>
        </div>}
      <ErrBox msg={err} />

      {items.length > 0
        ? <div style={grid}>{items.map((p, i) => <ProductTile key={keyOf(p) + i} p={p} cur={cur} onRemove={() => save(items.filter((_, j) => j !== i))} />)}</div>
        : <div style={{ fontSize: 13.5, color: C.muted, textAlign: "center", padding: "14px 0" }}>No products yet.</div>}
    </div>
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
  const [hireOn, setHireOn] = useState(false);
  const [pricingOn, setPricingOn] = useState(false);
  useEffect(() => { api("/settings").then((s) => { setHireOn(!!s.hireEnabled); setPricingOn(!!s.pricingEnabled); }).catch(() => {}); }, []);
  const paid = (rows || []).some((b) => b.paid);
  const premium = (rows || []).some((b) => b.premium);
  const business = (rows || [])[0] || null;
  const isOnline = (rows || []).some((b) => b.online);        // pricing applies only to online (software) businesses
  const effPaid = paid || !pricingOn || !isOnline;
  useEffect(() => { if (effPaid) reloadReqs(); }, [effPaid]);
  const decide = async (id, status, message) => { await api(`/business/request/${id}`, { method: "PATCH", body: { token: session.token, status, message } }); await reloadReqs(); };
  const pending = (reqs || []).filter((r) => r.status === "pending").length;
  const [showVerify, setShowVerify] = useState(false); const [showReward, setShowReward] = useState(false);
  const [creators, setCreators] = useState(null);
  const loadCreators = async () => { try { setCreators(await api(`/business/me/creators?token=${t}`)); } catch (e) { setCreators([]); } };
  useEffect(() => { if (tab === "hire" && hireOn) loadCreators(); }, [tab, hireOn]);
  const onPaid = async () => { await reload(); setTab("promo"); setShowReward(true); };
  const awaiting = (rows || []).some((b) => b.status === "pending");
  // New brands are hidden from creators until their tracking line is live: open on the Setup tab and say so.
  const trackingMissing = (rows || []).some((b) => b.needsTracking && !b.trackingLive);
  const [tabChosen, setTabChosen] = useState(false);
  useEffect(() => { if (rows && !tabChosen) { setTabChosen(true); if (trackingMissing) setTab("setup"); } }, [rows]);
  // [key, step label, title, note]
  const tabs = [
    ["info", "Step 1", "My information", awaiting ? "Waiting on approval" : ""],
    ["setup", "Step 2", "Setup tracking", trackingMissing ? "Needed to go visible" : ""],
    ["promo", "Step 3", `Requests${pending ? ` · ${pending}` : ""}`, "Accept or reject them"],
    ["inf", "", "Influencers", ""],
  ];
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 22px 80px" }}>
      {showReward && business && <RewardPrompt business={business} token={session.token} onClose={() => { setShowReward(false); setShowVerify(true); }} onSaved={async () => { await reload(); setShowReward(false); setShowVerify(true); }} />}
      {showVerify && <VerifyNotice onClose={() => setShowVerify(false)} />}
      <button className="er-link" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}><ChevL size={15} /> Back to site</button>
      {trackingMissing && <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: "#FFF7ED", border: "1.5px solid #FDBA74", borderRadius: 14, padding: "13px 15px", marginBottom: 18 }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <div style={{ flex: "1 1 240px", fontSize: 14, color: "#9A3412", lineHeight: 1.45 }}><b>Your brand isn't visible to creators yet.</b> Set up tracking first (one line on your site, about 2 minutes) and you'll appear to creators right away.</div>
        {tab !== "setup" && <button className="er-btn er-btn-primary er-btn-sm" onClick={() => setTab("setup")}>Set up tracking <Arrow size={14} /></button>}
      </div>}
      <h1 className="er-serif" style={{ margin: 0, fontSize: 32, fontWeight: 500 }}>My business</h1>
      <p style={{ margin: "6px 0 20px", fontSize: 14.5, color: C.muted }}>{pricingOn ? "Edit your listing for free. Unlock creator promotion and requests with a one-time plan." : "Edit your listing, review creator requests, and go live for promotion — all free."}</p>
      <div style={{ display: "flex", gap: 26, borderBottom: `1px solid ${C.line}`, marginBottom: 22, flexWrap: "wrap" }}>
        {tabs.map(([k, step, lbl, note]) => <button key={k} onClick={() => setTab(k)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "10px 0", color: tab === k ? C.ink : C.muted, borderBottom: `2.5px solid ${tab === k ? C.accent : "transparent"}`, marginBottom: -1, textAlign: "left" }}>
          {step && <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: tab === k ? C.accentD : C.muted }}>{step}</span>}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 16.5, fontWeight: 600 }}>{lbl}{k === "promo" && !effPaid && <Lock size={15} />}</span>
          {note && <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: k === "info" || k === "setup" ? "#B26A00" : C.muted }}>({note})</span>}
        </button>)}
      </div>
      {err && <p style={{ background: "#FBE9E7", border: "1px solid #F3C5BD", borderRadius: 12, padding: "12px 14px", fontSize: 13.5, color: "#9B3024" }}>{err}</p>}

      {tab === "info" && <>
        {awaiting && <div style={{ background: "#FFF6E5", border: "1px solid #F1D29A", borderRadius: 14, padding: "13px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#D98A00", flexShrink: 0 }} />
          <div style={{ fontSize: 13.5, color: "#7A4B00" }}><b>Waiting on approval.</b> Online-only products are reviewed before they go live, usually within 24 hours. Meanwhile, set up tracking in Step 2.</div>
        </div>}
        {rows === null && !err && <p style={{ color: C.muted }}>Loading…</p>}
        {rows && rows.length === 0 && <p style={{ background: C.panel, borderRadius: 14, padding: "32px 0", textAlign: "center", color: C.muted }}>No business found on this account.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{(rows || []).map((b) => <Fragment key={b.id}><BizEditCard b={b} token={session.token} reload={reload} /><ProductsCard b={b} token={session.token} /></Fragment>)}</div>
        <div className="er-card" style={{ padding: "26px 18px 22px", marginTop: 26 }}>
          <CreatorVideos eyebrow="" title="Get 100,000+ creators to promote your brand on commission" sub="Creators make content about your brand and earn only when it sells. You pay nothing upfront." limit={3} bare />
        </div>
      </>}

      {tab === "setup" && (business ? <SetupTab token={session.token} business={business} onLive={() => { if (trackingMissing) reload(); }} /> : <p style={{ color: C.muted }}>Loading…</p>)}

      {tab === "promo" && (rows === null
        ? <p style={{ color: C.muted }}>Loading…</p>
        : effPaid
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

      {tab === "inf" && <InfluencerDirectory token={session.token} />}

      {tab === "hire" && hireOn && (rows === null
        ? <p style={{ color: C.muted }}>Loading…</p>
        : <>
            <p style={{ margin: "0 0 18px", fontSize: 14, color: C.muted }}>Verified creators, hand-picked and approved by our team. Hire one for a post, story, or reel and we'll set it up for you.</p>
            {creators === null && <p style={{ color: C.muted }}>Loading…</p>}
            {creators && creators.length === 0 && <p style={{ background: C.panel, borderRadius: 14, padding: "32px 0", textAlign: "center", color: C.muted }}>No verified creators available yet. Check back soon.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{(creators || []).map((c) => <HireCard key={c.username} c={c} token={session.token} business={business} reload={loadCreators} />)}</div>
          </>)}
    </div>
  );
}
function HireCard({ c, token, business, reload }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("reel");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [offsite, setOffsite] = useState(null);
  useEffect(() => { const r = (c.rates || {})[type]; setPrice(r > 0 ? String(r) : ""); }, [type, c.rates]);
  const primary = (c.channels || [])[0];
  const primaryUrl = primary ? socialUrl(primary.platform, primary.handle) : "";
  const amount = Number(price) || 0;
  const hire = async () => {
    if (!(amount > 0)) { setErr("Enter an amount greater than 0."); return; }
    setBusy(true); setErr("");
    await payForHire({
      creator: c, contentType: type, price: amount, note, business, sessionToken: token,
      onDone: async () => { setBusy(false); setOpen(false); setNote(""); await reload(); },
      onErr: (m) => { setErr(m); setBusy(false); },
    });
  };
  const requested = (c.hires || []).filter((h) => h.status !== "cancelled");
  return (
    <div className="er-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={c.username} image={c.image} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {primaryUrl
            ? <button type="button" onClick={() => setOffsite({ url: primaryUrl, platform: primary.platform, username: primary.handle })} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 15.5, color: C.ink }}>@{c.username}</button>
            : <span style={{ fontWeight: 600, fontSize: 15.5, color: C.ink }}>@{c.username}</span>}
          <span style={{ marginLeft: 7, fontSize: 10.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: C.accentD, background: C.accentSoft, borderRadius: 999, padding: "2px 8px" }}>Verified</span>
          <div style={{ fontSize: 12.5, color: C.muted }}>{c.bio || "Verified creator"}</div>
        </div>
      </div>
      {(c.channels || []).length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 11 }}>
        {c.channels.map((ch, i) => { const u = socialUrl(ch.platform, ch.handle); const inner = <b style={{ color: C.ink }}>{ch.platform}</b>;
          return u ? <button key={i} type="button" onClick={() => setOffsite({ url: u, platform: ch.platform, username: ch.handle })} style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: C.inkSoft, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 999, padding: "3px 10px" }}>{inner}</button>
                   : <span key={i} style={{ fontSize: 12, fontWeight: 600, color: C.inkSoft, border: `1px solid ${C.line}`, borderRadius: 999, padding: "3px 10px" }}>{inner}</span>; })}
      </div>}
      {(c.rates && (c.rates.post > 0 || c.rates.story > 0 || c.rates.reel > 0)) && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {[["post", "Post"], ["story", "Story"], ["reel", "Reel"]].filter(([k]) => c.rates[k] > 0).map(([k, l]) => <span key={k} style={{ fontSize: 12, fontWeight: 700, color: C.accentD, background: C.accentSoft, borderRadius: 999, padding: "3px 10px" }}>{l} ${c.rates[k]}</span>)}
      </div>}
      {requested.length > 0 && <div style={{ marginTop: 11, fontSize: 12.5, fontWeight: 600, color: C.accentD }}>Booked: {requested.map((h) => `${h.contentType}${h.price ? ` ($${h.price})` : ""}`).join(", ")} · we'll confirm the delivery date</div>}
      {open ? <div style={{ marginTop: 13, borderTop: `1px dashed ${C.line}`, paddingTop: 13 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {[["post", "Post"], ["story", "Story"], ["reel", "Reel"]].map(([k, l]) => { const on = type === k;
            return <button key={k} type="button" onClick={() => setType(k)} style={{ flex: 1, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "9px 8px", borderRadius: 10, border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff", color: on ? C.accentD : C.inkSoft }}>{l}</button>; })}
        </div>
        <div style={{ display: "flex", alignItems: "center", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 11, padding: "11px 14px", maxWidth: 180 }}>
          <span style={{ fontSize: 15, color: C.muted, marginRight: 2 }}>$</span>
          <input type="number" min="0" placeholder="Your offer" value={price} onChange={(e) => setPrice(e.target.value)} style={{ flex: 1, width: "100%", border: "none", outline: "none", background: "none", fontFamily: "inherit", fontSize: 15, fontWeight: 600, color: C.ink }} />
        </div>
        <textarea className="er-input" style={{ marginTop: 8 }} placeholder="What do you want them to make? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        {err && <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#9B3024" }}>{err}</p>}
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button className="er-btn er-btn-primary er-btn-sm" disabled={busy || !(amount > 0)} onClick={hire}>{busy ? "Opening…" : `Pay $${amount || 0} and book`}</button>
          <button className="er-btn er-btn-ghost er-btn-sm" onClick={() => setOpen(false)}>Cancel</button>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>Paying now reserves the slot. We brief the creator on your behalf, agree a delivery date, and stay on it until the content is live, so you are not chasing anyone.</p>
      </div> : <button className="er-btn er-btn-light er-btn-sm" style={{ marginTop: 13 }} onClick={() => setOpen(true)}><Spark size={13} /> Hire this creator</button>}
      {offsite && <OffPlatformNotice url={offsite.url} platform={offsite.platform} username={offsite.username} onClose={() => setOffsite(null)} />}
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
const PLATFORMS = ["Instagram", "TikTok", "YouTube", "X (Twitter)", "Facebook", "LinkedIn", "Twitch", "Pinterest", "Snapchat", "Threads", "Blog / Website", "Other"];
function ChannelsEditor({ channels, setChannels }) {
  const upd = (i, k, v) => setChannels(channels.map((c, n) => n === i ? { ...c, [k]: v } : c));
  const add = () => setChannels([...channels, { platform: "Instagram", handle: "", followers: "" }]);
  const del = (i) => setChannels(channels.filter((_, n) => n !== i));
  const total = channels.reduce((n, c) => n + (Number(c.followers) || 0), 0);
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {channels.map((c, i) => (
          <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, background: "#fff" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <select className="er-input" style={{ flex: "1 1 130px" }} value={c.platform} onChange={(e) => upd(i, "platform", e.target.value)}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {channels.length > 1 && <button type="button" onClick={() => del(i)} className="er-btn er-btn-ghost er-btn-sm" style={{ flexShrink: 0 }}><Close size={14} /></button>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="er-input" style={{ flex: "1 1 130px" }} placeholder="@handle" value={c.handle} onChange={(e) => upd(i, "handle", e.target.value)} />
              <input className="er-input" style={{ flex: "1 1 110px" }} type="number" min="0" placeholder="Followers" value={c.followers} onChange={(e) => upd(i, "followers", e.target.value)} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="er-btn er-btn-light er-btn-sm" onClick={add}>+ Add another platform</button>
        {total > 0 && <span style={{ fontSize: 12.5, fontWeight: 600, color: C.muted }}>Total: {total.toLocaleString()} followers</span>}
      </div>
    </div>
  );
}
function RatesEditor({ rates, setRates }) {
  const rows = [["post", "Post"], ["story", "Story"], ["reel", "Reel"]];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map(([k, l]) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.ink }}>{l}</span>
          <div style={{ display: "flex", alignItems: "center", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px", width: 130 }}>
            <span style={{ fontSize: 14.5, color: C.muted, marginRight: 2 }}>$</span>
            <input type="number" min="0" placeholder="0" value={rates[k] || ""} onChange={(e) => setRates({ ...rates, [k]: e.target.value })} style={{ flex: 1, width: "100%", border: "none", outline: "none", background: "none", fontFamily: "inherit", fontSize: 14.5, fontWeight: 600, color: C.ink }} />
          </div>
        </div>
      ))}
    </div>
  );
}
/* Generated cover art for a brand: vibrant gradient (stable per brand) with the name centred.
   Uses the brand's own photo underneath when it has one. `mini` shows just the initial. */
const ART_PALETTES = [["#FF385C", "#FF8A65"], ["#7B61FF", "#C084FC"], ["#00A699", "#5EEAD4"], ["#FC642D", "#FDBA74"], ["#0EA5E9", "#67E8F9"], ["#E11D48", "#FB7185"], ["#16A34A", "#A3E635"], ["#9333EA", "#F472B6"], ["#F59E0B", "#FDE047"], ["#1D4ED8", "#818CF8"], ["#DB2777", "#FDBA74"], ["#0F766E", "#A7F3D0"]];
function artFor(key) { let h = 0; const str = String(key || ""); for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return { pal: ART_PALETTES[h % ART_PALETTES.length], tilt: (h >> 4) % 2 ? 1 : -1, shape: (h >> 6) % 3 }; }
function BrandArt({ b, mini, style, fs }) {
  const name = String((b && b.name) || "Brand").trim();
  const { pal, tilt, shape } = artFor(name);
  const [broken, setBroken] = useState(false);
  const photo = !broken && b && (b.photos || [])[0];
  const size = fs || (mini ? 15 : name.length <= 7 ? 24 : name.length <= 12 ? 19 : name.length <= 18 ? 16 : 13.5);
  return (
    <span style={{ position: "relative", display: "grid", placeItems: "center", overflow: "hidden", background: `linear-gradient(${135 * tilt}deg, ${pal[0]}, ${pal[1]})`, color: "#fff", ...style }}>
      {photo && <img src={photo} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
      {photo && <span style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.55))` }} />}
      {!photo && !mini && <>
        <span style={{ position: "absolute", width: "70%", aspectRatio: "1/1", borderRadius: shape === 1 ? "28%" : "50%", top: shape === 2 ? "-30%" : "-38%", [tilt > 0 ? "right" : "left"]: "-22%", background: "rgba(255,255,255,.22)" }} />
        <span style={{ position: "absolute", width: "48%", aspectRatio: "1/1", borderRadius: "50%", bottom: "-26%", [tilt > 0 ? "left" : "right"]: "-12%", background: "rgba(255,255,255,.16)" }} />
      </>}
      <span style={{ position: "relative", padding: mini ? 0 : "0 10px", textAlign: "center", fontFamily: "'Inter', -apple-system, system-ui, sans-serif", fontWeight: 800, fontSize: size, lineHeight: 1.1, letterSpacing: "-.02em", textShadow: "0 1px 10px rgba(0,0,0,.18)", wordBreak: "break-word" }}>{mini ? name[0].toUpperCase() : name}</span>
    </span>
  );
}
function CreatorModal({ businesses, initialBusinessId, onClose, onRefresh, onLogin, onViewProfile }) {
  const sess = getSession();
  const loggedIn = sess && sess.role === "creator";
  const [step, setStep] = useState(1); // 1 pick → 2 reviews → (4 create account, if new) → 3 done
  const [username, setUsername] = useState(loggedIn ? sess.username : "");
  const [signupEmail, setSignupEmail] = useState(""); const [signupPass, setSignupPass] = useState("");
  const contactIsEmail = signupEmail.includes("@");
  const contactOk = contactIsEmail ? emailOk(signupEmail) : signupEmail.replace(/\D/g, "").length >= 7;
  const [token, setToken] = useState(loggedIn ? sess.token : "");
  const [payShown, setPayShown] = useState(false);
  const [payCountry, setPayCountry] = useState("United States"); const [payCountryQ, setPayCountryQ] = useState(""); const [countryOpen, setCountryOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("venmo"); const [payHandle, setPayHandle] = useState(""); const [savingPay, setSavingPay] = useState(false);
  const [picked, setPicked] = useState(initialBusinessId ? [initialBusinessId] : []);
  const [reviews, setReviews] = useState({});
  const [query, setQuery] = useState("");
  const [enriched, setEnriched] = useState(null);
  useEffect(() => { const t = loggedIn ? sess.token : token; if (!t) return; api(`/businesses?token=${encodeURIComponent(t)}`).then((r) => Array.isArray(r) && setEnriched(r)).catch(() => {}); }, [token]);
  const approved = enriched || businesses;
  const initialBiz = initialBusinessId ? approved.find((b) => b.id === initialBusinessId) : null;
  const initialCat = initialBiz ? (initialBiz.popular ? "__popular" : initialBiz.online ? "__online" : "__physical") : null;
  const [openCat, setOpenCat] = useState(initialCat || "__popular");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [results, setResults] = useState(null);
  const [genId, setGenId] = useState(null);
  const aiReview = async (id, name, stars) => {
    setGenId(id); setErr("");
    try { const r = await api("/review/generate", { method: "POST", body: { businessName: name, stars: stars || 5, token } }); if (r && r.text) setReview(id, { text: r.text }); }
    catch (e) { setErr(e.message); } finally { setGenId(null); }
  };
  const handle = loggedIn ? sess.username : slugify(username);
  const RATING = ["", "Poor", "Fair", "Good", "Great", "Exceptional"];

  const ADD_LIMIT = 15;
  const toggle = (id) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : (p.length >= ADD_LIMIT ? p : [...p, id]));
  const setReview = (id, patch) => setReviews((prev) => ({ ...prev, [id]: { stars: 0, text: "", ...prev[id], ...patch } }));
  const join = async () => {
    setBusy(true); setErr("");
    let r;
    try {
      const contact = contactIsEmail ? { email: signupEmail.trim() } : { phone: signupEmail.trim() };
      r = await api("/influencer", { method: "POST", body: { username: handle, ...contact, password: signupPass } });
      setToken(r.token); onLogin({ role: "creator", token: r.token, username: r.username });
    } catch (e) { setErr(e.message); setBusy(false); return; }
    await finish(r.token);
  };
  const finish = async (tok = token) => {
    setBusy(true); setErr("");
    const out = []; let capped = false;
    try {
      for (const id of picked) {
        const r = reviews[id] || {}; const body = { token: tok, businessId: id };
        if (r.stars > 0) { body.stars = r.stars; body.text = r.text || ""; }
        try {
          const res = await api("/creator/link", { method: "POST", body });
          const b = approved.find((x) => x.id === id);
          out.push({ ...res, name: b ? b.name : "" });
        } catch (e) {
          if (/day|429/i.test(e.message || "")) { capped = true; break; }
          throw e;
        }
      }
      if (!out.length && capped) { setErr(`You've hit the ${ADD_LIMIT}-a-day limit. Come back tomorrow to add more.`); setBusy(false); return; }
      setResults(out); setStep(3); onRefresh();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const q = query.trim().toLowerCase();
  const match = (b) => !q || (b.name || "").toLowerCase().includes(q);
  const popular = approved.filter((b) => b.popular && b.name && b.name.trim());
  const named = approved.filter((b) => b && b.name && b.name.trim()).sort((a, b) => (b.paid ? 1 : 0) - (a.paid ? 1 : 0));
  // Three sections: popular partners, online products, physical (in-person/shipped) brands.
  const sections = [
    ["__popular", "⭐", "Popular brands", "15–30% off for your friends", popular, true],
    ["__online", "💻", "Online products", "Apps, software and digital products", named.filter((b) => !b.popular && b.online), false],
    ["__physical", "🛍️", "Physical brands", "Beauty, fashion, home, food and more", named.filter((b) => !b.popular && !b.online), false],
  ];
  const noMatches = q && !sections.some((x) => x[4].some(match));
  const brandRow = (b) => { const on = picked.includes(b.id);
    return <button key={b.id} type="button" onClick={() => toggle(b.id)} style={{ display: "flex", flexDirection: "column", textAlign: "left", padding: 0, border: "none", borderRadius: 14, background: "#fff", boxShadow: on ? `0 0 0 3px ${C.accent}` : `0 0 0 1px ${C.line}`, overflow: "hidden", cursor: "pointer", fontFamily: "inherit" }}>
      <span style={{ position: "relative", display: "block" }}>
        <BrandArt b={b} style={{ width: "100%", aspectRatio: "4/3" }} />
        <span style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center", background: on ? C.accent : "rgba(255,255,255,.9)", color: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }}>{on ? <Check size={14} /> : <Plus size={14} color={C.ink} />}</span>
        {offText(b) && <span style={{ position: "absolute", bottom: 8, left: 8, fontSize: 10.5, fontWeight: 800, color: C.ink, background: "rgba(255,255,255,.94)", borderRadius: 999, padding: "3px 8px" }}>{offText(b)}</span>}
        {b.paid && <span style={{ position: "absolute", top: 8, left: 8, fontSize: 9.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: C.ink, background: "rgba(255,255,255,.92)", borderRadius: 999, padding: "3px 7px" }}>Promoted</span>}
      </span>
      <span style={{ display: "block", padding: "8px 10px", minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(b.categories || [])[0] || (b.online ? "Online" : (b.city || "-"))}</span>
        {earnInfo(b) && <span style={{ display: "block", marginTop: 4, fontSize: 12, fontWeight: 800, color: C.accentD, background: C.accentSoft, borderRadius: 7, padding: "4px 7px" }}>You earn {earnInfo(b).est}/sale</span>}
      </span>
    </button>; };
  const brandGrid = (arr) => <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,138px),1fr))", gap: 10, padding: 12 }}>{arr.map(brandRow)}</div>;

  return (
    <Modal onClose={onClose} wide>
      <div style={{ padding: "30px 28px" }}>
        {step !== 3 && <><span className="er-eyebrow">Make your list</span><div style={{ marginTop: 12 }}><Stepper step={step === 1 ? 0 : step === 2 ? 1 : 2} total={loggedIn ? 2 : 3} /></div></>}
        {step === 4 && <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <div><h2 className="er-serif" style={{ margin: 0, fontSize: 27, fontWeight: 500 }}>Your list is ready 🎉</h2><p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted }}>Create a free account to publish it and get your link. Pick a username and add your email or phone.</p></div>
          <Field label="Username" hint="This becomes your public profile link.">
            <div style={{ display: "flex", alignItems: "center", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 11, padding: "13px 14px" }}>
              <span style={{ fontSize: 15, color: C.muted }}>easyrecommend.co/@</span>
              <input autoFocus style={{ flex: 1, minWidth: 0, width: "100%", border: "none", outline: "none", background: "none", fontSize: 15, fontFamily: "inherit", color: C.ink }} placeholder="yourname" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} /></div></Field>
          <Field label="Email or phone number" hint="So you can log back in and get paid.">
            <input className="er-input" placeholder="you@email.com or +1 555 123 4567" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} /></Field>
          <Field label="Password" hint="At least 6 characters.">
            <input className="er-input" type="password" placeholder="Create a password" value={signupPass} onChange={(e) => setSignupPass(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && handle && contactOk && signupPass.length >= 6 && !busy) join(); }} /></Field>
          <ErrBox msg={err} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <button className="er-btn er-btn-ghost" onClick={() => setStep(2)} disabled={busy}><ChevL size={16} /> Back</button>
            <button className="er-btn er-btn-primary" disabled={!handle || !contactOk || signupPass.length < 6 || busy} onClick={join}>{busy ? "Publishing…" : <>Create account &amp; publish <Arrow size={16} /></>}</button>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: C.muted, textAlign: "center" }}>Free forever. Log in anytime with your email or phone and password.</p>
        </div>}

        {step === 1 && <div style={{ marginTop: 22 }}>
          <h2 className="er-serif" style={{ margin: 0, fontSize: 27, fontWeight: 500 }}>Pick businesses to back</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted }}>Choose as many as you like, we generate a tracked link for each, so you earn on every sale.</p>
          <div style={{ marginTop: 16, position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted, display: "flex" }}><Search size={16} /></span>
            <input className="er-input" style={{ paddingLeft: 38 }} placeholder="Search brands" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {picked.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {picked.map((id) => { const b = approved.find((x) => x.id === id); if (!b) return null;
              return <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.ink, color: C.paper, borderRadius: 999, padding: "5px 6px 5px 12px", fontSize: 13, fontWeight: 600 }}>{b.name}<button onClick={() => toggle(id)} style={{ display: "grid", placeItems: "center", width: 18, height: 18, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.22)", color: C.paper, cursor: "pointer" }}><Close size={11} /></button></span>; })}
          </div>}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12, maxHeight: 420, overflowY: "auto", paddingRight: 2 }}>
            {sections.map(([key, icon, title, sub, all, accent]) => { const list = all.filter(match); if (!all.length || (q && !list.length)) return null; const open = q ? true : openCat === key; const selCount = all.filter((b) => picked.includes(b.id)).length;
              return <div key={key} style={{ border: `${accent ? 1.5 : 1}px solid ${accent ? C.accent : C.line}`, borderRadius: 14, overflow: "hidden", background: "#fff", flexShrink: 0 }}>
                <button type="button" onClick={() => { if (!q) setOpenCat(open ? null : key); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, minHeight: 64, padding: "16px", background: accent ? C.accentSoft : open ? "#fff" : C.panel, border: "none", cursor: q ? "default" : "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 17, flexShrink: 0 }}>{icon}</span>
                  <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontWeight: 700, fontSize: 16.5, lineHeight: 1.2, color: C.ink }}>{title}</span><span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: accent ? C.accentD : C.muted, marginTop: 2 }}>{sub}</span></span>
                  {selCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: C.accent, borderRadius: 999, padding: "4px 11px", flexShrink: 0 }}>{selCount} picked</span>}
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: C.muted, flexShrink: 0 }}>{list.length}</span>
                  <span style={{ color: C.muted, display: "flex", flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}><ChevR size={17} /></span>
                </button>
                {open && <div style={{ borderTop: `1px solid ${C.line}` }}>{brandGrid(list)}</div>}
              </div>; })}
            {!sections.some((x) => x[4].length) && <p style={{ textAlign: "center", color: C.muted, fontSize: 13.5, padding: "24px 0" }}>No live businesses yet, check back soon.</p>}
            {noMatches && <p style={{ textAlign: "center", color: C.muted, fontSize: 13.5, padding: "20px 0" }}>No brands match &ldquo;{query}&rdquo;.</p>}
          </div>
          <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12.5, color: C.muted }}>{picked.length}/{ADD_LIMIT} picked</span>
            <button className="er-btn er-btn-primary" disabled={!picked.length} onClick={() => setStep(2)}>Continue{picked.length ? ` · ${picked.length}` : ""} <ChevR size={16} /></button></div>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: C.muted, textAlign: "center" }}>You can add up to {ADD_LIMIT} brands a day.</p>
        </div>}

        {step === 2 && <div style={{ marginTop: 22 }}>
          <h2 className="er-serif" style={{ margin: 0, fontSize: 27, fontWeight: 500 }}>Add your reviews</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted }}>A rating and a note for each brand show on your profile. All optional, but it's what builds trust.</p>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12, maxHeight: 380, overflowY: "auto" }}>
            {picked.map((id) => { const b = approved.find((x) => x.id === id); if (!b) return null; const r = reviews[id] || { stars: 0, text: "" };
              return <div key={id} style={{ border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <BrandArt b={b} mini style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: 15.5, color: C.ink, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: r.stars ? C.accent : C.muted }}>{r.stars ? RATING[r.stars] : "Optional"}</span>
                </div>
                <div style={{ marginTop: 10 }}><StarPicker value={r.stars} onChange={(v) => setReview(id, { stars: v })} /></div>
                {r.stars > 0 && <div style={{ marginTop: 10 }}>
                  <textarea className="er-input" placeholder={`What did you love about ${b.name}?`} value={r.text} onChange={(e) => setReview(id, { text: e.target.value })} />
                  {token && <button type="button" onClick={() => aiReview(id, b.name, r.stars)} disabled={genId === id} style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: C.accentD, background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: 999, padding: "6px 12px", cursor: genId === id ? "default" : "pointer", opacity: genId === id ? 0.7 : 1 }}><Spark size={13} /> {genId === id ? "Writing…" : (r.text ? "Rewrite with AI" : "Write with AI")}</button>}
                </div>}
              </div>; })}
          </div>
          <ErrBox msg={err} />
          <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button className="er-btn er-btn-ghost" onClick={() => setStep(1)} disabled={busy}><ChevL size={16} /> Back</button>
            {token
              ? <button className="er-btn er-btn-primary" onClick={() => finish()} disabled={busy}><Spark size={16} /> {busy ? "Generating…" : `Generate ${picked.length > 1 ? `${picked.length} links` : "my link"}`}</button>
              : <button className="er-btn er-btn-primary" onClick={() => { setErr(""); setStep(4); }}>My list is ready <ChevR size={16} /></button>}</div>
        </div>}

        {step === 3 && results && !payShown && (() => {
          const methods = PAYOUT_BY_COUNTRY[payCountry] || PAYOUT_BY_COUNTRY.Other;
          const cur = methods.find((m) => m[0] === payMethod) || methods[0];
          const countryList = PAYOUT_COUNTRIES.filter((c) => c.toLowerCase().includes(payCountryQ.trim().toLowerCase()));
          const pickCountry = (c) => { setPayCountry(c); setPayCountryQ(""); setCountryOpen(false); const ms = PAYOUT_BY_COUNTRY[c] || PAYOUT_BY_COUNTRY.Other; setPayMethod(ms[0][0]); setPayHandle(""); };
          const savePay = async (skip) => {
            if (!skip) {
              if (!payHandle.trim()) { setErr("Add your payout detail, or skip for now."); return; }
              setSavingPay(true); setErr("");
              try { await api("/creator/me", { method: "PATCH", body: { token, ...(contactIsEmail ? { email: signupEmail.trim() } : {}), payCountry, payMethod, payHandle: payHandle.trim() } }); }
              catch (e) { setErr(e.message); setSavingPay(false); return; }
              setSavingPay(false);
            }
            setPayShown(true);
          };
          return <div style={{ paddingTop: 6 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ margin: "0 auto", width: 52, height: 52, borderRadius: "50%", display: "grid", placeItems: "center", background: C.accentSoft, color: C.accentD }}><Spark size={24} /></div>
              <h2 className="er-serif" style={{ margin: "14px 0 0", fontSize: 25, fontWeight: 500 }}>One last step: get paid</h2>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: C.muted }}>Your links are ready. Tell us your country so we can show the right payout options.</p>
              <div style={{ marginTop: 16, background: C.ink, color: C.paper, borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(253,252,250,.6)", marginBottom: 8 }}>Average earnings in first 3 months</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, background: "rgba(253,252,250,.07)", borderRadius: 10, padding: "10px 12px" }}>
                    <div className="er-serif" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.1 }}>~{demoMoney(500)}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(253,252,250,.7)" }}>smaller creators</div>
                  </div>
                  <div style={{ flex: 1, background: C.accent, color: "#fff", borderRadius: 10, padding: "10px 12px" }}>
                    <div className="er-serif" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.1 }}>~{demoMoney(5000)}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.85)" }}>larger creators</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Country">
                <div style={{ position: "relative" }}>
                  <input className="er-input" placeholder="Search your country…"
                    value={countryOpen ? payCountryQ : payCountry}
                    onChange={(e) => { setPayCountryQ(e.target.value); setCountryOpen(true); }}
                    onFocus={() => { setPayCountryQ(""); setCountryOpen(true); }}
                    onBlur={() => setTimeout(() => setCountryOpen(false), 150)} />
                  {countryOpen && <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 5, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: "0 12px 30px -12px rgba(0,0,0,.25)", maxHeight: 220, overflowY: "auto" }}>
                    {countryList.length ? countryList.map((c) => <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pickCountry(c)} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 14px", border: "none", borderBottom: `1px solid ${C.line}`, background: c === payCountry ? C.accentSoft : "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: c === payCountry ? C.accentD : C.ink }}>{c}</button>)
                      : <p style={{ margin: 0, padding: "12px 14px", fontSize: 13, color: C.muted }}>No match, pick &ldquo;Other&rdquo;.</p>}
                  </div>}
                </div>
              </Field>
              <Field label={`Payout method in ${payCountry}`}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {methods.map(([k, label]) => { const on = payMethod === k;
                    return <button key={k} type="button" onClick={() => { setPayMethod(k); setPayHandle(""); }} style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "9px 13px", borderRadius: 999, border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff", color: on ? C.accentD : C.inkSoft }}>{label}</button>; })}
                </div>
              </Field>
              <Field label={`Your ${cur[1]} details`}><input className="er-input" placeholder={cur[2]} value={payHandle} onChange={(e) => setPayHandle(e.target.value)} /></Field>
              <ErrBox msg={err} />
              <button className="er-btn er-btn-primary er-btn-block" disabled={savingPay} onClick={() => savePay(false)}>{savingPay ? "Saving…" : "Save and finish"}</button>
              <button className="er-btn er-btn-ghost er-btn-block" onClick={() => savePay(true)}>Skip for now</button>
            </div>
          </div>;
        })()}

        {step === 3 && results && payShown && <div style={{ paddingTop: 6 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ margin: "0 auto", width: 56, height: 56, display: "grid", placeItems: "center" }}><Seal size={50} /></div>
            <h2 className="er-serif" style={{ margin: "14px 0 0", fontSize: 24, fontWeight: 500 }}>You're all set</h2>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: C.muted }}>Here's your one link. Put it in your bio, and every brand on your list earns you a commission.</p>
          </div>
          <div style={{ marginTop: 20, textAlign: "left" }}>
            <CopyRow label="Your page · add this to your bio" value={results[0].profileUrl} />
            <div style={{ marginTop: 12, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 15px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Where do I put it?</div>
              <p style={{ margin: 0, fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>Drop it in your Instagram or TikTok bio, or add it to your Linktree. When your audience taps it, they see your whole list.</p>
              <a href="https://www.instagram.com/nycdesihangouts/" target="_blank" rel="noopener noreferrer" className="er-link" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 13, fontWeight: 600, color: C.accentD, textDecoration: "none" }}><IgIcon size={14} /> See how a creator uses theirs</a>
            </div>
          </div>
          <button className="er-btn er-btn-block" style={{ marginTop: 16, border: "none", color: "#fff", background: "linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)" }}
            onClick={() => startIgShare(`${window.location.origin}/@${handle}`, () => shareListToStory(handle, "", picked.map((id) => approved.find((x) => x.id === id)).filter(Boolean)))}>
            <IgIcon size={16} /> Share on Instagram story</button>
          <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="er-btn er-btn-ghost" onClick={onClose}>Close</button>
            <button className="er-btn er-btn-primary" onClick={() => { onViewProfile(handle); onClose(); }}>View my page <Arrow size={16} /></button></div>
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
    commissionPct: b.commissionPct || 0, commissionFlat: b.commissionFlat || 0, discount: b.discount || 0, discountText: b.discountText || "", discountCode: b.discountCode || "", popular: !!b.popular,
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
        <div style={{ minWidth: 0, flex: 1 }}><p className="er-serif" style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>{b.name}</p><p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>{(b.categories || []).join(", ") || "No category"} · {b.online ? "Online" : (b.city || "-")}</p></div>
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
          <Field label="Country"><input className="er-input" style={{ width: 150 }} placeholder="United States" value={d.city} onChange={(e) => set("city", e.target.value)} /></Field>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600 }}>
            <button type="button" onClick={() => set("online", !d.online)} style={{ position: "relative", width: 44, height: 26, borderRadius: 99, border: "none", cursor: "pointer", background: d.online ? C.accent : "#CFC8BA" }}><span style={{ position: "absolute", top: 3, left: d.online ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff" }} /></button> Online Global
          </label>
        </div>
        <div style={{ display: "flex", gap: 6 }}>{[["percent", "%"], ["flat", "$"], ["both", "Both"]].map(([t, lbl]) => { const on = d.commissionType === t;
          return <button key={t} onClick={() => set("commissionType", t)} style={{ flex: 1, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "8px 6px", borderRadius: 8, border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff", color: on ? C.accentD : C.inkSoft }}>{lbl}</button>; })}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {(d.commissionType === "percent" || d.commissionType === "both") && <label style={{ fontSize: 12.5, color: C.muted }}>Percent <input type="number" value={d.commissionPct} onChange={(e) => set("commissionPct", +e.target.value)} className="er-input" style={{ width: 66, display: "inline-block", padding: "6px 8px", marginLeft: 4 }} />%</label>}
          {(d.commissionType === "flat" || d.commissionType === "both") && <label style={{ fontSize: 12.5, color: C.muted }}>Flat $<input type="number" value={d.commissionFlat} onChange={(e) => set("commissionFlat", +e.target.value)} className="er-input" style={{ width: 70, display: "inline-block", padding: "6px 8px", marginLeft: 4 }} /></label>}
          <label style={{ fontSize: 12.5, color: C.muted }}>Discount <input type="number" value={d.discount} onChange={(e) => { set("discount", +e.target.value); set("discountText", ""); }} className="er-input" style={{ width: 66, display: "inline-block", padding: "6px 8px", marginLeft: 4 }} />%</label>
          <label style={{ fontSize: 12.5, color: C.muted }}>Label <input value={d.discountText} placeholder="e.g. 15–30% off" onChange={(e) => set("discountText", e.target.value.slice(0, 30))} className="er-input" style={{ width: 120, display: "inline-block", padding: "6px 8px", marginLeft: 4 }} /></label>
          <label style={{ fontSize: 12.5, color: C.muted }}>Code <input value={d.discountCode} onChange={(e) => set("discountCode", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 30))} className="er-input" style={{ width: 110, display: "inline-block", padding: "6px 8px", marginLeft: 4 }} /></label>
          <label style={{ fontSize: 12.5, color: C.muted, display: "inline-flex", alignItems: "center", gap: 5 }}><input type="checkbox" checked={d.popular} onChange={(e) => set("popular", e.target.checked)} /> Popular</label>
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
// Saved SMS messages (shared across every SMS box in admin).
let _smsTpl = null; const _smsSubs = new Set();
function useSmsTemplates() {
  const [list, setList] = useState(_smsTpl || []);
  useEffect(() => {
    _smsSubs.add(setList);
    if (_smsTpl === null) { _smsTpl = []; api("/admin/sms-templates", { admin: true }).then((r) => { _smsTpl = r.templates || []; _smsSubs.forEach((f) => f(_smsTpl)); }).catch(() => { _smsTpl = null; }); }
    else setList(_smsTpl);
    return () => { _smsSubs.delete(setList); };
  }, []);
  const save = async (next) => { const r = await api("/admin/sms-templates", { method: "POST", admin: true, body: { templates: next } }); _smsTpl = r.templates || next; _smsSubs.forEach((f) => f(_smsTpl)); };
  return [list, save];
}
function SmsTemplates({ msg, setMsg }) {
  const [list, save] = useSmsTemplates(); const [sel, setSel] = useState(""); const [busy, setBusy] = useState(false);
  const pick = (id) => { setSel(id); const t = list.find((x) => x.id === id); if (t) setMsg(t.text); };
  const add = async () => {
    const name = window.prompt("Name this saved message", msg.trim().slice(0, 30)); if (!name || !name.trim()) return;
    setBusy(true);
    try { const id = Date.now().toString(36); await save([...list, { id, name: name.trim(), text: msg }]); setSel(id); } catch (e) { alert(e.message || "Couldn't save."); } finally { setBusy(false); }
  };
  const del = async () => {
    if (!sel || !window.confirm("Delete this saved message?")) return;
    setBusy(true);
    try { await save(list.filter((x) => x.id !== sel)); setSel(""); } catch (e) { alert(e.message || "Couldn't delete."); } finally { setBusy(false); }
  };
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
      <select className="er-input" style={{ flex: "1 1 200px", minWidth: 160 }} value={sel} onChange={(e) => pick(e.target.value)}>
        <option value="">{list.length ? "Use a saved message…" : "No saved messages yet"}</option>
        {list.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <button type="button" className="er-btn er-btn-light er-btn-sm" disabled={busy || !msg.trim()} onClick={add}>Save as template</button>
      {sel && <button type="button" className="er-btn er-btn-ghost er-btn-sm" disabled={busy} onClick={del}>Delete</button>}
    </div>
  );
}
function BulkSms({ businesses = [] }) {
  const [msg, setMsg] = useState(""); const [nums, setNums] = useState(""); const [aud, setAud] = useState("approved"); const [richOnly, setRichOnly] = useState(false);
  const [picked, setPicked] = useState([]); const [showPick, setShowPick] = useState(false);
  const [busy, setBusy] = useState(false); const [res, setRes] = useState(""); const [err, setErr] = useState("");
  const withPhone = businesses.filter((b) => b.phone);
  const sorted = [...businesses].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const send = async () => {
    if (!msg.trim()) { setErr("Write a message first."); return; }
    if (aud === "none" && !nums.trim() && picked.length === 0) { setErr("Pick a group, pick businesses, or paste some numbers."); return; }
    if (!window.confirm("Send this SMS now?")) return;
    setBusy(true); setErr(""); setRes("");
    try {
      const pastedArr = nums.trim() ? nums.split(/[\s,;]+/) : [];
      const pickedPhones = businesses.filter((b) => picked.includes(b._id)).map((b) => b.phone).filter(Boolean);
      const r = await api("/admin/bulk-sms", { method: "POST", admin: true, body: { message: msg, numbers: [...pastedArr, ...pickedPhones], audience: aud === "none" ? "" : aud, richOnly } });
      setRes(`Sent to ${r.sent} of ${r.recipients} recipient(s).${r.skipped ? ` Skipped ${r.skipped} non-rich number(s).` : ""}`);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const linkBtn = { background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: C.accentD };
  return (
    <div className="er-card" style={{ padding: 18, marginTop: 22 }}>
      <h2 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>Bulk SMS</h2>
      <p style={{ margin: "6px 0 14px", fontSize: 13.5, color: C.muted }}>Pick which businesses to text, and/or paste extra numbers below.</p>
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>Businesses on file</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {[["approved", "Approved only"], ["pending", "Pending only"], ["paid", "Paid only"], ["free", "Free only"], ["all", "All businesses"], ["none", "None"]].map(([k, l]) => { const on = aud === k;
          return <button key={k} type="button" onClick={() => setAud(k)} style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "8px 13px", borderRadius: 999, border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff", color: on ? C.accentD : C.inkSoft }}>{l}</button>; })}
      </div>
      <div style={{ marginBottom: 14 }}>
        <button type="button" onClick={() => setShowPick(!showPick)} style={{ ...linkBtn, textDecoration: "underline" }}>{showPick ? "Hide business picker" : "Or pick specific businesses"}{picked.length ? ` (${picked.length} selected)` : ""}</button>
        {showPick && <div style={{ marginTop: 8, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: C.panel, borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 12.5, color: C.muted }}>{withPhone.length} with a phone · newest first</span>
            <div style={{ display: "flex", gap: 14 }}>
              <button type="button" onClick={() => setPicked(withPhone.map((b) => b._id))} style={linkBtn}>Select all</button>
              <button type="button" onClick={() => setPicked([])} style={{ ...linkBtn, color: C.muted }}>Clear</button>
            </div>
          </div>
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {sorted.length === 0 ? <p style={{ margin: 0, padding: "18px 12px", textAlign: "center", fontSize: 13, color: C.muted }}>No businesses yet.</p> : sorted.map((b) => { const on = picked.includes(b._id); const noPhone = !b.phone;
              return <label key={b._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderTop: `1px solid ${C.line}`, cursor: noPhone ? "not-allowed" : "pointer", opacity: noPhone ? 0.5 : 1 }}>
                <input type="checkbox" disabled={noPhone} checked={on} onChange={() => setPicked((p) => on ? p.filter((x) => x !== b._id) : [...p, b._id])} style={{ accentColor: C.accent }} />
                <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name || "Untitled"}</span><span style={{ display: "block", fontSize: 11.5, color: C.muted }}>{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ""}</span></span>
                <span style={{ fontSize: 11.5, color: C.muted, flexShrink: 0 }}>{noPhone ? "no phone" : b.status}</span>
              </label>; })}
          </div>
        </div>}
      </div>
      <SmsTemplates msg={msg} setMsg={setMsg} />
      <textarea className="er-input" style={{ minHeight: 88 }} placeholder="Your message…" value={msg} onChange={(e) => setMsg(e.target.value)} />
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.muted, margin: "14px 0 8px" }}>Extra numbers (optional)</div>
      <textarea className="er-input" style={{ minHeight: 60 }} placeholder="Phone numbers, separate by commas, spaces, or new lines (e.g. +15550102030)" value={nums} onChange={(e) => setNums(e.target.value)} />
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
function PaidRow({ b, reload }) {
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    try { await api(`/admin/business/${b._id}/set-paid`, { method: "POST", admin: true, body: { paid: !b.paid, plan: b.plan || "starter" } }); await reload(); }
    catch (e) { alert(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="er-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
      <span style={{ width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center", background: C.panel, color: C.ink, flexShrink: 0 }}><Store size={18} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{b.name || "Untitled"}</p>
        <p style={{ margin: 0, fontSize: 12.5, color: b.paid ? C.accent : C.muted, fontWeight: 600 }}>{b.paid ? `Paid, ${b.plan || "starter"}${b.premium ? " · premium" : ""}` : "Not paid"}</p>
      </div>
      <button type="button" onClick={toggle} disabled={busy} title={b.paid ? "Turn paid off" : "Turn paid on"} style={{ position: "relative", width: 46, height: 27, borderRadius: 99, border: "none", cursor: busy ? "default" : "pointer", background: b.paid ? C.accent : "#CFC8BA", transition: "background .15s", flexShrink: 0, opacity: busy ? 0.6 : 1 }}>
        <span style={{ position: "absolute", top: 3, left: b.paid ? 22 : 3, width: 21, height: 21, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
      </button>
    </div>
  );
}
function VerifyToggle({ i, reload }) {
  const [busy, setBusy] = useState(false);
  const on = !!i.featured;
  const click = async () => {
    const next = !on;
    setBusy(true);
    try {
      const r = await api(`/admin/influencer/${i.username}/featured`, { method: "POST", admin: true, body: { featured: next } });
      if (!!r.featured !== next) alert("The server didn't save that change. Is the latest backend deployed?");
      await reload();
    } catch (e) { alert(e.message || "Couldn't save."); } finally { setBusy(false); }
  };
  return (
    <button type="button" disabled={busy} title={on ? "Verified for hire" : "Not verified for hire"} onClick={click}
      style={{ cursor: busy ? "default" : "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "6px 11px", borderRadius: 999, border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : "#fff", color: on ? C.accentD : C.muted, flexShrink: 0, opacity: busy ? 0.6 : 1 }}>
      {busy ? "…" : on ? "★ Verified" : "Verify"}
    </button>
  );
}
function FeatureSwitches() {
  const [hireOn, setHireOn] = useState(null); const [pricingOn, setPricingOn] = useState(null);
  const [busy, setBusy] = useState(""); const [err, setErr] = useState("");
  useEffect(() => { api("/settings").then((s) => { setHireOn(!!s.hireEnabled); setPricingOn(!!s.pricingEnabled); }).catch((e) => { setHireOn(false); setPricingOn(false); setErr(`Couldn't load settings: ${e.message}`); }); }, []);
  const toggle = async (key, cur, setCur) => {
    const next = !cur;
    setBusy(key); setErr("");
    try {
      const r = await api("/admin/settings", { method: "POST", admin: true, body: { [key]: next } });
      setCur(!!r[key]);
      if (!!r[key] !== next) setErr("The server didn't save that change. Is the latest backend deployed?");
    } catch (e) { setErr(e.message || "Couldn't save."); } finally { setBusy(""); }
  };
  const Row = ({ label, desc, on, setOn, k }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label} {on !== null && <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 4, padding: "2px 8px", borderRadius: 999, background: on ? C.accentSoft : C.panel, color: on ? C.accentD : C.muted }}>{on ? "ON" : "OFF"}</span>}</div>
        <div style={{ fontSize: 12.5, color: C.muted }}>{desc}</div>
      </div>
      <button type="button" disabled={!!busy || on === null} onClick={() => toggle(k, on, setOn)} style={{ position: "relative", width: 46, height: 27, borderRadius: 99, border: "none", cursor: busy || on === null ? "default" : "pointer", background: on ? C.accent : "#CFC8BA", transition: "background .15s", flexShrink: 0, opacity: busy === k ? 0.6 : 1 }}>
        <span style={{ position: "absolute", top: 3, left: on ? 22 : 3, width: 21, height: 21, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
      </button>
    </div>
  );
  return (
    <div className="er-card" style={{ padding: 18, marginTop: 22 }}>
      <h2 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>Features</h2>
      <Row label="&ldquo;Hire influencers&rdquo; tab" desc="Show the hire tab to businesses. Keep it off until you have enough verified creators." on={hireOn} setOn={setHireOn} k="hireEnabled" />
      <Row label="Pricing / paid plans" desc="ON (default) = Online Global brands see plans and pay to unlock creator requests. Local brands are always free. OFF = free for everyone." on={pricingOn} setOn={setPricingOn} k="pricingEnabled" />
      {err && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#9B3024" }}>{err}</p>}
    </div>
  );
}
/* Admin: add the onboarded popular brands (idempotent; never overwrites existing listings). */
function AdminSeedPopular() {
  const [st, setSt] = useState("");
  const run = async () => { if (!window.confirm("Add the 100 popular brands as live listings (15–30% off)? Existing brands are only tagged Popular, never overwritten.")) return; setSt("busy"); try { const r = await api("/admin/seed-popular", { method: "POST", admin: true }); setSt(`Done: ${r.created} added, ${r.marked} existing tagged Popular.`); } catch (e) { setSt(e.message); } };
  return (
    <div className="er-card" style={{ padding: 18, marginTop: 22, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 240px" }}><div style={{ fontWeight: 700, fontSize: 15 }}>⭐ Popular brands</div><div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{st && st !== "busy" ? st : "Add the 100 onboarded India + USA brands, shown first everywhere with 15–30% off. Set each one's exact discount, code and commission in its listing."}</div></div>
      <button className="er-btn er-btn-primary er-btn-sm" disabled={st === "busy"} onClick={run}>{st === "busy" ? "Adding…" : "Add popular brands"}</button>
    </div>
  );
}
/* Admin: add the 30 popular products to their brands (separate from the brand seed). */
function AdminSeedProducts() {
  const [st, setSt] = useState(""); const [missing, setMissing] = useState([]);
  const run = async () => {
    setSt("busy"); setMissing([]);
    try {
      const r = await api("/admin/seed-products", { method: "POST", admin: true });
      setSt(`Done: ${r.added} added, ${r.updated} already there (kept, tagged Popular)${r.removed ? `, ${r.removed} removed` : ""}${r.brandsCreated ? `, ${r.brandsCreated} new brands created` : ""}. ${r.brandsWithProducts} brands now show popular products.`);
      setMissing(r.missing || []);
    } catch (e) { setSt(e.message); }
  };
  return (
    <div className="er-card" style={{ padding: 18, marginTop: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 240px" }}><div style={{ fontWeight: 700, fontSize: 15 }}>🧴 Popular products</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{st && st !== "busy" ? st : "Add the 28 popular products to their brands. Safe to press again: nothing is duplicated."}</div>
        {missing.length > 0 && <div style={{ fontSize: 12.5, color: "#C0392B", marginTop: 6 }}>Not added: {missing.join(", ")}</div>}
      </div>
      <button className="er-btn er-btn-primary er-btn-sm" disabled={st === "busy"} onClick={run}>{st === "busy" ? "Adding…" : "Add popular products"}</button>
    </div>
  );
}
/* Admin: approve/reject brands' creator-link offers (image + discount). */
function AdminOffers() {
  const [list, setList] = useState(null); const [busy, setBusy] = useState("");
  const load = () => api("/admin/offers", { admin: true }).then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, []);
  const act = async (id, verb) => {
    let body;
    if (verb === "reject") { const reason = window.prompt("Reason (sent to the brand by SMS, optional):", ""); if (reason === null) return; body = { reason }; }
    setBusy(id); try { await api(`/admin/offer/${id}/${verb}`, { method: "POST", admin: true, body }); await load(); } catch (e) { alert(e.message); } finally { setBusy(""); }
  };
  if (!list || list.length === 0) return null;
  const desc = (o) => [o.discount ? `${o.discount}% off` : "No %", o.discountCode ? `code ${o.discountCode}` : "no code"].join(" · ");
  return (
    <div className="er-card" style={{ padding: 18, marginTop: 22 }}>
      <h2 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft, display: "flex", alignItems: "center", gap: 8 }}>Offers waiting on approval <span style={{ background: "#D97706", color: "#fff", borderRadius: 999, fontSize: 11, padding: "1px 7px" }}>{list.length}</span></h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
        {list.map((r) => (
          <div key={r.id} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
            {r.pending.offerImage ? <img src={r.pending.offerImage} alt="" style={{ width: 200, maxWidth: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 10, border: `1px solid ${C.line}` }} /> : <div style={{ width: 200, maxWidth: "100%", aspectRatio: "16/9", borderRadius: 10, background: C.panel, display: "grid", placeItems: "center", fontSize: 12, color: C.muted }}>No image</div>}
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{r.name}</div>
              <div style={{ marginTop: 6, fontSize: 13.5 }}><b>New:</b> {desc(r.pending)}</div>
              <div style={{ marginTop: 2, fontSize: 12.5, color: C.muted }}>Live now: {desc(r.live)}{r.live.offerImage ? " · has image" : ""}</div>
              {r.pending.submittedAt && <div style={{ marginTop: 2, fontSize: 12, color: C.muted }}>Sent {new Date(r.pending.submittedAt).toLocaleString()}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="er-btn er-btn-primary er-btn-sm" disabled={busy === r.id} onClick={() => act(r.id, "approve")}><Check size={13} /> Approve</button>
                <button className="er-btn er-btn-ghost er-btn-sm" disabled={busy === r.id} onClick={() => act(r.id, "reject")}>Reject</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function AdminSetupRequests() {
  const [list, setList] = useState(null);
  const load = () => api("/admin/setup-requests", { admin: true }).then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, []);
  const markDone = async (id) => { try { await api(`/admin/setup-request/${id}/done`, { method: "POST", admin: true }); await load(); } catch (e) {} };
  if (!list || list.length === 0) return null;
  const openCount = list.filter((r) => r.status !== "done").length;
  return (
    <div className="er-card" style={{ padding: 18, marginTop: 22 }}>
      <h2 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft, display: "flex", alignItems: "center", gap: 8 }}>Dev setup requests {openCount > 0 && <span style={{ background: "#D97706", color: "#fff", borderRadius: 999, fontSize: 11, padding: "1px 7px" }}>{openCount}</span>}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
        {list.map((r) => (
          <div key={r.id} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, opacity: r.status === "done" ? 0.6 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{r.name || "Business"}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: C.panel, color: C.inkSoft }}>{r.platform || "—"}</span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</span>
            </div>
            {r.siteUrl && <a href={/^https?:\/\//i.test(r.siteUrl) ? r.siteUrl : `https://${r.siteUrl}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 4, fontSize: 13, color: C.accentD, fontWeight: 600, textDecoration: "none", wordBreak: "break-all" }}>{r.siteUrl}</a>}
            {r.note && <p style={{ margin: "6px 0 0", fontSize: 13, color: C.inkSoft }}>{r.note}</p>}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <span style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12, color: C.muted, wordBreak: "break-all" }}>key: {r.pixelKey}</span>
              {r.status === "done" ? <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: C.accentD }}>Done</span>
                : <button className="er-btn er-btn-light er-btn-sm" style={{ marginLeft: "auto" }} onClick={() => markDone(r.id)}><Check size={13} /> Mark done</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
const STAT_METRICS = [
  ["pageviews", "Page views", "#0F6B4F"],
  ["newCreators", "Creators", "#3E51A8"],
  ["newBrands", "Brands", "#D99A00"],
  ["newLinks", "Backings", "#7A3E6B"],
  ["clicks", "Clicks", "#2D6E8E"],
  ["sales", "Sales", "#B5572E"],
];
function StatItemRow({ it }) {
  const [open, setOpen] = useState(false); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [err, setErr] = useState("");
  const send = async () => {
    if (!msg.trim()) return; setBusy(true); setErr("");
    try { await api("/admin/sms", { method: "POST", admin: true, body: { phone: it.phone, message: msg.trim() } }); setDone(true); setMsg(""); setTimeout(() => { setDone(false); setOpen(false); }, 1400); }
    catch (e) { setErr(e.message || "Couldn't send."); } finally { setBusy(false); }
  };
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, flexShrink: 0 }}>{it.label}</span>
        {it.sub && <span style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.sub}</span>}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {it.at && <span style={{ fontSize: 11.5, color: C.muted }}>{new Date(it.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
          {it.phone && <button className="er-btn er-btn-light er-btn-sm" onClick={() => setOpen((o) => !o)}><Send size={12} /> SMS</button>}
        </span>
      </div>
      {open && it.phone && <div style={{ marginTop: 10 }}>
        <SmsTemplates msg={msg} setMsg={setMsg} />
        <textarea className="er-input" style={{ minHeight: 70 }} placeholder={`Custom SMS to ${it.phone}`} value={msg} onChange={(e) => setMsg(e.target.value)} />
        {err && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#C0392B" }}>{err}</p>}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="er-btn er-btn-primary er-btn-sm" disabled={busy || !msg.trim()} onClick={send}>{busy ? "Sending…" : done ? "Sent ✓" : "Send SMS"}</button>
          <button className="er-btn er-btn-ghost er-btn-sm" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </div>}
    </div>
  );
}
function AdminStats() {
  const [s, setS] = useState(null); const [err, setErr] = useState(""); const [metric, setMetric] = useState("pageviews");
  const [days, setDays] = useState(30);
  const [sel, setSel] = useState(null); const [detail, setDetail] = useState(null); const [detailBusy, setDetailBusy] = useState(false);
  useEffect(() => { setS(null); api(`/admin/stats?days=${days}`, { admin: true }).then(setS).catch((e) => setErr(e.message)); }, [days]);
  const fmtDay = (d) => { if (!d) return ""; const [y, m, dd] = d.split("-"); return new Date(Date.UTC(+y, +m - 1, +dd)).toLocaleDateString(undefined, { month: "short", day: "numeric" }); };
  const mLabel = Object.fromEntries(STAT_METRICS.map(([k, l]) => [k, l]));
  const mColor = Object.fromEntries(STAT_METRICS.map(([k, , c]) => [k, c]));
  const openDay = async (day) => {
    setSel({ day, metric }); setDetail(null); setDetailBusy(true);
    try { setDetail(await api(`/admin/stats/items?metric=${metric}&day=${day}`, { admin: true })); } catch (e) { setDetail({ count: 0, items: [], error: e.message }); } finally { setDetailBusy(false); }
  };
  const pickMetric = (k) => { setMetric(k); setSel(null); setDetail(null); };
  if (err) return null;
  if (!s) return <p style={{ color: C.muted, margin: "20px 0" }}>Loading stats…</p>;
  const daily = s.daily || []; const n = daily.length;
  const vals = daily.map((d) => d[metric] || 0); const max = Math.max(1, ...vals);
  const W = 720, H = 180, padB = 22, padT = 8, bw = W / Math.max(n, 1);
  const col = mColor[metric] || C.accent;
  const money = (v) => "$" + Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const tiles = [["Creators", s.totals.creators, null], ["Brands", s.totals.brands, `${s.totals.approvedBrands} live`], ["Page views", s.totals.pageviews, `${s.totals.pageviewsToday} today`]];
  const w = s.window || {};
  const windowStats = [
    ["Page views", Number(w.pageviews || 0).toLocaleString()], ["Signups", Number(w.newCreators || 0).toLocaleString()],
    ["Brands", Number(w.newBrands || 0).toLocaleString()], ["Backings", Number(w.newLinks || 0).toLocaleString()],
    ["Clicks", Number(w.clicks || 0).toLocaleString()], ["Sales", Number(w.sales || 0).toLocaleString()],
    ["Sales $", money(w.salesValue)], ["Commission", money(w.commission)],
  ];
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {tiles.map(([label, val, sub]) => (
          <div key={label} className="er-card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.muted }}>{label}</div>
            <div className="er-serif" style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>{Number(val || 0).toLocaleString()}</div>
            {sub && <div style={{ fontSize: 12, color: C.accentD, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
          </div>
        ))}
      </div>
      <div className="er-card" style={{ padding: "18px 18px 12px", marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Last {days} days <span style={{ fontWeight: 500, color: C.muted }}>· tap a bar for that day</span></div>
          <div style={{ display: "flex", gap: 6 }}>
            {[7, 30, 90].map((d) => <button key={d} className="er-btn er-btn-sm" onClick={() => { setDays(d); setSel(null); setDetail(null); }} style={{ border: "none", background: days === d ? C.accent : C.panel, color: days === d ? "#fff" : C.inkSoft }}>{d}d</button>)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {STAT_METRICS.map(([k, l, c]) => <button key={k} className="er-btn er-btn-sm" onClick={() => pickMetric(k)} style={{ border: metric === k ? `1px solid ${c}` : `1px solid ${C.line}`, background: metric === k ? c : "#fff", color: metric === k ? "#fff" : C.inkSoft }}>{l}</button>)}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }} preserveAspectRatio="xMidYMid meet">
          <line x1="0" y1={H - padB} x2={W} y2={H - padB} stroke={C.line} strokeWidth="1" />
          {daily.map((d, i) => { const v = d[metric] || 0; const h = (H - padB - padT) * (v / max); const x = i * bw + (bw > 10 ? 3 : 1); const y = H - padB - h; const isSel = sel && sel.day === d.day && sel.metric === metric;
            return <g key={d.day} onClick={() => openDay(d.day)} style={{ cursor: "pointer" }}>
              <rect x={i * bw} y={padT} width={bw} height={H - padB - padT} fill="transparent" />
              <rect x={x} y={y} width={Math.max(bw - (bw > 10 ? 6 : 2), 1)} height={Math.max(h, v > 0 ? 2 : 0)} rx="2" fill={isSel ? C.ink : col} opacity={isSel ? 1 : (i === n - 1 ? 1 : 0.8)}><title>{`${fmtDay(d.day)}: ${v}`}</title></rect>
            </g>; })}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: C.muted, marginTop: 4 }}>
          <span>{fmtDay(daily[0] && daily[0].day)}</span>
          <span>peak {metric === "sales" || metric === "pageviews" ? max : max}</span>
          <span>{fmtDay(daily[n - 1] && daily[n - 1].day)}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 16, borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
          {windowStats.map(([l, v]) => (
            <div key={l}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: C.muted }}>{l}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, marginTop: 1 }}>{v}</div>
            </div>
          ))}
        </div>

        {sel && <div style={{ marginTop: 16, borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{fmtDay(sel.day)} · {mLabel[metric]}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: col, borderRadius: 999, padding: "2px 10px" }}>{detailBusy ? "…" : (detail ? detail.count : 0)}</span>
            <button className="er-link" style={{ marginLeft: "auto", color: C.muted }} onClick={() => { setSel(null); setDetail(null); }}>Close</button>
          </div>
          {detailBusy && <p style={{ color: C.muted, fontSize: 13, margin: "10px 0 0" }}>Loading…</p>}
          {!detailBusy && detail && metric === "pageviews" && <p style={{ color: C.muted, fontSize: 13, margin: "10px 0 0" }}>{detail.count} page view{detail.count === 1 ? "" : "s"} this day. Page views are anonymous, so there's no list to show.</p>}
          {!detailBusy && detail && metric !== "pageviews" && (detail.items && detail.items.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10, maxHeight: 420, overflowY: "auto" }}>
              {detail.items.map((it, i) => <StatItemRow key={i} it={it} />)}
            </div>
          ) : <p style={{ color: C.muted, fontSize: 13, margin: "10px 0 0" }}>Nothing on this day.</p>)}
        </div>}
      </div>
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
  const stripePaid = (rows || []).filter((b) => b.paid && typeof b.chargeId === "string" && b.chargeId.startsWith("ch_"));
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
      <AdminStats />
      <AdminSeedPopular />
      <AdminSeedProducts />
      <AdminOffers />
      <AdminSetupRequests />
      <FeatureSwitches />
      <BulkSms businesses={rows || []} />
      {err && <p style={{ marginTop: 14, background: "#FBE9E7", border: "1px solid #F3C5BD", borderRadius: 12, padding: "12px 14px", fontSize: 13.5, color: "#9B3024" }}>Couldn't reach the backend ({err}). API base: {API_BASE}</p>}
      {rows === null && !err && <p style={{ color: C.muted, marginTop: 20 }}>Loading…</p>}
      {rows && <>
        <h2 style={{ margin: "32px 0 12px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft, display: "flex", alignItems: "center", gap: 8 }}>Paying customers {stripePaid.length > 0 && <span style={{ background: C.accent, color: "#fff", borderRadius: 999, fontSize: 11, padding: "1px 7px" }}>{stripePaid.length}</span>}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 4 }}>
          {stripePaid.length === 0 ? <p style={{ background: C.panel, borderRadius: 14, padding: "22px 0", textAlign: "center", fontSize: 14, color: C.muted, margin: 0 }}>No Stripe payments yet.</p> : stripePaid.map((b) => (
            <div key={b._id} className="er-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, boxShadow: `inset 3px 0 0 ${C.accent}` }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center", background: C.accentSoft, color: C.accentD, flexShrink: 0 }}><Store size={18} /></span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{b.name || "Untitled"}{b.premium ? " " : ""}{b.premium && <Seal size={14} />}</p>
                {b.website && <a href={/^https?:\/\//i.test(b.website) ? b.website : `https://${b.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: C.accentD, fontWeight: 600, textDecoration: "none", wordBreak: "break-all" }}>{b.website}</a>}
                <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{(b.plan || "plan")}{b.paidAt ? ` · ${new Date(b.paidAt).toLocaleDateString()}` : ""} · {b.chargeId}</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: C.accentSoft, color: C.accentD }}>Paid</span>
            </div>
          ))}
        </div>
        <h2 style={{ margin: "32px 0 12px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft, display: "flex", alignItems: "center", gap: 8 }}>Pending {pending.length > 0 && <span style={{ background: "#D97706", color: "#fff", borderRadius: 999, fontSize: 11, padding: "1px 7px" }}>{pending.length}</span>}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pending.length === 0 ? <p style={{ background: C.panel, borderRadius: 14, padding: "28px 0", textAlign: "center", fontSize: 14, color: C.muted, margin: 0 }}>Nothing waiting, you're all caught up.</p> : pending.map((b) => <AdminRow key={b._id} b={b} reload={reload} />)}
        </div>
        <h2 style={{ margin: "32px 0 12px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>Live ({approved.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{approved.map((b) => <AdminRow key={b._id} b={b} reload={reload} />)}</div>

        <h2 style={{ margin: "36px 0 6px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>Paid access ({(rows || []).filter((b) => b.paid).length} active)</h2>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: C.muted }}>Turn paid access on or off for any business. Paid unlocks the influencer requests tab.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(rows || []).length === 0 ? <p style={{ background: C.panel, borderRadius: 14, padding: "24px 0", textAlign: "center", fontSize: 14, color: C.muted, margin: 0 }}>No businesses yet.</p> : (rows || []).map((b) => <PaidRow key={b._id} b={b} reload={reload} />)}
        </div>

        <h2 style={{ margin: "36px 0 6px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>Creators ({infs.length})</h2>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: C.muted }}>Verify a creator to make them hireable by paid businesses in the Hire tab.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {infs.length === 0 ? <p style={{ background: C.panel, borderRadius: 14, padding: "24px 0", textAlign: "center", fontSize: 14, color: C.muted, margin: 0 }}>No creators yet.</p> : infs.map((i) => (
            <div key={i.id} className="er-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
              <Avatar name={i.username} image={i.image} size={40} />
              <div style={{ minWidth: 0, flex: 1 }}><p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>@{i.username}</p><p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>{i.followers > 0 ? `${i.followersLabel} followers · ` : ""}{i.count} recommendation{i.count !== 1 ? "s" : ""}</p></div>
              <VerifyToggle i={i} reload={reload} />
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
  const [image, setImage] = useState(current.image || ""); const [bio, setBio] = useState(current.bio || "");
  const [channels, setChannels] = useState((current.channels && current.channels.length ? current.channels : [{ platform: current.platform || "Instagram", handle: current.social || "", followers: current.followers || "" }]).map((c) => ({ platform: c.platform || "Instagram", handle: c.handle || "", followers: c.followers || "" })));
  const [rates, setRates] = useState({ post: (current.rates && current.rates.post) || "", story: (current.rates && current.rates.story) || "", reel: (current.rates && current.rates.reel) || "" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const onPhoto = async (e) => { const file = e.target.files && e.target.files[0]; if (!file) return; try { setImage(await fileToDataURL(file, 400, 0.85)); } catch (x) {} };
  const save = async () => { setBusy(true); setErr(""); try { await api("/creator/me", { method: "PATCH", body: { token, image, bio, channels: channels.filter((c) => String(c.handle).trim()), rates } }); onSaved(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "30px 28px", maxHeight: "82vh", overflowY: "auto" }}>
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
        <Field label="Your platforms" hint="Add each platform with its own follower count."><ChannelsEditor channels={channels} setChannels={setChannels} /></Field>
        <div style={{ height: 14 }} />
        <Field label="Your rates" hint="What you charge per piece of sponsored content."><RatesEditor rates={rates} setRates={setRates} /></Field>
        <ErrBox msg={err} />
        <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="er-btn er-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="er-btn er-btn-primary" disabled={busy} onClick={save}><Check size={16} /> {busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </Modal>
  );
}
/* Load an image for canvas drawing. Only data: URLs and our own photo URLs (which send CORS headers)
   are used, so the canvas can still be exported. Resolves null on failure/timeout. */
function loadStoryImage(src, ms = 5000) {
  if (!src || !(/^data:image\//.test(src) || src.startsWith(API_BASE))) return Promise.resolve(null);
  return new Promise((res) => { const im = new Image(); const t = setTimeout(() => res(null), ms); im.crossOrigin = "anonymous"; im.onload = () => { clearTimeout(t); res(im); }; im.onerror = () => { clearTimeout(t); res(null); }; im.src = src; });
}
// "15–30% off" style line for a list: a partner range if any brand has one, else the best % on offer.
function listOfferText(recs) {
  const ranged = recs.map((b) => b.discountText).find(Boolean); if (ranged) return ranged;
  const max = Math.max(0, ...recs.map((b) => Number(b.discount) || 0)); return max > 0 ? `up to ${max}% off` : "";
}
async function drawListStory(username, recs) {
  const W = 1080, H = 1920, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d"); const sans = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#FF5A5F"); bg.addColorStop(0.55, "#FF385C"); bg.addColorStop(1, "#FC642D"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const glow = (x, y, r, col) => { const rg = g.createRadialGradient(x, y, 30, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = rg; g.fillRect(0, 0, W, H); };
  glow(W * 0.9, H * 0.05, 700, "rgba(255,210,130,0.45)"); glow(W * 0.05, H * 0.95, 760, "rgba(214,41,118,0.40)");
  const round = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const fit = (text, weight, size, maxW, min = 26) => { let fs = size; g.font = `${weight} ${fs}px ${sans}`; while (fs > min && g.measureText(text).width > maxW) { fs -= 2; g.font = `${weight} ${fs}px ${sans}`; } return fs; };
  g.textAlign = "center"; g.textBaseline = "alphabetic";
  // header
  const handle = "@" + username; g.font = `700 34px ${sans}`; const hw = g.measureText(handle).width + 56;
  round((W - hw) / 2, 150, hw, 64, 32); g.fillStyle = "rgba(255,255,255,0.22)"; g.fill(); g.fillStyle = "#fff"; g.fillText(handle, W / 2, 194);
  g.fillStyle = "#fff"; g.shadowColor = "rgba(0,0,0,.15)"; g.shadowBlur = 24;
  g.font = `900 92px ${sans}`; g.fillText("Brands I like", W / 2, 340);
  g.font = `800 64px ${sans}`; g.fillText("and would recommend :)", W / 2, 425); g.shadowBlur = 0;
  // brand tiles with real photos
  const items = recs.slice(0, 6), n = items.length;
  const imgs = await Promise.all(items.map((b) => loadStoryImage((b.photos || [])[0])));
  const M = 80, G = 28, top = 500, areaH = 860;
  const cols = n <= 1 ? 1 : n <= 4 ? 2 : 3, rows = Math.max(1, Math.ceil(n / cols));
  let tw = (W - 2 * M - (cols - 1) * G) / cols; let th = Math.min(tw * (cols === 3 ? 1.2 : 1), (areaH - (rows - 1) * G) / rows);
  if (cols === 1) { tw = Math.min(tw, 680); th = Math.min(th, 680); }
  const gridW = cols * tw + (cols - 1) * G, x0 = (W - gridW) / 2, gridH = rows * th + (rows - 1) * G, y0 = top + (areaH - gridH) / 2;
  items.forEach((b, i) => {
    const r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, n - r * cols);
    const rowX = x0 + ((cols - inRow) * (tw + G)) / 2, x = rowX + c * (tw + G), y = y0 + r * (th + G);
    g.save(); round(x, y, tw, th, 34); g.clip();
    const img = imgs[i], name = String(b.name || "").trim();
    if (img) { const sc = Math.max(tw / img.width, th / img.height); g.drawImage(img, x + (tw - img.width * sc) / 2, y + (th - img.height * sc) / 2, img.width * sc, img.height * sc); }
    else { const { pal } = artFor(name); const gg = g.createLinearGradient(x, y, x + tw, y + th); gg.addColorStop(0, pal[0]); gg.addColorStop(1, pal[1]); g.fillStyle = gg; g.fillRect(x, y, tw, th); g.beginPath(); g.arc(x + tw * 0.9, y + th * 0.1, tw * 0.45, 0, Math.PI * 2); g.fillStyle = "rgba(255,255,255,.18)"; g.fill(); }
    const sh = g.createLinearGradient(0, y + th * 0.45, 0, y + th); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,0.62)"); g.fillStyle = sh; g.fillRect(x, y, tw, th);
    g.fillStyle = "#fff"; const fs = fit(name, 800, cols === 3 ? 38 : 50, tw - 30, 22); g.fillText(name, x + tw / 2, y + th - (cols === 3 ? 26 : 36));
    const off = offText(b);
    if (off) { const t = off.toUpperCase(); g.font = `800 ${cols === 3 ? 22 : 28}px ${sans}`; const pw = g.measureText(t).width + 30, ph = cols === 3 ? 40 : 48; round(x + 16, y + 16, pw, ph, ph / 2); g.fillStyle = "#fff"; g.fill(); g.fillStyle = "#FF385C"; g.textAlign = "left"; g.fillText(t, x + 31, y + 16 + ph * 0.7); g.textAlign = "center"; }
    g.restore(); void fs;
  });
  let y = top + areaH + 40;
  if (recs.length > n) { g.fillStyle = "rgba(255,255,255,0.92)"; g.font = `700 34px ${sans}`; g.fillText(`+ ${recs.length - n} more on my page`, W / 2, y); y += 30; }
  // discount banner
  const offer = listOfferText(recs);
  if (offer) {
    const bw = W - 2 * M, by = Math.max(y + 10, 1470); round(M, by, bw, 150, 40); g.fillStyle = "#fff"; g.fill();
    g.fillStyle = "#1C1A17"; fit("Also get", 700, 34, bw - 60); g.fillText("Also get", W / 2, by + 56);
    g.fillStyle = "#FF385C"; fit(`${offer} when you purchase`, 900, 50, bw - 60); g.fillText(`${offer} when you purchase`, W / 2, by + 118);
  }
  // CTA + footer
  const pw = 600, ph = 104, px = (W - pw) / 2, py = H - 250; round(px, py, pw, ph, 52); g.fillStyle = "rgba(17,17,17,0.88)"; g.fill();
  g.fillStyle = "#fff"; g.font = `800 42px ${sans}`; g.fillText("Tap the link to shop →", W / 2, py + 67);
  g.fillStyle = "rgba(255,255,255,0.9)"; g.font = `600 36px ${sans}`; g.fillText("easyrecommend.co/@" + username, W / 2, H - 92);
  return cv;
}
/* Story image of a creator's list, shared to Instagram. Copies the profile link first so it can be
   pasted straight into a link sticker. Returns "shared" | "saved". */
async function shareListToStory(username, bio, recs, link) {
  const profileUrl = link || `${window.location.origin}/@${username}`;
  try { await navigator.clipboard.writeText(profileUrl); } catch (e) {}
  const cv = await drawListStory(username, recs || []);
  const blob = await new Promise((res) => cv.toBlob(res, "image/png"));
  if (!blob) throw new Error("render failed");
  const file = new File([blob], username + "-recommendations.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: "@" + username + " on Easy Recommend", text: "My recommendations → " + profileUrl });
    return "shared";
  }
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  return "saved";
}
function InfluencerProfile({ handle, session, dataVersion, onBack, onBrowse, onOpenBusiness, onAddBrand, onRefresh, onCreator, onList, onAuth }) {
  const [data, setData] = useState(null); const [err, setErr] = useState(""); const [editing, setEditing] = useState(false); const [copied, setCopied] = useState(false); const [photoBusy, setPhotoBusy] = useState(false);
  const [linkBiz, setLinkBiz] = useState(null); const [shareBiz, setShareBiz] = useState(null); const [joinBiz, setJoinBiz] = useState(null);
  const shareBrand = (b) => { if (session && session.role === "creator") setShareBiz(b); else setJoinBiz(b); };
  const isOwner = session && session.role === "creator" && session.username === handle;
  const profileUrl = `${window.location.origin}/@${handle}`;
  const copyLink = async () => { const ok = await copyText(profileUrl); if (ok) toast("✓ Link copied"); setCopied(ok); setTimeout(() => setCopied(false), 1600); };
  const shareStory = () => { if (data) startIgShare(profileUrl, () => shareListToStory(data.username, data.bio, recs)); };
  const load = () => api(`/creator/${handle}${session && session.role === "creator" && session.username === handle ? `?token=${encodeURIComponent(session.token)}` : ""}`).then(setData).catch((e) => setErr(e.message));
  const onProfilePhoto = async (e) => { const file = e.target.files && e.target.files[0]; e.target.value = ""; if (!file) return; setPhotoBusy(true); try { const img = await fileToDataURL(file, 400, 0.85); await api("/creator/me", { method: "PATCH", body: { token: session.token, image: img } }); await load(); } catch (x) { alert(x.message || "Couldn't update photo"); } finally { setPhotoBusy(false); } };
  useEffect(() => { setData(null); setErr(""); load(); }, [handle, dataVersion]);
  const removeBrand = async (businessId) => { try { await api("/creator/link", { method: "DELETE", body: { token: session.token, businessId } }); await load(); onRefresh(); } catch (e) { alert(e.message); } };

  if (err) return <div style={{ maxWidth: 560, margin: "0 auto", padding: "80px 22px", textAlign: "center" }}><p style={{ color: C.muted }}>Couldn't load @{handle}: {err}</p><button className="er-btn er-btn-primary" style={{ marginTop: 16 }} onClick={onBack}>Back home</button></div>;
  if (!data) return <div style={{ maxWidth: 560, margin: "0 auto", padding: "80px 22px", textAlign: "center", color: C.muted }}>Loading…</div>;
  const recs = data.recommendations || [];
  return (
    <div>
      {linkBiz && <LinkPopup business={linkBiz} onClose={() => setLinkBiz(null)} />}
      {shareBiz && <LinkPopup business={shareBiz} onClose={() => setShareBiz(null)} />}
      {joinBiz && <QuickJoin brand={joinBiz} onClose={() => setJoinBiz(null)} onDone={(sess) => { const b = joinBiz; setJoinBiz(null); onAuth(sess); setShareBiz(b); }} />}
      {editing && <EditProfileModal token={session.token} current={data} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />}
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 22px 36px" }}>
          <button className="er-link" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><ChevL size={15} /> Easy Recommend</button>
          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            {isOwner
              ? <label style={{ position: "relative", cursor: "pointer", flexShrink: 0, display: "inline-block" }} title="Change photo">
                  <Avatar name={data.username} image={data.image} size={76} />
                  <span style={{ position: "absolute", inset: 0, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(0,0,0,.42)", color: "#fff", opacity: photoBusy ? 1 : 0, transition: "opacity .15s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = photoBusy ? 1 : 0}>{photoBusy ? "…" : <Edit size={18} />}</span>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={onProfilePhoto} />
                </label>
              : <Avatar name={data.username} image={data.image} size={76} />}
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><h1 className="er-serif" style={{ margin: 0, fontSize: 30, fontWeight: 500, overflowWrap: "anywhere" }}>@{data.username}</h1><Seal size={20} /></div>
              <p style={{ margin: "2px 0 0", fontSize: 14.5, color: C.muted }}>{data.bio || "Curating businesses worth trusting."}</p>
              <p style={{ margin: "8px 0 0", fontSize: 12.5, fontWeight: 600, color: C.inkSoft }}>{isOwner && data.followers > 0 ? `${data.followersLabel} followers · ` : ""}{recs.length} recommendation{recs.length !== 1 ? "s" : ""}</p>
              <div style={{ marginTop: 12 }}>
                <button className="er-btn er-btn-sm" onClick={shareStory} style={{ border: "none", color: "#fff", background: "linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)", boxShadow: "0 2px 10px rgba(214,41,118,.3)" }}>
                  <IgIcon size={14} /> Share on Instagram story
                </button>
              </div>
              {(data.channels && data.channels.length > 0)
                ? <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {data.channels.map((c, i) => { const u = socialUrl(c.platform, c.handle);
                      const inner = <><b style={{ color: C.ink }}>{c.platform}</b> @{c.handle}{c.followersLabel ? ` · ${c.followersLabel}` : ""}</>;
                      return u ? <a key={i} href={u} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: C.inkSoft, border: `1px solid ${C.line}`, background: "#fff", borderRadius: 999, padding: "4px 11px" }}>{inner}</a>
                                 : <span key={i} style={{ fontSize: 12.5, fontWeight: 600, color: C.inkSoft, border: `1px solid ${C.line}`, background: "#fff", borderRadius: 999, padding: "4px 11px" }}>{inner}</span>; })}
                  </div>
                : data.social && (() => { const u = socialUrl(data.platform, data.social); const label = `${data.platform || "Social"} · @${String(data.social).replace(/^@/, "")}`;
                    return u ? <a href={u} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, textDecoration: "none", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: C.accentD }}>{label} <Arrow size={12} /></a>
                            : <p style={{ margin: "6px 0 0", fontSize: 12.5, fontWeight: 600, color: C.inkSoft }}>{label}</p>; })()}
              {data.rates && (data.rates.post > 0 || data.rates.story > 0 || data.rates.reel > 0) && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {[["post", "Post"], ["story", "Story"], ["reel", "Reel"]].filter(([k]) => data.rates[k] > 0).map(([k, l]) => (
                  <span key={k} style={{ fontSize: 12, fontWeight: 700, color: C.accentD, background: C.accentSoft, borderRadius: 999, padding: "4px 11px" }}>{l} ${data.rates[k]}</span>
                ))}
              </div>}
            </div>
            <div className="er-prof-actions" style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
              <button className="er-btn er-btn-light er-btn-sm" onClick={copyLink} style={{ color: copied ? C.accent : C.ink }}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}</button>
              <a href="https://www.instagram.com/nycdesihangouts/" target="_blank" rel="noopener noreferrer" className="er-link" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: C.muted, textDecoration: "none", textAlign: "right", lineHeight: 1.3 }}><IgIcon size={12} /> See how creators add this to Linktree or bio</a>
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
        {recs.length === 0 ? <p style={{ background: C.panel, borderRadius: 14, padding: "40px 0", textAlign: "center", fontSize: 14, color: C.muted }}>No recommendations yet.{isOwner ? " Add a brand to get started." : ""}</p> : (() => {
          const groups = {}; recs.forEach((b) => { const k = (b.categories && b.categories[0]) || "Other"; (groups[k] = groups[k] || []).push(b); });
          const renderCard = (b) => { const site = (b.website || "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
              const pill = { display: "inline-flex", alignItems: "center", gap: 5, height: 30, padding: "0 11px", borderRadius: 999, border: "none", background: "rgba(255,255,255,.94)", color: C.ink, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.15)" };
              return <div key={b.id} className="er-card" style={{ overflow: "hidden", padding: 0, display: "flex", flexDirection: "column" }}>
                <div style={{ position: "relative" }}>
                  <BrandArt b={b} style={{ width: "100%", aspectRatio: "16/9" }} />
                  {offText(b) && <span style={{ position: "absolute", left: 12, bottom: 12, fontSize: 12, fontWeight: 800, color: C.ink, background: "#fff", borderRadius: 999, padding: "5px 11px", boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}>{offText(b)} for you</span>}
                  {isOwner && <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
                    <button type="button" style={pill} aria-label={`Remove ${b.name}`} onClick={() => removeBrand(b.id)}><Close size={13} /></button>
                  </div>}
                </div>
                <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  <div>
                    <h3 className="er-serif" style={{ margin: 0, fontSize: 20, fontWeight: 500, lineHeight: 1.2 }}>{b.name}</h3>
                    <div style={{ marginTop: 2, fontSize: 12.5, color: C.muted }}>{(b.categories || []).join(" · ")}</div>
                  </div>
                  {b.review && <div>
                    <Stars value={b.review.stars} />
                    {b.review.text && <p className="er-serif" style={{ margin: "6px 0 0", fontSize: 15.5, lineHeight: 1.45, color: C.inkSoft }}>&ldquo;{b.review.text}&rdquo;</p>}
                  </div>}
                  {b.discountCode && <div style={{ fontSize: 12.5, color: C.inkSoft }}>Code: <b style={{ fontFamily: "ui-monospace, Menlo, monospace", color: C.accentD }}>{b.discountCode}</b></div>}
                  {isOwner && earnInfo(b) && <div style={{ background: C.accentSoft, borderRadius: 10, padding: "7px 10px" }}><div style={{ fontSize: 13.5, fontWeight: 800, color: C.accentD }}>{earnInfo(b).line}</div>{earnInfo(b).sub && <div style={{ fontSize: 12, color: C.accentD }}>{earnInfo(b).sub}</div>}</div>}
                  {isOwner && <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
                    {b.website && <button className="er-btn er-btn-light er-btn-sm" style={{ flex: 1, minWidth: 0 }} onClick={() => window.open(/^https?:\/\//i.test(b.website) ? b.website : `https://${b.website}`, "_blank", "noopener")}><Globe size={14} /> {site || "Visit site"}</button>}
                    <button className="er-btn er-btn-sm" onClick={() => setLinkBiz(b)} style={{ flex: b.website ? "0 0 auto" : 1, border: "none", color: "#fff", background: "linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)" }}><IgIcon size={14} /> Share</button>
                  </div>}
                  {!isOwner && <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
                    {b.website
                      ? <button className="er-btn er-btn-primary er-btn-sm" style={{ flex: 1, minWidth: 0 }} onClick={() => goToBrand(data.username, b.id, b.website)}>Shop {site || b.name} <Arrow size={14} /></button>
                      : <button className="er-btn er-btn-light er-btn-sm" style={{ flex: 1, minWidth: 0 }} onClick={() => { trackClick(data.username, b.id); onOpenBusiness(b.id); }}>View {b.name} <Arrow size={14} /></button>}
                    <button className="er-btn er-btn-sm" title="Share on Instagram story & earn" onClick={() => shareBrand(b)} style={{ flexShrink: 0, border: "none", color: "#fff", background: "linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)" }}><IgIcon size={14} /> Share</button>
                  </div>}
                </div>
              </div>; };
          const order = Object.keys(groups);
          return <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {order.map((cat) => { const x = CATS[cat] || CATS.Beauty; return (
              <div key={cat}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 11, height: 11, borderRadius: "50%", background: x.color, flexShrink: 0 }} />
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: C.ink }}>{cat}</h3>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{groups[cat].length}</span>
                  <span style={{ flex: 1, height: 1, background: C.line }} />
                </div>
                <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))" }}>{groups[cat].map(renderCard)}</div>
              </div>
            ); })}
          </div>;
        })()}
        <div style={{ marginTop: 28, background: C.ink, borderRadius: 18, padding: "26px 24px", textAlign: "center" }}>
          <p className="er-serif" style={{ margin: 0, color: C.paper, fontSize: 19, fontWeight: 500 }}>Earn by sharing your favorite brand recommendations</p>
          <button className="er-btn er-btn-sm" style={{ marginTop: 14, background: C.paper, color: C.ink }} onClick={onBrowse}>Browse all brands <Arrow size={15} /></button></div>
      </div>
      {<section style={{ background: C.panel, borderTop: `1px solid ${C.line}`, marginTop: 40 }}>
        <div className="er-wrap" style={{ padding: "44px 22px 50px", textAlign: "center" }}>
          <ExploreHowTo heading={`Like @${data.username}'s list? Here's how you can earn too`} onCreator={onCreator} />
        </div>
      </section>}
      <div style={{ marginTop: 48 }}>
        <LumaHero title={<>Create your<br />first list,<br /><span className="er-luma-grad">earn $25.</span></>} onCreator={onCreator} onList={onList} />
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
          {onLogin && <button className="er-btn er-btn-ghost er-btn-sm" style={{ whiteSpace: "nowrap" }} onClick={onLogin}>Log in</button>}
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
          <h1 className="er-serif" style={{ margin: "16px 0 0", fontSize: "clamp(34px,5.5vw,56px)", lineHeight: 1.05, fontWeight: 500, letterSpacing: "-.02em" }}>Get your product recommended by the right influencers.</h1>
          <p style={{ margin: "20px 0 0", fontSize: 17, lineHeight: 1.55, color: C.inkSoft, maxWidth: 560 }}>List your brand, product, or app and let vetted creators recommend it to their audience. You set the commission and only pay when a referral converts, no retainers, no upfront ad spend.</p>
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
              <HowStep n={3} title="They create content" body="Influencers promote your product to their audience, testimonials, posts, and sponsored content." />
              <HowStep n={4} title="You pay on results" body="Commission is paid only on tracked sales. Every click and conversion is attributed to the creator who drove it." />
            </div>
          </div>
        </div>
      </section>
      <section className="er-wrap" style={{ padding: "10px 22px 64px", textAlign: "center" }}>
        <button className="er-btn er-btn-primary" onClick={onList}>List your business <Arrow size={16} /></button>
      </section>
      <PlatformSteps />
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
              <HowStep n={1} title="Sign up free" body="Create your creator profile in under a minute, username, photo, and your follower count." />
              <HowStep n={2} title="Build your recommendation list" body="Pick the brands and products you genuinely back. Each one gets its own tracked referral link." />
              <HowStep n={3} title="Share it in your bio" body="One link to everything you recommend. Your audience taps through and shops." />
              <HowStep n={4} title="Get paid commission" body="Earn on every sale that comes through your links, automatically tracked and attributed to you." />
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
function BioMock() {
  const IG = "https://www.instagram.com/nycdesihangouts/";
  const ring = "linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)";
  const tiles = ["#E8D9C7", "#C9D6C3", "#D9C6D6", "#C7D3E0", "#E5CFC0", "#D3D9C4"];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ width: 340, maxWidth: "100%", border: `1px solid ${C.line}`, borderRadius: 28, overflow: "hidden", background: "#fff", boxShadow: "0 24px 60px -30px rgba(0,0,0,.35)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#000", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 14px 8px", fontWeight: 700, fontSize: 15 }}>nycdesihangouts <IgIcon size={14} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "6px 16px" }}>
          <span style={{ width: 78, height: 78, borderRadius: "50%", background: ring, padding: 3, flexShrink: 0 }}><span style={{ display: "block", width: "100%", height: "100%", borderRadius: "50%", border: "3px solid #fff", background: "linear-gradient(135deg,#C9847A,#7E9C74)" }} /></span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>NYC Desi Hangouts</div>
            <div style={{ fontSize: 12.5, color: "#737373" }}>Community</div>
          </div>
        </div>
        <div style={{ padding: "8px 16px 0", fontSize: 13.5, lineHeight: 1.45 }}>
          NYC food, events &amp; culture 🗽<br />Brands we actually use 👇
          <div style={{ marginTop: 8, background: C.accentSoft, border: `1.5px solid ${C.accent}`, borderRadius: 10, padding: "6px 9px 7px" }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: C.accentD }}>Link in bio</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}><span style={{ fontSize: 12 }}>🔗</span><span style={{ fontWeight: 700, fontSize: 12, color: "#00376B", wordBreak: "break-all" }}>easyrecommend.co/@nycdesihangouts</span></div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, padding: "12px 16px" }}>
          {["Follow", "Message"].map((t, i) => <span key={t} style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 600, padding: "7px 0", borderRadius: 8, background: i ? "#EFEFEF" : "#0095F6", color: i ? "#000" : "#fff" }}>{t}</span>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, borderTop: "1px solid #EFEFEF", paddingTop: 2 }}>
          {tiles.map((c, i) => <span key={i} style={{ aspectRatio: "1/1", background: c }} />)}
        </div>
      </div>
      <a className="er-btn er-btn-light er-btn-sm" href={IG} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}><IgIcon size={14} /> See this creator on Instagram</a>
    </div>
  );
}

function BigPayouts({ onCreator }) {
  const rows = [
    { brand: "Apple", cat: "Tech", note: "MacBook referral", payout: demoMoney(480), bar: 96 },
    { brand: "Peloton", cat: "Fitness", note: "Bike + membership", payout: demoMoney(360), bar: 74 },
    { brand: "SoFi", cat: "Finance", note: "New account", payout: demoMoney(290), bar: 60 },
    { brand: "AG1", cat: "Wellness", note: "Subscription", payout: demoMoney(220), bar: 44 },
  ];
  return (
    <section style={{ background: C.ink, color: C.paper }}>
      <div className="er-wrap" style={{ padding: "64px 22px" }}>
        <div className="er-how2" style={{ alignItems: "center" }}>
          <div>
            <span className="er-eyebrow" style={{ color: C.accent }}>The big-brand upside</span>
            <h2 className="er-serif" style={{ margin: "10px 0 12px", fontSize: "clamp(26px,4vw,42px)", fontWeight: 500, letterSpacing: "-.01em" }}>Recommend the brands you already love, earn real payouts.</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: "rgba(253,252,250,.8)", maxWidth: 460 }}>Big-ticket products pay big commissions, often more than $200 on a single sale. One recommendation of a laptop, a bike, or a finance app can be worth more than a hundred small clicks. Stack a few on your list and it adds up fast.</p>
            <button className="er-btn er-btn-primary" style={{ marginTop: 26 }} onClick={onCreator}>Start earning free <Arrow size={16} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rows.map((r, i) => (
              <div key={i} style={{ background: "rgba(253,252,250,.06)", border: "1px solid rgba(253,252,250,.12)", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 15.5 }}>{r.brand}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(253,252,250,.6)" }}>{r.cat} · {r.note}</span>
                  <span style={{ marginLeft: "auto", fontSize: 17, fontWeight: 700, color: C.accent }}>{r.payout}</span>
                </div>
                <div style={{ marginTop: 9, height: 7, borderRadius: 99, background: "rgba(253,252,250,.1)", overflow: "hidden" }}>
                  <div style={{ width: `${r.bar}%`, height: "100%", borderRadius: 99, background: C.accent }} />
                </div>
              </div>
            ))}
            <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "rgba(253,252,250,.45)", textAlign: "center" }}>Illustrative payouts. Actual commission is set by each brand and shown when you add them.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlatformSteps() {
  const steps = [
    ["Join the platform", "Anyone can sign up free and set up a profile in under a minute."],
    ["Build a recommendation list", "Add the apps and brands you genuinely use and love."],
    ["Share it with your people", "Put your list in your bio, or send it to friends and followers."],
    ["You earn on every sale", "When anyone in your audience taps a link and shops within 6 months, you earn a commission, tracked and paid automatically."],
  ];
  return (
    <section style={{ background: C.paper }}>
      <div className="er-wrap" style={{ padding: "64px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: 38 }}>
          <span className="er-eyebrow">How it works</span>
          <h2 className="er-serif" style={{ margin: "10px 0 0", fontSize: "clamp(26px,4vw,40px)", fontWeight: 500, letterSpacing: "-.01em" }}>From signup to shared in four steps</h2>
        </div>
        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))" }}>
          {steps.map(([t, d], i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: "22px 18px" }}>
              <span style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: C.ink, color: C.paper, fontWeight: 700, fontSize: 15 }}>{i + 1}</span>
              <h3 className="er-serif" style={{ margin: "14px 0 5px", fontSize: 18, fontWeight: 500, lineHeight: 1.2 }}>{t}</h3>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: C.inkSoft }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
/* Luma-inspired hero, shared by the homepage and creator profile pages. */
const LUMA_SUB = "From skincare to software, build a list of brands you love and earn on every sale from your link. Wanna earn more? Create content and earn commission on every sale.";
/* Every listed brand, searchable. Opened from the "1,000+ brands to choose from" pill. */
function AllBrandsModal({ onClose }) {
  const [list, setList] = useState(() => cachedBusinesses()); const [q, setQ] = useState(""); const [cat, setCat] = useState("__popular");
  useEffect(() => { fetchBusinesses("").then(setList).catch(() => setList((l) => l || [])); }, []);
  const all = list || [];
  const cats = [...new Set(all.flatMap((b) => b.categories || []))].sort();
  const t = q.trim().toLowerCase();
  const shown = all.filter((b) => (t || inSection(b, cat, all)) && (!t || [b.name, b.blurb, ...(b.categories || [])].join(" ").toLowerCase().includes(t)));
  const open = (id) => { onClose(); window.dispatchEvent(new CustomEvent("er:open-business", { detail: id })); };
  return (
    <Modal wide onClose={onClose}>
      <div style={{ padding: "26px 22px 22px", textAlign: "left", color: C.ink, fontFamily: "inherit" }}>
        <h2 className="er-serif" style={{ margin: 0, fontSize: 26, fontWeight: 500 }}>Brands to choose from</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13.5, color: C.muted }}>{list ? `${all.length} brands listed right now` : "Loading brands…"}</p>
        <input className="er-input" autoFocus placeholder={cat === "__products" ? "Search products or brands" : "Search brands or categories"} value={q} onChange={(e) => setQ(e.target.value)} style={{ marginTop: 14 }} />
        {(cats.length > 1 || all.some((x) => x.popular)) && <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "10px 0 2px" }}>
          {SECTION_CHIPS.filter((c) => !c || all.some((b) => inSection(b, c, []))).map((c) => <button key={c || "all"} type="button" onClick={() => setCat(c)} style={{ flexShrink: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 11px", borderRadius: 999, border: `1px solid ${cat === c ? C.ink : C.line}`, background: cat === c ? C.ink : "#fff", color: cat === c ? C.paper : C.inkSoft }}>{SECTION_LABEL[c]}</button>)}
        </div>}
        <div style={{ marginTop: 10, maxHeight: "55vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {list && shown.length === 0 && <p style={{ margin: "18px 0", textAlign: "center", fontSize: 14, color: C.muted }}>No brands match “{q}”.</p>}
          {shown.map((b) => { const cc = catOf(b); const ph = (b.photos || [])[0]; return (
            <button key={b.id} type="button" onClick={() => open(b.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: "9px 11px" }}>
              <span style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, overflow: "hidden", display: "grid", placeItems: "center", background: cc.bg, color: cc.color }}>{ph ? <img src={ph} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Store size={16} />}</span>
              <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span><span style={{ display: "block", fontSize: 12, color: C.muted }}>{(b.categories || []).join(" · ")}</span></span>
              {offText(b) && <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 700, color: C.accentD, background: C.accentSoft, borderRadius: 999, padding: "3px 9px" }}>{offText(b)}</span>}
            </button>); })}
        </div>
      </div>
    </Modal>
  );
}
function LumaHero({ title, onCreator, onList, sub = LUMA_SUB, pill = "1,000+ brands to choose from", cta, cta2, onShare, link }) {
  const c1 = cta || ["Create Your First List", onCreator];
  const c2 = cta2 || ["List Your Business", onList];
  const [allOpen, setAllOpen] = useState(false);
  return (<>
    {allOpen && <AllBrandsModal onClose={() => setAllOpen(false)} />}
    <section className="er-luma">
      {/* Tile slots measured from luma.com at 1440px wide: [x, y, w, h] of the image inside each frame. */}
      {LUMA_TILES.map(([x, y, w, h], i) => (
        <div key={i} className="er-luma-tile" aria-hidden="true" style={{ left: `${((x - 9) / 1440 * 100).toFixed(3)}%`, top: `calc(${y - 9} * var(--u))`, width: `calc(${w + 18} * var(--u))`, height: `calc(${h + 18} * var(--u))`, animationDelay: `${-(i * 0.9).toFixed(1)}s` }}>
          <img src={ER_VIDEOS[(i + 3) % ER_VIDEOS.length].poster} alt="" loading={i < 9 ? "eager" : "lazy"} />
        </div>
      ))}
      <div className="er-luma-fade" />
      <div className="er-luma-copy">
        <h1 className="er-luma-h1">{title}</h1>
        <p className="er-luma-sub">{sub}</p>
        {pill && <button type="button" className="er-luma-pill er-luma-pill-btn" onClick={() => setAllOpen(true)}>{pill} <Arrow size={13} /></button>}
        <div className="er-luma-actions">
          <button className="er-luma-cta" onClick={c1[1]}>{c1[0]}</button>
          {onShare
            ? <><span className="er-luma-or">or</span><button className="er-luma-cta2 er-luma-ig" onClick={onShare}><IgIcon size={17} /> Share &amp; earn</button></>
            : <button className="er-luma-cta2" onClick={c2[1]}>{c2[0]} <Arrow size={17} /></button>}
        </div>
        {link && <div><button type="button" className="er-luma-link" onClick={link[1]}>{link[0]} <Arrow size={14} /></button></div>}
      </div>
    </section>
  </>);
}
// Big brands listed on Easy Recommend that creators can recommend (shown as wordmarks).
const BIG_BRANDS = ["Nike", "Airbnb", "Spotify", "Sephora", "Lululemon", "Glossier", "Peloton", "Netflix", "Notion", "Canva"];
function BrandStrip({ label }) {
  return (
    <section style={{ background: "#fff" }}>
      <div className="er-wrap" style={{ padding: "6px 22px 40px", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>{label}</div>
        <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "14px 34px" }}>
          {BIG_BRANDS.map((b) => <span key={b} style={{ fontFamily: "'Inter',-apple-system,system-ui,sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: "-.02em", color: "#9A9AA0" }}>{b}</span>)}
        </div>
      </div>
    </section>
  );
}
function CreatorVideos({ eyebrow = "Watch it work", title = "See real creators in action", sub = "Short clips of creators showing off apps, tools, and products, and earning on every signup.", limit, bare, cta }) {
  const [more, setMore] = useState(false);
  const vids = limit && !more ? ER_VIDEOS.slice(0, limit) : ER_VIDEOS;
  const body = (
    <div className="er-wrap" style={{ padding: bare ? 0 : "10px 22px 56px", textAlign: "center" }}>
      {eyebrow && <span className="er-eyebrow">{eyebrow}</span>}
      <h2 className="er-serif" style={{ margin: eyebrow ? "10px 0 0" : 0, fontSize: bare ? "clamp(22px,3.4vw,30px)" : "clamp(26px,4vw,40px)", fontWeight: 500, letterSpacing: "-.01em", color: C.ink }}>{title}</h2>
      {sub && <p style={{ margin: "10px auto 14px", fontSize: 15.5, color: C.muted, maxWidth: 600 }}>{sub}</p>}
      {cta && <div style={{ margin: "4px 0 18px" }}><button className="er-btn er-btn-primary" onClick={cta[1]}>{cta[0]} <Arrow size={16} /></button></div>}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 999, padding: "7px 15px", fontSize: 12.5, fontWeight: 600, color: C.inkSoft, marginBottom: 26, marginTop: sub ? 0 : 14 }}>
        <Play size={13} /> Videos are high-definition, so they may take a few seconds to load.
      </div>
      <div className="er-videos-grid">
        {vids.map((v, i) => <VidTile key={v.src || v.title || i} v={v} />)}
      </div>
      {limit && ER_VIDEOS.length > limit && <button className="er-btn er-btn-ghost er-btn-sm" style={{ marginTop: 16 }} onClick={() => setMore(!more)}>{more ? "Show fewer" : `Show all ${ER_VIDEOS.length} videos`}</button>}
    </div>
  );
  return bare ? body : <section style={{ background: C.paper }}>{body}</section>;
}

/* The three ways a brand grows on Easy Recommend, shown as tabs. */
const WAYS = [
  { key: "list", tab: "Recommendation lists", tag: "The main one",
    title: "Get added to creators' recommendation lists",
    body: "Creators add your brand to their list, one link in their bio that their audience shops from. You set the commission and only pay when someone buys.",
    steps: ["List your brand free and set your commission.", "Creators add you to their list and share their link.", "Their audience shops, and you pay only on the sale."] },
  { key: "aff", tab: "Affiliate content", tag: "More reach",
    title: "Creators make content about you, on commission",
    body: "Creators who want to earn more make posts, reels and stories about your product with their tracked link, and earn a commission on every sale it drives.",
    steps: ["Set the commission creators earn per sale.", "Creators post content with their tracked link.", "Every sale is tracked, and you pay per sale, never for views."] },
  { key: "share", tab: "Share & get a discount", tag: "Word of mouth",
    title: "Your customers share you, their friends save",
    body: "Any shopper can share your brand with friends on Instagram. Friends get your discount, the sharer earns a reward, and you get a new customer.",
    steps: ["Add a customer perk, like 10% off.", "Shoppers tap “Share on Instagram & earn” on your page.", "Friends buy with the discount, and you pay only on the sale."] },
  { key: "agent", tab: "AI agents", tag: "New",
    title: "AI agents recommend you, on commission",
    body: "AI agents are free to use, and ads don't work inside them, so agents earn by taking a commission on the sales they drive. When an agent recommends your brand and the user buys, you pay only on that sale.",
    steps: ["List your brand and set your commission, same as for creators.", "AI agents find you when users ask for a recommendation.", "Each recommendation carries a tracked link, so you pay only on the sale."] },
];
/* Early access for people building AI agents (stored + texted to admin). */
function AgentAccessForm() {
  const [f, setF] = useState({ name: "", email: "", agent: "" }); const [st, setSt] = useState(""); const [err, setErr] = useState("");
  const submit = async (e) => { e.preventDefault(); setErr(""); setSt("busy"); try { await api("/agent-waitlist", { method: "POST", body: f }); setSt("done"); } catch (x) { setErr(x.message); setSt(""); } };
  if (st === "done") return <div style={{ marginTop: 18, background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: 14, padding: "13px 15px", fontSize: 14, color: C.accentD }}><b>You're on the list.</b> We'll reach out with access for your agent.</div>;
  return (
    <form onSubmit={submit} style={{ marginTop: 18, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Building an AI agent? Get early access and earn commission.</div>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))" }}>
        <input className="er-input" placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="er-input" type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      </div>
      <input className="er-input" placeholder="Agent name or link (optional)" value={f.agent} onChange={(e) => setF({ ...f, agent: e.target.value })} />
      {err && <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "#C0392B" }}>{err}</p>}
      <button className="er-btn er-btn-light er-btn-sm" type="submit" disabled={st === "busy"} style={{ alignSelf: "flex-start" }}>{st === "busy" ? "Sending…" : <>Request agent access <Arrow size={14} /></>}</button>
    </form>
  );
}
function WayVisual({ k }) {
  const igGrad = "linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)";
  if (k === "agent") { const bub = (mine, ch) => <div style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "88%", background: mine ? C.ink : C.panel, color: mine ? C.paper : C.ink, borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 13px", fontSize: 14, lineHeight: 1.5 }}>{ch}</div>; return (
    <div style={{ maxWidth: 400, margin: "0 auto", width: "100%", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 18, padding: 16, boxShadow: "0 12px 30px rgba(28,26,23,.10)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.muted }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3BB273" }} /> AI agent</div>
      {bub(true, "What's a good project tool for a 5-person team?")}
      {bub(false, <>I'd go with <b>Notion</b>. Docs and tasks in one place, with a free plan for small teams.<div style={{ marginTop: 7, fontSize: 12.5, fontWeight: 600, color: C.accentD, wordBreak: "break-all" }}>easyrecommend.co/r/agent/notion →</div></>)}
      <div style={{ alignSelf: "center", marginTop: 2, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: C.accentD, background: C.accentSoft, borderRadius: 999, padding: "5px 12px" }}><Check size={13} /> Sale tracked · agent earns commission</div>
    </div>); }
  if (k === "aff") return (
    <div className="er-videos-grid" style={{ maxWidth: 520 }}>
      {ER_VIDEOS.slice(0, 3).map((v, i) => <VidTile key={v.src || i} v={v} />)}
    </div>
  );
  if (k === "share") return (
    <div style={{ maxWidth: 380, margin: "0 auto", width: "100%" }}>
      <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${C.line}`, background: "#fff", boxShadow: "0 12px 30px rgba(28,26,23,.10)" }}>
        <div style={{ background: igGrad, padding: "11px 16px", display: "flex", alignItems: "center", gap: 9, color: "#fff" }}><Seal size={16} /><span style={{ fontWeight: 700, fontSize: 14 }}>Easy Recommend</span><IgIcon size={16} style={{ marginLeft: "auto" }} /></div>
        <div style={{ padding: "16px" }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink, lineHeight: 1.35 }}>Share Glow Co. with friends and earn {demoMoney(12)} on every sale.</div>
          <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 7, background: C.accentSoft, color: C.accentD, borderRadius: 999, padding: "6px 12px", fontSize: 12.5, fontWeight: 700 }}><Check size={13} /> Friends get 15% off</div>
          <div style={{ marginTop: 14, borderRadius: 999, background: igGrad, color: "#fff", textAlign: "center", padding: "11px 0", fontWeight: 700, fontSize: 14 }}>Share on Instagram &amp; earn</div>
        </div>
      </div>
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 14px", fontSize: 13, color: C.inkSoft }}>
        <span style={{ width: 28, height: 28, borderRadius: "50%", background: C.panel, display: "grid", placeItems: "center", color: C.accentD, flexShrink: 0 }}><Spark size={14} /></span>
        <span>Friend checks out: <b style={{ color: C.ink }}>15% off applied</b></span>
      </div>
    </div>
  );
  const rows = [["Glow Co.", "Beauty", "15% off"], ["Focusly", "Apps", "Free trial"], ["Peak Run", "Fitness", "10% off"]];
  return (
    <div style={{ maxWidth: 380, margin: "0 auto", width: "100%", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 18, padding: 18, boxShadow: "0 12px 30px rgba(28,26,23,.10)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 40, height: 40, borderRadius: "50%", background: C.accentSoft, color: C.accentD, display: "grid", placeItems: "center", fontWeight: 700 }}>S</span>
        <div><div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>@siya</div><div style={{ fontSize: 12, color: C.muted }}>easyrecommend.co/@siya</div></div>
      </div>
      <div style={{ marginTop: 14, fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.muted }}>Brands I back</div>
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map(([n, c, perk]) => { const cc = CATS[c] || CATS.Other; return (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: cc.bg, color: cc.color, display: "grid", placeItems: "center", flexShrink: 0 }}><Store size={14} /></span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>{n}</div><div style={{ fontSize: 11.5, color: C.muted }}>{c}</div></div>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.accentD, background: C.accentSoft, borderRadius: 999, padding: "3px 9px" }}>{perk}</span>
          </div>); })}
      </div>
      <div style={{ marginTop: 12, textAlign: "center", fontSize: 12.5, fontWeight: 600, color: C.accentD }}>Shop my picks →</div>
    </div>
  );
}
function WaysToGrow({ onList, onCreator }) {
  const [tab, setTab] = useState("list");
  const w = WAYS.find((x) => x.key === tab) || WAYS[0];
  return (
    <section style={{ background: C.panel, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <div className="er-wrap" style={{ padding: "60px 22px" }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
          <span className="er-eyebrow">For brands</span>
          <h2 className="er-serif" style={{ margin: "10px 0 8px", fontSize: "clamp(26px,4vw,40px)", fontWeight: 500, letterSpacing: "-.01em", color: C.ink }}>Four ways to grow with creators and AI agents</h2>
          <p style={{ margin: 0, fontSize: 15.5, color: C.muted, lineHeight: 1.55 }}>List once and get all three. You only pay when a sale happens.</p>
        </div>
        <div style={{ marginTop: 26, display: "flex", justifyContent: "center" }}>
          <div className="er-ways-tabs" role="tablist">
            {WAYS.map((x) => <button key={x.key} role="tab" aria-selected={tab === x.key} onClick={() => setTab(x.key)} className={`er-ways-tab${tab === x.key ? " on" : ""}`}>{x.tab}</button>)}
          </div>
        </div>
        <div className="er-ways-grid">
          <div>
            <span style={{ display: "inline-block", fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.accentD, background: C.accentSoft, borderRadius: 999, padding: "4px 10px" }}>{w.tag}</span>
            <h3 className="er-serif" style={{ margin: "12px 0 0", fontSize: "clamp(22px,3vw,30px)", fontWeight: 500, lineHeight: 1.2, color: C.ink }}>{w.title}</h3>
            <p style={{ margin: "10px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.inkSoft }}>{w.body}</p>
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              {w.steps.map((st, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: C.ink, color: C.paper, display: "grid", placeItems: "center", fontSize: 12.5, fontWeight: 700 }}>{i + 1}</span>
                  <span style={{ fontSize: 14.5, lineHeight: 1.5, color: C.ink, paddingTop: 3 }}>{st}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="er-btn er-btn-primary" onClick={onList}>List your business <Arrow size={16} /></button>
              {onCreator && w.key !== "agent" && <button className="er-btn er-btn-ghost" onClick={onCreator}>I'm a creator</button>}
            </div>
            {w.key === "agent" && <AgentAccessForm />}
          </div>
          <WayVisual k={w.key} />
        </div>
      </div>
    </section>
  );
}
const TOP_IG_CREATORS = [["Sohla El-Waylly", "@sohlae", "500K", "Food"], ["Priya Krishna", "@priyakrishna", "300K", "Food"], ["Hetty McKinnon", "@hettymckinnon", "400K", "Food/Recipes"], ["Brian Lagerstrom", "@brianlagerstrom", "600K", "Food/Recipes"], ["Internet Shaquille", "@internetshaquille", "500K", "Food"], ["Sip and Feast", "@sipandfeast", "800K", "Food/Recipes"], ["Kiki Rich", "@theblondeabroad", "501K", "Travel"], ["Alyssa Ramos", "@mylifesatravelmovie", "210K", "Travel"], ["Shivya Nath", "@shivya", "137K", "Travel"], ["Valeria Hinojosa", "@waterthruskin", "445K", "Travel/Wellness"], ["Anna Begum", "@jetset_anna", "714K", "Travel"], ["Luke Patrick Hoogmoed", "@lukepatrickh", "685K", "Travel"], ["Ines Fiorini", "@pinkines", "606K", "Travel/Photography"], ["Jess Darrington", "@whereisbriggs", "517K", "Travel/Family"], ["Laurie (Travel Tips by Laurie)", "@traveltipsbylaurie", "336K", "Travel"], ["Rilee Smith", "@rileejsmith", "168K", "Travel"], ["Jeff Jenkins", "@chubbydiaries", "146K", "Travel"], ["Alysse Dalessandro", "@readytostare", "143K", "Travel/Style"], ["Callie Thorpe", "@calliethorpe", "260K", "Travel/Food"], ["Savanna Crowell", "@solowithsav", "108K", "Travel"], ["Em Harriss", "@em.harriss", "107K", "Travel/History"], ["Sara Dietschy", "@saradietschy", "300K", "Tech"], ["Michael Fisher", "@mrmobile", "400K", "Tech"], ["Becca Farsace", "@becca", "200K", "Tech"], ["Snazzy Labs", "@snazzylabs", "900K", "Tech"], ["Tailosive Tech", "@tailosivetech", "300K", "Tech"], ["TK Bay", "@tkbay", "200K", "Tech"], ["Erica Griffin", "@ericagriffin", "150K", "Tech"], ["Tech With Lucy", "@techwithlucy", "250K", "Tech"], ["Michela Allocca", "@breakyourbudget", "400K", "Finance"], ["Haley Sacks", "@missbehelpful", "300K", "Finance"], ["Rose Han", "@rosehan", "200K", "Finance"], ["Delyanne Barros", "@delyannebarros", "300K", "Finance/Investing"], ["Berna Anat", "@heyberna", "150K", "Finance"], ["Paco de Leon", "@pacodeleon", "150K", "Finance"], ["Tonya Rapley", "@myfabfinance", "200K", "Finance"], ["Chris Browning", "@popcornfinance", "150K", "Finance"], ["Caleb Hearon", "@calebhearon", "500K", "Comedy"], ["Megan Stalter", "@meganstalter", "600K", "Comedy"], ["Joel Kim Booster", "@joelkimbooster", "400K", "Comedy"], ["Matt Rogers", "@mattrogersthat", "300K", "Comedy"], ["Patti Harrison", "@party_harrison", "300K", "Comedy"], ["John Early", "@bejohnce", "200K", "Comedy"], ["Kate Berlant", "@kateberlant", "200K", "Comedy"], ["Aparna Nancherla", "@aparnapkin", "300K", "Comedy"], ["Sam Jay", "@samjaycomic", "200K", "Comedy"]]; // [name, handle, followers, niche] — public creators, reference only
function TopCreators({ onList }) {
  const [q, setQ] = useState(""); const [all, setAll] = useState(false); const [niche, setNiche] = useState("");
  const t = q.trim().toLowerCase();
  const niches = [...new Set(TOP_IG_CREATORS.map((r) => r[3].split("/")[0]))];
  const list = TOP_IG_CREATORS.map((r, i) => [i + 1, ...r]).filter((r) => (!niche || r[4].split("/")[0] === niche) && (!t || r.slice(1).join(" ").toLowerCase().includes(t)));
  const shown = all || t || niche ? list : list.slice(0, 12);
  return (
    <section style={{ background: "#fff" }}>
      <div className="er-wrap" style={{ padding: "60px 22px" }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
          <span className="er-eyebrow">Influencers</span>
          <h2 className="er-serif" style={{ margin: "10px 0 8px", fontSize: "clamp(26px,4vw,40px)", fontWeight: 500, letterSpacing: "-.01em", color: C.ink }}>Creators across food, travel, tech, finance and comedy</h2>
          <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.55 }}>For reference: public follower counts. These accounts aren't affiliated with Easy Recommend.</p>
        </div>
        <div style={{ maxWidth: 720, margin: "22px auto 0" }}>
          <input className="er-input" placeholder="Search by name, handle or niche" value={q} onChange={(e) => setQ(e.target.value)} />
          <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "10px 0 2px" }}>
            {["", ...niches].map((c) => <button key={c || "all"} type="button" onClick={() => setNiche(c)} style={{ flexShrink: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 11px", borderRadius: 999, border: `1px solid ${niche === c ? C.ink : C.line}`, background: niche === c ? C.ink : "#fff", color: niche === c ? C.paper : C.inkSoft }}>{c || "All"}</button>)}
          </div>
          <div style={{ marginTop: 12, display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))" }}>
            {shown.map(([, name, handle, fol, nicheLabel]) => (
              <div key={handle} style={{ display: "flex", alignItems: "center", gap: 11, border: `1px solid ${C.line}`, borderRadius: 12, padding: "9px 12px", background: "#fff" }}>
                <span style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: C.panel, color: C.ink, fontWeight: 700, fontSize: 14 }}>{name[0]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name} <span style={{ fontWeight: 500, color: C.muted, fontSize: 12.5 }}>{handle}</span></div>
                  <div style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nicheLabel.replace(/\//g, " · ")}</div>
                </div>
                <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: C.inkSoft, background: C.panel, borderRadius: 999, padding: "3px 9px" }}>{fol}</span>
              </div>
            ))}
          </div>
          {list.length === 0 && <p style={{ textAlign: "center", fontSize: 14, color: C.muted }}>No one matches “{q}”.</p>}
          {!t && !niche && list.length > 12 && <div style={{ textAlign: "center", marginTop: 14 }}><button className="er-btn er-btn-ghost er-btn-sm" onClick={() => setAll(!all)}>{all ? "Show fewer" : "Show more creators"}</button></div>}
          <div style={{ marginTop: 18, background: C.panel, border: `1px dashed ${C.line}`, borderRadius: 14, padding: "16px 18px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: C.ink }}>100,000+ creators on Easy Recommend</div>
            <div style={{ marginTop: 4, fontSize: 13.5, color: C.muted }}>List your business free to see them all and get recommended.</div>
            {onList && <button className="er-btn er-btn-primary er-btn-sm" style={{ marginTop: 12 }} onClick={onList}>List your business <Arrow size={14} /></button>}
          </div>
        </div>
      </div>
    </section>
  );
}
/* Quick sign up / log in, right where someone is about to share (we need an account to track and pay). */
function QuickJoin({ brand, onClose, onDone }) {
  const [mode, setMode] = useState("signup");
  const [username, setUsername] = useState(""); const [id, setId] = useState(""); const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const isEmail = id.includes("@"); const digits = id.replace(/\D/g, "");
  const isPhone = !isEmail && /^[+\d\s().-]+$/.test(id) && digits.length >= 7;
  const ok = mode === "signup" ? slugify(username) && (isEmail ? emailOk(id) : isPhone) && pass.length >= 6 : id.trim() && pass;
  const submit = async () => {
    if (!ok || busy) return;
    setBusy(true); setErr("");
    try {
      let r;
      if (mode === "signup") r = await api("/influencer", { method: "POST", body: { username: slugify(username), ...(isEmail ? { email: id.trim() } : { phone: id.trim() }), password: pass } });
      else r = await api("/creator/login", { method: "POST", body: isEmail || isPhone ? { email: id.trim(), password: pass } : { username: id.trim(), password: pass } });
      onDone({ role: "creator", token: r.token, username: r.username });
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const tab = (k, label) => <button type="button" onClick={() => { setMode(k); setErr(""); }} className={`er-ways-tab${mode === k ? " on" : ""}`} style={{ flex: 1 }}>{label}</button>;
  const enter = (e) => { if (e.key === "Enter") submit(); };
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "28px 26px" }}>
        <span className="er-eyebrow">Share &amp; earn</span>
        <h2 className="er-serif" style={{ margin: "8px 0 4px", fontSize: 25, fontWeight: 500 }}>{brand ? `Get your link for ${brand.name}` : "Get your share links"}</h2>
        <p style={{ margin: 0, fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>A free account gives you your own link, so we can track sales from your shares and pay you the commission.</p>
        <div className="er-ways-tabs" style={{ display: "flex", marginTop: 16, width: "100%" }}>{tab("signup", "New here")}{tab("login", "I have an account")}</div>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && <Field label="Username">
            <div style={{ display: "flex", alignItems: "center", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 11, padding: "12px 14px" }}>
              <span style={{ fontSize: 14.5, color: C.muted }}>easyrecommend.co/@</span>
              <input autoFocus style={{ flex: 1, minWidth: 0, width: "100%", border: "none", outline: "none", background: "none", fontSize: 14.5, fontFamily: "inherit", color: C.ink }} placeholder="yourname" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} onKeyDown={enter} />
            </div></Field>}
          <Field label={mode === "signup" ? "Email or phone number" : "Email, phone or username"}><input className="er-input" autoFocus={mode === "login"} placeholder={mode === "signup" ? "you@email.com or +1 555 123 4567" : "you@email.com or phone"} value={id} onChange={(e) => setId(e.target.value)} onKeyDown={enter} /></Field>
          <Field label="Password" hint={mode === "signup" ? "At least 6 characters." : null}><input className="er-input" type="password" placeholder={mode === "signup" ? "Create a password" : "Your password"} value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={enter} /></Field>
          <ErrBox msg={err} />
          <button className="er-btn er-btn-primary er-btn-block" disabled={!ok || busy} onClick={submit}>{busy ? "One sec…" : mode === "signup" ? <>Create account &amp; get my link <Arrow size={16} /></> : <>Log in <Arrow size={16} /></>}</button>
          <p style={{ margin: 0, fontSize: 12, color: C.muted, textAlign: "center" }}>Free forever. You'll add payout details later, from your profile.</p>
        </div>
      </div>
    </Modal>
  );
}
/* Shared "how it works" layout: the animated phone first, then Step 1 / 2 / 3.
   The step that matches the current animation screen is highlighted; tapping a step jumps there. */
function HowToLayout({ f, setF, frames, screens, steps, title, sub, cta, who = "a friend" }) {
  const igGrad = "linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)";
  return (
    <div style={{ maxWidth: 900, margin: "26px auto 0", textAlign: "center" }}>
      {title && <h2 className="er-serif" style={{ margin: "0 0 6px", fontSize: "clamp(24px,3.6vw,34px)", fontWeight: 500, letterSpacing: "-.01em" }}>{title}</h2>}
      {sub && <p style={{ margin: "0 auto 18px", maxWidth: 520, fontSize: 14.5, color: C.muted, lineHeight: 1.55 }}>{sub}</p>}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", width: 220, aspectRatio: "9/17", borderRadius: 30, border: "7px solid #111", overflow: "hidden", background: "#fff", boxShadow: "0 28px 56px -26px rgba(0,0,0,.45)" }}>
          <div key={f} className="er-frame" style={{ position: "absolute", inset: 0 }}>{screens[f]}</div>
        </div>
        <div style={{ minHeight: 20, fontSize: 13.5, fontWeight: 700, color: C.ink }}><span style={{ color: C.muted, fontWeight: 600 }}>{f + 1}/{frames.length} · </span>{frames[f]}</div>
        <div style={{ display: "flex", gap: 6 }}>{frames.map((_, k) => <button key={k} type="button" aria-label={frames[k]} onClick={() => setF(k)} style={{ width: f === k ? 18 : 7, height: 7, borderRadius: 99, border: "none", padding: 0, background: f === k ? C.ink : C.line, cursor: "pointer", transition: "width .2s" }} />)}</div>
      </div>
      <div className="er-howto-steps">
        {steps.map(([t, d, fr], k) => { const on = fr.includes(f); return (
          <button key={t} type="button" onClick={() => setF(fr[0])} style={{ textAlign: "left", cursor: "pointer", fontFamily: "inherit", display: "flex", gap: 12, padding: "14px 15px", borderRadius: 16, border: `1.5px solid ${on ? C.ink : C.line}`, background: on ? "#fff" : "transparent", boxShadow: on ? "0 10px 24px -14px rgba(0,0,0,.35)" : "none", transition: "all .25s" }}>
            <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", background: on ? igGrad : C.panel, color: on ? "#fff" : C.inkSoft, fontWeight: 800, fontSize: 14, transition: "all .25s" }}>{k + 1}</span>
            <span><span style={{ display: "block", fontSize: 11.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: on ? C.accentD : C.muted }}>Step {k + 1}</span><span style={{ display: "block", fontSize: 15.5, fontWeight: 700, color: C.ink, marginTop: 1 }}>{t}</span><span style={{ display: "block", fontSize: 13, color: C.muted, lineHeight: 1.5, marginTop: 2 }}>{d}</span></span>
          </button>); })}
      </div>
      <HowYouEarn who={who} />
      {cta && <button className="er-btn er-btn-primary" style={{ marginTop: 20 }} onClick={cta[1]}>{cta[0]} <Arrow size={16} /></button>}
    </div>
  );
}
/* "How you earn": the money side, in the viewer's currency. Shown after every set of steps. */
function HowYouEarn({ who = "a friend" }) {
  const spend = VIEWER_CUR === "INR" ? 5000 : 60, pct = 8;
  const rows = [
    ["💸", "A commission on every sale", <>Each brand shows exactly what you earn. If it says <b>“You earn {pct}%”</b> and {who} spends <b>{money(spend)}</b>, you get <b>{money((spend * pct) / 100)}</b>.</>],
    ["🗓️", "Counts for 6 months", "Your link remembers the shopper for 6 months, so later purchases count too."],
    ["✅", "Confirmed after 14 days", "Sales are confirmed once the brand's 14-day return window passes."],
    ["🏦", "Paid to you", `Get paid to your ${VIEWER_CUR === "INR" ? "UPI, Paytm, bank account or PayPal" : "Venmo, PayPal, Zelle or bank account"} once sales are confirmed.`],
  ];
  return (
    <div style={{ margin: "22px auto 0", maxWidth: 900, textAlign: "left", background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: 18, padding: "18px 18px 8px" }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: C.accentD }}>How you earn</div>
      <div style={{ marginTop: 10, display: "grid", gap: 4, gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))" }}>
        {rows.map(([icon, t, d]) => (
          <div key={t} style={{ display: "flex", gap: 10, padding: "6px 0 12px" }}>
            <span style={{ fontSize: 20, lineHeight: 1.2, flexShrink: 0 }}>{icon}</span>
            <div><div style={{ fontSize: 14.5, fontWeight: 800, color: C.ink }}>{t}</div><div style={{ marginTop: 2, fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>{d}</div></div>
          </div>))}
      </div>
    </div>
  );
}
/* "Make a list" animation: pick brands → your list page → link in bio → earnings. */
function ListHowTo({ title, sub, cta } = {}) {
  const [f, setF] = useState(0);
  const frames = ["Pick brands you love", "Your list page is ready", "Put the link in your bio", "Followers shop, you earn"];
  useEffect(() => { const t = setTimeout(() => setF((x) => (x + 1) % frames.length), 2600); return () => clearTimeout(t); }, [f]);
  const brands = ["Nykaa", "Glossier", "Notion", "Mamaearth"];
  const screens = [
    <div key="0" style={{ position: "absolute", inset: 0, background: "#fff", padding: "30px 12px 12px" }}>
      <div style={{ fontSize: 11.5, fontWeight: 800 }}>Pick brands to back</div>
      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        {brands.map((n, k) => <div key={n} style={{ position: "relative", borderRadius: 9, overflow: "hidden", boxShadow: k < 3 ? `0 0 0 2px ${C.accent}` : `0 0 0 1px ${C.line}` }}>
          <BrandArt b={{ name: n, photos: [] }} fs={11} style={{ width: "100%", aspectRatio: "4/3" }} />
          <span className={k < 3 ? "er-pop" : ""} style={{ animationDelay: `${0.3 + k * 0.35}s`, position: "absolute", top: 4, right: 4, width: 16, height: 16, borderRadius: "50%", background: k < 3 ? C.accent : "#fff", color: "#fff", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 900 }}>{k < 3 ? "✓" : "+"}</span>
        </div>)}
      </div>
      <div className="er-pop" style={{ animationDelay: "1.4s", marginTop: 10, borderRadius: 8, background: C.ink, color: "#fff", textAlign: "center", padding: "7px 0", fontSize: 10.5, fontWeight: 800 }}>Continue · 3</div>
    </div>,
    <div key="1" style={{ position: "absolute", inset: 0, background: "#fff", padding: "26px 12px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#C9847A,#7E9C74)" }} /><div><div style={{ fontSize: 11.5, fontWeight: 800 }}>@you</div><div style={{ fontSize: 9, color: C.muted }}>Brands I back</div></div></div>
      <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 6 }}>
        {brands.slice(0, 3).map((n, k) => <div key={n} className="er-pop" style={{ animationDelay: `${0.2 + k * 0.3}s`, display: "flex", alignItems: "center", gap: 7, border: `1px solid ${C.line}`, borderRadius: 9, padding: 5 }}>
          <BrandArt b={{ name: n, photos: [] }} mini style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0 }} /><span style={{ flex: 1, fontSize: 10.5, fontWeight: 700 }}>{n}</span><span style={{ fontSize: 8.5, fontWeight: 800, color: "#fff", background: C.ink, borderRadius: 5, padding: "3px 6px" }}>Shop</span></div>)}
      </div>
      <div style={{ marginTop: 9, fontSize: 9.5, fontWeight: 700, color: C.accentD, textAlign: "center" }}>easyrecommend.co/@you</div>
    </div>,
    <div key="2" style={{ position: "absolute", inset: 0, background: "#fff", padding: "28px 12px 12px", fontFamily: "-apple-system, system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", fontSize: 11, fontWeight: 800 }}>you</div>
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 9 }}><span style={{ width: 44, height: 44, borderRadius: "50%", padding: 2, background: "linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF)" }}><span style={{ display: "block", width: "100%", height: "100%", borderRadius: "50%", border: "2px solid #fff", background: "linear-gradient(135deg,#C9847A,#7E9C74)" }} /></span><div style={{ fontSize: 10, fontWeight: 700 }}>Your Name</div></div>
      <div style={{ marginTop: 8, fontSize: 9.5, lineHeight: 1.45 }}>Things I actually use 👇<div style={{ marginTop: 4, background: C.accentSoft, border: `1.5px solid ${C.accent}`, borderRadius: 7, padding: "4px 6px", fontWeight: 800, color: "#00376B", overflow: "hidden", whiteSpace: "nowrap" }}>🔗 <span className="er-type">easyrecommend.co/@you</span></div></div>
      <div style={{ marginTop: 8, display: "flex", gap: 4 }}>{["Edit profile", "Share profile"].map((t) => <span key={t} style={{ flex: 1, textAlign: "center", fontSize: 9, fontWeight: 700, padding: "5px 0", borderRadius: 6, background: "#EFEFEF" }}>{t}</span>)}</div>
      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2 }}>{["#E8D9C7", "#C9D6C3", "#D9C6D6", "#C7D3E0", "#E5CFC0", "#D3D9C4"].map((c) => <span key={c} style={{ aspectRatio: "1/1", background: c }} />)}</div>
    </div>,
    <div key="3" style={{ position: "absolute", inset: 0, background: "#fff", padding: "34px 14px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: ".06em" }}>YOUR EARNINGS</div>
      {[["Nykaa", 18], ["Glossier", 10], ["Notion", 24]].map(([n, v], k) => (
        <div key={k} className="er-pop" style={{ animationDelay: `${0.3 + k * 0.4}s`, marginTop: 10, display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 9px" }}>
          <BrandArt b={{ name: n, photos: [] }} mini style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 11, fontWeight: 700 }}>Sale · {n}</span><span style={{ fontSize: 11, fontWeight: 800, color: C.accentD }}>+{demoMoney(v)}</span>
        </div>))}
      <div className="er-pop" style={{ animationDelay: "1.6s", marginTop: 14, textAlign: "center", fontSize: 20, fontWeight: 800, color: C.ink }}>{demoMoney(52)}</div>
    </div>,
  ];
  const steps = [["Pick brands you love", "Choose from 1,000+ brands. It takes a minute.", [0]], ["Get your own list page", "One link with every brand you recommend.", [1]], ["Put it in your bio and share", "Followers who shop within 6 months earn you a commission on every sale.", [2, 3]]];
  return <HowToLayout f={f} setF={setF} frames={frames} screens={screens} steps={steps} title={title} sub={sub} cta={cta} who="a follower" />;
}
/* All three ways to earn, as tabs, for pages people reach from Instagram (lists, shared links). */
function ExploreHowTo({ heading, onCreator }) {
  const go = (path) => () => { window.location.href = path; };
  return (
    <div>
      <ThreeWaysSlide bare heading={heading} onCreator={onCreator || go("/list")} onShare={go("/share")} onAffiliate={go("/affiliate")} onListPage={go("/list")} />
      <a href="/" style={{ display: "block", textDecoration: "none", margin: "22px auto 0", maxWidth: 560, textAlign: "center", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px 18px" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>Earn by sharing brands you like</div>
        <div style={{ marginTop: 3, fontSize: 14, fontWeight: 700, color: C.accentD }}>www.easyrecommend.co →</div>
      </a>
      <div style={{ margin: "14px auto 0", maxWidth: 560, background: C.ink, color: C.paper, borderRadius: 16, padding: "20px 18px", textAlign: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(253,252,250,.6)" }}>Are you a brand?</div>
        <div className="er-serif" style={{ marginTop: 6, fontSize: 21, lineHeight: 1.3 }}>Join Easy Recommend and let 100,000+ creators share your brand</div>
        <a className="er-btn" href="/brands" style={{ marginTop: 14, display: "inline-flex", textDecoration: "none", background: C.paper, color: C.ink }}>List your brand free <Arrow size={15} /></a>
      </div>
    </div>
  );
}
/* "Make a list" feature page. */
function ListPage({ session, onHome, onLogin, onLegal, onCreator }) {
  const isCreator = session && session.role === "creator";
  return (
    <div>
      <PageHeader onHome={onHome} onLogin={isCreator ? null : onLogin} right={<button className="er-btn er-btn-primary er-btn-sm" style={{ whiteSpace: "nowrap" }} onClick={onCreator}>{isCreator ? "Add brands" : "Start"}</button>} />
      <section className="er-wrap" style={{ padding: "46px 22px 70px", textAlign: "center" }}>
        <span className="er-eyebrow">Make a list &amp; share</span>
        <h1 className="er-serif" style={{ margin: "10px 0 8px", fontSize: "clamp(30px,5vw,48px)", fontWeight: 500, letterSpacing: "-.015em" }}>One link in your bio. Every recommendation pays.</h1>
        <p style={{ margin: "0 auto", maxWidth: 560, fontSize: 15.5, color: C.muted, lineHeight: 1.55 }}>Build a list of brands you love, share one link, and earn a commission whenever followers shop from it.</p>
        <ListHowTo cta={[isCreator ? "Add brands to my list" : "Create my list free", onCreator]} />
      </section>
      <PageFooter onLegal={onLegal} />
    </div>
  );
}
/* Affiliate page animation: copy link → make content → paste link in caption/description → earn. */
function AffiliateHowTo({ title, sub, cta } = {}) {
  const [f, setF] = useState(0);
  const frames = ["Copy your affiliate link", "Make your post, reel or video", "Paste the link in your caption or description", "Viewers buy, you earn"];
  useEffect(() => { const t = setTimeout(() => setF((x) => (x + 1) % frames.length), 2600); return () => clearTimeout(t); }, [f]);
  const link = "easyrecommend.co/r/you/notion";
  const tap = (style) => <span className="er-tap" style={{ position: "absolute", width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.55)", border: "2px solid #fff", boxShadow: "0 0 0 6px rgba(15,107,79,.18)", ...style }} />;
  const screens = [
    <div key="0" style={{ position: "absolute", inset: 0, background: "#fff", padding: "34px 14px 14px" }}>
      <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.line}` }}><BrandArt b={{ name: "Notion", photos: [] }} style={{ width: "100%", aspectRatio: "16/10" }} />
        <div style={{ padding: 9 }}><div style={{ fontSize: 12, fontWeight: 700 }}>Notion</div><div style={{ fontSize: 10, color: C.accentD, fontWeight: 600, marginTop: 2 }}>You earn 20% per sale</div>
          <div style={{ marginTop: 8, borderRadius: 8, background: C.panel, padding: "6px 8px", fontSize: 9, fontWeight: 700, color: C.inkSoft, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{link}</div>
          <div style={{ position: "relative", marginTop: 6, height: 26, borderRadius: 8, background: C.ink, color: "#fff", fontSize: 10, fontWeight: 800, display: "grid", placeItems: "center" }}>Copy affiliate link{tap({ right: 18, top: -4 })}</div></div></div>
      <div className="er-pop" style={{ position: "absolute", left: 0, right: 0, bottom: 22, textAlign: "center" }}><span style={{ background: C.accentD, color: "#fff", borderRadius: 999, padding: "6px 12px", fontSize: 11, fontWeight: 800 }}>✓ Link copied</span></div>
    </div>,
    <div key="1" style={{ position: "absolute", inset: 0, background: "linear-gradient(170deg,#2B2F3A,#111)" }}>
      <div style={{ position: "absolute", left: 16, right: 16, top: "18%", borderRadius: 14, overflow: "hidden", boxShadow: "0 10px 24px rgba(0,0,0,.4)" }}><BrandArt b={{ name: "Notion", photos: [] }} style={{ width: "100%", aspectRatio: "4/5" }} /></div>
      <div style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 5, background: "rgba(255,59,48,.9)", color: "#fff", borderRadius: 999, padding: "3px 8px", fontSize: 9.5, fontWeight: 800 }}><span className="er-tap" style={{ position: "static", width: 6, height: 6, border: "none", boxShadow: "none", background: "#fff" }} /> REC 0:12</div>
      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", width: 44, height: 44, borderRadius: "50%", border: "4px solid #fff", display: "grid", placeItems: "center" }}><span style={{ width: 18, height: 18, borderRadius: 4, background: "#FF3B30" }} /></div>
    </div>,
    <div key="2" style={{ position: "absolute", inset: 0, background: "#fff", padding: "30px 12px 12px" }}>
      <div style={{ borderRadius: 10, background: "#111", aspectRatio: "16/9", display: "grid", placeItems: "center", color: "#fff", fontSize: 18 }}>▶</div>
      <div style={{ marginTop: 8, fontSize: 11, fontWeight: 800 }}>My honest Notion setup</div>
      <div style={{ marginTop: 8, borderRadius: 9, background: C.panel, padding: 9, fontSize: 9.5, lineHeight: 1.5, color: C.inkSoft }}>
        <div style={{ fontWeight: 800, color: C.ink }}>Description</div>
        Everything I use to plan my week.<br />Try Notion here 👉 <span className="er-type" style={{ color: "#065FD4", fontWeight: 700 }}>{link}</span>
      </div>
      <div className="er-pop" style={{ marginTop: 10, display: "inline-block", background: C.ink, color: "#fff", borderRadius: 7, padding: "5px 10px", fontSize: 10, fontWeight: 800 }}>Paste</div>
    </div>,
    <div key="3" style={{ position: "absolute", inset: 0, background: "#fff", padding: "34px 14px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: ".06em" }}>YOUR EARNINGS</div>
      {[["Notion", demoMoney(24)], ["Notion", demoMoney(24)], ["Canva", demoMoney(12)]].map(([n, v], k) => (
        <div key={k} className="er-pop" style={{ animationDelay: `${0.3 + k * 0.4}s`, marginTop: 10, display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 9px" }}>
          <BrandArt b={{ name: n, photos: [] }} mini style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 11, fontWeight: 700 }}>Sale · {n}</span><span style={{ fontSize: 11, fontWeight: 800, color: C.accentD }}>+{v}</span>
        </div>))}
      <div className="er-pop" style={{ animationDelay: "1.6s", marginTop: 14, textAlign: "center", fontSize: 20, fontWeight: 800, color: C.ink }}>{demoMoney(60)}</div>
    </div>,
  ];
  const steps = [["Pick a brand and copy your affiliate link", "Every brand has your own tracked link.", [0]], ["Make content about it", "Posts, reels, YouTube videos, blogs, newsletters, podcasts.", [1]], ["Paste the link in your caption, description or bio", "Viewers who buy within 6 months earn you a commission, tracked automatically.", [2, 3]]];
  return <HowToLayout f={f} setF={setF} frames={frames} screens={screens} steps={steps} title={title} sub={sub} cta={cta} who="a viewer" />;
}
/* Affiliate links for content creators: every brand with a copyable tracked link. */
/* Popular products (seeded partner products): photo, brand, shopper discount, what you earn, and share actions. */
let popularProductsMem = null;
function PopularProducts({ q, isCreator, actions }) {
  const [rows, setRows] = useState(popularProductsMem); const [who, setWho] = useState("");
  useEffect(() => { api("/products/popular").then((r) => { popularProductsMem = Array.isArray(r) ? r : []; setRows(popularProductsMem); }).catch(() => setRows((x) => x || [])); }, []);
  const t = (q || "").trim().toLowerCase();
  const shown = (rows || []).filter((p) => (!who || p.for === who) && (!t || `${p.name} ${p.brand.name}`.toLowerCase().includes(t)));
  const earnLine = (p) => {
    const e = p.brand.earn;
    if (e && Number(p.price) > 0 && (e.pct > 0 || e.flat > 0)) return `You earn ${money(toViewer(p.price * e.pct / 100 + (e.flat || 0), e.currency, e.fx))} on this`;
    const ei = earnInfo(p.brand); return ei ? ei.line : "";
  };
  return (
    <div style={{ marginTop: 14 }}>
      {(rows || []).some((p) => p.for) && <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 14 }}>
        {[["", "All"], ["women", "For women"], ["men", "For men"]].map(([k, l]) => <button key={k || "all"} type="button" onClick={() => setWho(k)} style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "6px 12px", borderRadius: 999, border: `1px solid ${who === k ? C.accent : C.line}`, background: who === k ? C.accentSoft : "#fff", color: who === k ? C.accentD : C.inkSoft }}>{l}</button>)}
      </div>}
      {rows === null && <p style={{ textAlign: "center", color: C.muted }}>Loading products…</p>}
      {rows && shown.length === 0 && <p style={{ textAlign: "center", color: C.muted, marginTop: 20 }}>No products match{q ? ` “${q}”` : ""}.</p>}
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,230px),1fr))" }}>
        {shown.map((p) => { const el = earnLine(p); return (
          <div key={p.key} className="er-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <ProductPhoto p={p} />
            <div style={{ padding: "11px 13px 13px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>{p.brand.name}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1.3, marginTop: 2 }}>{p.name}</div>
                {(priceText(p) || offText(p.brand)) && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                  {priceText(p) && <span style={{ fontSize: 13, color: C.inkSoft, fontWeight: 600 }}>{priceText(p)}</span>}
                  {offText(p.brand) && <span style={{ fontSize: 11.5, fontWeight: 700, color: C.accentD, background: C.accentSoft, borderRadius: 999, padding: "3px 9px" }}>Friends get {offText(p.brand)}</span>}
                </div>}
              </div>
              <div style={{ background: el ? C.accentSoft : C.panel, borderRadius: 10, padding: "7px 10px", fontSize: 13.5, fontWeight: 800, color: el ? C.accentD : C.muted }}>{isCreator ? (el || "Commission coming soon") : "Join free to see what you earn"}</div>
              <div style={{ marginTop: "auto" }}>{actions(p)}</div>
            </div>
          </div>); })}
      </div>
    </div>
  );
}
function ProductPhoto({ p }) {
  const [bad, setBad] = useState(false);
  if (!p.image || bad) return <BrandArt b={p.brand} style={{ width: "100%", aspectRatio: "4 / 3" }} />;
  return <div style={{ width: "100%", aspectRatio: "4 / 3", background: "#fff", borderBottom: `1px solid ${C.line}` }}><img src={p.image} alt={p.name} loading="lazy" onError={() => setBad(true)} style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>;
}
function AffiliatePage({ session, onHome, onLogin, onLegal, onAuth }) {
  const isCreator = session && session.role === "creator";
  const [list, setList] = useState(() => cachedBusinesses()); const [q, setQ] = useState(""); const [cat, setCat] = useState("__popular");
  const [links, setLinks] = useState({}); const [busy, setBusy] = useState(""); const [joinFor, setJoinFor] = useState(undefined);
  useEffect(() => { fetchBusinesses(isCreator ? session.token : "").then(setList).catch(() => setList((l) => l || [])); }, [isCreator]);
  const all = list || [];
  const cats = CAT_LIST.filter((c) => all.some((b) => (b.categories || []).includes(c)));
  const t = q.trim().toLowerCase();
  const shown = all.filter((b) => (t || inSection(b, cat, all)) && (!t || [b.name, b.blurb, ...(b.categories || [])].join(" ").toLowerCase().includes(t)));
  const getLink = async (b) => {
    if (!isCreator) { setJoinFor(b); return; }
    if (links[b.id]) { const ok = await copyText(links[b.id]); toast(ok ? "✓ Affiliate link copied" : "Couldn't copy, tap Copy again"); return; }
    setBusy(b.id);
    try {
      const r = await api("/creator/link", { method: "POST", body: { token: session.token, businessId: b.id } });
      setLinks((m) => ({ ...m, [b.id]: r.referralUrl }));
      const ok = await copyText(r.referralUrl); toast(ok ? "✓ Affiliate link copied" : "Your link is ready. Tap Copy to copy it");
    } catch (e) { toast(e.message || "Couldn't get your link. Try again."); } finally { setBusy(""); }
  };
  return (
    <div>
      {joinFor !== undefined && <QuickJoin brand={joinFor} onClose={() => setJoinFor(undefined)} onDone={(sess) => { setJoinFor(undefined); onAuth(sess); toast("✓ You're in! Tap Copy on any brand to get your link"); }} />}
      <PageHeader onHome={onHome} onLogin={isCreator ? null : onLogin} right={!isCreator && <button className="er-btn er-btn-primary er-btn-sm" style={{ whiteSpace: "nowrap" }} onClick={() => setJoinFor(null)}>Join</button>} />
      <section className="er-wrap" style={{ padding: "46px 22px 18px", textAlign: "center" }}>
        <span className="er-eyebrow">Affiliate links</span>
        <h1 className="er-serif" style={{ margin: "10px 0 8px", fontSize: "clamp(30px,5vw,48px)", fontWeight: 500, letterSpacing: "-.015em" }}>Create content. Earn on every sale.</h1>
        <p style={{ margin: "0 auto", maxWidth: 560, fontSize: 15.5, color: C.muted, lineHeight: 1.55 }}>For serious creators, bloggers, YouTubers and more. Copy your affiliate link for any brand, put it in your content, and earn a commission when your audience buys.</p>
        <AffiliateHowTo />
      </section>
      <section className="er-wrap" style={{ padding: "8px 22px 70px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <input className="er-input" placeholder={cat === "__products" ? "Search products or brands" : "Search brands or categories"} value={q} onChange={(e) => setQ(e.target.value)} />
          {(cats.length > 1 || all.some((x) => x.popular)) && <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "10px 0 2px" }}>
            {PRODUCT_CHIPS.filter((c) => chipShown(c, all)).map((c) => <button key={c || "all"} type="button" onClick={() => setCat(c)} style={{ flexShrink: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 11px", borderRadius: 999, border: `1px solid ${cat === c ? C.ink : C.line}`, background: cat === c ? C.ink : "#fff", color: cat === c ? C.paper : C.inkSoft }}>{SECTION_LABEL[c]}</button>)}
          </div>}
        </div>
        {list === null && <div style={{ marginTop: 20, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,265px),1fr))" }}>
          {[0, 1, 2, 3, 4, 5].map((k) => <div key={k} className="er-card er-skel" style={{ padding: 0, overflow: "hidden" }}><div style={{ aspectRatio: "16/9", background: C.panel }} /><div style={{ padding: 14 }}><div style={{ height: 14, width: "55%", borderRadius: 6, background: C.panel }} /><div style={{ height: 36, borderRadius: 10, background: C.panel, marginTop: 16 }} /></div></div>)}
        </div>}
        {cat === "__products" && <PopularProducts q={q} isCreator={isCreator} actions={(p) => { const url = links[p.brand.id]; return (
          <button type="button" onClick={() => getLink(p.brand)} disabled={busy === p.brand.id} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 36, borderRadius: 10, border: "none", background: C.ink, color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}><Copy size={13} /> {busy === p.brand.id ? "…" : url ? "Copy my link" : "Get my link"}</button>); }} />}
        {cat !== "__products" && list && shown.length === 0 && <p style={{ textAlign: "center", color: C.muted, marginTop: 30 }}>No brands match{q ? ` “${q}”` : ""}.</p>}
        {cat !== "__products" && <div style={{ marginTop: 20, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,265px),1fr))" }}>
          {shown.map((b) => { const ei = earnInfo(b); const url = links[b.id]; return (
            <div key={b.id} className="er-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <BrandArt b={b} style={{ width: "100%", aspectRatio: "16/9" }} />
              <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</div>
                  <div style={{ fontSize: 12.5, color: C.muted }}>{(b.categories || []).join(" · ")}</div>
                </div>
                <div style={{ background: ei ? C.accentSoft : C.panel, borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: ei ? C.accentD : C.muted }}>{isCreator ? (ei ? ei.line : "Commission coming soon") : "Join free to see what you earn"}</div>
                  {isCreator && ei && ei.sub && <div style={{ fontSize: 12, color: C.accentD, marginTop: 1 }}>{ei.sub}</div>}
                </div>
                <button type="button" onClick={() => getLink(b)} disabled={busy === b.id} style={{ marginTop: "auto", width: "100%", display: "flex", alignItems: "center", gap: 8, background: url ? C.accentSoft : C.panel, border: `1.5px solid ${url ? C.accent : C.line}`, borderRadius: 12, padding: "9px 10px 9px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ flex: 1, minWidth: 0, textAlign: "left", fontSize: 12.5, fontWeight: 600, color: url ? C.ink : C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url ? url.replace(/^https?:\/\/(www\.)?/i, "") : `easyrecommend.co/r/${isCreator ? session.username : "you"}/${slugify(b.name)}`}</span>
                  <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, background: C.ink, color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 12.5, fontWeight: 800 }}><Copy size={13} /> {busy === b.id ? "…" : url ? "Copy" : "Get link"}</span>
                </button>
              </div>
            </div>); })}
        </div>}
      </section>
      <PageFooter onLegal={onLegal} />
    </div>
  );
}
/* Share page: how-to steps + an animated phone showing copy link → Instagram story → link sticker → paste. */
function ShareHowTo({ title, sub, cta } = {}) {
  const [f, setF] = useState(0);
  const frames = ["Tap Copy link", "Open Instagram, add your story", "Tap the sticker icon, pick LINK", "Paste your link, tap Done", "Tap Aa and add a few words", "Friends tap it and shop"];
  useEffect(() => { const t = setTimeout(() => setF((x) => (x + 1) % frames.length), 2600); return () => clearTimeout(t); }, [f]);
  const igGrad = "linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)";
  const link = "easyrecommend.co/r/you/notion";
  const tap = (style) => <span className="er-tap" style={{ position: "absolute", width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.55)", border: "2px solid #fff", boxShadow: "0 0 0 6px rgba(255,255,255,.25)", ...style }} />;
  const story = (children) => <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#FF8A65,#FF385C)" }}>
    <div style={{ position: "absolute", left: 18, right: 18, top: "26%", borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 20px rgba(0,0,0,.2)" }}><BrandArt b={{ name: "Notion", photos: [] }} style={{ width: "100%", aspectRatio: "16/10" }} /></div>
    <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>{["Aa", "☺", "▢"].map((x, k) => <span key={k} style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,.25)", color: "#fff", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800 }}>{x}</span>)}</div>
    {children}</div>;
  const screens = [
    <div key="0" style={{ position: "absolute", inset: 0, background: "#fff", padding: "34px 14px 14px" }}>
      <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.line}` }}><BrandArt b={{ name: "Notion", photos: [] }} style={{ width: "100%", aspectRatio: "16/10" }} />
        <div style={{ padding: 9 }}><div style={{ fontSize: 12, fontWeight: 700 }}>Notion</div><div style={{ fontSize: 10, color: C.accentD, fontWeight: 600, marginTop: 2 }}>You earn {demoMoney(12)} per sale</div>
          <div style={{ marginTop: 8, height: 26, borderRadius: 8, background: igGrad }} /><div style={{ marginTop: 6, display: "flex", gap: 5 }}>{["#111", "#25D366", "#1877F2"].map((c) => <span key={c} style={{ flex: 1, height: 22, borderRadius: 7, background: c }} />)}
            <span style={{ position: "relative", flex: 1, height: 22, borderRadius: 7, border: `1px solid ${C.line}`, fontSize: 9, fontWeight: 800, display: "grid", placeItems: "center" }}>Copy{tap({ right: -8, top: -6 })}</span></div></div></div>
      <div className="er-pop" style={{ position: "absolute", left: "50%", bottom: 22, transform: "translateX(-50%)", background: "#111", color: "#fff", borderRadius: 999, padding: "6px 12px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>✓ Link copied</div>
    </div>,
    <div key="1" style={{ position: "absolute", inset: 0 }}>{story(<div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>Your story</div>)}</div>,
    <div key="2" style={{ position: "absolute", inset: 0 }}>{story(<>
      {tap({ top: 8, right: 10 })}
      <div className="er-up" style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "rgba(30,30,30,.92)", borderRadius: "16px 16px 0 0", padding: "12px 12px 16px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7 }}>
        {["LOCATION", "LINK", "MENTION", "MUSIC", "POLL", "GIF"].map((x) => <span key={x} style={{ position: "relative", fontSize: 9, fontWeight: 800, textAlign: "center", padding: "7px 0", borderRadius: 7, background: x === "LINK" ? "#fff" : "rgba(255,255,255,.12)", color: x === "LINK" ? "#0095F6" : "#fff" }}>{x === "LINK" ? "🔗 LINK" : x}{x === "LINK" && tap({ right: -10, top: -8 })}</span>)}
      </div></>)}</div>,
    <div key="3" style={{ position: "absolute", inset: 0, background: "rgba(20,20,20,.96)", padding: "40px 14px", color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700 }}><span>Cancel</span><span style={{ color: "#0095F6" }}>Done</span></div>
      <div style={{ marginTop: 22, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.6)" }}>URL</div>
      <div style={{ marginTop: 6, borderBottom: "1px solid rgba(255,255,255,.3)", padding: "6px 0", fontSize: 11.5, fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap" }}><span className="er-type">{link}</span></div>
      <div className="er-pop" style={{ marginTop: 12, display: "inline-block", background: "#fff", color: "#111", borderRadius: 8, padding: "5px 10px", fontSize: 10.5, fontWeight: 800 }}>Paste</div>
    </div>,
    <div key="t" style={{ position: "absolute", inset: 0 }}>{story(<>
      {tap({ top: 8, right: 76 })}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)" }} />
      <div style={{ position: "absolute", left: 14, right: 14, top: "12%", textAlign: "center" }}><span style={{ display: "inline-block", maxWidth: "100%", background: "#fff", color: "#111", borderRadius: 8, padding: "6px 8px", fontSize: 12, fontWeight: 800, lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden" }}><span className="er-type">Love this 😍 15% off 👇</span></span></div>
      <div style={{ position: "absolute", left: "50%", bottom: "16%", transform: "translateX(-50%) rotate(-4deg)", background: "#fff", color: "#0095F6", borderRadius: 9, padding: "6px 9px", fontSize: 9, fontWeight: 800, whiteSpace: "nowrap", maxWidth: "88%", overflow: "hidden", textOverflow: "ellipsis" }}>🔗 {link.toUpperCase()}</div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 28, background: "#d1d3d9", display: "flex", alignItems: "center", justifyContent: "space-around", fontSize: 9, fontWeight: 700, color: "#333" }}>{["q","w","e","r","t","y","u","i","o","p"].map((k) => <span key={k}>{k}</span>)}</div>
    </>)}</div>,
    <div key="4" style={{ position: "absolute", inset: 0 }}>{story(<>
      <div style={{ position: "absolute", left: 14, right: 14, top: "12%", textAlign: "center" }}><span style={{ display: "inline-block", background: "#fff", color: "#111", borderRadius: 8, padding: "6px 8px", fontSize: 11, fontWeight: 800, lineHeight: 1.35 }}>Love this 😍 15% off 👇</span></div>
      <div className="er-pop" style={{ position: "absolute", left: "50%", bottom: "16%", transform: "translateX(-50%) rotate(-4deg)", background: "#fff", color: "#0095F6", borderRadius: 9, padding: "6px 9px", fontSize: 9, fontWeight: 800, whiteSpace: "nowrap", maxWidth: "88%", overflow: "hidden", textOverflow: "ellipsis", boxShadow: "0 4px 12px rgba(0,0,0,.2)" }}>🔗 {link.toUpperCase()}</div>
      <div className="er-pop" style={{ position: "absolute", left: 10, right: 10, bottom: 10, background: "rgba(17,17,17,.85)", color: "#fff", borderRadius: 10, padding: "6px 9px", fontSize: 10.5, fontWeight: 700 }}>✓ Sale tracked · you earned {demoMoney(12)}</div></>)}</div>,
  ];
  const steps = [["Select a brand you like", "Search or browse. Each brand shows what you earn.", [0]], ["Share it on Instagram story, WhatsApp or X", "Your link is copied. On Instagram, add a Link sticker, paste it, and write a few words about why you love it.", [1, 2, 3, 4]], ["Friends shop within 6 months, you earn", "Every sale from your link pays you a commission, tracked automatically.", [5]]];
  return <HowToLayout f={f} setF={setF} frames={frames} screens={screens} steps={steps} title={title} sub={sub} cta={cta} who="a friend" />;
}
/* Share a brand: browse brands, share each one to Instagram story / X / Facebook with your own link. */
function SharePage({ session, onHome, onLogin, onLegal, onAuth }) {
  const isCreator = session && session.role === "creator";
  const [list, setList] = useState(() => cachedBusinesses()); const [q, setQ] = useState(""); const [cat, setCat] = useState("__popular");
  const [links, setLinks] = useState({}); const [busy, setBusy] = useState(""); const [note, setNote] = useState({});
  const [joinFor, setJoinFor] = useState(undefined); // brand awaiting quick sign up (null = from header)
  useEffect(() => { fetchBusinesses(isCreator ? session.token : "").then(setList).catch(() => setList((l) => l || [])); }, [isCreator]);
  const all = list || [];
  const cats = CAT_LIST.filter((c) => all.some((b) => (b.categories || []).includes(c)));
  const t = q.trim().toLowerCase();
  const shown = all.filter((b) => (t || inSection(b, cat, all)) && (!t || [b.name, b.blurb, ...(b.categories || [])].join(" ").toLowerCase().includes(t)));
  const say = (id, msg) => { setNote((n) => ({ ...n, [id]: msg })); setTimeout(() => setNote((n) => ({ ...n, [id]: "" })), 6000); };
  const linkFor = async (b) => {
    if (links[b.id]) return links[b.id];
    const r = await api("/creator/link", { method: "POST", body: { token: session.token, businessId: b.id } });
    const u = r.referralUrl + "?src=share"; setLinks((m) => ({ ...m, [b.id]: u })); return u;
  };
  // story: what the Instagram image shows (a product, or the brand itself); key: which card is busy.
  const share = async (b, where, story = b, key = b.id) => {
    if (!isCreator) { setJoinFor(b); return; }
    const win = where === "x" || where === "fb" || where === "wa" ? window.open("", "_blank") : null;   // open now so popup blockers allow it
    setBusy(key + where);
    try {
      const url = await linkFor(b);
      const what = story !== b ? `${story.name} from ${b.name}` : b.name;
      const text = offText(b) ? `${what}: ${offText(b)} with my link` : `I recommend ${what}`;
      if (where === "wa") win.location.href = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
      else if (where === "x") win.location.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      else if (where === "fb") win.location.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      else if (where === "copy") { const ok = await copyText(url); toast(ok ? "✓ Link copied" : "Couldn't copy, tap Copy again"); }
      else startIgShare(url, () => shareBrandToStory(story, url));
    } catch (e) { if (win) win.close(); if (!(e && e.name === "AbortError")) say(key, e.message || "Couldn't share. Try again."); }
    finally { setBusy(""); }
  };
  const igGrad = "linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)";
  const sbtn = (b, where, label, icon, bg, color, story = b, key = b.id) => <button type="button" onClick={() => share(b, where, story, key)} disabled={!!busy} title={label} style={{ flex: where === "ig" ? "1 1 100%" : "1 1 0", minWidth: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, height: 36, borderRadius: 10, border: bg === "#fff" ? `1px solid ${C.line}` : "none", background: bg, color, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: busy ? "default" : "pointer", opacity: busy && busy !== key + where ? 0.6 : 1 }}>{icon}{busy === key + where ? "…" : label}</button>;
  const productActions = (p) => { const st = { ...p.brand, name: p.name, photos: p.image ? [p.image] : p.brand.photos, brandName: p.brand.name }; return <>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {sbtn(p.brand, "ig", "Share on Instagram story", <IgIcon size={14} />, igGrad, "#fff", st, p.key)}
      {sbtn(p.brand, "wa", "WhatsApp", null, "#25D366", "#fff", st, p.key)}
      {sbtn(p.brand, "x", "𝕏", null, C.ink, "#fff", st, p.key)}
      {sbtn(p.brand, "copy", "Copy", <Copy size={13} />, "#fff", C.ink, st, p.key)}
    </div>
    {note[p.key] && <div style={{ fontSize: 12, fontWeight: 600, color: C.accentD, marginTop: 6 }}>{note[p.key]}</div>}</>; };
  return (
    <div>
      {joinFor !== undefined && <QuickJoin brand={joinFor} onClose={() => setJoinFor(undefined)} onDone={(sess) => { const b = joinFor; setJoinFor(undefined); onAuth(sess); if (b) say(b.id, "You're in! Tap a share button to post with your link."); }} />}
      <PageHeader onHome={onHome} onLogin={isCreator ? null : onLogin} right={!isCreator && <button className="er-btn er-btn-primary er-btn-sm" style={{ whiteSpace: "nowrap" }} onClick={() => setJoinFor(null)}>Join</button>} />
      <section className="er-wrap" style={{ padding: "46px 22px 18px", textAlign: "center" }}>
        <span className="er-eyebrow">Share &amp; earn</span>
        <h1 className="er-serif" style={{ margin: "10px 0 8px", fontSize: "clamp(30px,5vw,48px)", fontWeight: 500, letterSpacing: "-.015em" }}>Share a brand you love :)</h1>
        {!isCreator && <p style={{ margin: "4px auto 0", maxWidth: 520, fontSize: 13.5, fontWeight: 600, color: C.accentD }}>Free to join. You get your own link for every brand.</p>}
        <ShareHowTo />
      </section>
      <section className="er-wrap" style={{ padding: "8px 22px 70px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <input className="er-input" placeholder={cat === "__products" ? "Search products or brands" : "Search brands or categories"} value={q} onChange={(e) => setQ(e.target.value)} />
          {(cats.length > 1 || all.some((x) => x.popular)) && <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "10px 0 2px" }}>
            {PRODUCT_CHIPS.filter((c) => chipShown(c, all)).map((c) => <button key={c || "all"} type="button" onClick={() => setCat(c)} style={{ flexShrink: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 11px", borderRadius: 999, border: `1px solid ${cat === c ? C.ink : C.line}`, background: cat === c ? C.ink : "#fff", color: cat === c ? C.paper : C.inkSoft }}>{SECTION_LABEL[c]}</button>)}
          </div>}
        </div>
        {list === null && <div style={{ marginTop: 20, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,265px),1fr))" }}>
          {[0, 1, 2, 3, 4, 5].map((k) => <div key={k} className="er-card er-skel" style={{ padding: 0, overflow: "hidden" }}><div style={{ aspectRatio: "16/9", background: C.panel }} /><div style={{ padding: 14 }}><div style={{ height: 14, width: "55%", borderRadius: 6, background: C.panel }} /><div style={{ height: 10, width: "35%", borderRadius: 6, background: C.panel, marginTop: 8 }} /><div style={{ height: 36, borderRadius: 10, background: C.panel, marginTop: 16 }} /></div></div>)}
        </div>}
        {cat === "__products" && <PopularProducts q={q} isCreator={isCreator} actions={productActions} />}
        {cat !== "__products" && list && shown.length === 0 && <p style={{ textAlign: "center", color: C.muted, marginTop: 30 }}>No brands match{q ? ` “${q}”` : ""}.</p>}
        {cat !== "__products" && <div style={{ marginTop: 20, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,265px),1fr))" }}>
          {shown.map((b) => { const ei = earnInfo(b); return (
            <div key={b.id} className="er-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <BrandArt b={b} style={{ width: "100%", aspectRatio: "16/9" }} />
              <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</div>
                    <div style={{ fontSize: 12.5, color: C.muted }}>{(b.categories || []).join(" · ")}</div>
                  </div>
                  {offText(b) && <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 700, color: C.accentD, background: C.accentSoft, borderRadius: 999, padding: "3px 9px" }}>Friends get {offText(b)}</span>}
                </div>
                <div style={{ background: ei ? C.accentSoft : C.panel, borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: ei ? C.accentD : C.muted }}>{isCreator ? (ei ? ei.line : "Commission coming soon") : "Join free to see what you earn"}</div>
                  {isCreator && ei && ei.sub && <div style={{ fontSize: 12, color: C.accentD, marginTop: 1 }}>{ei.sub}</div>}
                </div>
                <div style={{ marginTop: "auto", display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {sbtn(b, "ig", "Share on Instagram story", <IgIcon size={14} />, igGrad, "#fff")}
                  {sbtn(b, "wa", "WhatsApp", null, "#25D366", "#fff")}
                  {sbtn(b, "x", "𝕏", null, C.ink, "#fff")}
                  {sbtn(b, "fb", "f", null, "#1877F2", "#fff")}
                  {sbtn(b, "copy", "Copy", <Copy size={13} />, "#fff", C.ink)}
                </div>
                {note[b.id] && <div style={{ fontSize: 12, fontWeight: 600, color: C.accentD }}>{note[b.id]}</div>}
              </div>
            </div>); })}
        </div>}
      </section>
      <PageFooter onLegal={onLegal} />
    </div>
  );
}
function BrandsPage({ onHome, onList, onCreator, onLogin, onLegal }) {
  return (
    <div>
      <PageHeader onHome={onHome} onLogin={onLogin} right={<button className="er-btn er-btn-primary er-btn-sm" onClick={onList}>List your business</button>} />
      <LumaHero
        title={<>Your brand,<br />recommended<br /><span className="er-luma-grad">everywhere.</span></>}
        sub="Creators add you to their lists, make content about you as affiliates, and shoppers share you with friends for a discount. You only pay when it sells."
        pill="List free · pay only on sales"
        cta={["List Your Business", onList]}
        cta2={["Join as a Creator", onCreator]}
      />
      <BrandStrip label="Listed alongside 1,000+ brands, including" />
      <WaysToGrow onList={onList} />
      <TopCreators onList={onList} />
      <CreatorVideos />
      <section style={{ background: C.ink }}>
        <div className="er-wrap" style={{ padding: "56px 22px", textAlign: "center" }}>
          <h2 className="er-serif" style={{ margin: 0, fontSize: "clamp(26px,4vw,40px)", fontWeight: 500, color: C.paper, letterSpacing: "-.01em" }}>Get recommended by creators this week</h2>
          <p style={{ margin: "10px auto 0", maxWidth: 520, fontSize: 15.5, color: "rgba(253,252,250,.72)", lineHeight: 1.55 }}>List free, set your commission and customer perk, and go live once we review your listing.</p>
          <button className="er-btn" style={{ marginTop: 22, background: C.paper, color: C.ink }} onClick={onList}>List your business <Arrow size={16} /></button>
        </div>
      </section>
      <PageFooter onLegal={onLegal} />
    </div>
  );
}
/* "Join" asks who you are before opening the right signup. */
function JoinChooser({ onClose, onCreator, onList }) {
  const opt = (icon, title, sub, go) => (
    <button className="er-card er-row-h" onClick={() => { onClose(); go(); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, textAlign: "left", cursor: "pointer", width: "100%" }}>
      <span style={{ width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center", background: C.panel, color: C.ink, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}><span style={{ display: "block", fontWeight: 600 }}>{title}</span><span style={{ fontSize: 13, color: C.muted }}>{sub}</span></span><ChevR size={18} color={C.muted} />
    </button>
  );
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "30px 28px" }}>
        <span className="er-eyebrow">Join Easy Recommend</span>
        <h2 className="er-serif" style={{ margin: "8px 0 16px", fontSize: 27, fontWeight: 500 }}>How are you joining?</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {opt(<Spark size={18} />, "I'm a creator", "Build your list and earn on every sale", onCreator)}
          {opt(<Store size={18} />, "I'm a business", "Get recommended, pay only on sales", onList)}
        </div>
      </div>
    </Modal>
  );
}
/* Homepage slide: share one brand to your Instagram story and earn on the sale. */
function ShareStorySlide({ onShare }) {
  const igGrad = "linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)";
  const steps = [["Pick a brand you love", "Browse 1,000+ brands, from skincare to software."], ["Tap “Share on Instagram story”", "We make the story image and copy your link for the link sticker."], ["Friends buy, you earn", "Every sale from your link pays you a commission, tracked automatically."]];
  return (
    <section style={{ background: "#fff", borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <div className="er-wrap" style={{ padding: "60px 22px" }}>
        <div className="er-how2" style={{ alignItems: "center" }}>
          <div>
            <span className="er-eyebrow">Share &amp; earn</span>
            <h2 className="er-serif" style={{ margin: "10px 0 12px", fontSize: "clamp(26px,4vw,42px)", fontWeight: 500, letterSpacing: "-.01em" }}>Share a brand on your story. Earn on every sale.</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: C.muted, maxWidth: 460 }}>No list needed. Post one brand you love to your Instagram story with your own link, and get a commission when friends buy.</p>
            <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              {steps.map(([t, d], k) => (
                <div key={t} style={{ display: "flex", gap: 12 }}>
                  <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", background: C.ink, color: C.paper, fontWeight: 700, fontSize: 13 }}>{k + 1}</span>
                  <div><div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{t}</div><div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>{d}</div></div>
                </div>))}
            </div>
            <button className="er-btn" style={{ marginTop: 24, border: "none", color: "#fff", background: igGrad, boxShadow: "0 4px 16px rgba(214,41,118,.3)" }} onClick={onShare}><IgIcon size={16} /> Start sharing</button>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 250, maxWidth: "100%", aspectRatio: "9/16", borderRadius: 30, overflow: "hidden", background: "linear-gradient(160deg,#FF5A5F,#FF385C 55%,#FC642D)", boxShadow: "0 30px 60px -28px rgba(214,41,118,.55)", border: "6px solid #111" }}>
              <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", gap: 4 }}>{[1, 0, 0].map((on, k) => <span key={k} style={{ flex: 1, height: 3, borderRadius: 99, background: on ? "#fff" : "rgba(255,255,255,.4)" }} />)}</div>
              <div style={{ position: "absolute", top: 24, left: 14, display: "flex", alignItems: "center", gap: 7, color: "#fff", fontSize: 12, fontWeight: 700 }}><span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,.35)", border: "2px solid #fff" }} /> you</div>
              <div style={{ position: "absolute", left: 16, right: 16, top: "22%" }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: "rgba(255,255,255,.85)" }}>MY PICK</div>
                <div style={{ marginTop: 8, borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.35)" }}>
                  <BrandArt b={{ name: "Notion", photos: [] }} style={{ width: "100%", aspectRatio: "16/10" }} />
                  <div style={{ padding: "9px 11px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}><span style={{ fontWeight: 800, fontSize: 14 }}>Notion</span><span style={{ fontSize: 10.5, fontWeight: 800, background: "#fff", color: "#FF385C", borderRadius: 999, padding: "3px 8px" }}>FREE PLAN</span></div>
                </div>
              </div>
              <div style={{ position: "absolute", left: "50%", bottom: "17%", transform: "translateX(-50%) rotate(-3deg)", display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#0095F6", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(0,0,0,.2)" }}>🔗 EASYRECOMMEND.CO/R/YOU</div>
              <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, display: "flex", alignItems: "center", gap: 8, background: "rgba(17,17,17,.82)", color: "#fff", borderRadius: 12, padding: "8px 10px", fontSize: 11.5, fontWeight: 600 }}><span style={{ width: 20, height: 20, borderRadius: "50%", background: C.accent, display: "grid", placeItems: "center", flexShrink: 0 }}><Check size={12} /></span> Sale tracked · you earned {demoMoney(12)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
/* Homepage "How it works": the three ways to earn. */
function ThreeWaysSlide({ onCreator, onShare, onAffiliate, onListPage, heading, bare }) {
  const igGrad = "linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)";
  const ways = [
    { n: "1", tag: "Make a list & share", title: "Build a list of brands you love", body: "Pick your favourite brands, put one link in your bio, and earn on every sale from your list.", cta: "Create my list", act: onCreator, more: onListPage, bg: C.ink, color: C.paper },
    { n: "2", tag: "Share & earn", title: "Share one brand on your story", body: "No list needed. Share a brand to your Instagram story with your own link and earn when friends buy.", cta: "Share a brand", act: onShare, more: onShare, bg: igGrad, color: "#fff" },
    { n: "3", tag: "Create content", title: "Interested in creating content?", body: "Get your affiliate link, make posts, reels or videos about brands you love, and earn a commission on every sale.", note: "For serious creators, bloggers, YouTubers and more", cta: "Get my affiliate link", act: onAffiliate, more: onAffiliate, bg: C.accent, color: "#fff" },
  ];
  return (
    <section style={bare ? {} : { background: C.paper, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <div className="er-wrap" style={{ padding: bare ? "0" : "56px 22px" }}>
        <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 30px" }}>
          <span className="er-eyebrow">How it works</span>
          <h2 className="er-serif" style={{ margin: "10px 0 8px", fontSize: "clamp(26px,4vw,42px)", fontWeight: 500, letterSpacing: "-.01em" }}>{heading || "Three ways to earn"}</h2>
          <p style={{ margin: 0, fontSize: 15.5, color: C.muted, lineHeight: 1.55 }}>Free to join. Pick one or do all three, you earn a commission on every sale either way.</p>
        </div>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))" }}>
          {ways.map((w) => (
            <div key={w.n} className="er-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ background: w.bg, color: w.color, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.22)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{w.n}</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{w.tag}</span>
              </div>
              <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <h3 className="er-serif" style={{ margin: 0, fontSize: 21, fontWeight: 500, lineHeight: 1.2 }}>{w.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: C.inkSoft, lineHeight: 1.55 }}>{w.body}</p>
                {w.note && <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.accentD }}>{w.note}</p>}
                <div style={{ marginTop: "auto", paddingTop: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <button className="er-btn er-btn-primary er-btn-sm" onClick={w.act}>{w.cta} <Arrow size={14} /></button>
                  <button type="button" className="er-link" onClick={w.more} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: C.muted }}>See how →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
/* Homepage sections as one slider, so the page stays short. Tabs, arrows and swipe. */
function HomeSlides({ onCreator, onShare, onAffiliate, onListPage }) {
  // Manual only: tabs, arrows, dots and swipe (no auto-advance).
  const [i, setI] = useState(0); const touch = useRef(null); const top = useRef(null);
  const slides = [
    ["How it works", <ThreeWaysSlide onCreator={onCreator} onShare={onShare} onAffiliate={onAffiliate} onListPage={onListPage} />],
    ["Make a list", (
    <section style={{ background: C.panel, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <div className="er-wrap" style={{ padding: "64px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: 34, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          <span className="er-eyebrow">Real creator page</span>
          <h2 className="er-serif" style={{ margin: "10px 0 8px", fontSize: "clamp(26px,4vw,42px)", fontWeight: 500, letterSpacing: "-.01em" }}>One link in your bio. Every recommendation pays.</h2>
          <p style={{ margin: 0, fontSize: 16, color: C.muted, lineHeight: 1.55 }}>Build a list of the brands you love and share it wherever you post. Here's a live creator page.</p>
        </div>
        <BioMock />
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button className="er-btn er-btn-primary" onClick={onCreator}>Create my page free <Arrow size={16} /></button>
        </div>
      </div>
    </section>
    )],
    ["Share & earn", <ShareStorySlide onShare={onShare} />],
    ["Create content", <CreatorVideos limit={3} eyebrow="Create content" title="Interested in creating content? Get your affiliate link" sub="For serious creators, bloggers, YouTubers and more. Make posts, reels and videos about brands you love with your own affiliate link, and earn a commission on every sale." cta={["Get my affiliate link", onAffiliate]} />],
    ["Big payouts", <BigPayouts onCreator={onCreator} />],
  ];
  const n = slides.length;
  const go = (k, scroll) => { setI((k + n) % n); if (scroll && top.current) top.current.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const arrow = (dir) => <button type="button" aria-label={dir < 0 ? "Previous" : "Next"} onClick={() => go(i + dir)} style={{ flexShrink: 0, width: 38, height: 38, borderRadius: "50%", border: `1px solid ${C.line}`, background: "#fff", display: "grid", placeItems: "center", cursor: "pointer", color: C.ink }}>{dir < 0 ? <ChevL size={18} /> : <ChevR size={18} />}</button>;
  return (
    <div ref={top} style={{ scrollMarginTop: 70 }}>
      <div className="er-wrap" style={{ padding: "26px 22px 14px", display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
        {arrow(-1)}
        <div className="er-ways-tabs" role="tablist" style={{ flexWrap: "nowrap", overflowX: "auto", maxWidth: "100%" }}>
          {slides.map(([t], k) => <button key={t} role="tab" aria-selected={i === k} onClick={() => go(k)} className={`er-ways-tab${i === k ? " on" : ""}`} style={{ whiteSpace: "nowrap" }}>{t}</button>)}
        </div>
        {arrow(1)}
      </div>
      <div key={i} className="er-slide" onTouchStart={(e) => { touch.current = e.touches[0].clientX; }} onTouchEnd={(e) => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 60) go(i + (dx < 0 ? 1 : -1)); }}>
        {slides[i][1]}
      </div>
      <div className="er-wrap" style={{ padding: "16px 22px 30px", display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <div style={{ display: "flex", gap: 6 }}>{slides.map((_, k) => <button key={k} aria-label={`Slide ${k + 1}`} onClick={() => go(k, true)} style={{ position: "relative", overflow: "hidden", width: i === k ? 28 : 8, height: 8, borderRadius: 99, border: "none", padding: 0, background: i === k ? C.ink : C.line, cursor: "pointer", transition: "width .2s" }}>
        </button>)}</div>
        <button className="er-btn er-btn-ghost er-btn-sm" onClick={() => go(i + 1, true)}>Next: {slides[(i + 1) % n][0]} <ChevR size={14} /></button>
      </div>
    </div>
  );
}
function Landing({ creators, session, onList, onCreator, onAdmin, onProfile, onLogin, onLogout, onMyProfile, onMyBiz, onSettings, onLegal, onBusinessPage, onInfluencerPage, onBrands, onShare, onAffiliate, onListPage }) {
  const top = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const [joinOpen, setJoinOpen] = useState(false);
  return (
    <div>
      {joinOpen && <JoinChooser onClose={() => setJoinOpen(false)} onCreator={onCreator} onList={onList} />}
      <button onClick={onCreator} style={{ display: "block", width: "100%", border: "none", cursor: "pointer", fontFamily: "inherit", background: C.ink, color: C.paper, textAlign: "center", fontSize: 13.5, fontWeight: 600, padding: "9px 16px", letterSpacing: ".01em" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center", flexWrap: "wrap" }}><Spark size={14} /> Get paid for sharing recommendations →</span>
      </button>
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(253,252,250,.82)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
        <div className="er-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <button onClick={top} style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}><Seal size={20} /><span className="er-serif" style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.01em", color: C.ink, whiteSpace: "nowrap" }}>Easy Recommend</span></button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {session ? <>
              {session.role === "creator"
                ? <button className="er-btn er-btn-ghost er-btn-sm" onClick={onMyProfile}>My profile</button>
                : <button className="er-btn er-btn-ghost er-btn-sm" onClick={onMyBiz}>My business</button>}
              <button className="er-btn er-btn-ghost er-btn-sm er-hide-sm" onClick={onShare}>Share &amp; earn</button>
              <button className="er-btn er-btn-ghost er-btn-sm" onClick={onSettings}>Settings</button>
              <button className="er-btn er-btn-ghost er-btn-sm" onClick={onLogout}>Log out</button>
            </> : <>
              <button className="er-btn er-btn-ghost er-btn-sm er-hide-sm" onClick={onShare}>Share &amp; earn</button>
              <button className="er-btn er-btn-ghost er-btn-sm er-hide-sm" onClick={onBusinessPage}>For business</button>
              <button className="er-btn er-btn-ghost er-btn-sm er-hide-sm" onClick={onInfluencerPage}>For creators</button>
              <button className="er-btn er-btn-ghost er-btn-sm" onClick={onLogin}>Log in</button>
              <button className="er-btn er-btn-primary er-btn-sm" onClick={() => setJoinOpen(true)}>Join</button>
            </>}
          </div>
        </div>
      </header>

      <LumaHero title={<>Share what<br />you love,<br /><span className="er-luma-grad">get paid.</span></>} onCreator={onCreator} onList={onList} onShare={onShare} link={["Are you a brand? See more", onBrands]}
        sub="Three ways to earn: make a list of brands you love, share a brand on your story, or create content with your affiliate link. Get a commission on every sale." />
      <BrandStrip label="Recommend 1,000+ brands, including" />

      <HomeSlides onCreator={onCreator} onShare={onShare} onAffiliate={onAffiliate} onListPage={onListPage} />

      <footer style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="er-wrap" style={{ padding: "44px 22px 6px", display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
          <div style={{ minWidth: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}><Seal size={18} /><span className="er-serif" style={{ fontSize: 18, fontWeight: 600 }}>Easy Recommend</span></div>
            <p style={{ margin: "10px 0 0", fontSize: 13.5, color: C.muted, lineHeight: 1.5, maxWidth: 260 }}>A network where creators earn on the businesses they actually trust.</p>
          </div>
          {[
            { h: "For creators", links: [["Join as a creator", onCreator], ["Creator log in", onLogin]] },
            { h: "For businesses", links: [["List your business", onList], ["Business log in", onLogin]] },
            { h: "Explore", links: [["Share a brand & earn", onShare], ["Affiliate links for creators", onAffiliate], ["For businesses", onBusinessPage], ["For creators", onInfluencerPage], ["Back to top", () => window.scrollTo({ top: 0, behavior: "smooth" })]] },
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
.er-how2{display:grid;grid-template-columns:1fr;gap:48px}
.er-hero-2col{display:grid;grid-template-columns:1fr;gap:44px;align-items:center}
.er-cards{display:grid;grid-template-columns:1fr;gap:18px}
.er-creators{display:grid;grid-template-columns:1fr;gap:14px}
.er-stepwork{display:grid;grid-template-columns:1fr;gap:0}
.er-videos-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;max-width:780px;margin:0 auto}
.er-vid-tile{flex:0 0 calc(33.333% - 8px);max-width:240px;text-align:left}
.er-vid-play{opacity:1;transition:opacity .15s ease}
.er-vid-tile:hover .er-vid-play{opacity:0}
@keyframes er-spin{to{transform:rotate(360deg)}}
@keyframes er-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.er-spin{animation:er-spin .9s linear infinite}
@media(min-width:560px){.er-modal-overlay{align-items:center;padding:18px}.er-modal{border-radius:22px}}
@media(max-width:559px){.er-nav{display:none}.er-hide-sm{display:none}}
@media(max-width:400px){.er-hide-xs{display:none}}
@media(min-width:680px){.er-cards{grid-template-columns:1fr 1fr}.er-creators{grid-template-columns:1fr 1fr}.er-videos-grid{grid-template-columns:1fr 1fr}}
@media(min-width:1000px){.er-cards{grid-template-columns:1fr 1fr 1fr}.er-hero{grid-template-columns:1.05fr .95fr;gap:60px}.er-stepwork{grid-template-columns:1fr 1fr 1fr}.er-videos-grid{grid-template-columns:1fr 1fr 1fr}.er-how2{grid-template-columns:1fr 1fr;gap:64px}.er-hero-2col{grid-template-columns:1.1fr .9fr;gap:56px}}
.er-root{overflow-x:hidden}
/* Luma-style hero. Designed on a 1440px canvas; --u is one design pixel, scaled down below 1440px. */
.er-luma{--u:min(1px, 100vw / 1440);position:relative;overflow:hidden;background:#fff;height:calc(680 * var(--u));-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
.er-luma-tile{position:absolute;box-sizing:border-box;padding:calc(9 * var(--u));border-radius:calc(13 * var(--u));background:linear-gradient(180deg,#F5F5F5 0%,#EFEFEF 55%,#E6E6E6 100%);border:.5px solid rgba(0,0,0,.16);box-shadow:0 calc(10 * var(--u)) calc(24 * var(--u)) rgba(0,0,0,.12);animation:er-lfloat 8s ease-in-out infinite;pointer-events:none}
.er-luma-tile img{display:block;width:100%;height:100%;object-fit:cover;border-radius:calc(5 * var(--u))}
@keyframes er-lfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(calc(-6 * var(--u)))}}
.er-luma-fade{position:absolute;left:0;right:0;top:calc(575 * var(--u));bottom:0;background:linear-gradient(180deg,rgba(255,255,255,0) 0%,#fff 100%);pointer-events:none;z-index:1}
.er-luma-copy{position:absolute;left:0;right:0;top:calc(134 * var(--u));text-align:center;z-index:2;padding:0 16px}
.er-luma-h1{font-family:'Inter',-apple-system,system-ui,sans-serif;font-optical-sizing:auto;margin:0;font-size:calc(76 * var(--u));line-height:calc(74 * var(--u));font-weight:560;letter-spacing:-.012em;color:#131517}
.er-luma-grad{background:linear-gradient(90deg,#C83BB3 0%,#E22C91 24%,#F1277A 36%,#F3455A 43%,#F57737 55%,#EE9137 68%,#E9AA38 81%,#E9AA38 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
.er-luma-sub{font-family:'Inter',-apple-system,system-ui,sans-serif;margin:calc(27 * var(--u)) auto 0;max-width:calc(520 * var(--u));font-size:calc(18.8 * var(--u));line-height:calc(30 * var(--u));font-weight:400;color:#8D8E8F}
.er-luma-pill.er-luma-pill-btn{border:none;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:background .15s}.er-luma-pill.er-luma-pill-btn:hover{background:#E6E6E8}
.er-luma-pill{display:inline-block;margin-top:calc(16 * var(--u));padding:calc(5 * var(--u)) calc(13 * var(--u));border-radius:999px;background:#F2F2F3;color:#131517;font-family:'Inter',-apple-system,system-ui,sans-serif;font-size:calc(13.5 * var(--u));font-weight:600}
.er-luma-actions{margin-top:calc(22 * var(--u));display:flex;gap:calc(12 * var(--u));justify-content:center;flex-wrap:wrap}
.er-luma-cta2{display:inline-flex;align-items:center;gap:calc(7 * var(--u));height:calc(45 * var(--u));padding:0 calc(20 * var(--u));border:1px solid #D6D6DA;border-radius:999px;background:#fff;color:#131517;font-family:'Inter',-apple-system,system-ui,sans-serif;font-size:calc(17 * var(--u));font-weight:500;cursor:pointer}
.er-luma-cta{margin-top:0;height:calc(45 * var(--u));padding:0 calc(19 * var(--u));border:none;border-radius:999px;background:#131517;color:#fff;font-family:'Inter',-apple-system,system-ui,sans-serif;font-size:calc(17 * var(--u));font-weight:500;cursor:pointer}
.er-luma-or{align-self:center;font-family:'Inter',-apple-system,system-ui,sans-serif;font-size:calc(15 * var(--u));font-weight:600;color:#A1A2A3;text-transform:uppercase;letter-spacing:.08em}
@media(max-width:560px){.er-luma-or{font-size:13px;flex-basis:100%;text-align:center;margin:-2px 0}}
.er-luma-cta2.er-luma-ig{border:none;color:#fff;background:linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%);box-shadow:0 4px 16px rgba(214,41,118,.3);font-weight:600}
.er-luma-link:hover{color:#131517}
.er-luma-link{margin-top:calc(19 * var(--u));display:inline-flex;align-items:center;gap:calc(6 * var(--u));background:none;border:none;padding:0;cursor:pointer;font-family:'Inter',-apple-system,system-ui,sans-serif;font-size:calc(16 * var(--u));line-height:calc(24 * var(--u));font-weight:500;color:#A1A2A3}
@media(prefers-reduced-motion:reduce){.er-luma-tile{animation:none}}
@keyframes er-slide-in{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}.er-slide{animation:er-slide-in .28s ease}@media (prefers-reduced-motion: reduce){.er-slide{animation:none}}
@media(max-width:560px){.er-prof-actions{flex-direction:row !important;flex-wrap:wrap;align-items:center !important;width:100%}}
@keyframes er-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes er-pulse{0%,100%{opacity:1}50%{opacity:.55}}.er-skel{animation:er-pulse 1.2s ease-in-out infinite}
@keyframes er-frame-in{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}.er-frame{animation:er-frame-in .35s ease}
@keyframes er-pop-in{from{opacity:0;translate:0 8px}to{opacity:1;translate:0 0}}.er-pop{animation:er-pop-in .4s ease .5s both}
@keyframes er-up-in{from{transform:translateY(100%)}to{transform:none}}.er-up{animation:er-up-in .45s ease .35s both}
@keyframes er-tap-k{0%,100%{transform:scale(.6);opacity:0}40%{transform:scale(1);opacity:1}70%{transform:scale(.85);opacity:.8}}.er-tap{animation:er-tap-k 1.4s ease .2s infinite;pointer-events:none}
@keyframes er-type-k{from{max-width:0}to{max-width:100%}}.er-type{display:inline-block;overflow:hidden;vertical-align:bottom;white-space:nowrap;animation:er-type-k 1.2s steps(30) .3s both}
.er-howto-steps{margin-top:22px;display:grid;gap:10px;grid-template-columns:1fr}@media(min-width:760px){.er-howto-steps{grid-template-columns:repeat(3,1fr)}}
.er-howto{grid-template-columns:1fr}@media(min-width:760px){.er-howto{grid-template-columns:1.2fr 1fr}}
@keyframes er-toast-in{from{opacity:0;transform:translate(-50%,16px)}to{opacity:1;transform:translate(-50%,0)}}
.er-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:90;max-width:min(92vw,420px);background:#111;color:#fff;border-radius:14px;padding:16px 22px;font-size:16.5px;font-weight:800;line-height:1.35;text-align:center;box-shadow:0 12px 30px rgba(0,0,0,.3);animation:er-toast-in .25s ease}
.er-ways-tabs{display:inline-flex;gap:4px;padding:4px;background:#fff;border:1px solid ${C.line};border-radius:999px;flex-wrap:wrap;justify-content:center}
.er-ways-tab{border:none;background:none;cursor:pointer;font-family:inherit;font-size:14px;font-weight:600;color:${C.inkSoft};padding:9px 16px;border-radius:999px}
.er-ways-tab.on{background:${C.ink};color:${C.paper}}
.er-ways-grid{margin-top:30px;display:grid;grid-template-columns:1fr;gap:32px;align-items:center}
@media(min-width:900px){.er-ways-grid{grid-template-columns:1fr 1fr;gap:56px}}
@media(max-width:760px){
  .er-luma{height:auto;padding:56px 0 64px}
  .er-luma-tile,.er-luma-fade{display:none}
  .er-luma-copy{position:static}
  .er-luma-h1{font-size:48px;line-height:47px}
  .er-luma-sub{margin-top:22px;max-width:340px;font-size:17px;line-height:26px}
  .er-luma-pill{margin-top:14px;padding:5px 12px;font-size:13px}
  .er-luma-actions{margin-top:20px;gap:10px}
  .er-luma-cta,.er-luma-cta2{height:46px;padding:0 20px;font-size:16px}
  .er-luma-link{margin-top:16px;font-size:15px;line-height:22px;gap:6px}
}
.er-root button:focus-visible,.er-root input:focus-visible,.er-root a:focus-visible{outline:2px solid ${C.accent};outline-offset:2px}
@media(prefers-reduced-motion:reduce){.er-root *{transition:none!important}}
`;

/* ---------- Root ---------- */
/* ===========================================================================
   RetentionBase, marketing site, rendered at "/". Reuses the shared tokens,
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
    body: "Recruits the right creators, hands each a tracked link, and pays only when a referral converts. No flat fees, no agencies, performance only.",
    points: ["Finds + vets creators by niche", "Tracked links, per-sale attribution", "Pays on conversion, not posts"],
    link: SITE_URL + "/Commision", cta: "See Influencer" },
  { key: "messaging", tag: "Lifecycle", name: "Messaging Agent", color: "#2D5B8E", bg: "#E7EDF6", icon: Chat,
    line: "Extremely personalized SMS & email.",
    body: "Writes and sends one-to-one messages that read like a human wrote them for that customer, timed to behavior, not a blast calendar.",
    points: ["Per-customer copy, not templates", "Triggered by real behavior", "SMS + email in one thread"] },
  { key: "churn", tag: "Retention", name: "Churn Agent", color: "#B5572E", bg: "#F6E8DF", icon: Pulse,
    line: "Detect churn early, by listening.",
    body: "Reads the quiet signals (usage dips, sentiment, support tone) and flags an at-risk customer before they leave, then steps in with a save.",
    points: ["Listens across product + support", "Risk scores days ahead", "Auto-launches save plays"] },
  { key: "answer", tag: "Discovery", name: "Answer-Engine Agent", color: "#6C3FA0", bg: "#EFE8F6", icon: Search,
    line: "Get featured on ChatGPT.",
    body: "Optimizes how your brand is described across the web so AI assistants recommend you when buyers ask, the new front page of search.",
    points: ["Structures your AI-readable story", "Targets assistant answers", "Tracks share-of-answer"] },
  { key: "referral", tag: "Growth", name: "Referral Agent", color: "#0E7C86", bg: "#E2F1F2", icon: Share,
    line: "AI-driven referrals on autopilot.",
    body: "Spots your happiest customers, picks the perfect moment, and invites them to refer with an offer tuned to each person, then closes the loop.",
    points: ["Finds advocates automatically", "Personalized invites + offers", "Reward only on success"] },
];
// Videos for the homepage. Files in public/: /video1.mp4 … /video18.mp4, with
// posters /image1.jpeg … /image18.jpeg. Plays on hover (desktop) / tap (mobile).
// Luma hero tile slots, measured from luma.com at 1440px: image box [x, y, w, h] in design px.
const LUMA_TILES = [
  [557, -120, 195, 195], // top-centre, bleeds off the top
  [284, 66, 134, 134],   // upper-left
  [1044, 16, 146, 146],  // upper-right
  [77, 192, 102, 102],   // mid-left, small
  [166, 295, 164, 164],  // lower-left, large
  [1249, 186, 129, 129], // far right
  [1000, 312, 120, 120], // right of centre
  [1140, 422, 142, 136], // lower-right
  [-27, 494, 140, 140],  // bottom-left, cut by the left edge
  [373, 636, 147, 147],  // bottom row (faded)
  [810, 624, 212, 212],  // bottom row, large (faded)
];
const ER_VIDEOS = [13, 14, 15, 16, 17, 18, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({ src: `/video${n}.mp4`, poster: `/image${n}.jpeg`, title: "" }));

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
        <p style={{ margin: "20px auto 0", maxWidth: 560, fontSize: "clamp(16px,2.2vw,19px)", lineHeight: 1.5, color: C.inkSoft }}>Same team, same product, new name and a new home. You can now find us at <b style={{ color: C.ink }}>easyrecommend.co</b>.</p>
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
      l.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:opsz,wght@14..32,100..900&display=swap";
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
    ["7. SMS / text-message program", "If you provide a mobile number, you consent to receive account and activity text messages from Easy Recommend, for example, one-time verification codes and notices when a creator requests a commission. Message frequency varies. Message and data rates may apply. Reply STOP to opt out of non-essential texts and HELP for help. Opting out of transactional messages such as verification codes may limit your ability to use parts of the Service. Carriers are not liable for delayed or undelivered messages."],
    ["8. Cookies, local storage & tracking", ["Strictly necessary: keep you signed in (we store a session token in your browser's local storage) and remember your cookie choice. The Service cannot function without these.", "Preference: remember settings and choices you make.", "Analytics: help us understand how the Service is used so we can improve it.", "We do not use cookies to sell your personal data. You can accept or decline non-essential cookies in our banner, and you can clear cookies and local storage in your browser at any time; doing so may sign you out or reset preferences."]],
    ["9. Payments", "One-time plan payments are processed by our third-party payment processor, Stripe. Card details are submitted directly to Stripe's secure checkout; we do not collect or store full card numbers on our servers. Stripe processes your payment information under its own privacy policy and security standards (PCI-DSS). We retain limited records of transactions (such as plan, amount, and a charge reference) for accounting and refund purposes."],
    ["10. How we share information", ["Between users of the Service: when a creator requests a commission, the relevant brand sees the creator's username, follower count, and request details; public listings and creator profiles are visible to other users and visitors.", "Service providers: vendors who host our infrastructure, send SMS/email, and process payments, acting on our instructions.", "Legal and safety: when required by law, to respond to legal process, or to protect the rights, safety, and security of users, the public, or Easy Recommend.", "Business transfers: in connection with a merger, acquisition, financing, or sale of assets, subject to this policy.", "We do not sell your personal information."]],
    ["11. Data retention", "We keep personal data for as long as your account is active or as needed to provide the Service, then for any additional period required to comply with legal, tax, accounting, or dispute-resolution obligations. When you delete your account, we remove your profile and associated links, reviews, and commission requests, though some records (such as transaction logs) may be retained where required. Backups are purged on a rolling schedule."],
    ["12. Data security", "We use reasonable technical and organizational measures to protect personal data, including encrypted connections (HTTPS), access controls, and tokenized authentication. No method of transmission or storage is completely secure, so we cannot guarantee absolute security. Please keep your account and device credentials confidential and notify us of any suspected unauthorized access."],
    ["13. Your rights and choices", ["Access, correct, or update most details from Account settings.", "Delete your account at any time from Account settings, which removes your profile and related data.", "Opt out of non-essential SMS (reply STOP) and manage cookies via our banner and your browser.", "Depending on where you live, you may also have rights to access, port, restrict, or object to processing, and to lodge a complaint with a supervisory authority. To exercise these, contact us at ronak@retentionbase.com; we may need to verify your identity before responding."]],
    ["14. California privacy rights", "If you are a California resident, the CCPA/CPRA gives you rights to know what personal information we collect, to access and delete it, to correct inaccuracies, and to opt out of the \"sale\" or \"sharing\" of personal information. We do not sell or share personal information as those terms are defined, and we do not discriminate against you for exercising your rights. Submit requests to ronak@retentionbase.com."],
    ["15. European & UK users", "If you are in the EEA, UK, or Switzerland, you have rights under the GDPR/UK GDPR described in Section 13, including access, rectification, erasure, restriction, portability, and objection. Where we transfer data outside your region, we rely on appropriate safeguards such as standard contractual clauses."],
    ["16. International data transfers", "We and our service providers may process and store information in countries other than the one in which you live, including the United States. Where required, we put safeguards in place to protect your information consistent with this policy and applicable law."],
    ["17. Children's privacy", "The Service is not directed to children, and we do not knowingly collect personal information from anyone under 18. If you believe a minor has provided us information, contact us and we will delete it."],
    ["18. Third-party links and services", "The Service may contain links to third-party sites and products (for example, a brand's website or a creator's social profiles). We are not responsible for the privacy practices of those third parties; review their policies before providing information."],
    ["19. Changes to this policy", "We may update this policy from time to time. When we make material changes, we will update the \"Last updated\" date and, where appropriate, provide additional notice. Your continued use of the Service after changes take effect constitutes acceptance of the updated policy."],
    ["20. Contact us", "Questions, requests, or complaints about this policy or your data? Email us at ronak@retentionbase.com and we'll be glad to help."],
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
      <SettingRow label={isCreator ? "Username" : "Sign-in"} value={isCreator ? `@${session.username}` : (session.phone || session.email || "-")} />
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
  const [businesses, setBusinesses] = useState(() => (cachedBusinesses() || []).filter((b) => b && b.name && b.name.trim()));
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
  const [detailId, setDetailId] = useState(null); const [detailMode, setDetailMode] = useState(null);
  useEffect(() => { const h = (e) => { setDetailMode(null); setDetailId(e.detail); }; window.addEventListener("er:open-business", h); return () => window.removeEventListener("er:open-business", h); }, []);

  const login = (s) => { saveSession(s); setSessionState(s); };
  const logout = () => { clearSession(); setSessionState(null); setView("home"); nav("/"); };
  const [legalOpen, setLegalOpen] = useState(false);
  const goSettings = () => { setView("settings"); nav("/settings"); };
  const goBusinessPage = () => { setView("business"); nav("/business"); window.scrollTo(0, 0); };
  const goInfluencerPage = () => { setView("influencers"); nav("/influencers"); window.scrollTo(0, 0); };
  const goBrands = () => { setView("brands"); nav("/brands"); window.scrollTo(0, 0); };
  const goShare = () => { setView("share"); nav("/share"); window.scrollTo(0, 0); };
  const goAffiliate = () => { setView("affiliate"); nav("/affiliate"); window.scrollTo(0, 0); };
  const goListPage = () => { setView("listpage"); nav("/list"); window.scrollTo(0, 0); };

  useEffect(() => {
    try { if (!sessionStorage.getItem("er_pv")) { sessionStorage.setItem("er_pv", "1"); api("/pageview", { method: "POST" }).catch(() => {}); } } catch (e) {}
    const f = document.createElement("link"); f.rel = "stylesheet";
    f.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:opsz,wght@14..32,100..900&display=swap";
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
      // Brands first (most pages need them); creators load separately so they never hold brands up.
      api("/creators").then((cr) => setCreators(cr || [])).catch(() => {});
      const bz = await fetchBusinesses("");
      setBusinesses(bz.filter((b) => b && b.name && b.name.trim())); setError(""); setVer((v) => v + 1);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);
  // Visitors arriving from a brand's "Share & earn" button: ?earn=<businessId>&mode=share|aff
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search); const earn = q.get("earn"); if (!earn) return;
      const mode = q.get("mode") === "aff" ? "aff" : "share";
      window.history.replaceState({}, "", window.location.pathname);
      const sNow = getSession();
      if (sNow && sNow.role === "creator") { setDetailMode(mode); setDetailId(earn); }
      else { setCreatorPreselect(earn); setCreatorOpen(true); }
    } catch (e) {}
  }, []);

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
      <GlobalAlerts />
      {view === "home" && <Landing businesses={businesses} creators={creators} loading={loading} error={error} session={session}
        onList={() => setBrandOpen(true)} onCreator={() => { setCreatorPreselect(null); setCreatorOpen(true); }} onAdmin={goAdmin} onProfile={goProfile} onOpenBusiness={(id) => setDetailId(id)}
        onLogin={() => setLoginOpen(true)} onLogout={logout} onMyProfile={() => session && goProfile(session.username)} onMyBiz={() => { setView("mybiz"); nav("/my-business"); }} onSettings={goSettings} onLegal={() => setLegalOpen(true)} onBusinessPage={goBusinessPage} onInfluencerPage={goInfluencerPage} onBrands={goBrands} onShare={goShare} onAffiliate={goAffiliate} onListPage={goListPage} />}
      {view === "claim" && <ClaimPage />}
      {view === "listpage" && <ListPage session={session} onHome={goHome} onLogin={() => setLoginOpen(true)} onLegal={() => setLegalOpen(true)} onCreator={() => { setCreatorPreselect(null); setCreatorOpen(true); }} />}
      {view === "affiliate" && <AffiliatePage session={session} onHome={goHome} onLogin={() => setLoginOpen(true)} onAuth={login} onLegal={() => setLegalOpen(true)} />}
      {view === "share" && <SharePage session={session} onHome={goHome} onLogin={() => setLoginOpen(true)} onAuth={login} onLegal={() => setLegalOpen(true)} />}
      {view === "brands" && <BrandsPage onHome={goHome} onList={() => setBrandOpen(true)} onCreator={() => { setCreatorPreselect(null); setCreatorOpen(true); }} onLogin={() => setLoginOpen(true)} onLegal={() => setLegalOpen(true)} />}
      {view === "business" && <BusinessPage onHome={goHome} onList={() => setBrandOpen(true)} onCreator={() => { setCreatorPreselect(null); setCreatorOpen(true); }} onLogin={() => setLoginOpen(true)} onLegal={() => setLegalOpen(true)} />}
      {view === "influencers" && <InfluencerPage onHome={goHome} onCreator={() => { setCreatorPreselect(null); setCreatorOpen(true); }} onList={() => setBrandOpen(true)} onLogin={() => setLoginOpen(true)} onLegal={() => setLegalOpen(true)} />}
      {view === "admin" && <AdminPanel onBack={goHome} onRefresh={refresh} />}
      {view === "mybiz" && session && <MyBusiness session={session} onBack={goHome} onRefresh={refresh} />}
      {view === "settings" && session && <AccountSettings session={session} onBack={goHome} onLogout={logout} onEditProfile={() => goProfile(session.username)} onMyBiz={() => { setView("mybiz"); nav("/my-business"); }} onLegal={() => setLegalOpen(true)} onDeleted={() => { logout(); }} />}
      {view === "settings" && !session && <Landing businesses={businesses} creators={creators} loading={loading} error={error} session={session} onList={() => setBrandOpen(true)} onCreator={() => { setCreatorPreselect(null); setCreatorOpen(true); }} onAdmin={goAdmin} onProfile={goProfile} onOpenBusiness={(id) => setDetailId(id)} onLogin={() => setLoginOpen(true)} onLogout={logout} onMyProfile={() => {}} onMyBiz={() => {}} onSettings={goSettings} onLegal={() => setLegalOpen(true)} onBusinessPage={goBusinessPage} onInfluencerPage={goInfluencerPage} onBrands={goBrands} onShare={goShare} onAffiliate={goAffiliate} onListPage={goListPage} />}
      {view === "profile" && <InfluencerProfile handle={profileHandle} session={session} onAuth={login} dataVersion={ver} onBack={goHome} onBrowse={goHome} onOpenBusiness={(id) => setDetailId(id)} onAddBrand={() => { setCreatorPreselect(null); setCreatorOpen(true); }} onRefresh={refresh} onCreator={() => { setCreatorPreselect(null); setCreatorOpen(true); }} onList={() => setBrandOpen(true)} />}

      <CookieBar onLearnMore={() => setLegalOpen(true)} />
      {legalOpen && <LegalModal onClose={() => setLegalOpen(false)} />}

      {detailId != null && <BusinessDetail id={detailId} autoLink={detailMode} onAuth={login} onClose={() => { setDetailId(null); setDetailMode(null); }} onProfile={(h) => { setDetailId(null); goProfile(h); }} onRecommend={(id) => { setDetailId(null); setCreatorPreselect(id); setCreatorOpen(true); }} />}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onLogin={login} onAfterCreator={(u) => { setLoginOpen(false); goProfile(u); }} onAfterBrand={() => { setLoginOpen(false); setView("mybiz"); nav("/my-business"); }} />}
      {brandOpen && <BrandModal onClose={() => setBrandOpen(false)} onDone={(name) => { setBrandOpen(false); setBrandDone(name); }} onRefresh={refresh} onLogin={login} />}
      {brandDone && <BrandSuccess name={brandDone} onClose={() => setBrandDone(null)} onDashboard={() => { setBrandDone(null); setView("mybiz"); nav("/my-business"); }} />}
      {creatorOpen && <CreatorModal businesses={businesses} initialBusinessId={creatorPreselect} onClose={() => setCreatorOpen(false)} onRefresh={refresh} onLogin={login} onViewProfile={goProfile} />}
    </div>
  );
}

/* ===========================================================================
   Top-level router, Easy Recommend is the main site (the influencer landing).
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