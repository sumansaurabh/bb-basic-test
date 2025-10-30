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
    // Clean up every 5 minutes
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
        logger.debug(`Rate limiter cleanup: removed ${cleaned} expired entries`);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   */
  check(identifier: string, config: RateLimitConfig): void {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || entry.resetTime < now) {
      // Create new entry
      this.store.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return;
    }

    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      logger.logSecurity('Rate limit exceeded', {
        identifier,
        count: entry.count,
        maxRequests: config.maxRequests,
        retryAfter,
      });

      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      );
    }

    // Increment count
    entry.count++;
  }

  /**
   * Get current rate limit status
   */
  getStatus(identifier: string, config: RateLimitConfig): {
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
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.store.delete(identifier);
    logger.debug(`Rate limit reset for identifier: ${identifier}`);
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.store.clear();
    logger.debug('Rate limiter store cleared');
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Common rate limit configurations
 */
export const RateLimitPresets = {
  // Very strict - for sensitive operations
  STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  // Standard - for normal API endpoints
  STANDARD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  // Relaxed - for public endpoints
  RELAXED: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
  },
  // Heavy processing - for resource-intensive operations
  HEAVY: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
} as const;

/**
 * Get identifier from request (IP address or user ID)
 */
export function getRequestIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';

  // In production, you might want to combine with user ID if authenticated
  return `ip:${ip}`;
}
