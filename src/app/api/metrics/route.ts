/**
 * Metrics endpoint for monitoring system performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-response';
import { rateLimiter, RATE_LIMITS } from '@/lib/rate-limiter';
import { getClientIP } from '@/lib/request-utils';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const clientIP = getClientIP(request);
  
  // Apply rate limiting
  rateLimiter.check(clientIP, RATE_LIMITS.moderate);

  const metrics = {
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
    },
    memory: {
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
      rss: process.memoryUsage().rss,
      arrayBuffers: process.memoryUsage().arrayBuffers,
    },
    cpu: {
      user: process.cpuUsage().user,
      system: process.cpuUsage().system,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  return NextResponse.json(metrics, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
});
