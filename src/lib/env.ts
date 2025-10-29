/**
 * Environment configuration with validation
 * Ensures all required environment variables are present and valid
 */

interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  RATE_LIMIT_ENABLED: boolean;
  MAX_REQUEST_SIZE: string;
  API_TIMEOUT_MS: number;
}

/**
 * Parse boolean from environment variable
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Parse number from environment variable
 */
function parseNumber(
  value: string | undefined,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  if (value === undefined) return defaultValue;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`Invalid number for env var, using default: ${defaultValue}`);
    return defaultValue;
  }
  
  if (min !== undefined && parsed < min) {
    console.warn(`Value ${parsed} below minimum ${min}, using minimum`);
    return min;
  }
  
  if (max !== undefined && parsed > max) {
    console.warn(`Value ${parsed} above maximum ${max}, using maximum`);
    return max;
  }
  
  return parsed;
}

/**
 * Validate and parse environment variables
 */
function loadEnvConfig(): EnvConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Validate NODE_ENV
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error(
      `Invalid NODE_ENV: ${nodeEnv}. Must be 'development', 'production', or 'test'`
    );
  }

  const config: EnvConfig = {
    NODE_ENV: nodeEnv as EnvConfig['NODE_ENV'],
    PORT: parseNumber(process.env.PORT, 3000, 1, 65535),
    LOG_LEVEL: (process.env.LOG_LEVEL as EnvConfig['LOG_LEVEL']) || 
      (nodeEnv === 'production' ? 'info' : 'debug'),
    RATE_LIMIT_ENABLED: parseBoolean(
      process.env.RATE_LIMIT_ENABLED,
      nodeEnv === 'production'
    ),
    MAX_REQUEST_SIZE: process.env.MAX_REQUEST_SIZE || '10mb',
    API_TIMEOUT_MS: parseNumber(process.env.API_TIMEOUT_MS, 30000, 1000, 300000),
  };

  // Validate LOG_LEVEL
  const validLogLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(config.LOG_LEVEL)) {
    console.warn(
      `Invalid LOG_LEVEL: ${config.LOG_LEVEL}. Using 'info'. Valid values: ${validLogLevels.join(', ')}`
    );
    config.LOG_LEVEL = 'info';
  }

  return config;
}

// Load and validate configuration on module import
let envConfig: EnvConfig;

try {
  envConfig = loadEnvConfig();
  
  // Log configuration in development
  if (envConfig.NODE_ENV === 'development') {
    console.log('Environment configuration loaded:', {
      ...envConfig,
      // Don't log sensitive values in production
    });
  }
} catch (error) {
  console.error('Failed to load environment configuration:', error);
  process.exit(1);
}

export const env = envConfig;

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if running in test
 */
export const isTest = env.NODE_ENV === 'test';
