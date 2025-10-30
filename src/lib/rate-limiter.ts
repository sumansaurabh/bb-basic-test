/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

import { RateLimitError } from './errors';
import { logger } from './logger';

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
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.store = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.store.entries()) {
        if (entry.resetTime < now) {
          this.store.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug('Rate limiter cleanup', { entriesRemoved: cleaned });
      }
    }, 60000);
  }

  /**
   * Stop cleanup interval (useful for testing)
   */
  public stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Check if a request should be rate limited
   */
  public check(identifier: string, config: RateLimitConfig): void {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || entry.resetTime < now) {
      // First request or window expired, create new entry
      this.store.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return;
    }

    // Increment count
    entry.count++;

    if (entry.count > config.maxRequests) {
      const resetIn = Math.ceil((entry.resetTime - now) / 1000);
      logger.warn('Rate limit exceeded', {
        identifier,
        count: entry.count,
        limit: config.maxRequests,
        resetIn,
      });

      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${resetIn} seconds.`
      );
    }

    this.store.set(identifier, entry);
  }

  /**
   * Get current rate limit status for an identifier
   */
  public getStatus(identifier: string, config: RateLimitConfig): {
    remaining: number;
    resetTime: number;
    total: number;
  } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || entry.resetTime < now) {
      return {
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        total: config.maxRequests,
      };
    }

    return {
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      total: config.maxRequests,
    };
  }

  /**
   * Reset rate limit for a specific identifier
   */
  public reset(identifier: string): void {
    this.store.delete(identifier);
    logger.debug('Rate limit reset', { identifier });
  }

  /**
   * Clear all rate limit entries
   */
  public clear(): void {
    this.store.clear();
    logger.debug('Rate limiter cleared');
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Common rate limit configurations
export const RateLimitPresets = {
  // Very strict - for sensitive operations
  STRICT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
  // Standard - for normal API endpoints
  STANDARD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  // Lenient - for public endpoints
  LENIENT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  // Heavy processing - for resource-intensive operations
  HEAVY: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
} as const;

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (considering proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0] || 'unknown';

  // You could also include user ID if authenticated
  // const userId = getUserIdFromRequest(request);
  // return userId ? `user:${userId}` : `ip:${ip}`;

  return `ip:${ip}`;
}
