import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware
 * Catches all errors and returns user-friendly messages
 */
export function errorHandler(
  err: Error | any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  // Handle TypeError (e.g., undefined Prisma client, undefined properties)
  if (err instanceof TypeError) {
    // Check if it's a Prisma-related error
    if (err.message?.includes('groupBy') || err.message?.includes('count') || err.message?.includes('prisma')) {
      return res.status(500).json({
        success: false,
        error: 'Database service is not available. Please try again later.',
      });
    }
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again later.',
    });
  }

  // Prisma errors
  if (err.code === 'P2002') {
    const target = err.meta?.target || [];
    if (target.includes('username')) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists',
      });
    }
    if (target.includes('email')) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists',
      });
    }
    if (target.includes('key')) {
      return res.status(400).json({
        success: false,
        error: 'API key already exists. Please try again.',
      });
    }
    return res.status(400).json({
      success: false,
      error: 'A record with this information already exists',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found',
    });
  }

  // Validation errors (Zod)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: err.errors?.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Database connection errors
  if (err.code === 'P1000' || err.code === 'P1001') {
    return res.status(503).json({
      success: false,
      error: 'Database connection failed. Please try again later.',
    });
  }

  // Authentication errors
  if (err.code === 'P1010') {
    return res.status(403).json({
      success: false,
      error: 'Database access denied',
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An error occurred. Please try again later.'
    : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
}

