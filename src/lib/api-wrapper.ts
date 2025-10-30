/**
 * API route wrapper with error handling, logging, and timeout protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { formatErrorResponse, TimeoutError, isOperationalError } from './errors';

type ApiHandler = (request: NextRequest) => Promise<NextResponse>;

interface WrapperOptions {
  timeout?: number;
  logRequest?: boolean;
  logResponse?: boolean;
}

/**
 * Wraps an API route handler with common functionality
 */
export function withApiWrapper(
  handler: ApiHandler,
  options: WrapperOptions = {}
): ApiHandler {
  const {
    timeout = 30000, // 30 seconds default
    logRequest = true,
    logResponse = true,
  } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const path = new URL(request.url).pathname;

    try {
      // Log incoming request
      if (logRequest) {
        logger.info('API request received', {
          requestId,
          method: request.method,
          path,
          userAgent: request.headers.get('user-agent'),
        });
      }

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new TimeoutError(`Request timeout after ${timeout}ms`));
        }, timeout);
      });

      // Race between handler and timeout
      const response = await Promise.race([
        handler(request),
        timeoutPromise,
      ]);

      const duration = Date.now() - startTime;

      // Log response
      if (logResponse) {
        logger.info('API request completed', {
          requestId,
          method: request.method,
          path,
          status: response.status,
          duration,
        });
      }

      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Response-Time', `${duration}ms`);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      logger.error('API request failed', error as Error, {
        requestId,
        method: request.method,
        path,
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

      // If it's not an operational error, we might want to alert/monitor
      if (!isOperationalError(error as Error)) {
        logger.fatal('Non-operational error occurred', error as Error, {
          requestId,
          path,
        });
      }

      return response;
    }
  };
}

/**
 * Helper to create a JSON response with consistent structure
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Helper to create an error response
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  code?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        statusCode: status,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}
