import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export const PRICING = {
  MINIMUM_PURCHASE: 5.00,
  SANDBOX_DAILY_RATE: 2.00, // $2 per day
  SANDBOX_HOURLY_RATE: 0.85, // $0.85 per hour
  JOBS_PER_DAY: 5, // Free jobs per day
} as const;