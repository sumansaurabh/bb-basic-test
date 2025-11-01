import { NextResponse } from 'next/server';
import { logInfo } from '@/lib/logger';

/**
 * Health check endpoint
 * Returns the current health status of the service
 */
export async function GET() {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      memory: {
        usage: process.memoryUsage(),
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      checks: {
        memory: checkMemoryHealth(),
        uptime: checkUptimeHealth(),
      },
    };

    // Determine overall health status
    const allChecksHealthy = Object.values(healthData.checks).every(
      (check) => check.status === 'healthy'
    );

    if (!allChecksHealthy) {
      healthData.status = 'degraded';
    }

    logInfo('Health check performed', {
      status: healthData.status,
      uptime: healthData.uptime,
    });

    return NextResponse.json(healthData, {
      status: allChecksHealthy ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

/**
 * Check memory health
 */
function checkMemoryHealth() {
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  if (heapUsedPercent > 90) {
    return {
      status: 'unhealthy',
      message: 'Memory usage critical',
      heapUsedPercent: heapUsedPercent.toFixed(2),
    };
  }

  if (heapUsedPercent > 75) {
    return {
      status: 'degraded',
      message: 'Memory usage high',
      heapUsedPercent: heapUsedPercent.toFixed(2),
    };
  }

  return {
    status: 'healthy',
    message: 'Memory usage normal',
    heapUsedPercent: heapUsedPercent.toFixed(2),
  };
}

/**
 * Check uptime health
 */
function checkUptimeHealth() {
  const uptime = process.uptime();

  // Service just started (less than 10 seconds)
  if (uptime < 10) {
    return {
      status: 'degraded',
      message: 'Service recently started',
      uptimeSeconds: uptime.toFixed(2),
    };
  }

  return {
    status: 'healthy',
    message: 'Service running normally',
    uptimeSeconds: uptime.toFixed(2),
  };
}
