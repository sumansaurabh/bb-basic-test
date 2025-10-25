/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest, NextResponse } from 'next/server';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  details?: Record<string, any>;
  responseTime?: number;
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
  system: {
    memory: NodeJS.MemoryUsage;
    cpu: {
      loadAverage: number[];
      uptime: number;
    };
    node: {
      version: string;
      platform: string;
      arch: string;
    };
  };
}

/**
 * Check system memory health
 */
async function checkMemoryHealth(): Promise<HealthCheck> {
  const memoryUsage = process.memoryUsage();
  const maxMemory = 512 * 1024 * 1024; // 512MB default limit
  const usedMemory = memoryUsage.heapUsed;
  const memoryPercent = (usedMemory / maxMemory) * 100;

  let status: HealthCheck['status'] = 'healthy';
  let message = `Memory usage: ${Math.round(memoryPercent)}%`;

  if (memoryPercent > 90) {
    status = 'unhealthy';
    message = `Memory usage critical: ${Math.round(memoryPercent)}%`;
  } else if (memoryPercent > 75) {
    status = 'degraded';
    message = `Memory usage high: ${Math.round(memoryPercent)}%`;
  }

  return {
    name: 'memory',
    status,
    message,
    details: {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      percentUsed: Math.round(memoryPercent),
    },
  };
}

/**
 * Check database connectivity (placeholder)
 */
async function checkDatabaseHealth(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Placeholder for actual database check
    // In a real application, you would check database connectivity here
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const responseTime = Date.now() - startTime;
    
    return {
      name: 'database',
      status: 'healthy',
      message: 'Database connection successful',
      responseTime,
      details: {
        connected: true,
        responseTime,
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      name: 'database',
      status: 'unhealthy',
      message: 'Database connection failed',
      responseTime,
      details: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
      },
    };
  }
}

/**
 * Check external service health (placeholder)
 */
async function checkExternalServiceHealth(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Placeholder for external service check
    // You might check third-party APIs, microservices, etc.
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const responseTime = Date.now() - startTime;
    
    return {
      name: 'external-service',
      status: 'healthy',
      message: 'External services responding',
      responseTime,
      details: {
        available: true,
        responseTime,
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      name: 'external-service',
      status: 'degraded',
      message: 'External service degraded',
      responseTime,
      details: {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
      },
    };
  }
}

/**
 * Check disk space (simplified)
 */
async function checkDiskHealth(): Promise<HealthCheck> {
  try {
    // In a real application, you might use fs.promises.statfs or similar
    // This is a simplified check
    const tmpDir = '/tmp';
    
    return {
      name: 'disk',
      status: 'healthy',
      message: 'Disk space available',
      details: {
        path: tmpDir,
        available: true,
      },
    };
  } catch (error) {
    return {
      name: 'disk',
      status: 'unhealthy',
      message: 'Disk space check failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Perform all health checks
 */
export async function performHealthChecks(): Promise<SystemHealth> {
  const startTime = Date.now();
  
  // Run all health checks in parallel
  const checks = await Promise.all([
    checkMemoryHealth(),
    checkDatabaseHealth(),
    checkExternalServiceHealth(),
    checkDiskHealth(),
  ]);

  // Determine overall system status
  const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
  const hasDegraded = checks.some(check => check.status === 'degraded');
  
  let systemStatus: SystemHealth['status'] = 'healthy';
  if (hasUnhealthy) {
    systemStatus = 'unhealthy';
  } else if (hasDegraded) {
    systemStatus = 'degraded';
  }

  return {
    status: systemStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
    system: {
      memory: process.memoryUsage(),
      cpu: {
        loadAverage: require('os').loadavg(),
        uptime: require('os').uptime(),
      },
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    },
  };
}

/**
 * Health check middleware for API routes
 */
export function createHealthCheckHandler() {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const health = await performHealthChecks();
      
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;
      
      return NextResponse.json(health, { status: statusCode });
    } catch (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Health check failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Simple readiness check (for Kubernetes, etc.)
 */
export function createReadinessHandler() {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Simple check that the application is ready to serve requests
    try {
      return NextResponse.json(
        {
          status: 'ready',
          timestamp: new Date().toISOString(),
          message: 'Application is ready to serve requests',
        },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        {
          status: 'not-ready',
          timestamp: new Date().toISOString(),
          error: 'Application not ready',
        },
        { status: 503 }
      );
    }
  };
}

/**
 * Simple liveness check (for Kubernetes, etc.)
 */
export function createLivenessHandler() {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Simple check that the application is alive
    return NextResponse.json(
      {
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      { status: 200 }
    );
  };
}
