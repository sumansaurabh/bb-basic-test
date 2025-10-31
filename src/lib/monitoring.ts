/**
 * Performance monitoring and metrics collection
 */

import { logger } from './logger';

export interface PerformanceMetrics {
  timestamp: string;
  metric: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics in memory

  /**
   * Record a performance metric
   */
  recordMetric(
    metric: string,
    value: number,
    unit: string,
    tags?: Record<string, string>
  ): void {
    const entry: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      metric,
      value,
      unit,
      tags,
    };

    this.metrics.push(entry);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log significant metrics
    if (this.isSignificant(metric, value, unit)) {
      logger.info(`Performance metric: ${metric}`, {
        value,
        unit,
        tags,
      });
    }
  }

  /**
   * Determine if a metric is significant enough to log
   */
  private isSignificant(metric: string, value: number, unit: string): boolean {
    // Log slow operations
    if (unit === 'ms' && value > 1000) return true;
    
    // Log high memory usage
    if (metric.includes('memory') && unit === 'bytes' && value > 100 * 1024 * 1024) return true;
    
    // Log errors
    if (metric.includes('error')) return true;
    
    return false;
  }

  /**
   * Get recent metrics
   */
  getMetrics(limit = 100): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(metric: string, limit = 100): PerformanceMetrics[] {
    return this.metrics
      .filter(m => m.metric === metric)
      .slice(-limit);
  }

  /**
   * Calculate average for a metric
   */
  getAverageMetric(metric: string, timeWindowMs = 60000): number {
    const now = Date.now();
    const cutoff = new Date(now - timeWindowMs).toISOString();
    
    const relevantMetrics = this.metrics.filter(
      m => m.metric === metric && m.timestamp >= cutoff
    );

    if (relevantMetrics.length === 0) return 0;

    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / relevantMetrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure execution time of a function
 */
export async function measureAsync<T>(
  fn: () => Promise<T>,
  metricName: string,
  tags?: Record<string, string>
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    performanceMonitor.recordMetric(metricName, duration, 'ms', tags);
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    
    performanceMonitor.recordMetric(
      `${metricName}.error`,
      duration,
      'ms',
      { ...tags, error: 'true' }
    );
    
    throw error;
  }
}

/**
 * Measure execution time of a synchronous function
 */
export function measureSync<T>(
  fn: () => T,
  metricName: string,
  tags?: Record<string, string>
): T {
  const start = performance.now();
  
  try {
    const result = fn();
    const duration = performance.now() - start;
    
    performanceMonitor.recordMetric(metricName, duration, 'ms', tags);
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    
    performanceMonitor.recordMetric(
      `${metricName}.error`,
      duration,
      'ms',
      { ...tags, error: 'true' }
    );
    
    throw error;
  }
}

/**
 * Record memory usage
 */
export function recordMemoryUsage(tags?: Record<string, string>): void {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    
    performanceMonitor.recordMetric('memory.heap.used', usage.heapUsed, 'bytes', tags);
    performanceMonitor.recordMetric('memory.heap.total', usage.heapTotal, 'bytes', tags);
    performanceMonitor.recordMetric('memory.rss', usage.rss, 'bytes', tags);
  }
}
