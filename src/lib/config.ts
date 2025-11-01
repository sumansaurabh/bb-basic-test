import { z } from 'zod';
import { logError, logInfo } from './logger';

// Define the configuration schema with validation
const configSchema = z.object({
  // Node environment
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  
  // Server configuration
  port: z.coerce.number().min(1).max(65535).default(3000),
  host: z.string().default('localhost'),
  
  // Logging configuration
  logLevel: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  
  // Rate limiting configuration
  rateLimitEnabled: z.coerce.boolean().default(true),
  rateLimitMax: z.coerce.number().min(1).default(100),
  rateLimitWindowMs: z.coerce.number().min(1000).default(60000), // 1 minute
  
  // Request timeout configuration
  requestTimeoutMs: z.coerce.number().min(1000).default(30000), // 30 seconds
  
  // Heavy processing limits
  maxIterations: z.coerce.number().min(1).max(100000).default(50000),
  
  // Health check configuration
  healthCheckEnabled: z.coerce.boolean().default(true),
  
  // CORS configuration
  corsEnabled: z.coerce.boolean().default(true),
  corsOrigin: z.string().default('*'),
  
  // Security
  trustProxy: z.coerce.boolean().default(false),
});

export type Config = z.infer<typeof configSchema>;

/**
 * Load and validate environment configuration
 * @returns Validated configuration object
 */
export function loadConfig(): Config {
  try {
    const rawConfig = {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      host: process.env.HOST,
      logLevel: process.env.LOG_LEVEL,
      rateLimitEnabled: process.env.RATE_LIMIT_ENABLED,
      rateLimitMax: process.env.RATE_LIMIT_MAX,
      rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
      requestTimeoutMs: process.env.REQUEST_TIMEOUT_MS,
      maxIterations: process.env.MAX_ITERATIONS,
      healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED,
      corsEnabled: process.env.CORS_ENABLED,
      corsOrigin: process.env.CORS_ORIGIN,
      trustProxy: process.env.TRUST_PROXY,
    };

    const config = configSchema.parse(rawConfig);
    
    logInfo('Configuration loaded successfully', {
      nodeEnv: config.nodeEnv,
      port: config.port,
      logLevel: config.logLevel,
    });

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logError('Configuration validation failed', {
        errors: JSON.stringify(error.issues),
      });
      
      // Return default configuration on validation error
      logInfo('Using default configuration');
      return configSchema.parse({});
    }
    
    logError('Failed to load configuration', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Return default configuration on any error
    return configSchema.parse({});
  }
}

// Export singleton instance
let configInstance: Config | null = null;

export function getConfig(): Config {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

// Export for testing purposes
export function resetConfig(): void {
  configInstance = null;
}

export default getConfig;
