/**
 * API middleware utilities for wrapping route handlers
 * Provides consistent error handling, logging, and timeout management
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { formatErrorResponse, TimeoutError } from './errors';

export type ApiHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>;

export interface ApiMiddlewareOptions {
  timeout?: number; // Timeout in milliseconds
  logRequests?: boolean; // Whether to log requests
  logResponses?: boolean; // Whether to log responses
}

/**
 * Wraps an API route handler with error handling, logging, and timeout
 */
export function withApiMiddleware(
  handler: ApiHandler,
  options: ApiMiddlewareOptions = {}
): ApiHandler {
  const {
    timeout = 30000, // 30 seconds default
    logRequests = true,
    logResponses = false,
  } = options;

  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    const startTime = Date.now();
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
    const method = request.method;
    const path = request.nextUrl.pathname;

    // Log incoming request
    if (logRequests) {
      logger.info(`API Request: ${method} ${path}`, {
        requestId,
        method,
        path,
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
    }

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new TimeoutError(`Request timeout after ${timeout}ms`));
        }, timeout);
      });

      // Race between handler and timeout
      const response = await Promise.race([
        handler(request, context),
        timeoutPromise,
      ]);

      const duration = Date.now() - startTime;

      // Log response
      if (logResponses) {
        logger.info(`API Response: ${method} ${path}`, {
          requestId,
          method,
          path,
          status: response.status,
          duration: `${duration}ms`,
        });
      }

      // Add timing and request ID headers
      response.headers.set('x-request-id', requestId);
      response.headers.set('x-response-time', `${duration}ms`);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      logger.error(`API Error: ${method} ${path}`, error as Error, {
        requestId,
        method,
        path,
        duration: `${duration}ms`,
      });

      // Format error response
      const errorResponse = formatErrorResponse(
        error as Error,
        path,
        process.env.NODE_ENV === 'development'
      );

      // Create response with error
      const response = NextResponse.json(errorResponse, {
        status: errorResponse.error.statusCode,
      });

      // Add headers
      response.headers.set('x-request-id', requestId);
      response.headers.set('x-response-time', `${duration}ms`);

      return response;
    }
  };
}

/**
 * Wraps multiple middleware functions
 */
export function composeMiddleware(...middlewares: ApiHandler[]): ApiHandler {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    let response: NextResponse | null = null;

    for (const middleware of middlewares) {
      response = await middleware(request, context);
      
      // If middleware returns a response with error status, stop processing
      if (response.status >= 400) {
        return response;
      }
    }

    return response || NextResponse.next();
  };
}

/**
 * Async handler wrapper with proper error handling
 */
export function asyncHandler(
  fn: (request: NextRequest, context?: { params: Record<string, string> }) => Promise<NextResponse>
): ApiHandler {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      return await fn(request, context);
    } catch (error) {
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
 * Catches async errors and passes them to error handler
 */
export function catchAsync<T>(
  fn: () => Promise<T>
): Promise<T> {
  return fn().catch((error) => {
    logger.error('Async operation failed', error);
    throw error;
  });
}
