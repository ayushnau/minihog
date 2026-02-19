'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { api, AttributionResponse } from '@/lib/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw } from 'lucide-react';

const COLORS = ['hsl(210,100%,55%)', 'hsl(190,90%,50%)', 'hsl(160,80%,45%)', 'hsl(280,70%,55%)', 'hsl(30,90%,55%)'];

export default function AttributionPage() {
  const [data, setData] = useState<AttributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAttributionAnalytics();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const installData = data?.installs_by_campaign ?? [];
  const purchaseData = data?.purchases_by_campaign ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attribution & Campaign Analytics</h1>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {loading && <div className="text-muted-foreground">Loading…</div>}
      {error && <div className="text-destructive text-sm">{error}</div>}

      {data && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Installs by Campaign</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={installData}
                  dataKey="install_count"
                  nameKey="campaign_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ campaign_id }) => campaign_id ?? 'Unattributed'}
                >
                  {installData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(220,22%,10%)', border: '1px solid hsl(220,18%,18%)', borderRadius: '8px', color: 'hsl(210,20%,92%)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {installData.map((c, i) => (
                <div key={c.campaign_id ?? 'un'} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="font-mono">{c.campaign_id ?? 'Unattributed'}</span>
                  </div>
                  <span className="font-mono font-bold">{(c.install_count ?? 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Purchases by Campaign</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={purchaseData}
                  dataKey="purchase_count"
                  nameKey="campaign_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ campaign_id }) => campaign_id ?? 'Unattributed'}
                >
                  {purchaseData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(220,22%,10%)', border: '1px solid hsl(220,18%,18%)', borderRadius: '8px', color: 'hsl(210,20%,92%)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {purchaseData.map((c, i) => (
                <div key={c.campaign_id ?? 'un'} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="font-mono">{c.campaign_id ?? 'Unattributed'}</span>
                  </div>
                  <span className="font-mono font-bold">{(c.purchase_count ?? 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
