/**
 * Standardized API response utilities
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';
import { isAppError, getErrorMessage } from './errors';

interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
  meta?: Record<string, unknown>;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    fields?: Record<string, string>;
  };
  timestamp: string;
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
    meta,
  });
}

/**
 * Create a standardized error response with proper logging
 */
export function errorResponse(
  error: unknown,
  context?: Record<string, unknown>
): NextResponse<ErrorResponse> {
  const timestamp = new Date().toISOString();

  // Handle AppError instances
  if (isAppError(error)) {
    logger.warn('Application error occurred', {
      ...context,
      errorCode: error.code,
      statusCode: error.statusCode,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          fields: 'fields' in error ? (error.fields as Record<string, string>) : undefined,
        },
        timestamp,
      },
      { status: error.statusCode }
    );
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    logger.error('Unexpected error occurred', error, context);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message,
          code: 'INTERNAL_ERROR',
        },
        timestamp,
      },
      { status: 500 }
    );
  }

  // Handle unknown error types
  logger.error('Unknown error type', undefined, { 
    ...context, 
    errorType: typeof error 
  });

  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Internal server error',
        code: 'UNKNOWN_ERROR',
      },
      timestamp,
    },
    { status: 500 }
  );
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error, {
        handler: handler.name,
        args: args.length,
      });
    }
  };
}
