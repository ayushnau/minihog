import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/** Mark route as dynamic so Next.js does not try to statically analyze request.url/cookies at build time */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const steps = searchParams.get('steps');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const url = new URL(`${API_URL}/dashboard/analytics/funnel`);
    if (steps) url.searchParams.set('steps', steps);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error('Funnel proxy error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch funnel data' }, { status: 500 });
  }
}
