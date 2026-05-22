'use client';

import { useState, useEffect } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import PropertyFilter from '@/components/PropertyFilter';
import { Panel, AsciiHr, Tag, FunnelBars, ToastHost } from '@/components/terminal';
import { api, FunnelResponse, FunnelStepDef } from '@/lib/api';
import { format, subDays } from 'date-fns';
import { useEventSchema } from '@/lib/useEventSchema';

export default function FunnelPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSteps, setSelectedSteps] = useState<FunnelStepDef[]>([]);
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [namesLoading, setNamesLoading] = useState(true);
  const [pickerValue, setPickerValue] = useState('');
  const [autoRun, setAutoRun] = useState(false);
  const { getPropertyKeys, getPropertyValues } = useEventSchema();

  // Read URL params from AI Apply button
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const stepsParam = p.get('steps');
    const fr = p.get('from');
    const to = p.get('to');
    if (fr) setFrom(fr);
    if (to) setTo(to);
    if (stepsParam) {
      try {
        const parsed = JSON.parse(stepsParam);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          setSelectedSteps(parsed);
          setAutoRun(true); // auto-trigger analysis
        }
      } catch {}
    }
  }, []);

  // Fetch event names
  useEffect(() => {
    setNamesLoading(true);
    fetch('/api/analytics/event-names', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.event_names)) {
          const names = d.event_names.map((e: { name: string }) => e.name);
          setEventNames(names);
          if (names.length > 0) {
            setPickerValue(names[0]);
            // Only set default steps if URL params didn't already set them
            const p = new URLSearchParams(window.location.search);
            if (!p.get('steps')) {
              setSelectedSteps(names.slice(0, Math.min(3, names.length)).map(e => ({ event: e })));
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setNamesLoading(false));
  }, []);

  const loadData = async () => {
    if (selectedSteps.length < 2) {
      setError('At least 2 steps required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.getFunnelAnalysis(selectedSteps, from, to);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load funnel');
    } finally {
      setLoading(false);
    }
  };

  // Auto-run when steps arrive from URL params
  useEffect(() => {
    if (autoRun && selectedSteps.length >= 2) {
      setAutoRun(false);
      loadData();
    }
  }, [autoRun, selectedSteps]);

  useEffect(() => {
    if (selectedSteps.length >= 2) loadData();
  }, [from, to]);

  const addStep = () => {
    if (pickerValue) setSelectedSteps(s => [...s, { event: pickerValue }]);
  };

  const removeStep = (idx: number) => setSelectedSteps(s => s.filter((_, i) => i !== idx));
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setSelectedSteps(s => { const a = [...s]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; return a; });
  };
  const moveDown = (idx: number) => {
    setSelectedSteps(s => { if (idx >= s.length - 1) return s; const a = [...s]; [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]; return a; });
  };
  const updateStepFilter = (idx: number, key: string, value: string) => {
    setSelectedSteps(s => s.map((step, i) => i === idx ? { ...step, propertyKey: key || undefined, propertyValue: value || undefined } : step));
  };

  const funnelSteps = data?.funnel.map(s => ({
    event: s.event_name,
    count: s.users,
  })) ?? [];

  const overallConv = data && data.funnel.length > 1 && (data.funnel[0].users ?? 0) > 0
    ? ((data.funnel[data.funnel.length - 1].users / data.funnel[0].users) * 100).toFixed(1)
    : null;

  return (
    <>
      <ToastHost />
      <div>
        <div className="mh-page-head">
          <div>
            <div className="crumb">minihog · analytics</div>
            <h1>Funnel Analysis</h1>
            <div className="subtitle">Multi-step conversion with drop-off rates</div>
          </div>
          <DateRangePicker
            onDateChange={({ from: f, to: t }) => { setFrom(f); setTo(t); }}
            defaultDays={30}
          />
        </div>

        {/* Builder */}
        <Panel title="Funnel Builder" meta={`${selectedSteps.length} steps`} style={{ marginBottom: 16 }}>
          {/* Step list */}
          {selectedSteps.length > 0 && (
            <div className="mh-col" style={{ gap: 8, marginBottom: 12 }}>
              {selectedSteps.map((step, i) => (
                <div key={i} style={{ background: 'var(--bg-2)', border: '1px solid var(--bd)', borderRadius: 'var(--rad)', padding: '6px 10px' }}>
                  <div className="mh-row" style={{ gap: 6, alignItems: 'center' }}>
                    <span className="mh-dim mh-tabnum" style={{ fontSize: 10, width: 18, flexShrink: 0 }}>#{i + 1}</span>
                    <span style={{ flex: 1, color: 'var(--acc)', fontSize: 12, fontWeight: 600 }}>{step.event}</span>
                    {step.propertyKey && step.propertyValue && (
                      <span style={{ fontSize: 10, color: 'var(--fg-3)', background: 'var(--bg-3)', padding: '1px 6px', borderRadius: 2 }}>
                        {step.propertyKey}={step.propertyValue}
                      </span>
                    )}
                    <button className="mh-btn ghost sm" onClick={() => moveUp(i)} disabled={i === 0} style={{ padding: '1px 6px', fontSize: 11 }}>↑</button>
                    <button className="mh-btn ghost sm" onClick={() => moveDown(i)} disabled={i === selectedSteps.length - 1} style={{ padding: '1px 6px', fontSize: 11 }}>↓</button>
                    <button className="mh-btn ghost sm" onClick={() => removeStep(i)} style={{ padding: '1px 6px', fontSize: 11, color: 'var(--bad)' }}>×</button>
                  </div>
                  <PropertyFilter
                    event={step.event}
                    from={from}
                    to={to}
                    filterKey={step.propertyKey || ''}
                    filterValue={step.propertyValue || ''}
                    onFilterChange={(k, v) => updateStepFilter(i, k, v)}
                    compact
                    schemaKeys={getPropertyKeys(step.event)}
                    schemaValues={getPropertyValues(step.event, step.propertyKey || '')}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Add step row */}
          <div className="mh-row" style={{ gap: 8 }}>
            <div className="mh-field" style={{ flex: 1 }}>
              <span className="prompt">+</span>
              {namesLoading ? (
                <span className="mh-dim mh-loading" style={{ fontSize: 11 }}>loading</span>
              ) : eventNames.length > 0 ? (
                <select value={pickerValue} onChange={e => setPickerValue(e.target.value)}>
                  {eventNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              ) : (
                <input type="text" value={pickerValue} onChange={e => setPickerValue(e.target.value)} placeholder="event name" />
              )}
            </div>
            <button className="mh-btn ghost" onClick={addStep} disabled={!pickerValue}>+ Add Step</button>
            <button className="mh-btn primary" onClick={loadData} disabled={loading || selectedSteps.length < 2}>
              {loading ? <span className="mh-loading">analyzing</span> : 'Analyze →'}
            </button>
          </div>
          {selectedSteps.length < 2 && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--fg-3)' }}>Add at least 2 steps to analyze.</div>
          )}
        </Panel>

        {error && (
          <div className="mh-tag bad" style={{ padding: '10px 14px', fontSize: 12, marginBottom: 20 }}>
            × {error}
          </div>
        )}

        {loading && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--fg-3)' }}>
            <span className="mh-loading">computing funnel</span>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Summary KPIs */}
            <div className="mh-kpi-grid" style={{ marginBottom: 20 }}>
              <div className="mh-kpi">
                <div className="label">⌇ Top of Funnel</div>
                <div className="value">{(data.total_users_at_first_step || data.funnel[0]?.users || 0).toLocaleString('en-US')}</div>
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--fg-3)' }}>users entered</div>
              </div>
              <div className="mh-kpi">
                <div className="label">▸ Bottom of Funnel</div>
                <div className="value">{(data.funnel[data.funnel.length - 1]?.users || 0).toLocaleString('en-US')}</div>
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--fg-3)' }}>users converted</div>
              </div>
              <div className="mh-kpi">
                <div className="label">⌗ Overall Conversion</div>
                <div className="value" style={{ color: overallConv && Number(overallConv) > 30 ? 'var(--acc)' : 'var(--bad)' }}>
                  {overallConv ?? '—'}<span className="unit">%</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--fg-3)' }}>end-to-end rate</div>
              </div>
            </div>

            <AsciiHr label="funnel steps" />

            <div className="funnel-split">
              {/* Funnel bars */}
              <Panel title="Step Breakdown" meta={`${data.funnel.length} steps`}>
                <FunnelBars steps={funnelSteps} />
              </Panel>

              {/* Tabular detail */}
              <Panel title="Detailed Metrics" meta="per-step analysis">
                <table className="mh-t">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Event</th>
                      <th>Filter</th>
                      <th className="num">Users</th>
                      <th className="num">Drop-off</th>
                      <th className="num">Conv.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.funnel.map((s, i) => {
                      const prev = i > 0 ? data.funnel[i - 1].users : s.users;
                      const conv = i > 0 ? (prev > 0 ? ((s.users / prev) * 100).toFixed(1) : '0.0') : '100.0';
                      return (
                        <tr key={s.step}>
                          <td className="dim">#{s.step}</td>
                          <td style={{ color: 'var(--acc)' }}>{s.event_name}</td>
                          <td style={{ fontSize: 11, color: 'var(--fg-3)' }}>{s.property_filter || '—'}</td>
                          <td className="num" style={{ color: 'var(--fg-hi)', fontWeight: 700 }}>
                            {s.users.toLocaleString('en-US')}
                          </td>
                          <td className="num" style={{ color: (s.drop_off_percentage ?? 0) > 0 ? 'var(--bad)' : 'var(--fg-3)' }}>
                            {(s.drop_off_percentage ?? 0) > 0 ? `↓ ${(s.drop_off_percentage ?? 0).toFixed(1)}%` : '—'}
                          </td>
                          <td className="num" style={{ color: Number(conv) > 70 ? 'var(--acc)' : 'var(--fg)' }}>
                            {conv}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div style={{ marginTop: 16, padding: '12px', background: 'var(--bg-2)', border: '1px dashed var(--bd-2)', borderRadius: 'var(--rad)', fontSize: 12 }}>
                  <div style={{ color: 'var(--fg-3)', marginBottom: 4, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase' }}>Insight</div>
                  {overallConv && Number(overallConv) > 0 ? (
                    <span style={{ color: 'var(--fg)' }}>
                      Your funnel converts at <span style={{ color: 'var(--acc)', fontWeight: 700 }}>{overallConv}%</span> overall.
                      {Number(overallConv) < 10 && <span style={{ color: 'var(--warn)' }}> Consider optimizing your highest drop-off step.</span>}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--fg-3)' }}>No conversion data available for this period.</span>
                  )}
                </div>
              </Panel>
            </div>
          </>
        )}
      </div>
    </>
  );
}
