import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'minihog-secret-key-change-in-production'
);

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }
    const user = await auth.login(username, password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const token = await new SignJWT({ userId: user.id, username: user.username, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, email: user.email },
    });
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
