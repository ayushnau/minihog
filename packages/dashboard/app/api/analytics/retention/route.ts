import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cohort = searchParams.get('cohort');
    const day = searchParams.get('day');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const url = new URL(`${API_URL}/dashboard/analytics/retention`);
    if (cohort) url.searchParams.set('cohort', cohort);
    if (day) url.searchParams.set('day', day);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error('Retention proxy error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch retention data' }, { status: 500 });
  }
}
