import winston from "winston";
import { NODE_ENV } from "./env.js";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'accessToken',
  'refreshToken',
  'token',
  'authorization',
  'cookie',
  'secret'
]);

/**
 * Custom Winston format to redact passwords, JWTs, and sensitive credentials
 */
const sanitizeFormat = winston.format((info) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);

    const copy = { ...obj };
    for (const key of Object.keys(copy)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase()) || key.toLowerCase().includes('password') || key.toLowerCase().includes('secret')) {
        copy[key] = '[REDACTED]';
      } else if (typeof copy[key] === 'object') {
        copy[key] = sanitize(copy[key]);
      }
    }
    return copy;
  };

  return sanitize(info);
});

const logFormat = printf(({ level, message, timestamp, stack, requestId }) => {
  const reqPrefix = requestId ? `[${requestId}] ` : '';
  return `${timestamp} [${level}]: ${reqPrefix}${stack || message}`;
});

export const logger = winston.createLogger({
  level: NODE_ENV === "development" ? "debug" : "info",
  format: combine(
    sanitizeFormat(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        sanitizeFormat(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }),
        logFormat
      )
    }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" })
  ]
});

export default logger;
