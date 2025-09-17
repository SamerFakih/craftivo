import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

/**
 * Attaches a unique request ID to each incoming request and response headers.
 * The header name is `x-request-id`.
 */
export function requestIdMiddleware(
  req: Request & { requestId?: string },
  res: Response,
  next: NextFunction,
) {
  const existing = (req.headers['x-request-id'] as string | undefined)?.trim();
  const requestId = existing && existing.length > 0 ? existing : uuidv4();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
