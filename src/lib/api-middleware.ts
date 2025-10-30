/**
 * API middleware utilities for Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { formatErrorResponse, TimeoutError, AppError } from './errors';
import { rateLimiter, getClientIdentifier, RateLimitPresets } from './rate-limiter';
import { performanceMonitor } from './monitoring';

type ApiHandler = (request: NextRequest) => Promise<NextResponse>;

interface MiddlewareOptions {
  timeout?: number;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  requireAuth?: boolean;
  logRequests?: boolean;
}

/**
 * Wrap an API handler with timeout protection
 */
export function withTimeout(handler: ApiHandler, timeoutMs: number): ApiHandler {
  return async (request: NextRequest): Promise<NextResponse> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([handler(request), timeoutPromise]);
    } catch (error) {
      if (error instanceof TimeoutError) {
        logger.warn('Request timeout', {
          path: request.nextUrl.pathname,
          timeout: timeoutMs,
        });
      }
      throw error;
    }
  };
}

/**
 * Wrap an API handler with rate limiting
 */
export function withRateLimit(
  handler: ApiHandler,
  config: { windowMs: number; maxRequests: number }
): ApiHandler {
  return async (request: NextRequest): Promise<NextResponse> => {
    const identifier = getClientIdentifier(request);

    try {
      rateLimiter.check(identifier, config);
      return await handler(request);
    } catch (error) {
      if (error instanceof AppError && error.code === 'RATE_LIMIT_EXCEEDED') {
        const status = rateLimiter.getStatus(identifier, config);
        const response = NextResponse.json(
          formatErrorResponse(error, request.nextUrl.pathname),
          { status: 429 }
        );

        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', status.remaining.toString());
        response.headers.set(
          'X-RateLimit-Reset',
          new Date(status.resetTime).toISOString()
        );

        return response;
      }
      throw error;
    }
  };
}

/**
 * Wrap an API handler with error handling
 */
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      logger.error('API error', error as Error, {
        path: request.nextUrl.pathname,
        method: request.method,
      });

      const errorResponse = formatErrorResponse(
        error as Error,
        request.nextUrl.pathname,
        process.env.NODE_ENV === 'development'
      );

      return NextResponse.json(errorResponse, {
        status: errorResponse.error.statusCode,
      });
    }
  };
}

/**
 * Wrap an API handler with request logging
 */
export function withLogging(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const path = request.nextUrl.pathname;
    const method = request.method;

    logger.info('API request started', {
      method,
      path,
      userAgent: request.headers.get('user-agent'),
    });

    try {
      const response = await handler(request);
      const duration = Date.now() - startTime;

      logger.info('API request completed', {
        method,
        path,
        status: response.status,
        duration,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('API request failed', error as Error, {
        method,
        path,
        duration,
      });

      throw error;
    }
  };
}

/**
 * Wrap an API handler with performance monitoring
 */
export function withPerformanceMonitoring(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest): Promise<NextResponse> => {
    const operationName = `API:${request.method}:${request.nextUrl.pathname}`;
    const endTimer = performanceMonitor.startTimer(operationName);

    try {
      const response = await handler(request);
      endTimer({ status: response.status, success: true });
      return response;
    } catch (error) {
      endTimer({ success: false, error: (error as Error).message });
      throw error;
    }
  };
}

/**
 * Compose multiple middleware functions
 */
export function composeMiddleware(...middlewares: Array<(handler: ApiHandler) => ApiHandler>) {
  return (handler: ApiHandler): ApiHandler => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

/**
 * Create a protected API handler with common middleware
 */
export function createApiHandler(
  handler: ApiHandler,
  options: MiddlewareOptions = {}
): ApiHandler {
  const middlewares: Array<(handler: ApiHandler) => ApiHandler> = [];

  // Always add error handling first (outermost)
  middlewares.push(withErrorHandling);

  // Add logging if enabled (default: true)
  if (options.logRequests !== false) {
    middlewares.push(withLogging);
  }

  // Add performance monitoring
  middlewares.push(withPerformanceMonitoring);

  // Add rate limiting if configured
  if (options.rateLimit) {
    middlewares.push((h) => withRateLimit(h, options.rateLimit!));
  }

  // Add timeout if configured
  if (options.timeout) {
    middlewares.push((h) => withTimeout(h, options.timeout!));
  }

  return composeMiddleware(...middlewares)(handler);
}

/**
 * Preset configurations for common API patterns
 */
export const ApiHandlerPresets = {
  // Standard API endpoint
  standard: (handler: ApiHandler) =>
    createApiHandler(handler, {
      timeout: 30000,
      rateLimit: RateLimitPresets.STANDARD,
      logRequests: true,
    }),

  // Heavy processing endpoint
  heavy: (handler: ApiHandler) =>
    createApiHandler(handler, {
      timeout: 60000,
      rateLimit: RateLimitPresets.HEAVY,
      logRequests: true,
    }),

  // Public endpoint with lenient rate limiting
  public: (handler: ApiHandler) =>
    createApiHandler(handler, {
      timeout: 30000,
      rateLimit: RateLimitPresets.LENIENT,
      logRequests: true,
    }),

  // Strict endpoint for sensitive operations
  strict: (handler: ApiHandler) =>
    createApiHandler(handler, {
      timeout: 15000,
      rateLimit: RateLimitPresets.STRICT,
      logRequests: true,
    }),
} as const;
