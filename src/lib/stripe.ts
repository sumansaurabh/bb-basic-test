import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// Stripe configuration constants
export const STRIPE_CONFIG = {
  currency: 'usd',
  paymentMethodTypes: ['card'],
};

// Subscription plan configurations
export const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Plan',
    price: 999, // $9.99 in cents
    interval: 'month' as Stripe.PriceCreateParams.Recurring.Interval,
    features: [
      'Access to basic features',
      'Email support',
      '5 GB storage',
      'Basic analytics',
    ],
  },
  pro: {
    name: 'Pro Plan',
    price: 2999, // $29.99 in cents
    interval: 'month' as Stripe.PriceCreateParams.Recurring.Interval,
    features: [
      'All basic features',
      'Priority support',
      '50 GB storage',
      'Advanced analytics',
      'Custom integrations',
    ],
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: 9999, // $99.99 in cents
    interval: 'month' as Stripe.PriceCreateParams.Recurring.Interval,
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

// Helper function to format amount for display
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
}

// Helper function to create or retrieve a Stripe customer
export async function getOrCreateStripeCustomer(
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  // Search for existing customer
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      createdAt: new Date().toISOString(),
    },
  });
}

// Helper function to create a product and price for subscriptions
export async function createSubscriptionProduct(
  planKey: keyof typeof SUBSCRIPTION_PLANS
): Promise<{ productId: string; priceId: string }> {
  const plan = SUBSCRIPTION_PLANS[planKey];

  // Create product
  const product = await stripe.products.create({
    name: plan.name,
    description: `${plan.name} subscription`,
    metadata: {
      planKey,
    },
  });

  // Create price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.price,
    currency: STRIPE_CONFIG.currency,
    recurring: {
      interval: plan.interval,
    },
  });

  return {
    productId: product.id,
    priceId: price.id,
  };
}
