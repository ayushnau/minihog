'use client';

import { useState, useEffect } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import KpiCard from '@/components/KpiCard';
import { Input } from '@/components/ui/input';
import { api, RetentionResponse, EventNameItem } from '@/lib/api';
import { format, subDays } from 'date-fns';

export default function RetentionPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [cohort, setCohort] = useState('');
  const [day, setDay] = useState(7);
  const [data, setData] = useState<RetentionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableEvents, setAvailableEvents] = useState<EventNameItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Load available event names on mount
  useEffect(() => {
    api.getEventNames()
      .then((events) => {
        setAvailableEvents(events);
        // Auto-select first event if none selected
        if (!cohort && events.length > 0) {
          setCohort(events[0].name);
        }
      })
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  useEffect(() => {
    if (!cohort.trim() || day < 1) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getRetentionAnalysis(cohort.trim(), day, from, to)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err?.message || 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [cohort, day, from, to]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Retention Analysis</h1>
      <DateRangePicker onDateChange={(f, t) => { setFrom(f); setTo(t); }} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="text-sm text-muted-foreground">Cohort Event</label>
          {eventsLoading ? (
            <div className="mt-1 h-10 rounded-md bg-secondary animate-pulse" />
          ) : (
            <select
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select an event...</option>
              {availableEvents.map((evt) => (
                <option key={evt.name} value={evt.name}>
                  {evt.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="w-28">
          <label className="text-sm text-muted-foreground">Day</label>
          <Input type="number" min={1} value={day} onChange={(e) => setDay(Number(e.target.value) || 7)} className="mt-1" />
        </div>
      </div>

      {/* Quick day presets */}
      <div className="flex gap-2">
        {[1, 3, 7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              day === d
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Day {d}
          </button>
        ))}
      </div>

      {loading && <div className="text-muted-foreground">Loading...</div>}
      {error && <div className="text-destructive text-sm">{error}</div>}

      {data && !loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard title="Cohort Size" value={data.cohort_size} />
            <KpiCard title="Retained Users" value={data.retained_users} />
            <KpiCard title="Retention Rate" value={`${data.retention_percentage.toFixed(2)}%`} />
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Retention Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 rounded-md bg-secondary">
                <span className="text-sm text-muted-foreground">Cohort Event</span>
                <span className="font-mono text-sm text-primary">{data.cohort}</span>
              </div>
              <div className="flex justify-between p-3 rounded-md bg-secondary">
                <span className="text-sm text-muted-foreground">Retention Day</span>
                <span className="font-mono text-sm">Day {data.day}</span>
              </div>
              <div className="flex justify-between p-3 rounded-md bg-secondary">
                <span className="text-sm text-muted-foreground">Date Range</span>
                <span className="font-mono text-sm">{new Date(data.from).toLocaleDateString()} – {new Date(data.to).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
