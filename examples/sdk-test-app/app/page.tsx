'use client';

import { useState, useEffect, useCallback } from 'react';
import MiniHog from 'minihog-sdk';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

const PRESET_EVENTS = [
  { name: 'page_view', label: 'Page View', properties: { page: '/home' } },
  { name: 'signup', label: 'Sign Up', properties: { method: 'email' } },
  { name: 'button_click', label: 'Button Click', properties: { button_id: 'cta-hero', page: '/home' } },
  { name: 'purchase', label: 'Purchase', properties: { amount: 29.99, currency: 'USD', product: 'Pro Plan' } },
  { name: 'search', label: 'Search', properties: { query: 'analytics' } },
  { name: 'add_to_cart', label: 'Add to Cart', properties: { product: 'Pro Plan', price: 29.99 } },
];

export default function Home() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [environment, setEnvironment] = useState<'production' | 'sandbox' | 'development'>('development');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [distinctId, setDistinctId] = useState('');
  const [identifyId, setIdentifyId] = useState('');

  // Custom event state
  const [customEventName, setCustomEventName] = useState('');
  const [customProperties, setCustomProperties] = useState('{}');

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs((prev) => [
      { timestamp: new Date().toLocaleTimeString(), message, type },
      ...prev,
    ].slice(0, 50));
  }, []);

  const updateDistinctId = useCallback(() => {
    try {
      setDistinctId(MiniHog.getDistinctId());
    } catch {
      // Not initialized
    }
  }, []);

  const handleInitialize = () => {
    try {
      MiniHog.init({
        environment,
        apiKey: apiKey || undefined,
        batchSize: 1,
        flushInterval: 2000,
      });
      setIsInitialized(true);
      updateDistinctId();
      addLog(`SDK initialized (${environment}, batch: 1, flush: 2s)`, 'success');
      if (apiKey) addLog(`API Key: ${apiKey.substring(0, 12)}...`, 'info');
    } catch (error: any) {
      addLog(`Init error: ${error.message}`, 'error');
    }
  };

  const handleReset = () => {
    try {
      MiniHog.reset();
      setIsInitialized(false);
      setDistinctId('');
      setIdentifyId('');
      addLog('SDK reset', 'info');
    } catch (error: any) {
      addLog(`Reset error: ${error.message}`, 'error');
    }
  };

  const handleIdentify = () => {
    if (!identifyId.trim()) {
      addLog('Enter a user ID to identify', 'error');
      return;
    }
    try {
      MiniHog.identify(identifyId.trim());
      updateDistinctId();
      addLog(`User identified as: ${identifyId.trim()}`, 'success');
    } catch (error: any) {
      addLog(`Identify error: ${error.message}`, 'error');
    }
  };

  const trackEvent = (name: string, properties: Record<string, any>) => {
    if (!isInitialized) {
      addLog('Initialize the SDK first', 'error');
      return;
    }
    try {
      MiniHog.track(name, properties);
      const propsStr = Object.keys(properties).length > 0
        ? ` | ${Object.entries(properties).map(([k, v]) => `${k}: ${v}`).join(', ')}`
        : '';
      addLog(`Tracked: ${name}${propsStr}`, 'success');
    } catch (error: any) {
      addLog(`Track error: ${error.message}`, 'error');
    }
  };

  const handleTrackCustom = () => {
    if (!customEventName.trim()) {
      addLog('Enter an event name', 'error');
      return;
    }
    try {
      const props = customProperties.trim() ? JSON.parse(customProperties) : {};
      trackEvent(customEventName.trim(), props);
    } catch (error: any) {
      addLog(`Invalid JSON: ${error.message}`, 'error');
    }
  };

  const handleFlush = () => {
    try {
      MiniHog.flush();
      addLog('Flushed all queued events', 'success');
    } catch (error: any) {
      addLog(`Flush error: ${error.message}`, 'error');
    }
  };

  return (
    <div className="container">
      <h1>MiniHog SDK Test App</h1>
      <p className="subtitle">
        Interactive playground to test event tracking, user identification, and SDK features.
      </p>

      {/* Setup Section */}
      <div className="card">
        <div className="card-header">
          <h2>Setup</h2>
          <span className={`status ${isInitialized ? 'initialized' : 'not-initialized'}`}>
            {isInitialized ? 'Connected' : 'Not Connected'}
          </span>
        </div>

        {!isInitialized ? (
          <>
            <div className="field">
              <label className="label">API Key</label>
              <input
                type="text"
                className="input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="mh_xxxx..."
              />
            </div>
            <div className="field">
              <label className="label">Environment</label>
              <select className="input" value={environment} onChange={(e) => setEnvironment(e.target.value as any)}>
                <option value="development">Development (localhost:3000)</option>
                <option value="sandbox">Sandbox</option>
                <option value="production">Production</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleInitialize}>
              Connect SDK
            </button>
          </>
        ) : (
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">API Key</span>
              <code className="code-inline">{apiKey ? `${apiKey.substring(0, 20)}...` : 'None'}</code>
            </div>
            <div className="info-row">
              <span className="info-label">Environment</span>
              <code className="code-inline">{environment}</code>
            </div>
            <div className="info-row">
              <span className="info-label">Distinct ID</span>
              <code className="code-inline">{distinctId}</code>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <button className="btn btn-danger btn-sm" onClick={handleReset}>
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      {isInitialized && (
        <>
          {/* Identify User */}
          <div className="card">
            <h2>Identify User</h2>
            <p className="hint">
              Link events to a real user ID from your auth system. After identifying, all events use this ID as distinct_id.
            </p>
            <div className="row">
              <input
                type="text"
                className="input"
                value={identifyId}
                onChange={(e) => setIdentifyId(e.target.value)}
                placeholder="e.g. user_123, john@example.com"
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary btn-sm" onClick={handleIdentify}>
                Identify
              </button>
            </div>
          </div>

          {/* Quick Track */}
          <div className="card">
            <h2>Quick Track</h2>
            <p className="hint">
              One-click event tracking. Each event includes properties like <code>page</code>, <code>button_id</code>, <code>amount</code> etc.
            </p>
            <div className="preset-grid">
              {PRESET_EVENTS.map((evt) => (
                <button
                  key={evt.name}
                  className="preset-btn"
                  onClick={() => trackEvent(evt.name, evt.properties)}
                >
                  <span className="preset-name">{evt.label}</span>
                  <span className="preset-event">{evt.name}</span>
                  <span className="preset-props">
                    {Object.entries(evt.properties).map(([k, v]) => (
                      <span key={k} className="preset-prop-tag">{k}: {String(v)}</span>
                    ))}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Event */}
          <div className="card">
            <h2>Custom Event</h2>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label className="label">Event Name</label>
                <input
                  type="text"
                  className="input"
                  value={customEventName}
                  onChange={(e) => setCustomEventName(e.target.value)}
                  placeholder="e.g. form_submit"
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Properties (JSON)</label>
              <textarea
                className="input"
                value={customProperties}
                onChange={(e) => setCustomProperties(e.target.value)}
                placeholder='{"form_id": "contact-form", "page": "/contact"}'
                rows={3}
              />
            </div>
            <div className="row">
              <button className="btn btn-primary" onClick={handleTrackCustom}>
                Track Event
              </button>
              <button className="btn btn-secondary" onClick={handleFlush}>
                Flush Queue
              </button>
            </div>
          </div>
        </>
      )}

      {/* Event Log */}
      <div className="card">
        <div className="card-header">
          <h2>Event Log</h2>
          {logs.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => setLogs([])}>
              Clear
            </button>
          )}
        </div>
        <div className="log">
          {logs.length === 0 ? (
            <p className="hint" style={{ textAlign: 'center', padding: '2rem 0' }}>
              Events will appear here as you track them.
            </p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`log-entry ${log.type}`}>
                <span className="log-time">{log.timestamp}</span>
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
