/**
 * Metrics endpoint for monitoring system performance
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { rateLimiter, RATE_LIMITS } from '@/lib/rate-limiter';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface MetricsResponse {
  timestamp: string;
  system: {
    platform: string;
    nodeVersion: string;
    processId: number;
    uptime: number;
  };
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  environment: {
    nodeEnv: string;
    port: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimit = rateLimiter.check(request, RATE_LIMITS.MONITORING);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.MONITORING.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          },
        }
      );
    }

    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const response: MetricsResponse = {
      timestamp: new Date().toISOString(),
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        processId: process.pid,
        uptime: Math.round(process.uptime()),
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024), // MB
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000), // milliseconds
        system: Math.round(cpuUsage.system / 1000), // milliseconds
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.PORT || '3000',
      },
    };

    logger.debug('Metrics requested', { path: '/api/metrics' });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-RateLimit-Limit': RATE_LIMITS.MONITORING.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      },
    });
  } catch (error) {
    logger.error('Metrics endpoint error', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
