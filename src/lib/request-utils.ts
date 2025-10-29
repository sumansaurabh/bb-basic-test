/**
 * Request utility functions for extracting and validating request data
 */

import { NextRequest } from 'next/server';
import { ValidationError } from './errors';

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to a default value
  return 'unknown';
}

/**
 * Safely parse JSON body from request
 */
export async function parseJSONBody<T = unknown>(
  request: NextRequest
): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch {
    throw new ValidationError('Invalid JSON in request body');
  }
}

/**
 * Get query parameter with type safety
 */
export function getQueryParam(
  request: NextRequest,
  paramName: string,
  required: boolean = false
): string | null {
  const { searchParams } = new URL(request.url);
  const value = searchParams.get(paramName);

  if (required && !value) {
    throw new ValidationError(`Missing required query parameter: ${paramName}`);
  }

  return value;
}

/**
 * Get multiple query parameters
 */
export function getQueryParams(
  request: NextRequest,
  paramNames: string[]
): Record<string, string | null> {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string | null> = {};

  for (const name of paramNames) {
    params[name] = searchParams.get(name);
  }

  return params;
}

/**
 * Check if request has valid content type
 */
export function validateContentType(
  request: NextRequest,
  expectedType: string = 'application/json'
): boolean {
  const contentType = request.headers.get('content-type');
  
  if (!contentType || !contentType.includes(expectedType)) {
    throw new ValidationError(
      `Invalid content type. Expected ${expectedType}`
    );
  }

  return true;
}

/**
 * Extract user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
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
