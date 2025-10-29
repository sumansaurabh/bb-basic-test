/**
 * Client-side performance monitoring utilities
 */

export interface PerformanceMetrics {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  timing: {
    navigationStart: number;
    domContentLoaded: number;
    loadComplete: number;
  };
}

/**
 * Get current memory usage (if available)
 */
export function getMemoryUsage(): PerformanceMetrics['memory'] | null {
  if (typeof window === 'undefined') return null;
  
  // Chrome-specific memory API
  const memory = (performance as { memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  }}).memory;
  
  if (!memory) return null;

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
  };
}

/**
 * Get performance timing metrics
 */
export function getPerformanceTiming(): PerformanceMetrics['timing'] | null {
  if (typeof window === 'undefined') return null;

  const timing = performance.timing;
  if (!timing) return null;

  return {
    navigationStart: timing.navigationStart,
    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
    loadComplete: timing.loadEventEnd - timing.navigationStart,
  };
}

/**
 * Check if memory usage is high
 */
export function isMemoryHigh(): boolean {
  const memory = getMemoryUsage();
  if (!memory) return false;

  const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
  return usagePercentage > 75;
}

/**
 * Log performance warning if memory is high
 */
export function checkMemoryWarning(): void {
  if (isMemoryHigh()) {
    const memory = getMemoryUsage();
    if (memory) {
      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      console.warn(
        `High memory usage detected: ${usagePercentage.toFixed(2)}% (${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB)`
      );
    }
  }
}

/**
 * Throttle function to limit execution rate
 */
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function to delay execution
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null;
  return function(this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
