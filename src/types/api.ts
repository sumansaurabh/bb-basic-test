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

// Heavy processing request types
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
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  checks: {
    memory: {
      status: 'ok' | 'warning' | 'critical';
      used: number;
      total: number;
      percentage: number;
    };
    process: {
      status: 'ok';
      pid: number;
      version: string;
      platform: string;
    };
  };
}

// Metrics types
export interface MetricsResponse {
  timestamp: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  cpu: NodeJS.CpuUsage;
  process: {
    pid: number;
    version: string;
    platform: string;
    arch: string;
  };
  environment: {
    nodeEnv: string;
  };
}
