/**
 * Graceful shutdown handler for the application
 */

import { logger } from './logger';
import { rateLimiter } from './rate-limiter';

type ShutdownHandler = () => Promise<void> | void;

class ShutdownManager {
  private handlers: ShutdownHandler[] = [];
  private isShuttingDown = false;

  /**
   * Registers a cleanup handler to be called during shutdown
   */
  register(handler: ShutdownHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Executes all registered shutdown handlers
   */
  async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress, ignoring signal', { signal });
      return;
    }

    this.isShuttingDown = true;
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    try {
      // Execute all handlers in parallel with timeout
      const shutdownPromises = this.handlers.map(async (handler) => {
        try {
          await Promise.race([
            handler(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Handler timeout')), 5000)
            ),
          ]);
        } catch (error) {
          logger.error('Error in shutdown handler', error);
        }
      });

      await Promise.all(shutdownPromises);

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', error);
      process.exit(1);
    }
  }

  /**
   * Sets up signal handlers for graceful shutdown
   */
  setupSignalHandlers(): void {
    // Handle termination signals
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach((signal) => {
      process.on(signal, () => {
        this.shutdown(signal);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', error);
      this.shutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', reason, {
        promise: String(promise),
      });
      this.shutdown('unhandledRejection');
    });

    logger.info('Shutdown handlers registered');
  }
}

// Singleton instance
export const shutdownManager = new ShutdownManager();

/**
 * Initialize graceful shutdown with default handlers
 */
export function initializeGracefulShutdown(): void {
  // Register cleanup for rate limiter
  shutdownManager.register(async () => {
    logger.info('Cleaning up rate limiter...');
    rateLimiter.destroy();
  });

  // Register any other cleanup tasks here
  shutdownManager.register(async () => {
    logger.info('Closing active connections...');
    // Add connection cleanup logic here if needed
  });

  // Setup signal handlers
  shutdownManager.setupSignalHandlers();

  logger.info('Graceful shutdown initialized');
}
