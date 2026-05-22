'use client';
import { useState } from 'react';

interface DateRange { from: string; to: string; preset?: string; }
interface Props { onDateChange: (range: DateRange) => void; defaultDays?: number; }

function fmt(d: Date) { return d.toISOString().slice(0, 10); }

export default function DateRangePicker({ onDateChange, defaultDays = 7 }: Props) {
  const today = new Date();
  const presetMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
  const defaultPreset = defaultDays === 30 ? '30d' : defaultDays === 90 ? '90d' : '7d';

  const [from, setFrom] = useState(fmt(new Date(today.getTime() - defaultDays * 86400000)));
  const [to,   setTo]   = useState(fmt(today));
  const [preset, setPreset] = useState(defaultPreset);

  const applyPreset = (p: string) => {
    const d = presetMap[p];
    const f = fmt(new Date(today.getTime() - d * 86400000));
    const t = fmt(today);
    setFrom(f); setTo(t); setPreset(p);
    onDateChange({ from: f, to: t, preset: p });
  };

  return (
    <div className="mh-row" style={{ gap: 6 }}>
      <div className="mh-field" style={{ padding: '4px 8px' }}>
        <span className="prompt">◷</span>
        <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPreset(''); onDateChange({ from: e.target.value, to }); }} />
      </div>
      <span className="mh-dim">→</span>
      <div className="mh-field" style={{ padding: '4px 8px' }}>
        <span className="prompt">◷</span>
        <input type="date" value={to} onChange={e => { setTo(e.target.value); setPreset(''); onDateChange({ from, to: e.target.value }); }} />
      </div>
      {['7d','30d','90d'].map(p => (
        <button key={p} className={`mh-btn sm ${preset === p ? 'primary' : 'ghost'}`} onClick={() => applyPreset(p)}>{p}</button>
      ))}
    </div>
  );
}
