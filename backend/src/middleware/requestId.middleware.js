import crypto from 'crypto';

/**
 * Request Correlation ID Middleware
 * Assigns or propagates a unique correlation ID for every incoming HTTP request.
 * Sets the 'X-Request-Id' response header and attaches req.id for logger & error tracing.
 */
export const requestIdMiddleware = (req, res, next) => {
  const incomingId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
  const requestId = (typeof incomingId === 'string' && incomingId.trim())
    ? incomingId.trim().slice(0, 64)
    : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

export default requestIdMiddleware;
