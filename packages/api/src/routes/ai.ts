import { Router, Request, Response } from 'express';
import { validateJWT } from '../middleware/jwtAuth';
import { prisma } from '../db/client';
import { getEventCounts } from '../services/analytics/eventCount';
import { getEventTimeSeries } from '../services/analytics/timeSeries';
import { getFunnelAnalysis } from '../services/analytics/funnel';
import { getRetentionAnalysis } from '../services/analytics/retention';
import { getAvailablePropertyKeys, getEventPropertiesBreakdown } from '../services/analytics/propertiesBreakdown';

export const aiRouter = Router();

// ── Config ─────────────────────────────────────────────────────────────────

const MAX_ITERATIONS = 8;
const GEMINI_CHAT_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

// Per-request config: reads from x-ai-* headers first, falls back to env vars
function getChatConfig(req: Request): { url: string; headers: Record<string, string>; model: string } {
  const provider = (req as any).headers['x-ai-provider'] || process.env.AI_PROVIDER || 'ollama';
  if (provider === 'gemini') {
    const key   = (req as any).headers['x-ai-gemini-key']   || process.env.GEMINI_API_KEY   || '';
    const model = (req as any).headers['x-ai-gemini-model'] || process.env.GEMINI_MODEL      || 'gemini-2.0-flash';
    return {
      url: GEMINI_CHAT_URL,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      model,
    };
  }
  // ollama
  const base  = (req as any).headers['x-ai-ollama-url']   || process.env.OLLAMA_URL   || 'http://localhost:11434';
  const model = (req as any).headers['x-ai-ollama-model'] || process.env.OLLAMA_MODEL || 'qwen3:8b';
  return {
    url: `${base}/v1/chat/completions`,
    headers: { 'Content-Type': 'application/json' },
    model,
  };
}

// ── Session persistence ────────────────────────────────────────────────────

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

async function loadSession(userId: string): Promise<Message[]> {
  try {
    const session = await prisma.aiSession.findUnique({ where: { userId } });
    if (session && Array.isArray(session.messages) && (session.messages as any[]).length > 0) {
      const msgs = session.messages as unknown as Message[];
      // Always rebuild system prompt (it contains today's date)
      const withoutSystem = msgs.filter(m => m.role !== 'system');
      return [{ role: 'system', content: buildSystemPrompt() }, ...withoutSystem];
    }
  } catch {}
  return [{ role: 'system', content: buildSystemPrompt() }];
}

async function saveSession(userId: string, messages: Message[]): Promise<void> {
  try {
    await prisma.aiSession.upsert({
      where: { userId },
      create: { id: require('crypto').randomUUID(), userId, messages: messages as any },
      update: { messages: messages as any },
    });
  } catch {}
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
          event: { type: 'string', description: 'Event name to inspect (e.g. button_click)' },
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
      description: 'Create a one-click Apply button for the user to apply your recommended dashboard configuration. Call this after presenting analysis to give the user an actionable shortcut.',
      parameters: {
        type: 'object',
        required: ['type', 'label'],
        properties: {
          type: { type: 'string', enum: ['funnel', 'events', 'retention'], description: 'Which analytics view to configure' },
          label: { type: 'string', description: 'Short action label shown on the button, e.g. "View signup → purchase funnel"' },
          steps: {
            type: 'array',
            description: 'For funnel: ordered steps. Each step is an object with event name and optional property filter.',
            items: {
              type: 'object',
              required: ['event'],
              properties: {
                event: { type: 'string', description: 'Event name' },
                property_key: { type: 'string', description: 'Property key to filter this step (e.g. button_name, page)' },
                property_value: { type: 'string', description: 'Property value to match (e.g. signup, home)' },
              },
            },
          },
          event: { type: 'string', description: 'For events: event name to view' },
          filter_key: { type: 'string', description: 'For events: optional property filter key' },
          filter_value: { type: 'string', description: 'For events: optional property filter value' },
          cohort: { type: 'string', description: 'For retention: cohort event name' },
          day: { type: 'number', description: 'For retention: retention day N' },
          from: { type: 'string', description: 'Start date YYYY-MM-DD for pre-filling the date range' },
          to: { type: 'string', description: 'End date YYYY-MM-DD for pre-filling the date range' },
        },
      },
    },
  },
];

// ── Tool executor ──────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  userId: string,
  apiKeyIds: string[],
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  try {
    switch (name) {
      case 'get_event_schema': {
        const STANDARD = [
          { name: 'page_view',    description: 'User visits a page',         properties: [{ name: 'page', type: 'string' }, { name: 'referrer', type: 'string' }, { name: 'device', type: 'string' }, { name: 'country', type: 'string' }] },
          { name: 'button_click', description: 'User clicks a button/CTA',   properties: [{ name: 'button_id', type: 'string' }, { name: 'button_label', type: 'string' }, { name: 'page', type: 'string' }, { name: 'device', type: 'string' }] },
          { name: 'signup',       description: 'User completes registration', properties: [{ name: 'method', type: 'string', values: ['email', 'google', 'github'] }, { name: 'device', type: 'string' }] },
          { name: 'logout',       description: 'User ends their session',     properties: [{ name: 'session_duration_min', type: 'number' }, { name: 'device', type: 'string' }] },
          { name: 'search',       description: 'User performs a search',      properties: [{ name: 'query', type: 'string' }, { name: 'results_count', type: 'number' }] },
        ];

        const custom = await prisma.eventSchema.findMany({
          where: { userId },
          orderBy: { name: 'asc' },
        });

        const lines = ['## Standard Events'];
        for (const e of STANDARD) {
          lines.push(`### ${e.name} — ${e.description}`);
          lines.push(e.properties.map(p => `  ${p.name} (${p.type})${(p as any).values ? ': ' + (p as any).values.join('|') : ''}`).join('\n'));
        }

        if (custom.length > 0) {
          lines.push('\n## Custom Business Events');
          for (const e of custom) {
            lines.push(`### ${e.name} — ${e.description}`);
            const props = e.properties as any[];
            if (props.length > 0) {
              lines.push(props.map(p => `  ${p.name} (${p.type})${p.values?.length ? ': ' + p.values.join('|') : ''}${p.description ? ' — ' + p.description : ''}`).join('\n'));
            }
          }
        }

        return lines.join('\n');
      }

      case 'get_event_names': {
        const rows = await prisma.$queryRaw<{ event_name: string; count: bigint }[]>`
          SELECT event_name, COUNT(*) as count
          FROM events
          WHERE user_id = ${userId}
          GROUP BY event_name
          ORDER BY count DESC
        `;
        if (rows.length === 0) return 'No events tracked yet.';
        return rows.map(r => `${r.event_name}: ${r.count.toString()} events`).join('\n');
      }

      case 'query_events': {
        const event = String(args.event || '');
        const from = String(args.from || weekAgo);
        const to = String(args.to || today);

        const [counts, series] = await Promise.all([
          getEventCounts(event, new Date(from), new Date(to), apiKeyIds, userId),
          getEventTimeSeries(event, new Date(from), new Date(to), apiKeyIds, userId, 'day'),
        ]);

        return [
          `Event: \`${event}\``,
          `Period: ${from} → ${to}`,
          `Total count: **${counts.total_count}**`,
          `Unique users: **${counts.unique_users}**`,
          '',
          'Time series:',
          ...series.map(d => `  ${d.date}: ${d.count} events, ${d.unique_users} users`),
        ].join('\n');
      }

      case 'query_funnel': {
        const steps = (args.steps as string[]).map(s => ({ event: s }));
        const from = String(args.from || weekAgo);
        const to = String(args.to || today);
        const result = await getFunnelAnalysis(steps, new Date(from), new Date(to), apiKeyIds, userId);

        return [
          `Funnel: ${steps.map(s => `\`${s.event}\``).join(' → ')}`,
          `Period: ${from} → ${to}`,
          `Top of funnel: **${result.total_users_at_first_step} users**`,
          '',
          'Steps:',
          ...result.funnel.map(r =>
            `  ${r.step}. \`${r.event_name}\`: **${r.users} users** (${r.drop_off_percentage.toFixed(1)}% drop-off)`
          ),
        ].join('\n');
      }

      case 'query_retention': {
        const cohort = String(args.cohort || 'signup');
        const day = Number(args.day || 1);
        const from = String(args.from || weekAgo);
        const to = String(args.to || today);
        const result = await getRetentionAnalysis(cohort, day, new Date(from), new Date(to), apiKeyIds, userId);

        return [
          `Retention — cohort: \`${cohort}\`, day ${day}`,
          `Period: ${from} → ${to}`,
          `Cohort size: **${result.cohort_size} users**`,
          `Retained on D${day}: **${result.retained_users} users**`,
          `Retention rate: **${result.retention_percentage.toFixed(1)}%**`,
        ].join('\n');
      }

      case 'get_event_properties': {
        const event = String(args.event || '');
        const from = String(args.from || weekAgo);
        const to = String(args.to || today);

        const keys = await getAvailablePropertyKeys(event, new Date(from), new Date(to), apiKeyIds, userId);
        if (keys.length === 0) return `No properties found for \`${event}\` in this date range.`;

        // For each key get top 5 values
        const lines: string[] = [`Properties for \`${event}\`:`];
        for (const key of keys.slice(0, 8)) {
          const values = await getEventPropertiesBreakdown(event, new Date(from), new Date(to), key, apiKeyIds, userId);
          const top = values.slice(0, 5).map(v => `"${v.value}" (${v.count})`).join(', ');
          lines.push(`  ${key}: ${top}`);
        }
        return lines.join('\n');
      }

      case 'search_context': {
        const query = String(args.query || '').toLowerCase();
        const docs = await prisma.aiContext.findMany({
          where: { userId },
          select: { name: true, content: true },
        });
        if (docs.length === 0) return 'No context documents uploaded.';

        const matches = docs
          // .filter(d => d.content.toLowerCase().includes(query) || d.name.toLowerCase().includes(query))
          .map(d => {
            // const idx = d.content.toLowerCase().indexOf(query);
            // const snippet = idx >= 0
            //   ? d.content.slice(Math.max(0, idx - 100), idx + 400)
            //   : d.content.slice(0, 400);
            return `[${d.name}]\n${d.content}`;
          });

        return matches.length > 0 ? matches.join('\n\n---\n\n') : 'No matches found in context documents.';
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err: any) {
    return `Tool error: ${err?.message || String(err)}`;
  }
}

// ── SSE helpers ────────────────────────────────────────────────────────────

function sseWrite(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ── Routes ─────────────────────────────────────────────────────────────────

aiRouter.use(validateJWT);

// GET /ai/session — return display-friendly session history
aiRouter.get('/session', async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const messages = await loadSession(userId);
  const display = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content || '' }));
  res.json({ success: true, messages: display });
});

// POST /ai/chat/stream — streaming chat with tool calling
aiRouter.post('/chat/stream', async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const apiKeyIds = (req as any).apiKeyIds as string[] || [];
  const { message, clear } = req.body as { message?: string; clear?: boolean };

  if (clear) {
    await prisma.aiSession.deleteMany({ where: { userId } });
    return res.json({ ok: true });
  }

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Missing message' });
  }

  const messages = await loadSession(userId);
  messages.push({ role: 'user', content: message.trim() });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let fullText = '';

  const chat = getChatConfig(req);
  const provider = (req as any).headers['x-ai-provider'] || process.env.AI_PROVIDER || 'ollama';
  console.log(`[AI] provider=${provider} model=${chat.model}`);

  try {
    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      const body = {
        model: chat.model,
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

      console.log(`\n[AI] ── iter ${iter + 1} ── sending ${messages.length} messages, last role: ${messages.at(-1)?.role}`);
      if (messages.at(-1)?.role === 'user') {
        console.log(`[AI] user: ${messages.at(-1)?.content?.slice(0, 120)}`);
      }

      let aiRes: globalThis.Response;
      try {
        aiRes = await fetch(chat.url, {
          method: 'POST',
          headers: chat.headers,
          body: JSON.stringify(body),
        });
      } catch {
        const hint = AI_PROVIDER === 'ollama' ? ` Is Ollama running at ${OLLAMA_BASE}?` : '';
        sseWrite(res, 'error', { message: `Cannot reach ${AI_PROVIDER} API.${hint}` });
        break;
      }

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        sseWrite(res, 'error', { message: `${AI_PROVIDER} error ${aiRes.status}: ${errText}` });
        break;
      }

      const reader = aiRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let iterText = '';
      let textBuf = ''; // buffer to detect/strip <suggest_action> tags in the stream
      const toolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map();
      let finishReason = 'stop';

      // Flush safe text (not part of a <suggest_action> tag) from textBuf
      const flushTextBuf = (force = false) => {
        if (textBuf.includes('<suggest_action')) {
          // If we have the full tag, strip it; otherwise keep buffering
          const cleaned = textBuf.replace(/<suggest_action[\s\S]*?\/>/g, '').replace(/<suggest_action[\s\S]*?<\/suggest_action>/g, '');
          if (!cleaned.includes('<suggest_action') || force) {
            if (cleaned) { sseWrite(res, 'text', { token: cleaned }); fullText += cleaned; iterText += cleaned; }
            textBuf = '';
          }
          // still accumulating partial tag — wait for more tokens
        } else {
          if (textBuf) { sseWrite(res, 'text', { token: textBuf }); fullText += textBuf; iterText += textBuf; }
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

      if (iterText.trim()) {
        console.log(`[AI] text: ${iterText.trim().slice(0, 200)}${iterText.length > 200 ? '…' : ''}`);
      }
      if (toolCalls.size > 0) {
        for (const [, tc] of toolCalls) {
          console.log(`[AI] tool_call: ${tc.name}(${tc.arguments.slice(0, 120)})`);
        }
      }

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

      // Emit thinking indicator before executing tools
      const toolNames = Array.from(toolCalls.values()).map(t => t.name);
      const hasSuggest = toolNames.includes('suggest_action');
      const dataTools = toolNames.filter(n => n !== 'suggest_action');
      if (dataTools.length > 0) {
        sseWrite(res, 'thinking', { message: `Querying: ${dataTools.join(', ')}…` });
      }

      // Execute tools
      for (const [, tc] of toolCalls) {
        let toolArgs: Record<string, unknown> = {};
        try { toolArgs = JSON.parse(tc.arguments); } catch { toolArgs = {}; }

        // suggest_action: emit action event instead of calling executeTool
        if (tc.name === 'suggest_action') {
          sseWrite(res, 'action', {
            type: toolArgs.type,
            label: toolArgs.label,
            steps: toolArgs.steps,
            event: toolArgs.event,
            filter_key: toolArgs.filter_key,
            filter_value: toolArgs.filter_value,
            cohort: toolArgs.cohort,
            day: toolArgs.day,
            from: toolArgs.from,
            to: toolArgs.to,
          });
          messages.push({ role: 'tool', content: `Action created: "${toolArgs.label}"`, tool_call_id: tc.id });
          continue;
        }

        sseWrite(res, 'tool_start', { name: tc.name, args: toolArgs });
        const result = await executeTool(tc.name, toolArgs, userId, apiKeyIds);
        console.log(`[AI] tool_result ${tc.name}: ${result.slice(0, 200)}${result.length > 200 ? '…' : ''}`);
        sseWrite(res, 'tool_end', { name: tc.name, result: result.slice(0, 500) });
        messages.push({ role: 'tool', content: result, tool_call_id: tc.id });
      }
    }
  } catch (err: any) {
    sseWrite(res, 'error', { message: err?.message || 'Stream error' });
  }

  // Save session to DB
  await saveSession(userId, messages);

  sseWrite(res, 'done', { text: fullText });
  res.end();
});

// GET /ai/context — list context docs
aiRouter.get('/context', async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const docs = await prisma.aiContext.findMany({
    where: { userId },
    select: { id: true, name: true, createdAt: true, content: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, docs: docs.map(d => ({ ...d, preview: d.content.slice(0, 120) })) });
});

// POST /ai/context — upload context doc
aiRouter.post('/context', async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { name, content } = req.body as { name?: string; content?: string };
  if (!name?.trim() || !content?.trim()) {
    return res.status(400).json({ error: 'name and content are required' });
  }
  const doc = await prisma.aiContext.create({
    data: { userId, name: name.trim(), content: content.trim() },
  });
  res.json({ success: true, doc: { id: doc.id, name: doc.name, createdAt: doc.createdAt } });
});

// DELETE /ai/context/:id — delete context doc
aiRouter.delete('/context/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { id } = req.params;
  await prisma.aiContext.deleteMany({ where: { id, userId } });
  res.json({ success: true });
});
