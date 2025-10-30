/**
 * API route wrapper with timeout, error handling, and monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { formatErrorResponse, TimeoutError, AppError } from './errors';
import { performanceMonitor } from './monitoring';

type ApiHandler = (request: NextRequest) => Promise<NextResponse>;

interface ApiWrapperOptions {
  timeout?: number; // Timeout in milliseconds
  operationName?: string; // Name for monitoring
  skipRateLimit?: boolean;
}

/**
 * Wrap an API handler with common functionality
 */
export function withApiWrapper(
  handler: ApiHandler,
  options: ApiWrapperOptions = {}
): ApiHandler {
  const {
    timeout = 30000, // 30 seconds default
    operationName = 'api-request',
  } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    const requestLogger = logger.child({
      requestId,
      path: request.nextUrl.pathname,
      method: request.method,
    });

    const endTimer = performanceMonitor.startTimer(operationName);

    try {
      requestLogger.info('API request started');

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

      endTimer({ success: true, statusCode: response.status });

      requestLogger.info('API request completed', {
        statusCode: response.status,
      });

      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId);

      return response;
    } catch (error) {
      endTimer({ success: false, error: (error as Error).message });

      requestLogger.error('API request failed', error as Error);

      const errorResponse = formatErrorResponse(
        error as Error,
        request.nextUrl.pathname,
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
 * Create a safe async handler that catches errors
 */
export function createSafeHandler(
  handler: (request: NextRequest) => Promise<unknown>,
  options: ApiWrapperOptions = {}
): ApiHandler {
  return withApiWrapper(async (request: NextRequest) => {
    try {
      const result = await handler(request);
      
      // If result is already a NextResponse, return it
      if (result instanceof NextResponse) {
        return result;
      }

      // Otherwise, wrap in NextResponse
      return NextResponse.json(result);
    } catch (error) {
      // Re-throw to be caught by wrapper
      throw error;
    }
  }, options);
}

/**
 * Timeout utility for promises
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new TimeoutError(errorMessage || `Operation timeout after ${timeoutMs}ms`)
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Retry utility for failed operations
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoff?: boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on operational errors (client errors)
      if (error instanceof AppError && error.statusCode < 500) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs;
        logger.warn('Operation failed, retrying', {
          attempt: attempt + 1,
          maxRetries,
          delay,
          error: (error as Error).message,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
