import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { Payment } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { BILLING_CONFIG } from '@/lib/billing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: NextRequest) {
  try {
    // Extract and verify token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount } = body;

    // Validate amount
    if (!amount || amount < BILLING_CONFIG.MINIMUM_TOPUP) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Minimum top-up amount is $${BILLING_CONFIG.MINIMUM_TOPUP}` 
        },
        { status: 400 }
      );
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: payload.userId,
        email: payload.email,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store payment record in database
    const db = await getDatabase();
    const paymentsCollection = db.collection<Payment>('payments');

    await paymentsCollection.insertOne({
      userId: new ObjectId(payload.userId),
      amount,
      stripePaymentIntentId: paymentIntent.id,
      status: 'pending',
      metadata: {
        email: payload.email,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
