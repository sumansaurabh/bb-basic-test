import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, COLLECTIONS } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const customerId = searchParams.get('customerId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!email && !customerId) {
      return NextResponse.json(
        { error: 'Email or customer ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const query: Record<string, string> = {};

    if (customerId) {
      query.customerId = customerId;
    } else if (email) {
      query.customerEmail = email;
    }

    const payments = await db
      .collection(COLLECTIONS.PAYMENTS)
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      payments,
      count: payments.length,
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}
