import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for request logging, security headers, and request tracking
 */
export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  // Log incoming request (in production, send to logging service)
  if (process.env.NODE_ENV === 'development') {
    console.log(JSON.stringify({
      type: 'request',
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    }));
  }

  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  requestHeaders.set('x-request-start', startTime.toString());

  // Create response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add custom headers to response
  response.headers.set('x-request-id', requestId);
  response.headers.set('x-response-time', `${Date.now() - startTime}ms`);

  // CORS headers for API routes (if needed)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Max-Age', '86400');
    }
  }

  return response;
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
