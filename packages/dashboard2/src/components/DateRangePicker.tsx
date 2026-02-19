import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface DateRangePickerProps {
  onDateChange: (from: string, to: string) => void;
  defaultDays?: number;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onDateChange, defaultDays = 7 }) => {
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - defaultDays);

  const [from, setFrom] = useState(defaultFrom.toISOString().split('T')[0]);
  const [to, setTo] = useState(now.toISOString().split('T')[0]);

  const setQuick = (days: number) => {
    const t = new Date();
    const f = new Date(t);
    f.setDate(f.getDate() - days);
    const fStr = f.toISOString().split('T')[0];
    const tStr = t.toISOString().split('T')[0];
    setFrom(fStr);
    setTo(tStr);
    onDateChange(fStr, tStr);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={from}
        onChange={e => setFrom(e.target.value)}
        className="h-9 px-3 rounded-md bg-secondary text-secondary-foreground border border-border text-sm"
      />
      <span className="text-muted-foreground text-sm">to</span>
      <input
        type="date"
        value={to}
        onChange={e => setTo(e.target.value)}
        className="h-9 px-3 rounded-md bg-secondary text-secondary-foreground border border-border text-sm"
      />
      <Button size="sm" onClick={() => onDateChange(from, to)}>Apply</Button>
      <div className="flex gap-1">
        {[7, 30, 90].map(d => (
          <Button key={d} variant="outline" size="sm" onClick={() => setQuick(d)}>
            {d}d
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DateRangePicker;
