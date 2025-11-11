/**
 * Middleware utilities for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { rateLimiter } from './rate-limiter';
import { handleApiError } from './error-handler';

export interface ApiContext {
  requestId: string;
  startTime: number;
  method: string;
  path: string;
}

/**
 * Generates a unique request ID
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Creates API context for request tracking
 */
export function createApiContext(request: NextRequest): ApiContext {
  return {
    requestId: generateRequestId(),
    startTime: Date.now(),
    method: request.method,
    path: request.nextUrl.pathname,
  };
}

/**
 * Logs API request
 */
export function logApiRequest(context: ApiContext, request: NextRequest): void {
  logger.logRequest(context.method, context.path, {
    requestId: context.requestId,
    userAgent: request.headers.get('user-agent') || 'unknown',
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
  });
}

/**
 * Logs API response
 */
export function logApiResponse(
  context: ApiContext,
  response: NextResponse,
  additionalContext?: Record<string, unknown>
): void {
  const duration = Date.now() - context.startTime;
  logger.logResponse(context.method, context.path, response.status, duration, {
    requestId: context.requestId,
    ...additionalContext,
  });
}

/**
 * Applies rate limiting to a request
 */
export function applyRateLimit(
  request: NextRequest,
  options: {
    maxRequests: number;
    windowMs: number;
  }
): NextResponse | null {
  const rateLimit = rateLimiter.check(request, options);

  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT',
          retryAfter,
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': options.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Adds standard headers to API responses
 */
export function addStandardHeaders(response: NextResponse, context: ApiContext): NextResponse {
  response.headers.set('X-Request-Id', context.requestId);
  response.headers.set('X-Response-Time', `${Date.now() - context.startTime}ms`);
  return response;
}

/**
 * Wraps an API handler with standard middleware (logging, error handling, etc.)
 */
export async function withApiMiddleware<T>(
  request: NextRequest,
  handler: (context: ApiContext) => Promise<NextResponse<T>>,
  options?: {
    rateLimit?: {
      maxRequests: number;
      windowMs: number;
    };
  }
): Promise<NextResponse<T>> {
  const context = createApiContext(request);

  try {
    // Log incoming request
    logApiRequest(context, request);

    // Apply rate limiting if configured
    if (options?.rateLimit) {
      const rateLimitResponse = applyRateLimit(request, options.rateLimit);
      if (rateLimitResponse) {
        logApiResponse(context, rateLimitResponse, { rateLimited: true });
        return rateLimitResponse as NextResponse<T>;
      }
    }

    // Execute handler
    const response = await handler(context);

    // Add standard headers
    addStandardHeaders(response, context);

    // Log response
    logApiResponse(context, response);

    return response;
  } catch (error) {
    // Handle errors
    const errorResponse = handleApiError(error, {
      method: context.method,
      path: context.path,
      requestId: context.requestId,
    });

    addStandardHeaders(errorResponse, context);
    logApiResponse(context, errorResponse, { error: true });

    return errorResponse as NextResponse<T>;
  }
}
