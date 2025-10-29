/**
 * Readiness probe endpoint for Kubernetes/container orchestration
 * Returns 200 when the application is ready to accept traffic
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Add checks for dependencies (database, external services, etc.)
  // For now, we'll just check if the process is running
  
  const isReady = process.uptime() > 5; // Wait at least 5 seconds after startup

  if (!isReady) {
    return NextResponse.json(
      {
        status: 'not_ready',
        message: 'Application is still starting up',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      status: 'ready',
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}

export async function HEAD() {
  const isReady = process.uptime() > 5;
  return new NextResponse(null, { status: isReady ? 200 : 503 });
}
