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

/**
 * Check memory usage
 */
function checkMemory(): HealthStatus['checks']['memory'] {
  const usage = process.memoryUsage();
  const totalHeap = usage.heapTotal;
  const usedHeap = usage.heapUsed;
  const percentage = (usedHeap / totalHeap) * 100;

  let status: 'pass' | 'warn' | 'fail' = 'pass';
  
  if (percentage > 90) {
    status = 'fail';
  } else if (percentage > 75) {
    status = 'warn';
  }

  return {
    status,
    used: usedHeap,
    total: totalHeap,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Determine overall health status
 */
function determineOverallStatus(checks: HealthStatus['checks']): HealthStatus['status'] {
  if (checks.memory.status === 'fail') {
    return 'unhealthy';
  }
  
  if (checks.memory.status === 'warn') {
    return 'degraded';
  }

  return 'healthy';
}

export async function GET() {
  try {
    const memoryCheck = checkMemory();
    
    const checks: HealthStatus['checks'] = {
      memory: memoryCheck,
      process: {
        status: 'pass',
        pid: process.pid,
        uptime: Math.floor(process.uptime()),
      },
    };

    const overallStatus = determineOverallStatus(checks);

    const health: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
    };

    // Log warnings or failures
    if (overallStatus !== 'healthy') {
      logger.warn('Health check returned non-healthy status', {
        status: overallStatus,
        checks,
      });
    }

    // Return appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
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

// Support HEAD requests for simple health checks
export async function HEAD() {
  try {
    const memoryCheck = checkMemory();
    const status = memoryCheck.status === 'fail' ? 503 : 200;
    return new NextResponse(null, { status });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
