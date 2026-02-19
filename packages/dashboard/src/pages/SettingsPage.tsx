import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const SettingsPage = () => {
  const apiUrl = 'http://localhost:3000';
  const [health, setHealth] = useState<'idle' | 'checking' | 'healthy' | 'error'>('idle');

  const checkHealth = () => {
    setHealth('checking');
    // Mock health check
    setTimeout(() => setHealth('healthy'), 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">API Configuration</h3>
        <div className="p-3 rounded-md bg-secondary">
          <label className="text-xs text-muted-foreground">API URL</label>
          <p className="font-mono text-sm mt-1">{apiUrl}</p>
          <p className="text-xs text-muted-foreground mt-1">Configure via NEXT_PUBLIC_API_URL</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Connection Status</h3>
        <div className="flex items-center gap-3">
          {health === 'idle' && <div className="h-3 w-3 rounded-full bg-muted-foreground" />}
          {health === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {health === 'healthy' && <CheckCircle className="h-4 w-4 text-success" />}
          {health === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
          <span className="text-sm capitalize">{health === 'idle' ? 'Not checked' : health}</span>
          <Button variant="outline" size="sm" onClick={checkHealth} disabled={health === 'checking'}>
            {health === 'checking' ? 'Checking...' : 'Retry'}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">About</h3>
        <div className="space-y-2 text-sm">
          <p>MiniHog Dashboard</p>
          <p className="text-muted-foreground">Version: 1.0.0</p>
          <p className="text-muted-foreground">Backend API: {apiUrl}</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
