/**
 * Readiness probe endpoint for Kubernetes/container orchestration
 * Returns 200 when the application is ready to accept traffic
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Add any readiness checks here
    // For example: database connection, external service availability, etc.
    
    // Basic readiness check - process is running
    const isReady = process.uptime() > 1; // At least 1 second uptime

    if (isReady) {
      return NextResponse.json(
        {
          ready: true,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ready: false,
        timestamp: new Date().toISOString(),
        reason: 'Application not ready',
      },
      { status: 503 }
    );
  } catch {
    return NextResponse.json(
      {
        ready: false,
        timestamp: new Date().toISOString(),
        error: 'Readiness check failed',
      },
      { status: 503 }
    );
  }
}
