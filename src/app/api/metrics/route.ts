import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Metrics endpoint for monitoring system performance
 * Provides detailed metrics about the application
 */
export async function GET() {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: process.uptime(),
        formatted: formatUptime(process.uptime()),
      },
      memory: {
        heapUsed: {
          bytes: memoryUsage.heapUsed,
          mb: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
        },
        heapTotal: {
          bytes: memoryUsage.heapTotal,
          mb: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
        },
        rss: {
          bytes: memoryUsage.rss,
          mb: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
        },
        external: {
          bytes: memoryUsage.external,
          mb: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100,
        },
        arrayBuffers: {
          bytes: memoryUsage.arrayBuffers,
          mb: Math.round(memoryUsage.arrayBuffers / 1024 / 1024 * 100) / 100,
        },
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
        version: process.env.npm_package_version || '0.1.0',
      },
    };

    logger.debug('Metrics requested', { endpoint: '/api/metrics' });

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
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

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}
