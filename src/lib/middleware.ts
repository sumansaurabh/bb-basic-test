// Middleware for request processing with comprehensive error handling
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, generateRequestId } from '@/lib/error-handling';
import { logger } from '@/lib/logging';
import { withRateLimit, rateLimiters } from '@/lib/resilience';

export interface RequestContext {
  requestId: string;
  startTime: number;
  clientIP: string;
  userAgent: string;
  method: string;
  path: string;
}

// Create request context
export function createRequestContext(req: NextRequest): RequestContext {
  const requestId = generateRequestId();
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                   req.headers.get('x-real-ip') || 
                   '127.0.0.1';
  
  return {
    requestId,
    startTime: Date.now(),
    clientIP,
    userAgent: req.headers.get('user-agent') || 'unknown',
    method: req.method,
    path: req.nextUrl.pathname
  };
}

// Enhanced request wrapper with full error handling and logging
export function withRequestHandling<T extends unknown[]>(
  handler: (req: NextRequest, context: RequestContext, ...args: T) => Promise<NextResponse>,
  options: {
    rateLimit?: boolean;
    rateLimiter?: 'global' | 'api' | 'heavy';
    timeout?: number;
    requireAuth?: boolean;
  } = {}
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const context = createRequestContext(req);
    const log = logger.child('request', {
      requestId: context.requestId,
      method: context.method,
      path: context.path,
      clientIP: context.clientIP
    });

    // Set response headers for request tracking
    const headers = new Headers();
    headers.set('X-Request-ID', context.requestId);
    headers.set('X-API-Version', '1.0');
    
    try {
      log.info('Request started', {
        userAgent: context.userAgent.substring(0, 100),
        contentLength: req.headers.get('content-length'),
        contentType: req.headers.get('content-type')
      });

      // Rate limiting if enabled
      if (options.rateLimit !== false) {
        const limiterType = options.rateLimiter || 'global';
        const limiter = rateLimiters[limiterType];
        const rateLimitResult = withRateLimit(limiter, context.requestId)(req);
        
        // Add rate limit headers
        if (rateLimitResult.limit !== Infinity) {
          headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
          headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
          headers.set('X-RateLimit-Reset', String(rateLimitResult.reset));
        }
      }

      // Request size validation (prevent large payloads)
      const contentLength = parseInt(req.headers.get('content-length') || '0');
      const maxSizeBytes = (process.env.MAX_REQUEST_SIZE_MB || '10') as string;
      const maxSize = parseInt(maxSizeBytes) * 1024 * 1024;
      
      if (contentLength > maxSize) {
        log.warn('Request payload too large', {
          contentLength,
          maxSize,
          rejecting: true
        });
        
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PAYLOAD_TOO_LARGE',
              message: `Request payload exceeds ${maxSizeBytes}MB limit`,
              requestId: context.requestId
            }
          },
          { 
            status: 413,
            headers 
          }
        );
      }

      // Execute the handler with timeout if specified
      let result: NextResponse;
      
      if (options.timeout) {
        const timeoutPromise = new Promise<NextResponse>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Request timeout after ${options.timeout}ms`));
          }, options.timeout);
        });

        result = await Promise.race([
          handler(req, context, ...args),
          timeoutPromise
        ]);
      } else {
        result = await handler(req, context, ...args);
      }

      // Add standard headers to response
      for (const [key, value] of headers.entries()) {
        result.headers.set(key, value);
      }

      const duration = Date.now() - context.startTime;
      
      log.info('Request completed successfully', {
        duration,
        status: result.status,
        responseSize: result.headers.get('content-length') || 'unknown'
      });

      // Add performance headers
      result.headers.set('X-Response-Time', `${duration}ms`);

      return result;

    } catch (error) {
      const duration = Date.now() - context.startTime;
      
      log.error('Request failed', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        } : { message: String(error) },
        duration
      });

      // Handle the error and return appropriate response
      const errorResponse = handleApiError(error, context.requestId);
      
      // Add standard headers to error response
      for (const [key, value] of headers.entries()) {
        errorResponse.headers.set(key, value);
      }
      
      errorResponse.headers.set('X-Response-Time', `${duration}ms`);
      
      return errorResponse;
    }
  };
}

// Request validation middleware
export function validateRequest(schema: {
  query?: Record<string, 'string' | 'number' | 'boolean'>;
  body?: Record<string, 'string' | 'number' | 'boolean' | 'object'>;
  headers?: Record<string, string>;
}) {
  return async (req: NextRequest, _context: RequestContext) => {
    const errors: string[] = [];

    // Validate query parameters
    if (schema.query) {
      const url = new URL(req.url);
      for (const [key, type] of Object.entries(schema.query)) {
        const value = url.searchParams.get(key);
        if (value !== null) {
          switch (type) {
            case 'number':
              if (isNaN(Number(value))) {
                errors.push(`Query parameter '${key}' must be a number`);
              }
              break;
            case 'boolean':
              if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
                errors.push(`Query parameter '${key}' must be a boolean`);
              }
              break;
            // string validation is implicit
          }
        }
      }
    }

    // Validate headers
    if (schema.headers) {
      for (const [key, expectedValue] of Object.entries(schema.headers)) {
        const headerValue = req.headers.get(key.toLowerCase());
        if (headerValue !== expectedValue) {
          errors.push(`Header '${key}' must be '${expectedValue}'`);
        }
      }
    }

    // Validate body for POST/PUT/PATCH requests
    if (schema.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      try {
        const body = await req.json();
        for (const [key, type] of Object.entries(schema.body)) {
          const value = body[key];
          if (value !== undefined) {
            switch (type) {
              case 'number':
                if (typeof value !== 'number' || isNaN(value)) {
                  errors.push(`Body field '${key}' must be a number`);
                }
                break;
              case 'boolean':
                if (typeof value !== 'boolean') {
                  errors.push(`Body field '${key}' must be a boolean`);
                }
                break;
              case 'string':
                if (typeof value !== 'string') {
                  errors.push(`Body field '${key}' must be a string`);
                }
                break;
              case 'object':
                if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                  errors.push(`Body field '${key}' must be an object`);
                }
                break;
            }
          }
        }
      } catch (_error) {
        errors.push('Invalid JSON in request body');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  };
}

// CORS middleware
export function withCors(
  origins: string[] = ['*'],
  methods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  headers: string[] = ['Content-Type', 'Authorization', 'X-Requested-With']
) {
  return (req: NextRequest, response: NextResponse) => {
    const origin = req.headers.get('origin');
    
    if (origins.includes('*') || (origin && origins.includes(origin))) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
    }
    
    response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', headers.join(', '));
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    
    return response;
  };
}

// Security headers middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
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
}
