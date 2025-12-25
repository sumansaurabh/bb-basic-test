import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { Sandbox } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { calculateCurrentCost, formatDuration } from '@/lib/billing';

export async function GET(request: NextRequest) {
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

    // Find running sandbox
    const sandbox = await sandboxesCollection.findOne({
      userId: new ObjectId(payload.userId),
      status: 'running',
    });

    if (!sandbox) {
      return NextResponse.json({
        success: true,
        isRunning: false,
        sandbox: null,
      });
    }

    // Calculate current cost
    const currentCost = calculateCurrentCost(sandbox.startTime);
    const duration = formatDuration(sandbox.startTime);

    return NextResponse.json({
      success: true,
      isRunning: true,
      sandbox: {
        id: sandbox._id,
        startTime: sandbox.startTime,
        status: sandbox.status,
        billingRate: sandbox.billingRate,
        machineSpecs: sandbox.machineSpecs,
        currentCost: parseFloat(currentCost.toFixed(2)),
        duration,
      },
    });

  } catch (error) {
    console.error('Get sandbox status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get sandbox status' },
      { status: 500 }
    );
  }
}
