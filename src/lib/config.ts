/**
 * Environment configuration with validation
 * Ensures all required environment variables are present and valid
 */

import { logger } from './logger';

interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  logLevel: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  // Add more configuration as needed
  api: {
    timeout: number;
    maxRequestSize: string;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
}

/**
 * Get environment variable with fallback
 */
function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get environment variable as number
 */
function getEnvAsNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
  }
  return parsed;
}

/**
 * Get environment variable as boolean
 */
function getEnvAsBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Validate and load configuration
 */
function loadConfig(): AppConfig {
  const nodeEnv = getEnv('NODE_ENV', 'development') as AppConfig['nodeEnv'];
  
  const config: AppConfig = {
    nodeEnv,
    port: getEnvAsNumber('PORT', 3000),
    logLevel: getEnv('LOG_LEVEL', nodeEnv === 'development' ? 'debug' : 'info'),
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    api: {
      timeout: getEnvAsNumber('API_TIMEOUT', 30000),
      maxRequestSize: getEnv('MAX_REQUEST_SIZE', '10mb'),
    },
    rateLimit: {
      enabled: getEnvAsBoolean('RATE_LIMIT_ENABLED', true),
      windowMs: getEnvAsNumber('RATE_LIMIT_WINDOW_MS', 60000),
      maxRequests: getEnvAsNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    },
  };

  // Validate configuration
  validateConfig(config);

  return config;
}

/**
 * Validate configuration values
 */
function validateConfig(config: AppConfig): void {
  const errors: string[] = [];

  // Validate port
  if (config.port < 1 || config.port > 65535) {
    errors.push(`Invalid port: ${config.port}. Must be between 1 and 65535.`);
  }

  // Validate API timeout
  if (config.api.timeout < 1000 || config.api.timeout > 300000) {
    errors.push(`Invalid API timeout: ${config.api.timeout}. Must be between 1000 and 300000 ms.`);
  }

  // Validate rate limit settings
  if (config.rateLimit.enabled) {
    if (config.rateLimit.windowMs < 1000) {
      errors.push(`Invalid rate limit window: ${config.rateLimit.windowMs}. Must be at least 1000 ms.`);
    }
    if (config.rateLimit.maxRequests < 1) {
      errors.push(`Invalid max requests: ${config.rateLimit.maxRequests}. Must be at least 1.`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

// Load and export configuration
let config: AppConfig;

try {
  config = loadConfig();
  logger.info('Configuration loaded successfully', {
    nodeEnv: config.nodeEnv,
    port: config.port,
    logLevel: config.logLevel,
  });
} catch (error) {
  console.error('Failed to load configuration:', error);
  process.exit(1);
}

export { config };
export type { AppConfig };
