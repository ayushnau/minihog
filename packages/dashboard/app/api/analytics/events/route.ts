import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/** Mark route as dynamic so Next.js does not try to statically analyze request.url/cookies at build time */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const event = searchParams.get('event');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const includeTimeSeries = searchParams.get('include_time_series');
    const includeProperties = searchParams.get('include_properties');
    const includeJourneys = searchParams.get('include_journeys');
    const propertyKey = searchParams.get('property_key');
    const granularity = searchParams.get('granularity');
    const filterKey = searchParams.get('filter_key');
    const filterValue = searchParams.get('filter_value');

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const url = new URL(`${API_URL}/dashboard/analytics/events`);
    if (event) url.searchParams.set('event', event);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    if (includeTimeSeries) url.searchParams.set('include_time_series', includeTimeSeries);
    if (includeProperties) url.searchParams.set('include_properties', includeProperties);
    if (includeJourneys) url.searchParams.set('include_journeys', includeJourneys);
    if (propertyKey) url.searchParams.set('property_key', propertyKey);
    if (granularity) url.searchParams.set('granularity', granularity);
    if (filterKey) url.searchParams.set('filter_key', filterKey);
    if (filterValue) url.searchParams.set('filter_value', filterValue);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error('Analytics proxy error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}
