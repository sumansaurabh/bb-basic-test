import { NextResponse } from 'next/server';

/**
 * Standard API error response interface
 */
export interface ApiError {
  success: false;
  message: string;
  error?: string;
  statusCode: number;
}

/**
 * Standard API success response interface
 */
export interface ApiSuccess<T = any> {
  success: true;
  message: string;
  data: T;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  error?: unknown
): NextResponse<ApiError> {
  console.error(`API Error [${statusCode}]: ${message}`, error);
  
  return NextResponse.json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' && error ? String(error) : undefined,
    statusCode,
  }, { status: statusCode });
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message: string = 'Operation completed successfully',
  statusCode: number = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({
    success: true,
    message,
    data,
  }, { status: statusCode });
}

/**
 * Safe property accessor utility
 */
export function safeGet<T>(
  obj: any,
  path: string,
  defaultValue: T
): T {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
}

/**
 * Validate required fields in an object
 */
export function validateRequiredFields(
  obj: any,
  requiredFields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (safeGet(obj, field, null) === null) {
      missingFields.push(field);
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Async error wrapper for API routes
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse<ApiError>> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('Unhandled error in API route:', error);
      return createErrorResponse(
        'An unexpected error occurred',
        500,
        error
      );
    }
  };
}
