/**
 * Environment configuration with validation
 * Ensures all required environment variables are present and valid
 */

interface Config {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  logLevel: string;
  apiRateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  security: {
    corsOrigins: string[];
    trustProxy: boolean;
  };
}

function getEnvVarOptional(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getEnvVarNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return num;
}

function validateConfig(): Config {
  const nodeEnv = getEnvVarOptional('NODE_ENV', 'development');
  
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be one of: development, production, test');
  }

  const config: Config = {
    nodeEnv: nodeEnv as 'development' | 'production' | 'test',
    port: getEnvVarNumber('PORT', 3000),
    logLevel: getEnvVarOptional('LOG_LEVEL', nodeEnv === 'production' ? 'info' : 'debug'),
    apiRateLimit: {
      windowMs: getEnvVarNumber('RATE_LIMIT_WINDOW_MS', 60000),
      maxRequests: getEnvVarNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    },
    security: {
      corsOrigins: getEnvVarOptional('CORS_ORIGINS', '*').split(','),
      trustProxy: getEnvVarOptional('TRUST_PROXY', 'false') === 'true',
    },
  };

  return config;
}

// Validate and export config
let config: Config;

try {
  config = validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error);
  process.exit(1);
}

export { config };
