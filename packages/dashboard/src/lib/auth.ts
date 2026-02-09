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
    const maxAttempts = 20; // Increased retry attempts
    let apiKey;

    while (attempts < maxAttempts) {
      // Use cryptographically secure random bytes for better uniqueness
      let key: string;
      
      try {
        // Try to use crypto.randomBytes (Node.js) for cryptographically secure randomness
        const crypto = require('crypto');
        // Generate 32 random bytes (256 bits of entropy)
        const randomBytes = crypto.randomBytes(32);
        // Convert to base64url encoding (URL-safe, no padding)
        const base64url = randomBytes
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
        
        // Create key with prefix and ensure it's long enough (64 chars from base64)
        key = `mh_${base64url}`;
      } catch (e) {
        // Fallback for environments without crypto (shouldn't happen in Node.js)
        // Use timestamp + UUID-like string + multiple random sources
        const timestamp = Date.now();
        const random1 = Math.random().toString(36).substring(2, 15);
        const random2 = Math.random().toString(36).substring(2, 15);
        const random3 = Math.random().toString(36).substring(2, 15);
        const random4 = Math.random().toString(36).substring(2, 15);
        const random5 = Math.random().toString(36).substring(2, 15);
        const random6 = Math.random().toString(36).substring(2, 15);
        
        // Add high-resolution time for more uniqueness
        let highResTime: number;
        if (typeof process !== 'undefined' && process.hrtime) {
          const hrtime = process.hrtime.bigint();
          highResTime = Number(hrtime % BigInt(1000000000));
        } else {
          highResTime = Math.random() * 1000000000;
        }
        
        // Create a very long unique string
        const uniqueString = `${userId}_${timestamp}_${highResTime}_${random1}_${random2}_${random3}_${random4}_${random5}_${random6}_${attempts}_${Math.random()}`;
        
        // Encode and create key
        const encoded = Buffer.from(uniqueString).toString('base64url');
        key = `mh_${encoded.replace(/[^a-zA-Z0-9]/g, '').substring(0, 64)}`;
      }

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
        // Check for unique constraint error (Prisma error code P2002)
        const isUniqueConstraintError = 
          error.code === 'P2002' || 
          error.message?.toLowerCase().includes('unique') ||
          error.message?.toLowerCase().includes('duplicate') ||
          (error.meta?.target && error.meta.target.includes('key'));
        
        if (isUniqueConstraintError) {
          attempts++;
          console.warn(`API key collision detected (attempt ${attempts}/${maxAttempts}), retrying...`);
          
          if (attempts >= maxAttempts) {
            console.error(`Failed to generate unique API key after ${maxAttempts} attempts`);
            throw new Error('Failed to generate unique API key. Please try again.');
          }
          
          // Wait before retrying with exponential backoff
          const delay = 50 + (attempts * 20);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If it's a different error, log it and throw
        console.error('Unexpected error generating API key:', {
          code: error.code,
          message: error.message,
          meta: error.meta,
        });
        throw error;
      }
    }

    if (!apiKey) {
      throw new Error('Failed to generate API key after maximum attempts');
    }

    return {
      id: apiKey.id,
      key: apiKey.key,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
      lastUsed: apiKey.lastUsed,
    };
  },

  // Get API keys for user (only active keys, excluding soft-deleted ones)
  getUserApiKeys: async (userId: string): Promise<ApiKey[]> => {
    let keys: any[];

    try {
      keys = await (prisma as any).apiKey.findMany({
        where: { userId, deletedAt: null },
        select: { id: true, key: true, name: true, createdAt: true, lastUsed: true },
        orderBy: { createdAt: 'desc' as const },
      });
    } catch (e: any) {
      const isMissingColumn =
        e?.message?.includes('deleted_at') || e?.message?.includes('deletedAt');
      if (isMissingColumn) {
        // DB not migrated yet: fetch all (all considered active)
        keys = await (prisma as any).apiKey.findMany({
          where: { userId },
          select: { id: true, key: true, name: true, createdAt: true, lastUsed: true },
          orderBy: { createdAt: 'desc' as const },
        });
      } else {
        throw e;
      }
    }

    const activeKeys = keys;
    return activeKeys.map((k: any) => ({
      id: k.id,
      key: k.key.substring(0, 8) + '...' + k.key.substring(k.key.length - 4),
      name: k.name,
      createdAt: k.createdAt,
      lastUsed: k.lastUsed,
    }));
  },

  // Validate API key and update last used (only active keys)
  validateApiKey: async (key: string): Promise<{ userId: string } | null> => {
    const apiKey = await (prisma as any).apiKey.findFirst({
      where: { 
        key,
        deletedAt: null, // Only allow active (non-revoked) keys - migration applied
      },
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

  // Revoke API key (soft delete - sets deletedAt timestamp)
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

    // Soft delete: set deletedAt instead of actually deleting
    // Migration applied - deletedAt column exists now
    await (prisma as any).apiKey.update({
      where: { id: keyId },
      data: {
        deletedAt: new Date(),
      },
    });

    return true;
  },

  // Revoke all API keys for a user (soft delete)
  deleteAllApiKeys: async (userId: string): Promise<number> => {
    // Soft delete: set deletedAt for all active keys
    // Migration applied - deletedAt column exists now
    const result = await (prisma as any).apiKey.updateMany({
      where: { 
        userId,
        deletedAt: null, // Only update keys that aren't already deleted
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return result.count;
  },
};
