import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { handleApiError, ValidationError } from '@/lib/errors';
import { rateLimiter, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limiter';
import { withTimeout, TIMEOUTS } from '@/lib/timeout';

// Heavy server-side processing endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const clientId = getClientIdentifier(request);

  try {
    // Rate limiting
    rateLimiter.check(clientId, RATE_LIMITS.heavy);
    
    logger.logRequest('GET', '/api/heavy-processing', { clientId });

    // Wrap heavy processing with timeout
    const result = await withTimeout(
      performHeavyProcessing(),
      TIMEOUTS.heavy,
      'Heavy processing operation timed out'
    );

    const processingTime = Date.now() - startTime;
    
    logger.logResponse('GET', '/api/heavy-processing', 200, processingTime, {
      clientId,
      itemsProcessed: result.heavyData.length,
    });

    return NextResponse.json({
      success: true,
      processingTime,
      itemsProcessed: result.heavyData.length,
      serverTimestamp: new Date().toISOString(),
      data: result.heavyData.slice(0, 100), // Return only first 100 items
      serverInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('Heavy processing GET error', error, { clientId, processingTime });
    
    const errorResponse = handleApiError(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.message,
        timestamp: new Date().toISOString(),
        ...errorResponse.context,
      },
      { status: errorResponse.statusCode }
    );
  }
}

async function performHeavyProcessing() {
  // Simulate heavy database operations
  const heavyData = [];
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
  
  return { heavyData };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientId = getClientIdentifier(request);
  
  try {
    // Rate limiting
    rateLimiter.check(clientId, RATE_LIMITS.heavy);
    
    logger.logRequest('POST', '/api/heavy-processing', { clientId });

    const body = await request.json();
    const { iterations = 1000, complexity = 'medium' } = body;

    // Validate input
    if (typeof iterations !== 'number' || iterations < 1) {
      throw new ValidationError('iterations must be a positive number');
    }

    if (!['light', 'medium', 'heavy'].includes(complexity)) {
      throw new ValidationError('complexity must be one of: light, medium, heavy');
    }
    
    // Heavy computation based on request with timeout protection
    const result = await withTimeout(
      performHeavyComputation(iterations, complexity),
      TIMEOUTS.heavy,
      'Heavy computation timed out'
    );

    const processingTime = Date.now() - startTime;
    
    logger.logResponse('POST', '/api/heavy-processing', 200, processingTime, {
      clientId,
      iterations: result.iterationCount,
      complexity,
    });
    
    return NextResponse.json({
      success: true,
      processingTime,
      requestedIterations: iterations,
      actualIterations: result.iterationCount,
      complexity,
      serverTimestamp: new Date().toISOString(),
      results: result.results.slice(0, 50), // Return sample results
      serverStats: {
        cpuUsage: Math.random() * 100,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('Heavy processing POST error', error, { clientId, processingTime });
    
    const errorResponse = handleApiError(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.message,
        timestamp: new Date().toISOString(),
        ...errorResponse.context,
      },
      { status: errorResponse.statusCode }
    );
  }
}

async function performHeavyComputation(iterations: number, complexity: string) {
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
    
    return { results, iterationCount };
}
