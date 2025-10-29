/**
 * Metrics endpoint for monitoring and observability
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { getRequestMetadata } from '@/lib/request-utils';

export const dynamic = 'force-dynamic';

interface SystemMetrics {
  timestamp: string;
  uptime: number;
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
  process: {
    pid: number;
    version: string;
    platform: string;
    arch: string;
  };
  environment: {
    nodeEnv: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const metadata = getRequestMetadata(request);
    
    logger.debug('Metrics endpoint accessed', metadata);

    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
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
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
      },
    };

    return successResponse(metrics);
  } catch (error) {
    logger.error('Failed to retrieve metrics', error as Error);
    return errorResponse(error);
  }
}
