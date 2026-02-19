import { NextResponse } from 'next/server';

/**
 * Lightweight health check. Use this URL for keep-warm pings (cron every 1 min)
 * so serverless stays warm; one ping is enough per project, no need to hit every API.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
