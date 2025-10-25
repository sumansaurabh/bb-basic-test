/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from './config';

/**
 * Simple in-memory rate limiter
 * In production, you would use Redis or a distributed cache
 */
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private config = getConfig();

  private getClientId(request: NextRequest): string {
    return request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           'unknown';
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  isRateLimited(request: NextRequest): boolean {
    this.cleanup();
    
    const clientId = this.getClientId(request);
    const now = Date.now();
    const window = this.config.RATE_LIMIT_WINDOW;
    const maxRequests = this.config.RATE_LIMIT_MAX;

    const clientData = this.requests.get(clientId);

    if (!clientData) {
      this.requests.set(clientId, { count: 1, resetTime: now + window });
      return false;
    }

    if (now > clientData.resetTime) {
      this.requests.set(clientId, { count: 1, resetTime: now + window });
      return false;
    }

    if (clientData.count >= maxRequests) {
      return true;
    }

    clientData.count++;
    return false;
  }

  getRemainingRequests(request: NextRequest): number {
    const clientId = this.getClientId(request);
    const clientData = this.requests.get(clientId);
    
    if (!clientData || Date.now() > clientData.resetTime) {
      return this.config.RATE_LIMIT_MAX;
    }

    return Math.max(0, this.config.RATE_LIMIT_MAX - clientData.count);
  }

  getResetTime(request: NextRequest): number {
    const clientId = this.getClientId(request);
    const clientData = this.requests.get(clientId);
    
    if (!clientData || Date.now() > clientData.resetTime) {
      return Date.now() + this.config.RATE_LIMIT_WINDOW;
    }

    return clientData.resetTime;
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    if (rateLimiter.isRateLimited(request)) {
      const resetTime = rateLimiter.getResetTime(request);
      const resetInSeconds = Math.ceil((resetTime - Date.now()) / 1000);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
            retryAfter: resetInSeconds,
            timestamp: new Date().toISOString(),
          },
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(getConfig().RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(resetTime),
            'Retry-After': String(resetInSeconds),
          },
        }
      );
    }

    const response = await handler(request);
    
    // Add rate limit headers to successful responses
    const remaining = rateLimiter.getRemainingRequests(request);
    const resetTime = rateLimiter.getResetTime(request);
    
    response.headers.set('X-RateLimit-Limit', String(getConfig().RATE_LIMIT_MAX));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(resetTime));
    
    return response;
  };
}

/**
 * Request size limiter
 */
export function withRequestSizeLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const contentLength = request.headers.get('content-length');
    const maxSize = getConfig().MAX_REQUEST_SIZE;
    
    if (contentLength && parseInt(contentLength, 10) > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REQUEST_TOO_LARGE',
            message: `Request body too large. Maximum size is ${maxSize} bytes`,
            maxSize,
            receivedSize: parseInt(contentLength, 10),
            timestamp: new Date().toISOString(),
          },
        },
        { status: 413 }
      );
    }

    return handler(request);
  };
}

/**
 * CORS handler
 */
export function withCORS(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    origin?: string | string[];
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
  } = {}
) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    credentials = false,
  } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': Array.isArray(origin) ? origin.join(', ') : origin,
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': allowedHeaders.join(', '),
          'Access-Control-Allow-Credentials': credentials ? 'true' : 'false',
          'Access-Control-Max-Age': '3600',
        },
      });
    }

    const response = await handler(request);

    // Add CORS headers to the response
    response.headers.set('Access-Control-Allow-Origin', Array.isArray(origin) ? origin.join(', ') : origin);
    if (credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  };
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request);

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Only add HSTS in production with HTTPS
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return response;
  };
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware(
  ...middlewares: Array<(handler: any) => any>
) {
  return (handler: any) => {
    return middlewares.reduce((acc, middleware) => middleware(acc), handler);
  };
}
