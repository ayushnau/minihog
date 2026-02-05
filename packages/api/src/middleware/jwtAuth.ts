import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { prisma } from '../db/client';

/**
 * JWT secret - should match dashboard JWT_SECRET
 */
const JWT_SECRET = process.env.JWT_SECRET || 'minihog-secret-key-change-in-production';
const secret = new TextEncoder().encode(JWT_SECRET);

/**
 * Middleware to validate JWT token from dashboard
 * Expects token in Authorization header: Bearer <token>
 * Or in cookie: auth-token
 */
export async function validateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let token: string | undefined;

    // Try Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Try cookie if no header
    if (!token && req.cookies && req.cookies['auth-token']) {
      token = req.cookies['auth-token'];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid JWT token.',
      });
    }

    // Verify JWT token using jose
    try {
      const { payload } = await jwtVerify(token, secret);

      const userId = payload.userId as string;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token payload',
        });
      }

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
        });
      }

      // Get user's API keys
      const apiKeys = await prisma.apiKey.findMany({
        where: { userId },
        select: { id: true },
      });

      // Attach user info to request
      (req as any).userId = userId;
      (req as any).user = user;
      (req as any).apiKeyIds = apiKeys.map(k => k.id);

      next();
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  } catch (error) {
    next(error);
  }
}

