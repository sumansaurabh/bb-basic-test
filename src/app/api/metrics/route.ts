/**
 * Metrics endpoint for monitoring performance
 * Should be protected in production
 */

import { NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/monitoring';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    logger.info('Metrics endpoint accessed');

    const summary = performanceMonitor.getSummary();
    const memoryUsage = process.memoryUsage();

    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      performance: summary,
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        heapUsedMB: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMB: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    return NextResponse.json(metrics);
  } catch (error) {
    logger.error('Failed to retrieve metrics', error as Error);

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
