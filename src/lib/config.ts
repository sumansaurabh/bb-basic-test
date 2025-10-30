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
  maxRequestSize: string;
}

class ConfigValidator {
  private config: AppConfig;

  constructor() {
    this.config = this.loadAndValidate();
  }

  private getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  private getEnvVarOptional(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  private parseBoolean(value: string): boolean {
    return value.toLowerCase() === 'true' || value === '1';
  }

  private parseNumber(value: string, fieldName: string): number {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(`${fieldName} must be a valid number, got: ${value}`);
    }
    return num;
  }

  private loadAndValidate(): AppConfig {
    try {
      const nodeEnv = this.getEnvVarOptional('NODE_ENV', 'development');
      
      // Validate NODE_ENV
      if (!['development', 'production', 'test'].includes(nodeEnv)) {
        throw new Error(
          `NODE_ENV must be one of: development, production, test. Got: ${nodeEnv}`
        );
      }

      const config: AppConfig = {
        nodeEnv: nodeEnv as 'development' | 'production' | 'test',
        port: this.parseNumber(
          this.getEnvVarOptional('PORT', '3000'),
          'PORT'
        ),
        logLevel: this.getEnvVarOptional('LOG_LEVEL', 'info'),
        apiTimeout: this.parseNumber(
          this.getEnvVarOptional('API_TIMEOUT', '30000'),
          'API_TIMEOUT'
        ),
        rateLimitEnabled: this.parseBoolean(
          this.getEnvVarOptional('RATE_LIMIT_ENABLED', 'true')
        ),
        corsOrigins: this.getEnvVarOptional('CORS_ORIGINS', '*')
          .split(',')
          .map((origin) => origin.trim()),
        maxRequestSize: this.getEnvVarOptional('MAX_REQUEST_SIZE', '10mb'),
      };

      // Validate ranges
      if (config.port < 1 || config.port > 65535) {
        throw new Error(`PORT must be between 1 and 65535, got: ${config.port}`);
      }

      if (config.apiTimeout < 1000) {
        throw new Error(
          `API_TIMEOUT must be at least 1000ms, got: ${config.apiTimeout}`
        );
      }

      logger.info('Configuration loaded successfully', {
        nodeEnv: config.nodeEnv,
        port: config.port,
        logLevel: config.logLevel,
        rateLimitEnabled: config.rateLimitEnabled,
      });

      return config;
    } catch (error) {
      logger.fatal('Failed to load configuration', error as Error);
      throw error;
    }
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
