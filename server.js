#!/usr/bin/env node

/**
 * Production server with graceful shutdown handling
 * This wrapper ensures proper signal handling for Cloud Run
 */

const { spawn } = require('child_process');

// Track if we're shutting down
let isShuttingDown = false;
let serverProcess = null;

// Start the Next.js server
function startServer() {
  const nodeOptions = process.env.NODE_OPTIONS || '--max-old-space-size=460';
  
  serverProcess = spawn('node', [
    ...nodeOptions.split(' '),
    'node_modules/.bin/next',
    'start'
  ], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: process.env.PORT || '3000',
      NODE_ENV: 'production'
    }
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

  serverProcess.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      console.error(`Server exited unexpectedly with code ${code} and signal ${signal}`);
      process.exit(code || 1);
    }
  });
}

// Graceful shutdown handler
/**
 * Initiates a graceful shutdown of the server upon receiving a signal.
 */
function gracefulShutdown(signal) {
  if (isShuttingDown) {
    return;
  }
  
  isShuttingDown = true;
  console.log(`\nReceived ${signal}, starting graceful shutdown...`);
  
  if (serverProcess) {
    // Give the server 10 seconds to shut down gracefully
    const shutdownTimeout = setTimeout(() => {
      console.log('Forcing shutdown after timeout');
      serverProcess.kill('SIGKILL');
      process.exit(1);
    }, 10000);
    
    // Forward the signal to the child process
    serverProcess.kill(signal);
    
    serverProcess.on('exit', () => {
      clearTimeout(shutdownTimeout);
      console.log('Server shut down gracefully');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle SIGPIPE (broken pipe) - ignore it instead of crashing
process.on('SIGPIPE', () => {
  console.warn('Received SIGPIPE, ignoring...');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  gracefulShutdown('SIGTERM');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Start the server
console.log('Starting Next.js server with graceful shutdown support...');
startServer();
