/**
 * Performance monitoring utilities for client-side
 */

export interface PerformanceMetrics {
  fps: number;
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  timing?: {
    domContentLoaded: number;
    loadComplete: number;
  };
}

/**
 * Monitor FPS (Frames Per Second)
 */
export class FPSMonitor {
  private frames: number[] = [];
  private lastTime = performance.now();
  private animationFrameId: number | null = null;

  start(callback: (fps: number) => void): void {
    const measure = () => {
      const now = performance.now();
      const delta = now - this.lastTime;
      
      this.frames.push(delta);
      
      // Keep only last 60 frames
      if (this.frames.length > 60) {
        this.frames.shift();
      }
      
      // Calculate FPS every 60 frames
      if (this.frames.length === 60) {
        const avgDelta = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
        const fps = Math.round(1000 / avgDelta);
        callback(fps);
      }
      
      this.lastTime = now;
      this.animationFrameId = requestAnimationFrame(measure);
    };
    
    this.animationFrameId = requestAnimationFrame(measure);
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.frames = [];
  }
}

/**
 * Get memory usage (Chrome only)
 */
export function getMemoryUsage(): PerformanceMetrics['memory'] | undefined {
  if ('memory' in performance) {
    const memory = (performance as Performance & { memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    }}).memory;
    
    return memory;
  }
  return undefined;
}

/**
 * Get page load timing
 */
export function getPageTiming(): PerformanceMetrics['timing'] | undefined {
  if (typeof window === 'undefined') return undefined;

  const timing = performance.timing;
  
  return {
    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
    loadComplete: timing.loadEventEnd - timing.navigationStart,
  };
}

/**
 * Measure function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  
  return { result, duration };
}

/**
 * Measure synchronous function execution time
 */
export function measure<T>(
  name: string,
  fn: () => T
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  
  return { result, duration };
}

/**
 * Debounce function to prevent excessive calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution rate
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
