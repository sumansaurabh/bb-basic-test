/**
 * Performance monitoring utilities for client-side tracking
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
  private frames = 0;
  private lastTime = performance.now();
  private fps = 0;
  private rafId: number | null = null;

  start(callback: (fps: number) => void): void {
    const measure = () => {
      this.frames++;
      const currentTime = performance.now();
      
      if (currentTime >= this.lastTime + 1000) {
        this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
        callback(this.fps);
        this.frames = 0;
        this.lastTime = currentTime;
      }
      
      this.rafId = requestAnimationFrame(measure);
    };
    
    this.rafId = requestAnimationFrame(measure);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getFPS(): number {
    return this.fps;
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
 * Debounce function to limit execution rate
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
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution frequency
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
