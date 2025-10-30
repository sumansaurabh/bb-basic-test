/**
 * API middleware utilities for Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { formatErrorResponse, TimeoutError } from './errors';
import { rateLimiter, getClientIdentifier, RateLimitPresets } from './rate-limiter';
import { performanceMonitor } from './monitoring';

/**
 * Middleware configuration
 */
export interface MiddlewareConfig {
  timeout?: number;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  requireAuth?: boolean;
  logRequests?: boolean;
}

/**
 * API handler type
 * Compatible with Next.js App Router route handlers
 */
export type ApiHandler<T = unknown> = (
  request: NextRequest,
  context: { params: Promise<T> }
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap an API handler with middleware
 */
export function withMiddleware<T = unknown>(
  handler: ApiHandler<T>,
  config: MiddlewareConfig = {}
): ApiHandler<T> {
  return async (request: NextRequest, context: { params: Promise<T> }): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const path = new URL(request.url).pathname;

    // Create child logger with request context
    const requestLogger = logger.child({
      requestId,
      path,
      method: request.method,
    });

    try {
      // Log incoming request
      if (config.logRequests !== false) {
        requestLogger.info('Incoming request', {
          userAgent: request.headers.get('user-agent'),
          ip: getClientIdentifier(request),
        });
      }

      // Apply rate limiting
      if (config.rateLimit) {
        const clientId = getClientIdentifier(request);
        rateLimiter.check(clientId, config.rateLimit);
      }

      // Apply timeout
      let response: NextResponse;
      if (config.timeout) {
        response = await withTimeout(
          async () => await handler(request, context),
          config.timeout,
          `Request timeout after ${config.timeout}ms`
        );
      } else {
        response = await handler(request, context);
      }

      // Log response
      const duration = Date.now() - startTime;
      requestLogger.info('Request completed', {
        status: response.status,
        duration,
      });

      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Response-Time', `${duration}ms`);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      requestLogger.error('Request failed', error as Error, {
        duration,
      });

      // Format error response
      const errorResponse = formatErrorResponse(
        error as Error,
        path,
        process.env.NODE_ENV === 'development'
      );

      const response = NextResponse.json(
        errorResponse,
        { status: errorResponse.error.statusCode }
      );

      // Add request ID to error response
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Response-Time', `${duration}ms`);

      return response;
    }
  };
}

/**
 * Execute a function with a timeout
 */
async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new TimeoutError(message)), timeoutMs)
    ),
  ]);
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Middleware presets for common use cases
 */
export const MiddlewarePresets = {
  // Standard API endpoint
  standard: {
    timeout: 30000,
    rateLimit: RateLimitPresets.STANDARD,
    logRequests: true,
  },
  // Heavy processing endpoint
  heavy: {
    timeout: 60000,
    rateLimit: RateLimitPresets.HEAVY,
    logRequests: true,
  },
  // Public endpoint with lenient rate limiting
  public: {
    timeout: 30000,
    rateLimit: RateLimitPresets.LENIENT,
    logRequests: true,
  },
  // Strict endpoint for sensitive operations
  strict: {
    timeout: 10000,
    rateLimit: RateLimitPresets.STRICT,
    logRequests: true,
  },
} as const;

/**
 * CORS middleware
 */
export function withCors<T = unknown>(
  handler: ApiHandler<T>,
  options: {
    origins?: string[];
    methods?: string[];
    headers?: string[];
  } = {}
): ApiHandler<T> {
  const {
    origins = ['*'],
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization'],
  } = options;

  return async (request: NextRequest, context: { params: Promise<T> }): Promise<NextResponse> => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origins.join(', '),
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': headers.join(', '),
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Execute handler
    const response = await handler(request, context);

    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', origins.join(', '));
    response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', headers.join(', '));

    return response;
  };
}

/**
 * Combine multiple middleware functions
 */
export function compose<T = unknown>(
  ...middlewares: ((handler: ApiHandler<T>) => ApiHandler<T>)[]
): (handler: ApiHandler<T>) => ApiHandler<T> {
  return (handler: ApiHandler<T>) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

/**
 * Performance monitoring middleware
 */
export function withPerformanceMonitoring<T = unknown>(handler: ApiHandler<T>): ApiHandler<T> {
  return async (request: NextRequest, context: { params: Promise<T> }): Promise<NextResponse> => {
    const path = new URL(request.url).pathname;
    const method = request.method;
    const operationName = `${method} ${path}`;

    return performanceMonitor.measure(
      operationName,
      async () => await handler(request, context),
      { method, path }
    );
  };
}
