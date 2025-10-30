/**
 * Metrics endpoint for monitoring system performance
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { rateLimiter } from '@/lib/rate-limiter';

interface SystemMetrics {
  timestamp: string;
  process: {
    pid: number;
    uptime: number;
    nodeVersion: string;
    platform: string;
    arch: string;
  };
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
    heapUsedPercentage: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  rateLimiter: {
    activeEntries: number;
  };
}

export async function GET() {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers,
        heapUsedPercentage: parseFloat(
          ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2)
        ),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      rateLimiter: {
        activeEntries: rateLimiter.getStoreSize(),
      },
    };

    logger.debug('Metrics collected', { 
      heapUsedPercentage: metrics.memory.heapUsedPercentage,
      uptime: metrics.process.uptime,
    });

    return NextResponse.json(metrics);
  } catch (error) {
    logger.error('Failed to collect metrics', error as Error);

    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
