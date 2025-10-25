/**
 * Configuration management with validation and type safety
 */

interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'pretty';
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  enableRedisStore: boolean;
}

interface SecurityConfig {
  corsOrigins: string[];
  enableHelmet: boolean;
  csrfProtection: boolean;
  rateLimiting: RateLimitConfig;
}

interface PerformanceConfig {
  maxRequestSize: string;
  requestTimeout: number;
  compressionEnabled: boolean;
  cacheMaxAge: number;
}

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  host: string;
  database?: DatabaseConfig;
  redis?: RedisConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
  performance: PerformanceConfig;
  apiVersion: string;
  enableMetrics: boolean;
  healthCheck: {
    enabled: boolean;
    interval: number;
  };
}

/**
 * Configuration validation functions
 */
function validateNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  if (isNaN(num)) return defaultValue;
  return num;
}

function validateString(value: string | undefined, defaultValue: string): string {
  return value || defaultValue;
}

function validateBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

function validateEnum<T extends string>(
  value: string | undefined, 
  validValues: T[], 
  defaultValue: T
): T {
  if (!value || !validValues.includes(value as T)) {
    return defaultValue;
  }
  return value as T;
}

/**
 * Load and validate configuration from environment variables
 */
function loadConfig(): AppConfig {
  const nodeEnv = validateEnum(
    process.env.NODE_ENV, 
    ['development', 'test', 'production'], 
    'development'
  );

  // Database configuration (optional)
  const database: DatabaseConfig | undefined = process.env.DATABASE_URL ? {
    host: validateString(process.env.DB_HOST, 'localhost'),
    port: validateNumber(process.env.DB_PORT, 5432),
    username: validateString(process.env.DB_USERNAME, 'postgres'),
    password: validateString(process.env.DB_PASSWORD, ''),
    database: validateString(process.env.DB_NAME, 'app'),
    ssl: validateBoolean(process.env.DB_SSL, nodeEnv === 'production'),
  } : undefined;

  // Redis configuration (optional)
  const redis: RedisConfig | undefined = process.env.REDIS_URL ? {
    host: validateString(process.env.REDIS_HOST, 'localhost'),
    port: validateNumber(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD,
    db: validateNumber(process.env.REDIS_DB, 0),
  } : undefined;

  // Logging configuration
  const logging: LoggingConfig = {
    level: validateEnum(
      process.env.LOG_LEVEL?.toLowerCase() as any,
      ['debug', 'info', 'warn', 'error'],
      nodeEnv === 'development' ? 'debug' : 'info'
    ),
    format: validateEnum(
      process.env.LOG_FORMAT as any,
      ['json', 'pretty'],
      nodeEnv === 'development' ? 'pretty' : 'json'
    ),
    enableConsole: validateBoolean(process.env.LOG_ENABLE_CONSOLE, true),
    enableFile: validateBoolean(process.env.LOG_ENABLE_FILE, nodeEnv === 'production'),
    filePath: process.env.LOG_FILE_PATH,
  };

  // Security configuration
  const security: SecurityConfig = {
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    enableHelmet: validateBoolean(process.env.ENABLE_HELMET, nodeEnv === 'production'),
    csrfProtection: validateBoolean(process.env.CSRF_PROTECTION, nodeEnv === 'production'),
    rateLimiting: {
      windowMs: validateNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), // 15 minutes
      maxRequests: validateNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
      enableRedisStore: validateBoolean(process.env.RATE_LIMIT_REDIS, !!redis),
    },
  };

  // Performance configuration
  const performance: PerformanceConfig = {
    maxRequestSize: validateString(process.env.MAX_REQUEST_SIZE, '10mb'),
    requestTimeout: validateNumber(process.env.REQUEST_TIMEOUT, 30000), // 30 seconds
    compressionEnabled: validateBoolean(process.env.COMPRESSION_ENABLED, true),
    cacheMaxAge: validateNumber(process.env.CACHE_MAX_AGE, 3600), // 1 hour
  };

  return {
    nodeEnv,
    port: validateNumber(process.env.PORT, 3000),
    host: validateString(process.env.HOST, '0.0.0.0'),
    database,
    redis,
    logging,
    security,
    performance,
    apiVersion: validateString(process.env.API_VERSION, 'v1'),
    enableMetrics: validateBoolean(process.env.ENABLE_METRICS, nodeEnv !== 'development'),
    healthCheck: {
      enabled: validateBoolean(process.env.HEALTH_CHECK_ENABLED, true),
      interval: validateNumber(process.env.HEALTH_CHECK_INTERVAL, 30000), // 30 seconds
    },
  };
}

/**
 * Validate configuration for required values
 */
function validateConfig(config: AppConfig): void {
  const errors: string[] = [];

  // Validate port range
  if (config.port < 1 || config.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  // Validate database config if provided
  if (config.database) {
    if (!config.database.password && config.nodeEnv === 'production') {
      errors.push('DB_PASSWORD is required in production');
    }
  }

  // Validate Redis config if provided
  if (config.redis) {
    if (config.redis.port < 1 || config.redis.port > 65535) {
      errors.push('REDIS_PORT must be between 1 and 65535');
    }
  }

  // Validate CORS origins
  if (config.security.corsOrigins.length === 0) {
    errors.push('At least one CORS origin must be specified');
  }

  // Validate file logging path
  if (config.logging.enableFile && !config.logging.filePath) {
    errors.push('LOG_FILE_PATH is required when file logging is enabled');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Create and export configuration singleton
 */
let configInstance: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = loadConfig();
    validateConfig(configInstance);
  }
  return configInstance;
}

/**
 * Reset configuration (useful for testing)
 */
export function resetConfig(): void {
  configInstance = null;
}

/**
 * Configuration helper functions
 */
export const configHelpers = {
  isDevelopment: (): boolean => getConfig().nodeEnv === 'development',
  isProduction: (): boolean => getConfig().nodeEnv === 'production',
  isTest: (): boolean => getConfig().nodeEnv === 'test',
  
  getDatabaseUrl: (): string | undefined => {
    const db = getConfig().database;
    if (!db) return undefined;
    
    const protocol = db.ssl ? 'postgresql' : 'postgres';
    return `${protocol}://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`;
  },
  
  getRedisUrl: (): string | undefined => {
    const redis = getConfig().redis;
    if (!redis) return undefined;
    
    const auth = redis.password ? `:${redis.password}@` : '@';
    return `redis://${auth}${redis.host}:${redis.port}/${redis.db}`;
  },
};

/**
 * Export the config for immediate access
 */
export const config = getConfig();
