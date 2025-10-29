/**
 * Simple in-memory rate limiter for API routes
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
  private requests: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if a request should be rate limited
   */
  check(identifier: string, config: RateLimitConfig): void {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      // New window
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return;
    }

    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${retryAfter} seconds`,
        {
          retryAfter,
          limit: config.maxRequests,
          windowMs: config.windowMs,
        }
      );
    }

    entry.count++;
  }

  /**
   * Get rate limit info for a client
   */
  getInfo(identifier: string, config: RateLimitConfig): {
    remaining: number;
    resetTime: number;
    limit: number;
  } {
    const entry = this.requests.get(identifier);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return {
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        limit: config.maxRequests,
      };
    }

    return {
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      limit: config.maxRequests,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Clear all rate limit data (useful for testing)
   */
  reset(): void {
    this.requests.clear();
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = forwardedFor?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  
  return ip;
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  // Standard API endpoints
  standard: {
    windowMs: 60000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  // Heavy processing endpoints
  heavy: {
    windowMs: 60000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  // Strict rate limiting
  strict: {
    windowMs: 60000, // 1 minute
    maxRequests: 5, // 5 requests per minute
  },
};
