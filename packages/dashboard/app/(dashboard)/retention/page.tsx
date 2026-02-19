'use client';

import { useState, useEffect } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import KpiCard from '@/components/KpiCard';
import { Input } from '@/components/ui/input';
import { api, RetentionResponse } from '@/lib/api';
import { useDebounce } from '@/lib/useDebounce';
import { format, subDays } from 'date-fns';

export default function RetentionPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [cohort, setCohort] = useState('install');
  const [day, setDay] = useState(7);
  const [data, setData] = useState<RetentionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedCohort = useDebounce(cohort, 500);

  useEffect(() => {
    if (!debouncedCohort.trim() || day < 1) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getRetentionAnalysis(debouncedCohort.trim(), day, from, to)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err?.message || 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedCohort, day, from, to]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Retention Analysis</h1>
      <DateRangePicker onDateChange={(f, t) => { setFrom(f); setTo(t); }} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="text-sm text-muted-foreground">Cohort Event</label>
          <Input value={cohort} onChange={(e) => setCohort(e.target.value)} className="mt-1" />
        </div>
        <div className="w-28">
          <label className="text-sm text-muted-foreground">Day</label>
          <Input type="number" min={1} value={day} onChange={(e) => setDay(Number(e.target.value) || 7)} className="mt-1" />
        </div>
      </div>

      {loading && <div className="text-muted-foreground">Loading…</div>}
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
