import { NextRequest, NextResponse } from 'next/server';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    const url = new URL(`${API_URL}/dashboard/analytics/funnel`);
    // Pass all params through (steps is now JSON)
    searchParams.forEach((v, k) => url.searchParams.set(k, v));
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch funnel data' }, { status: 500 });
  }
}
