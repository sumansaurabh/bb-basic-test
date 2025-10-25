import { z } from 'zod';
import { NextRequest } from 'next/server';

// Environment configuration schema
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default(3000),
  
  // API Configuration
  API_TIMEOUT: z.string().transform((val) => parseInt(val, 10)).default(30000),
  MAX_REQUEST_SIZE: z.string().transform((val) => parseInt(val, 10)).default(1048576), // 1MB
  RATE_LIMIT_MAX: z.string().transform((val) => parseInt(val, 10)).default(100),
  RATE_LIMIT_WINDOW: z.string().transform((val) => parseInt(val, 10)).default(900000), // 15 minutes
  
  // Performance Configuration
  MAX_ITERATIONS: z.string().transform((val) => parseInt(val, 10)).default(50000),
  MEMORY_LIMIT_MB: z.string().transform((val) => parseInt(val, 10)).default(512),
  
  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  
  // Health Check Configuration
  HEALTH_CHECK_TIMEOUT: z.string().transform((val) => parseInt(val, 10)).default(5000),
  
  // External Services (placeholder for future)
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  MONITORING_ENDPOINT: z.string().optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

let config: AppConfig | null = null;

/**
 * Get validated application configuration
 */
export function getConfig(): AppConfig {
  if (!config) {
    try {
      config = envSchema.parse(process.env);
    } catch (error) {
      console.error('❌ Invalid environment configuration:', error);
      throw new Error('Invalid environment configuration');
    }
  }
  return config;
}

/**
 * Validate configuration on application startup
 */
export function validateConfig(): boolean {
  try {
    getConfig();
    console.log('✅ Configuration validated successfully');
    return true;
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    return false;
  }
}

// Request validation schemas
export const heavyProcessingSchema = z.object({
  iterations: z.number().min(1).max(50000).default(1000),
  complexity: z.enum(['light', 'medium', 'heavy']).default('medium'),
  timeout: z.number().min(1000).max(300000).optional(), // 1s to 5min
});

export type HeavyProcessingRequest = z.infer<typeof heavyProcessingSchema>;

/**
 * Validate request body against schema
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Invalid request format' };
  }
}

/**
 * Extract safe request information for logging
 */
export function getSafeRequestInfo(request: NextRequest) {
  const config = getConfig();
  
  return {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || 'unknown',
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    contentLength: request.headers.get('content-length') || '0',
    contentType: request.headers.get('content-type') || 'unknown',
    timestamp: new Date().toISOString(),
    maxRequestSize: config.MAX_REQUEST_SIZE,
  };
}
