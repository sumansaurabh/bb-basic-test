/**
 * Readiness probe endpoint for Kubernetes/container orchestration
 * Returns 200 when the application is ready to accept traffic
 */

import { NextResponse } from 'next/server';
import { getReadinessState } from '@/lib/readiness';

export async function GET() {
  const isReady = getReadinessState();

  if (!isReady) {
    return NextResponse.json(
      {
        status: 'not ready',
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
