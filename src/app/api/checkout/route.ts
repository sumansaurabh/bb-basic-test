import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY is not set. Stripe API calls will fail.');
}

const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    if (!stripeSecretKey) {
      return NextResponse.json(
        { success: false, error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { amount = 1999, currency = 'usd', quantity = 1 } = body as {
      amount?: number;
      currency?: string;
      quantity?: number;
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'Extreme Load Tester Pro',
              description: 'Push your systems to the limit with SSR + CSR load testing suite',
            },
            unit_amount: amount,
          },
          quantity,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?status=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?status=cancelled`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
