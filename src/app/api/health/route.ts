/**
 * Health check endpoint for monitoring and load balancers
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  checks: {
    [key: string]: {
      status: 'pass' | 'fail';
      message?: string;
    };
  };
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    // Perform health checks
    const checks: HealthStatus['checks'] = {
      memory: {
        status: memoryPercentage < 90 ? 'pass' : 'fail',
        message: memoryPercentage >= 90 ? 'High memory usage' : undefined,
      },
      uptime: {
        status: process.uptime() > 0 ? 'pass' : 'fail',
      },
      responseTime: {
        status: 'pass',
      },
    };

    // Determine overall status
    const hasFailures = Object.values(checks).some(check => check.status === 'fail');
    const status: HealthStatus['status'] = hasFailures ? 'degraded' : 'healthy';

    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: memoryPercentage,
      },
      checks,
    };

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        ...healthStatus,
        responseTimeMs: responseTime,
      },
      { 
        status: status === 'healthy' ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 503 }
    );
  }
}
