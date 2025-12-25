// Billing configuration
export const BILLING_CONFIG = {
  INITIAL_CREDITS: 5, // $5 initial credits for new users
  MINIMUM_TOPUP: 5, // $5 minimum top-up amount
  HOURLY_RATE: 0.85, // $0.85 per hour
  DAILY_RATE: 2, // $2 per day
  MACHINE_SPECS: {
    cpu: 1,
    memory: 2, // GB
    storage: 8, // GB
  },
};

/**
 * Calculate billing cost based on duration
 * @param startTime - Sandbox start time
 * @param endTime - Sandbox end time (defaults to now)
 * @returns Cost in dollars
 */
export function calculateBillingCost(startTime: Date, endTime: Date = new Date()): number {
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  const durationDays = durationHours / 24;

  // Calculate both hourly and daily rates
  const hourlyCost = durationHours * BILLING_CONFIG.HOURLY_RATE;
  const dailyCost = durationDays * BILLING_CONFIG.DAILY_RATE;

  // Return the lower cost (better deal for user)
  return Math.min(hourlyCost, dailyCost);
}

/**
 * Calculate current cost for a running sandbox
 * @param startTime - Sandbox start time
 * @returns Current cost in dollars
 */
export function calculateCurrentCost(startTime: Date): number {
  return calculateBillingCost(startTime, new Date());
}

/**
 * Format duration in human-readable format
 * @param startTime - Start time
 * @param endTime - End time (defaults to now)
 * @returns Formatted duration string
 */
export function formatDuration(startTime: Date, endTime: Date = new Date()): string {
  const durationMs = endTime.getTime() - startTime.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Check if user has sufficient credits
 * @param currentCredits - User's current credit balance
 * @param requiredAmount - Required amount
 * @returns True if user has sufficient credits
 */
export function hasSufficientCredits(currentCredits: number, requiredAmount: number): boolean {
  return currentCredits >= requiredAmount;
}
