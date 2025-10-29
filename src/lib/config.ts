/**
 * Environment configuration with validation
 */

import { logger } from './logger';

interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  serviceName: string;
  port: number;
  logLevel: string;
  // Rate limiting
  rateLimitEnabled: boolean;
  // Timeouts
  apiTimeout: number;
  heavyProcessingTimeout: number;
  // Security
  corsEnabled: boolean;
  allowedOrigins: string[];
}

class Config {
  private config: AppConfig;

  constructor() {
    this.config = this.loadAndValidate();
  }

  private loadAndValidate(): AppConfig {
    const nodeEnv = this.validateNodeEnv(process.env.NODE_ENV);
    
    const config: AppConfig = {
      nodeEnv,
      serviceName: process.env.SERVICE_NAME || 'nextjs-app',
      port: this.parseNumber(process.env.PORT, 3000),
      logLevel: process.env.LOG_LEVEL || (nodeEnv === 'production' ? 'info' : 'debug'),
      
      // Rate limiting
      rateLimitEnabled: this.parseBoolean(process.env.RATE_LIMIT_ENABLED, true),
      
      // Timeouts (in milliseconds)
      apiTimeout: this.parseNumber(process.env.API_TIMEOUT, 30000),
      heavyProcessingTimeout: this.parseNumber(process.env.HEAVY_PROCESSING_TIMEOUT, 60000),
      
      // Security
      corsEnabled: this.parseBoolean(process.env.CORS_ENABLED, true),
      allowedOrigins: this.parseArray(process.env.ALLOWED_ORIGINS, ['http://localhost:3000']),
    };

    // Log configuration in development
    if (nodeEnv === 'development') {
      logger.debug('Configuration loaded', { config });
    }

    return config;
  }

  private validateNodeEnv(env?: string): 'development' | 'production' | 'test' {
    const validEnvs = ['development', 'production', 'test'];
    if (env && validEnvs.includes(env)) {
      return env as 'development' | 'production' | 'test';
    }
    return 'development';
  }

  private parseNumber(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private parseArray(value: string | undefined, defaultValue: string[]): string[] {
    if (!value) return defaultValue;
    return value.split(',').map(v => v.trim()).filter(Boolean);
  }

  get(): AppConfig {
    return { ...this.config };
  }

  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }
}

export const config = new Config();
export type { AppConfig };
