import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { PRICING } from '@/lib/stripe';

const JWT_SECRET = process.env.JWT_SECRET!;

// In-memory storage for sandbox sessions (in production, use Redis or database)
const activeSandboxes = new Map<string, { startTime: Date; userId: string }>();

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has sufficient credits
    if (user.credits < PRICING.SANDBOX_HOURLY_RATE) {
      return NextResponse.json(
        { error: 'Insufficient credits. Minimum required: $' + PRICING.SANDBOX_HOURLY_RATE },
        { status: 400 }
      );
    }

    // Check daily job limit (5 jobs per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // For now, we'll track jobs in memory. In production, store in database
    const userJobsToday = Array.from(activeSandboxes.values())
      .filter(session => session.userId === user._id.toString())
      .length;

    if (userJobsToday >= PRICING.JOBS_PER_DAY) {
      return NextResponse.json(
        { error: `Daily job limit reached (${PRICING.JOBS_PER_DAY} jobs per day)` },
        { status: 400 }
      );
    }

    // Start sandbox session
    const sessionId = `sandbox_${user._id}_${Date.now()}`;
    activeSandboxes.set(sessionId, {
      startTime: new Date(),
      userId: user._id.toString(),
    });

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Sandbox started successfully',
      creditsRemaining: user.credits,
    });

  } catch (error) {
    console.error('Sandbox start error:', error);
    return NextResponse.json(
      { error: 'Failed to start sandbox' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Find and validate session
    const session = activeSandboxes.get(sessionId);
    if (!session || session.userId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 404 }
      );
    }

    // Calculate billing
    const endTime = new Date();
    const durationMs = endTime.getTime() - session.startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    // Calculate cost (minimum 1 hour or actual usage)
    const hoursToBill = Math.max(1, Math.ceil(durationHours));
    const cost = hoursToBill * PRICING.SANDBOX_HOURLY_RATE;

    // Update user credits
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.credits < cost) {
      return NextResponse.json(
        { error: 'Insufficient credits to complete session' },
        { status: 400 }
      );
    }

    user.credits -= cost;
    await user.save();

    // Remove session
    activeSandboxes.delete(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Sandbox stopped successfully',
      duration: `${hoursToBill} hours`,
      cost: cost,
      creditsRemaining: user.credits,
    });

  } catch (error) {
    console.error('Sandbox stop error:', error);
    return NextResponse.json(
      { error: 'Failed to stop sandbox' },
      { status: 500 }
    );
  }
}