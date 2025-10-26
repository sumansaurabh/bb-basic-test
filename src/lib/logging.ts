// Enhanced logging utilities with structured logging
import { generateRequestId } from './error-handling';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  component?: string;
  operation?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private component: string;
  private defaultMetadata: Record<string, unknown>;

  constructor(component: string = 'App', defaultMetadata: Record<string, unknown> = {}) {
    this.component = component;
    this.defaultMetadata = defaultMetadata;
  }

  private log(level: LogLevel, message: string, metadata: Record<string, unknown> = {}): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      component: this.component,
      metadata: { ...this.defaultMetadata, ...metadata }
    };

    // Add request ID if available
    if (metadata.requestId && typeof metadata.requestId === 'string') {
      entry.requestId = metadata.requestId;
    }

    // Add user ID if available
    if (metadata.userId && typeof metadata.userId === 'string') {
      entry.userId = metadata.userId;
    }

    // Add operation if available
    if (metadata.operation && typeof metadata.operation === 'string') {
      entry.operation = metadata.operation;
    }

    // Add duration if available
    if (metadata.duration && typeof metadata.duration === 'number') {
      entry.duration = metadata.duration;
    }

    // Handle error objects
    if (metadata.error instanceof Error) {
      entry.error = {
        name: metadata.error.name,
        message: metadata.error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: metadata.error.stack })
      };
    }

    // Output based on environment
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(entry);
    } else {
      this.logStructured(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const color = this.getLogColor(entry.level);
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.component}]`;
    
    console.log(
      `${color}${prefix}${this.resetColor} ${entry.message}`,
      entry.metadata && Object.keys(entry.metadata).length > 0 
        ? entry.metadata 
        : ''
    );

    if (entry.error && entry.error.stack) {
      console.log(`${color}Stack:${this.resetColor}`, entry.error.stack);
    }
  }

  private logStructured(entry: LogEntry): void {
    // In production, log as structured JSON
    console.log(JSON.stringify(entry));
  }

  private getLogColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return '\x1b[31m'; // Red
      case LogLevel.WARN:
        return '\x1b[33m'; // Yellow
      case LogLevel.INFO:
        return '\x1b[36m'; // Cyan
      case LogLevel.DEBUG:
        return '\x1b[35m'; // Magenta
      case LogLevel.TRACE:
        return '\x1b[90m'; // Gray
      default:
        return '\x1b[37m'; // White
    }
  }

  private get resetColor(): string {
    return '\x1b[0m';
  }

  error(message: string, metadata: Record<string, unknown> = {}): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  warn(message: string, metadata: Record<string, unknown> = {}): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  info(message: string, metadata: Record<string, unknown> = {}): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  debug(message: string, metadata: Record<string, unknown> = {}): void {
    if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
      this.log(LogLevel.DEBUG, message, metadata);
    }
  }

  trace(message: string, metadata: Record<string, unknown> = {}): void {
    if (process.env.LOG_LEVEL === 'trace') {
      this.log(LogLevel.TRACE, message, metadata);
    }
  }

  child(component: string, additionalMetadata: Record<string, unknown> = {}): Logger {
    return new Logger(
      `${this.component}:${component}`,
      { ...this.defaultMetadata, ...additionalMetadata }
    );
  }

  // Performance logging utilities
  time(operation: string, metadata: Record<string, unknown> = {}): () => void {
    const start = Date.now();
    const requestId = metadata.requestId || generateRequestId();
    
    this.debug(`Starting operation: ${operation}`, {
      ...metadata,
      operation,
      requestId,
      startTime: start
    });

    return () => {
      const duration = Date.now() - start;
      this.info(`Completed operation: ${operation}`, {
        ...metadata,
        operation,
        requestId,
        duration
      });
    };
  }

  // API request logging
  apiRequest(method: string, path: string, metadata: Record<string, unknown> = {}): Logger {
    const requestId = metadata.requestId || generateRequestId();
    this.info(`API Request: ${method} ${path}`, {
      ...metadata,
      method,
      path,
      requestId
    });

    return this.child('API', { requestId, method, path });
  }

  // Database operation logging
  dbOperation(operation: string, table: string, metadata: Record<string, unknown> = {}): Logger {
    return this.child('DB', { operation, table, ...metadata });
  }

  // External service logging
  externalService(service: string, operation: string, metadata: Record<string, unknown> = {}): Logger {
    return this.child('External', { service, operation, ...metadata });
  }
}

// Create default logger instances
export const logger = new Logger('App');
export const apiLogger = new Logger('API');
export const dbLogger = new Logger('Database');
export const serviceLogger = new Logger('Service');

// Helper function to create component-specific loggers
export function createLogger(component: string, metadata: Record<string, unknown> = {}): Logger {
  return new Logger(component, metadata);
}

// Request correlation middleware helper
export function withRequestLogging<TFunc extends (...args: unknown[]) => unknown>(
  operation: TFunc,
  operationName: string,
  component: string = 'Operation'
): TFunc {
  return ((...args: Parameters<TFunc>) => {
    const requestId = generateRequestId();
    const log = createLogger(component, { requestId });
    const endTimer = log.time(operationName);

    try {
      const result = operation(...args) as ReturnType<TFunc>;

      // Handle promises - check if result is promise-like
      if (result && typeof (result as Record<string, unknown>).then === 'function') {
        return (result as unknown as Promise<unknown>)
          .then((value: unknown) => {
            endTimer();
            return value;
          })
          .catch((error: unknown) => {
            log.error(`Operation failed: ${operationName}`, { error, requestId });
            endTimer();
            throw error;
          });
      }

      endTimer();
      return result;
    } catch (error) {
      log.error(`Operation failed: ${operationName}`, { error, requestId });
      endTimer();
      throw error;
    }
  }) as TFunc;
}
