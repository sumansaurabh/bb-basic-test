/**
 * Environment configuration with validation
 * Ensures all required environment variables are present and valid
 */

import { logger } from './logger';

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  logLevel: string;
  apiTimeout: number;
  rateLimitEnabled: boolean;
  corsOrigins: string[];
  maxRequestSize: string;
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
      maxRequestSize: this.getString('MAX_REQUEST_SIZE', '10mb'),
    };
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Validate node environment
    if (!['development', 'production', 'test'].includes(this.config.nodeEnv)) {
      errors.push(`Invalid NODE_ENV: ${this.config.nodeEnv}`);
    }

    // Validate port
    if (this.config.port < 1 || this.config.port > 65535) {
      errors.push(`Invalid PORT: ${this.config.port}. Must be between 1 and 65535`);
    }

    // Validate API timeout
    if (this.config.apiTimeout < 1000 || this.config.apiTimeout > 300000) {
      errors.push(`Invalid API_TIMEOUT: ${this.config.apiTimeout}. Must be between 1000 and 300000ms`);
    }

    // Validate log level
    const validLogLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
    if (!validLogLevels.includes(this.config.logLevel.toLowerCase())) {
      errors.push(`Invalid LOG_LEVEL: ${this.config.logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
    }

    if (errors.length > 0) {
      const errorMessage = `Configuration validation failed:\n${errors.join('\n')}`;
      logger.fatal(errorMessage);
      throw new Error(errorMessage);
    }

    logger.info('Configuration loaded and validated successfully', {
      nodeEnv: this.config.nodeEnv,
      port: this.config.port,
      logLevel: this.config.logLevel,
      rateLimitEnabled: this.config.rateLimitEnabled,
    });
  }

  private getNodeEnv(): 'development' | 'production' | 'test' {
    const env = process.env.NODE_ENV?.toLowerCase() || 'development';
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
    return isNaN(parsed) ? defaultValue : parsed;
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
    return value.split(',').map(item => item.trim()).filter(Boolean);
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

  /**
   * Get a specific config value
   */
  public getValue<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  /**
   * Check if a feature is enabled
   */
  public isFeatureEnabled(feature: string): boolean {
    const key = `FEATURE_${feature.toUpperCase()}_ENABLED`;
    return this.getBoolean(key, false);
  }

  /**
   * Get all config as a safe object (no sensitive data)
   */
  public getSafeConfig(): Partial<AppConfig> {
    return {
      nodeEnv: this.config.nodeEnv,
      port: this.config.port,
      logLevel: this.config.logLevel,
      rateLimitEnabled: this.config.rateLimitEnabled,
      // Don't expose sensitive configuration
    };
  }
}

// Export singleton instance
export const config = new ConfigManager();

/**
 * Helper to check if running in development
 */
export const isDevelopment = () => config.isDevelopment();

/**
 * Helper to check if running in production
 */
export const isProduction = () => config.isProduction();

/**
 * Helper to check if running in test
 */
export const isTest = () => config.isTest();
