/**
 * Shared TypeScript types for API requests and responses
 */

// Common API response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    statusCode?: number;
    fields?: Record<string, string>;
    stack?: string;
  };
  timestamp: string;
}

// Heavy processing types
export interface HeavyProcessingRequest {
  iterations?: number;
  complexity?: 'light' | 'medium' | 'heavy';
}

export interface HeavyProcessingResponse {
  success: boolean;
  processingTime: number;
  requestedIterations: number;
  actualIterations: number;
  complexity: string;
  serverTimestamp: string;
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
  uptime: {
    seconds: number;
    formatted: string;
  };
  memory: {
    heapUsed: { bytes: number; mb: number };
    heapTotal: { bytes: number; mb: number };
    rss: { bytes: number; mb: number };
    external: { bytes: number; mb: number };
    arrayBuffers: { bytes: number; mb: number };
  };
  cpu: {
    user: number;
    system: number;
  };
  process: {
    pid: number;
    version: string;
    platform: string;
    arch: string;
  };
  environment: {
    nodeEnv: string;
    version: string;
  };
}
