/**
 * Environment configuration with validation
 * Ensures all required environment variables are present and valid
 */

import { logger } from './logger';

interface Config {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  host: string;
  api: {
    timeoutMs: number;
    maxRequestSize: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
  };
  security: {
    allowedOrigins: string[];
  };
  features: {
    enableHeavyProcessing: boolean;
    enableRateLimiting: boolean;
  };
}

/**
 * Parse environment variable as number with default
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    logger.warn(`Invalid number for ${key}, using default: ${defaultValue}`);
    return defaultValue;
  }
  
  return parsed;
}

/**
 * Parse environment variable as boolean with default
 */
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  return value.toLowerCase() === 'true';
}

/**
 * Parse environment variable as string with default
 */
function getEnvString(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Parse comma-separated environment variable as array
 */
function getEnvArray(key: string, defaultValue: string[]): string[] {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

/**
 * Validate and load configuration
 */
function loadConfig(): Config {
  const nodeEnv = getEnvString('NODE_ENV', 'development');
  
  // Validate NODE_ENV
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}`);
  }

  const config: Config = {
    nodeEnv: nodeEnv as Config['nodeEnv'],
    port: getEnvNumber('PORT', 3000),
    host: getEnvString('HOST', 'localhost'),
    api: {
      timeoutMs: getEnvNumber('API_TIMEOUT_MS', 30000),
      maxRequestSize: getEnvString('MAX_REQUEST_SIZE', '10mb'),
    },
    rateLimit: {
      windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 60000),
      maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    },
    logging: {
      level: getEnvString('LOG_LEVEL', 'info'),
    },
    security: {
      allowedOrigins: getEnvArray('ALLOWED_ORIGINS', ['http://localhost:3000']),
    },
    features: {
      enableHeavyProcessing: getEnvBoolean('ENABLE_HEAVY_PROCESSING', true),
      enableRateLimiting: getEnvBoolean('ENABLE_RATE_LIMITING', true),
    },
  };

  // Log configuration in development
  if (config.nodeEnv === 'development') {
    logger.debug('Configuration loaded', { config });
  }

  return config;
}

/**
 * Singleton configuration instance
 */
export const config = loadConfig();

/**
 * Validate configuration on startup
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (config.port < 1 || config.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  if (config.api.timeoutMs < 1000) {
    errors.push('API_TIMEOUT_MS must be at least 1000ms');
  }

  if (config.rateLimit.windowMs < 1000) {
    errors.push('RATE_LIMIT_WINDOW_MS must be at least 1000ms');
  }

  if (config.rateLimit.maxRequests < 1) {
    errors.push('RATE_LIMIT_MAX_REQUESTS must be at least 1');
  }

  if (errors.length > 0) {
    logger.error('Configuration validation failed', undefined, { errors });
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  logger.info('Configuration validated successfully');
}
