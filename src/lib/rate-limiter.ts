/**
 * Simple in-memory rate limiter for API endpoints
 * For production, consider using Redis or a dedicated rate limiting service
 */

import { NextRequest } from 'next/server';
import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
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

  private getClientIdentifier(request: NextRequest): string {
    // Try to get IP from various headers (for proxies/load balancers)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIp || 'unknown';
    
    return ip;
  }

  /**
   * Checks if a request should be rate limited
   * @param request - The Next.js request object
   * @param options - Rate limit configuration
   * @returns Object with allowed status and remaining requests
   */
  check(
    request: NextRequest,
    options: {
      maxRequests: number;
      windowMs: number;
      identifier?: string;
    }
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const identifier = options.identifier || this.getClientIdentifier(request);
    const key = `${identifier}:${request.nextUrl.pathname}`;
    const now = Date.now();

    let entry = this.store.get(key);

    // Create new entry or reset if window expired
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + options.windowMs,
      };
      this.store.set(key, entry);
    }

    // Increment count
    entry.count++;

    const allowed = entry.count <= options.maxRequests;
    const remaining = Math.max(0, options.maxRequests - entry.count);

    if (!allowed) {
      logger.warn('Rate limit exceeded', {
        identifier,
        path: request.nextUrl.pathname,
        count: entry.count,
        limit: options.maxRequests,
      });
    }

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Resets rate limit for a specific identifier
   */
  reset(identifier: string, path: string): void {
    const key = `${identifier}:${path}`;
    this.store.delete(key);
  }

  /**
   * Clears all rate limit data
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // Heavy processing endpoints - very restrictive
  HEAVY: {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
  },
  // Standard API endpoints
  STANDARD: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
  // Health check and monitoring endpoints
  MONITORING: {
    maxRequests: 1000,
    windowMs: 60000, // 1 minute
  },
} as const;
