import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getDatabase, COLLECTIONS } from '@/lib/mongodb';
import Stripe from 'stripe';

// Disable body parsing for webhook
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  const db = await getDatabase();

  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update payment status in database
        await db.collection(COLLECTIONS.PAYMENTS).updateOne(
          { stripePaymentIntentId: paymentIntent.id },
          {
            $set: {
              status: 'succeeded',
              paymentMethod: paymentIntent.payment_method as string,
              updatedAt: new Date(),
            },
          }
        );
        
        console.log('Payment succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update payment status in database
        await db.collection(COLLECTIONS.PAYMENTS).updateOne(
          { stripePaymentIntentId: paymentIntent.id },
          {
            $set: {
              status: 'failed',
              updatedAt: new Date(),
            },
          }
        );
        
        console.log('Payment failed:', paymentIntent.id);
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update payment status in database
        await db.collection(COLLECTIONS.PAYMENTS).updateOne(
          { stripePaymentIntentId: paymentIntent.id },
          {
            $set: {
              status: 'canceled',
              updatedAt: new Date(),
            },
          }
        );
        
        console.log('Payment canceled:', paymentIntent.id);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Type assertion for subscription fields
        const subData = subscription as unknown as {
          id: string;
          status: string;
          current_period_start: number;
          current_period_end: number;
          cancel_at_period_end: boolean;
        };
        
        // Update subscription in database
        await db.collection(COLLECTIONS.SUBSCRIPTIONS).updateOne(
          { stripeSubscriptionId: subscription.id },
          {
            $set: {
              status: subscription.status,
              currentPeriodStart: new Date(subData.current_period_start * 1000),
              currentPeriodEnd: new Date(subData.current_period_end * 1000),
              cancelAtPeriodEnd: subData.cancel_at_period_end,
              updatedAt: new Date(),
            },
          }
        );
        
        console.log('Subscription updated:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update subscription status to canceled
        await db.collection(COLLECTIONS.SUBSCRIPTIONS).updateOne(
          { stripeSubscriptionId: subscription.id },
          {
            $set: {
              status: 'canceled',
              updatedAt: new Date(),
            },
          }
        );
        
        console.log('Subscription deleted:', subscription.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Log successful invoice payment
        console.log('Invoice payment succeeded:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Type assertion for invoice with subscription field
        const invoiceData = invoice as unknown as {
          id: string;
          subscription?: string;
        };
        
        // Handle failed invoice payment
        if (invoiceData.subscription) {
          await db.collection(COLLECTIONS.SUBSCRIPTIONS).updateOne(
            { stripeSubscriptionId: invoiceData.subscription },
            {
              $set: {
                status: 'past_due',
                updatedAt: new Date(),
              },
            }
          );
        }
        
        console.log('Invoice payment failed:', invoice.id);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
