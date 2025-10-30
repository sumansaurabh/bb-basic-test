/**
 * Performance monitoring utilities
 */

import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 1000;

  /**
   * Start a performance timer
   */
  public startTimer(name: string): (metadata?: Record<string, unknown>) => void {
    const startTime = Date.now();

    return (metadata?: Record<string, unknown>) => {
      const duration = Date.now() - startTime;
      this.recordMetric({
        name,
        duration,
        timestamp: new Date().toISOString(),
        metadata,
      });
    };
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the last N metrics to prevent memory issues
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow operations
    if (metric.duration > 1000) {
      logger.warn('Slow operation detected', {
        operation: metric.name,
        duration: `${metric.duration}ms`,
        ...metric.metadata,
      });
    }
  }

  /**
   * Get metrics for a specific operation
   */
  public getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  /**
   * Get average duration for an operation
   */
  public getAverageDuration(name: string): number | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return null;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Get statistics for an operation
   */
  public getStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return null;

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const count = durations.length;
    const sum = durations.reduce((a, b) => a + b, 0);
    const average = sum / count;
    const min = durations[0];
    const max = durations[count - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = durations[p95Index];

    return { count, average, min, max, p95 };
  }

  /**
   * Clear all metrics
   */
  public clear(): void {
    this.metrics = [];
  }

  /**
   * Get all operation names
   */
  public getOperationNames(): string[] {
    return [...new Set(this.metrics.map(m => m.name))];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for monitoring async function performance
 */
export function monitored(operationName: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const endTimer = performanceMonitor.startTimer(operationName);
      try {
        const result = await originalMethod.apply(this, args);
        endTimer({ success: true });
        return result;
      } catch (error) {
        endTimer({ success: false, error: (error as Error).message });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Measure execution time of a function
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const endTimer = performanceMonitor.startTimer(name);
  try {
    const result = await fn();
    endTimer({ ...metadata, success: true });
    return result;
  } catch (error) {
    endTimer({ ...metadata, success: false, error: (error as Error).message });
    throw error;
  }
}

/**
 * Measure execution time of a synchronous function
 */
export function measure<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  const endTimer = performanceMonitor.startTimer(name);
  try {
    const result = fn();
    endTimer({ ...metadata, success: true });
    return result;
  } catch (error) {
    endTimer({ ...metadata, success: false, error: (error as Error).message });
    throw error;
  }
}
