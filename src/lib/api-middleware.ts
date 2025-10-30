/**
 * API middleware utilities for Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { formatErrorResponse, TimeoutError } from './errors';
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
 * Wrap an API handler with middleware
 */
export function withMiddleware(
  handler: ApiHandler,
  options: MiddlewareOptions = {}
): ApiHandler {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const path = new URL(request.url).pathname;

    // Start performance timer
    const endTimer = performanceMonitor.startTimer(`api:${path}`);

    // Create child logger with request context
    const requestLogger = logger.child({
      requestId,
      path,
      method: request.method,
    });

    try {
      // Log incoming request
      if (options.logRequests !== false) {
        requestLogger.info('Incoming request', {
          userAgent: request.headers.get('user-agent'),
          ip: getClientIdentifier(request),
        });
      }

      // Apply rate limiting
      if (options.rateLimit) {
        const clientId = getClientIdentifier(request);
        rateLimiter.check(clientId, options.rateLimit);
      }

      // Apply timeout
      let response: NextResponse;
      if (options.timeout) {
        response = await withTimeout(
          handler(request),
          options.timeout,
          `Request timeout after ${options.timeout}ms`
        );
      } else {
        response = await handler(request);
      }

      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId);

      // Log response
      const duration = Date.now() - startTime;
      requestLogger.info('Request completed', {
        statusCode: response.status,
        duration,
      });

      // Record performance metric
      endTimer({
        statusCode: response.status,
        success: true,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      requestLogger.error('Request failed', error as Error, {
        duration,
      });

      // Record error metric
      endTimer({
        error: true,
        success: false,
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

      response.headers.set('X-Request-ID', requestId);

      return response;
    }
  };
}

/**
 * Apply timeout to a promise
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new TimeoutError(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle!);
    throw error;
  }
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
export function withCors(
  handler: ApiHandler,
  options: {
    origins?: string[];
    methods?: string[];
    headers?: string[];
  } = {}
): ApiHandler {
  const {
    origins = ['*'],
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization'],
  } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origins.join(', '),
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': headers.join(', '),
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Handle actual request
    const response = await handler(request);

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', origins.join(', '));
    response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', headers.join(', '));

    return response;
  };
}

/**
 * Compose multiple middleware functions
 */
export function compose(...middlewares: ((handler: ApiHandler) => ApiHandler)[]): (handler: ApiHandler) => ApiHandler {
  return (handler: ApiHandler) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}
