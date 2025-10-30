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
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.store = new Map();
    
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if a request should be rate limited
   */
  public check(
    identifier: string,
    config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
  ): void {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      this.store.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return;
    }

    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      logger.warn('Rate limit exceeded', {
        identifier,
        count: entry.count,
        maxRequests: config.maxRequests,
        retryAfter,
      });
      
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      );
    }

    // Increment counter
    entry.count++;
    this.store.set(identifier, entry);
  }

  /**
   * Get current rate limit status
   */
  public getStatus(identifier: string): {
    remaining: number;
    resetTime: number;
    total: number;
  } | null {
    const entry = this.store.get(identifier);
    if (!entry) {
      return null;
    }

    return {
      remaining: Math.max(0, 100 - entry.count), // Default max 100
      resetTime: entry.resetTime,
      total: 100,
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  public reset(identifier: string): void {
    this.store.delete(identifier);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Rate limiter cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Get store size (for monitoring)
   */
  public getStoreSize(): number {
    return this.store.size;
  }

  /**
   * Clear all entries (for testing)
   */
  public clear(): void {
    this.store.clear();
  }

  /**
   * Cleanup on shutdown
   */
  public destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoints
 */
export const RateLimitConfigs = {
  // Strict limit for heavy processing endpoints
  HEAVY_PROCESSING: {
    windowMs: 60000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  
  // Standard API limit
  STANDARD_API: {
    windowMs: 60000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  
  // Lenient limit for read-only endpoints
  READ_ONLY: {
    windowMs: 60000, // 1 minute
    maxRequests: 300, // 300 requests per minute
  },
  
  // Very strict for authentication endpoints
  AUTH: {
    windowMs: 900000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
} as const;

/**
 * Extract identifier from request (IP address or user ID)
 */
export function getRequestIdentifier(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  
  // In production, you might want to combine IP with user ID if authenticated
  // const userId = await getUserIdFromRequest(request);
  // return userId ? `user:${userId}` : `ip:${ip}`;
  
  return `ip:${ip}`;
}
