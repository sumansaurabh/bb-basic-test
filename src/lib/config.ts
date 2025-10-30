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

class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): AppConfig {
    return {
      nodeEnv: this.getNodeEnv(),
      port: this.getNumber('PORT', 3000),
      logLevel: this.getString('LOG_LEVEL', 'info'),
      apiTimeout: this.getNumber('API_TIMEOUT', 30000),
      rateLimitEnabled: this.getBoolean('RATE_LIMIT_ENABLED', true),
      corsOrigins: this.getArray('CORS_ORIGINS', ['http://localhost:3000']),
    };
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Validate port
    if (this.config.port < 1 || this.config.port > 65535) {
      errors.push('PORT must be between 1 and 65535');
    }

    // Validate API timeout
    if (this.config.apiTimeout < 1000) {
      errors.push('API_TIMEOUT must be at least 1000ms');
    }

    // Validate log level
    const validLogLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
    if (!validLogLevels.includes(this.config.logLevel.toLowerCase())) {
      errors.push(`LOG_LEVEL must be one of: ${validLogLevels.join(', ')}`);
    }

    if (errors.length > 0) {
      const errorMessage = `Configuration validation failed:\n${errors.join('\n')}`;
      logger.fatal(errorMessage);
      throw new Error(errorMessage);
    }

    logger.info('Configuration loaded successfully', {
      nodeEnv: this.config.nodeEnv,
      port: this.config.port,
      logLevel: this.config.logLevel,
      rateLimitEnabled: this.config.rateLimitEnabled,
    });
  }

  private getNodeEnv(): 'development' | 'production' | 'test' {
    const env = process.env.NODE_ENV?.toLowerCase();
    if (env === 'production' || env === 'test') {
      return env;
    }
    return 'development';
  }

  private getString(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  private getNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }

    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      logger.warn(`Invalid number for ${key}, using default`, {
        value,
        defaultValue,
      });
      return defaultValue;
    }

    return parsed;
  }

  private getBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }

    return value.toLowerCase() === 'true' || value === '1';
  }

  private getArray(key: string, defaultValue: string[]): string[] {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }

    return value.split(',').map((item) => item.trim()).filter(Boolean);
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
export const config = new ConfigManager();

// Export type
export type { AppConfig };
