/**
 * Error handling utilities for consistent error management
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, context?: Record<string, any>) {
    super(`${resource} not found`, 404, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: Record<string, any>) {
    super(message, 429, true, context);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable', context?: Record<string, any>) {
    super(message, 503, true, context);
  }
}

/**
 * Wraps async functions with error handling
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      // Convert unknown errors to AppError
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new AppError(message, 500, false, {
        originalError: error instanceof Error ? error.stack : String(error),
      });
    }
  };
}

/**
 * Creates a safe function that catches and handles errors
 */
export function safeFunction<T extends any[], R>(
  fn: (...args: T) => R,
  defaultValue: R,
  onError?: (error: Error) => void
): (...args: T) => R {
  return (...args: T): R => {
    try {
      return fn(...args);
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      }
      return defaultValue;
    }
  };
}

/**
 * Retry mechanism with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    shouldRetry = (error) => !(error instanceof AppError && error.statusCode < 500),
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        throw lastError;
      }

      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Circuit breaker pattern implementation
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private options: {
      failureThreshold: number;
      recoveryTime: number;
      timeout: number;
    }
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new ServiceUnavailableError('Circuit breaker is open');
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        this.timeoutPromise<T>(),
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime !== null &&
      Date.now() - this.lastFailureTime >= this.options.recoveryTime
    );
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'open';
    }
  }

  private timeoutPromise<T>(): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new AppError('Operation timeout', 408));
      }, this.options.timeout);
    });
  }

  getState(): string {
    return this.state;
  }
}

/**
 * Type guard utilities
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function hasProperty<T extends PropertyKey>(
  obj: unknown,
  prop: T
): obj is Record<T, unknown> {
  return typeof obj === 'object' && obj !== null && prop in obj;
}

/**
 * Safe object property access
 */
export function safeGet<T>(
  obj: unknown,
  path: string,
  defaultValue: T
): T {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current?.[key] === undefined) {
      return defaultValue;
    }
    current = current[key];
  }

  return current ?? defaultValue;
}
