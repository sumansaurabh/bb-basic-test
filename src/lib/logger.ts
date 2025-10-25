/**
 * Centralized logging utility with structured logging
 * Supports different log levels and formats
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  stack?: string;
  requestId?: string;
  userId?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    this.logLevel = this.getLogLevel();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    switch (envLevel) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        return process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private formatLog(entry: LogEntry): string {
    if (process.env.NODE_ENV === 'development') {
      // Pretty format for development
      const contextStr = entry.context ? JSON.stringify(entry.context, null, 2) : '';
      return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr ? '\nContext: ' + contextStr : ''}${entry.stack ? '\nStack: ' + entry.stack : ''}`;
    } else {
      // JSON format for production
      return JSON.stringify(entry);
    }
  }

  private createLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stack: error?.stack,
      // These would typically come from request context
      requestId: context?.requestId,
      userId: context?.userId,
    };
  }

  public error(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
      console.error(this.formatLog(entry));
      
      // In production, you might want to send to external logging service
      if (process.env.NODE_ENV === 'production') {
        this.sendToExternalLogger(entry);
      }
    }
  }

  public warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry(LogLevel.WARN, message, context);
      console.warn(this.formatLog(entry));
    }
  }

  public info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry(LogLevel.INFO, message, context);
      console.info(this.formatLog(entry));
    }
  }

  public debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
      console.debug(this.formatLog(entry));
    }
  }

  public performance(operation: string, startTime: number, context?: LogContext): void {
    const duration = Date.now() - startTime;
    this.info(`Performance: ${operation}`, {
      ...context,
      duration: `${duration}ms`,
      operation,
    });
  }

  private sendToExternalLogger(entry: LogEntry): void {
    // Placeholder for external logging service (e.g., Datadog, CloudWatch, etc.)
    // This would typically be an async operation
    // Example: await fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions for common logging patterns
export const logApiError = (endpoint: string, error: Error, context?: LogContext) => {
  logger.error(`API Error in ${endpoint}`, {
    endpoint,
    errorMessage: error.message,
    ...context,
  }, error);
};

export const logApiRequest = (method: string, endpoint: string, context?: LogContext) => {
  logger.info(`API Request: ${method} ${endpoint}`, {
    method,
    endpoint,
    ...context,
  });
};

export const logPerformance = (operation: string, startTime: number, context?: LogContext) => {
  logger.performance(operation, startTime, context);
};
