import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Global middleware for request processing
 * Handles logging, security headers, and request tracking
 */
export function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  // Generate request ID for tracking
  const requestId = crypto.randomUUID();
  
  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  requestHeaders.set('x-request-start-time', startTime.toString());
  
  // Log request (in production, you might want to use a proper logger)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${new Date().toISOString()}] ${request.method} ${request.nextUrl.pathname}`);
  }
  
  // Create response with modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // Add response headers
  response.headers.set('x-request-id', requestId);
  
  // Add timing header
  const processingTime = Date.now() - startTime;
  response.headers.set('x-response-time', `${processingTime}ms`);
  
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
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
