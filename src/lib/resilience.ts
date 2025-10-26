// Rate limiting and request throttling utilities
import { NextRequest } from 'next/server';
import { AppError, ErrorCode, generateRequestId } from './error-handling';
import { logger } from './logging';
import { config } from './config';

interface RateLimitInfo {
  count: number;
  resetTime: number;
  windowStart: number;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitInfo>();
  private windowMs: number;
  private maxRequests: number;
  private keyGenerator: (req: NextRequest) => string;
  private cleanup: NodeJS.Timeout;

  constructor(
    windowMs: number = 60000, // 1 minute default
    maxRequests: number = 100,
    keyGenerator: (req: NextRequest) => string = (req) => this.getClientIP(req)
  ) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.keyGenerator = keyGenerator;

    // Cleanup expired entries every minute
    this.cleanup = setInterval(() => this.cleanupExpired(), 60000);
  }

  private getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const cfIP = req.headers.get('cf-connecting-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    if (cfIP) {
      return cfIP;
    }
    
    // Fallback to a default for development
    return '127.0.0.1';
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, info] of this.store.entries()) {
      if (now > info.resetTime) {
        this.store.delete(key);
      }
    }
  }

  checkLimit(req: NextRequest): RateLimitResult {
    const key = this.keyGenerator(req);
    const now = Date.now();
    
    let info = this.store.get(key);
    
    // Initialize or reset if window expired
    if (!info || now > info.resetTime) {
      info = {
        count: 0,
        resetTime: now + this.windowMs,
        windowStart: now
      };
    }

    // Increment count
    info.count++;
    this.store.set(key, info);

    const remaining = Math.max(0, this.maxRequests - info.count);
    const allowed = info.count <= this.maxRequests;

    const result: RateLimitResult = {
      allowed,
      limit: this.maxRequests,
      remaining,
      reset: info.resetTime
    };

    if (!allowed) {
      result.retryAfter = Math.ceil((info.resetTime - now) / 1000);
    }

    return result;
  }

  destroy(): void {
    if (this.cleanup) {
      clearInterval(this.cleanup);
    }
    this.store.clear();
  }
}

// Global rate limiter instances
const globalLimiter = new RateLimiter(
  60000, // 1 minute window
  config.api.rateLimit || 100 // requests per minute
);

const heavyEndpointLimiter = new RateLimiter(
  300000, // 5 minute window
  10, // requests per 5 minutes for heavy endpoints
  (req) => `heavy:${req.headers.get('x-forwarded-for') || '127.0.0.1'}`
);

const apiEndpointLimiter = new RateLimiter(
  60000, // 1 minute window
  50, // requests per minute for API endpoints
  (req) => `api:${req.headers.get('x-forwarded-for') || '127.0.0.1'}`
);

// Rate limiting middleware
export function withRateLimit(
  limiter: RateLimiter = globalLimiter,
  requestId?: string
) {
  return (req: NextRequest) => {
    if (!config.features.enableRateLimiting) {
      return { allowed: true, limit: Infinity, remaining: Infinity, reset: 0 };
    }

    const id = requestId || generateRequestId();
    const result = limiter.checkLimit(req);

    logger.debug('Rate limit check', {
      requestId: id,
      clientIP: req.headers.get('x-forwarded-for') || '127.0.0.1',
      result,
      userAgent: req.headers.get('user-agent')?.substring(0, 100)
    });

    if (!result.allowed) {
      logger.warn('Rate limit exceeded', {
        requestId: id,
        clientIP: req.headers.get('x-forwarded-for') || '127.0.0.1',
        limit: result.limit,
        retryAfter: result.retryAfter
      });

      throw new AppError(
        ErrorCode.RATE_LIMIT_ERROR,
        'Rate limit exceeded',
        429,
        {
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
          retryAfter: result.retryAfter
        },
        id
      );
    }

    return result;
  };
}

// Circuit breaker implementation
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000, // 1 minute
    private readonly monitorWindow: number = 300000 // 5 minutes
  ) {}

  async execute<T>(
    operation: () => Promise<T>,
    operationName: string = 'operation',
    requestId?: string
  ): Promise<T> {
    const id = requestId || generateRequestId();
    
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker transitioning to HALF_OPEN', {
          operationName,
          requestId: id
        });
      } else {
        logger.warn('Circuit breaker is OPEN, rejecting request', {
          operationName,
          requestId: id,
          failures: this.failures,
          lastFailureTime: this.lastFailureTime
        });
        
        throw new AppError(
          ErrorCode.RESOURCE_EXHAUSTED,
          'Circuit breaker is open',
          503,
          {
            operationName,
            state: this.state,
            failures: this.failures,
            nextRetryTime: this.lastFailureTime + this.recoveryTimeout
          },
          id
        );
      }
    }

    try {
      const result = await operation();
      
      // Success - reset failures if in HALF_OPEN or CLOSED
      if (this.state === 'HALF_OPEN') {
        this.reset();
        logger.info('Circuit breaker reset to CLOSED after successful operation', {
          operationName,
          requestId: id
        });
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      
      logger.error('Circuit breaker recorded failure', {
        operationName,
        requestId: id,
        failures: this.failures,
        state: this.state,
        error: error instanceof Error ? error.message : String(error)
      });

      if (this.state === 'HALF_OPEN') {
        this.state = 'OPEN';
        this.lastFailureTime = Date.now();
        logger.warn('Circuit breaker opened after failure in HALF_OPEN state', {
          operationName,
          requestId: id
        });
      }

      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold && this.state === 'CLOSED') {
      this.state = 'OPEN';
      logger.error('Circuit breaker opened due to failure threshold exceeded', {
        failures: this.failures,
        threshold: this.failureThreshold
      });
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }

  getState(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// Export rate limiter instances
export const rateLimiters = {
  global: globalLimiter,
  heavy: heavyEndpointLimiter,
  api: apiEndpointLimiter
};

// Create circuit breakers for different operations
export const circuitBreakers = {
  database: new CircuitBreaker(3, 30000, 120000), // 3 failures, 30s timeout, 2min window
  external: new CircuitBreaker(5, 60000, 300000), // 5 failures, 1min timeout, 5min window
  heavy: new CircuitBreaker(2, 120000, 300000)    // 2 failures, 2min timeout, 5min window
};

// Cleanup function for graceful shutdown
export function cleanup(): void {
  Object.values(rateLimiters).forEach(limiter => {
    if (typeof limiter.destroy === 'function') {
      limiter.destroy();
    }
  });
}
