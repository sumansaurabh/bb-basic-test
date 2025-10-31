/**
 * Centralized error handling utilities
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';
import { ValidationError } from './validation';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends AppError {
  constructor(operation: string) {
    super(`Operation timed out: ${operation}`, 408, 'TIMEOUT', { operation });
    this.name = 'TimeoutError';
  }
}

/**
 * Handle errors and return appropriate NextResponse
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  // Log the error
  logger.error(`API Error${context ? ` in ${context}` : ''}`, error);

  // Validation errors
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        field: error.field,
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  // Rate limit errors
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        retryAfter: (error.details as { retryAfter: number }).retryAfter,
      },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((error.details as { retryAfter: number }).retryAfter / 1000)),
        },
      }
    );
  }

  // Application errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && { details: error.details }),
      },
      { status: error.statusCode }
    );
  }

  // Generic errors
  const message = error instanceof Error ? error.message : 'Internal server error';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return NextResponse.json(
    {
      success: false,
      error: isDevelopment ? message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(isDevelopment && error instanceof Error && { stack: error.stack }),
    },
    { status: 500 }
  );
}

/**
 * Wrap async handler with error handling
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}

/**
 * Execute with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new TimeoutError(operation)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}
