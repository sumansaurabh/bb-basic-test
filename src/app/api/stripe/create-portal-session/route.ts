import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import type { PortalSessionRequest, PortalSessionResponse } from '@/types/stripe';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.' },
        { status: 500 }
      );
    }

    const body: PortalSessionRequest = await request.json();
    const { customerId, returnUrl } = body;

    // Validate required fields
    if (!customerId || !returnUrl) {
      return NextResponse.json(
        { error: 'Customer ID and return URL are required' },
        { status: 400 }
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    const response: PortalSessionResponse = {
      url: session.url,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create portal session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
