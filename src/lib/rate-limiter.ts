/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.store = new Map();
    
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier (e.g., IP address, user ID)
   * @param config - Rate limit configuration
   * @returns Object with allowed status and remaining requests
   */
  public check(
    identifier: string,
    config: RateLimitConfig
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // No entry or expired entry
    if (!entry || entry.resetTime < now) {
      const resetTime = now + config.windowMs;
      this.store.set(identifier, {
        count: 1,
        resetTime,
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime,
      };
    }

    // Entry exists and is valid
    if (entry.count < config.maxRequests) {
      entry.count++;
      this.store.set(identifier, entry);

      return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime,
      };
    }

    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000), // seconds
    };
  }

  /**
   * Reset rate limit for a specific identifier
   */
  public reset(identifier: string): void {
    this.store.delete(identifier);
  }

  /**
   * Clear all rate limit entries
   */
  public clear(): void {
    this.store.clear();
  }

  /**
   * Cleanup and stop the rate limiter
   */
  public destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Export common rate limit configurations
export const RateLimitPresets = {
  // Very strict - for sensitive operations
  STRICT: {
    windowMs: 60000, // 1 minute
    maxRequests: 5,
  },
  // Standard - for normal API endpoints
  STANDARD: {
    windowMs: 60000, // 1 minute
    maxRequests: 60,
  },
  // Lenient - for public endpoints
  LENIENT: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
  },
  // Heavy processing - for resource-intensive operations
  HEAVY: {
    windowMs: 300000, // 5 minutes
    maxRequests: 10,
  },
} as const;

/**
 * Get client identifier from request
 * Priority: User ID > API Key > IP Address
 */
export function getClientIdentifier(request: Request): string {
  // Try to get user ID from headers (if authentication is implemented)
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get API key
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    return `api:${apiKey}`;
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  return `ip:${ip}`;
}
