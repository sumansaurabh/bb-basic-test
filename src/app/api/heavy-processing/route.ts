/**
 * Heavy server-side processing endpoint with proper error handling,
 * rate limiting, and timeout protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import { RATE_LIMITS } from '@/lib/rate-limiter';
import { withTimeout } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

const MAX_PROCESSING_TIME = 25000; // 25 seconds timeout

export async function GET(request: NextRequest) {
  return withApiMiddleware(
    request,
    async (context) => {
      const startTime = Date.now();

      // Wrap heavy processing with timeout
      const result = await withTimeout(
        processHeavyData(),
        MAX_PROCESSING_TIME,
        'Heavy processing timed out'
      );

      const processingTime = Date.now() - startTime;

      logger.info('Heavy processing completed', {
        requestId: context.requestId,
        processingTime,
        itemsProcessed: result.length,
      });

      return NextResponse.json({
        success: true,
        processingTime,
        itemsProcessed: result.length,
        serverTimestamp: new Date().toISOString(),
        data: result.slice(0, 100), // Return only first 100 items
        serverInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          },
        },
        requestId: context.requestId,
      });
    },
    {
      rateLimit: RATE_LIMITS.HEAVY,
    }
  );
}

async function processHeavyData() {
  const heavyData = [];
  
  // Simulate heavy database operations
  for (let i = 0; i < 10000; i++) {
    // Simulate complex calculations
    const complexResult = Math.sqrt(
      Math.sin(i) * Math.cos(i) * Math.random() * 1000
    );
    
    heavyData.push({
      id: i,
      result: complexResult,
      timestamp: new Date().toISOString(),
      serverLoad: Math.random() * 100,
    });
    
    // Add some delay to simulate real processing
    if (i % 1000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  // Simulate database writes
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return heavyData;
}

export async function POST(request: NextRequest) {
  return withApiMiddleware(
    request,
    async (context) => {
      const startTime = Date.now();

      // Parse and validate request body
      const body = await request.json();
      const { iterations = 1000, complexity = 'medium' } = body;

      // Validate inputs
      const validComplexities = ['light', 'medium', 'heavy'] as const;
      if (!validComplexities.includes(complexity as typeof validComplexities[number])) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: `Invalid complexity. Must be one of: ${validComplexities.join(', ')}`,
              code: 'VALIDATION_ERROR',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        ) as NextResponse;
      }

      if (typeof iterations !== 'number' || iterations < 1 || iterations > 50000) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Iterations must be a number between 1 and 50000',
              code: 'VALIDATION_ERROR',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        ) as NextResponse;
      }

      // Process with timeout protection
      const result = await withTimeout(
        processComplexComputation(iterations, complexity),
        MAX_PROCESSING_TIME,
        'Complex computation timed out'
      );

      const processingTime = Date.now() - startTime;

      logger.info('Complex computation completed', {
        requestId: context.requestId,
        processingTime,
        iterations: result.actualIterations,
        complexity,
      });

      return NextResponse.json({
        success: true,
        processingTime,
        requestedIterations: iterations,
        actualIterations: result.actualIterations,
        complexity,
        serverTimestamp: new Date().toISOString(),
        results: result.results.slice(0, 50), // Return sample results
        serverStats: {
          memoryUsage: {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          },
          uptime: Math.round(process.uptime()),
        },
        requestId: context.requestId,
      }) as NextResponse;
    },
    {
      rateLimit: RATE_LIMITS.HEAVY,
    }
  );
}

async function processComplexComputation(
  iterations: number,
  complexity: string
): Promise<{ actualIterations: number; results: Array<{ iteration: number; result: number; complexity: string }> }> {
  const results = [];
  const iterationCount = Math.min(iterations, 50000); // Cap to prevent server overload

  for (let i = 0; i < iterationCount; i++) {
    let computation = 0;

    switch (complexity) {
      case 'light':
        computation = Math.random() * i;
        break;
      case 'medium':
        computation = Math.sin(i) * Math.cos(i) * Math.sqrt(i + 1);
        break;
      case 'heavy':
        computation = Math.sin(i) * Math.cos(i) * Math.sqrt(i + 1) * Math.log(i + 1);
        for (let j = 0; j < 100; j++) {
          computation += Math.random() * j;
        }
        break;
      default:
        computation = Math.random();
    }

    results.push({
      iteration: i,
      result: computation,
      complexity,
    });

    // Periodic delay for heavy operations
    if (complexity === 'heavy' && i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  return { actualIterations: iterationCount, results };
}
