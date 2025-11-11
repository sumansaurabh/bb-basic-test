/**
 * Next.js instrumentation hook for initialization code
 * This runs once when the server starts
 */

import { logger } from './lib/logger';
import { validateEnv } from './lib/env';
import { initializeGracefulShutdown } from './lib/shutdown';

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    logger.info('Initializing server...');

    // Validate environment variables
    try {
      validateEnv();
      logger.info('Environment validation successful');
    } catch (error) {
      logger.error('Environment validation failed', error);
      throw error;
    }

    // Initialize graceful shutdown
    try {
      initializeGracefulShutdown();
      logger.info('Graceful shutdown handlers registered');
    } catch (error) {
      logger.error('Failed to initialize graceful shutdown', error);
    }

    logger.info('Server initialization complete');
  }
}
