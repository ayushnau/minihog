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

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }
    await auth.updatePassword(userId, currentPassword, newPassword);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Current password') || msg.includes('at least 8')) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
