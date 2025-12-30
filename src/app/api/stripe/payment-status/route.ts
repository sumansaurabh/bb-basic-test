import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Payment } from '@/models/Payment';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      return NextResponse.json(
        { success: false, error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const paymentsCollection = db.collection<Payment>('payments');

    const payment = await paymentsCollection.findOne({
      stripePaymentIntentId: paymentIntentId,
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment._id,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        customerEmail: payment.customerEmail,
        customerName: payment.customerName,
        description: payment.description,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
    });

  } catch (error) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch payment status' 
      },
      { status: 500 }
    );
  }
}
