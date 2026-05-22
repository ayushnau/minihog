'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAiSettings, isAiConfigured, aiSettingsToHeaders } from '@/lib/aiSettings';

// ── Types ──────────────────────────────────────────────────────────────────

interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: string;
}

interface FunnelStep {
  event: string;
  property_key?: string;
  property_value?: string;
}

interface Action {
  type: 'funnel' | 'events' | 'retention';
  label: string;
  steps?: FunnelStep[];
  event?: string;
  filter_key?: string;
  filter_value?: string;
  cohort?: string;
  day?: number;
  from?: string;
  to?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  actions?: Action[];
  thinking?: string;
  streaming?: boolean;
}

// ── Suggested prompts ──────────────────────────────────────────────────────

const SUGGESTIONS = [
  'What events are being tracked?',
  'Show me the signup → purchase funnel',
  'How is Day-7 retention looking for signups?',
  'Which pages get the most views?',
  'Where do users drop off most?',
];

// ── Apply URL builder ──────────────────────────────────────────────────────

function buildApplyUrl(action: Action): string {
  const p = new URLSearchParams();
  if (action.from) p.set('from', action.from);
  if (action.to) p.set('to', action.to);

  if (action.type === 'funnel') {
    const steps = (action.steps || []).map(s => ({
      event: s.event,
      ...(s.property_key ? { propertyKey: s.property_key, propertyValue: s.property_value || '' } : {}),
    }));
    p.set('steps', JSON.stringify(steps));
    return `/funnel?${p}`;
  }
  if (action.type === 'events') {
    if (action.event) p.set('event', action.event);
    if (action.filter_key) p.set('filter_key', action.filter_key);
    if (action.filter_value) p.set('filter_value', action.filter_value);
    return `/events?${p}`;
  }
  if (action.type === 'retention') {
    if (action.cohort) p.set('cohort', action.cohort);
    if (action.day) p.set('day', String(action.day));
    return `/retention?${p}`;
  }
  return '/';
}

// ── Simple markdown renderer ───────────────────────────────────────────────

function inlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--fg-hi)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} style={{ color: 'var(--fg-2)' }}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="ai-inline-code">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function Markdown({ text }: { text: string }) {
  // Strip any <suggest_action .../> tags the model leaks into its text output
  const clean = text.replace(/<suggest_action[\s\S]*?\/>/g, '').replace(/<suggest_action[\s\S]*?<\/suggest_action>/g, '').trim();
  const lines = clean.split('\n');
  const elements: React.ReactNode[] = [];
  let inCode = false;
  let codeLines: string[] = [];
  let listBuffer: React.ReactNode[] = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(<div key={`list-${elements.length}`} className="ai-md-list">{listBuffer}</div>);
      listBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCode) {
        flushList();
        elements.push(<pre key={i} className="ai-code">{codeLines.join('\n')}</pre>);
        codeLines = [];
        inCode = false;
      } else {
        flushList();
        inCode = true;
      }
      continue;
    }

    if (inCode) { codeLines.push(line); continue; }

    if (line.startsWith('# ')) {
      flushList();
      elements.push(<div key={i} className="ai-md-h1">{inlineMarkdown(line.slice(2))}</div>);
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(<div key={i} className="ai-md-h2">{inlineMarkdown(line.slice(3))}</div>);
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(<div key={i} className="ai-md-h3">{inlineMarkdown(line.slice(4))}</div>);
    } else if (/^[-*]\s/.test(line)) {
      listBuffer.push(
        <div key={i} className="ai-md-li">
          <span className="ai-md-bullet">·</span>
          <span>{inlineMarkdown(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const m = line.match(/^(\d+)\.\s(.*)/);
      if (m) listBuffer.push(
        <div key={i} className="ai-md-li">
          <span className="ai-md-bullet">{m[1]}.</span>
          <span>{inlineMarkdown(m[2])}</span>
        </div>
      );
    } else if (line.trim() === '') {
      flushList();
      elements.push(<div key={i} style={{ height: 5 }} />);
    } else {
      flushList();
      elements.push(<div key={i}>{inlineMarkdown(line)}</div>);
    }
  }

  flushList();
  return <div className="ai-markdown">{elements}</div>;
}

// ── Main widget ────────────────────────────────────────────────────────────

export default function AiWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [configured, setConfigured] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) {
      const s = getAiSettings();
      setConfigured(isAiConfigured(s));
      setTimeout(() => inputRef.current?.focus(), 80);
      if (!sessionLoaded && isAiConfigured(s)) loadSession();
    }
  }, [open]);

  // Load session history on first open
  const loadSession = async () => {
    try {
      const r = await fetch('/api/ai/session', { credentials: 'include' });
      const d = await r.json();
      if (d.success && Array.isArray(d.messages) && d.messages.length > 0) {
        setMessages(d.messages.map((m: any, i: number) => ({
          id: String(i),
          role: m.role,
          content: m.content || '',
        })));
      }
    } catch {}
    setSessionLoaded(true);
  };

  // Load doc count badge when panel opens
  useEffect(() => {
    if (open) {
      fetch('/api/ai/context', { credentials: 'include' })
        .then(r => r.json())
        .then(d => { if (d.success) setDocCount(d.docs.length); })
        .catch(() => {});
    }
  }, [open]);

  // ── Send message ──────────────────────────────────────────────────────────

  const send = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text.trim() };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: ChatMessage = {
      id: assistantId, role: 'assistant', content: '', toolCalls: [], actions: [], streaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreaming(true);

    try {
      const aiCfg = getAiSettings();
      const res = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...aiSettingsToHeaders(aiCfg) },
        credentials: 'include',
        body: JSON.stringify({ message: text.trim() }),
      });

      if (!res.ok || !res.body) {
        setMessages(prev => prev.map(m => m.id === assistantId
          ? { ...m, content: 'Error: could not reach AI.', streaming: false } : m));
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop()!;

        for (const part of parts) {
          const lines = part.split('\n');
          let event = '';
          let data = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) event = line.slice(7);
            if (line.startsWith('data: ')) data = line.slice(6);
          }
          if (!event || !data) continue;

          let payload: any;
          try { payload = JSON.parse(data); } catch { continue; }

          switch (event) {
            case 'text':
              setMessages(prev => prev.map(m => m.id === assistantId
                ? { ...m, content: m.content + payload.token, thinking: undefined } : m));
              break;

            case 'thinking':
              setMessages(prev => prev.map(m => m.id === assistantId
                ? { ...m, thinking: payload.message } : m));
              break;

            case 'tool_start':
              setMessages(prev => prev.map(m => m.id === assistantId
                ? { ...m, toolCalls: [...(m.toolCalls || []), { name: payload.name, args: payload.args }] } : m));
              break;

            case 'tool_end':
              setMessages(prev => prev.map(m => {
                if (m.id !== assistantId) return m;
                const tcs = [...(m.toolCalls || [])];
                const idx = tcs.findLastIndex(t => t.name === payload.name && !t.result);
                if (idx >= 0) tcs[idx] = { ...tcs[idx], result: payload.result };
                return { ...m, toolCalls: tcs };
              }));
              break;

            case 'action':
              setMessages(prev => prev.map(m => m.id === assistantId
                ? { ...m, actions: [...(m.actions || []), payload as Action] } : m));
              break;

            case 'error':
              setMessages(prev => prev.map(m => m.id === assistantId
                ? { ...m, content: m.content + `\n\n⚠ ${payload.message}`, streaming: false, thinking: undefined } : m));
              break;

            case 'done':
              setMessages(prev => prev.map(m => m.id === assistantId
                ? { ...m, streaming: false, thinking: undefined } : m));
              setStreaming(false);
              break;
          }
        }
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === assistantId
        ? { ...m, content: m.content || 'Connection error.', streaming: false, thinking: undefined } : m));
      setStreaming(false);
    }
  }, [streaming]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); send(input); };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const clearChat = async () => {
    await fetch('/api/ai/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...aiSettingsToHeaders(getAiSettings()) },
      credentials: 'include', body: JSON.stringify({ clear: true }),
    });
    setMessages([]);
    setSessionLoaded(false);
  };

  // ── Apply action ──────────────────────────────────────────────────────────

  const applyAction = (action: Action) => {
    const url = buildApplyUrl(action);
    router.push(url);
    setOpen(false);
  };


  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <button
        className={`ai-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(!open)}
        title="AI assistant"
      >
        ◈
      </button>

      {open && (
        <div className="ai-panel">
          {/* Header */}
          <div className="ai-head">
            <span className="ai-head-title"><span className="mh-acc">◈</span> AI Assistant</span>
            <div className="ai-head-actions">
              {docCount > 0 && (
                <span className="ai-doc-badge" title={`${docCount} context doc${docCount > 1 ? 's' : ''} active`}>
                  ⊡ {docCount} doc{docCount > 1 ? 's' : ''}
                </span>
              )}
              <a href="/settings#ai-context" className="ai-head-btn" onClick={() => setOpen(false)} title="Manage context docs in Settings">
                ⊞ docs
              </a>
              <button className="ai-head-btn" onClick={clearChat} title="Clear chat">⊘</button>
              <button className="ai-head-btn" onClick={() => setOpen(false)} title="Close">×</button>
            </div>
          </div>

          {/* Not configured — setup prompt */}
          {!configured ? (
            <div className="ai-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, color: 'var(--fg-3)' }}>◈</div>
              <div style={{ fontSize: 13, color: 'var(--fg-hi)', fontWeight: 600 }}>AI provider not configured</div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-3)', lineHeight: 1.6, maxWidth: 260 }}>
                Set up Gemini or Ollama in Settings to start using the AI assistant.
              </div>
              <a
                href="/settings"
                onClick={() => setOpen(false)}
                style={{ marginTop: 8, padding: '6px 18px', fontSize: 12, border: '1px solid var(--acc)', color: 'var(--acc)', textDecoration: 'none', letterSpacing: '.05em' }}
              >
                open settings →
              </a>
            </div>
          ) : (
            <>
              {/* Messages body */}
              <div className="ai-body">
                {messages.length === 0 ? (
                  <div className="ai-empty">
                    <div className="ai-empty-glyph">◈</div>
                    <div className="ai-empty-title">Analytics AI</div>
                    <div className="ai-empty-sub">Ask anything about your data</div>
                    <div className="ai-suggestions">
                      {SUGGESTIONS.map(s => (
                        <button key={s} className="ai-suggestion" onClick={() => send(s)}>{s}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`ai-msg ${msg.role}`}>
                      {msg.role === 'assistant' && (
                        <div className="ai-msg-role"><span className="mh-acc">◈</span> assistant</div>
                      )}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="ai-tools">
                          {msg.toolCalls.map((tc, i) => <ToolCard key={i} tool={tc} />)}
                        </div>
                      )}
                      {msg.thinking && (
                        <div className="ai-thinking">
                          <span className="ai-thinking-dot" /><span className="ai-thinking-dot" /><span className="ai-thinking-dot" />
                          <span>{msg.thinking}</span>
                        </div>
                      )}
                      {msg.content && (
                        <div className="ai-msg-content">
                          {msg.role === 'assistant' ? <Markdown text={msg.content} /> : msg.content}
                          {msg.streaming && !msg.thinking && <span className="ai-cursor" />}
                        </div>
                      )}
                      {msg.streaming && !msg.content && !msg.toolCalls?.length && !msg.thinking && (
                        <div className="ai-msg-content ai-msg-thinking">
                          <span className="ai-thinking-dot" /><span className="ai-thinking-dot" /><span className="ai-thinking-dot" />
                        </div>
                      )}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="ai-actions">
                          <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
                            ▸ click to apply in dashboard
                          </div>
                          {msg.actions.map((action, i) => (
                            <ActionCard key={i} action={action} onApply={() => applyAction(action)} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form className="ai-input-wrap" onSubmit={handleSubmit}>
                <textarea
                  ref={inputRef}
                  className="ai-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your analytics… (Enter to send)"
                  rows={1}
                  disabled={streaming}
                />
                <button type="submit" className="ai-send" disabled={!input.trim() || streaming} title="Send (Enter)">
                  {streaming ? <span className="ai-send-dot" /> : '▸'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ── Tool call card ─────────────────────────────────────────────────────────

function ToolCard({ tool }: { tool: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const LABELS: Record<string, string> = {
    get_event_names: '⊟ event names',
    query_events: '⊟ query events',
    query_funnel: '⌇ funnel',
    query_retention: '⌗ retention',
    search_context: '⊡ context search',
    suggest_action: '▸ suggest action',
  };

  return (
    <div className="ai-tool">
      <div className="ai-tool-head" onClick={() => setExpanded(!expanded)}>
        <span className="ai-tool-name">{LABELS[tool.name] || tool.name}</span>
        <span className="ai-tool-args">
          {Object.entries(tool.args).slice(0, 2).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')}
        </span>
        {tool.result
          ? <span className="ai-tool-status ok">✓</span>
          : <span className="ai-tool-status running"><span className="mh-loading" /></span>
        }
        <span className="ai-tool-toggle">{expanded ? '▴' : '▾'}</span>
      </div>
      {expanded && tool.result && (
        <pre className="ai-tool-result">{tool.result}</pre>
      )}
    </div>
  );
}

// ── Action card ────────────────────────────────────────────────────────────

function ActionCard({ action, onApply }: { action: Action; onApply: () => void }) {
  const ICONS = { funnel: '⌇', events: '⊟', retention: '⌗' };
  const TYPE_LABELS = { funnel: 'Open in Funnel', events: 'Open in Events', retention: 'Open in Retention' };

  let preview = '';
  if (action.type === 'funnel' && action.steps) preview = action.steps.map(s => s.property_key ? `${s.event}[${s.property_key}=${s.property_value}]` : s.event).join(' → ');
  else if (action.type === 'events' && action.event) preview = action.event + (action.filter_key ? ` · ${action.filter_key}=${action.filter_value}` : '');
  else if (action.type === 'retention' && action.cohort) preview = `${action.cohort} · D${action.day || 1}`;

  return (
    <button className="ai-action-card" onClick={onApply}>
      <span className="ai-action-icon">{ICONS[action.type]}</span>
      <span className="ai-action-body">
        <span className="ai-action-cta">{TYPE_LABELS[action.type]}</span>
        {preview && <span className="ai-action-preview">{preview}</span>}
      </span>
      <span className="ai-action-arrow">→</span>
    </button>
  );
}
