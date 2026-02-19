import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockApiKeys } from '@/lib/mock-data';
import { Copy, Check, Trash2 } from 'lucide-react';

const Keys = () => {
  const [name, setName] = useState('');
  const [keys, setKeys] = useState(mockApiKeys);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!name) return;
    const key = `mh_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    setNewKey(key);
    setKeys(prev => [...prev, { id: String(Date.now()), name, created_at: new Date().toISOString() }]);
    setName('');
  };

  const handleCopy = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = (id: string) => {
    setKeys(prev => prev.filter(k => k.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">API Keys</h1>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Generate New Key</h3>
        <div className="flex gap-3">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Key name" className="flex-1" />
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
            <button onClick={() => setNewKey(null)} className="text-xs text-muted-foreground mt-2 hover:underline">
              I've copied the key
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Your API Keys</h3>
          {keys.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setKeys([])}>
              <Trash2 className="h-3 w-3 mr-1" /> Revoke All
            </Button>
          )}
        </div>
        {keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No API keys yet.</p>
        ) : (
          <div className="space-y-2">
            {keys.map(k => (
              <div key={k.id} className="flex items-center justify-between p-3 rounded-md bg-secondary">
                <div>
                  <p className="text-sm font-medium">{k.name}</p>
                  <p className="text-xs text-muted-foreground">Created {new Date(k.created_at).toLocaleDateString()}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleRevoke(k.id)}>Revoke</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Keys;
