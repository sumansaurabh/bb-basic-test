import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import type { CustomerRequest, CustomerResponse } from '@/types/stripe';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.' },
        { status: 500 }
      );
    }

    const body: CustomerRequest = await request.json();
    const { email, name, metadata } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      const response: CustomerResponse = {
        customerId: customer.id,
        email: customer.email!,
      };
      return NextResponse.json(response);
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: metadata || {},
    });

    const response: CustomerResponse = {
      customerId: customer.id,
      email: customer.email!,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create customer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
