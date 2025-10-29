/**
 * Application readiness state management
 * Useful for graceful shutdown and health checks
 */

// Track application readiness state
let isReady = true;

/**
 * Get current readiness state
 */
export function getReadinessState(): boolean {
  return isReady;
}

/**
 * Set readiness state
 * @param ready - Whether the application is ready to accept traffic
 */
export function setReadinessState(ready: boolean): void {
  isReady = ready;
}
