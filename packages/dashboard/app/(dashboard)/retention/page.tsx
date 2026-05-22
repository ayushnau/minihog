'use client';

import { useState, useEffect, useCallback } from 'react';
import { Panel, AsciiHr, KpiCard, LineChart, BlockHeat, ToastHost } from '@/components/terminal';
import { api } from '@/lib/api';
import { format, subDays } from 'date-fns';
import DateRangePicker from '@/components/DateRangePicker';
import { getDefaultDateRange } from '@/lib/settings';

interface HeatmapData {
  days: number[];
  cohorts: Array<{ week: string; weekStart: string; size: number; retentions: (number | null)[] }>;
  avg_retentions: (number | null)[];
  total_cohort_size: number;
}

// Must match HEATMAP_DAYS in the backend cohortHeatmap service
const DAY_PRESETS = [1, 3, 7, 14, 21, 28];

function snapToNearest(d: number, days: number[]): number {
  if (!days.length) return d;
  return days.reduce((best, cur) =>
    Math.abs(cur - d) < Math.abs(best - d) ? cur : best
  , days[0]);
}

export default function RetentionPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo]     = useState(format(new Date(), 'yyyy-MM-dd'));
  const [cohort, setCohort]       = useState('');
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [namesLoading, setNamesLoading] = useState(true);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [day, setDay]           = useState(7);

  // URL params from AI Apply
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('cohort')) setCohort(p.get('cohort')!);
    if (p.get('day'))    setDay(Number(p.get('day')) || 7);
    if (p.get('from'))   setFrom(p.get('from')!);
    if (p.get('to'))     setTo(p.get('to')!);
  }, []);

  useEffect(() => {
    const d = Number(getDefaultDateRange()) || 30;
    setFrom(format(subDays(new Date(), d), 'yyyy-MM-dd'));
    setTo(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  useEffect(() => {
    setNamesLoading(true);
    api.getEventNames()
      .then(names => {
        const ns = names.map(n => n.name);
        setEventNames(ns);
        const p = new URLSearchParams(window.location.search);
        if (ns.length > 0 && !p.get('cohort')) setCohort(ns[0]);
      })
      .catch(() => {})
      .finally(() => setNamesLoading(false));
  }, []);

  const loadHeatmap = useCallback(async () => {
    if (!cohort) return;
    setLoading(true); setError(null);
    try {
      const res = await api.getRetentionHeatmap(cohort, from, to);
      if (res.success) setHeatmap(res);
      else setError('No data returned');
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [cohort, from, to]);

  useEffect(() => { loadHeatmap(); }, [loadHeatmap]);

  // Map backend `retentions` → BlockHeat `vals`
  const heatCohorts = heatmap
    ? heatmap.cohorts.map(c => ({ week: c.week, size: c.size, vals: c.retentions }))
    : [];

  // Drill-down stats for selected day — snap to nearest available day
  const effectiveDay = heatmap ? snapToNearest(day, heatmap.days) : day;
  const ix = heatmap ? heatmap.days.indexOf(effectiveDay) : -1;
  const cohortAvg = (() => {
    if (!heatmap || ix < 0) return 0;
    const vals = heatmap.cohorts.map(c => c.retentions[ix]).filter((v): v is number => v !== null);
    if (!vals.length) return heatmap.avg_retentions[ix] ?? 0;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  })();
  const sizeTotal    = heatmap?.total_cohort_size ?? 0;
  const retainedTotal = Math.round(sizeTotal * cohortAvg / 100);

  // Curve data: D0=100 + available day columns
  const curveData = heatmap
    ? [
        { short: 'D0', rate: 100 },
        ...heatmap.days.map((d, di) => {
          const vals = heatmap.cohorts.map(c => c.retentions[di]).filter((v): v is number => v !== null);
          const avg  = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
          return { short: `D${d}`, rate: avg };
        }).filter((_, di) => heatmap.avg_retentions[di] !== null),
      ]
    : [];

  return (
    <>
      <ToastHost />
      <div>
        {/* Page head */}
        <div className="mh-page-head">
          <div>
            <div className="crumb">
              <span style={{ color: 'var(--acc)' }}>●</span> retention / day-{effectiveDay}
            </div>
            <h1>Retention</h1>
            <div className="subtitle">How well do new users come back?</div>
          </div>
          <div className="mh-row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Event picker */}
            <div className="mh-field">
              {namesLoading
                ? <span className="mh-dim mh-loading" style={{ fontSize: 11 }}>loading</span>
                : <select value={cohort} onChange={e => setCohort(e.target.value)}>
                    {eventNames.map(n => <option key={n}>{n}</option>)}
                  </select>
              }
            </div>
            <DateRangePicker
              onDateChange={({ from: f, to: t }) => { setFrom(f); setTo(t); }}
              defaultDays={Number(getDefaultDateRange()) || 30}
            />
          </div>
        </div>

        {loading && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--fg-3)' }}>
            <span className="mh-loading">computing cohorts</span>
          </div>
        )}
        {error && (
          <div className="mh-tag bad" style={{ padding: '10px 14px', fontSize: 12, marginBottom: 20 }}>
            × {error}
          </div>
        )}

        {heatmap && !loading && (
          <>
            {/* ── Cohort heatmap ─────────────────────────────────── */}
            <Panel
              title="Cohort heat — weekly cohorts × days since"
              meta={`cohort=${cohort} · ${heatmap.cohorts.length} cohorts · ${effectiveDay} days`}
              right={<span className="mh-tag">⌗ heat map</span>}
            >
              {heatCohorts.length === 0 ? (
                <div className="mh-muted-card">No cohort data for this period.</div>
              ) : (
                <>
                  <BlockHeat days={heatmap.days} cohorts={heatCohorts} />
                  <hr className="mh-dashed" style={{ margin: '14px 0' }} />
                  <div className="mh-row" style={{ gap: 12 }}>
                    <span className="mh-dim" style={{ fontSize: 11 }}>Intensity</span>
                    {[0, 0.25, 0.5, 0.75, 1].map(v => (
                      <div key={v} className="mh-row" style={{ gap: 6, alignItems: 'center' }}>
                        <span style={{
                          width: 14, height: 14, display: 'inline-block', border: '1px solid var(--bd)', borderRadius: 1,
                          background: `color-mix(in oklab, var(--acc) ${v * 100}%, var(--bg-2))`,
                        }} />
                        <span className="mh-dim" style={{ fontSize: 11 }}>{(v * 100) | 0}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Panel>

            <AsciiHr label="day-N drill-down" />

            {/* ── Drill-down ───────────────────────────────────────── */}
            <div className="mh-grid-2" style={{ gridTemplateColumns: '280px 1fr', alignItems: 'start', gap: 16 }}>

              {/* Left: pick a day */}
              <Panel title="Pick a Day">
                <div className="mh-dim" style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  presets
                </div>
                <div className="mh-row" style={{ gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                  {DAY_PRESETS.map(p => (
                    <button
                      key={p}
                      className={`mh-btn sm ${p === day ? 'primary' : 'ghost'}`}
                      onClick={() => setDay(p)}
                    >
                      D{p}
                    </button>
                  ))}
                </div>

                <div className="mh-dim" style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>custom day</div>
                <div className="mh-field" style={{ width: '100%', marginBottom: 14 }}>
                  <span className="prompt">N=</span>
                  <input
                    type="number" min={1} max={90}
                    value={day}
                    onChange={e => setDay(parseInt(e.target.value || '1', 10))}
                  />
                </div>

                <hr className="mh-dashed" style={{ margin: '0 0 14px' }} />

                <div className="mh-dim" style={{ fontSize: 11.5, lineHeight: 1.55 }}>
                  Cohort users are those who triggered{' '}
                  <span style={{ color: 'var(--acc)', fontFamily: 'var(--font-mono)' }}>{cohort}</span>{' '}
                  within the selected range. A user counts as{' '}
                  <span style={{ color: 'var(--acc)' }}>retained</span>{' '}
                  if they performed any event on or after day {effectiveDay} of their cohort.
                  {effectiveDay !== day && (
                    <span style={{ display: 'block', marginTop: 6, color: 'var(--fg-3)', fontSize: 10.5, fontFamily: 'var(--font-mono)' }}>
                      ↳ D{day} not in dataset — showing nearest D{effectiveDay}
                    </span>
                  )}
                </div>
              </Panel>

              {/* Right: KPIs + curve */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="mh-kpi-grid">
                  <KpiCard label="Cohort Size"         value={sizeTotal}      glyph="◉" />
                  <KpiCard label="Retained Users"      value={retainedTotal}  glyph="✓" />
                  <KpiCard
                    label={effectiveDay !== day ? `Day-${effectiveDay} Retention (nearest to D${day})` : `Day-${day} Retention`}
                    value={cohortAvg.toFixed(2) + '%'}
                    glyph="%"
                    delta={(cohortAvg - 19.4) / 100}
                  />
                </div>

                {curveData.length > 1 && (
                  <Panel title="Day-by-Day Retention Curve" meta={`cohort=${cohort}`}>
                    <LineChart
                      data={curveData}
                      lines={[{ key: 'rate', label: 'retained %', color: 'acc' }]}
                      height={220}
                      xEvery={1}
                    />
                  </Panel>
                )}
              </div>
            </div>
          </>
        )}

        {heatmap && !loading && heatmap.cohorts.length === 0 && (
          <div className="mh-muted-card" style={{ marginTop: 20 }}>
            No events found for <b>{cohort}</b> in this date range. Try a wider range or different event.
          </div>
        )}
      </div>
    </>
  );
}
