import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters from request
    const { searchParams } = new URL(request.url);
    const event = searchParams.get('event');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Get JWT token from cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Forward request to backend API with JWT token
    const url = new URL(`${API_URL}/dashboard/analytics/events`);
    if (event) url.searchParams.set('event', event);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Analytics proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

