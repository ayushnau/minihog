'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import MiniHog from 'minihog-sdk';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'journey';
}

interface Toast {
  id: number;
  eventName: string;
  props: Record<string, any>;
}

// ── Toast component ───────────────────────────────────────────────────────────

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => onDismiss(t.id)} style={{
          background: '#181b24', border: '1px solid #2a2e3a',
          borderLeft: '3px solid #3b82f6',
          borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          animation: 'toastIn 0.2s ease',
          maxWidth: 300, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#93c5fd', marginBottom: 4 }}>
            ▸ {t.eventName}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
            {Object.entries(t.props).slice(0, 3).map(([k, v]) => (
              <span key={k} style={{ display: 'inline-block', marginRight: 8 }}>
                <span style={{ color: '#8b92a5' }}>{k}</span>
                <span style={{ color: '#4b5563' }}>:</span>
                <span style={{ color: '#e0e4ec' }}> {String(v)}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Bella Cucina restaurant events ────────────────────────────────────────────

const PRESET_EVENTS = [
  {
    group: 'Discovery',
    events: [
      { name: 'page_view',  label: 'Home Page',        emoji: '🏠', props: { page: '/home',         referrer: 'google',    device: 'desktop', country: 'US' } },
      { name: 'page_view',  label: 'Menu Page',         emoji: '📋', props: { page: '/menu',         referrer: 'direct',    device: 'desktop', country: 'US' } },
      { name: 'menu_view',  label: 'View Starters',     emoji: '🥗', props: { category: 'starters',  device: 'desktop' } },
      { name: 'menu_view',  label: 'View Pasta',        emoji: '🍝', props: { category: 'pasta',     device: 'desktop' } },
      { name: 'menu_view',  label: 'View Pizza',        emoji: '🍕', props: { category: 'pizza',     device: 'mobile'  } },
      { name: 'search',     label: 'Search Menu',       emoji: '🔍', props: { query: 'gluten free',  results_count: 4,  device: 'desktop' } },
    ],
  },
  {
    group: 'Reservation',
    events: [
      { name: 'button_click',           label: 'Click Reserve Button', emoji: '👆', props: { button_id: 'reserve-table', button_label: 'Reserve a Table', page: '/reservations', device: 'desktop' } },
      { name: 'reservation_started',    label: 'Start Reservation',    emoji: '📅', props: { party_size: 4, device: 'desktop' } },
      { name: 'reservation_completed',  label: 'Complete Reservation', emoji: '✅', props: { party_size: 4, time_slot: '19:00', location: 'Downtown', device: 'desktop' } },
    ],
  },
  {
    group: 'Online Order',
    events: [
      { name: 'button_click',     label: 'Click Order Now',    emoji: '👆', props: { button_id: 'order-now', button_label: 'Order Now', page: '/menu', device: 'mobile' } },
      { name: 'order_started',    label: 'Start Order',        emoji: '🛒', props: { order_type: 'delivery', device: 'mobile' } },
      { name: 'order_item_added', label: 'Add Tagliatelle',    emoji: '➕', props: { item_name: 'Tagliatelle Bolognese', category: 'pasta',    price: 22, device: 'mobile' } },
      { name: 'order_item_added', label: 'Add Tiramisu',       emoji: '➕', props: { item_name: 'Tiramisu',              category: 'desserts', price: 10, device: 'mobile' } },
      { name: 'coupon_applied',   label: 'Apply Coupon',       emoji: '🏷️', props: { code: 'WELCOME10', discount: 3.20, device: 'mobile' } },
      { name: 'order_completed',  label: 'Complete Order',     emoji: '✅', props: { total: 38.80, item_count: 2, order_type: 'delivery', payment_method: 'card', location: 'Downtown', device: 'mobile' } },
    ],
  },
  {
    group: 'Loyalty & Engagement',
    events: [
      { name: 'signup',           label: 'Join Loyalty Programme', emoji: '⭐', props: { method: 'email', device: 'desktop', referrer: 'direct' } },
      { name: 'review_submitted', label: 'Submit Review',          emoji: '⭐', props: { rating: 5, device: 'desktop' } },
      { name: 'page_view',        label: 'Reservations Page',      emoji: '📄', props: { page: '/reservations', referrer: 'direct', device: 'mobile', country: 'GB' } },
    ],
  },
];

// ── Simulated user journeys ───────────────────────────────────────────────────

const JOURNEYS = [
  {
    id: 'reservation',
    label: 'Visitor → Reservation',
    description: 'New visitor from Google discovers the restaurant and books a table',
    color: '#4ade80',
    steps: [
      { name: 'page_view',            props: { page: '/home',         referrer: 'google',  device: 'desktop', country: 'US' } },
      { name: 'page_view',            props: { page: '/menu',         referrer: 'direct',  device: 'desktop', country: 'US' } },
      { name: 'menu_view',            props: { category: 'pasta',     device: 'desktop' } },
      { name: 'menu_view',            props: { category: 'pizza',     device: 'desktop' } },
      { name: 'button_click',         props: { button_id: 'reserve-table', button_label: 'Reserve a Table', page: '/reservations', device: 'desktop' } },
      { name: 'reservation_started',  props: { party_size: 2, device: 'desktop' } },
      { name: 'reservation_completed',props: { party_size: 2, time_slot: '20:00', location: 'Westside', device: 'desktop' } },
    ],
  },
  {
    id: 'order',
    label: 'Visitor → Order → Loyalty',
    description: 'Mobile user orders delivery and joins the loyalty programme',
    color: '#f0b429',
    steps: [
      { name: 'page_view',        props: { page: '/home',  referrer: 'instagram', device: 'mobile', country: 'GB' } },
      { name: 'menu_view',        props: { category: 'mains',   device: 'mobile' } },
      { name: 'button_click',     props: { button_id: 'order-now', button_label: 'Order Now', page: '/menu', device: 'mobile' } },
      { name: 'order_started',    props: { order_type: 'delivery', device: 'mobile' } },
      { name: 'order_item_added', props: { item_name: 'Branzino al Forno', category: 'mains', price: 34, device: 'mobile' } },
      { name: 'order_item_added', props: { item_name: 'Panna Cotta',       category: 'desserts', price: 9, device: 'mobile' } },
      { name: 'coupon_applied',   props: { code: 'WELCOME10', discount: 4.30, device: 'mobile' } },
      { name: 'order_completed',  props: { total: 38.70, item_count: 2, order_type: 'delivery', payment_method: 'apple_pay', location: 'Downtown', device: 'mobile' } },
      { name: 'signup',           props: { method: 'google', device: 'mobile', referrer: 'direct' } },
    ],
  },
  {
    id: 'dropout',
    label: 'Drop-off at Checkout',
    description: 'User browses and starts an order but never completes it',
    color: '#f87171',
    steps: [
      { name: 'page_view',        props: { page: '/home',  referrer: 'direct', device: 'desktop', country: 'CA' } },
      { name: 'menu_view',        props: { category: 'pizza',   device: 'desktop' } },
      { name: 'button_click',     props: { button_id: 'order-now', button_label: 'Order Now', page: '/menu', device: 'desktop' } },
      { name: 'order_started',    props: { order_type: 'takeaway', device: 'desktop' } },
      { name: 'order_item_added', props: { item_name: 'Diavola', category: 'pizza', price: 18, device: 'desktop' } },
      // User abandons here — no order_completed
    ],
  },
];

let toastCounter = 0;

export default function Home() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [apiKey, setApiKey] = useState('mh_ayushbro_default_key');
  const [apiUrl, setApiUrl] = useState('http://localhost:3000');
  const [environment, setEnvironment] = useState<'production' | 'sandbox' | 'development'>('development');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [distinctId, setDistinctId] = useState('');
  const [identifyId, setIdentifyId] = useState('');
  const [runningJourney, setRunningJourney] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleting, setDeleting] = useState(false);

  const [customEventName, setCustomEventName] = useState('');
  const [customProperties, setCustomProperties] = useState('{\n  \n}');

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [
      { timestamp: new Date().toLocaleTimeString(), message, type },
      ...prev,
    ].slice(0, 100));
  }, []);

  const showToast = useCallback((eventName: string, props: Record<string, any>) => {
    const id = ++toastCounter;
    setToasts(prev => [...prev.slice(-4), { id, eventName, props }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateDistinctId = useCallback(() => {
    try { setDistinctId(MiniHog.getDistinctId()); } catch {}
  }, []);

  const handleInitialize = () => {
    try {
      MiniHog.init({ environment, apiKey: apiKey || undefined, batchSize: 1, flushInterval: 2000 });
      setIsInitialized(true);
      updateDistinctId();
      addLog(`SDK ready — ${environment} · batch:1 · flush:2s`, 'success');
    } catch (e: any) {
      addLog(`Init error: ${e.message}`, 'error');
    }
  };

  const handleReset = () => {
    try {
      MiniHog.reset();
      setIsInitialized(false);
      setDistinctId('');
      setIdentifyId('');
      addLog('SDK reset', 'info');
    } catch (e: any) {
      addLog(`Reset error: ${e.message}`, 'error');
    }
  };

  const handleIdentify = () => {
    if (!identifyId.trim()) { addLog('Enter a user ID', 'error'); return; }
    try {
      MiniHog.identify(identifyId.trim());
      updateDistinctId();
      addLog(`Identified as: ${identifyId.trim()}`, 'success');
    } catch (e: any) {
      addLog(`Error: ${e.message}`, 'error');
    }
  };

  const trackEvent = (name: string, props: Record<string, any>, silent = false) => {
    if (!isInitialized) { addLog('Connect the SDK first', 'error'); return false; }
    try {
      MiniHog.track(name, props);
      if (!silent) {
        const tag = Object.entries(props).slice(0, 2).map(([k, v]) => `${k}:${v}`).join(' · ');
        addLog(`▸ ${name}  ${tag}`, 'success');
        showToast(name, props);
      }
      return true;
    } catch (e: any) {
      addLog(`Error: ${e.message}`, 'error');
      return false;
    }
  };

  const runJourney = async (journey: typeof JOURNEYS[0]) => {
    if (!isInitialized) { addLog('Connect the SDK first', 'error'); return; }
    if (runningJourney) return;
    setRunningJourney(journey.id);
    addLog(`── Starting journey: ${journey.label} ──`, 'journey');
    for (let i = 0; i < journey.steps.length; i++) {
      const step = journey.steps[i];
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
      MiniHog.track(step.name, step.props);
      const tag = Object.entries(step.props).slice(0, 2).map(([k, v]) => `${k}:${v}`).join(' · ');
      addLog(`  ${i + 1}/${journey.steps.length} ${step.name}  ${tag}`, 'success');
      showToast(step.name, step.props);
    }
    addLog(`── Journey complete: ${journey.steps.length} events sent ──`, 'journey');
    setRunningJourney(null);
  };

  const handleTrackCustom = () => {
    if (!customEventName.trim()) { addLog('Enter an event name', 'error'); return; }
    try {
      const props = customProperties.trim() ? JSON.parse(customProperties) : {};
      trackEvent(customEventName.trim(), props);
    } catch (e: any) {
      addLog(`Invalid JSON: ${e.message}`, 'error');
    }
  };

  const handleDeleteEvents = async () => {
    if (!distinctId) { addLog('No distinct ID — connect the SDK first', 'error'); return; }
    if (!confirm(`Delete all events for "${distinctId}" from the database?`)) return;
    setDeleting(true);
    try {
      const url = `${apiUrl}/track?distinct_id=${encodeURIComponent(distinctId)}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey },
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Deleted ${data.deleted} events for ${distinctId}`, 'success');
        showToast('events_deleted', { distinct_id: distinctId, count: data.deleted });
      } else {
        addLog(`Delete failed: ${data.error || 'unknown error'}`, 'error');
      }
    } catch (e: any) {
      addLog(`Delete error: ${e.message}`, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container">
      <style>{`
        @keyframes toastIn { from { opacity: 0; transform: translateY(8px) scale(0.97); } to { opacity: 1; transform: none; } }
      `}</style>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <div className="header">
        <div>
          <h1>🍝 Bella Cucina</h1>
          <p className="subtitle">MiniHog SDK · Analytics test playground</p>
        </div>
        <a className="dash-link" href="http://localhost:3002" target="_blank" rel="noreferrer">
          Open Dashboard →
        </a>
      </div>

      {/* Restaurant description */}
      <div className="card" style={{ borderLeft: '3px solid #f0b429', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f0b429', fontWeight: 700, marginBottom: 6 }}>About This Demo</div>
            <div style={{ fontSize: '0.97rem', fontWeight: 700, color: '#e0e4ec', marginBottom: 6 }}>Bella Cucina — Italian Restaurant</div>
            <p style={{ fontSize: '0.82rem', color: '#8b92a5', lineHeight: 1.65, margin: 0 }}>
              A contemporary Italian restaurant offering dine-in, takeaway, and delivery. Guests can browse the full menu by category (starters, pasta, pizza, mains, desserts), make table reservations, and place online orders with a loyalty programme.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7280', fontWeight: 700, marginBottom: 2 }}>Key User Actions</div>
            {[
              { emoji: '📋', label: 'Browse menu by category' },
              { emoji: '📅', label: 'Reserve a table' },
              { emoji: '🛒', label: 'Place a delivery / takeaway order' },
              { emoji: '⭐', label: 'Join loyalty programme' },
              { emoji: '🏷️', label: 'Apply discount coupons' },
              { emoji: '⭐', label: 'Submit a review' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#8b92a5' }}>
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Setup */}
      <div className="card">
        <div className="card-header">
          <h2>SDK Connection</h2>
          <span className={`status ${isInitialized ? 'initialized' : 'not-initialized'}`}>
            {isInitialized ? '● Connected' : '○ Disconnected'}
          </span>
        </div>

        {!isInitialized ? (
          <>
            <div className="field" style={{ marginBottom: '0.75rem' }}>
              <label className="label">API Key</label>
              <input className="input" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="mh_xxxx..." />
            </div>
            <div className="field" style={{ marginBottom: '0.75rem' }}>
              <label className="label">API URL</label>
              <input className="input" value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="http://localhost:3000" />
            </div>
            <div className="field" style={{ marginBottom: '0.75rem' }}>
              <label className="label">Environment</label>
              <select className="input" value={environment} onChange={e => setEnvironment(e.target.value as any)}>
                <option value="development">Development (localhost:3000)</option>
                <option value="sandbox">Sandbox</option>
                <option value="production">Production</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleInitialize}>Connect</button>
          </>
        ) : (
          <div className="info-grid">
            <div className="info-row"><span className="info-label">API Key</span><code className="code-inline">{apiKey.slice(0, 22)}…</code></div>
            <div className="info-row"><span className="info-label">Environment</span><code className="code-inline">{environment}</code></div>
            <div className="info-row"><span className="info-label">Distinct ID</span><code className="code-inline" style={{ fontSize: '0.72rem' }}>{distinctId}</code></div>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div className="row" style={{ flex: 1 }}>
                <input className="input" value={identifyId} onChange={e => setIdentifyId(e.target.value)} placeholder="Identify user: table_42, john@…" style={{ flex: 1 }} />
                <button className="btn btn-secondary btn-sm" onClick={handleIdentify}>Identify</button>
              </div>
              <button className="btn btn-danger btn-sm" onClick={handleReset}>Disconnect</button>
            </div>
            {/* Delete events */}
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #2a2e3a' }}>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDeleteEvents}
                disabled={deleting}
                style={{ width: '100%' }}
              >
                {deleting ? 'Deleting…' : `🗑 Delete my events from DB`}
              </button>
              <p style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.35rem' }}>
                Removes all events tracked by <code style={{ fontSize: '0.72rem' }}>{distinctId.slice(0, 20)}{distinctId.length > 20 ? '…' : ''}</code> from the database.
              </p>
            </div>
          </div>
        )}
      </div>

      {isInitialized && (
        <>
          {/* Journey simulator */}
          <div className="card">
            <h2>Simulate User Journey</h2>
            <p className="hint">Fire a realistic sequence of events with natural delays — great for populating the dashboard with meaningful funnel data.</p>
            <div className="journey-grid">
              {JOURNEYS.map(j => (
                <button
                  key={j.id}
                  className={`journey-btn ${runningJourney === j.id ? 'running' : ''}`}
                  style={{ '--journey-color': j.color } as any}
                  onClick={() => runJourney(j)}
                  disabled={!!runningJourney}
                >
                  <span className="journey-label">{j.label}</span>
                  <span className="journey-desc">{j.description}</span>
                  <span className="journey-steps">{j.steps.length} events</span>
                  {runningJourney === j.id && <span className="journey-running">firing…</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Individual events */}
          {PRESET_EVENTS.map(group => (
            <div className="card" key={group.group}>
              <h2>{group.group}</h2>
              <div className="preset-grid">
                {group.events.map((evt, i) => (
                  <button
                    key={i}
                    className="preset-btn"
                    onClick={() => trackEvent(evt.name, evt.props)}
                  >
                    <span className="preset-emoji">{evt.emoji}</span>
                    <span className="preset-name">{evt.label}</span>
                    <code className="preset-event">{evt.name}</code>
                    <span className="preset-props">
                      {Object.entries(evt.props).slice(0, 2).map(([k, v]) => (
                        <span key={k} className="preset-prop-tag">{k}: {String(v)}</span>
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Custom event */}
          <div className="card">
            <h2>Custom Event</h2>
            <div className="row" style={{ marginBottom: '0.75rem' }}>
              <div className="field" style={{ flex: 1 }}>
                <label className="label">Event Name</label>
                <input className="input" value={customEventName} onChange={e => setCustomEventName(e.target.value)}
                  placeholder="e.g. gift_card_purchased" />
              </div>
            </div>
            <div className="field" style={{ marginBottom: '0.75rem' }}>
              <label className="label">Properties (JSON)</label>
              <textarea className="input" value={customProperties} onChange={e => setCustomProperties(e.target.value)}
                placeholder='{ "amount": 50, "device": "desktop" }' rows={3} />
            </div>
            <div className="row">
              <button className="btn btn-primary" onClick={handleTrackCustom}>Track</button>
              <button className="btn btn-secondary" onClick={() => { MiniHog.flush(); addLog('Queue flushed', 'info'); }}>Flush Queue</button>
            </div>
          </div>
        </>
      )}

      {/* Event log */}
      <div className="card">
        <div className="card-header">
          <h2>Event Log</h2>
          {logs.length > 0 && <button className="btn btn-secondary btn-sm" onClick={() => setLogs([])}>Clear</button>}
        </div>
        <div className="log">
          {logs.length === 0 ? (
            <p className="hint" style={{ textAlign: 'center', padding: '2rem 0' }}>
              Events appear here as you fire them.
            </p>
          ) : logs.map((log, i) => (
            <div key={i} className={`log-entry ${log.type}`}>
              <span className="log-time">{log.timestamp}</span>
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
