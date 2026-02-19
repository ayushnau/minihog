import { useState } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import KpiCard from '@/components/KpiCard';
import { Input } from '@/components/ui/input';
import { mockRetention } from '@/lib/mock-data';

const Retention = () => {
  const [cohort, setCohort] = useState('install');
  const [day, setDay] = useState(7);
  const [, setRange] = useState({ from: '', to: '' });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Retention Analysis</h1>
      <DateRangePicker onDateChange={(from, to) => setRange({ from, to })} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="text-sm text-muted-foreground">Cohort Event</label>
          <Input value={cohort} onChange={e => setCohort(e.target.value)} className="mt-1" />
        </div>
        <div className="w-28">
          <label className="text-sm text-muted-foreground">Day</label>
          <Input type="number" min={1} value={day} onChange={e => setDay(Number(e.target.value))} className="mt-1" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Cohort Size" value={mockRetention.cohort_size} />
        <KpiCard title="Retained Users" value={mockRetention.retained_users} />
        <KpiCard title="Retention Rate" value={`${mockRetention.retention_percentage}%`} trend={mockRetention.retention_percentage > 30 ? 5.2 : -3.1} />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Retention Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between p-3 rounded-md bg-secondary">
            <span className="text-sm text-muted-foreground">Cohort Event</span>
            <span className="font-mono text-sm text-primary">{mockRetention.cohort}</span>
          </div>
          <div className="flex justify-between p-3 rounded-md bg-secondary">
            <span className="text-sm text-muted-foreground">Retention Day</span>
            <span className="font-mono text-sm">{mockRetention.day}</span>
          </div>
          <div className="flex justify-between p-3 rounded-md bg-secondary">
            <span className="text-sm text-muted-foreground">Date Range</span>
            <span className="font-mono text-sm">Last {day} days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Retention;
