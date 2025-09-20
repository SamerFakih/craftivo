import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Advanced Logging Interceptor
 *
 * This interceptor implements comprehensive request/response logging with:
 * - Performance monitoring (response time tracking)
 * - Security-aware logging (sensitive data redaction)
 * - Environment-specific logging levels
 * - User context tracking for audit trails
 *
 * Used globally across all API endpoints to provide observability
 * and debugging capabilities without compromising security.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  /**
   * Intercepts HTTP requests and responses to provide comprehensive logging
   *
   * @param context ExecutionContext - NestJS execution context containing request/response
   * @param next CallHandler - Next handler in the chain
   * @returns Observable with logging side effects
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Extract HTTP context and request details
    const request = context.switchToHttp().getRequest<
      Request & {
        requestId?: string;
        user?: { user_id?: number };
        body?: Record<string, unknown>;
        query?: Record<string, unknown>;
        params?: Record<string, unknown>;
      }
    >();
    const response = context.switchToHttp().getResponse<Response>();
    const method = request.method;
    const url = request.url;
    const body: Record<string, unknown> = isPlainRecord(request.body)
      ? request.body
      : {};
    const query = request.query || {};
    const params = request.params || {};
    const requestId = request.requestId;
    const userAgent = request.get('User-Agent') || '';
    const ip = request.ip;

    // Extract authenticated user context for audit logging
    // Note: user object is attached by JWT strategy during authentication
    const user = request.user;
    const userId =
      typeof user?.user_id === 'number' ? user.user_id : 'anonymous';

    // Start performance timer for response time calculation
    const now = Date.now();

    // Log incoming request with user context for security audit
    this.logger.log(
      `📝 ${method} ${url} [${requestId}] - User: ${userId} - IP: ${ip} - UserAgent: ${userAgent.substring(0, 50)}...`,
    );

    // Enhanced logging for development environment only
    // Prevents sensitive data exposure in production logs
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`📊 Query: ${JSON.stringify(query)}`);
      this.logger.debug(`🎯 Params: ${JSON.stringify(params)}`);
      if (body && typeof body === 'object' && !Array.isArray(body)) {
        const sanitizedBody: Record<string, unknown> = { ...body };
        ['password', 'password_hash', 'token', 'secret'].forEach((field) => {
          if (field in sanitizedBody) {
            sanitizedBody[field] = '[REDACTED]';
          }
        });
        this.logger.debug(`📦 Body: ${JSON.stringify(sanitizedBody)}`);
      }
    }

    // RxJS pipe chain for handling request/response lifecycle
    return next.handle().pipe(
      // Handle successful responses
      tap((responseBody) => {
        // Calculate total request processing time
        const responseTime = Date.now() - now;
        const statusCode = response.statusCode;

        // Visual status code indicators for quick log scanning
        // Green checkmark (✅) for success, warning (⚠️) for redirects, red X (❌) for errors
        const statusEmoji =
          statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';

        // Log successful response with performance metrics
        this.logger.log(
          `${statusEmoji} ${method} ${url} [${requestId}] - ${statusCode} - ${responseTime}ms - User: ${userId}`,
        );

        // Response body logging in development (truncated for readability)
        if (process.env.NODE_ENV === 'development' && responseBody) {
          const responsePreview = JSON.stringify(responseBody).substring(
            0,
            200,
          );
          this.logger.debug(
            `📤 Response: ${responsePreview}${responsePreview.length >= 200 ? '...' : ''}`,
          );
        }
      }),
      // Handle errors with comprehensive logging
      catchError((error: unknown) => {
        const responseTime = Date.now() - now;
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `💥 ${method} ${url} [${requestId}] - ERROR - ${responseTime}ms - User: ${userId} - ${message}`,
        );

        // Detailed error logging for development debugging
        // Stack traces help identify exact error locations
        if (process.env.NODE_ENV === 'development' && error instanceof Error) {
          this.logger.error(`🔍 Error Details: ${error.stack}`);
        }

        // Re-throw error to maintain normal error handling flow
        throw error;
      }),
    );
  }
}
