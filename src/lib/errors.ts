/**
 * Custom error classes for better error handling and categorization
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, true, context);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: Record<string, unknown>) {
    super(message, 404, true, context);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', context?: Record<string, unknown>) {
    super(message, 401, true, context);
    this.name = 'UnauthorizedError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', context?: Record<string, unknown>) {
    super(message, 429, true, context);
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Request timeout', context?: Record<string, unknown>) {
    super(message, 408, true, context);
    this.name = 'TimeoutError';
  }
}

/**
 * Error handler utility for API routes
 */
export function handleApiError(error: unknown): {
  message: string;
  statusCode: number;
  error?: string;
  context?: Record<string, unknown>;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      error: error.name,
      context: error.context,
    };
  }

  if (error instanceof Error) {
    return {
      message: 'Internal server error',
      statusCode: 500,
      error: error.name,
      context: {
        originalMessage: error.message,
      },
    };
  }

  return {
    message: 'Unknown error occurred',
    statusCode: 500,
    error: 'UnknownError',
  };
}
