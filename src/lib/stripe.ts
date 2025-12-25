import Stripe from 'stripe';

// Initialize Stripe with a placeholder key during build time if not set
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// Helper function to check if Stripe is properly configured
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder_for_build';
}

// Subscription price IDs - Replace these with your actual Stripe price IDs
export const SUBSCRIPTION_PLANS = {
  basic: {
    priceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
    name: 'Basic Plan',
    price: 9.99,
    interval: 'month',
    features: [
      'Access to basic features',
      'Email support',
      '10 GB storage',
      'Basic analytics',
    ],
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    name: 'Pro Plan',
    price: 29.99,
    interval: 'month',
    features: [
      'All basic features',
      'Priority support',
      '100 GB storage',
      'Advanced analytics',
      'Custom integrations',
    ],
  },
  enterprise: {
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    name: 'Enterprise Plan',
    price: 99.99,
    interval: 'month',
    features: [
      'All pro features',
      '24/7 dedicated support',
      'Unlimited storage',
      'Custom analytics',
      'API access',
      'White-label options',
    ],
  },
};
