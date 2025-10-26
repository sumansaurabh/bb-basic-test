// Configuration management with validation
import { z } from 'zod';
import { safeJSONParse } from './error-handling';
import { logger } from './logging';

// Environment schema validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  
  // API Configuration
  API_RATE_LIMIT: z.coerce.number().default(100),
  API_TIMEOUT_MS: z.coerce.number().default(30000),
  MAX_REQUEST_SIZE_MB: z.coerce.number().default(10),
  
  // Database Configuration (optional)
  DATABASE_URL: z.string().url().optional(),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),
  DATABASE_TIMEOUT_MS: z.coerce.number().default(5000),
  
  // Security Configuration
  SESSION_SECRET: z.string().min(32).optional(),
  JWT_SECRET: z.string().min(32).optional(),
  CORS_ORIGINS: z.string().default('*'),
  
  // Monitoring Configuration
  HEALTH_CHECK_INTERVAL_MS: z.coerce.number().default(30000),
  METRICS_ENABLED: z.string().optional().transform((val) => val === 'true').default(false),
  
  // External Services
  REDIS_URL: z.string().url().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  
  // Feature Flags
  ENABLE_HEAVY_PROCESSING: z.string().optional().transform((val) => val === 'true').default(true),
  ENABLE_RATE_LIMITING: z.string().optional().transform((val) => val === 'true').default(true),
});

export type AppConfig = z.infer<typeof envSchema>;

class ConfigManager {
  private config: AppConfig;
  private isValidated: boolean = false;

  constructor() {
    this.config = this.loadAndValidateConfig();
  }

  private loadAndValidateConfig(): AppConfig {
    try {
      // Load environment variables
      const rawEnv = { ...process.env };
      
      // Parse and validate
      const result = envSchema.safeParse(rawEnv);
      
      if (!result.success) {
        logger.error('Configuration validation failed', {
          errors: result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code
          }))
        });
        
        throw new Error(`Configuration validation failed: ${result.error.message}`);
      }

      this.isValidated = true;
      logger.info('Configuration loaded and validated successfully', {
        environment: result.data.NODE_ENV,
        logLevel: result.data.LOG_LEVEL,
        port: result.data.PORT
      });

      return result.data;
    } catch (error) {
      logger.error('Failed to load configuration', { error });
      throw error;
    }
  }

  // Getters for configuration values
  get env(): AppConfig['NODE_ENV'] {
    return this.config.NODE_ENV;
  }

  get isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  get isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  get isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  get port(): number {
    return this.config.PORT;
  }

  get logLevel(): AppConfig['LOG_LEVEL'] {
    return this.config.LOG_LEVEL;
  }

  // API Configuration
  get api() {
    return {
      rateLimit: this.config.API_RATE_LIMIT,
      timeoutMs: this.config.API_TIMEOUT_MS,
      maxRequestSizeMb: this.config.MAX_REQUEST_SIZE_MB,
    };
  }

  // Database Configuration
  get database() {
    return {
      url: this.config.DATABASE_URL,
      poolSize: this.config.DATABASE_POOL_SIZE,
      timeoutMs: this.config.DATABASE_TIMEOUT_MS,
    };
  }

  // Security Configuration
  get security() {
    return {
      sessionSecret: this.config.SESSION_SECRET,
      jwtSecret: this.config.JWT_SECRET,
      corsOrigins: this.parseCorsOrigins(this.config.CORS_ORIGINS),
    };
  }

  // Monitoring Configuration
  get monitoring() {
    return {
      healthCheckIntervalMs: this.config.HEALTH_CHECK_INTERVAL_MS,
      metricsEnabled: this.config.METRICS_ENABLED,
    };
  }

  // External Services Configuration
  get externalServices() {
    return {
      redisUrl: this.config.REDIS_URL,
      smtp: {
        host: this.config.SMTP_HOST,
        port: this.config.SMTP_PORT,
      },
    };
  }

  // Feature Flags
  get features() {
    return {
      enableHeavyProcessing: this.config.ENABLE_HEAVY_PROCESSING,
      enableRateLimiting: this.config.ENABLE_RATE_LIMITING,
    };
  }

  // Utility methods
  private parseCorsOrigins(origins: string): string[] {
    if (origins === '*') return ['*'];
    return origins.split(',').map(origin => origin.trim()).filter(Boolean);
  }

  // Get raw config (for debugging)
  getRawConfig(): AppConfig {
    return { ...this.config };
  }

  // Validate specific configuration section
  validateSection<T>(
    section: keyof AppConfig,
    validator: (value: AppConfig[typeof section]) => T
  ): T {
    try {
      return validator(this.config[section]);
    } catch (error) {
      logger.error(`Configuration validation failed for section: ${String(section)}`, { error });
      throw error;
    }
  }

  // Reload configuration (for development)
  reload(): void {
    logger.info('Reloading configuration...');
    this.config = this.loadAndValidateConfig();
    logger.info('Configuration reloaded successfully');
  }

  // Configuration health check
  healthCheck(): { status: 'healthy' | 'unhealthy'; issues: string[] } {
    const issues: string[] = [];

    if (!this.isValidated) {
      issues.push('Configuration not validated');
    }

    // Check required secrets in production
    if (this.isProduction) {
      if (!this.config.SESSION_SECRET) {
        issues.push('SESSION_SECRET not configured for production');
      }
      if (!this.config.JWT_SECRET) {
        issues.push('JWT_SECRET not configured for production');
      }
    }

    // Check database configuration if URL is provided
    if (this.config.DATABASE_URL) {
      try {
        new URL(this.config.DATABASE_URL);
      } catch {
        issues.push('Invalid DATABASE_URL format');
      }
    }

    // Check Redis configuration if URL is provided
    if (this.config.REDIS_URL) {
      try {
        new URL(this.config.REDIS_URL);
      } catch {
        issues.push('Invalid REDIS_URL format');
      }
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'unhealthy',
      issues
    };
  }
}

// Create and export singleton instance
export const config = new ConfigManager();

// Helper function to get environment variable with fallback
export function getEnvVar(
  key: string, 
  fallback?: string,
  type: 'string' | 'number' | 'boolean' | 'json' = 'string'
): string | number | boolean | unknown {
  const value = process.env[key] ?? fallback;
  
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }

  switch (type) {
    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
      }
      return num;
    
    case 'boolean':
      if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
        throw new Error(`Environment variable ${key} must be a boolean, got: ${value}`);
      }
      return ['true', '1'].includes(value.toLowerCase());
    
    case 'json':
      return safeJSONParse(value, null);
    
    default:
      return value;
  }
}

// Validation helper for required environment variables
export function requireEnvVar(key: string, type: 'string' | 'number' | 'boolean' = 'string'): string | number | boolean {
  return getEnvVar(key, undefined, type) as string | number | boolean;
}
