import { NextResponse } from 'next/server';

/**
 * Health check endpoint for monitoring and load balancers
 * Returns 200 if the service is healthy
 */
export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '0.1.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };

  return NextResponse.json(healthCheck, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

// HEAD request for simple health checks
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
