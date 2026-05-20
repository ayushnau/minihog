'use client';

import { useState, useEffect } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import KpiCard from '@/components/KpiCard';
import { Button } from '@/components/ui/button';
import { api, EventCountResponse, EventNameItem } from '@/lib/api';
import { getDefaultDateRange } from '@/lib/settings';
import { format, subDays } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

const CHART_COLORS = ['hsl(210,100%,55%)', 'hsl(190,90%,50%)', 'hsl(160,80%,45%)', 'hsl(280,70%,55%)', 'hsl(30,90%,55%)'];

export default function EventsPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventName, setEventName] = useState('');
  const [granularity, setGranularity] = useState<'day' | 'hour'>('day');
  const [propertyKey, setPropertyKey] = useState('page');
  const [data, setData] = useState<EventCountResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableEvents, setAvailableEvents] = useState<EventNameItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const d = Number(getDefaultDateRange()) || 7;
    setFrom(format(subDays(new Date(), d), 'yyyy-MM-dd'));
    setTo(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  // Load available event names
  useEffect(() => {
    api.getEventNames()
      .then(setAvailableEvents)
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  // Load event data when selection changes
  useEffect(() => {
    if (!eventName) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getEventCounts(eventName, from, to, {
        includeTimeSeries: true,
        includeProperties: true,
        includeJourneys: true,
        propertyKey,
        granularity,
      })
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err?.message || 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [eventName, from, to, propertyKey, granularity, refreshKey]);

  // Format property display for journey events
  const formatProps = (properties: Record<string, unknown> | undefined) => {
    if (!properties) return null;
    const entries = Object.entries(properties).filter(([_, v]) => v != null);
    if (entries.length === 0) return null;
    return entries.map(([k, v]) => (
      <span key={k} className="text-muted-foreground text-[10px] ml-1">
        {k}:<span className="text-foreground/70">{String(v)}</span>
      </span>
    ));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Event Analytics</h1>
        {eventName && (
          <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        )}
      </div>
      <DateRangePicker onDateChange={(f, t) => { setFrom(f); setTo(t); }} defaultDays={Number(getDefaultDateRange()) || 7} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm text-muted-foreground">Event name</label>
          {eventsLoading ? (
            <div className="mt-1 h-10 rounded-md bg-secondary animate-pulse" />
          ) : (
            <select
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
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
        <div>
          <label className="text-sm text-muted-foreground">Granularity</label>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as 'day' | 'hour')}
            className="mt-1 h-10 px-3 rounded-md bg-secondary text-secondary-foreground border border-border text-sm block"
          >
            <option value="day">Daily</option>
            <option value="hour">Hourly</option>
          </select>
        </div>
      </div>

      {loading && <div className="text-muted-foreground text-sm">Loading...</div>}
      {error && <div className="text-destructive text-sm">{error}</div>}

      {data && !loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard title="Total Events" value={data.total_count} />
            <KpiCard title="Unique End Users" value={data.unique_users} />
            <KpiCard title="Granularity" value={granularity === 'day' ? 'Daily' : 'Hourly'} />
          </div>

          {data.time_series && data.time_series.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Time Series</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.time_series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,18%,18%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} />
                  <Tooltip contentStyle={{ background: 'hsl(220,22%,10%)', border: '1px solid hsl(220,18%,18%)', borderRadius: '8px', color: 'hsl(210,20%,92%)' }} />
                  <Line type="monotone" dataKey="count" stroke="hsl(210,100%,55%)" strokeWidth={2} dot={false} name="Count" />
                  <Line type="monotone" dataKey="unique_users" stroke="hsl(190,90%,50%)" strokeWidth={2} dot={false} name="Unique users" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {data.properties_breakdown && data.properties_breakdown.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Breakdown by {propertyKey}</h3>
                {data.available_properties && data.available_properties.length > 0 && (
                  <select
                    value={propertyKey}
                    onChange={(e) => setPropertyKey(e.target.value)}
                    className="h-8 px-2 rounded-md bg-secondary text-secondary-foreground border border-border text-xs"
                  >
                    {data.available_properties.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.properties_breakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,18%,18%)" />
                    <XAxis dataKey="value" tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} />
                    <Tooltip contentStyle={{ background: 'hsl(220,22%,10%)', border: '1px solid hsl(220,18%,18%)', borderRadius: '8px', color: 'hsl(210,20%,92%)' }} />
                    <Bar dataKey="count" fill="hsl(210,100%,55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.properties_breakdown} dataKey="count" nameKey="value" cx="50%" cy="50%" outerRadius={80}>
                      {data.properties_breakdown.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(220,22%,10%)', border: '1px solid hsl(220,18%,18%)', borderRadius: '8px', color: 'hsl(210,20%,92%)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Value</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Count</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Unique Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.properties_breakdown.slice(0, 5).map((row) => (
                      <tr key={row.value} className="border-b border-border/50">
                        <td className="py-2 font-mono text-sm">{row.value}</td>
                        <td className="py-2 text-right font-mono">{row.count.toLocaleString()}</td>
                        <td className="py-2 text-right font-mono">{row.unique_users.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.user_journeys && data.user_journeys.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">User Journeys</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {data.user_journeys.slice(0, 10).map((j) => (
                  <div key={j.user_id} className="p-3 rounded-md bg-secondary">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-primary">{j.user_id.slice(0, 16)}...</span>
                      <span className="text-xs text-muted-foreground">{j.total_events} events</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {j.events.map((ev, i) => (
                        <span key={i} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-mono">
                          {ev.event_name}
                          {formatProps(ev.properties)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.common_paths && data.common_paths.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Common Paths</h3>
              <div className="space-y-3">
                {data.common_paths.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-md bg-secondary">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Path #{idx + 1}</span>
                      <span className="text-xs text-muted-foreground">{p.count} users ({p.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {p.path.map((step, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded text-xs bg-accent/10 text-accent font-mono">{step}</span>
                          {i < p.path.length - 1 && <span className="text-muted-foreground">-&gt;</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!eventName && (
        <div className="text-center py-20 text-muted-foreground">
          <p>Select an event to view analytics.</p>
        </div>
      )}
    </div>
  );
}
