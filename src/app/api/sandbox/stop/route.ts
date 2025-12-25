import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { Sandbox, User, Transaction } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { calculateBillingCost } from '@/lib/billing';

export async function POST(request: NextRequest) {
  try {
    // Extract and verify token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const sandboxesCollection = db.collection<Sandbox>('sandboxes');
    const usersCollection = db.collection<User>('users');
    const transactionsCollection = db.collection<Transaction>('transactions');

    // Find running sandbox
    const sandbox = await sandboxesCollection.findOne({
      userId: new ObjectId(payload.userId),
      status: 'running',
    });

    if (!sandbox) {
      return NextResponse.json(
        { success: false, error: 'No running sandbox found' },
        { status: 404 }
      );
    }

    // Calculate total cost
    const endTime = new Date();
    const totalCost = calculateBillingCost(sandbox.startTime, endTime);

    // Update sandbox status
    await sandboxesCollection.updateOne(
      { _id: sandbox._id },
      {
        $set: {
          status: 'stopped',
          endTime,
          totalCost,
          updatedAt: new Date(),
        },
      }
    );

    // Deduct credits from user
    const updateResult = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(payload.userId) },
      {
        $inc: { credits: -totalCost },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: 'after' }
    );

    if (!updateResult) {
      return NextResponse.json(
        { success: false, error: 'Failed to update user credits' },
        { status: 500 }
      );
    }

    // Create transaction record
    await transactionsCollection.insertOne({
      userId: new ObjectId(payload.userId),
      amount: -totalCost,
      type: 'debit',
      description: `Sandbox usage charge`,
      sandboxId: sandbox._id,
      status: 'completed',
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Sandbox stopped successfully',
      billing: {
        totalCost: parseFloat(totalCost.toFixed(2)),
        duration: {
          start: sandbox.startTime,
          end: endTime,
          milliseconds: endTime.getTime() - sandbox.startTime.getTime(),
        },
        remainingCredits: parseFloat(updateResult.credits.toFixed(2)),
      },
    });

  } catch (error) {
    console.error('Stop sandbox error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to stop sandbox' },
      { status: 500 }
    );
  }
}
