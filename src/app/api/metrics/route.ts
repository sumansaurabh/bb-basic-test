import { NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/monitoring';
import { logger } from '@/lib/logger';

/**
 * Metrics endpoint
 * Returns performance metrics for monitoring
 */
export async function GET() {
  try {
    const operationNames = performanceMonitor.getOperationNames();
    const stats: Record<string, unknown> = {};

    for (const name of operationNames) {
      const operationStats = performanceMonitor.getStats(name);
      if (operationStats) {
        stats[name] = {
          count: operationStats.count,
          average: Math.round(operationStats.average),
          min: operationStats.min,
          max: operationStats.max,
          p95: operationStats.p95,
        };
      }
    }

    const response = {
      timestamp: new Date().toISOString(),
      operations: stats,
      summary: {
        totalOperations: operationNames.length,
        totalMetrics: operationNames.reduce(
          (sum, name) => sum + (performanceMonitor.getStats(name)?.count || 0),
          0
        ),
      },
    };

    logger.debug('Metrics retrieved', {
      operationCount: operationNames.length,
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    logger.error('Failed to retrieve metrics', error as Error);

    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
