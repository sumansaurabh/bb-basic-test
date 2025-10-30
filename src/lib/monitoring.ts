/**
 * Performance monitoring and metrics collection utilities
 */

import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: string;
  userAgent?: string;
  ip?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private requestMetrics: RequestMetrics[] = [];
  private maxMetricsSize = 1000; // Keep last 1000 metrics

  /**
   * Start timing an operation
   */
  startTimer(name: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric({
        name,
        duration,
        timestamp: new Date().toISOString(),
      });
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics.shift();
    }

    // Log slow operations
    if (metric.duration > 1000) {
      logger.warn(`Slow operation detected: ${metric.name}`, {
        duration: metric.duration,
        ...metric.metadata,
      });
    }
  }

  /**
   * Record API request metrics
   */
  recordRequest(metrics: RequestMetrics): void {
    this.requestMetrics.push(metrics);

    // Keep only recent metrics
    if (this.requestMetrics.length > this.maxMetricsSize) {
      this.requestMetrics.shift();
    }

    logger.logResponse(
      metrics.method,
      metrics.path,
      metrics.statusCode,
      metrics.duration,
      {
        userAgent: metrics.userAgent,
        ip: metrics.ip,
      }
    );
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalMetrics: number;
    totalRequests: number;
    averageResponseTime: number;
    slowestOperations: PerformanceMetric[];
    recentRequests: RequestMetrics[];
  } {
    const averageResponseTime =
      this.requestMetrics.length > 0
        ? this.requestMetrics.reduce((sum, m) => sum + m.duration, 0) / this.requestMetrics.length
        : 0;

    const slowestOperations = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const recentRequests = this.requestMetrics.slice(-20);

    return {
      totalMetrics: this.metrics.length,
      totalRequests: this.requestMetrics.length,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      slowestOperations,
      recentRequests,
    };
  }

  /**
   * Get metrics for a specific operation
   */
  getMetricsForOperation(name: string): {
    count: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
  } {
    const operationMetrics = this.metrics.filter((m) => m.name === name);

    if (operationMetrics.length === 0) {
      return {
        count: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
      };
    }

    const durations = operationMetrics.map((m) => m.duration);
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      count: operationMetrics.length,
      averageDuration: Math.round((sum / operationMetrics.length) * 100) / 100,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.requestMetrics = [];
    logger.debug('Performance metrics cleared');
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring function execution time
 */
export function measurePerformance(operationName: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const stopTimer = performanceMonitor.startTimer(operationName);
      try {
        const result = await originalMethod.apply(this, args);
        stopTimer();
        return result;
      } catch (error) {
        stopTimer();
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  operationName: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    performanceMonitor.recordMetric({
      name: operationName,
      duration,
      timestamp: new Date().toISOString(),
      metadata,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    performanceMonitor.recordMetric({
      name: operationName,
      duration,
      timestamp: new Date().toISOString(),
      metadata: { ...metadata, error: true },
    });

    throw error;
  }
}

/**
 * Measure sync function execution time
 */
export function measureSync<T>(
  operationName: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  const startTime = Date.now();
  try {
    const result = fn();
    const duration = Date.now() - startTime;
    
    performanceMonitor.recordMetric({
      name: operationName,
      duration,
      timestamp: new Date().toISOString(),
      metadata,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    performanceMonitor.recordMetric({
      name: operationName,
      duration,
      timestamp: new Date().toISOString(),
      metadata: { ...metadata, error: true },
    });

    throw error;
  }
}
