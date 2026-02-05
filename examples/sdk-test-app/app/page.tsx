'use client';

import { useState, useEffect } from 'react';
import MiniHog from 'minihog-sdk';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export default function Home() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [environment, setEnvironment] = useState<'production' | 'sandbox' | 'development'>('development');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [eventName, setEventName] = useState('');
  const [eventProperties, setEventProperties] = useState('{}');
  const [pageForButtonClick, setPageForButtonClick] = useState('home');
  const [buttonId, setButtonId] = useState('signup-btn');

  useEffect(() => {
    // Check if SDK is already initialized
    try {
      // @ts-ignore - accessing internal state for testing
      if (MiniHog._instance && MiniHog._instance.config) {
        setIsInitialized(true);
        addLog('SDK already initialized', 'info');
      }
    } catch (e) {
      // Not initialized
    }
  }, []);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        message,
        type,
      },
    ]);
  };

  const handleInitialize = () => {
    try {
      let properties = {};
      if (eventProperties.trim()) {
        properties = JSON.parse(eventProperties);
      }

      MiniHog.init({
        environment,
        apiKey: apiKey || undefined,
        batchSize: 5, // Small batch for testing
        flushInterval: 3000, // 3 seconds for testing
      });

      setIsInitialized(true);
      addLog(`SDK initialized with environment: ${environment}`, 'success');
      if (apiKey) {
        addLog(`API Key configured: ${apiKey.substring(0, 8)}...`, 'info');
      }
    } catch (error: any) {
      addLog(`Initialization error: ${error.message}`, 'error');
    }
  };

  const handleTrack = () => {
    if (!isInitialized) {
      addLog('Please initialize SDK first', 'error');
      return;
    }

    try {
      let properties = {};
      if (eventProperties.trim()) {
        properties = JSON.parse(eventProperties);
      }

      MiniHog.track(eventName || 'test_event', properties);
      addLog(`Event tracked: ${eventName || 'test_event'}`, 'success');
      if (Object.keys(properties).length > 0) {
        addLog(`Properties: ${JSON.stringify(properties)}`, 'info');
      }
    } catch (error: any) {
      addLog(`Track error: ${error.message}`, 'error');
    }
  };

  const handleFlush = () => {
    if (!isInitialized) {
      addLog('Please initialize SDK first', 'error');
      return;
    }

    try {
      MiniHog.flush();
      addLog('Events flushed manually', 'success');
    } catch (error: any) {
      addLog(`Flush error: ${error.message}`, 'error');
    }
  };

  const handleReset = () => {
    try {
      MiniHog.reset();
      setIsInitialized(false);
      addLog('SDK reset', 'info');
    } catch (error: any) {
      addLog(`Reset error: ${error.message}`, 'error');
    }
  };

  return (
    <div className="container">
      <h1>MiniHog SDK Test App</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Test your local MiniHog SDK with hot reload. Changes to the SDK will automatically reflect here.
      </p>

      {/* SDK Status */}
      <div className="card">
        <h2>SDK Status</h2>
        <p>
          Status:{' '}
          <span className={`status ${isInitialized ? 'initialized' : 'not-initialized'}`}>
            {isInitialized ? 'Initialized' : 'Not Initialized'}
          </span>
        </p>
      </div>

      {/* Initialization */}
      <div className="card">
        <h2>Initialize SDK</h2>
        <div>
          <label className="label">Environment</label>
          <select
            className="input"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as any)}
            disabled={isInitialized}
          >
            <option value="development">Development (localhost:3000)</option>
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </select>
        </div>
        <div>
          <label className="label">API Key (optional for testing)</label>
          <input
            type="text"
            className="input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            disabled={isInitialized}
          />
        </div>
        <button className="button" onClick={handleInitialize} disabled={isInitialized}>
          Initialize SDK
        </button>
        {isInitialized && (
          <button className="button" onClick={handleReset} style={{ background: '#ef4444' }}>
            Reset SDK
          </button>
        )}
      </div>

      {/* Track Events */}
      {isInitialized && (
        <div className="card">
          <h2>Track Events</h2>
          <div>
            <label className="label">Event Name</label>
            <input
              type="text"
              className="input"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., button_click, purchase, signup"
            />
          </div>
          <div>
            <label className="label">Event Properties (JSON)</label>
            <textarea
              className="input"
              value={eventProperties}
              onChange={(e) => setEventProperties(e.target.value)}
              placeholder='{"amount": 100, "currency": "USD"}'
              rows={4}
            />
          </div>
          <button className="button" onClick={handleTrack}>
            Track Event
          </button>
          <button className="button" onClick={handleFlush}>
            Flush Events
          </button>
        </div>
      )}

      {/* Quick Test Buttons */}
      {isInitialized && (
        <div className="card">
          <h2>Quick Tests</h2>
          <button
            className="button"
            onClick={() => {
              setEventName('page_view');
              setEventProperties('{"page": "home"}');
            }}
          >
            Set: page_view
          </button>
          <button
            className="button"
            onClick={() => {
              setEventName('button_click');
              setEventProperties(`{"button_name": "signup", "page": "${pageForButtonClick}", "button_id": "${buttonId}"}`);
            }}
          >
            Set: button_click
          </button>
          <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label className="label" style={{ margin: 0, fontSize: '0.875rem' }}>Page:</label>
              <select
                className="input"
                value={pageForButtonClick}
                onChange={(e) => setPageForButtonClick(e.target.value)}
                style={{ width: 'auto', minWidth: '120px', padding: '0.375rem 0.5rem' }}
              >
                <option value="home">home</option>
                <option value="pricing">pricing</option>
                <option value="about">about</option>
                <option value="contact">contact</option>
                <option value="signup">signup</option>
                <option value="dashboard">dashboard</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label className="label" style={{ margin: 0, fontSize: '0.875rem' }}>Button ID:</label>
              <input
                type="text"
                className="input"
                value={buttonId}
                onChange={(e) => setButtonId(e.target.value)}
                placeholder="e.g., signup-btn"
                style={{ width: 'auto', minWidth: '120px', padding: '0.375rem 0.5rem' }}
              />
            </div>
          </div>
          <button
            className="button"
            onClick={() => {
              setEventName('purchase');
              setEventProperties('{"amount": 299, "currency": "USD"}');
            }}
          >
            Set: purchase
          </button>
        </div>
      )}

      {/* Event Log */}
      <div className="card">
        <h2>Event Log</h2>
        <div className="log">
          {logs.length === 0 ? (
            <p style={{ color: '#999' }}>No events yet. Initialize the SDK and start tracking!</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`log-entry ${log.type}`}>
                <strong>[{log.timestamp}]</strong> {log.message}
              </div>
            ))
          )}
        </div>
        {logs.length > 0 && (
          <button
            className="button"
            onClick={() => setLogs([])}
            style={{ background: '#6b7280', marginTop: '1rem' }}
          >
            Clear Log
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="card" style={{ background: '#f0f9ff', border: '1px solid #0ea5e9' }}>
        <h3 style={{ color: '#0c4a6e' }}>💡 Development Tips</h3>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', color: '#075985' }}>
          <li>Make changes to SDK in <code>packages/sdk/src/</code></li>
          <li>Run <code>npm run build</code> in <code>packages/sdk/</code> to rebuild</li>
          <li>Or use <code>npm run dev</code> for watch mode (auto-rebuild)</li>
          <li>Refresh this page to see changes</li>
          <li>Check browser console for detailed logs</li>
        </ul>
      </div>
    </div>
  );
}

