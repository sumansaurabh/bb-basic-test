/**
 * Shared TypeScript types for API requests and responses
 */

// Base API response types
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    fields?: Record<string, string>;
  };
  timestamp: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Health check types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  memory: {
    used: number;
    total: number;
    rss: number;
  };
  node: {
    version: string;
    platform: string;
    arch: string;
  };
}

// Metrics types
export interface MetricsResponse {
  timestamp: string;
  system: {
    uptime: number;
    platform: string;
    arch: string;
    nodeVersion: string;
    pid: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    arrayBuffers: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  environment: {
    nodeEnv: string;
    timezone: string;
  };
}

// Heavy processing types
export interface HeavyProcessingRequest {
  iterations?: number;
  complexity?: 'light' | 'medium' | 'heavy';
}

export interface HeavyProcessingResponse {
  processingTime: number;
  requestedIterations: number;
  actualIterations: number;
  complexity: string;
  results: Array<{
    iteration: number;
    result: number;
    complexity: string;
  }>;
  serverStats: {
    cpuUsage: number;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  };
}
