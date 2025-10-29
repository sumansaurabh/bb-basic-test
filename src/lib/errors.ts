/**
 * Custom error classes for better error handling and categorization
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Request timeout') {
    super(message, 408, 'TIMEOUT');
  }
}

/**
 * Safe error response formatter for API responses
 */
export function formatErrorResponse(error: unknown) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        ...(error instanceof ValidationError && error.fields ? { fields: error.fields } : {}),
        ...(isDevelopment && error.stack ? { stack: error.stack } : {}),
      },
      timestamp: new Date().toISOString(),
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        message: isDevelopment ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        ...(isDevelopment && error.stack ? { stack: error.stack } : {}),
      },
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: false,
    error: {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    },
    timestamp: new Date().toISOString(),
  };
}
