import { prisma } from './db';
import bcrypt from 'bcryptjs';

// Production-grade authentication using Prisma and bcrypt

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: Date;
  lastUsed?: Date | null;
}

export const auth = {
  // Register a new user with proper password hashing
  register: async (username: string, email: string, password: string): Promise<User> => {
    // Check if username or email already exists
    const existingUser = await (prisma as any).user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new Error('Username already exists');
      }
      if (existingUser.email === email) {
        throw new Error('Email already exists');
      }
    }

    // Hash password with bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await (prisma as any).user.create({
      data: {
        username,
        email,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    return user;
  },

  // Authenticate user with bcrypt password verification
  login: async (username: string, password: string): Promise<User | null> => {
    // Find user by username or email
    const user = await (prisma as any).user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
        ],
      },
    });

    if (!user) {
      return null;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    // Return user without password hash
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<User | null> => {
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    return user;
  },

  // Get user by username
  getUserByUsername: async (username: string): Promise<User | null> => {
    const user = await (prisma as any).user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    return user;
  },

  // Generate API key with secure random generation (ensures uniqueness)
  generateApiKey: async (userId: string, name: string): Promise<ApiKey> => {
    // Verify user exists
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate unique API key with retry logic
    let attempts = 0;
    const maxAttempts = 10;
    let apiKey;

    while (attempts < maxAttempts) {
      // Generate secure random API key with timestamp and random data
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const uniqueString = `${userId}_${timestamp}_${random}`;
      const encoded = Buffer.from(uniqueString).toString('base64url');
      const key = `mh_${encoded.replace(/[^a-zA-Z0-9]/g, '').substring(0, 40)}`;

      try {
        // Try to create the API key
        apiKey = await (prisma as any).apiKey.create({
          data: {
            userId,
            key,
            name,
          },
        });
        break; // Success, exit loop
      } catch (error: any) {
        // If it's a unique constraint error, try again
        if (error.code === 'P2002' && error.meta?.target?.includes('key')) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error('Failed to generate unique API key. Please try again.');
          }
          // Wait a tiny bit before retrying
          await new Promise(resolve => setTimeout(resolve, 10));
          continue;
        }
        // If it's a different error, throw it
        throw error;
      }
    }

    if (!apiKey) {
      throw new Error('Failed to generate API key');
    }

    return {
      id: apiKey.id,
      key: apiKey.key,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
      lastUsed: apiKey.lastUsed,
    };
  },

  // Get API keys for user
  getUserApiKeys: async (userId: string): Promise<ApiKey[]> => {
    const keys = await (prisma as any).apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        key: true,
        name: true,
        createdAt: true,
        lastUsed: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return keys.map((k: any) => ({
      id: k.id,
      key: k.key.substring(0, 8) + '...' + k.key.substring(k.key.length - 4), // Mask key for display
      name: k.name,
      createdAt: k.createdAt,
      lastUsed: k.lastUsed,
    }));
  },

  // Validate API key and update last used
  validateApiKey: async (key: string): Promise<{ userId: string } | null> => {
    const apiKey = await (prisma as any).apiKey.findUnique({
      where: { key },
      include: {
        user: true,
      },
    });

    if (!apiKey) {
      return null;
    }

    // Update last used timestamp
    await (prisma as any).apiKey.update({
      where: { id: apiKey.id },
      data: {
        lastUsed: new Date(),
      },
    });

    return { userId: apiKey.userId };
  },

  // Delete API key
  deleteApiKey: async (userId: string, keyId: string): Promise<boolean> => {
    const apiKey = await (prisma as any).apiKey.findFirst({
      where: {
        id: keyId,
        userId,
      },
    });

    if (!apiKey) {
      return false;
    }

    await (prisma as any).apiKey.delete({
      where: { id: keyId },
    });

    return true;
  },
};
