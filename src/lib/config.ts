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
  rateLimitEnabled: boolean;
  corsOrigins: string[];
}

class ConfigValidator {
  private config: AppConfig;

  constructor() {
    this.config = this.loadAndValidate();
  }

  private loadAndValidate(): AppConfig {
    const errors: string[] = [];

    // Node environment
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (!['development', 'production', 'test'].includes(nodeEnv)) {
      errors.push('NODE_ENV must be one of: development, production, test');
    }

    // Port
    const port = parseInt(process.env.PORT || '3000', 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('PORT must be a valid port number (1-65535)');
    }

    // Log level
    const logLevel = process.env.LOG_LEVEL || 'info';
    const validLogLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
    if (!validLogLevels.includes(logLevel.toLowerCase())) {
      errors.push(`LOG_LEVEL must be one of: ${validLogLevels.join(', ')}`);
    }

    // API timeout
    const apiTimeout = parseInt(process.env.API_TIMEOUT || '30000', 10);
    if (isNaN(apiTimeout) || apiTimeout < 1000) {
      errors.push('API_TIMEOUT must be at least 1000ms');
    }

    // Rate limiting
    const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';

    // CORS origins
    const corsOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : ['*'];

    if (errors.length > 0) {
      const errorMessage = `Configuration validation failed:\n${errors.join('\n')}`;
      logger.fatal('Configuration validation failed', new Error(errorMessage));
      throw new Error(errorMessage);
    }

    const config: AppConfig = {
      nodeEnv: nodeEnv as 'development' | 'production' | 'test',
      port,
      logLevel,
      apiTimeout,
      rateLimitEnabled,
      corsOrigins,
    };

    // Log configuration in development
    if (nodeEnv === 'development') {
      logger.info('Configuration loaded', {
        nodeEnv: config.nodeEnv,
        port: config.port,
        logLevel: config.logLevel,
        apiTimeout: config.apiTimeout,
        rateLimitEnabled: config.rateLimitEnabled,
      });
    }

    return config;
  }

  public get(): AppConfig {
    return { ...this.config };
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  public isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }
}

// Export singleton instance
export const config = new ConfigValidator();

// Export type
export type { AppConfig };
