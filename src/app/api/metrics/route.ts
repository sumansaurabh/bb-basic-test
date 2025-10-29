/**
 * Metrics endpoint for monitoring system performance
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, 'moderate');

    const metrics = {
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
        nodeEnv: process.env.NODE_ENV || 'unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    return successResponse(metrics);
  } catch (error) {
    return errorResponse(error, { endpoint: 'metrics' });
  }
}
