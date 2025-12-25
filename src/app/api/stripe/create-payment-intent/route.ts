import { NextRequest, NextResponse } from 'next/server';
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe';
import { getDatabase, COLLECTIONS } from '@/lib/mongodb';
import { createPaymentDocument } from '@/models/Payment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'usd', email, name, description } = body;

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(email, name);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: customer.id,
      description: description || 'Custom payment',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customerEmail: email,
        createdAt: new Date().toISOString(),
      },
    });

    // Save payment record to MongoDB
    const db = await getDatabase();
    const paymentDocument = createPaymentDocument({
      stripePaymentIntentId: paymentIntent.id,
      customerId: customer.id,
      customerEmail: email,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'pending',
      description,
      metadata: {
        name: name || '',
      },
    });

    await db.collection(COLLECTIONS.PAYMENTS).insertOne(paymentDocument);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: customer.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
