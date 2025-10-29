import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Health check endpoint for monitoring and load balancers
 * Returns service status and basic metrics
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
      },
      checks: {
        memory: checkMemory(),
        uptime: checkUptime(),
      },
    };

    // Determine overall health status
    const isHealthy = Object.values(healthData.checks).every(check => check.status === 'ok');
    
    if (!isHealthy) {
      logger.warn('Health check failed', { checks: healthData.checks });
      return NextResponse.json(
        { ...healthData, status: 'degraded' },
        { status: 503 }
      );
    }

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    logger.error('Health check error', error);
    
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
 * Check memory usage
 */
function checkMemory(): { status: 'ok' | 'warning' | 'critical'; message: string } {
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  if (heapUsedPercent > 90) {
    return {
      status: 'critical',
      message: `Memory usage critical: ${heapUsedPercent.toFixed(2)}%`,
    };
  }

  if (heapUsedPercent > 75) {
    return {
      status: 'warning',
      message: `Memory usage high: ${heapUsedPercent.toFixed(2)}%`,
    };
  }

  return {
    status: 'ok',
    message: `Memory usage normal: ${heapUsedPercent.toFixed(2)}%`,
  };
}

/**
 * Check uptime
 */
function checkUptime(): { status: 'ok' | 'warning'; message: string } {
  const uptime = process.uptime();
  
  // Warn if service just started (less than 10 seconds)
  if (uptime < 10) {
    return {
      status: 'warning',
      message: `Service recently started: ${uptime.toFixed(2)}s`,
    };
  }

  return {
    status: 'ok',
    message: `Service running for ${Math.floor(uptime)}s`,
  };
}

/**
 * Readiness check - used by orchestrators to determine if service can accept traffic
 */
export async function HEAD() {
  // Simple readiness check - return 200 if service is ready
  return new NextResponse(null, { status: 200 });
}
