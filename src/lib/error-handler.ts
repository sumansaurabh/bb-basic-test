/**
 * Centralized error handling utilities for API routes
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';
import { ValidationError } from './validation';

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    field?: string;
    details?: unknown;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * Standard error codes
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  message: string,
  code: ErrorCode,
  statusCode: number,
  options?: {
    field?: string;
    details?: unknown;
    requestId?: string;
  }
): NextResponse<ErrorResponse> {
  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      code,
      field: options?.field,
      details: options?.details,
    },
    timestamp: new Date().toISOString(),
    requestId: options?.requestId,
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Handles errors in API routes with proper logging and response formatting
 */
export function handleApiError(
  error: unknown,
  context: {
    method: string;
    path: string;
    requestId?: string;
  }
): NextResponse<ErrorResponse> {
  // Log the error
  logger.error(`API Error: ${context.method} ${context.path}`, error, {
    requestId: context.requestId,
  });

  // Handle validation errors
  if (error instanceof ValidationError) {
    return createErrorResponse(
      error.message,
      ErrorCode.VALIDATION_ERROR,
      400,
      {
        field: error.field,
        requestId: context.requestId,
      }
    );
  }

  // Handle known error types
  if (error instanceof Error) {
    // Check for specific error types
    if (error.name === 'TimeoutError') {
      return createErrorResponse(
        'Request timeout',
        ErrorCode.TIMEOUT,
        504,
        { requestId: context.requestId }
      );
    }

    // Generic error with message
    return createErrorResponse(
      process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An internal error occurred',
      ErrorCode.INTERNAL_ERROR,
      500,
      {
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        requestId: context.requestId,
      }
    );
  }

  // Unknown error type
  return createErrorResponse(
    'An unexpected error occurred',
    ErrorCode.INTERNAL_ERROR,
    500,
    { requestId: context.requestId }
  );
}

/**
 * Wraps an API handler with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>,
  context: {
    method: string;
    path: string;
    requestId?: string;
  }
): Promise<NextResponse<T | ErrorResponse>> {
  return handler().catch((error) => handleApiError(error, context));
}

/**
 * Creates a timeout promise that rejects after specified milliseconds
 */
export function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error('Request timeout');
      error.name = 'TimeoutError';
      reject(error);
    }, ms);
  });
}

/**
 * Wraps a promise with a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      const error = new Error(errorMessage);
      error.name = 'TimeoutError';
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}
