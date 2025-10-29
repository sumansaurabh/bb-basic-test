/**
 * Request utility functions for extracting client information
 */

import { NextRequest } from 'next/server';

/**
 * Extract client IP address from request
 * Handles various proxy headers
 */
export function getClientIp(request: NextRequest): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default value
  return 'unknown';
}

/**
 * Extract user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Check if request is from a bot/crawler
 */
export function isBot(request: NextRequest): boolean {
  const userAgent = getUserAgent(request).toLowerCase();
  const botPatterns = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'curl',
    'wget',
    'python-requests',
  ];
  return botPatterns.some(pattern => userAgent.includes(pattern));
}

/**
 * Extract request metadata for logging
 */
export function getRequestMetadata(request: NextRequest): {
  ip: string;
  userAgent: string;
  method: string;
  url: string;
  requestId: string;
  isBot: boolean;
} {
  return {
    ip: getClientIp(request),
    userAgent: getUserAgent(request),
    method: request.method,
    url: request.url,
    requestId: generateRequestId(),
    isBot: isBot(request),
  };
}
