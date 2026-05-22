'use client';

import { useState, useEffect } from 'react';
import { Panel, AsciiHr, Tag, ToastHost, ConfirmModal, toast } from '@/components/terminal';

interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
  key?: string;
}

export default function KeysPage() {
  const [name, setName] = useState('');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string; all?: boolean }>({ open: false });

  const loadKeys = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/keys', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setKeys(data.keys ?? []);
      else setError(data.error || 'Failed to load API keys');
    } catch {
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleGenerate = async () => {
    if (!name.trim()) return;
    setError('');
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewKey(data.key);
        setName('');
        loadKeys();
        toast('ok', 'API key generated successfully');
      } else {
        setError(data.error || 'Failed to generate key');
        toast('bad', data.error || 'Failed to generate key');
      }
    } catch {
      setError('Failed to generate API key');
      toast('bad', 'Failed to generate API key');
    }
  };

  const handleCopy = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      toast('ok', 'Key copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch(`/api/keys?id=${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        loadKeys();
        toast('warn', 'API key revoked');
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to revoke');
        toast('bad', d.error || 'Failed to revoke key');
      }
    } catch {
      setError('Failed to revoke key');
      toast('bad', 'Failed to revoke key');
    }
    setConfirm({ open: false });
  };

  const handleRevokeAll = async () => {
    try {
      const res = await fetch('/api/keys?all=true', { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        loadKeys();
        toast('warn', 'All API keys revoked');
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to revoke all');
        toast('bad', d.error || 'Failed to revoke all keys');
      }
    } catch {
      setError('Failed to revoke all');
      toast('bad', 'Failed to revoke all keys');
    }
    setConfirm({ open: false });
  };

  return (
    <>
      <ToastHost />

      <ConfirmModal
        open={confirm.open && !confirm.all}
        title="Revoke API Key"
        body={<>This key will stop working immediately. <strong>This cannot be undone.</strong></>}
        danger
        confirmLabel="Revoke key"
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => confirm.id && handleRevoke(confirm.id)}
      />

      <ConfirmModal
        open={confirm.open && !!confirm.all}
        title="Revoke All API Keys"
        body={<>All <strong>{keys.length}</strong> API keys will stop working immediately. Any SDKs using these keys will stop sending data.</>}
        danger
        confirmLabel="Revoke all keys"
        onCancel={() => setConfirm({ open: false })}
        onConfirm={handleRevokeAll}
      />

      <div>
        <div className="mh-page-head">
          <div>
            <div className="crumb">minihog · workspace</div>
            <h1>API Keys</h1>
            <div className="subtitle">Generate and manage authentication keys for event ingestion</div>
          </div>
          {keys.length > 0 && (
            <button className="mh-btn danger sm" onClick={() => setConfirm({ open: true, all: true })}>
              ⊗ Revoke All
            </button>
          )}
        </div>

        {error && (
          <div className="mh-tag bad" style={{ padding: '10px 14px', fontSize: 12, marginBottom: 20 }}>
            × {error}
          </div>
        )}

        {/* Generate new key */}
        <Panel title="Generate New Key" meta="one-time reveal" style={{ marginBottom: 16 }}>
          <div className="mh-row" style={{ gap: 8 }}>
            <div className="mh-field" style={{ flex: 1 }}>
              <span className="prompt">⌬</span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Key name (e.g. production, staging)"
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              />
            </div>
            <button
              className="mh-btn primary"
              onClick={handleGenerate}
              disabled={!name.trim()}
            >
              Generate →
            </button>
          </div>

          {newKey && (
            <div style={{ marginTop: 14, border: '1px dashed var(--acc-bd)', background: 'var(--acc-soft)', borderRadius: 'var(--rad)', padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--acc)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                ✓ Key generated — copy now, won't be shown again
              </div>
              <div className="mh-row" style={{ gap: 8 }}>
                <code style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--bd)', padding: '8px 12px', fontSize: 12, borderRadius: 'var(--rad)', color: 'var(--fg-hi)', wordBreak: 'break-all', fontFamily: 'var(--mono)' }}>
                  {newKey}
                </code>
                <button className="mh-btn sm" onClick={handleCopy}>
                  {copied ? '✓ Copied' : '⎘ Copy'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setNewKey(null)}
                style={{ background: 'none', border: 'none', color: 'var(--fg-3)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--mono)', marginTop: 10, padding: 0 }}
              >
                I've saved the key ×
              </button>
            </div>
          )}
        </Panel>

        <AsciiHr label="active keys" />

        {/* Keys table */}
        <Panel
          title="Your API Keys"
          meta={`${keys.length} key${keys.length !== 1 ? 's' : ''}`}
          right={keys.length > 0 ? <Tag>{keys.length} active</Tag> : undefined}
        >
          {loading ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-3)' }}>
              <span className="mh-loading">loading</span>
            </div>
          ) : keys.length === 0 ? (
            <div className="mh-muted-card">
              <div style={{ marginBottom: 8, color: 'var(--acc)', fontSize: 20 }}>⌬</div>
              No API keys yet. Generate your first key to start tracking events.
            </div>
          ) : (
            <table className="mh-t">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Key (masked)</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td style={{ color: 'var(--fg-hi)', fontWeight: 600 }}>{k.name}</td>
                    <td className="dim" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
                      mh_••••••••••••{k.id.slice(-4)}
                    </td>
                    <td className="dim" style={{ fontSize: 11 }}>
                      {new Date(k.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="mh-btn danger sm"
                        onClick={() => setConfirm({ open: true, id: k.id })}
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <AsciiHr label="usage" />

        <Panel title="SDK Usage" meta="quick reference">
          <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.6 }}>
            <div style={{ marginBottom: 12 }}>Send your API key in the <code style={{ background: 'var(--bg-2)', padding: '1px 6px', borderRadius: 2, color: 'var(--acc)', fontSize: 11 }}>X-API-Key</code> header:</div>
            <pre style={{ background: 'var(--bg)', border: '1px solid var(--bd)', padding: '12px', borderRadius: 'var(--rad)', fontSize: 11.5, color: 'var(--fg)', fontFamily: 'var(--mono)', margin: 0 }}>
{`import MiniHog from 'minihog-sdk';

MiniHog.init({
  apiKey: 'YOUR_API_KEY_HERE',
  environment: 'production',
});

MiniHog.track('signup', { plan: 'pro' });`}
            </pre>
          </div>
        </Panel>
      </div>
    </>
  );
}
