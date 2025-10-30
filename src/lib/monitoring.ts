/**
 * Performance monitoring utilities
 */

import { logger } from './logger';

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: Map<string, number>;

  constructor() {
    this.metrics = new Map();
  }

  /**
   * Start timing an operation
   */
  public start(operationName: string): void {
    this.metrics.set(operationName, performance.now());
  }

  /**
   * End timing an operation and log the result
   */
  public end(operationName: string, metadata?: Record<string, unknown>): number {
    const startTime = this.metrics.get(operationName);
    
    if (!startTime) {
      logger.warn(`Performance metric not found: ${operationName}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(operationName);

    const metric: PerformanceMetric = {
      name: operationName,
      duration: parseFloat(duration.toFixed(2)),
      timestamp: new Date().toISOString(),
      metadata,
    };

    // Log slow operations
    if (duration > 1000) {
      logger.warn('Slow operation detected', {
        operation: operationName,
        duration: metric.duration,
        ...metadata,
      });
    } else {
      logger.debug('Operation completed', {
        operation: operationName,
        duration: metric.duration,
        ...metadata,
      });
    }

    return metric.duration;
  }

  /**
   * Measure an async operation
   */
  public async measure<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.start(operationName);
    try {
      const result = await operation();
      this.end(operationName, metadata);
      return result;
    } catch (error) {
      this.end(operationName, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Measure a synchronous operation
   */
  public measureSync<T>(
    operationName: string,
    operation: () => T,
    metadata?: Record<string, unknown>
  ): T {
    this.start(operationName);
    try {
      const result = operation();
      this.end(operationName, metadata);
      return result;
    } catch (error) {
      this.end(operationName, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Clear all active metrics
   */
  public clear(): void {
    this.metrics.clear();
  }

  /**
   * Get all active metric names
   */
  public getActiveMetrics(): string[] {
    return Array.from(this.metrics.keys());
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring method execution time
 */
export function Measure(operationName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const metricName = operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measure(
        metricName,
        () => originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * Memory usage tracker
 */
export class MemoryTracker {
  private baseline: NodeJS.MemoryUsage;

  constructor() {
    this.baseline = process.memoryUsage();
  }

  /**
   * Get current memory usage
   */
  public getCurrentUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * Get memory usage delta from baseline
   */
  public getDelta(): {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  } {
    const current = process.memoryUsage();
    return {
      rss: current.rss - this.baseline.rss,
      heapTotal: current.heapTotal - this.baseline.heapTotal,
      heapUsed: current.heapUsed - this.baseline.heapUsed,
      external: current.external - this.baseline.external,
    };
  }

  /**
   * Reset baseline to current usage
   */
  public reset(): void {
    this.baseline = process.memoryUsage();
  }

  /**
   * Log current memory usage
   */
  public log(label: string = 'Memory Usage'): void {
    const usage = this.getCurrentUsage();
    const delta = this.getDelta();

    logger.info(label, {
      current: {
        heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
      },
      delta: {
        heapUsed: `${(delta.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(delta.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(delta.rss / 1024 / 1024).toFixed(2)} MB`,
      },
    });
  }
}

/**
 * Request tracking for monitoring
 */
export class RequestTracker {
  private static requests: Map<string, {
    startTime: number;
    path: string;
    method: string;
  }> = new Map();

  public static start(requestId: string, path: string, method: string): void {
    this.requests.set(requestId, {
      startTime: Date.now(),
      path,
      method,
    });
  }

  public static end(requestId: string, statusCode: number): void {
    const request = this.requests.get(requestId);
    if (!request) {
      return;
    }

    const duration = Date.now() - request.startTime;
    this.requests.delete(requestId);

    logger.info('Request completed', {
      requestId,
      path: request.path,
      method: request.method,
      statusCode,
      duration,
    });

    // Alert on slow requests
    if (duration > 5000) {
      logger.warn('Slow request detected', {
        requestId,
        path: request.path,
        duration,
      });
    }
  }

  public static getActiveRequests(): number {
    return this.requests.size;
  }

  public static clear(): void {
    this.requests.clear();
  }
}
