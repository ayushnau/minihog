'use client';

import { useState, useEffect } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import { Button } from '@/components/ui/button';
import { api, FunnelResponse, EventNameItem } from '@/lib/api';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, X, GripVertical } from 'lucide-react';

export default function FunnelPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [availableEvents, setAvailableEvents] = useState<EventNameItem[]>([]);
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Load available event names on mount
  useEffect(() => {
    api.getEventNames()
      .then(setAvailableEvents)
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  const loadData = async () => {
    if (selectedSteps.length < 2) {
      setError('At least 2 steps required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.getFunnelAnalysis(selectedSteps, from, to);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load funnel');
    } finally {
      setLoading(false);
    }
  };

  const addStep = (eventName: string) => {
    setSelectedSteps((prev) => [...prev, eventName]);
  };

  const removeStep = (index: number) => {
    setSelectedSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    setSelectedSteps((prev) => {
      const arr = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  // Events not yet added as steps
  const unusedEvents = availableEvents.filter((e) => !selectedSteps.includes(e.name));

  const chartData = data?.funnel.map((s) => ({ name: s.event_name, users: s.users })) ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Funnel Analysis</h1>
      <DateRangePicker onDateChange={(f, t) => { setFrom(f); setTo(t); }} />

      {/* Step builder */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Funnel Steps</h3>

        {/* Selected steps */}
        {selectedSteps.length > 0 && (
          <div className="space-y-2 mb-4">
            {selectedSteps.map((step, i) => (
              <div key={`${step}-${i}`} className="flex items-center gap-2 p-2 rounded-md bg-secondary">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveStep(i, 'up')}
                    disabled={i === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs leading-none"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveStep(i, 'down')}
                    disabled={i === selectedSteps.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs leading-none"
                  >
                    ▼
                  </button>
                </div>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground w-6">#{i + 1}</span>
                <span className="font-mono text-sm text-primary flex-1">{step}</span>
                <span className="text-xs text-muted-foreground" />
                <button onClick={() => removeStep(i)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedSteps.length === 0 && (
          <p className="text-sm text-muted-foreground mb-4">Click events below to add them as funnel steps.</p>
        )}

        {/* Available events to add */}
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground mb-2">Available Events (click to add)</p>
          {eventsLoading ? (
            <p className="text-sm text-muted-foreground">Loading events...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {unusedEvents.map((evt) => (
                <button
                  key={evt.name}
                  onClick={() => addStep(evt.name)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-sm font-mono hover:bg-primary/20 hover:text-primary transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  {evt.name}
                  <span />
                </button>
              ))}
              {unusedEvents.length === 0 && availableEvents.length > 0 && (
                <p className="text-xs text-muted-foreground">All events added. Remove a step to reuse it.</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={loadData} disabled={loading || selectedSteps.length < 2}>
            Analyze Funnel
          </Button>
          {selectedSteps.length < 2 && selectedSteps.length > 0 && (
            <span className="text-xs text-muted-foreground">Add at least 2 steps</span>
          )}
        </div>
      </div>

      {loading && <div className="text-muted-foreground">Loading...</div>}
      {error && <div className="text-destructive text-sm">{error}</div>}

      {data && !loading && (
        <>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Funnel Visualization</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,18%,18%)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} width={120} />
                <Tooltip contentStyle={{ background: 'hsl(220,22%,10%)', border: '1px solid hsl(220,18%,18%)', borderRadius: '8px', color: 'hsl(210,20%,92%)' }} />
                <Bar dataKey="users" fill="hsl(210,100%,55%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Funnel Results</h3>
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
