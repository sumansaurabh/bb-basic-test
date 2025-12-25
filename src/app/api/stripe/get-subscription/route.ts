import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, COLLECTIONS } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const subscriptionId = searchParams.get('subscriptionId');

    if (!email && !subscriptionId) {
      return NextResponse.json(
        { error: 'Email or subscription ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const query: Record<string, string> = {};

    if (subscriptionId) {
      query.stripeSubscriptionId = subscriptionId;
    } else if (email) {
      query.customerEmail = email;
    }

    const subscriptions = await db
      .collection(COLLECTIONS.SUBSCRIPTIONS)
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
