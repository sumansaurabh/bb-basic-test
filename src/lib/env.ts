/**
 * Environment variable validation and configuration
 */

import { logger } from './logger';

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  logLevel: string;
  apiTimeout: number;
  maxRequestSize: string;
  enableRateLimit: boolean;
}

/**
 * Validates and returns application configuration
 */
export function validateEnv(): AppConfig {
  const config: AppConfig = {
    nodeEnv: (process.env.NODE_ENV as AppConfig['nodeEnv']) || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    apiTimeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
    maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
  };

  // Validate port
  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    logger.warn('Invalid PORT environment variable, using default 3000', {
      providedPort: process.env.PORT,
    });
    config.port = 3000;
  }

  // Validate API timeout
  if (isNaN(config.apiTimeout) || config.apiTimeout < 1000) {
    logger.warn('Invalid API_TIMEOUT environment variable, using default 30000ms', {
      providedTimeout: process.env.API_TIMEOUT,
    });
    config.apiTimeout = 30000;
  }

  logger.info('Environment configuration loaded', {
    nodeEnv: config.nodeEnv,
    port: config.port,
    apiTimeout: config.apiTimeout,
    enableRateLimit: config.enableRateLimit,
  });

  return config;
}

// Export validated config
export const appConfig = validateEnv();
