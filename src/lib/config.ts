/**
 * Environment configuration with validation
 * Ensures all required environment variables are present and valid
 */

interface Config {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  logLevel: string;
  apiTimeout: number;
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
  monitoring: {
    enabled: boolean;
  };
}

class ConfigValidator {
  private config: Config;

  constructor() {
    this.config = this.loadAndValidate();
  }

  private loadAndValidate(): Config {
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
    const logLevel = process.env.LOG_LEVEL || (nodeEnv === 'development' ? 'debug' : 'info');
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
    const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
    const rateLimitMaxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

    if (isNaN(rateLimitWindowMs) || rateLimitWindowMs < 1000) {
      errors.push('RATE_LIMIT_WINDOW_MS must be at least 1000ms');
    }

    if (isNaN(rateLimitMaxRequests) || rateLimitMaxRequests < 1) {
      errors.push('RATE_LIMIT_MAX_REQUESTS must be at least 1');
    }

    // Monitoring
    const monitoringEnabled = process.env.MONITORING_ENABLED === 'true';

    // If there are validation errors, throw
    if (errors.length > 0) {
      const errorMessage = `Configuration validation failed:\n${errors.join('\n')}`;
      console.error(errorMessage);
      
      // In production, we might want to fail fast
      if (nodeEnv === 'production') {
        throw new Error(errorMessage);
      }
    }

    return {
      nodeEnv: nodeEnv as 'development' | 'production' | 'test',
      port,
      logLevel,
      apiTimeout,
      rateLimit: {
        enabled: rateLimitEnabled,
        windowMs: rateLimitWindowMs,
        maxRequests: rateLimitMaxRequests,
      },
      monitoring: {
        enabled: monitoringEnabled,
      },
    };
  }

  public get(): Config {
    return this.config;
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
export const config = new ConfigValidator().get();

// Export helper functions
export function isDevelopment(): boolean {
  return config.nodeEnv === 'development';
}

export function isProduction(): boolean {
  return config.nodeEnv === 'production';
}

export function isTest(): boolean {
  return config.nodeEnv === 'test';
}
