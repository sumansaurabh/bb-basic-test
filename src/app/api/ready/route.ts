import { NextResponse } from 'next/server';

/**
 * Readiness check endpoint for Kubernetes/container orchestration
 * Returns 200 when the service is ready to accept traffic
 */
export async function GET() {
  try {
    // Add checks for dependencies here (database, external services, etc.)
    // For now, we'll do basic checks
    
    const memoryUsage = process.memoryUsage();
    const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    // Check if memory usage is too high (>90%)
    if (heapUsedPercent > 90) {
      return NextResponse.json(
        {
          status: 'not_ready',
          reason: 'High memory usage',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // Service is ready
    return NextResponse.json(
      {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          memory: 'ok',
          // Add more checks as needed
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        status: 'not_ready',
        reason: 'Internal error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
