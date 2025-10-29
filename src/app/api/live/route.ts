/**
 * Liveness probe endpoint for Kubernetes/container orchestration
 * Returns 200 when the application is alive (not deadlocked)
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Simple liveness check - if this endpoint responds, the process is alive
  return NextResponse.json(
    {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 }
  );
}
