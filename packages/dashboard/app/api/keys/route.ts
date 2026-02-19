import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { auth } from '@/lib/auth';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'minihog-secret-key-change-in-production'
);

async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { error: 'Database not configured. Set DATABASE_URL in your deployment environment.' },
      { status: 500 }
    );
  }
  try {
    const keys = await auth.getUserApiKeys(userId);
    return NextResponse.json({ keys });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Get API keys error:', msg);
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      { error: 'Failed to fetch API keys', ...(isDev && msg ? { detail: msg } : {}) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name } = await request.json();
    if (!name || (name as string).trim().length === 0) {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 });
    }
    const apiKey = await auth.generateApiKey(userId, (name as string).trim());
    return NextResponse.json({
      success: true,
      key: apiKey.key,
      apiKey: { id: apiKey.id, name: apiKey.name, createdAt: apiKey.createdAt },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('unique') || msg.includes('already exists')) {
      return NextResponse.json({ error: 'Failed to generate unique API key. Please try again.' }, { status: 400 });
    }
    console.error('Generate API key error:', error);
    return NextResponse.json({ error: 'Failed to generate API key. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');
    const revokeAll = searchParams.get('all') === 'true';
    if (revokeAll) {
      const count = await auth.deleteAllApiKeys(userId);
      return NextResponse.json({ success: true, message: `Revoked ${count} API key(s)` });
    }
    if (!keyId) return NextResponse.json({ error: 'API key ID is required' }, { status: 400 });
    const revoked = await auth.deleteApiKey(userId, keyId);
    if (!revoked) return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'API key revoked successfully' });
  } catch (error: unknown) {
    console.error('Revoke API key error:', error);
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
  }
}
