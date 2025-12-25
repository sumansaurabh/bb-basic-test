import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import type { SubscriptionResponse } from '@/types/stripe';

export async function GET(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const subscriptionId = searchParams.get('subscriptionId');

    // Validate subscriptionId
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Retrieve subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Type assertion for current_period_end which exists but may not be in type definition
    const currentPeriodEnd = 'current_period_end' in subscription 
      ? (subscription as Record<string, unknown>).current_period_end as number
      : 0;

    const response: SubscriptionResponse = {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      plan: {
        name: subscription.items.data[0].price.nickname || 'Subscription',
        amount: subscription.items.data[0].price.unit_amount! / 100,
        interval: subscription.items.data[0].price.recurring?.interval || 'month',
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
