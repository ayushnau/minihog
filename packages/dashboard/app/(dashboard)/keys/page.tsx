'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Trash2 } from 'lucide-react';

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
      } else {
        setError(data.error || 'Failed to generate key');
      }
    } catch {
      setError('Failed to generate API key');
    }
  };

  const handleCopy = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this API key? It will stop working immediately.')) return;
    try {
      const res = await fetch(`/api/keys?id=${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) loadKeys();
      else setError((await res.json()).error || 'Failed to revoke');
    } catch {
      setError('Failed to revoke key');
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm('Revoke ALL API keys? They will all stop working.')) return;
    try {
      const res = await fetch('/api/keys?all=true', { method: 'DELETE', credentials: 'include' });
      if (res.ok) loadKeys();
      else setError((await res.json()).error || 'Failed to revoke all');
    } catch {
      setError('Failed to revoke all');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">API Keys</h1>

      {error && <div className="text-destructive text-sm">{error}</div>}

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Generate New Key</h3>
        <div className="flex gap-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name" className="flex-1" />
          <Button onClick={handleGenerate} disabled={!name}>Generate</Button>
        </div>

        {newKey && (
          <div className="mt-4 p-4 rounded-md bg-success/10 border border-success/20">
            <p className="text-sm text-success mb-2">Key generated! Copy it now — it won't be shown again.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono break-all text-foreground">{newKey}</code>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <button type="button" onClick={() => setNewKey(null)} className="text-xs text-muted-foreground mt-2 hover:underline">
              I've copied the key
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Your API Keys</h3>
          {keys.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleRevokeAll}>
              <Trash2 className="h-3 w-3 mr-1" /> Revoke All
            </Button>
          )}
        </div>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-muted-foreground text-sm">No API keys yet.</p>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between p-3 rounded-md bg-secondary">
                <div>
                  <p className="text-sm font-medium">{k.name}</p>
                  <p className="text-xs text-muted-foreground">Created {new Date(k.createdAt).toLocaleDateString()}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleRevoke(k.id)}>Revoke</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
