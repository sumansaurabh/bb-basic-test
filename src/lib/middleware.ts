/**
 * Middleware utilities for API routes
 */

import { NextRequest } from 'next/server';
import { rateLimiter, RATE_LIMITS } from './rate-limiter';
import { logger } from './logger';

/**
 * Extract client identifier from request (IP address or fallback)
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown';
  
  return ip.trim();
}

/**
 * Apply rate limiting to a request
 */
export function applyRateLimit(
  request: NextRequest,
  limitType: keyof typeof RATE_LIMITS = 'moderate'
): void {
  const identifier = getClientIdentifier(request);
  const config = RATE_LIMITS[limitType];

  logger.debug('Applying rate limit', {
    identifier,
    limitType,
    config,
  });

  rateLimiter.check(identifier, config);
}

/**
 * Log API request for monitoring
 */
export function logRequest(
  request: NextRequest,
  additionalContext?: Record<string, unknown>
): void {
  logger.info('API request received', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    clientIp: getClientIdentifier(request),
    ...additionalContext,
  });
}

/**
 * Validate request method
 */
export function validateMethod(
  request: NextRequest,
  allowedMethods: string[]
): void {
  if (!allowedMethods.includes(request.method)) {
    throw new Error(`Method ${request.method} not allowed`);
  }
}

/**
 * Parse and validate request body
 */
export async function parseRequestBody<T = unknown>(
  request: NextRequest
): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    logger.warn('Failed to parse request body', { error });
    throw new Error('Invalid request body');
  }
}
