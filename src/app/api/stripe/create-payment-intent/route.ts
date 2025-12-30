import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { getDatabase } from '@/lib/mongodb';
import { CreatePaymentRequest, Payment } from '@/models/Payment';

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentRequest = await request.json();
    const { 
      amount, 
      currency = STRIPE_CONFIG.currency, 
      description = 'Payment',
      customerEmail,
      customerName,
      metadata = {}
    } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount. Amount must be greater than 0.' },
        { status: 400 }
      );
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description,
      metadata: {
        ...metadata,
        customerEmail: customerEmail || '',
        customerName: customerName || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Save payment record to MongoDB
    const db = await getDatabase();
    const paymentsCollection = db.collection<Payment>('payments');
    
    const paymentRecord: Payment = {
      stripePaymentIntentId: paymentIntent.id,
      amount,
      currency,
      status: 'pending',
      customerEmail,
      customerName,
      description,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await paymentsCollection.insertOne(paymentRecord);

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create payment intent' 
      },
      { status: 500 }
    );
  }
}
