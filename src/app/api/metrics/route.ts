/**
 * Metrics endpoint for monitoring and observability
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface Metrics {
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
  };
  cpu: {
    user: number;
    system: number;
  };
  system: {
    loadAverage: number[];
    freeMemory: number;
    totalMemory: number;
  };
}

export async function GET() {
  try {
    logger.debug('Metrics endpoint called');

    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics: Metrics = {
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
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      system: {
        loadAverage: (await import('os')).loadavg(),
        freeMemory: (await import('os')).freemem(),
        totalMemory: (await import('os')).totalmem(),
      },
    };

    return NextResponse.json(metrics);
  } catch (error) {
    logger.error('Metrics endpoint error', error as Error);
    
    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
