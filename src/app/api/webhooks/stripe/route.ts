import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import Stripe from 'stripe';

// Disable body parsing for webhooks
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        // Add your business logic here
        // e.g., update order status, send confirmation email, etc.
        await handlePaymentIntentSucceeded(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent failed:', failedPaymentIntent.id);
        await handlePaymentIntentFailed(failedPaymentIntent);
        break;

      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);
        await handleCheckoutSessionCompleted(session);
        break;

      case 'checkout.session.async_payment_succeeded':
        const asyncSession = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout async payment succeeded:', asyncSession.id);
        await handleCheckoutSessionCompleted(asyncSession);
        break;

      case 'checkout.session.async_payment_failed':
        const failedAsyncSession = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout async payment failed:', failedAsyncSession.id);
        await handleCheckoutSessionFailed(failedAsyncSession);
        break;

      case 'charge.succeeded':
        const charge = event.data.object as Stripe.Charge;
        console.log('Charge succeeded:', charge.id);
        await handleChargeSucceeded(charge);
        break;

      case 'charge.failed':
        const failedCharge = event.data.object as Stripe.Charge;
        console.log('Charge failed:', failedCharge.id);
        await handleChargeFailed(failedCharge);
        break;

      case 'customer.created':
        const customer = event.data.object as Stripe.Customer;
        console.log('Customer created:', customer.id);
        await handleCustomerCreated(customer);
        break;

      case 'invoice.paid':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice paid:', invoice.id);
        await handleInvoicePaid(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment failed:', failedInvoice.id);
        await handleInvoicePaymentFailed(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Error handling webhook event:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Handler functions - implement your business logic here

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // TODO: Implement your business logic
  // e.g., update database, send confirmation email, fulfill order
  console.log('Payment succeeded:', {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    customer: paymentIntent.customer,
    metadata: paymentIntent.metadata,
  });
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  // TODO: Implement your business logic
  // e.g., notify customer, log failure, update order status
  console.log('Payment failed:', {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    last_payment_error: paymentIntent.last_payment_error,
  });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // TODO: Implement your business logic
  // e.g., fulfill order, send receipt, update database
  console.log('Checkout completed:', {
    id: session.id,
    customer: session.customer,
    amount_total: session.amount_total,
    payment_status: session.payment_status,
    customer_details: session.customer_details,
  });
}

async function handleCheckoutSessionFailed(session: Stripe.Checkout.Session) {
  // TODO: Implement your business logic
  console.log('Checkout failed:', {
    id: session.id,
    customer: session.customer,
  });
}

async function handleChargeSucceeded(charge: Stripe.Charge) {
  // TODO: Implement your business logic
  console.log('Charge succeeded:', {
    id: charge.id,
    amount: charge.amount,
    currency: charge.currency,
  });
}

async function handleChargeFailed(charge: Stripe.Charge) {
  // TODO: Implement your business logic
  console.log('Charge failed:', {
    id: charge.id,
    failure_message: charge.failure_message,
  });
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  // TODO: Implement your business logic
  // e.g., sync with your user database
  console.log('Customer created:', {
    id: customer.id,
    email: customer.email,
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // TODO: Implement your business logic
  console.log('Invoice paid:', {
    id: invoice.id,
    customer: invoice.customer,
    amount_paid: invoice.amount_paid,
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // TODO: Implement your business logic
  console.log('Invoice payment failed:', {
    id: invoice.id,
    customer: invoice.customer,
  });
}
