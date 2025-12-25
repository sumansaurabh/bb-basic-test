import { NextRequest, NextResponse } from 'next/server';
import { stripe, getOrCreateStripeCustomer, SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { getDatabase, COLLECTIONS } from '@/lib/mongodb';
import { createSubscriptionDocument } from '@/models/Subscription';
import { createCustomerDocument } from '@/models/Customer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, planType, priceId } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!planType || !SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS]) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(email, name);

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent', 'latest_invoice'],
      metadata: {
        planType,
        customerEmail: email,
      },
    });

    // Get database
    const db = await getDatabase();

    // Save or update customer in MongoDB
    const existingCustomer = await db
      .collection(COLLECTIONS.CUSTOMERS)
      .findOne({ stripeCustomerId: customer.id });

    if (!existingCustomer) {
      const customerDocument = createCustomerDocument({
        stripeCustomerId: customer.id,
        email,
        name,
      });
      await db.collection(COLLECTIONS.CUSTOMERS).insertOne(customerDocument);
    }

    // Save subscription to MongoDB
    const plan = SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS];
    
    // Type assertion for subscription with expanded fields
    const subscriptionData = subscription as unknown as {
      id: string;
      status: string;
      current_period_start: number;
      current_period_end: number;
      cancel_at_period_end: boolean;
    };
    
    const subscriptionDocument = createSubscriptionDocument({
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customer.id,
      customerEmail: email,
      planType: planType as 'basic' | 'pro' | 'enterprise',
      status: subscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing',
      currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
      currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
      cancelAtPeriodEnd: subscriptionData.cancel_at_period_end,
      priceId,
      amount: plan.price,
      currency: 'usd',
    });

    await db.collection(COLLECTIONS.SUBSCRIPTIONS).insertOne(subscriptionDocument);

    // Extract client secret from the subscription
    const invoice = subscription.latest_invoice as { payment_intent?: { client_secret?: string } };
    const clientSecret = invoice?.payment_intent?.client_secret;

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret,
      customerId: customer.id,
      status: subscription.status,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
