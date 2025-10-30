import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Health check endpoint
 * Returns service health status and basic metrics
 */
export async function GET() {
  try {
    const startTime = Date.now();

    // Check system health
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Calculate memory usage percentages
    const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const issues: string[] = [];

    // Check memory usage
    if (heapUsedPercent > 90) {
      status = 'unhealthy';
      issues.push('High memory usage (>90%)');
    } else if (heapUsedPercent > 75) {
      status = 'degraded';
      issues.push('Elevated memory usage (>75%)');
    }

    // Check if service just started (might be warming up)
    if (uptime < 10) {
      status = 'degraded';
      issues.push('Service recently started');
    }

    const responseTime = Date.now() - startTime;

    const healthData = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      responseTime,
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsedPercent: Math.round(heapUsedPercent),
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        },
      },
      issues: issues.length > 0 ? issues : undefined,
    };

    logger.debug('Health check completed', {
      status,
      responseTime,
      heapUsedPercent: Math.round(heapUsedPercent),
    });

    // Return appropriate status code based on health
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthData, { status: statusCode });
  } catch (error) {
    logger.error('Health check failed', error as Error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}

/**
 * Readiness check endpoint
 * Returns whether the service is ready to accept traffic
 */
export async function HEAD() {
  try {
    // Perform quick checks to see if service is ready
    const memoryUsage = process.memoryUsage();
    const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    // Service is ready if memory usage is not critical
    if (heapUsedPercent > 95) {
      return new NextResponse(null, { status: 503 });
    }

    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
