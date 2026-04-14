// src/App.jsx
import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:9000/refer';

function App() {
  const [mode, setMode] = useState('create'); // 'create' or 'public'
  const [code, setCode] = useState(null);
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [shareLink, setShareLink] = useState('');

  // Create form state
  const [createData, setCreateData] = useState({
    username: '', email: '', password: '', companyName: '',
    rewards: [], contactEmail: '', calendlyLink: ''
  });

  // Public share state
  const [sharerName, setSharerName] = useState('');

  // Detect mode and code from URL on mount
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/refer/')) {
      const extractedCode = path.split('/refer/')[1]?.trim();
      if (extractedCode) {
        setCode(extractedCode);
        setMode('public');
        fetchProgram(extractedCode);
      }
    }
    // else: stays in 'create' mode
  }, []);

  const fetchProgram = async (programCode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${programCode}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Program not found');
      setProgram(data.program);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Create program handlers ────────────────────────────────────
  const handleCreateChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setCreateData(prev => ({
        ...prev,
        rewards: checked ? [...prev.rewards, value] : prev.rewards.filter(r => r !== value)
      }));
    } else {
      setCreateData(prev => ({ ...prev, [name]: value }));
    }
  };

  const createProgram = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/register-program`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setShareLink(data.programLink);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Public share handlers ──────────────────────────────────────
  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!sharerName.trim()) return setError('Name is required');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${code}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sharerName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setShareLink(data.personalShareLink);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      alert('Link copied to clipboard!');
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', background: 'white', padding: 40, borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>

        <h1 style={{ textAlign: 'center', marginBottom: 32 }}>
          {mode === 'create' ? 'Create Your Referral Program' : 'Referral Program'}
        </h1>

        {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>{error}</div>}
        {loading && <div style={{ textAlign: 'center', marginBottom: 20 }}>Loading...</div>}

        {/* ── CREATE MODE ── */}
        {mode === 'create' && !success && (
          <form onSubmit={createProgram}>
            <input name="username" placeholder="Username" value={createData.username} onChange={handleCreateChange} required style={inputStyle} />
            <input name="email" type="email" placeholder="Email" value={createData.email} onChange={handleCreateChange} required style={inputStyle} />
            <input name="password" type="password" placeholder="Password" value={createData.password} onChange={handleCreateChange} required style={inputStyle} />
            <input name="companyName" placeholder="Company Name" value={createData.companyName} onChange={handleCreateChange} required style={inputStyle} />

            <div style={{ margin: '20px 0' }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Rewards (select all that apply)</label>
              {['$500 credit', 'Free month', '10% revenue share', 'Custom gift'].map(r => (
                <label key={r} style={{ display: 'block', margin: '8px 0' }}>
                  <input type="checkbox" value={r} checked={createData.rewards.includes(r)} onChange={handleCreateChange} />
                  {r}
                </label>
              ))}
            </div>

            <input name="contactEmail" type="email" placeholder="Contact Email" value={createData.contactEmail} onChange={handleCreateChange} required style={inputStyle} />
            <input name="calendlyLink" placeholder="Calendly Link (optional)" value={createData.calendlyLink} onChange={handleCreateChange} style={inputStyle} />

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? 'Creating...' : 'Create & Get Link'}
            </button>
          </form>
        )}

        {mode === 'create' && success && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#2e7d32' }}>Program Created!</h2>
            <p>Your share link:</p>
            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, wordBreak: 'break-all', margin: '20px 0' }}>
              {shareLink}
            </div>
            <button onClick={copyLink} style={{ padding: 12, background: '#000', color: 'white', border: 'none', borderRadius: 8, marginRight: 12 }}>
              Copy Link
            </button>
            <a href={shareLink} target="_blank" rel="noopener noreferrer" style={{ padding: 12, background: '#0066cc', color: 'white', borderRadius: 8, textDecoration: 'none' }}>
              Open Public Page
            </a>
          </div>
        )}

        {/* ── PUBLIC MODE ── */}
        {mode === 'public' && !success && program && (
          <div>
            <h2 style={{ textAlign: 'center', marginBottom: 24 }}>{program.companyName}</h2>
            <p style={{ textAlign: 'center', color: '#555', marginBottom: 32 }}>Referred by {program.founderName}</p>

            <p style={{ marginBottom: 16 }}>Contact: {program.contactEmail}</p>
            {program.calendlyLink && (
              <p><a href={program.calendlyLink} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>Book a call with founder</a></p>
            )}

            <form onSubmit={handleShareSubmit} style={{ marginTop: 40 }}>
              <input
                placeholder="Your name"
                value={sharerName}
                onChange={e => setSharerName(e.target.value)}
                required
                style={inputStyle}
              />
              <button type="submit" disabled={loading} style={buttonStyle}>
                {loading ? 'Generating...' : 'Share this referral'}
              </button>
            </form>
          </div>
        )}

        {mode === 'public' && success && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <h2 style={{ color: '#2e7d32' }}>Your share link is ready!</h2>
            <p style={{ margin: '16px 0' }}>{shareLink}</p>
            <button onClick={copyLink} style={{ padding: 12, background: '#000', color: 'white', border: 'none', borderRadius: 8, marginRight: 12 }}>
              Copy Link
            </button>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`} target="_blank" rel="noopener noreferrer" style={{ padding: 12, background: '#0077b5', color: 'white', borderRadius: 8, textDecoration: 'none' }}>
              Share on LinkedIn
            </a>
          </div>
        )}

        {mode === 'public' && !program && !loading && !error && (
          <p style={{ textAlign: 'center', color: '#888' }}>Loading program details...</p>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '12px 16px',
  marginBottom: 16,
  border: '1px solid #ddd',
  borderRadius: 8,
  fontSize: 16,
};

const buttonStyle = {
  width: '100%',
  padding: 14,
  background: '#000',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 8,
};

export default App;