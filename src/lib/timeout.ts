/**
 * Timeout utilities for preventing long-running operations
 */

import { TimeoutError } from './errors';

/**
 * Wraps a promise with a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(errorMessage, { timeoutMs }));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Creates an abortable operation with timeout
 */
export function createAbortableOperation(timeoutMs: number): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      controller.abort();
    },
  };
}

/**
 * Default timeout configurations (in milliseconds)
 */
export const TIMEOUTS = {
  // Quick operations (database queries, cache lookups)
  quick: 5000, // 5 seconds
  // Standard API operations
  standard: 30000, // 30 seconds
  // Heavy processing operations
  heavy: 60000, // 60 seconds
  // Maximum allowed timeout
  maximum: 120000, // 2 minutes
};
