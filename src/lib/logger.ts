/**
 * Structured logging utility with different log levels
 * Provides consistent logging format across the application
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  requestId?: string;
  userId?: string;
  path?: string;
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.minLevel = this.getMinLogLevel();
  }

  private getMinLogLevel(): LogLevel {
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
      case 'fatal':
        return LogLevel.FATAL;
      default:
        return this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const currentLevelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.minLevel);
    return currentLevelIndex >= minLevelIndex;
  }

  private formatLogEntry(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Human-readable format for development
      const parts = [
        `[${entry.timestamp}]`,
        `[${entry.level.toUpperCase()}]`,
        entry.requestId ? `[${entry.requestId}]` : '',
        entry.message,
      ].filter(Boolean);

      let output = parts.join(' ');

      if (entry.context && Object.keys(entry.context).length > 0) {
        output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
      }

      if (entry.error) {
        output += `\n  Error: ${entry.error.message}`;
        if (entry.error.stack) {
          output += `\n  Stack: ${entry.error.stack}`;
        }
      }

      return output;
    } else {
      // JSON format for production (easier to parse by log aggregators)
      return JSON.stringify(entry);
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as Error & { code?: string }).code,
      };
    }

    const formattedLog = this.formatLogEntry(entry);

    // Output to appropriate console method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedLog);
        break;
    }

    // In production, you might want to send logs to external service
    if (!this.isDevelopment && (level === LogLevel.ERROR || level === LogLevel.FATAL)) {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(_entry: LogEntry): void {
    // Placeholder for external logging service integration
    // Examples: Sentry, DataDog, CloudWatch, etc.
    // This prevents the app from crashing if external service fails
    try {
      // TODO: Implement external logging service integration
      // Example: await fetch('https://logs.example.com/api/logs', { ... })
    } catch (error) {
      // Silently fail - don't let logging errors crash the app
      console.error('Failed to send log to external service:', error);
    }
  }

  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  public fatal(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  /**
   * Create a child logger with additional context
   */
  public child(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private defaultContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context };
  }

  public debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  public info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  public warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    this.parent.error(message, error, this.mergeContext(context));
  }

  public fatal(message: string, error?: Error, context?: LogContext): void {
    this.parent.fatal(message, error, this.mergeContext(context));
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for child logger
export type { ChildLogger };
