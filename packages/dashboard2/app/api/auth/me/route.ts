import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { auth } from '@/lib/auth';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'minihog-secret-key-change-in-production'
);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ user: null });
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const user = await auth.getUserById(userId);
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
