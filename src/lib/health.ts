import { NextRequest, NextResponse } from 'next/server';
import { logger, logApiRequest } from '@/lib/logger';
import { AppError } from '@/lib/errors';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database?: ServiceHealth;
    redis?: ServiceHealth;
    external?: ServiceHealth[];
  };
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage?: number;
    requestCount?: number;
    errorRate?: number;
  };
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

class HealthChecker {
  private static instance: HealthChecker;
  private requestCount = 0;
  private errorCount = 0;
  private startTime = Date.now();

  public static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  public incrementRequest(): void {
    this.requestCount++;
  }

  public incrementError(): void {
    this.errorCount++;
  }

  private async checkDatabase(): Promise<ServiceHealth | undefined> {
    // This would typically check your database connection
    // For now, we'll simulate a database check
    try {
      const start = Date.now();
      // Simulate database query
      await new Promise(resolve => setTimeout(resolve, 10));
      const responseTime = Date.now() - start;

      return {
        name: 'database',
        status: 'healthy',
        responseTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth | undefined> {
    // This would typically check your Redis connection
    try {
      const start = Date.now();
      // Simulate Redis check
      await new Promise(resolve => setTimeout(resolve, 5));
      const responseTime = Date.now() - start;

      return {
        name: 'redis',
        status: 'healthy',
        responseTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'redis',
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkExternalServices(): Promise<ServiceHealth[]> {
    const services: ServiceHealth[] = [];
    
    // Example external service checks
    const externalServices = [
      { name: 'api-service', url: process.env.EXTERNAL_API_URL },
      // Add more external services as needed
    ];

    for (const service of externalServices) {
      if (!service.url) continue;

      try {
        const start = Date.now();
        const response = await fetch(`${service.url}/health`, {
          method: 'GET',
          timeout: 5000, // 5 second timeout
        });
        const responseTime = Date.now() - start;

        services.push({
          name: service.name,
          status: response.ok ? 'healthy' : 'degraded',
          responseTime,
          lastCheck: new Date().toISOString(),
        });
      } catch (error) {
        services.push({
          name: service.name,
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return services;
  }

  private calculateOverallStatus(services: any): 'healthy' | 'unhealthy' | 'degraded' {
    const allServices = [
      services.database,
      services.redis,
      ...(services.external || []),
    ].filter(Boolean);

    if (allServices.length === 0) {
      return 'healthy';
    }

    const hasUnhealthy = allServices.some((s: ServiceHealth) => s.status === 'unhealthy');
    const hasDegraded = allServices.some((s: ServiceHealth) => s.status === 'degraded');

    if (hasUnhealthy) return 'unhealthy';
    if (hasDegraded) return 'degraded';
    return 'healthy';
  }

  public async getHealthStatus(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;

    // Check all services
    const [database, redis, external] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalServices(),
    ]);

    const services = {
      database,
      redis,
      external: external.length > 0 ? external : undefined,
    };

    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;

    return {
      status: this.calculateOverallStatus(services),
      timestamp,
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      metrics: {
        memoryUsage: process.memoryUsage(),
        requestCount: this.requestCount,
        errorRate,
      },
    };
  }

  public async getLivenessStatus(): Promise<{ status: string; timestamp: string }> {
    // Simple liveness check - just return that the process is running
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  public async getReadinessStatus(): Promise<{ status: string; timestamp: string; ready: boolean }> {
    try {
      const health = await this.getHealthStatus();
      const ready = health.status !== 'unhealthy';
      
      return {
        status: ready ? 'ready' : 'not ready',
        timestamp: new Date().toISOString(),
        ready,
      };
    } catch (error) {
      return {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        ready: false,
      };
    }
  }
}

export const healthChecker = HealthChecker.getInstance();

// Health check endpoint handlers
export async function GET(request: NextRequest) {
  try {
    logApiRequest('GET', '/api/health', { userAgent: request.headers.get('user-agent') });
    
    const healthStatus = await healthChecker.getHealthStatus();
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    logger.debug('Health check completed', { 
      status: healthStatus.status,
      uptime: healthStatus.uptime,
    });

    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    logger.error('Health check failed', {}, error as Error);
    
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

// Separate endpoints for different types of health checks
export const healthEndpoints = {
  // Full health check with all services
  full: GET,
  
  // Liveness probe - just checks if the process is running
  liveness: async (request: NextRequest) => {
    try {
      logApiRequest('GET', '/api/health/live', {});
      const status = await healthChecker.getLivenessStatus();
      return NextResponse.json(status);
    } catch (error) {
      return NextResponse.json({ status: 'dead', timestamp: new Date().toISOString() }, { status: 503 });
    }
  },
  
  // Readiness probe - checks if the app is ready to serve requests
  readiness: async (request: NextRequest) => {
    try {
      logApiRequest('GET', '/api/health/ready', {});
      const status = await healthChecker.getReadinessStatus();
      const statusCode = status.ready ? 200 : 503;
      return NextResponse.json(status, { status: statusCode });
    } catch (error) {
      return NextResponse.json(
        { status: 'not ready', timestamp: new Date().toISOString(), ready: false },
        { status: 503 }
      );
    }
  },
};
