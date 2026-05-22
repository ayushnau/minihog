'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/useAuth';
import { Panel, AsciiHr, ToastHost, toast } from '@/components/terminal';
import { getDefaultDateRange, setDefaultDateRange, type DefaultDateRange } from '@/lib/settings';
import { invalidateEventSchemaCache } from '@/lib/useEventSchema';

const ACCENTS = [
  { id: 'phosphor', label: 'Phosphor', color: '#4ade80', value: '' },
  { id: 'amber', label: 'Amber', color: '#f0b429', value: 'amber' },
  { id: 'magenta', label: 'Magenta', color: '#d670d6', value: 'magenta' },
  { id: 'ice', label: 'Ice', color: '#7cd4f7', value: 'ice' },
  { id: 'mono', label: 'Mono', color: '#e8e8e8', value: 'mono' },
];

interface ContextDoc { id: string; name: string; preview: string; createdAt: string; }

// ── Event Schema types ───────────────────────────────────────────────────────

interface PropertyDef {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  values?: string;
}

interface EventSchemaDef {
  id: string;
  name: string;
  description: string;
  properties: PropertyDef[];
  createdAt: string;
}

const STANDARD_EVENTS = [
  { name: 'page_view',    description: 'User visits a page',         properties: ['page', 'referrer', 'device', 'country'] },
  { name: 'button_click', description: 'User clicks a button/CTA',   properties: ['button_id', 'button_label', 'page', 'device'] },
  { name: 'signup',       description: 'User completes registration', properties: ['method', 'device', 'country', 'referrer'] },
  { name: 'logout',       description: 'User ends their session',     properties: ['session_duration_min', 'device'] },
  { name: 'search',       description: 'User performs a search',      properties: ['query', 'results_count', 'device'] },
];

const EMPTY_PROP = (): PropertyDef => ({ name: '', type: 'string', description: '', values: '' });

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI context docs state
  const [contextDocs, setContextDocs] = useState<ContextDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [uploadQueue, setUploadQueue] = useState<{ name: string; status: 'uploading' | 'done' | 'error' }[]>([]);

  const [email, setEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [defaultDays, setDefaultDays] = useState<DefaultDateRange>('7');
  const [currentTheme, setCurrentTheme] = useState('');
  const [currentAccent, setCurrentAccent] = useState('');

  // Event Schema state
  const [customEvents, setCustomEvents] = useState<EventSchemaDef[]>([]);
  const [schemasLoading, setSchemasLoading] = useState(true);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventSchemaDef | null>(null);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventProps, setNewEventProps] = useState<PropertyDef[]>([EMPTY_PROP()]);
  const [schemaSaving, setSchemaSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    const theme = document.documentElement.getAttribute('data-theme') || '';
    const accent = document.documentElement.getAttribute('data-accent') || '';
    setCurrentTheme(theme);
    setCurrentAccent(accent);
    loadDocs();
    loadSchemas();
  }, []);

  const loadDocs = async () => {
    setDocsLoading(true);
    try {
      const r = await fetch('/api/ai/context', { credentials: 'include' });
      const d = await r.json();
      if (d.success) setContextDocs(d.docs);
    } catch {}
    setDocsLoading(false);
  };

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;

    const queue = files.map(f => ({ name: f.name, status: 'uploading' as const }));
    setUploadQueue(queue);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const content = await file.text();
        const r = await fetch('/api/ai/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: file.name, content }),
        });
        const d = await r.json();
        setUploadQueue(q => q.map((item, idx) => idx === i ? { ...item, status: d.success ? 'done' : 'error' } : item));
      } catch {
        setUploadQueue(q => q.map((item, idx) => idx === i ? { ...item, status: 'error' } : item));
      }
    }

    await loadDocs();
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setUploadQueue([]), 2000);
    toast('ok', `${files.length} document${files.length > 1 ? 's' : ''} uploaded`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await uploadFiles(Array.from(e.target.files || []));
  };

  const deleteDoc = async (id: string, name: string) => {
    await fetch(`/api/ai/context/${id}`, { method: 'DELETE', credentials: 'include' });
    setContextDocs(prev => prev.filter(d => d.id !== id));
    toast('ok', `Removed "${name}"`);
  };

  // ── Event Schema handlers ────────────────────────────────────────────────

  const loadSchemas = async () => {
    setSchemasLoading(true);
    try {
      const r = await fetch('/api/event-schema', { credentials: 'include' });
      const d = await r.json();
      if (d.success) setCustomEvents(d.schemas);
    } catch {}
    setSchemasLoading(false);
  };

  const resetEventForm = () => {
    setNewEventName('');
    setNewEventDesc('');
    setNewEventProps([EMPTY_PROP()]);
    setEditingEvent(null);
    setShowAddEvent(false);
  };

  const startEdit = (ev: EventSchemaDef) => {
    setEditingEvent(ev);
    setNewEventName(ev.name);
    setNewEventDesc(ev.description);
    setNewEventProps(
      ev.properties.length > 0
        ? ev.properties.map(p => ({ ...p, values: Array.isArray(p.values) ? p.values.join(', ') : (p.values ?? '') }))
        : [EMPTY_PROP()]
    );
    setShowAddEvent(true);
  };

  const saveEventSchema = async () => {
    if (!newEventName.trim() && !editingEvent) {
      toast('bad', 'Event name is required');
      return;
    }
    setSchemaSaving(true);
    try {
      const props = newEventProps
        .filter(p => p.name.trim())
        .map(p => ({
          name: p.name.trim(),
          type: p.type,
          description: p.description.trim(),
          ...(p.values?.trim() ? { values: p.values.split(',').map(v => v.trim()).filter(Boolean) } : {}),
        }));

      if (editingEvent) {
        const r = await fetch(`/api/event-schema/${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ description: newEventDesc.trim(), properties: props }),
        });
        const d = await r.json();
        if (d.success) {
          setCustomEvents(prev => prev.map(e => e.id === editingEvent.id ? d.schema : e));
          invalidateEventSchemaCache();
          toast('ok', `Updated "${editingEvent.name}"`);
          resetEventForm();
        } else {
          toast('bad', d.error || 'Failed to update schema');
        }
      } else {
        const r = await fetch('/api/event-schema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: newEventName.trim(), description: newEventDesc.trim(), properties: props }),
        });
        const d = await r.json();
        if (d.success) {
          setCustomEvents(prev => [...prev, d.schema].sort((a, b) => a.name.localeCompare(b.name)));
          invalidateEventSchemaCache();
          toast('ok', `Created "${d.schema.name}"`);
          resetEventForm();
        } else {
          toast('bad', d.error || 'Failed to create schema');
        }
      }
    } catch {
      toast('bad', 'Request failed');
    } finally {
      setSchemaSaving(false);
    }
  };

  const deleteEventSchema = async (ev: EventSchemaDef) => {
    const r = await fetch(`/api/event-schema/${ev.id}`, { method: 'DELETE', credentials: 'include' });
    const d = await r.json();
    if (d.success) {
      setCustomEvents(prev => prev.filter(e => e.id !== ev.id));
      invalidateEventSchemaCache();
      toast('ok', `Deleted "${ev.name}"`);
    } else {
      toast('bad', d.error || 'Failed to delete schema');
    }
  };

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  useEffect(() => {
    if (mounted) setDefaultDays(getDefaultDateRange());
  }, [mounted]);

  const applyTheme = (theme: string) => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    setCurrentTheme(theme);
  };

  const applyAccent = (value: string) => {
    if (value) {
      document.documentElement.setAttribute('data-accent', value);
    } else {
      document.documentElement.removeAttribute('data-accent');
    }
    setCurrentAccent(value);
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        refresh();
        toast('ok', 'Email updated successfully');
      } else {
        setEmailError(data.error || 'Failed to update email');
        toast('bad', data.error || 'Failed to update email');
      }
    } catch {
      setEmailError('Failed to update email');
      toast('bad', 'Failed to update email');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast('ok', 'Password changed successfully');
      } else {
        setPasswordError(data.error || 'Failed to change password');
        toast('bad', data.error || 'Failed to change password');
      }
    } catch {
      setPasswordError('Failed to change password');
      toast('bad', 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <ToastHost />
      <div>
        <div className="mh-page-head">
          <div>
            <div className="crumb">minihog · workspace</div>
            <h1>Settings</h1>
            <div className="subtitle">Profile, appearance, and workspace preferences</div>
          </div>
        </div>

        {/* Profile section */}
        <Panel title="Profile" meta={user?.username} style={{ marginBottom: 16 }}>
          <form onSubmit={handleSaveEmail}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 6 }}>
                Username
              </label>
              <div className="mh-field" style={{ opacity: 0.6 }}>
                <span className="prompt">@</span>
                <input type="text" value={user?.username || ''} disabled />
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>Username cannot be changed.</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 6 }}>
                Email
              </label>
              <div className="mh-row" style={{ gap: 8 }}>
                <div className="mh-field" style={{ flex: 1 }}>
                  <span className="prompt">@</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <button type="submit" className="mh-btn primary sm" disabled={emailSaving}>
                  {emailSaving ? <span className="mh-loading">saving</span> : 'Save'}
                </button>
              </div>
              {emailError && <div style={{ fontSize: 11.5, color: 'var(--bad)', marginTop: 6 }}>× {emailError}</div>}
            </div>
          </form>
        </Panel>

        <AsciiHr label="change password" />

        <Panel title="Change Password" style={{ marginBottom: 16 }}>
          <form onSubmit={handleChangePassword} style={{ maxWidth: 400 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 6 }}>
                  Current Password
                </label>
                <div className="mh-field">
                  <span className="prompt">›</span>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="············" required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 6 }}>
                  New Password
                </label>
                <div className="mh-field">
                  <span className="prompt">›</span>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="············" required minLength={8} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 6 }}>
                  Confirm New Password
                </label>
                <div className="mh-field">
                  <span className="prompt">›</span>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="············" required />
                </div>
              </div>
              {passwordError && <div style={{ fontSize: 11.5, color: 'var(--bad)' }}>× {passwordError}</div>}
              <button type="submit" className="mh-btn primary sm" disabled={passwordSaving} style={{ alignSelf: 'flex-start' }}>
                {passwordSaving ? <span className="mh-loading">saving</span> : 'Change Password →'}
              </button>
            </div>
          </form>
        </Panel>

        <AsciiHr label="appearance" />

        <Panel title="Appearance" meta="theme &amp; accent" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 12 }}>
              Color Mode
            </div>
            <div className="mh-row" style={{ gap: 8 }}>
              {[{ label: 'Terminal (dark)', value: '' }, { label: 'Paper (light)', value: 'light' }].map(t => (
                <button
                  key={t.value}
                  className={`mh-btn sm ${currentTheme === t.value ? 'primary' : 'ghost'}`}
                  onClick={() => applyTheme(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 12 }}>
              Accent Color
            </div>
            <div className="mh-row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {ACCENTS.map(a => (
                <button
                  key={a.id}
                  onClick={() => applyAccent(a.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 12px',
                    border: `1px solid ${currentAccent === a.value ? a.color : 'var(--bd)'}`,
                    background: currentAccent === a.value ? `${a.color}22` : 'transparent',
                    borderRadius: 'var(--rad)',
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    color: currentAccent === a.value ? a.color : 'var(--fg-2)',
                    transition: 'all .08s',
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: 1, background: a.color, display: 'inline-block', flexShrink: 0 }} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <AsciiHr label="preferences" />

        <Panel title="Preferences" style={{ marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8 }}>
              Default Date Range
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginBottom: 12 }}>
              Default range when opening Overview or Events pages.
            </div>
            <div className="mh-row" style={{ gap: 8 }}>
              {[{ label: 'Last 7 days', value: '7' }, { label: 'Last 30 days', value: '30' }, { label: 'Last 90 days', value: '90' }].map(o => (
                <button
                  key={o.value}
                  className={`mh-btn sm ${defaultDays === o.value ? 'primary' : 'ghost'}`}
                  onClick={() => {
                    setDefaultDays(o.value as DefaultDateRange);
                    setDefaultDateRange(o.value as DefaultDateRange);
                    toast('ok', `Default range set to ${o.label}`);
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <AsciiHr label="ai context" />

        <Panel title="AI Context Documents" meta={`${contextDocs.length} document${contextDocs.length !== 1 ? 's' : ''}`} style={{ marginBottom: 16 }} id="ai-context">
          <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginBottom: 16, lineHeight: 1.6 }}>
            Upload documents the AI assistant should know about — product docs, pricing, policies, FAQs, etc.
            Supports <code style={{ color: 'var(--acc)', fontSize: 11 }}>.txt</code>, <code style={{ color: 'var(--acc)', fontSize: 11 }}>.md</code>, <code style={{ color: 'var(--acc)', fontSize: 11 }}>.csv</code> and any plain-text file.
            Select multiple files at once.
          </div>

          {/* Upload area */}
          <div
            className="ai-upload-zone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
            onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
            onDrop={async e => {
              e.preventDefault();
              e.currentTarget.classList.remove('drag-over');
              const files = Array.from(e.dataTransfer.files);
              await uploadFiles(files);
            }}
          >
            <div className="ai-upload-icon">⊞</div>
            <div className="ai-upload-label">Click to browse or drag &amp; drop files</div>
            <div className="ai-upload-hint">Multiple files supported · .txt .md .csv and any plain text</div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.csv,.log,.json,.yaml,.yml,.rst,.tex,.html"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>

          {/* Upload queue progress */}
          {uploadQueue.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {uploadQueue.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                  <span style={{
                    color: item.status === 'done' ? 'var(--acc)' : item.status === 'error' ? 'var(--bad)' : 'var(--warn)',
                    flexShrink: 0,
                  }}>
                    {item.status === 'done' ? '✓' : item.status === 'error' ? '×' : '…'}
                  </span>
                  <span style={{ color: 'var(--fg)' }}>{item.name}</span>
                  <span style={{ color: 'var(--fg-3)', fontSize: 10.5 }}>
                    {item.status === 'uploading' ? 'uploading…' : item.status === 'done' ? 'done' : 'failed'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Existing docs list */}
          {docsLoading ? (
            <div style={{ marginTop: 16 }}><span className="mh-loading" style={{ fontSize: 11 }}>loading</span></div>
          ) : contextDocs.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8 }}>
                Uploaded Documents
              </div>
              <table className="mh-t">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Preview</th>
                    <th>Uploaded</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {contextDocs.map(doc => (
                    <tr key={doc.id}>
                      <td style={{ color: 'var(--acc)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <span style={{ marginRight: 6, opacity: .6 }}>⊡</span>{doc.name}
                      </td>
                      <td style={{ color: 'var(--fg-3)', fontSize: 11, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.preview}…
                      </td>
                      <td style={{ color: 'var(--fg-3)', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td>
                        <button
                          className="mh-btn ghost sm"
                          style={{ color: 'var(--bad)', fontSize: 11, padding: '2px 8px' }}
                          onClick={() => deleteDoc(doc.id, doc.name)}
                        >
                          × remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ marginTop: 16, color: 'var(--fg-3)', fontSize: 11.5 }}>
              No documents yet. Upload some to give the AI context about your product.
            </div>
          )}
        </Panel>

        <AsciiHr label="event schema" />

        <Panel
          id="event-schema"
          title="Event Schema"
          meta={`${customEvents.length} custom event${customEvents.length !== 1 ? 's' : ''}`}
          style={{ marginBottom: 16 }}
        >
          <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginBottom: 16, lineHeight: 1.6 }}>
            Define the events your application tracks. Standard events are built-in. Custom events document your business-specific tracking and give the AI assistant full context on your event properties.
          </div>

          {/* Standard events table */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8 }}>
              Standard Events
            </div>
            <table className="mh-t">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Properties</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {STANDARD_EVENTS.map(ev => (
                  <tr key={ev.name}>
                    <td style={{ color: 'var(--acc)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      <code style={{ fontSize: 11 }}>{ev.name}</code>
                    </td>
                    <td style={{ color: 'var(--fg-2)', fontSize: 11.5 }}>{ev.description}</td>
                    <td style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                      {ev.properties.map(p => (
                        <span key={p} className="mh-tag" style={{ marginRight: 4, fontSize: 10 }}>{p}</span>
                      ))}
                    </td>
                    <td>
                      <span className="mh-tag" style={{ fontSize: 10, color: 'var(--fg-3)' }}>standard</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Custom events */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
                Custom Events
              </div>
              {!showAddEvent && (
                <button
                  className="mh-btn ghost sm"
                  style={{ fontSize: 11 }}
                  onClick={() => { resetEventForm(); setShowAddEvent(true); }}
                >
                  + Add Event
                </button>
              )}
            </div>

            {/* Add / Edit form */}
            {showAddEvent && (
              <div style={{ border: '1px solid var(--bd)', borderRadius: 'var(--rad)', padding: 16, marginBottom: 16, background: 'var(--bg-2)' }}>
                <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--acc)', marginBottom: 12 }}>
                  {editingEvent ? `Edit: ${editingEvent.name}` : 'New Event Schema'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Event name (read-only when editing) */}
                  <div>
                    <label style={{ display: 'block', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 6 }}>
                      Event Name
                    </label>
                    <div className="mh-field" style={editingEvent ? { opacity: 0.6 } : {}}>
                      <span className="prompt">›</span>
                      <input
                        type="text"
                        value={newEventName}
                        onChange={e => setNewEventName(e.target.value)}
                        placeholder="reservation_completed"
                        disabled={!!editingEvent}
                      />
                    </div>
                    {!editingEvent && (
                      <div style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 4 }}>
                        snake_case, e.g. <code style={{ color: 'var(--acc)' }}>order_completed</code>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 6 }}>
                      Description
                    </label>
                    <div className="mh-field">
                      <span className="prompt">›</span>
                      <input
                        type="text"
                        value={newEventDesc}
                        onChange={e => setNewEventDesc(e.target.value)}
                        placeholder="User completes a reservation"
                      />
                    </div>
                  </div>

                  {/* Properties */}
                  <div>
                    <label style={{ display: 'block', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8 }}>
                      Properties
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {newEventProps.map((prop, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr 1fr auto', gap: 6, alignItems: 'center' }}>
                          <div className="mh-field" style={{ minWidth: 0 }}>
                            <span className="prompt">›</span>
                            <input
                              type="text"
                              value={prop.name}
                              onChange={e => setNewEventProps(ps => ps.map((p, i) => i === idx ? { ...p, name: e.target.value } : p))}
                              placeholder="property_name"
                            />
                          </div>
                          <select
                            value={prop.type}
                            onChange={e => setNewEventProps(ps => ps.map((p, i) => i === idx ? { ...p, type: e.target.value as any } : p))}
                            style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 6px', background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--fg)', borderRadius: 'var(--rad)', cursor: 'pointer' }}
                          >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                          </select>
                          <div className="mh-field" style={{ minWidth: 0 }}>
                            <span className="prompt">›</span>
                            <input
                              type="text"
                              value={prop.description}
                              onChange={e => setNewEventProps(ps => ps.map((p, i) => i === idx ? { ...p, description: e.target.value } : p))}
                              placeholder="description"
                            />
                          </div>
                          <div className="mh-field" style={{ minWidth: 0 }}>
                            <span className="prompt">›</span>
                            <input
                              type="text"
                              value={prop.values ?? ''}
                              onChange={e => setNewEventProps(ps => ps.map((p, i) => i === idx ? { ...p, values: e.target.value } : p))}
                              placeholder="values (csv)"
                            />
                          </div>
                          <button
                            className="mh-btn ghost sm"
                            style={{ color: 'var(--bad)', fontSize: 11, padding: '2px 8px', flexShrink: 0 }}
                            onClick={() => setNewEventProps(ps => ps.filter((_, i) => i !== idx))}
                            disabled={newEventProps.length === 1}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      className="mh-btn ghost sm"
                      style={{ fontSize: 11, marginTop: 8 }}
                      onClick={() => setNewEventProps(ps => [...ps, EMPTY_PROP()])}
                    >
                      + Add Property
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="mh-row" style={{ gap: 8, marginTop: 4 }}>
                    <button
                      className="mh-btn primary sm"
                      onClick={saveEventSchema}
                      disabled={schemaSaving}
                    >
                      {schemaSaving ? <span className="mh-loading">saving</span> : editingEvent ? 'Save Changes →' : 'Create Event →'}
                    </button>
                    <button className="mh-btn ghost sm" onClick={resetEventForm}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom events table */}
            {schemasLoading ? (
              <div><span className="mh-loading" style={{ fontSize: 11 }}>loading</span></div>
            ) : customEvents.length > 0 ? (
              <table className="mh-t">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Properties</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {customEvents.map(ev => (
                    <tr key={ev.id}>
                      <td style={{ color: 'var(--acc)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <code style={{ fontSize: 11 }}>{ev.name}</code>
                      </td>
                      <td style={{ color: 'var(--fg-2)', fontSize: 11.5 }}>{ev.description || <span style={{ color: 'var(--fg-3)' }}>—</span>}</td>
                      <td style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                        {Array.isArray(ev.properties) && ev.properties.length > 0
                          ? ev.properties.map((p, i) => (
                            <span key={i} className="mh-tag" style={{ marginRight: 4, fontSize: 10 }}>{p.name}</span>
                          ))
                          : <span style={{ color: 'var(--fg-3)' }}>none</span>
                        }
                      </td>
                      <td style={{ color: 'var(--fg-3)', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {new Date(ev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td>
                        <div className="mh-row" style={{ gap: 4 }}>
                          <button
                            className="mh-btn ghost sm"
                            style={{ fontSize: 11, padding: '2px 8px' }}
                            onClick={() => startEdit(ev)}
                          >
                            edit
                          </button>
                          <button
                            className="mh-btn ghost sm"
                            style={{ color: 'var(--bad)', fontSize: 11, padding: '2px 8px' }}
                            onClick={() => deleteEventSchema(ev)}
                          >
                            × delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: 'var(--fg-3)', fontSize: 11.5 }}>
                No custom events yet. Click &quot;+ Add Event&quot; to document your first custom event.
              </div>
            )}
          </div>
        </Panel>

        <AsciiHr label="about" />

        <Panel title="About MiniHog">
          <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.6 }}>
            <div className="mh-row" style={{ justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--bd)' }}>
              <span className="mh-dim">Version</span>
              <span style={{ color: 'var(--acc)', fontWeight: 600 }}>v1.0.0</span>
            </div>
            <div className="mh-row" style={{ justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--bd)' }}>
              <span className="mh-dim">License</span>
              <span style={{ color: 'var(--fg-hi)' }}>MIT</span>
            </div>
            <div className="mh-row" style={{ justifyContent: 'space-between', padding: '4px 0' }}>
              <span className="mh-dim">Stack</span>
              <span style={{ color: 'var(--fg)' }}>Next.js 14 · Express · PostgreSQL · Prisma</span>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
