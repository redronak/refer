// src/App.jsx
import { useState, useEffect } from 'react';

const API_BASE = 'https://learntok-backend-2026-24c204fe508e.herokuapp.com/refer';

// ─── Global CSS ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #f8f7f4; font-family: 'Geist', sans-serif; color: #1a1814; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #f0ede8; }
  ::-webkit-scrollbar-thumb { background: #c8c3bc; border-radius: 4px; }

  ::placeholder { color: #b0a99e !important; }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes pulse-dot {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%       { transform: scale(0.6); opacity: 0.4; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1); }
  }

  .rp-fade-up   { animation: fadeUp 0.45s ease both; }
  .rp-fade-up-1 { animation: fadeUp 0.45s 0.06s ease both; }
  .rp-fade-up-2 { animation: fadeUp 0.45s 0.12s ease both; }
  .rp-fade-up-3 { animation: fadeUp 0.45s 0.18s ease both; }

  /* ─ Input ─ */
  .rp-input {
    width: 100%;
    padding: 12px 14px;
    border: 1.5px solid #e8e3dc;
    border-radius: 9px;
    font-size: 14px;
    color: #1a1814;
    font-family: 'Geist', sans-serif;
    background: #f8f7f4;
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
    appearance: none;
  }
  .rp-input:focus {
    border-color: #1a1814;
    box-shadow: 0 0 0 3px rgba(26,24,20,0.06);
    background: #ffffff;
  }

  /* ─ Checkbox ─ */
  .rp-checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border: 1.5px solid #e8e3dc;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: #4a4540;
    transition: all 0.15s;
    background: #f8f7f4;
    user-select: none;
  }
  .rp-checkbox-label:hover { border-color: #1a1814; background: #ffffff; }
  .rp-checkbox-label.checked { border-color: #1a1814; background: #f0ede8; color: #1a1814; }
  .rp-checkbox-label input { display: none; }
  .rp-check-box {
    width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0;
    border: 1.5px solid #b0a99e; background: #fff; display: flex;
    align-items: center; justify-content: center; transition: all 0.15s;
  }
  .rp-checkbox-label.checked .rp-check-box { border-color: #1a1814; background: #1a1814; }

  /* ─ Buttons ─ */
  .rp-btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 13px;
    background: #1a1814; border: none; border-radius: 9px;
    color: #fff; font-family: 'Geist', sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; letter-spacing: 0.01em; transition: background 0.15s, transform 0.1s;
  }
  .rp-btn-primary:hover:not(:disabled) { background: #2d2a26; transform: translateY(-1px); }
  .rp-btn-primary:disabled { background: #c8c3bc; cursor: not-allowed; }

  .rp-btn-ghost {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 18px; background: #ffffff; border: 1.5px solid #e8e3dc;
    border-radius: 9px; color: #4a4540; font-family: 'Geist', sans-serif;
    font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none;
    transition: all 0.15s; white-space: nowrap;
  }
  .rp-btn-ghost:hover { border-color: #1a1814; background: #f0ede8; }

  /* ─ Share text box ─ */
  .rp-share-text {
    width: 100%; padding: 14px; background: #f8f7f4; border: 1.5px solid #e8e3dc;
    border-radius: 9px; font-family: 'Geist', sans-serif; font-size: 13px;
    color: #4a4540; line-height: 1.65; resize: none; outline: none;
    transition: border-color 0.15s;
  }
  .rp-share-text:focus { border-color: #1a1814; }

  .rp-copy-btn {
    padding: 9px 16px; background: #1a1814; border: none; border-radius: 7px;
    color: #fff; font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 700;
    cursor: pointer; transition: background 0.15s; white-space: nowrap;
    letter-spacing: 0.05em;
  }
  .rp-copy-btn:hover { background: #2d2a26; }
  .rp-copy-btn.copied { background: #15803d; }

  /* ─ Cards ─ */
  .rp-card {
    background: #ffffff; border: 1px solid #e8e3dc; border-radius: 12px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .rp-reward-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 12px; background: #f0ede8; border: 1px solid #e8e3dc;
    border-radius: 100px; font-size: 12px; font-weight: 600; color: #4a4540;
  }

  /* ─ Responsive ─ */
  @media (max-width: 640px) {
    .rp-nav { padding: 0 20px !important; }
    .rp-page { padding: 32px 20px 64px !important; }
    .rp-hero { padding-bottom: 32px !important; margin-bottom: 36px !important; }
    .rp-share-actions { flex-direction: column !important; }
    .rp-share-actions a, .rp-share-actions button { width: 100% !important; justify-content: center !important; }
    .rp-success-actions { flex-wrap: wrap !important; }
    .rp-success-actions a, .rp-success-actions button { flex: 1 1 calc(50% - 6px) !important; justify-content: center !important; min-width: 130px; }
  }
`;

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#f8f7f4', surface: '#ffffff', border: '#e8e3dc',
  ink: '#1a1814', inkMid: '#4a4540', inkLight: '#8c847a', inkFaint: '#b0a99e',
  accentBg: '#f0ede8', green: '#15803d', greenBg: '#f0fdf4',
  red: '#b91c1c', redBg: '#fef3f2',
};
const F = { serif: "'Instrument Serif', Georgia, serif", sans: "'Geist', sans-serif" };

// ─── Reward options ───────────────────────────────────────────────────────────
const REWARD_OPTIONS = [
  '$500 credit', 'Free month', '10% revenue share', 'Custom gift',
];

// ─── Audience options ─────────────────────────────────────────────────────────
const AUDIENCE_OPTIONS = [
  'SaaS Founders', 'Revenue Leaders', 'Customer Success Teams',
  'Product Managers', 'Sales Ops', 'Marketing Teams',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
);

function Label({ children, required }) {
  return (
    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.inkLight, marginBottom: '7px' }}>
      {children} {required && <span style={{ color: C.red }}>*</span>}
    </div>
  );
}

function FieldGroup({ label, required, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <Label required={required}>{label}</Label>
      {children}
    </div>
  );
}

function ErrorBanner({ msg }) {
  return msg ? (
    <div style={{ padding: '11px 14px', background: C.redBg, border: `1px solid #fecaca`, borderRadius: '8px', fontSize: '13px', color: C.red, fontWeight: 500, marginBottom: '20px', display: 'flex', gap: '8px' }}>
      <span>⚠</span> {msg}
    </div>
  ) : null;
}

// ─── Build share text ─────────────────────────────────────────────────────────
function buildShareText(program, founderName, link) {
  const rewards = program?.rewards?.length ? program.rewards.join(', ') : 'exclusive rewards';
  const audience = program?.audience?.length
    ? `If you work in ${program.audience.join(' or ')}, this is for you.`
    : '';
  return `I've been using ${program?.companyName || 'this platform'} and wanted to share it with you.\n\n${audience ? audience + '\n\n' : ''}When you sign up through my link, you'll get access to their offer — ${rewards}.\n\n${founderName ? `Referred by ${founderName}.\n\n` : ''}Sign up here: ${link}`;
}

// ─── Panel wrapper ────────────────────────────────────────────────────────────
function Panel({ icon, iconBg, iconColor, title, sub, children }) {
  return (
    <div className="rp-card" style={{ overflow: 'hidden', marginBottom: '20px' }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: C.ink }}>{title}</div>
          {sub && <div style={{ fontSize: '11px', color: C.inkFaint, marginTop: '1px' }}>{sub}</div>}
        </div>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

// ─── Copy button with state ───────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [status, setStatus] = useState('COPY');
  const copy = () => {
    navigator.clipboard.writeText(text);
    setStatus('COPIED!');
    setTimeout(() => setStatus('COPY'), 2000);
  };
  return <button className={`rp-copy-btn${status !== 'COPY' ? ' copied' : ''}`} onClick={copy}>{status}</button>;
}

// ─── Share actions bar ────────────────────────────────────────────────────────
function ShareActions({ link, shareText }) {
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const liUrl    = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
  return (
    <div>
      <Label>Share your link</Label>
      {/* Link copy row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: C.accentBg, border: `1px solid ${C.border}`, borderRadius: '9px', padding: '11px 14px', marginBottom: '14px' }}>
        <code style={{ flex: 1, fontSize: '12px', color: C.inkMid, fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>{link}</code>
        <CopyBtn text={link} />
      </div>

      {/* Copyable share text */}
      <Label>Suggested message (edit freely)</Label>
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <textarea className="rp-share-text" readOnly rows={6} value={shareText} onClick={e => e.target.select()} />
        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
          <CopyBtn text={shareText} />
        </div>
      </div>

      {/* Social buttons */}
      <div className="rp-share-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <a className="rp-btn-ghost" href={tweetUrl} target="_blank" rel="noopener noreferrer">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          Post on X
        </a>
        <a className="rp-btn-ghost" href={liUrl} target="_blank" rel="noopener noreferrer">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          Share on LinkedIn
        </a>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode]         = useState('create');
  const [code, setCode]         = useState(null);
  const [program, setProgram]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(false);
  const [shareLink, setShareLink] = useState('');

  const [createData, setCreateData] = useState({
    username: '', email: '', password: '', companyName: '',
    rewards: [], audience: [], contactEmail: '', calendlyLink: '',
  });

  const [sharerName, setSharerName] = useState('');

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/refer/')) {
      const extracted = path.split('/refer/')[1]?.trim();
      if (extracted) { setCode(extracted); setMode('public'); fetchProgram(extracted); }
    }
  }, []);

  const fetchProgram = async (programCode) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/${programCode}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Program not found');
      setProgram(data.program);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleCreateChange = (e) => {
    const { name, value,  checked } = e.target;
    if (name === 'rewards') {
      setCreateData(prev => ({ ...prev, rewards: checked ? [...prev.rewards, value] : prev.rewards.filter(r => r !== value) }));
    } else if (name === 'audience') {
      setCreateData(prev => ({ ...prev, audience: checked ? [...prev.audience, value] : prev.audience.filter(r => r !== value) }));
    } else {
      setCreateData(prev => ({ ...prev, [name]: value }));
    }
    setError(null);
  };

  const createProgram = async (e) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/register-program`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setShareLink(data.programLink); setSuccess(true);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!sharerName.trim()) return setError('Name is required');
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/${code}/share`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sharerName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setShareLink(data.personalShareLink); setSuccess(true);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // Share text for create-mode success
  const creatorShareText = buildShareText({ ...createData }, createData.username, shareLink);
  // Share text for public-mode success
  const publicShareText  = buildShareText(program, sharerName, shareLink);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F.sans, color: C.ink }}>

        {/* ── Topbar ── */}
        <nav className="rp-nav" style={{ position: 'sticky', top: 0, zIndex: 100, background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 48px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: '18px', color: C.ink }}>RetentionBase</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a', animation: 'pulse-dot 2s infinite', display: 'inline-block' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#16a34a', textTransform: 'uppercase' }}>Live</span>
          </div>
        </nav>

        <div className="rp-page" style={{ maxWidth: '680px', margin: '0 auto', padding: '52px 32px 80px' }}>

          {/* ── Hero ── */}
          <div className="rp-hero rp-fade-up" style={{ marginBottom: '44px', borderBottom: `1px solid ${C.border}`, paddingBottom: '40px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.inkLight, marginBottom: '10px' }}>
              {mode === 'create' ? 'Referral Program' : 'You\'ve Been Referred'}
            </p>
            <h1 style={{ fontFamily: F.serif, fontSize: 'clamp(34px, 6vw, 54px)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.0, color: C.ink, letterSpacing: '-0.025em' }}>
              {mode === 'create'
                ? <>Create your<br /><span style={{ fontStyle: 'normal' }}>referral program</span></>
                : program
                  ? <>{program.companyName}<br /><span style={{ fontStyle: 'normal', fontSize: '0.65em', color: C.inkMid }}>via {program.founderName}</span></>
                  : <>Loading…</>
              }
            </h1>
            {mode === 'create' && (
              <p style={{ fontSize: '14px', color: C.inkMid, lineHeight: 1.65, marginTop: '14px', maxWidth: '480px' }}>
                Set up your program in minutes. Define your rewards, target audience, and get a shareable link instantly.
              </p>
            )}
            {mode === 'public' && program && !success && (
              <p style={{ fontSize: '14px', color: C.inkMid, lineHeight: 1.65, marginTop: '14px' }}>
                {program.contactEmail && <>Contact: <a href={`mailto:${program.contactEmail}`} style={{ color: C.ink, fontWeight: 600 }}>{program.contactEmail}</a></>}
                {program.calendlyLink && <>{' · '}<a href={program.calendlyLink} target="_blank" rel="noopener noreferrer" style={{ color: C.ink, fontWeight: 600 }}>Book a call →</a></>}
              </p>
            )}
          </div>

          {/* Loading */}
          {loading && mode === 'public' && !program && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: C.inkLight, fontSize: '13px', padding: '32px 0' }}>
              <div style={{ width: '18px', height: '18px', border: `2px solid ${C.border}`, borderTop: `2px solid ${C.ink}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Loading program details…
            </div>
          )}

          <ErrorBanner msg={error} />

          {/* ════════════════════════════════════════════════════════
              CREATE MODE — FORM
          ════════════════════════════════════════════════════════ */}
          {mode === 'create' && !success && (
            <form onSubmit={createProgram} className="rp-fade-up-1">
              <Panel icon="◎" iconBg={C.accentBg} iconColor={C.inkMid} title="Account Details" sub="Your login credentials">
                <FieldGroup label="Username" required>
                  <input className="rp-input" name="username" placeholder="yourhandle" value={createData.username} onChange={handleCreateChange} required />
                </FieldGroup>
                <FieldGroup label="Email" required>
                  <input className="rp-input" name="email" type="email" placeholder="you@company.com" value={createData.email} onChange={handleCreateChange} required />
                </FieldGroup>
                <FieldGroup label="Password" required>
                  <input className="rp-input" name="password" type="password" placeholder="Create a password" value={createData.password} onChange={handleCreateChange} required />
                </FieldGroup>
              </Panel>

              <Panel icon="◈" iconBg={C.accentBg} iconColor={C.inkMid} title="Program Details" sub="What you're offering and who it's for">
                <FieldGroup label="Company Name" required>
                  <input className="rp-input" name="companyName" placeholder="Acme Inc." value={createData.companyName} onChange={handleCreateChange} required />
                </FieldGroup>

                <FieldGroup label="Rewards" required>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '8px' }}>
                    {REWARD_OPTIONS.map(r => (
                      <label key={r} className={`rp-checkbox-label${createData.rewards.includes(r) ? ' checked' : ''}`}>
                        <input type="checkbox" name="rewards" value={r} checked={createData.rewards.includes(r)} onChange={handleCreateChange} />
                        <span className="rp-check-box">
                          {createData.rewards.includes(r) && (
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                        </span>
                        {r}
                      </label>
                    ))}
                  </div>
                </FieldGroup>

                <FieldGroup label="Target Audience">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '8px' }}>
                    {AUDIENCE_OPTIONS.map(a => (
                      <label key={a} className={`rp-checkbox-label${createData.audience.includes(a) ? ' checked' : ''}`}>
                        <input type="checkbox" name="audience" value={a} checked={createData.audience.includes(a)} onChange={handleCreateChange} />
                        <span className="rp-check-box">
                          {createData.audience.includes(a) && (
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                        </span>
                        {a}
                      </label>
                    ))}
                  </div>
                </FieldGroup>

                <FieldGroup label="Contact Email" required>
                  <input className="rp-input" name="contactEmail" type="email" placeholder="contact@company.com" value={createData.contactEmail} onChange={handleCreateChange} required />
                </FieldGroup>

                <FieldGroup label="Calendly Link">
                  <input className="rp-input" name="calendlyLink" placeholder="https://calendly.com/yourname" value={createData.calendlyLink} onChange={handleCreateChange} />
                </FieldGroup>
              </Panel>

              <button type="submit" disabled={loading} className="rp-btn-primary rp-fade-up-2">
                {loading ? <><Spinner /> Creating program…</> : <>Create Program & Get Link →</>}
              </button>
            </form>
          )}

          {/* ════════════════════════════════════════════════════════
              CREATE MODE — SUCCESS
          ════════════════════════════════════════════════════════ */}
          {mode === 'create' && success && (
            <div className="rp-fade-up">
              <Panel icon="✓" iconBg={C.greenBg} iconColor={C.green} title="Program created!" sub="Your referral program is live — share it anywhere">
                <ShareActions link={shareLink} shareText={creatorShareText} />
              </Panel>

              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill={C.inkFaint} style={{ marginTop: '1px', flexShrink: 0 }}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                <p style={{ fontSize: '12px', color: C.inkFaint, lineHeight: 1.6 }}>
                  Anyone who visits your public link can generate their own personal share link and help grow your program virally.
                </p>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              PUBLIC MODE — FORM
          ════════════════════════════════════════════════════════ */}
          {mode === 'public' && program && !success && (
            <div className="rp-fade-up-1">
              {/* Rewards */}
              {program.rewards?.length > 0 && (
                <Panel icon="✦" iconBg={C.accentBg} iconColor={C.inkMid} title="What you'll get" sub="Rewards for people you refer">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {program.rewards.map(r => (
                      <span key={r} className="rp-reward-chip">✓ {r}</span>
                    ))}
                  </div>
                </Panel>
              )}

              {/* Audience */}
              {program.audience?.length > 0 && (
                <Panel icon="◉" iconBg={C.accentBg} iconColor={C.inkMid} title="Best suited for" sub="Who this program is designed for">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {program.audience.map(a => (
                      <span key={a} className="rp-reward-chip">{a}</span>
                    ))}
                  </div>
                </Panel>
              )}

              {/* Get your link */}
              <Panel icon="◈" iconBg={C.accentBg} iconColor={C.inkMid} title="Get your personal referral link" sub="Enter your name to generate a trackable link">
                <form onSubmit={handleShareSubmit}>
                  <FieldGroup label="Your Name" required>
                    <input className="rp-input" placeholder="Your full name" value={sharerName} onChange={e => { setSharerName(e.target.value); setError(null); }} required autoFocus />
                  </FieldGroup>
                  <button type="submit" disabled={loading} className="rp-btn-primary" style={{ marginTop: '4px' }}>
                    {loading ? <><Spinner /> Generating…</> : <>Generate My Share Link →</>}
                  </button>
                </form>
              </Panel>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              PUBLIC MODE — SUCCESS
          ════════════════════════════════════════════════════════ */}
          {mode === 'public' && success && (
            <div className="rp-fade-up">
              <Panel icon="✓" iconBg={C.greenBg} iconColor={C.green} title="Your link is ready!" sub={`Share it to refer people to ${program?.companyName}`}>
                <ShareActions link={shareLink} shareText={publicShareText} />
              </Panel>
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <footer style={{ borderTop: `1px solid ${C.border}`, background: C.surface }}>
          <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 32px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: '15px', color: C.ink }}>RetentionBase</span>
            <span style={{ fontSize: '12px', color: C.inkFaint }}>© 2024 RetentionBase</span>
          </div>
        </footer>

      </div>
    </>
  );
}