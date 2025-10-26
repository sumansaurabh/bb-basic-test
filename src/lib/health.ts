// Health check endpoints and system monitoring
import { NextResponse } from 'next/server';
import { config } from './config';
import { logger } from './logging';
import { generateRequestId } from './error-handling';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  requestId: string;
  version?: string;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  duration: number;
  message?: string;
  details?: Record<string, unknown>;
}

class HealthMonitor {
  private startTime: number;
  private healthChecks: Map<string, () => Promise<HealthCheck>>;
  private lastHealthStatus?: HealthStatus;

  constructor() {
    this.startTime = Date.now();
    this.healthChecks = new Map();
    this.registerDefaultHealthChecks();
  }

  private registerDefaultHealthChecks(): void {
    // System health check
    this.registerHealthCheck('system', async () => {
      const start = Date.now();
      
      try {
        const memoryUsage = process.memoryUsage();
        const freeMemoryMB = (memoryUsage.heapTotal - memoryUsage.heapUsed) / 1024 / 1024;
        const usedMemoryMB = memoryUsage.heapUsed / 1024 / 1024;
        
        const cpuUsage = process.cpuUsage();
        
        return {
          name: 'system',
          status: freeMemoryMB > 100 ? 'healthy' : 'degraded',
          duration: Date.now() - start,
          details: {
            memory: {
              used: Math.round(usedMemoryMB),
              free: Math.round(freeMemoryMB),
              total: Math.round(memoryUsage.heapTotal / 1024 / 1024)
            },
            cpu: {
              user: cpuUsage.user,
              system: cpuUsage.system
            },
            uptime: process.uptime(),
            version: process.version,
            platform: process.platform
          }
        };
      } catch (error) {
        return {
          name: 'system',
          status: 'unhealthy' as const,
          duration: Date.now() - start,
          message: error instanceof Error ? error.message : 'Unknown system error'
        };
      }
    });

    // Configuration health check
    this.registerHealthCheck('config', async () => {
      const start = Date.now();
      
      try {
        const configHealth = config.healthCheck();
        
        return {
          name: 'config',
          status: configHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
          duration: Date.now() - start,
          message: configHealth.issues.length > 0 ? configHealth.issues.join(', ') : undefined,
          details: {
            issues: configHealth.issues,
            environment: config.env
          }
        };
      } catch (error) {
        return {
          name: 'config',
          status: 'unhealthy' as const,
          duration: Date.now() - start,
          message: error instanceof Error ? error.message : 'Configuration error'
        };
      }
    });

    // Database health check (if configured)
    if (config.database.url) {
      this.registerHealthCheck('database', async () => {
        const start = Date.now();
        
        try {
          // Simple connection test - in a real app, you'd use your actual database client
          // For now, we'll just validate the URL format
          new URL(config.database.url!);
          
          return {
            name: 'database',
            status: 'healthy' as const,
            duration: Date.now() - start,
            details: {
              url: config.database.url!.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
              poolSize: config.database.poolSize,
              timeout: config.database.timeoutMs
            }
          };
        } catch (error) {
          return {
            name: 'database',
            status: 'unhealthy' as const,
            duration: Date.now() - start,
            message: error instanceof Error ? error.message : 'Database connection error'
          };
        }
      });
    }

    // External services health check
    if (config.externalServices.redisUrl) {
      this.registerHealthCheck('redis', async () => {
        const start = Date.now();
        
        try {
          // Simple URL validation - in a real app, you'd ping Redis
          new URL(config.externalServices.redisUrl!);
          
          return {
            name: 'redis',
            status: 'healthy' as const,
            duration: Date.now() - start,
            details: {
              url: config.externalServices.redisUrl!.replace(/\/\/.*@/, '//***:***@')
            }
          };
        } catch (error) {
          return {
            name: 'redis',
            status: 'unhealthy' as const,
            duration: Date.now() - start,
            message: error instanceof Error ? error.message : 'Redis connection error'
          };
        }
      });
    }
  }

  registerHealthCheck(name: string, check: () => Promise<HealthCheck>): void {
    this.healthChecks.set(name, check);
    logger.debug(`Registered health check: ${name}`);
  }

  unregisterHealthCheck(name: string): void {
    this.healthChecks.delete(name);
    logger.debug(`Unregistered health check: ${name}`);
  }

  async runHealthChecks(): Promise<HealthStatus> {
    const requestId = generateRequestId();
    const start = Date.now();
    
    logger.debug('Starting health checks', { requestId });

    const checks: HealthCheck[] = [];
    
    // Run all health checks concurrently
    const checkPromises = Array.from(this.healthChecks.entries()).map(
      async ([name, check]) => {
        try {
          return await check();
        } catch (error) {
          logger.error(`Health check failed: ${name}`, { error, requestId });
          return {
            name,
            status: 'unhealthy' as const,
            duration: Date.now() - start,
            message: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    );

    const results = await Promise.allSettled(checkPromises);
    
    // Process results
    for (const result of results) {
      if (result.status === 'fulfilled') {
        checks.push(result.value);
      } else {
        checks.push({
          name: 'unknown',
          status: 'unhealthy',
          duration: Date.now() - start,
          message: result.reason?.message || 'Health check promise rejected'
        });
      }
    }

    // Determine overall status
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    const hasDegraded = checks.some(check => check.status === 'degraded');
    
    let overallStatus: HealthStatus['status'] = 'healthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      requestId,
      version: process.env.npm_package_version,
      checks
    };

    this.lastHealthStatus = healthStatus;
    
    const duration = Date.now() - start;
    logger.info('Health checks completed', {
      requestId,
      duration,
      status: overallStatus,
      checksCount: checks.length
    });

    return healthStatus;
  }

  getLastHealthStatus(): HealthStatus | undefined {
    return this.lastHealthStatus;
  }

  // Readiness check (simpler, faster check)
  async readinessCheck(): Promise<{ status: 'ready' | 'not_ready'; message?: string }> {
    try {
      // Basic checks for readiness
      const configHealth = config.healthCheck();
      
      if (configHealth.status === 'unhealthy') {
        return {
          status: 'not_ready',
          message: `Configuration issues: ${configHealth.issues.join(', ')}`
        };
      }

      return { status: 'ready' };
    } catch (error) {
      return {
        status: 'not_ready',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Liveness check (very basic check)
  livenessCheck(): { status: 'alive' | 'dead' } {
    try {
      // If we can execute this code, the process is alive
      return { status: 'alive' };
    } catch {
      return { status: 'dead' };
    }
  }
}

// Create singleton instance
export const healthMonitor = new HealthMonitor();

// API route handlers
export async function handleHealthCheck(): Promise<NextResponse> {
  try {
    const health = await healthMonitor.runHealthChecks();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    logger.error('Health check endpoint error', { error });
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        requestId: generateRequestId()
      },
      { status: 500 }
    );
  }
}

export async function handleReadinessCheck(): Promise<NextResponse> {
  try {
    const readiness = await healthMonitor.readinessCheck();
    
    return NextResponse.json(readiness, {
      status: readiness.status === 'ready' ? 200 : 503
    });
  } catch (error) {
    logger.error('Readiness check endpoint error', { error });
    
    return NextResponse.json(
      { status: 'not_ready', message: 'Readiness check failed' },
      { status: 500 }
    );
  }
}

export async function handleLivenessCheck(): Promise<NextResponse> {
  const liveness = healthMonitor.livenessCheck();
  
  return NextResponse.json(liveness, {
    status: liveness.status === 'alive' ? 200 : 503
  });
}
