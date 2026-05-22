'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ASCII_ART = `
  ╔╦╗╦╔╗╔╦╦ ╦╔═╗╔═╗
  ║║║║║║║║╠═╣║ ║║ ╦
  ╩ ╩╩╝╚╝╩╩ ╩╚═╝╚═╝
`;

export default function SignInPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Registration failed');
          setLoading(false);
          return;
        }
        // Auto-login after register
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (loginRes.ok) {
          router.push('/dashboard');
          return;
        }
        setError('Registration successful. Please sign in.');
        setIsRegister(false);
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (res.ok) {
          router.push('/dashboard');
          return;
        }
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mh-signin">
      {/* Left panel */}
      <div className="left">
        <div className="brand">
          <div className="mark">▣</div>
          <span style={{ letterSpacing: '.04em' }}>MINIHOG</span>
        </div>
        <div className="ascii-art" style={{ marginTop: 60 }}>{ASCII_ART}</div>
        <div style={{ marginTop: 24 }}>
          <div className="mh-ascii-hr"><span>├</span><span className="lbl">platform</span><div className="line" /><span>┤</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {['event ingestion', 'funnel analysis', 'cohort retention', 'campaign attribution', 'api key management'].map(f => (
              <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: 'var(--fg-2)' }}>
                <span style={{ color: 'var(--acc)' }}>▸</span>
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="ascii-cap" style={{ marginTop: 'auto' }}>
          self-hosted · open-source · MIT licensed<br />
          <span style={{ color: 'var(--acc)' }}>v1.0.0</span> · no dark patterns, no lock-in
        </div>
      </div>

      {/* Right panel */}
      <div className="right">
        <div className="form">
          <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8 }}>
            {isRegister ? '$ minihog workspace create' : '$ minihog auth login'}
          </div>
          <h1>{isRegister ? 'Create workspace' : 'Sign in'}</h1>
          <div className="sub">
            {isRegister
              ? 'Start tracking events in under 5 minutes.'
              : 'Welcome back to your analytics console.'}
          </div>

          <form onSubmit={handleSubmit}>
            <label className="lbl">Username</label>
            <div className="mh-field">
              <span className="prompt">›</span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="your_username"
                required
                autoFocus
                autoComplete="username"
              />
            </div>

            {isRegister && (
              <>
                <label className="lbl">Email</label>
                <div className="mh-field">
                  <span className="prompt">›</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </>
            )}

            <label className="lbl">Password</label>
            <div className="mh-field">
              <span className="prompt">›</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="············"
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </div>

            {error && <div className="err">× {error}</div>}

            <div className="actions">
              <button type="submit" className="mh-btn primary" disabled={loading}>
                {loading ? <span className="mh-loading">working</span> : isRegister ? 'Create workspace →' : 'Sign in →'}
              </button>
              <button type="button" className="toggle" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
                {isRegister ? 'Already have an account?' : 'Need an account?'}
              </button>
            </div>
          </form>

          <Link href="/" className="back-link">← back to home</Link>
        </div>
      </div>
    </div>
  );
}
