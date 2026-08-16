import rateLimit from "express-rate-limit";
import { NODE_ENV } from "../config/env.js";

const isProduction = NODE_ENV === "production";

/**
 * Standard error response formatter for rate limiters
 */
const rateLimitHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    statusCode: 429,
    message: message || "Too many requests. Please try again later.",
    errors: []
  });
};

/**
 * General API rate limiter
 * Production: 500 requests per 15 minutes per IP
 * Development: 5000 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 500 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler("Too many requests from this IP. Please try again in 15 minutes.")
});

/**
 * Strict rate limiter for login endpoint
 * Production: 10 attempts per 15 minutes per IP
 * Development: 200 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: rateLimitHandler("Too many login attempts. Account temporarily throttled. Please try again in 15 minutes.")
});

/**
 * Rate limiter for registration endpoint
 * Production: 5 attempts per hour per IP
 * Development: 100 attempts per hour per IP
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 5 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler("Too many registration attempts from this IP. Please try again in an hour.")
});

/**
 * Rate limiter for token refresh endpoint
 * Production: 60 refreshes per 15 minutes per IP
 * Development: 1000 refreshes per 15 minutes per IP
 */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 60 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler("Too many token refresh requests. Please wait before retrying.")
});

/**
 * Rate limiter for AI health diagnosis (Ollama)
 * Production: 15 requests per 5 minutes per IP
 * Development: 200 requests per 5 minutes per IP
 */
export const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isProduction ? 15 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler("AI analysis rate limit exceeded. Please wait a few minutes before analyzing more assets.")
});

export default {
  apiLimiter,
  authLimiter,
  registerLimiter,
  refreshLimiter,
  aiLimiter
};
