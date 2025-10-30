/**
 * Health check endpoint for monitoring and load balancers
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    memory: {
      status: 'pass' | 'warn' | 'fail';
      used: number;
      total: number;
      percentage: number;
    };
    process: {
      status: 'pass';
      pid: number;
      uptime: number;
    };
  };
}

export async function GET() {
  try {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    // Determine memory status
    let memoryStatus: 'pass' | 'warn' | 'fail' = 'pass';
    if (memoryPercentage > 90) {
      memoryStatus = 'fail';
    } else if (memoryPercentage > 75) {
      memoryStatus = 'warn';
    }

    // Determine overall health status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (memoryStatus === 'fail') {
      overallStatus = 'unhealthy';
    } else if (memoryStatus === 'warn') {
      overallStatus = 'degraded';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        memory: {
          status: memoryStatus,
          used: usedMemory,
          total: totalMemory,
          percentage: parseFloat(memoryPercentage.toFixed(2)),
        },
        process: {
          status: 'pass',
          pid: process.pid,
          uptime: process.uptime(),
        },
      },
    };

    // Log health check if status is not healthy
    if (overallStatus !== 'healthy') {
      logger.warn('Health check returned non-healthy status', {
        status: overallStatus,
        memoryPercentage,
      });
    }

    // Return appropriate status code based on health
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });
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

// HEAD request for simple alive check
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
