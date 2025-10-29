/**
 * Shared TypeScript types for API requests and responses
 */

// Standard API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    fields?: Record<string, string>;
  };
  timestamp: string;
  meta?: Record<string, unknown>;
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

// Health check types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  memory: {
    used: number;
    total: number;
    rss: number;
  };
  version: {
    node: string;
    platform: string;
    arch: string;
  };
}

// Metrics types
export interface MetricsResponse {
  system: {
    uptime: number;
    platform: string;
    arch: string;
    nodeVersion: string;
    pid: number;
  };
  memory: NodeJS.MemoryUsage;
  cpu: NodeJS.CpuUsage;
  environment: {
    nodeEnv: string;
    timezone: string;
  };
}
