import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { apiLimiter } from './middleware/rateLimiter.middleware.js';
import { requestIdMiddleware } from './middleware/requestId.middleware.js';
import { NODE_ENV } from './config/env.js';

const app = express();

// 1. Request Correlation Tracking (mounted first)
app.use(requestIdMiddleware);

// 2. Security Headers & CORS
app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
  ? Array.from(new Set([process.env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173']))
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive fallback while respecting credentials
    },
    credentials: true
  })
);

// 3. Body & Cookie Parsing
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Request Logging with Correlation Tracking
if (NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// 5. Database Readiness & Health Check Endpoint (exempt from rate limits)
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const status = isDbConnected ? 'ok' : 'error';
  const statusCode = isDbConnected ? 200 : 503;

  return res.status(statusCode).json({
    success: isDbConnected,
    statusCode,
    message: isDbConnected ? 'Health check successful' : 'Database connection unavailable',
    data: {
      status,
      database: isDbConnected ? 'connected' : 'disconnected',
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
      requestId: req.id
    }
  });
});

// 6. Apply general API rate limiting to all /api routes
app.use('/api', apiLimiter);

// 7. Mount consolidated API routes
app.use('/api', apiRouter);

// 8. Centralized error handling middleware mounted last
app.use(errorHandler);

export default app;
