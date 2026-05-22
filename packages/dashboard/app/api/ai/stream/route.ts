import { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const dynamic = 'force-dynamic';

const AI_HEADERS = ['x-ai-provider', 'x-ai-gemini-key', 'x-ai-gemini-model', 'x-ai-ollama-url', 'x-ai-ollama-model'];

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.text();

  const forwardHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  for (const h of AI_HEADERS) {
    const v = request.headers.get(h);
    if (v) forwardHeaders[h] = v;
  }

  const apiRes = await fetch(`${API_URL}/ai/chat/stream`, {
    method: 'POST',
    headers: forwardHeaders,
    body,
  });

  return new Response(apiRes.body, {
    status: apiRes.status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
