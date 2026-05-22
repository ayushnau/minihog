'use client';
import { useEffect, useRef, useState } from 'react';

// ── Spark (text sparkline) ────────────────────────────────────────────────────
export function Spark({ data }: { data: number[] }) {
  const glyphs = '▁▂▃▄▅▆▇█';
  const max = Math.max(...data), min = Math.min(...data);
  const out = data.map(v => {
    const t = (v - min) / (max - min || 1);
    return glyphs[Math.min(glyphs.length - 1, Math.floor(t * (glyphs.length - 1)))];
  }).join('');
  return <span style={{ letterSpacing: -1, fontSize: 14, color: 'var(--acc)' }}>{out}</span>;
}

// ── KPI card ─────────────────────────────────────────────────────────────────
export function KpiCard({ label, value, unit, delta, spark, glyph }:
  { label: string; value: number | string; unit?: string; delta?: number; spark?: number[]; glyph?: string }) {
  const fmt = (n: number | string) => {
    if (typeof n !== 'number') return n;
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 1 : 2) + 'k';
    return n.toLocaleString('en-US');
  };
  return (
    <div className="mh-kpi">
      <div className="label">{glyph && <span style={{ color: 'var(--acc)', marginRight: 6 }}>{glyph}</span>}{label}</div>
      <div className="value">{fmt(value)}{unit && <span className="unit">{unit}</span>}</div>
      {typeof delta === 'number' && (
        <div className={`delta${delta < 0 ? ' bad' : ''}`}>
          <span>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta * 100).toFixed(1)}%</span>
          <span style={{ color: 'var(--fg-3)' }}>vs prev period</span>
        </div>
      )}
      {spark && <div className="spark"><Spark data={spark} /></div>}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export function Panel({ title, meta, right, children, style, id }: {
  title?: React.ReactNode; meta?: React.ReactNode; right?: React.ReactNode;
  children: React.ReactNode; style?: React.CSSProperties; id?: string;
}) {
  return (
    <div className="mh-panel" style={style} id={id}>
      {title && (
        <div className="mh-panel-head">
          <div className="mh-row" style={{ gap: 10 }}>
            <h3>{title}</h3>
            {meta && <span className="meta">{meta}</span>}
          </div>
          {right && <div className="mh-row">{right}</div>}
        </div>
      )}
      <div className="mh-panel-body">{children}</div>
    </div>
  );
}

// ── AsciiHr ───────────────────────────────────────────────────────────────────
export function AsciiHr({ label }: { label: string }) {
  return (
    <div className="mh-ascii-hr">
      <span>├</span>
      <span className="lbl">{label}</span>
      <div className="line" />
      <span>┤</span>
    </div>
  );
}

// ── Tag ───────────────────────────────────────────────────────────────────────
export function Tag({ children, kind, glyph }: { children: React.ReactNode; kind?: string; glyph?: string }) {
  return <span className={`mh-tag${kind ? ' ' + kind : ''}`}>{glyph && <span>{glyph}</span>}{children}</span>;
}

// ── LineChart (SVG) ───────────────────────────────────────────────────────────
export function LineChart({ data, lines, height = 220, xEvery = 4 }: {
  data: Record<string, any>[]; lines: { key: string; label: string; color: string }[];
  height?: number; xEvery?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const pad = { l: 44, r: 16, t: 18, b: 32 };

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const allVals = lines.flatMap(ln => data.map(d => d[ln.key] || 0));
  const yMax = Math.max(1, ...allVals);
  const mag = Math.pow(10, Math.floor(Math.log10(yMax || 1)));
  const niceMax = Math.ceil(yMax / mag) * mag;
  const yTicks = 5;
  const xStep = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const xPos = (i: number) => pad.l + i * xStep;
  const yPos = (v: number) => pad.t + innerH - (v / niceMax) * innerH;
  const fmtY = (v: number) => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toString();
  const yLabels = Array.from({ length: yTicks }, (_, i) => Math.round(niceMax * (1 - i / (yTicks - 1))));

  return (
    <div ref={ref} className="mh-chart-frame" style={{ width: '100%' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <g className="grid">
          {yLabels.map((_, i) => {
            const y = pad.t + (innerH * i) / (yTicks - 1);
            return <line key={i} x1={pad.l} x2={width - pad.r} y1={y} y2={y} />;
          })}
        </g>
        <g>
          {yLabels.map((v, i) => {
            const y = pad.t + (innerH * i) / (yTicks - 1);
            return <text key={i} className="axis-y" x={pad.l - 6} y={y + 3} textAnchor="end">{fmtY(v)}</text>;
          })}
          {data.map((d, i) => i % xEvery === 0 ? (
            <text key={i} className="axis-x" x={xPos(i)} y={height - pad.b + 14} textAnchor="middle">{d.short || d.label}</text>
          ) : null)}
        </g>
        <line x1={pad.l} x2={width - pad.r} y1={height - pad.b} y2={height - pad.b} stroke="var(--bd-2)" />
        {lines.map((ln, li) => {
          const pts = data.map((d, i) => `${xPos(i)},${yPos(d[ln.key] || 0)}`).join(' ');
          const colorVar = ln.color === 'acc' ? 'var(--acc)' : 'var(--info)';
          return (
            <g key={li}>
              <polyline className={`ln ${ln.color}`} points={pts} />
              {data.map((d, i) => (
                <rect key={i} x={xPos(i) - 2} y={yPos(d[ln.key] || 0) - 2} width={4} height={4}
                  fill="var(--bg)" stroke={colorVar} strokeWidth="1.25" />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="mh-row" style={{ paddingLeft: pad.l, marginTop: 4, fontSize: 11, color: 'var(--fg-2)', gap: 18 }}>
        {lines.map((ln, i) => (
          <div key={i} className="mh-row" style={{ gap: 6 }}>
            <span style={{ width: 14, height: 0, borderTop: `2px solid var(--${ln.color === 'acc' ? 'acc' : 'info'})`, display: 'inline-block' }} />
            <span>{ln.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AsciiBars ─────────────────────────────────────────────────────────────────
export function AsciiBars({ rows, valueKey = 'count', nameKey = 'value', barWidth = 28 }: {
  rows: Record<string, any>[]; valueKey?: string; nameKey?: string; barWidth?: number;
}) {
  const m = Math.max(...rows.map(r => r[valueKey]));
  return (
    <div>
      {rows.map((r, i) => {
        const n = Math.max(1, Math.round((r[valueKey] / m) * barWidth));
        return (
          <div key={i} className="ascii-bar">
            <div className="bar-name">{r[nameKey]}</div>
            <div className="bar">
              <span>{'█'.repeat(n)}</span>
              <span style={{ color: 'var(--bd-2)' }}>{'░'.repeat(barWidth - n)}</span>
            </div>
            <div className="bar-val">{r[valueKey].toLocaleString('en-US')}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── DonutChart ────────────────────────────────────────────────────────────────
export function DonutChart({ rows, valueKey = 'count', nameKey = 'value', size = 180 }: {
  rows: Record<string, any>[]; valueKey?: string; nameKey?: string; size?: number;
}) {
  const palette = ['var(--acc)', 'var(--info)', 'var(--warn)', 'var(--magenta)', 'var(--bad)', 'var(--acc-2)'];
  const total = rows.reduce((s, r) => s + r[valueKey], 0);
  const cx = size / 2, cy = size / 2, r = size / 2 - 4, thickness = 28;
  let acc = 0;
  const segs = rows.map((row, i) => {
    const frac = row[valueKey] / total;
    const a0 = acc * Math.PI * 2 - Math.PI / 2;
    acc += frac;
    const a1 = acc * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    return { d: `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${x1} ${y1} Z`, color: palette[i % palette.length], pct: (frac * 100).toFixed(1), ...row };
  });
  return (
    <div className="mh-row" style={{ gap: 20, alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {segs.map((s, i) => <path key={i} d={s.d} fill={s.color} stroke="var(--bg-1)" strokeWidth="2" />)}
        <circle cx={cx} cy={cy} r={r - thickness} fill="var(--bg-1)" />
        <text x={cx} y={cy - 2} textAnchor="middle" style={{ fill: 'var(--fg-3)', fontSize: 9, letterSpacing: '.1em' }}>TOTAL</text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ fill: 'var(--fg-hi)', fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {total >= 1000 ? (total / 1000).toFixed(1) + 'k' : total}
        </text>
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        {segs.map((s, i) => (
          <div key={i} className="mh-row" style={{ justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed var(--bd)', fontSize: 12 }}>
            <span className="mh-row" style={{ gap: 8 }}>
              <span style={{ width: 10, height: 10, background: s.color, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ color: 'var(--fg)' }}>{s[nameKey]}</span>
            </span>
            <span className="mh-dim">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FunnelBars ────────────────────────────────────────────────────────────────
export function FunnelBars({ steps }: { steps: { event: string; name?: string; count: number }[] }) {
  const max = Math.max(...steps.map(s => s.count));
  return (
    <div>
      {steps.map((s, i) => {
        const pct = Math.round((s.count / max) * 100);
        const prev = i > 0 ? steps[i - 1].count : s.count;
        const drop = i > 0 ? Math.round(((prev - s.count) / prev) * 100) : 0;
        const conv = i > 0 ? ((s.count / prev) * 100).toFixed(1) : '100.0';
        return (
          <div className="funnel-step" key={i}>
            <div className="ix">#{i + 1}</div>
            <div>
              <div className="mh-row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div className="nm">{s.name || s.event}</div>
                  <div className="ev">{s.event}</div>
                </div>
                <div className="mh-row" style={{ gap: 12, alignItems: 'baseline' }}>
                  <span style={{ color: 'var(--fg-hi)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.count.toLocaleString('en-US')}</span>
                  <span className="mh-dim" style={{ fontSize: 11 }}>users</span>
                  {i > 0 && <span className={drop > 0 ? 'mh-bad' : ''} style={{ fontSize: 11 }}>↓ {drop}% drop · {conv}% conv</span>}
                </div>
              </div>
              <div className="bar-bg">
                <div className="bar-fill" style={{ width: pct + '%' }} />
                <div className="bar-text">
                  <span>{s.count.toLocaleString('en-US')} users</span>
                  {i > 0 && <span className="dropoff">↓{drop}%</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── BlockHeat (retention heatmap) ─────────────────────────────────────────────
export function BlockHeat({ days, cohorts }: {
  days: number[];
  cohorts: { week: string; size: number; vals: (number | null)[] }[];
}) {
  const heatStyle = (v: number | null) => {
    if (v == null) return { background: 'transparent', color: 'var(--fg-3)' };
    const i = Math.min(1, Math.max(0, v / 100));
    return { background: `color-mix(in oklab, var(--acc) ${i * 100}%, var(--bg-2))`, color: i > 0.45 ? 'var(--bg)' : 'var(--fg-hi)' };
  };
  const cols = `120px 60px repeat(${days.length}, minmax(48px, 1fr))`;
  return (
    <div className="retention-grid" style={{ gridTemplateColumns: cols }}>
      <div className="r-h" />
      <div className="r-h">Size</div>
      {days.map((d, i) => <div key={i} className="r-h">D{d}</div>)}
      {cohorts.map((row, ri) => (
        <>
          <div key={`l-${ri}`} className="r-label">{row.week}</div>
          <div key={`s-${ri}`} className="cell" style={{ background: 'var(--bg-2)', color: 'var(--fg)' }}>{row.size.toLocaleString('en-US')}</div>
          {row.vals.map((v, vi) => (
            <div key={vi} className="cell" style={heatStyle(v)}>{v == null ? '—' : v + '%'}</div>
          ))}
        </>
      ))}
    </div>
  );
}

// ── Toast system ──────────────────────────────────────────────────────────────
type Toast = { id: string; kind: 'ok' | 'warn' | 'bad'; text: string };
let _toastSetter: ((fn: (ts: Toast[]) => Toast[]) => void) | null = null;
export function toast(kind: Toast['kind'], text: string) {
  if (!_toastSetter) return;
  const id = Math.random().toString(36).slice(2);
  _toastSetter(ts => [...ts, { id, kind, text }]);
  setTimeout(() => _toastSetter!(ts => ts.filter(t => t.id !== id)), 3500);
}
export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => { _toastSetter = setToasts; return () => { _toastSetter = null; }; }, []);
  return (
    <div className="mh-toaster">
      {toasts.map(t => (
        <div key={t.id} className={`mh-toast ${t.kind}`} onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))}>
          <span className="t-ic">{t.kind === 'bad' ? '×' : t.kind === 'warn' ? '!' : '✓'}</span>
          <span style={{ flex: 1, color: 'var(--fg-hi)' }}>{t.text}</span>
          <span className="mh-dim" style={{ fontSize: 10 }}>dismiss</span>
        </div>
      ))}
    </div>
  );
}

// ── Confirm modal ─────────────────────────────────────────────────────────────
export function ConfirmModal({ open, title, body, danger, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onCancel, onConfirm }: {
  open: boolean; title: string; body: React.ReactNode; danger?: boolean;
  confirmLabel?: string; cancelLabel?: string; onCancel: () => void; onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); if (e.key === 'Enter') onConfirm(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onCancel, onConfirm]);
  if (!open) return null;
  return (
    <div className="mh-modal-wrap" onClick={onCancel}>
      <div className="mh-modal" onClick={e => e.stopPropagation()}>
        <header>
          <div className="crumb">{danger ? '⚠  destructive action' : 'confirm'}</div>
          <h3>{title}</h3>
        </header>
        <div className="body">{body}</div>
        <footer>
          <button className="mh-btn ghost" onClick={onCancel}>{cancelLabel} <span style={{ fontSize: 10, border: '1px solid var(--bd)', padding: '1px 4px', borderRadius: 2, marginLeft: 4 }}>ESC</span></button>
          <button className={`mh-btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>{confirmLabel} <span style={{ fontSize: 10, border: '1px solid currentColor', padding: '1px 4px', borderRadius: 2, marginLeft: 4 }}>↵</span></button>
        </footer>
      </div>
    </div>
  );
}

// ── Scatter plot ──────────────────────────────────────────────────────────────
export function ScatterPlot({ data, xKey, yKey, nameKey, xLabel, yLabel }: {
  data: Record<string, any>[]; xKey: string; yKey: string; nameKey: string; xLabel: string; yLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(400);
  const h = 220;
  const pad = { l: 44, b: 30, t: 12, r: 16 };

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const maxX = Math.max(...data.map(d => d[xKey]));
  const maxY = Math.max(...data.map(d => d[yKey]));
  const xPos = (v: number) => pad.l + (v / maxX) * (w - pad.l - pad.r);
  const yPos = (v: number) => h - pad.b - (v / maxY) * (h - pad.t - pad.b);

  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        {[0, .25, .5, .75, 1].map((t, i) => (
          <line key={i} x1={pad.l} x2={w - pad.r} y1={h - pad.b - t * (h - pad.t - pad.b)} y2={h - pad.b - t * (h - pad.t - pad.b)} stroke="var(--bd)" strokeDasharray="2 2" />
        ))}
        {[0, .25, .5, .75, 1].map((t, i) => (
          <text key={i} x={pad.l - 6} y={h - pad.b - t * (h - pad.t - pad.b) + 3} textAnchor="end" style={{ fill: 'var(--fg-3)', fontSize: 10.5 }}>{Math.round(maxY * t)}</text>
        ))}
        {[0, .25, .5, .75, 1].map((t, i) => (
          <text key={i} x={pad.l + t * (w - pad.l - pad.r)} y={h - pad.b + 14} textAnchor="middle" style={{ fill: 'var(--fg-3)', fontSize: 10.5 }}>{Math.round(maxX * t / 1000)}k</text>
        ))}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xPos(d[xKey])} cy={yPos(d[yKey])} r="6" fill="var(--acc-soft)" stroke="var(--acc)" />
            <text x={xPos(d[xKey]) + 10} y={yPos(d[yKey]) + 4} style={{ fill: 'var(--fg-2)', fontSize: 10.5 }}>{d[nameKey]}</text>
          </g>
        ))}
        <text x={w - pad.r} y={h - 4} textAnchor="end" style={{ fill: 'var(--fg-3)', fontSize: 10.5 }}>{xLabel} →</text>
        <text x={pad.l - 30} y={pad.t + 10} style={{ fill: 'var(--fg-3)', fontSize: 10.5 }}>↑ {yLabel}</text>
      </svg>
    </div>
  );
}
