import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getDatabase, COLLECTIONS } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, cancelAtPeriodEnd = true } = body;

    // Validate input
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Cancel or schedule cancellation
    let subscription;
    if (cancelAtPeriodEnd) {
      // Schedule cancellation at period end
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      // Cancel immediately
      subscription = await stripe.subscriptions.cancel(subscriptionId);
    }

    // Update subscription in MongoDB
    const db = await getDatabase();
    await db.collection(COLLECTIONS.SUBSCRIPTIONS).updateOne(
      { stripeSubscriptionId: subscriptionId },
      {
        $set: {
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
