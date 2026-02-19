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

export async function PATCH(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { email } = body;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    const user = await auth.updateEmail(userId, email.trim());
    return NextResponse.json({
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('already in use') || msg.includes('Email')) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
