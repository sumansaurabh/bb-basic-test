/**
 * Structured logging utility for consistent logging across the application
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private serviceName: string;
  private environment: string;

  constructor() {
    this.serviceName = process.env.SERVICE_NAME || 'nextjs-app';
    this.environment = process.env.NODE_ENV || 'development';
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      environment: this.environment,
      message,
      ...context,
    });
  }

  debug(message: string, context?: LogContext) {
    if (this.environment === 'development') {
      console.debug(this.formatLog(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatLog(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatLog(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };
    console.error(this.formatLog(LogLevel.ERROR, message, errorContext));
  }

  // API request logging
  logRequest(method: string, path: string, context?: LogContext) {
    this.info(`${method} ${path}`, {
      type: 'request',
      method,
      path,
      ...context,
    });
  }

  // API response logging
  logResponse(method: string, path: string, statusCode: number, duration: number, context?: LogContext) {
    this.info(`${method} ${path} - ${statusCode}`, {
      type: 'response',
      method,
      path,
      statusCode,
      duration,
      ...context,
    });
  }
}

export const logger = new Logger();
