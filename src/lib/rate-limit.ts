/**
 * Rate limiting utility using in-memory store
 * For production, consider using Redis-based rate limiting
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
    };

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), this.config.windowMs);
  }

  private defaultKeyGenerator(request: Request): string {
    // Try to get IP from various headers (useful behind proxies)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    return forwarded?.split(',')[0] || 
           realIp || 
           cfConnectingIp || 
           'unknown';
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }

  public checkLimit(request: Request): RateLimitResult {
    const key = this.config.keyGenerator(request);
    const now = Date.now();
    
    let entry = this.store[key];
    
    // Initialize or reset if window has passed
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      this.store[key] = entry;
    }

    // Increment counter
    entry.count++;

    return {
      allowed: entry.count <= this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      totalHits: entry.count,
    };
  }

  public reset(request: Request): void {
    const key = this.config.keyGenerator(request);
    delete this.store[key];
  }

  public getStats(): { totalKeys: number; memoryUsage: number } {
    return {
      totalKeys: Object.keys(this.store).length,
      memoryUsage: JSON.stringify(this.store).length,
    };
  }
}

/**
 * Create different rate limiters for different endpoints
 */
export const rateLimiters = {
  // General API rate limiter
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  }),

  // Strict rate limiter for heavy operations
  heavy: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  }),

  // Authentication endpoints (stricter)
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  }),

  // Health checks (more lenient)
  health: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  }),
};

/**
 * Rate limiting middleware for Next.js API routes
 */
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return (request: Request): { success: boolean; response?: Response } => {
    const result = limiter.checkLimit(request);

    if (!result.allowed) {
      const response = new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
      
      return { success: false, response };
    }

    return { success: true };
  };
}

/**
 * Advanced rate limiting with different strategies
 */
export class AdvancedRateLimiter extends RateLimiter {
  private blockList: Set<string> = new Set();
  private whitelist: Set<string> = new Set();

  constructor(config: RateLimitConfig) {
    super(config);
  }

  public addToBlockList(identifier: string): void {
    this.blockList.add(identifier);
  }

  public removeFromBlockList(identifier: string): void {
    this.blockList.delete(identifier);
  }

  public addToWhitelist(identifier: string): void {
    this.whitelist.add(identifier);
  }

  public removeFromWhitelist(identifier: string): void {
    this.whitelist.delete(identifier);
  }

  public checkLimit(request: Request): RateLimitResult {
    const key = this.config.keyGenerator(request);

    // Check blocklist
    if (this.blockList.has(key)) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + this.config.windowMs,
        totalHits: this.config.maxRequests + 1,
      };
    }

    // Check whitelist
    if (this.whitelist.has(key)) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
        totalHits: 0,
      };
    }

    return super.checkLimit(request);
  }
}

/**
 * Sliding window rate limiter (more accurate but memory intensive)
 */
export class SlidingWindowRateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(private config: { windowMs: number; maxRequests: number }) {}

  public checkLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    requests = requests.filter(time => time > windowStart);
    
    // Add current request
    requests.push(now);
    
    // Update store
    this.requests.set(identifier, requests);
    
    const allowed = requests.length <= this.config.maxRequests;
    
    return {
      allowed,
      remaining: Math.max(0, this.config.maxRequests - requests.length),
      resetTime: requests[0] + this.config.windowMs,
      totalHits: requests.length,
    };
  }

  public cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    for (const [identifier, requests] of this.requests) {
      const validRequests = requests.filter(time => time > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}
