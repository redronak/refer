import { useState, useEffect } from "react";

/* ============================================================================
   RetentionBase — the complete stack of AI agents for growth & retention.
   Single-file React landing. No external packages, no Tailwind: inline styles
   plus one injected <style> block, fonts loaded at runtime (Georgia/system
   fallback). Drop into a CRA app and render <App />.
   ============================================================================ */

const C = {
  ink: "#16181D", inkSoft: "#33373F", paper: "#FBFAF8", panel: "#F1F0EC",
  line: "#E4E2DB", muted: "#6B6F78", accent: "#0F6B4F", accentD: "#0A4F3A",
  accentSoft: "#E4F0EA",
};
const SERIF = "'Fraunces','Georgia',serif";
const SUPPORT = "hello@retentionbase.com";
const API_BASE = /localhost|127\.0\.0\.1/.test(window.location.hostname)
  ? "http://localhost:9000/easyrecommend"
  : "https://learntok-backend-2026-24c204fe508e.herokuapp.com/easyrecommend";

/* ---------- Icons ---------- */
const Svg = ({ size = 22, children, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);
const Arrow = (p) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
const ChevR = (p) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>;
const Check = (p) => <Svg {...p}><path d="M20 6L9 17l-5-5" /></Svg>;
const Spark = (p) => <Svg {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /></Svg>;
const Users = (p) => <Svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6.1M17.5 19a5.5 5.5 0 0 0-3-4.9" /></Svg>;
const Chat = (p) => <Svg {...p}><path d="M4 5h16v11H8l-4 4V5Z" /><path d="M8 9.5h8M8 12.5h5" /></Svg>;
const Pulse = (p) => <Svg {...p}><path d="M3 12h4l2.5-6 4 13 2.5-7H21" /></Svg>;
const Search = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Svg>;
const Share = (p) => <Svg {...p}><circle cx="6" cy="12" r="2.6" /><circle cx="17" cy="6" r="2.6" /><circle cx="17" cy="18" r="2.6" /><path d="M8.3 10.8l6.4-3.5M8.3 13.2l6.4 3.5" /></Svg>;
const Bolt = (p) => <Svg {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8Z" /></Svg>;
const Close = (p) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
const Seal = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="11" fill={C.accent} /><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/* ---------- The agent stack ---------- */
const AGENTS = [
  {
    key: "influencer", tag: "Advocacy", name: "Influencer Agent", color: "#0F6B4F", bg: "#E4F0EA", icon: Users,
    line: "Commission-based influence, fully automated.",
    body: "Recruits the right creators, hands each a tracked link, and pays only when a referral converts. No flat fees, no agencies — performance only.",
    points: ["Finds + vets creators by niche", "Tracked links, per-sale attribution", "Pays on conversion, not posts"],
  },
  {
    key: "messaging", tag: "Lifecycle", name: "Messaging Agent", color: "#2D5B8E", bg: "#E7EDF6", icon: Chat,
    line: "Extremely personalized SMS & email.",
    body: "Writes and sends one-to-one messages that read like a human wrote them for that customer — timed to behavior, not a blast calendar.",
    points: ["Per-customer copy, not templates", "Triggered by real behavior", "SMS + email in one thread"],
  },
  {
    key: "churn", tag: "Retention", name: "Churn Agent", color: "#B5572E", bg: "#F6E8DF", icon: Pulse,
    line: "Detect churn early — by listening.",
    body: "Reads the quiet signals (usage dips, sentiment, support tone) and flags an at-risk customer before they leave, then steps in with a save.",
    points: ["Listens across product + support", "Risk scores days ahead", "Auto-launches save plays"],
  },
  {
    key: "answer", tag: "Discovery", name: "Answer-Engine Agent", color: "#6C3FA0", bg: "#EFE8F6", icon: Search,
    line: "Get featured on ChatGPT.",
    body: "Optimizes how your brand is described across the web so AI assistants recommend you when buyers ask — the new front page of search.",
    points: ["Structures your AI-readable story", "Targets assistant answers", "Tracks share-of-answer"],
  },
  {
    key: "referral", tag: "Growth", name: "Referral Agent", color: "#0E7C86", bg: "#E2F1F2", icon: Share,
    line: "AI-driven referrals on autopilot.",
    body: "Spots your happiest customers, picks the perfect moment, and invites them to refer with an offer tuned to each person — then closes the loop.",
    points: ["Finds advocates automatically", "Personalized invites + offers", "Reward only on success"],
  },
];

const STATS = [
  ["5", "agents, one stack"],
  ["24/7", "always-on retention"],
  ["−30%", "typical churn cut*"],
  ["+3.4×", "referral lift*"],
];

const STEPS = [
  { t: "Connect your stack", d: "Plug in your store, billing, CRM, and inbox in minutes. The agents read your data — they don't need a new system of record." },
  { t: "Agents go to work", d: "Each agent runs continuously: recruiting advocates, messaging customers, watching for churn, and shaping how AI describes you." },
  { t: "You watch retention climb", d: "One dashboard, one source of truth. Approve plays, set guardrails, and let the stack compound week over week." },
];

/* ---------- Bits ---------- */
function Btn({ children, kind = "primary", as = "button", href, onClick, style }) {
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
    </div>
  );
}

/* ---------- Book a demo ---------- */
function DemoModal({ onClose }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [done, setDone] = useState(false);
  useEffect(() => { const k = (e) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const valid = name.trim() && /\S+@\S+\.\S+/.test(email);
  const submit = async () => {
    if (!valid) { setErr("Please enter your name and a valid email."); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${API_BASE}/demo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, source: "RetentionBase" }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "Something went wrong — please try again."); }
      setDone(true);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(22,24,29,.5)", backdropFilter: "blur(3px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="rb-card" style={{ width: "100%", maxWidth: 440, padding: 28, position: "relative" }}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 16, right: 16, width: 34, height: 34, borderRadius: "50%", border: `1px solid ${C.line}`, background: "#fff", cursor: "pointer", display: "grid", placeItems: "center", color: C.muted }}><Close size={16} /></button>
        {done ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ margin: "0 auto", width: 52, height: 52, display: "grid", placeItems: "center" }}><Seal size={48} /></div>
            <h2 className="rb-serif" style={{ margin: "14px 0 0", fontSize: 24, fontWeight: 500 }}>You're on the list</h2>
            <p style={{ margin: "8px 0 0", fontSize: 14.5, color: C.muted, lineHeight: 1.5 }}>Thanks, {name.split(" ")[0]} — we got your request and will reach out at <b style={{ color: C.ink }}>{email}</b> to set up your demo.</p>
            <button className="rb-btn rb-btn-primary" style={{ marginTop: 22, width: "100%" }} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <span className="rb-eyebrow">Book a demo</span>
            <h2 className="rb-serif" style={{ margin: "8px 0 4px", fontSize: 25, fontWeight: 500 }}>See the stack in action</h2>
            <p style={{ margin: "0 0 18px", fontSize: 14, color: C.muted }}>Leave your details and we'll be in touch to walk you through the agents.</p>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.inkSoft, marginBottom: 6 }}>Name</label>
            <input className="rb-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.inkSoft, margin: "14px 0 6px" }}>Work email</label>
            <input className="rb-input" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
            {err && <p style={{ margin: "12px 0 0", fontSize: 13, color: "#9B3024", background: "#FBE9E7", border: "1px solid #F3C5BD", borderRadius: 10, padding: "10px 12px" }}>{err}</p>}
            <button className="rb-btn rb-btn-primary" style={{ marginTop: 18, width: "100%" }} disabled={busy} onClick={submit}>{busy ? "Sending…" : <>Request a demo <Arrow size={16} /></>}</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
function Page() {
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = () => setDemoOpen(true);
  return (
    <div className="rb-root">
      {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}
      {/* Nav */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(251,250,248,.86)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
        <div className="rb-wrap" style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
            <Seal size={21} /><span className="rb-serif" style={{ fontSize: 19.5, fontWeight: 600, letterSpacing: "-.01em", color: C.ink, whiteSpace: "nowrap" }}>RetentionBase</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="rb-nav rb-hide-sm" onClick={() => document.getElementById("rb-agents")?.scrollIntoView({ behavior: "smooth" })}>The agents</button>
            <button className="rb-nav rb-hide-sm" onClick={() => document.getElementById("rb-how")?.scrollIntoView({ behavior: "smooth" })}>How it works</button>
            <Btn kind="primary" onClick={openDemo} style={{ padding: "10px 16px", fontSize: 14 }}>Book a demo</Btn>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="rb-wrap" style={{ padding: "72px 22px 56px" }}>
        <div style={{ maxWidth: 880 }}>
          <span className="rb-eyebrow">One platform · five AI agents</span>
          <h1 className="rb-serif" style={{ margin: "16px 0 0", fontSize: "clamp(40px,6.4vw,68px)", lineHeight: 1.02, fontWeight: 500, letterSpacing: "-.02em", color: C.ink }}>The complete stack of AI agents for retention &amp; growth.</h1>
          <p style={{ margin: "22px 0 0", fontSize: "clamp(17px,2.2vw,20px)", lineHeight: 1.5, color: C.inkSoft, maxWidth: 620 }}>
            RetentionBase runs the agents that find your advocates, message every customer like a human would, catch churn before it happens, and get you recommended where buyers now search — ChatGPT included.
          </p>
          <div style={{ marginTop: 30, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Btn kind="primary" onClick={openDemo}>Get started <Arrow size={17} /></Btn>
            <Btn kind="ghost" onClick={() => document.getElementById("rb-agents")?.scrollIntoView({ behavior: "smooth" })}>See the agents</Btn>
          </div>
          <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: C.muted }}><Seal size={17} /> Works on top of the stack you already run.</div>
        </div>

        {/* Stack chips */}
        <div style={{ marginTop: 44, display: "flex", flexWrap: "wrap", gap: 10 }}>
          {AGENTS.map((a) => { const Icon = a.icon;
            return <div key={a.key} style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "9px 14px 9px 10px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff" }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, display: "grid", placeItems: "center", background: a.bg, color: a.color }}><Icon size={15} /></span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{a.name}</span>
            </div>; })}
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: C.ink }}>
        <div className="rb-wrap" style={{ padding: "44px 22px", display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", textAlign: "center" }}>
          {STATS.map(([n, l]) => (
            <div key={l}>
              <div className="rb-serif" style={{ fontSize: "clamp(30px,4.5vw,44px)", fontWeight: 500, color: C.paper, letterSpacing: "-.02em" }}>{n}</div>
              <div style={{ marginTop: 4, fontSize: 13, color: "rgba(251,250,248,.66)" }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Agents */}
      <section id="rb-agents" className="rb-wrap" style={{ padding: "72px 22px", scrollMarginTop: 70 }}>
        <span className="rb-eyebrow">The stack</span>
        <h2 className="rb-serif" style={{ margin: "10px 0 0", fontSize: "clamp(28px,4vw,42px)", fontWeight: 500, letterSpacing: "-.01em", color: C.ink }}>Five agents. One job: keep customers, and bring more.</h2>
        <p style={{ margin: "10px 0 0", fontSize: 16, color: C.muted, maxWidth: 620 }}>Each agent is useful alone and compounding together — they share the same customer graph, so a churn signal can trigger a save, and a happy customer can trigger a referral.</p>
        <div className="rb-agents-grid" style={{ marginTop: 32 }}>
          {AGENTS.map((a) => <AgentCard key={a.key} a={a} />)}
          <div className="rb-card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", background: C.ink, color: C.paper }}>
            <span style={{ width: 46, height: 46, borderRadius: 13, display: "grid", placeItems: "center", background: "rgba(255,255,255,.1)", color: C.paper }}><Bolt size={22} /></span>
            <h3 className="rb-serif" style={{ margin: "16px 0 0", fontSize: 21, fontWeight: 500 }}>One brain behind them all</h3>
            <p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "rgba(251,250,248,.74)" }}>Every agent reads from — and writes to — the same shared customer graph. Insights from one become actions in another, automatically.</p>
            <div style={{ marginTop: 18 }}><Btn kind="light" onClick={openDemo}>Book a demo <Arrow size={16} /></Btn></div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="rb-how" style={{ background: C.panel, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, scrollMarginTop: 70 }}>
        <div className="rb-wrap" style={{ padding: "72px 22px" }}>
          <span className="rb-eyebrow">How it works</span>
          <h2 className="rb-serif" style={{ margin: "10px 0 28px", fontSize: "clamp(28px,4vw,42px)", fontWeight: 500, letterSpacing: "-.01em", color: C.ink }}>Live in a day. Compounding from there.</h2>
          <div className="rb-steps">
            {STEPS.map((s, i) => (
              <div key={i} style={{ padding: "26px 24px 26px 0", borderTop: `1px solid ${C.ink}` }}>
                <span className="rb-eyebrow">0{i + 1}</span>
                <h3 className="rb-serif" style={{ margin: "12px 0 6px", fontSize: 22, fontWeight: 500, color: C.ink }}>{s.t}</h3>
                <p style={{ margin: 0, fontSize: 14.5, color: C.muted, lineHeight: 1.55 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="rb-wrap" style={{ padding: "72px 22px 80px" }}>
        <div style={{ background: C.ink, borderRadius: 24, padding: "60px 32px", textAlign: "center" }}>
          <h2 className="rb-serif" style={{ margin: 0, color: C.paper, fontSize: "clamp(28px,4.5vw,46px)", fontWeight: 500, letterSpacing: "-.01em" }}>Put your retention on autopilot.</h2>
          <p style={{ margin: "14px auto 0", maxWidth: 460, color: "rgba(251,250,248,.74)", fontSize: 16.5 }}>Spin up the full agent stack and let it work the moment your data is connected.</p>
          <div style={{ marginTop: 26, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn kind="light" onClick={openDemo}>Get started <Arrow size={16} /></Btn>
            <Btn kind="outline" onClick={openDemo}>Talk to us</Btn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="rb-wrap" style={{ padding: "44px 22px 6px", display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
          <div style={{ minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}><Seal size={19} /><span className="rb-serif" style={{ fontSize: 18, fontWeight: 600 }}>RetentionBase</span></div>
            <p style={{ margin: "10px 0 0", fontSize: 13.5, color: C.muted, lineHeight: 1.5, maxWidth: 260 }}>The complete stack of AI agents for retention and growth.</p>
            <a href={`mailto:${SUPPORT}`} className="rb-foot-link" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 13.5, color: C.inkSoft, fontWeight: 500, textDecoration: "none" }}><Chat size={14} /> {SUPPORT}</a>
          </div>
          {[
            { h: "Agents", links: AGENTS.map((a) => [a.name, () => document.getElementById("rb-agents")?.scrollIntoView({ behavior: "smooth" })]) },
            { h: "Company", links: [["How it works", () => document.getElementById("rb-how")?.scrollIntoView({ behavior: "smooth" })], ["Book a demo", openDemo], ["Back to top", () => window.scrollTo({ top: 0, behavior: "smooth" })]] },
          ].map((col) => (
            <div key={col.h}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft }}>{col.h}</p>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 9, alignItems: "flex-start" }}>
                {col.links.map(([label, fn]) => <button key={label} onClick={fn} className="rb-foot-link" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, color: C.muted, textAlign: "left" }}>{label}</button>)}
              </div>
            </div>
          ))}
        </div>
        <div className="rb-wrap" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", padding: "26px 22px", marginTop: 22, borderTop: `1px solid ${C.line}` }}>
          <p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>© {new Date().getFullYear()} RetentionBase · Keep more of the customers you earn</p>
          <p style={{ margin: 0, fontSize: 11.5, color: C.muted }}>*Illustrative figures.</p>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Styles ---------- */
const STYLES = `
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
.rb-card{background:#fff;border:1px solid ${C.line};border-radius:18px;padding:24px}
.rb-agent{transition:transform .15s ease,box-shadow .15s ease}
.rb-agent:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(22,24,29,.08)}
.rb-agents-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.rb-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.rb-foot-link:hover{color:${C.ink}}
.rb-input{width:100%;font-family:inherit;font-size:15px;color:${C.ink};background:#fff;border:1px solid ${C.line};border-radius:11px;padding:12px 14px;outline:none}
.rb-input:focus{border-color:${C.accent};box-shadow:0 0 0 3px ${C.accentSoft}}
@media(max-width:900px){.rb-agents-grid{grid-template-columns:repeat(2,1fr)}.rb-steps{grid-template-columns:1fr}}
@media(max-width:560px){.rb-agents-grid{grid-template-columns:1fr}.rb-hide-sm{display:none}}
`;

export default function App() {
  useEffect(() => {
    if (!document.getElementById("rb-fonts")) {
      const l = document.createElement("link"); l.id = "rb-fonts"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";
      document.head.appendChild(l);
    }
    if (!document.getElementById("rb-styles")) {
      const s = document.createElement("style"); s.id = "rb-styles"; s.textContent = STYLES;
      document.head.appendChild(s);
    }
  }, []);
  return <Page />;
}