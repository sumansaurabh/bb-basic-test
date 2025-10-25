/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR');
    if (details) {
      (this as any).details = details;
    }
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class TimeoutError extends AppError {
  constructor(operation: string) {
    super(`Operation timed out: ${operation}`, 408, 'TIMEOUT');
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(`External service error: ${service}`, 502, 'EXTERNAL_SERVICE_ERROR');
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: Error,
  requestId?: string
): { response: ErrorResponse; statusCode: number } {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    return {
      response: {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: (error as any).details,
          timestamp,
          requestId,
        },
      },
      statusCode: error.statusCode,
    };
  }

  // Handle unknown errors - don't leak internal details in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    response: {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: isProduction ? 'Internal server error' : error.message,
        timestamp,
        requestId,
      },
    },
    statusCode: 500,
  };
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      const requestId = request.headers.get('x-correlation-id') || 'unknown';
      const { response, statusCode } = createErrorResponse(error as Error, requestId);
      
      console.error('API Error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        requestId,
        url: request.url,
        method: request.method,
      });

      return NextResponse.json(response, { status: statusCode });
    }
  };
}

/**
 * Promise with timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new TimeoutError(timeoutMessage));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Retry mechanism with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error = new Error('No attempts made');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
        maxDelay
      );

      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000, // 1 minute
    private readonly successThreshold: number = 2
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new AppError('Circuit breaker is OPEN', 503, 'CIRCUIT_BREAKER_OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}

/**
 * Global circuit breaker instances
 */
export const circuitBreakers = {
  heavyProcessing: new CircuitBreaker(5, 30000, 2),
  external: new CircuitBreaker(3, 60000, 1),
};

/**
 * Safe JSON parse that doesn't throw
 */
export function safeJsonParse<T>(json: string): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = JSON.parse(json) as T;
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON format' 
    };
  }
}
