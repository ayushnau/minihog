'use client';

import type { AiSettings } from './aiSettings';

// ── Types ──────────────────────────────────────────────────────────────────

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: OllamaToolCall[];
  tool_call_id?: string;
}

interface OllamaToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ActionPayload {
  type: 'funnel' | 'events' | 'retention';
  label: string;
  steps?: { event: string; property_key?: string; property_value?: string }[];
  event?: string;
  filter_key?: string;
  filter_value?: string;
  cohort?: string;
  day?: number;
  from?: string;
  to?: string;
}

export interface OllamaChatCallbacks {
  onToken: (token: string) => void;
  onThinking: (message: string) => void;
  onToolStart: (name: string, args: Record<string, unknown>) => void;
  onToolEnd: (name: string, result: string) => void;
  onAction: (action: ActionPayload) => void;
  onError: (message: string) => void;
  onDone: () => void;
}

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_ITERATIONS = 8;

// ── System prompt ──────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `You are an analytics assistant embedded in a product analytics dashboard.
You have tools to query real live analytics data AND access to context documents that describe the business, its products, pricing, and policies.
ALWAYS use tools to answer questions — never guess or make up numbers.
Today's date is ${today}.

TOOL USAGE RULES:
- Call get_event_schema at the START of any conversation to understand the business's events and their meaning before answering. This tells you what events exist, what they mean, and what properties they carry.
- Use get_event_schema instead of get_event_names when you need to understand property structure.
- When asked about the business, product, menu, pricing, or policies: call search_context first.
- Start with get_event_names to discover available events (use get_event_schema for richer property context).
- For ambiguous events like \`button_click\`, \`page_view\`, \`link_click\`: ALWAYS call get_event_properties first to see what properties they carry (e.g. button_name, page, url). Use that knowledge to filter steps precisely.
- When building a funnel: if an event is generic, use get_event_properties to find the right property filter before calling query_funnel or suggest_action.
- Use query_events, query_funnel, query_retention for data queries.
- After presenting an analysis, use suggest_action to give the user a one-click Apply button.

suggest_action RULES (strictly follow these):
- ALWAYS call suggest_action whenever you mention or recommend any funnel, event view, or retention config — no exceptions.
- Call it in the SAME response as your recommendation. NEVER ask "would you like to see this?" — just present it AND call suggest_action immediately.
- Call suggest_action EXACTLY ONCE per response. Pick the single most important/relevant action only. Never call it multiple times.
- For a funnel recommendation: suggest_action with type="funnel", steps=[...ordered event names...]
- For an event recommendation: suggest_action with type="events", event="event_name"
- For retention: suggest_action with type="retention", cohort="event_name", day=N
- Always include from/to using the last 30 days as default date range.
- Label should be short and action-oriented: "Apply signup → purchase funnel", "View page_view trend", etc.

When presenting data: use numbers, percentages, and highlight key insights. Use markdown: **bold** for numbers, \`code\` for event names, bullet lists for steps.`;
}

// ── Tool definitions ───────────────────────────────────────────────────────

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_event_schema',
      description: 'Get the full schema of all tracked events — both standard platform events and custom business events defined by the user. Returns event names, descriptions, and their properties with types and allowed values. Call this early to understand what events exist and what they mean for this specific business.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_event_names',
      description: 'List all tracked event names and their total counts. Call this first to discover what events are available.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_events',
      description: 'Get total count, unique users, and daily time series for a specific event in a date range.',
      parameters: {
        type: 'object',
        required: ['event', 'from', 'to'],
        properties: {
          event: { type: 'string', description: 'Event name (e.g. signup, page_view)' },
          from: { type: 'string', description: 'Start date YYYY-MM-DD' },
          to: { type: 'string', description: 'End date YYYY-MM-DD' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_funnel',
      description: 'Analyze conversion funnel between a sequence of events. Returns users and drop-off % at each step.',
      parameters: {
        type: 'object',
        required: ['steps', 'from', 'to'],
        properties: {
          steps: { type: 'array', items: { type: 'string' }, description: 'Ordered event names e.g. ["page_view","signup","purchase"]' },
          from: { type: 'string', description: 'Start date YYYY-MM-DD' },
          to: { type: 'string', description: 'End date YYYY-MM-DD' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_retention',
      description: 'Get N-day retention for a cohort event. Returns how many users returned on day N after the cohort event.',
      parameters: {
        type: 'object',
        required: ['cohort', 'from', 'to'],
        properties: {
          cohort: { type: 'string', description: 'Cohort event name (e.g. signup)' },
          day: { type: 'number', description: 'Retention day (default 1)' },
          from: { type: 'string', description: 'Start date YYYY-MM-DD' },
          to: { type: 'string', description: 'End date YYYY-MM-DD' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_event_properties',
      description: 'Get the property keys and their top values for a specific event. Use this when an event name is ambiguous (e.g. button_click, page_view) to understand what properties can be used to filter it more precisely before building a funnel.',
      parameters: {
        type: 'object',
        required: ['event', 'from', 'to'],
        properties: {
          event: { type: 'string', description: 'Event name to inspect' },
          from: { type: 'string', description: 'Start date YYYY-MM-DD' },
          to: { type: 'string', description: 'End date YYYY-MM-DD' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_context',
      description: 'Search uploaded context documents (product docs, policies, etc.) for relevant information.',
      parameters: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', description: 'Keywords to search for' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_action',
      description: 'Create a one-click Apply button for the user to apply your recommended dashboard configuration.',
      parameters: {
        type: 'object',
        required: ['type', 'label'],
        properties: {
          type: { type: 'string', enum: ['funnel', 'events', 'retention'] },
          label: { type: 'string' },
          steps: { type: 'array', items: { type: 'object', properties: { event: { type: 'string' }, property_key: { type: 'string' }, property_value: { type: 'string' } } } },
          event: { type: 'string' },
          filter_key: { type: 'string' },
          filter_value: { type: 'string' },
          cohort: { type: 'string' },
          day: { type: 'number' },
          from: { type: 'string' },
          to: { type: 'string' },
        },
      },
    },
  },
];

// ── Client-side tool executor ──────────────────────────────────────────────
// Calls dashboard Next.js proxy routes (which handle JWT auth via cookie)

async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  try {
    switch (name) {
      case 'get_event_schema': {
        const r = await fetch('/api/event-schema', { credentials: 'include', cache: 'no-store' });
        const d = await r.json();
        const STANDARD = [
          { name: 'page_view',    description: 'User visits a page',         properties: ['page (string)', 'referrer (string)', 'device (string)', 'country (string)'] },
          { name: 'button_click', description: 'User clicks a button/CTA',   properties: ['button_id (string)', 'button_label (string)', 'page (string)', 'device (string)'] },
          { name: 'signup',       description: 'User completes registration', properties: ['method (string: email|google|github)', 'device (string)'] },
          { name: 'logout',       description: 'User ends their session',     properties: ['session_duration_min (number)', 'device (string)'] },
          { name: 'search',       description: 'User performs a search',      properties: ['query (string)', 'results_count (number)'] },
        ];
        const lines = ['## Standard Events'];
        for (const e of STANDARD) {
          lines.push(`### ${e.name} — ${e.description}`);
          lines.push(e.properties.map(p => `  ${p}`).join('\n'));
        }
        if (d.success && Array.isArray(d.schemas) && d.schemas.length > 0) {
          lines.push('\n## Custom Business Events');
          for (const e of d.schemas) {
            lines.push(`### ${e.name} — ${e.description || ''}`);
            const props = Array.isArray(e.properties) ? e.properties : [];
            if (props.length > 0) {
              lines.push(props.map((p: any) => `  ${p.name} (${p.type})${p.values?.length ? ': ' + p.values.join('|') : ''}${p.description ? ' — ' + p.description : ''}`).join('\n'));
            }
          }
        }
        return lines.join('\n');
      }

      case 'get_event_names': {
        const r = await fetch('/api/analytics/event-names', { credentials: 'include', cache: 'no-store' });
        const d = await r.json();
        if (!d.success || !Array.isArray(d.events) || d.events.length === 0) return 'No events tracked yet.';
        return d.events.map((e: any) => `${e.event_name}: ${e.count} events`).join('\n');
      }

      case 'query_events': {
        const event = String(args.event || '');
        const from = String(args.from || weekAgo);
        const to = String(args.to || today);
        const p = new URLSearchParams({ event, from, to });
        const r = await fetch(`/api/analytics/events?${p}`, { credentials: 'include', cache: 'no-store' });
        const d = await r.json();
        if (!d.success) return `Error fetching events: ${d.error || 'unknown'}`;
        const lines = [
          `Event: \`${event}\``,
          `Period: ${from} → ${to}`,
          `Total count: **${d.totalCount ?? d.total_count ?? '?'}**`,
          `Unique users: **${d.uniqueUsers ?? d.unique_users ?? '?'}**`,
        ];
        if (Array.isArray(d.timeSeries) && d.timeSeries.length > 0) {
          lines.push('', 'Time series:');
          for (const pt of d.timeSeries.slice(-14)) {
            lines.push(`  ${pt.date}: ${pt.count} events, ${pt.unique_users ?? pt.uniqueUsers ?? 0} users`);
          }
        }
        return lines.join('\n');
      }

      case 'query_funnel': {
        const steps = (args.steps as string[]) || [];
        const from = String(args.from || weekAgo);
        const to = String(args.to || today);
        const p = new URLSearchParams({ steps: JSON.stringify(steps.map(s => ({ event: s }))), from, to });
        const r = await fetch(`/api/analytics/funnel?${p}`, { credentials: 'include', cache: 'no-store' });
        const d = await r.json();
        if (!d.success) return `Error fetching funnel: ${d.error || 'unknown'}`;
        const lines = [
          `Funnel: ${steps.map(s => `\`${s}\``).join(' → ')}`,
          `Period: ${from} → ${to}`,
          `Top of funnel: **${d.totalUsersAtFirstStep ?? d.total_users_at_first_step ?? '?'} users**`,
          '', 'Steps:',
        ];
        const funnel = d.funnel ?? d.steps ?? [];
        for (const step of funnel) {
          lines.push(`  ${step.step}. \`${step.event_name ?? step.eventName}\`: **${step.users} users** (${Number(step.drop_off_percentage ?? step.dropOffPercentage ?? 0).toFixed(1)}% drop-off)`);
        }
        return lines.join('\n');
      }

      case 'query_retention': {
        const cohort = String(args.cohort || 'signup');
        const day = Number(args.day || 1);
        const from = String(args.from || weekAgo);
        const to = String(args.to || today);
        const p = new URLSearchParams({ cohort, day: String(day), from, to });
        const r = await fetch(`/api/analytics/retention?${p}`, { credentials: 'include', cache: 'no-store' });
        const d = await r.json();
        if (!d.success) return `Error fetching retention: ${d.error || 'unknown'}`;
        return [
          `Retention — cohort: \`${cohort}\`, day ${day}`,
          `Period: ${from} → ${to}`,
          `Cohort size: **${d.cohortSize ?? d.cohort_size ?? '?'} users**`,
          `Retained on D${day}: **${d.retainedUsers ?? d.retained_users ?? '?'} users**`,
          `Retention rate: **${Number(d.retentionPercentage ?? d.retention_percentage ?? 0).toFixed(1)}%**`,
        ].join('\n');
      }

      case 'get_event_properties': {
        const event = String(args.event || '');
        const from = String(args.from || weekAgo);
        const to = String(args.to || today);
        const p = new URLSearchParams({ event, from, to });
        const keysRes = await fetch(`/api/analytics/property-keys?${p}`, { credentials: 'include', cache: 'no-store' });
        const keysData = await keysRes.json();
        const keys: string[] = keysData.keys ?? keysData.propertyKeys ?? [];
        if (keys.length === 0) return `No properties found for \`${event}\` in this date range.`;
        const lines = [`Properties for \`${event}\`:`];
        for (const key of keys.slice(0, 8)) {
          const vp = new URLSearchParams({ event, key, from, to });
          const vr = await fetch(`/api/analytics/property-values?${vp}`, { credentials: 'include', cache: 'no-store' });
          const vd = await vr.json();
          const vals: any[] = vd.values ?? vd.breakdown ?? [];
          const top = vals.slice(0, 5).map((v: any) => `"${v.value}" (${v.count})`).join(', ');
          lines.push(`  ${key}: ${top || 'no values'}`);
        }
        return lines.join('\n');
      }

      case 'search_context': {
        const query = String(args.query || '').toLowerCase();
        const r = await fetch('/api/ai/context', { credentials: 'include', cache: 'no-store' });
        const d = await r.json();
        if (!d.success || !Array.isArray(d.docs) || d.docs.length === 0) return 'No context documents uploaded.';
        const results = d.docs
          .map((doc: any) => `[${doc.name}]\n${doc.content ?? doc.preview ?? ''}`)
          .filter((text: string) => query.length < 3 || text.toLowerCase().includes(query));
        return results.length > 0 ? results.join('\n\n---\n\n') : 'No matches found in context documents.';
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err: any) {
    return `Tool error: ${err?.message || String(err)}`;
  }
}

// ── Main: client-side Ollama agentic loop ──────────────────────────────────

export async function runOllamaChat(
  settings: AiSettings,
  conversationHistory: Message[],  // existing messages (system already injected)
  userMessage: string,
  callbacks: OllamaChatCallbacks,
): Promise<Message[]> {
  const { ollamaUrl, ollamaModel } = settings;
  const endpoint = `${ollamaUrl.replace(/\/$/, '')}/v1/chat/completions`;

  // Build messages: start with system prompt, append history, then new user message
  const messages: Message[] = [
    { role: 'system', content: buildSystemPrompt() },
    ...conversationHistory.filter(m => m.role !== 'system'),
    { role: 'user', content: userMessage.trim() },
  ];

  try {
    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      const body = {
        model: ollamaModel,
        stream: true,
        messages: messages.map(m => {
          if (m.role === 'tool') return { role: 'tool', content: m.content, tool_call_id: m.tool_call_id };
          if (m.role === 'assistant' && m.tool_calls?.length) {
            return { role: 'assistant', content: m.content ?? null, tool_calls: m.tool_calls };
          }
          return { role: m.role, content: m.content };
        }),
        tools: TOOLS,
      };

      let aiRes: Response;
      try {
        aiRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch {
        callbacks.onError(`Cannot reach Ollama at ${endpoint}. Is it running with OLLAMA_ORIGINS=* ?`);
        return messages;
      }

      if (!aiRes.ok) {
        const errText = await aiRes.text().catch(() => aiRes.statusText);
        callbacks.onError(`Ollama error ${aiRes.status}: ${errText}`);
        return messages;
      }

      // ── Stream parse ───────────────────────────────────────────────────────

      const reader = aiRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let iterText = '';
      let textBuf = '';
      const toolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map();
      let finishReason = 'stop';

      // Flush safe text (strips <suggest_action> tags that leak into stream)
      const flushTextBuf = (force = false) => {
        if (textBuf.includes('<suggest_action')) {
          const cleaned = textBuf
            .replace(/<suggest_action[\s\S]*?\/>/g, '')
            .replace(/<suggest_action[\s\S]*?<\/suggest_action>/g, '');
          if (!cleaned.includes('<suggest_action') || force) {
            if (cleaned) { callbacks.onToken(cleaned); iterText += cleaned; }
            textBuf = '';
          }
        } else {
          if (textBuf) { callbacks.onToken(textBuf); iterText += textBuf; }
          textBuf = '';
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) { flushTextBuf(true); break; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;

          let chunk: any;
          try { chunk = JSON.parse(payload); } catch { continue; }

          const choice = chunk.choices?.[0];
          if (!choice) continue;
          if (choice.finish_reason) finishReason = choice.finish_reason;

          const delta = choice.delta;
          if (!delta) continue;

          if (delta.content) {
            textBuf += delta.content;
            flushTextBuf();
          }

          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!toolCalls.has(idx)) {
                toolCalls.set(idx, { id: tc.id || `call_${idx}`, name: '', arguments: '' });
              }
              const partial = toolCalls.get(idx)!;
              if (tc.id) partial.id = tc.id;
              if (tc.function?.name) partial.name += tc.function.name;
              if (tc.function?.arguments) partial.arguments += tc.function.arguments;
            }
          }
        }
      }

      // ── Append assistant message ───────────────────────────────────────────

      const assistantMsg: Message = { role: 'assistant', content: iterText.trim() || null };
      if (toolCalls.size > 0) {
        assistantMsg.tool_calls = Array.from(toolCalls.values()).map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: tc.arguments },
        }));
      }
      messages.push(assistantMsg);

      if (toolCalls.size === 0 || finishReason === 'stop') break;

      // ── Execute tools ──────────────────────────────────────────────────────

      const toolNames = Array.from(toolCalls.values()).map(t => t.name);
      const dataTools = toolNames.filter(n => n !== 'suggest_action');
      if (dataTools.length > 0) {
        callbacks.onThinking(`Querying: ${dataTools.join(', ')}…`);
      }

      for (const [, tc] of toolCalls) {
        let toolArgs: Record<string, unknown> = {};
        try { toolArgs = JSON.parse(tc.arguments); } catch { toolArgs = {}; }

        if (tc.name === 'suggest_action') {
          callbacks.onAction({
            type: toolArgs.type as any,
            label: String(toolArgs.label ?? ''),
            steps: toolArgs.steps as any,
            event: toolArgs.event as string | undefined,
            filter_key: toolArgs.filter_key as string | undefined,
            filter_value: toolArgs.filter_value as string | undefined,
            cohort: toolArgs.cohort as string | undefined,
            day: toolArgs.day as number | undefined,
            from: toolArgs.from as string | undefined,
            to: toolArgs.to as string | undefined,
          });
          messages.push({ role: 'tool', content: `Action created: "${toolArgs.label}"`, tool_call_id: tc.id });
          continue;
        }

        callbacks.onToolStart(tc.name, toolArgs);
        const result = await executeTool(tc.name, toolArgs);
        callbacks.onToolEnd(tc.name, result);
        messages.push({ role: 'tool', content: result, tool_call_id: tc.id });
      }
    }
  } catch (err: any) {
    callbacks.onError(err?.message || 'Unexpected error in Ollama chat');
  }

  callbacks.onDone();
  return messages;
}
