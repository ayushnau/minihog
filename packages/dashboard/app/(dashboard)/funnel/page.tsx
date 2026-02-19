'use client';

import { useState, useEffect } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, FunnelResponse } from '@/lib/api';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FunnelPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [steps, setSteps] = useState('install,signup,purchase');
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    const stepArray = steps.split(',').map((s) => s.trim()).filter(Boolean);
    if (stepArray.length < 2) {
      setError('At least 2 steps required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.getFunnelAnalysis(stepArray, from, to);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load funnel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [from, to]);

  const chartData = data?.funnel.map((s) => ({ name: s.event_name, users: s.users })) ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Funnel Analysis</h1>
      <DateRangePicker onDateChange={(f, t) => { setFrom(f); setTo(t); }} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[250px]">
          <label className="text-sm text-muted-foreground">Funnel Steps (comma-separated)</label>
          <Input value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="e.g. install,signup,purchase" className="mt-1" />
        </div>
        <Button onClick={loadData} disabled={loading}>Analyze</Button>
      </div>

      {loading && <div className="text-muted-foreground">Loading…</div>}
      {error && <div className="text-destructive text-sm">{error}</div>}

      {data && !loading && (
        <>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Funnel Visualization</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,18%,18%)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} width={80} />
                <Tooltip contentStyle={{ background: 'hsl(220,22%,10%)', border: '1px solid hsl(220,18%,18%)', borderRadius: '8px', color: 'hsl(210,20%,92%)' }} />
                <Bar dataKey="users" fill="hsl(210,100%,55%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Funnel Steps</h3>
            <div className="space-y-3">
              {data.funnel.map((s) => (
                <div key={s.step} className="flex items-center justify-between p-3 rounded-md bg-secondary">
                  <div>
                    <span className="text-sm font-medium">Step {s.step}: </span>
                    <span className="font-mono text-sm text-primary">{s.event_name}</span>
                    {s.drop_off_percentage > 0 && (
                      <span className="text-xs text-destructive ml-2">↓ {s.drop_off_percentage.toFixed(1)}% drop-off</span>
                    )}
                  </div>
                  <span className="font-mono text-sm font-bold">{s.users.toLocaleString()} users</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
