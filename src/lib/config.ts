/**
 * Environment configuration with validation
 * Ensures all required environment variables are present and valid
 */

import { logger } from './logger';

interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  logLevel: string;
  apiTimeout: number;
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    enabled: boolean;
    origins: string[];
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
function getEnvNumber(key: string, defaultValue: number): number {
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
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get environment variable as array (comma-separated)
 */
function getEnvArray(key: string, defaultValue: string[]): string[] {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

/**
 * Load and validate configuration
 */
function loadConfig(): AppConfig {
  const nodeEnv = getEnv('NODE_ENV', 'development');
  
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}. Must be development, production, or test.`);
  }

  const config: AppConfig = {
    nodeEnv: nodeEnv as 'development' | 'production' | 'test',
    port: getEnvNumber('PORT', 3000),
    logLevel: getEnv('LOG_LEVEL', nodeEnv === 'development' ? 'debug' : 'info'),
    apiTimeout: getEnvNumber('API_TIMEOUT', 30000), // 30 seconds default
    rateLimit: {
      enabled: getEnvBoolean('RATE_LIMIT_ENABLED', true),
      windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 60000), // 1 minute
      maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 60),
    },
    cors: {
      enabled: getEnvBoolean('CORS_ENABLED', true),
      origins: getEnvArray('CORS_ORIGINS', ['*']),
    },
  };

  return config;
}

/**
 * Validate configuration
 */
function validateConfig(config: AppConfig): void {
  const errors: string[] = [];

  if (config.port < 1 || config.port > 65535) {
    errors.push(`Invalid port: ${config.port}. Must be between 1 and 65535.`);
  }

  if (config.apiTimeout < 1000) {
    errors.push(`API timeout too low: ${config.apiTimeout}ms. Minimum is 1000ms.`);
  }

  if (config.rateLimit.windowMs < 1000) {
    errors.push(`Rate limit window too low: ${config.rateLimit.windowMs}ms. Minimum is 1000ms.`);
  }

  if (config.rateLimit.maxRequests < 1) {
    errors.push(`Rate limit max requests too low: ${config.rateLimit.maxRequests}. Minimum is 1.`);
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

// Load and validate configuration
let config: AppConfig;

try {
  config = loadConfig();
  validateConfig(config);
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
