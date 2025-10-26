// Enhanced error handling utilities for the application
import { NextResponse } from 'next/server';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED'
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
  stack?: string;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown>;
  public readonly timestamp: string;
  public readonly requestId: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details: Record<string, unknown> = {},
    requestId: string = generateRequestId()
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, AppError);
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function handleApiError(error: unknown, requestId?: string): NextResponse {
  const id = requestId || generateRequestId();
  
  if (error instanceof AppError) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.toJSON() 
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    const apiError = new AppError(
      ErrorCode.SERVER_ERROR,
      'Internal server error occurred',
      500,
      { originalError: error.message },
      id
    );

    // Log the full error for debugging
    console.error('[API Error]', {
      requestId: id,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        success: false, 
        error: apiError.toJSON() 
      },
      { status: 500 }
    );
  }

  // Handle unknown error types
  const unknownError = new AppError(
    ErrorCode.SERVER_ERROR,
    'Unknown error occurred',
    500,
    { unknownError: String(error) },
    id
  );

  return NextResponse.json(
    { 
      success: false, 
      error: unknownError.toJSON() 
    },
    { status: 500 }
  );
}

export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string,
  requestId?: string
): T {
  if (value === null || value === undefined) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `${fieldName} is required`,
      400,
      { field: fieldName },
      requestId
    );
  }
  return value;
}

export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string,
  requestId?: string
): number {
  if (value < min || value > max) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `${fieldName} must be between ${min} and ${max}`,
      400,
      { field: fieldName, value, min, max },
      requestId
    );
  }
  return value;
}

export function validateString(
  value: unknown,
  fieldName: string,
  minLength: number = 0,
  maxLength: number = 1000,
  requestId?: string
): string {
  if (typeof value !== 'string') {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `${fieldName} must be a string`,
      400,
      { field: fieldName, type: typeof value },
      requestId
    );
  }

  if (value.length < minLength || value.length > maxLength) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `${fieldName} must be between ${minLength} and ${maxLength} characters`,
      400,
      { field: fieldName, length: value.length, minLength, maxLength },
      requestId
    );
  }

  return value;
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out',
  requestId?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new AppError(
        ErrorCode.TIMEOUT_ERROR,
        timeoutMessage,
        408,
        { timeoutMs },
        requestId
      ));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

export function safeJSONParse<T>(
  jsonString: string,
  fallback: T,
  requestId?: string
): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn('[JSON Parse Error]', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      input: jsonString.substring(0, 100) + (jsonString.length > 100 ? '...' : ''),
      timestamp: new Date().toISOString()
    });
    return fallback;
  }
}

export function safePropertyAccess<T>(
  obj: Record<string, unknown>,
  path: string[],
  fallback: T
): T {
  try {
    let current: unknown = obj;
    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return fallback;
      }
    }
    return current as T;
  } catch {
    return fallback;
  }
}
