import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getDatabase } from '@/lib/mongodb';
import { Payment, Transaction, User } from '@/lib/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'No signature provided' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ success: true, received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const db = await getDatabase();
  const paymentsCollection = db.collection<Payment>('payments');
  const usersCollection = db.collection<User>('users');
  const transactionsCollection = db.collection<Transaction>('transactions');

  // Find payment record
  const payment = await paymentsCollection.findOne({
    stripePaymentIntentId: paymentIntent.id,
  });

  if (!payment) {
    console.error('Payment record not found:', paymentIntent.id);
    return;
  }

  // Update payment status
  await paymentsCollection.updateOne(
    { _id: payment._id },
    {
      $set: {
        status: 'succeeded',
        updatedAt: new Date(),
      },
    }
  );

  // Add credits to user account
  const creditAmount = payment.amount;
  await usersCollection.updateOne(
    { _id: payment.userId },
    {
      $inc: { credits: creditAmount },
      $set: { updatedAt: new Date() },
    }
  );

  // Create transaction record
  await transactionsCollection.insertOne({
    userId: payment.userId,
    amount: creditAmount,
    type: 'topup',
    description: `Credit top-up via Stripe`,
    stripePaymentId: paymentIntent.id,
    status: 'completed',
    createdAt: new Date(),
  });

  console.log(`Payment succeeded: ${paymentIntent.id}, Credits added: $${creditAmount}`);
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const db = await getDatabase();
  const paymentsCollection = db.collection<Payment>('payments');

  // Update payment status
  await paymentsCollection.updateOne(
    { stripePaymentIntentId: paymentIntent.id },
    {
      $set: {
        status: 'failed',
        updatedAt: new Date(),
      },
    }
  );

  console.log(`Payment failed: ${paymentIntent.id}`);
}
