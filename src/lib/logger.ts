/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest } from 'next/server';
import { getConfig } from './config';

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  correlationId?: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string | number;
  };
}

class Logger {
  private correlationId: string | null = null;
  private config = getConfig();

  private shouldLog(level: LogLevel): boolean {
    const configLevel = this.getLogLevel(this.config.LOG_LEVEL);
    return level <= configLevel;
  }

  private getLogLevel(level: string): LogLevel {
    switch (level) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private formatLog(entry: LogEntry): string {
    if (this.config.LOG_FORMAT === 'pretty') {
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      const correlation = entry.correlationId ? ` [${entry.correlationId}]` : '';
      return `[${timestamp}] ${entry.level.toUpperCase()}${correlation}: ${entry.message}`;
    }
    return JSON.stringify(entry);
  }

  private createLogEntry(
    level: string,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId || undefined,
    };

    if (metadata) {
      entry.metadata = metadata;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    return entry;
  }

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry('error', message, metadata, error);
    console.error(this.formatLog(entry));
  }

  warn(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry('warn', message, metadata);
    console.warn(this.formatLog(entry));
  }

  info(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry('info', message, metadata);
    console.info(this.formatLog(entry));
  }

  debug(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry('debug', message, metadata);
    console.debug(this.formatLog(entry));
  }

  // Create a child logger with a specific correlation ID
  child(correlationId: string): Logger {
    const childLogger = new Logger();
    childLogger.setCorrelationId(correlationId);
    return childLogger;
  }
}

// Global logger instance
export const logger = new Logger();

/**
 * Generate a correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create a logger instance for a specific request
 */
export function createRequestLogger(request: NextRequest): Logger {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  return logger.child(correlationId);
}

/**
 * Log request start
 */
export function logRequestStart(
  request: NextRequest,
  logger: Logger,
  metadata?: Record<string, any>
): void {
  logger.info('Request started', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    contentType: request.headers.get('content-type'),
    ...metadata,
  });
}

/**
 * Log request completion
 */
export function logRequestComplete(
  request: NextRequest,
  logger: Logger,
  statusCode: number,
  duration: number,
  metadata?: Record<string, any>
): void {
  const level = statusCode >= 400 ? 'warn' : 'info';
  const message = `Request completed with status ${statusCode}`;

  if (level === 'warn') {
    logger.warn(message, {
      method: request.method,
      url: request.url,
      statusCode,
      duration,
      ...metadata,
    });
  } else {
    logger.info(message, {
      method: request.method,
      url: request.url,
      statusCode,
      duration,
      ...metadata,
    });
  }
}

/**
 * Log performance metrics
 */
export function logPerformanceMetrics(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
): void {
  logger.info(`Performance: ${operation}`, {
    operation,
    duration,
    ...metadata,
  });
}

/**
 * Log security events
 */
export function logSecurityEvent(
  event: string,
  request: NextRequest,
  severity: 'low' | 'medium' | 'high' = 'medium',
  metadata?: Record<string, any>
): void {
  logger.warn(`Security event: ${event}`, {
    event,
    severity,
    method: request.method,
    url: request.url,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    userAgent: request.headers.get('user-agent'),
    ...metadata,
  });
}
