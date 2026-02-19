import { useState } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockFunnelData } from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Funnel = () => {
  const [steps, setSteps] = useState('install,signup,purchase');
  const [loaded, setLoaded] = useState(true);
  const [, setRange] = useState({ from: '', to: '' });

  const handleAnalyze = () => {
    const arr = steps.split(',').map(s => s.trim()).filter(Boolean);
    if (arr.length >= 2) setLoaded(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Funnel Analysis</h1>
      <DateRangePicker onDateChange={(from, to) => setRange({ from, to })} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[250px]">
          <label className="text-sm text-muted-foreground">Funnel Steps (comma-separated)</label>
          <Input value={steps} onChange={e => setSteps(e.target.value)} placeholder="e.g. install,signup,purchase" className="mt-1" />
        </div>
        <Button onClick={handleAnalyze}>Analyze</Button>
      </div>

      {loaded && (
        <>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Funnel Visualization</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockFunnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,18%,18%)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} />
                <YAxis dataKey="event_name" type="category" tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} width={80} />
                <Tooltip contentStyle={{ background: 'hsl(220,22%,10%)', border: '1px solid hsl(220,18%,18%)', borderRadius: '8px', color: 'hsl(210,20%,92%)' }} />
                <Bar dataKey="users" fill="hsl(210,100%,55%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Funnel Steps</h3>
            <div className="space-y-3">
              {mockFunnelData.map(s => (
                <div key={s.step} className="flex items-center justify-between p-3 rounded-md bg-secondary">
                  <div>
                    <span className="text-sm font-medium">Step {s.step}: </span>
                    <span className="font-mono text-sm text-primary">{s.event_name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {s.drop_off_percentage > 0 && (
                      <span className="text-xs text-destructive">↓ {s.drop_off_percentage}% drop-off</span>
                    )}
                    <span className="font-mono text-sm font-bold">{s.users.toLocaleString()} users</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Funnel;
