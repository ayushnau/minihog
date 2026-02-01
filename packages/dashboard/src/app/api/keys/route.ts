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

// GET - List API keys
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const keys = await auth.getUserApiKeys(userId);
    return NextResponse.json({ keys });
  } catch (error: any) {
    console.error('Get API keys error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST - Generate new API key
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    const apiKey = await auth.generateApiKey(userId, name.trim());
    
    return NextResponse.json({
      success: true,
      key: apiKey.key, // Only return key once - user must copy it
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error: any) {
    // Handle Prisma unique constraint errors
    if (error.message?.includes('unique') || error.message?.includes('already exists')) {
      return NextResponse.json(
        { error: 'Failed to generate unique API key. Please try again.' },
        { status: 400 }
      );
    }
    
    console.error('Generate API key error:', error);
    return NextResponse.json(
      { error: 'Failed to generate API key. Please try again.' },
      { status: 500 }
    );
  }
}

// DELETE - Delete API key
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');
    
    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }

    const deleted = await auth.deleteApiKey(userId, keyId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

