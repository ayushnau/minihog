import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { trackRouter } from './routes/track';
import { clickRouter } from './routes/click';
import { installRouter } from './routes/install';
import { analyticsRouter } from './routes/analytics';
import { dashboardAnalyticsRouter } from './routes/dashboardAnalytics';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

// Create Express app (shared for both local dev and Vercel)
const app = express();
const ATTRIBUTION_WINDOW_HOURS = parseInt(process.env.ATTRIBUTION_WINDOW_HOURS || '24', 10);

// Middleware
// CORS configuration - when credentials: true, origin cannot be '*'
// Set CORS_ORIGIN to your dashboard URL(s), comma-separated for multiple origins
const corsOrigin = process.env.CORS_ORIGIN;
const corsOptions = {
  credentials: true,
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (corsOrigin) {
      // Split by comma and check if origin matches any allowed origin
      const allowedOrigins = corsOrigin.split(',').map(o => o.trim());
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
    }
    
    // In development, allow localhost
    if (process.env.NODE_ENV !== 'production') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// Health check (no database dependency)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'configured' : 'not configured'
  });
});

// Routes
app.use('/track', trackRouter);
app.use('/click', clickRouter);
app.use('/install', installRouter);
app.use('/analytics', analyticsRouter);
app.use('/dashboard/analytics', dashboardAnalyticsRouter);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Only start server if running locally (not in Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`MiniHog API server running on port ${PORT}`);
    console.log(`Attribution window: ${ATTRIBUTION_WINDOW_HOURS} hours`);
  });
}

export { ATTRIBUTION_WINDOW_HOURS };
export default app;

