import { useState } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import KpiCard from '@/components/KpiCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateTimeSeries, mockProperties, mockJourneys, mockPaths } from '@/lib/mock-data';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

const CHART_COLORS = ['hsl(210,100%,55%)', 'hsl(190,90%,50%)', 'hsl(160,80%,45%)', 'hsl(280,70%,55%)', 'hsl(30,90%,55%)'];

const Events = () => {
  const [eventName, setEventName] = useState('');
  const [granularity, setGranularity] = useState<'daily' | 'hourly'>('daily');
  const [loaded, setLoaded] = useState(false);
  const [, setRange] = useState({ from: '', to: '' });
  const timeSeries = generateTimeSeries(30);
  const [propertyKey, setPropertyKey] = useState('browser');

  const handleLoad = () => {
    if (eventName) setLoaded(true);
  };

  const totalEvents = timeSeries.reduce((s, d) => s + d.count, 0);
  const totalUnique = timeSeries.reduce((s, d) => s + d.unique_users, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Event Analytics</h1>
      <DateRangePicker onDateChange={(from, to) => setRange({ from, to })} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm text-muted-foreground">Event name</label>
          <Input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="e.g. signup" className="mt-1" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Granularity</label>
          <select
            value={granularity}
            onChange={e => setGranularity(e.target.value as 'daily' | 'hourly')}
            className="mt-1 h-9 px-3 rounded-md bg-secondary text-secondary-foreground border border-border text-sm block"
          >
            <option value="daily">Daily</option>
            <option value="hourly">Hourly</option>
          </select>
        </div>
        <Button onClick={handleLoad} disabled={!eventName}>Load</Button>
      </div>

      {loaded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard title="Total Events" value={totalEvents} trend={15.2} />
            <KpiCard title="Unique End Users" value={totalUnique} trend={9.4} />
            <KpiCard title="Granularity" value={granularity === 'daily' ? 'Daily' : 'Hourly'} />
          </div>

          {/* Time series */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Time Series</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,18%,18%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} />
                <Tooltip contentStyle={{ background: 'hsl(220,22%,10%)', border: '1px solid hsl(220,18%,18%)', borderRadius: '8px', color: 'hsl(210,20%,92%)' }} />
                <Line type="monotone" dataKey="count" stroke="hsl(210,100%,55%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="unique_users" stroke="hsl(190,90%,50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Properties */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Properties Breakdown</h3>
              <select
                value={propertyKey}
                onChange={e => setPropertyKey(e.target.value)}
                className="h-8 px-2 rounded-md bg-secondary text-secondary-foreground border border-border text-xs"
              >
                {mockProperties.available_properties.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mockProperties.breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,18%,18%)" />
                  <XAxis dataKey="value" tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} />
                  <Tooltip contentStyle={{ background: 'hsl(220,22%,10%)', border: '1px solid hsl(220,18%,18%)', borderRadius: '8px', color: 'hsl(210,20%,92%)' }} />
                  <Bar dataKey="count" fill="hsl(210,100%,55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={mockProperties.breakdown} dataKey="count" nameKey="value" cx="50%" cy="50%" outerRadius={80}>
                    {mockProperties.breakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(220,22%,10%)', border: '1px solid hsl(220,18%,18%)', borderRadius: '8px', color: 'hsl(210,20%,92%)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Top 5 table */}
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
                  {mockProperties.breakdown.slice(0, 5).map(row => (
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

          {/* Journeys */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">User Journeys</h3>
            <div className="space-y-3">
              {mockJourneys.map(j => (
                <div key={j.user_id} className="p-3 rounded-md bg-secondary">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-primary">{j.user_id}</span>
                    <span className="text-xs text-muted-foreground">{j.total_events} events</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {j.events.map((ev, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-mono">
                        {ev.event} <span className="text-muted-foreground">{ev.page}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Common Paths */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Common Paths</h3>
            <div className="space-y-3">
              {mockPaths.map((p, idx) => (
                <div key={idx} className="p-3 rounded-md bg-secondary">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Path #{idx + 1}</span>
                    <span className="text-xs text-muted-foreground">{p.count} users ({p.percentage}%)</span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {p.path.map((step, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded text-xs bg-accent/10 text-accent font-mono">{step}</span>
                        {i < p.path.length - 1 && <span className="text-muted-foreground">→</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!loaded && (
        <div className="text-center py-20 text-muted-foreground">
          <p>Enter an event name and click Load to view analytics.</p>
        </div>
      )}
    </div>
  );
};

export default Events;
