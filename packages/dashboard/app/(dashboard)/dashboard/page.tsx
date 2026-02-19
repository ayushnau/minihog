'use client';

import { useState, useEffect } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import KpiCard from '@/components/KpiCard';
import { api, EventCountResponse } from '@/lib/api';
import { getDefaultDateRange } from '@/lib/settings';
import { Activity } from 'lucide-react';
import { format, subDays } from 'date-fns';

const commonEvents = ['install', 'signup', 'purchase', 'app_open'];

export default function DashboardPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventCountResponse[]>([]);

  useEffect(() => {
    const d = Number(getDefaultDateRange()) || 7;
    setFrom(format(subDays(new Date(), d), 'yyyy-MM-dd'));
    setTo(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all(
      commonEvents.map((event) =>
        api.getEventCounts(event, from, to).catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return;
      const valid = results.filter((r): r is EventCountResponse => r !== null);
      setEvents(valid);
      setLoading(false);
    }).catch((err) => {
      if (!cancelled) {
        setError(err?.message || 'Failed to load dashboard data');
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [from, to]);

  const totalEvents = events.reduce((s, e) => s + e.total_count, 0);
  const uniqueUsers = events.length ? Math.max(...events.map((e) => e.unique_users), 0) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Overview</h1>
        <DateRangePicker onDateChange={(f, t) => { setFrom(f); setTo(t); }} defaultDays={Number(getDefaultDateRange()) || 7} />
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 text-muted-foreground">Loading…</div>
      )}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard title="Total Events" value={totalEvents} />
            <KpiCard title="Unique Users" value={uniqueUsers} />
            <KpiCard title="Event Types" value={events.length} />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Event Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {events.length === 0 ? (
                <p className="text-muted-foreground text-sm">No events in this period.</p>
              ) : (
                events.map((e) => (
                  <div
                    key={e.event}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium font-mono text-sm">{e.event}</p>
                      <p className="text-xs text-muted-foreground">{e.unique_users.toLocaleString()} unique users</p>
                    </div>
                    <p className="text-lg font-bold font-mono">{e.total_count.toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
