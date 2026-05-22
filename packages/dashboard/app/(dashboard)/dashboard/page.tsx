'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import { KpiCard, Panel, AsciiHr, Tag, Spark, ToastHost } from '@/components/terminal';
import { api, EventCountResponse, EventNameItem } from '@/lib/api';
import { getDefaultDateRange } from '@/lib/settings';
import { format, subDays } from 'date-fns';

interface LiveEvent {
  id: string;
  eventName: string;
  distinctId: string;
  timestamp: string;
  properties: Record<string, unknown>;
}

interface EventCard {
  name: string;
  total: number;
  unique: number;
  timeSeries: number[];
}

const EVENT_GLYPHS: Record<string, string> = {
  page_view: '⊟',
  menu_view: '◈',
  button_click: '▸',
  reservation_started: '⌗',
  reservation_completed: '✦',
  order_started: '⬡',
  order_item_added: '⬇',
  order_completed: '⊕',
  coupon_applied: '%',
  signup: '✦',
  review_submitted: '★',
};

// Colors per event type for the live stream
const EVENT_COLORS: Record<string, string> = {
  page_view: 'var(--fg-2)',
  menu_view: '#60a5fa',
  button_click: 'var(--fg-2)',
  reservation_started: '#34d399',
  reservation_completed: '#10b981',
  order_started: '#f59e0b',
  order_item_added: '#f59e0b',
  order_completed: '#f59e0b',
  coupon_applied: '#a78bfa',
  signup: '#c084fc',
  review_submitted: '#fb923c',
};

function eventGlyph(name: string): string {
  return EVENT_GLYPHS[name] || '⊟';
}

function eventColor(name: string): string {
  return EVENT_COLORS[name] || 'var(--fg-hi)';
}

function fmtTs(ts: string): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Pick one interesting property to display (skip device, returning)
const SKIP_PROPS = new Set(['device', 'returning', 'referrer', 'country']);
function pickProp(props: Record<string, unknown>): string {
  for (const [k, v] of Object.entries(props)) {
    if (!SKIP_PROPS.has(k) && v !== null && v !== undefined && v !== '') {
      const val = String(v);
      return `${k}=${val.length > 12 ? val.slice(0, 12) + '…' : val}`;
    }
  }
  return '';
}

function truncId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 10)}…` : id;
}

export default function DashboardPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<EventCard[]>([]);
  const [allLiveEvents, setAllLiveEvents] = useState<LiveEvent[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [liveLoading, setLiveLoading] = useState(true);
  const [totalAll, setTotalAll] = useState(0);
  const [uniqueAll, setUniqueAll] = useState(0);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const d = Number(getDefaultDateRange()) || 7;
    setFrom(format(subDays(new Date(), d), 'yyyy-MM-dd'));
    setTo(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  // Start streaming animation: reveal one event per second
  const startStream = useCallback((events: LiveEvent[]) => {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    setVisibleCount(0);
    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      setVisibleCount(count);
      if (count >= events.length) {
        clearInterval(timer);
        // After a pause, restart the animation from top
        setTimeout(() => startStream(events), 4000);
      }
    }, 800);
    streamTimerRef.current = timer;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadLive = useCallback(async () => {
    try {
      const events = await api.getLiveEvents();
      setAllLiveEvents(events);
      setLiveLoading(false);
      startStream(events);
    } catch {
      setLiveLoading(false);
    }
  }, [startStream]);

  useEffect(() => {
    loadLive();
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, [loadLive]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const names: EventNameItem[] = await api.getEventNames();
        if (cancelled) return;

        const top = names.slice(0, 12);
        const results = await Promise.all(
          top.map((n) =>
            api.getEventCounts(n.name, from, to, { includeTimeSeries: true }).catch(() => null)
          )
        );
        if (cancelled) return;

        const built: EventCard[] = [];
        let sumTotal = 0;
        let maxUnique = 0;

        results.forEach((r, i) => {
          if (!r) return;
          const series = (r.time_series || []).map((p: { count: number }) => p.count);
          built.push({ name: top[i].name, total: r.total_count, unique: r.unique_users, timeSeries: series });
          sumTotal += r.total_count;
          if (r.unique_users > maxUnique) maxUnique = r.unique_users;
        });

        setCards(built);
        setTotalAll(sumTotal);
        setUniqueAll(maxUnique);
        setLoading(false);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load dashboard data';
          setError(msg);
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [from, to]);

  const visibleEvents = allLiveEvents.slice(0, visibleCount);

  return (
    <>
      <ToastHost />
      <div>
        <div className="mh-page-head">
          <div>
            <div className="crumb">minihog · workspace</div>
            <h1>Overview</h1>
            <div className="subtitle">Aggregated metrics across all tracked events</div>
          </div>
          <DateRangePicker
            onDateChange={({ from: f, to: t }) => { setFrom(f); setTo(t); }}
            defaultDays={Number(getDefaultDateRange()) || 7}
          />
        </div>

        {loading && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--fg-3)' }}>
            <span className="mh-loading">loading</span>
          </div>
        )}

        {error && (
          <div className="mh-tag bad" style={{ padding: '10px 14px', fontSize: 12, marginBottom: 20 }}>
            × {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Summary KPIs */}
            <div className="mh-kpi-grid" style={{ marginBottom: 20 }}>
              <KpiCard label="Total Events" value={totalAll} glyph="⊟" />
              <KpiCard label="Unique Users" value={uniqueAll} glyph="◈" />
              <KpiCard label="Event Types" value={cards.length} glyph="⌗" />
            </div>

            <AsciiHr label="events" />

            {/* Per-event cards grid */}
            {cards.length === 0 ? (
              <div className="mh-muted-card">No events in this period. Try a wider date range.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
                {cards.map((c) => (
                  <div key={c.name} className="mh-panel" style={{ padding: '14px 16px', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ color: eventColor(c.name), marginRight: 6 }}>{eventGlyph(c.name)}</span>
                        {c.name}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--acc)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: 'var(--acc)' }} />
                        live
                      </span>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--fg-hi)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 4 }}>
                      {c.total.toLocaleString('en-US')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 10 }}>
                      {c.unique.toLocaleString('en-US')} unique users
                    </div>
                    {c.timeSeries.length > 1 && (
                      <Spark data={c.timeSeries} />
                    )}
                  </div>
                ))}
              </div>
            )}

            <AsciiHr label="live event stream" />

            {/* Live stream full-width + attention side by side */}
            <div className="mh-grid-2" style={{ gap: 16 }}>
              <Panel
                title="Live Event Stream"
                meta="real-time tail · last 30"
                right={
                  <span style={{
                    fontSize: 11, color: '#4ade80',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '2px 8px', border: '1px solid #4ade8044',
                    borderRadius: 4, background: 'rgba(74,222,128,0.06)',
                  }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'mh-pulse 1.2s ease-in-out infinite' }} />
                    streaming
                  </span>
                }
              >
                {liveLoading ? (
                  <div style={{ fontSize: 12, color: 'var(--fg-3)', padding: '8px 0' }}>
                    <span className="mh-loading">loading</span>
                  </div>
                ) : allLiveEvents.length === 0 ? (
                  <div className="mh-muted-card">No recent events.</div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1 }}>
                    {/* Header row */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '64px 1fr 110px 1fr',
                      gap: 8, padding: '4px 6px 8px',
                      color: 'var(--fg-3)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                      borderBottom: '1px solid var(--bd)',
                    }}>
                      <span>time</span>
                      <span>event</span>
                      <span>user</span>
                      <span>property</span>
                    </div>
                    <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                      {visibleEvents.map((e, i) => (
                        <div
                          key={`${e.id}-${i}`}
                          style={{
                            display: 'grid', gridTemplateColumns: '64px 1fr 110px 1fr',
                            gap: 8, padding: '6px 6px',
                            borderBottom: '1px dashed var(--bd)',
                            alignItems: 'center',
                            animation: i === visibleEvents.length - 1 ? 'mh-fadein 0.3s ease' : 'none',
                          }}
                        >
                          <span style={{ color: 'var(--fg-3)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                            {fmtTs(e.timestamp)}
                          </span>
                          <span style={{ color: eventColor(e.eventName), fontWeight: 600 }}>
                            {e.eventName}
                          </span>
                          <span style={{ color: 'var(--fg-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {truncId(e.distinctId)}
                          </span>
                          <span style={{ color: 'var(--fg-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {pickProp(e.properties)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>

              <Panel title="Attention" meta="workspace signals">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {totalAll === 0 ? (
                    <div className="mh-muted-card">No signals yet — start tracking events.</div>
                  ) : (
                    <>
                      <div style={{ padding: '10px 12px', border: '1px solid var(--acc-bd)', background: 'var(--acc-soft)', borderRadius: 'var(--rad)', fontSize: 12 }}>
                        <span style={{ color: 'var(--acc)', marginRight: 8 }}>✓</span>
                        <span style={{ color: 'var(--fg-hi)' }}>Ingest healthy</span>
                        <span className="mh-dim" style={{ fontSize: 11, marginLeft: 8 }}>events flowing normally</span>
                      </div>
                      <div style={{ padding: '10px 12px', border: '1px solid var(--bd)', background: 'var(--bg-2)', borderRadius: 'var(--rad)', fontSize: 12 }}>
                        <span style={{ color: 'var(--info)', marginRight: 8 }}>i</span>
                        <span style={{ color: 'var(--fg-hi)' }}>{uniqueAll.toLocaleString('en-US')} active users</span>
                        <span className="mh-dim" style={{ fontSize: 11, marginLeft: 8 }}>in selected range</span>
                      </div>
                      <div style={{ padding: '10px 12px', border: '1px solid var(--bd)', background: 'var(--bg-2)', borderRadius: 'var(--rad)', fontSize: 12 }}>
                        <span style={{ color: 'var(--warn)', marginRight: 8 }}>!</span>
                        <span style={{ color: 'var(--fg-hi)' }}>Set up funnel</span>
                        <span className="mh-dim" style={{ fontSize: 11, marginLeft: 8 }}>to track conversion</span>
                      </div>
                    </>
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
