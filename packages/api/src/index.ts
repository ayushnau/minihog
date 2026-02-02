import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { trackRouter } from './routes/track';
import { clickRouter } from './routes/click';
import { installRouter } from './routes/install';
import { analyticsRouter } from './routes/analytics';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

// Create Express app (shared for both local dev and Vercel)
const app = express();
const ATTRIBUTION_WINDOW_HOURS = parseInt(process.env.ATTRIBUTION_WINDOW_HOURS || '24', 10);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
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

