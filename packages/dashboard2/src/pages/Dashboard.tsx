import { useState } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import KpiCard from '@/components/KpiCard';
import { mockEventBreakdown } from '@/lib/mock-data';
import { Activity } from 'lucide-react';

const Dashboard = () => {
  const [, setRange] = useState({ from: '', to: '' });

  const totalEvents = mockEventBreakdown.reduce((s, e) => s + e.total_count, 0);
  const uniqueUsers = mockEventBreakdown.reduce((s, e) => s + e.unique_users, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Overview</h1>
        <DateRangePicker onDateChange={(from, to) => setRange({ from, to })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Total Events" value={totalEvents} trend={12.3} subtitle="vs previous period" />
        <KpiCard title="Unique Users" value={uniqueUsers} trend={8.7} subtitle="vs previous period" />
        <KpiCard title="Event Types" value={mockEventBreakdown.length} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Event Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mockEventBreakdown.map(e => (
            <div key={e.event} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium font-mono text-sm">{e.event}</p>
                <p className="text-xs text-muted-foreground">{e.unique_users.toLocaleString()} unique users</p>
              </div>
              <p className="text-lg font-bold font-mono">{e.total_count.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
