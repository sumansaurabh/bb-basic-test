import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Metrics endpoint for monitoring and observability
 * Returns detailed performance metrics
 */
export async function GET() {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const metrics = {
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        version: process.version,
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
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
      },
    };
    
    logger.debug('Metrics collected');
    
    return NextResponse.json(metrics);
  } catch (error) {
    logger.error('Metrics collection error', error as Error);
    
    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
