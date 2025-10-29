/**
 * Environment configuration with validation
 * Ensures all required environment variables are present and valid
 */

import { logger } from './logger';

interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  RATE_LIMIT_ENABLED: boolean;
  MAX_REQUEST_SIZE: string;
  TIMEOUT_MS: number;
}

/**
 * Parse and validate environment variables
 */
function parseEnv(): EnvConfig {
  const errors: string[] = [];

  // NODE_ENV with default
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    errors.push('NODE_ENV must be development, production, or test');
  }

  // PORT with default
  const port = parseInt(process.env.PORT || '3000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid port number (1-65535)');
  }

  // LOG_LEVEL with default
  const logLevel = process.env.LOG_LEVEL || 'info';
  if (!['debug', 'info', 'warn', 'error'].includes(logLevel)) {
    errors.push('LOG_LEVEL must be debug, info, warn, or error');
  }

  // RATE_LIMIT_ENABLED with default
  const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';

  // MAX_REQUEST_SIZE with default
  const maxRequestSize = process.env.MAX_REQUEST_SIZE || '1mb';

  // TIMEOUT_MS with default
  const timeoutMs = parseInt(process.env.TIMEOUT_MS || '30000', 10);
  if (isNaN(timeoutMs) || timeoutMs < 0) {
    errors.push('TIMEOUT_MS must be a positive number');
  }

  if (errors.length > 0) {
    const errorMessage = `Environment validation failed:\n${errors.join('\n')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  return {
    NODE_ENV: nodeEnv as EnvConfig['NODE_ENV'],
    PORT: port,
    LOG_LEVEL: logLevel as EnvConfig['LOG_LEVEL'],
    RATE_LIMIT_ENABLED: rateLimitEnabled,
    MAX_REQUEST_SIZE: maxRequestSize,
    TIMEOUT_MS: timeoutMs,
  };
}

// Parse and export configuration
export const env = parseEnv();

// Log configuration on startup (excluding sensitive data)
if (env.NODE_ENV === 'development') {
  logger.info('Environment configuration loaded', {
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    LOG_LEVEL: env.LOG_LEVEL,
    RATE_LIMIT_ENABLED: env.RATE_LIMIT_ENABLED,
    TIMEOUT_MS: env.TIMEOUT_MS,
  });
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}
