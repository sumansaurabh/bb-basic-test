/**
 * Performance monitoring and metrics utilities
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
   * Measure the execution time of an async function
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now();
    const startTimestamp = new Date().toISOString();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;

      this.recordMetric({
        name,
        duration,
        timestamp: startTimestamp,
        metadata,
      });

      // Log slow operations
      if (duration > 1000) {
        logger.warn('Slow operation detected', {
          operation: name,
          duration: Math.round(duration),
          ...metadata,
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.recordMetric({
        name: `${name}_error`,
        duration,
        timestamp: startTimestamp,
        metadata: {
          ...metadata,
          error: (error as Error).message,
        },
      });

      throw error;
    }
  }

  /**
   * Measure the execution time of a sync function
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const startTime = performance.now();
    const startTimestamp = new Date().toISOString();

    try {
      const result = fn();
      const duration = performance.now() - startTime;

      this.recordMetric({
        name,
        duration,
        timestamp: startTimestamp,
        metadata,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.recordMetric({
        name: `${name}_error`,
        duration,
        timestamp: startTimestamp,
        metadata: {
          ...metadata,
          error: (error as Error).message,
        },
      });

      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log metric in debug mode
    logger.debug('Performance metric recorded', {
      name: metric.name,
      duration: Math.round(metric.duration),
    });
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter((m) => m.name === name);
    }
    return [...this.metrics];
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(name: string): number | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return null;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Get statistics for an operation
   */
  getStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return null;

    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
    const count = durations.length;

    const sum = durations.reduce((a, b) => a + b, 0);
    const average = sum / count;
    const min = durations[0];
    const max = durations[count - 1];

    const getPercentile = (p: number) => {
      const index = Math.ceil((p / 100) * count) - 1;
      return durations[Math.max(0, index)];
    };

    return {
      count,
      average,
      min,
      max,
      p50: getPercentile(50),
      p95: getPercentile(95),
      p99: getPercentile(99),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    logger.debug('Performance metrics cleared');
  }

  /**
   * Get summary of all operations
   */
  getSummary(): Record<string, ReturnType<typeof this.getStats>> {
    const operations = new Set(this.metrics.map((m) => m.name));
    const summary: Record<string, ReturnType<typeof this.getStats>> = {};

    for (const operation of operations) {
      summary[operation] = this.getStats(operation);
    }

    return summary;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring method performance
 */
export function Measure(name?: string) {
  return function (
    target: Record<string, unknown>,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const targetConstructor = target.constructor as { name: string };
    const metricName = name || `${targetConstructor.name}.${propertyKey}`;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      return performanceMonitor.measure(
        metricName,
        () => originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * Create a timer that can be stopped manually
 */
export function createTimer(name: string, metadata?: Record<string, unknown>) {
  const startTime = performance.now();

  return {
    stop: () => {
      const duration = performance.now() - startTime;
      logger.debug('Timer stopped', {
        name,
        duration: Math.round(duration),
        ...metadata,
      });
      return duration;
    },
  };
}
