/**
 * Simple in-memory rate limiter for API endpoints
 * For production, consider using Redis or a dedicated rate limiting service
 */

import { RateLimitError } from './errors';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
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
   * Check if request should be rate limited
   * @param identifier - Unique identifier (e.g., IP address, user ID)
   * @param config - Rate limit configuration
   * @returns true if request is allowed, throws RateLimitError if exceeded
   */
  check(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || entry.resetTime < now) {
      // First request or window expired
      this.store.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      );
    }

    // Increment count
    entry.count++;
    return true;
  }

  /**
   * Get current rate limit status for an identifier
   */
  getStatus(identifier: string, config: RateLimitConfig): {
    remaining: number;
    resetTime: number;
  } {
    const entry = this.store.get(identifier);
    const now = Date.now();

    if (!entry || entry.resetTime < now) {
      return {
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
      };
    }

    return {
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clear rate limit for an identifier
   */
  clear(identifier: string): void {
    this.store.delete(identifier);
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  // Strict limit for heavy processing endpoints
  HEAVY: {
    windowMs: 60000, // 1 minute
    maxRequests: 10,
  },
  // Standard API limit
  STANDARD: {
    windowMs: 60000, // 1 minute
    maxRequests: 60,
  },
  // Lenient limit for read-only endpoints
  LENIENT: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
  },
} as const;
