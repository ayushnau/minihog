'use client';

import { useState, useEffect } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import PropertyFilter from '@/components/PropertyFilter';
import { KpiCard, Panel, AsciiHr, Tag, LineChart, AsciiBars, DonutChart, ToastHost } from '@/components/terminal';
import { api, EventCountResponse } from '@/lib/api';
import { useDebounce } from '@/lib/useDebounce';
import { getDefaultDateRange } from '@/lib/settings';
import { useEventSchema } from '@/lib/useEventSchema';
import { format, subDays } from 'date-fns';

export default function EventsPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventName, setEventName] = useState('');
  const [granularity, setGranularity] = useState<'day' | 'hour'>('day');
  const [propertyKey, setPropertyKey] = useState('page');
  const [data, setData] = useState<EventCountResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [namesLoading, setNamesLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterKey, setFilterKey] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const { getPropertyKeys, getPropertyValues } = useEventSchema();

  // Load default date range preference + URL params from AI Apply button
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ev = p.get('event');
    const fr = p.get('from');
    const to = p.get('to');
    const fk = p.get('filter_key');
    const fv = p.get('filter_value');
    const d = Number(getDefaultDateRange()) || 7;

    setFrom(fr || format(subDays(new Date(), d), 'yyyy-MM-dd'));
    setTo(to || format(new Date(), 'yyyy-MM-dd'));
    if (ev) setEventName(ev);
    if (fk) setFilterKey(fk);
    if (fv) setFilterValue(fv);
  }, []);

  // Fetch event names for dropdown
  useEffect(() => {
    setNamesLoading(true);
    fetch('/api/analytics/event-names', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.event_names)) {
          const names = d.event_names.map((e: { name: string }) => e.name);
          setEventNames(names);
          if (names.length > 0 && !eventName) setEventName(names[0]);
        }
      })
      .catch(() => {})
      .finally(() => setNamesLoading(false));
  }, []);

  const debouncedEvent = useDebounce(eventName.trim(), 400);

  useEffect(() => {
    if (!debouncedEvent) { setData(null); setError(null); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getEventCounts(debouncedEvent, from, to, {
        includeTimeSeries: true,
        includeProperties: true,
        includeJourneys: true,
        propertyKey,
        granularity,
        filterKey: filterKey || undefined,
        filterValue: filterValue || undefined,
      })
      .then(res => { if (!cancelled) setData(res); })
      .catch(err => { if (!cancelled) setError(err?.message || 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedEvent, from, to, propertyKey, granularity, filterKey, filterValue, refreshKey]);

  // Primary property to surface per event type — keeps pills readable
  const PRIMARY_PROP: Record<string, string> = {
    page_view: 'page', button_click: 'button_id', signup: 'method',
    purchase: 'product', add_to_cart: 'product', search: 'query',
    share: 'target', settings_change: 'setting',
  };
  const getPillLabel = (evName: string, props?: Record<string, unknown>) => {
    const key = PRIMARY_PROP[evName];
    const val = key && props?.[key];
    return val ? `${evName}(${val})` : evName;
  };

  const timeSeriesData = (data?.time_series ?? []).map(d => ({
    label: d.date, short: d.date.slice(5), count: d.count, unique_users: d.unique_users,
  }));

  const activeProperty = data?.available_properties?.includes(propertyKey)
    ? propertyKey
    : data?.available_properties?.[0] ?? propertyKey;

  return (
    <>
      <ToastHost />
      <div>
        <div className="mh-page-head">
          <div>
            <div className="crumb"><span className="mh-acc">●</span> events / {eventName || '…'}</div>
            <h1>Event Analytics</h1>
            <div className="subtitle">Time series, property breakdowns, and user journeys</div>
          </div>
          <div className="mh-row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {/* Event selector */}
            <div className="mh-field" style={{ minWidth: 180 }}>
              <span className="prompt">▸</span>
              {namesLoading ? (
                <span className="mh-dim mh-loading" style={{ fontSize: 11 }}>loading</span>
              ) : eventNames.length > 0 ? (
                <select value={eventName} onChange={e => setEventName(e.target.value)}>
                  {eventNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              ) : (
                <input type="text" value={eventName} onChange={e => setEventName(e.target.value)} placeholder="event name" />
              )}
            </div>
            {/* Granularity */}
            <div className="mh-field">
              <span className="prompt">◷</span>
              <select value={granularity} onChange={e => setGranularity(e.target.value as 'day' | 'hour')}>
                <option value="day">daily</option>
                <option value="hour">hourly</option>
              </select>
            </div>
            <DateRangePicker
              onDateChange={({ from: f, to: t }) => { setFrom(f); setTo(t); }}
              defaultDays={Number(getDefaultDateRange()) || 7}
            />
            {eventName && (
              <button className="mh-btn ghost" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
                {loading ? <span className="mh-loading">refreshing</span> : '↻ refresh'}
              </button>
            )}
          </div>
        </div>

        {/* Property filter row */}
        {eventName && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--bg-1)', border: '1px solid var(--bd)', borderRadius: 'var(--rad)' }}>
            <PropertyFilter
              event={eventName}
              from={from}
              to={to}
              filterKey={filterKey}
              filterValue={filterValue}
              onFilterChange={(k, v) => { setFilterKey(k); setFilterValue(v); }}
              schemaKeys={getPropertyKeys(eventName)}
              schemaValues={getPropertyValues(eventName, filterKey)}
            />
          </div>
        )}

        {!eventName.trim() && !namesLoading && (
          <div className="mh-muted-card" style={{ marginTop: 48 }}>
            <div style={{ marginBottom: 8, color: 'var(--acc)', fontSize: 22 }}>⊟</div>
            Select an event to view analytics.
          </div>
        )}

        {loading && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--fg-3)' }}>
            <span className="mh-loading">querying</span>
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: '10px 14px', background: 'rgba(245,115,107,.08)', border: '1px solid var(--bad)', color: 'var(--bad)', fontSize: 12, borderRadius: 'var(--rad)', marginBottom: 20 }}>
            ⚠ {error}
          </div>
        )}

        {data && !loading && (
          <>
            {/* KPIs */}
            <div className="mh-kpi-grid">
              <KpiCard label={`${eventName} events`} value={data.total_count} glyph="⊟" />
              <KpiCard label="Unique Users" value={data.unique_users} glyph="◈" />
              <KpiCard label="Granularity" value={granularity === 'day' ? 'Daily' : 'Hourly'} glyph="⌗" />
            </div>

            {/* Time series */}
            {timeSeriesData.length > 0 && (
              <>
                <AsciiHr label="time series" />
                <Panel
                  title={`$${eventName} over time`}
                  meta={`${granularity} · ${timeSeriesData.length} buckets`}
                  right={<Tag kind="acc">two series</Tag>}
                >
                  <LineChart
                    data={timeSeriesData}
                    lines={[
                      { key: 'count', label: 'count', color: 'acc' },
                      { key: 'unique_users', label: 'unique_users', color: 'info' },
                    ]}
                    height={240}
                    xEvery={Math.max(1, Math.floor(timeSeriesData.length / 8))}
                  />
                </Panel>
              </>
            )}

            {/* Properties breakdown */}
            {data.properties_breakdown && data.properties_breakdown.length > 0 && (
              <>
                <AsciiHr label={`breakdown by ${activeProperty}`} />
                <Panel
                  title={`$${eventName} by property`}
                  meta={`${data.properties_breakdown.length} values`}
                  right={
                    data.available_properties && data.available_properties.length > 0 ? (
                      <div className="mh-field" style={{ minWidth: 140 }}>
                        <span className="prompt">▾</span>
                        <select value={activeProperty} onChange={e => setPropertyKey(e.target.value)}>
                          {data.available_properties.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </div>
                    ) : undefined
                  }
                >
                  <div className="mh-grid-2" style={{ alignItems: 'start' }}>
                    <div>
                      <div className="mh-dim mh-uppercase" style={{ marginBottom: 10 }}>distribution</div>
                      <AsciiBars rows={data.properties_breakdown.slice(0, 8)} valueKey="count" nameKey="value" />
                    </div>
                    <div>
                      <div className="mh-dim mh-uppercase" style={{ marginBottom: 10 }}>composition</div>
                      <DonutChart rows={data.properties_breakdown.slice(0, 6)} valueKey="count" nameKey="value" />
                    </div>
                  </div>

                  <hr className="mh-dashed" style={{ margin: '16px 0' }} />

                  <table className="mh-t">
                    <thead>
                      <tr>
                        <th>{activeProperty}</th>
                        <th className="num">count</th>
                        <th className="num">unique users</th>
                        <th className="num">share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.properties_breakdown.slice(0, 10).map(row => {
                        const total = data.properties_breakdown!.reduce((s, x) => s + x.count, 0);
                        return (
                          <tr key={row.value}>
                            <td><span className="mh-acc">●</span> {row.value}</td>
                            <td className="num mh-bright mh-tabnum">{row.count.toLocaleString('en-US')}</td>
                            <td className="num mh-dim mh-tabnum">{row.unique_users.toLocaleString('en-US')}</td>
                            <td className="num mh-tabnum">{((row.count / total) * 100).toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Panel>
              </>
            )}

            {/* User journeys */}
            {data.user_journeys && data.user_journeys.length > 0 && (
              <>
                <AsciiHr label="user journeys" />
                <div className="mh-grid-2" style={{ alignItems: 'start' }}>
                  <Panel title="Sampled users" meta={`${Math.min(10, data.user_journeys.length)} sessions`}>
                    <div style={{ maxHeight: 420, overflowY: 'auto', marginInline: -14 }}>
                      {data.user_journeys.slice(0, 10).map(j => (
                        <div key={j.user_id} className="journey">
                          <div className="row1">
                            <span className="uid">{j.user_id.slice(0, 14)}…</span>
                            <span className="jmeta">{j.total_events} events</span>
                          </div>
                          <div className="jevents">
                            {j.events.map((ev, i) => (
                              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <span className={`pill${ev.event_name === eventName ? '' : ' dim'}`}>
                                  {getPillLabel(ev.event_name, ev.properties as Record<string, unknown>)}
                                </span>
                                {i < j.events.length - 1 && <span className="sep">→</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  {data.common_paths && data.common_paths.length > 0 && (
                    <Panel title="Common paths" meta="sliding 2–3 step windows · unique users">
                      <table className="mh-t" style={{ tableLayout: 'fixed', width: '100%' }}>
                        <thead>
                          <tr>
                            <th style={{ width: 28 }}>#</th>
                            <th>Sequence</th>
                            <th className="num" style={{ width: 52 }}>users</th>
                            <th className="num" style={{ width: 52 }}>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.common_paths.slice(0, 12).map((p, idx) => {
                            const steps = p.path_with_ids ?? p.path.map(s => ({ event_name: s, prop_value: undefined }));
                            return (
                              <tr key={idx}>
                                <td className="dim" style={{ verticalAlign: 'middle' }}>
                                  {String(idx + 1).padStart(2, '0')}
                                </td>
                                <td style={{ verticalAlign: 'middle', paddingBlock: 8 }}>
                                  <div className="jevents" style={{ flexWrap: 'nowrap', gap: 3 }}>
                                    {steps.map((step, i) => (
                                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                        <span className="pill" style={{ whiteSpace: 'nowrap' }}>
                                          <span style={{ opacity: 0.7 }}>{step.event_name}</span>
                                          {step.prop_value && (
                                            <span style={{ color: 'var(--acc)', marginLeft: 2 }}>({step.prop_value})</span>
                                          )}
                                        </span>
                                        {i < steps.length - 1 && <span className="sep">→</span>}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="num mh-bright mh-tabnum" style={{ verticalAlign: 'middle', fontWeight: 700 }}>
                                  {p.count}
                                </td>
                                <td className="num mh-tabnum" style={{ verticalAlign: 'middle', color: 'var(--acc)' }}>
                                  {p.percentage.toFixed(0)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </Panel>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
