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
function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
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
function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
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
  
  // Validate NODE_ENV
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}. Must be development, production, or test.`);
  }

  const config: AppConfig = {
    nodeEnv,
    port: getEnvNumber('PORT', 3000),
    logLevel: getEnv('LOG_LEVEL', nodeEnv === 'development' ? 'debug' : 'info'),
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    api: {
      timeout: getEnvNumber('API_TIMEOUT', 30000),
      maxRequestSize: getEnv('MAX_REQUEST_SIZE', '10mb'),
    },
    rateLimit: {
      enabled: getEnvBoolean('RATE_LIMIT_ENABLED', true),
      windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
      maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    },
  };

  return config;
}

/**
 * Validate configuration on startup
 */
function validateConfig(config: AppConfig): void {
  const errors: string[] = [];

  // Validate port
  if (config.port < 1 || config.port > 65535) {
    errors.push(`Invalid port: ${config.port}. Must be between 1 and 65535.`);
  }

  // Validate timeout
  if (config.api.timeout < 1000) {
    errors.push(`API timeout too low: ${config.api.timeout}ms. Minimum is 1000ms.`);
  }

  // Validate rate limit
  if (config.rateLimit.enabled) {
    if (config.rateLimit.windowMs < 1000) {
      errors.push(`Rate limit window too low: ${config.rateLimit.windowMs}ms. Minimum is 1000ms.`);
    }
    if (config.rateLimit.maxRequests < 1) {
      errors.push(`Rate limit max requests too low: ${config.rateLimit.maxRequests}. Minimum is 1.`);
    }
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
    rateLimitEnabled: config.rateLimit.enabled,
  });
} catch (error) {
  console.error('Failed to load configuration:', error);
  process.exit(1);
}

export { config };
export type { AppConfig };

/**
 * Get a specific configuration value safely
 */
export function getConfig<K extends keyof AppConfig>(key: K): AppConfig[K] {
  return config[key];
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return config.isDevelopment;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return config.isProduction;
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return config.isTest;
}
