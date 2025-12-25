import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { Sandbox, User } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { BILLING_CONFIG } from '@/lib/billing';

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

    // Check if user already has a running sandbox
    const existingSandbox = await sandboxesCollection.findOne({
      userId: new ObjectId(payload.userId),
      status: 'running',
    });

    if (existingSandbox) {
      return NextResponse.json(
        { success: false, error: 'You already have a running sandbox' },
        { status: 400 }
      );
    }

    // Check user's credit balance
    const user = await usersCollection.findOne({ _id: new ObjectId(payload.userId) });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has sufficient credits (at least $0.10 to start)
    if (user.credits < 0.1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient credits. Please top up your account.',
          credits: user.credits,
        },
        { status: 402 }
      );
    }

    // Create new sandbox
    const newSandbox: Sandbox = {
      userId: new ObjectId(payload.userId),
      startTime: new Date(),
      status: 'running',
      billingRate: {
        hourly: BILLING_CONFIG.HOURLY_RATE,
        daily: BILLING_CONFIG.DAILY_RATE,
      },
      totalCost: 0,
      machineSpecs: BILLING_CONFIG.MACHINE_SPECS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await sandboxesCollection.insertOne(newSandbox);

    return NextResponse.json({
      success: true,
      message: 'Sandbox started successfully',
      sandbox: {
        id: result.insertedId,
        startTime: newSandbox.startTime,
        status: newSandbox.status,
        billingRate: newSandbox.billingRate,
        machineSpecs: newSandbox.machineSpecs,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Start sandbox error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start sandbox' },
      { status: 500 }
    );
  }
}
