import type { VercelRequest, VercelResponse } from '@vercel/node';

// Lazy load the Express app to avoid blocking on import
let app: any = null;

async function getApp() {
  if (!app) {
    app = (await import('../src/index')).default;
  }
  return app;
}

// Vercel serverless function handler
// Reuses the Express app from src/index.ts to avoid duplication
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const expressApp = await getApp();
    
    // Convert Vercel request/response to Express format
    const expressReq = req as any;
    const expressRes = res as any;
    
    // Store original Vercel response methods to avoid recursion
    const originalStatus = res.status.bind(res);
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    
    // Set up Express response methods that Vercel expects
    expressRes.status = (code: number) => {
      originalStatus(code);
      return expressRes;
    };
    
    expressRes.json = (body: any) => {
      originalJson(body);
      return expressRes;
    };
    
    expressRes.send = (body: any) => {
      originalSend(body);
      return expressRes;
    };
    
    expressRes.set = (key: string, value: string) => {
      res.setHeader(key, value);
      return expressRes;
    };
    
    expressRes.cookie = (name: string, value: string, options?: any) => {
      // Vercel handles cookies via Set-Cookie header
      res.setHeader('Set-Cookie', `${name}=${value}; ${options?.httpOnly ? 'HttpOnly;' : ''} ${options?.secure ? 'Secure;' : ''} Path=/`);
      return expressRes;
    };
    
    // Handle the request with the shared Express app
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 25000); // 25 second timeout (before Vercel's 30s)
      
      expressApp(expressReq, expressRes, (err?: any) => {
        clearTimeout(timeout);
        if (err) {
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
  } catch (error: any) {
    console.error('Handler error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
