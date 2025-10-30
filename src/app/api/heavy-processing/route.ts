import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { formatErrorResponse } from '@/lib/errors';
import { rateLimiter, RateLimitPresets, getClientIdentifier } from '@/lib/rate-limiter';
import { validateNumber, validateString } from '@/lib/validation';

// Heavy server-side processing endpoint
export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const requestLogger = logger.child({ requestId, path: '/api/heavy-processing' });

  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    rateLimiter.check(clientId, RateLimitPresets.HEAVY);

    requestLogger.info('Heavy processing GET request started');
    
    const startTime = Date.now();
  
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
  
  const processingTime = Date.now() - startTime;
  
  requestLogger.info('Heavy processing GET request completed', {
    processingTime,
    itemsProcessed: heavyData.length,
  });

  return NextResponse.json({
    success: true,
    processingTime,
    itemsProcessed: heavyData.length,
    serverTimestamp: new Date().toISOString(),
    data: heavyData.slice(0, 100), // Return only first 100 items
    serverInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
    },
  });
  } catch (error) {
    requestLogger.error('Heavy processing GET request failed', error as Error);
    
    const errorResponse = formatErrorResponse(
      error as Error,
      '/api/heavy-processing',
      process.env.NODE_ENV === 'development'
    );

    return NextResponse.json(
      errorResponse,
      { status: errorResponse.error.statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const requestLogger = logger.child({ requestId, path: '/api/heavy-processing' });

  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    rateLimiter.check(clientId, RateLimitPresets.HEAVY);

    requestLogger.info('Heavy processing POST request started');

    const startTime = Date.now();
    
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      throw new Error('Invalid JSON in request body');
    }

    const iterations = body.iterations !== undefined 
      ? validateNumber(body.iterations, 'iterations', { min: 1, max: 50000, integer: true })
      : 1000;
    
    const complexity = body.complexity !== undefined
      ? validateString(body.complexity, 'complexity', { enum: ['light', 'medium', 'heavy'] })
      : 'medium';

    requestLogger.info('Processing request', { iterations, complexity });
    
    // Heavy computation based on request
    const results = [];
    const iterationCount = iterations; // Already validated to be <= 50000
    
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
    
    const processingTime = Date.now() - startTime;
    
    requestLogger.info('Heavy processing POST request completed', {
      processingTime,
      iterations: iterationCount,
      complexity,
    });

    return NextResponse.json({
      success: true,
      processingTime,
      requestedIterations: iterations,
      actualIterations: iterationCount,
      complexity,
      serverTimestamp: new Date().toISOString(),
      results: results.slice(0, 50), // Return sample results
      serverStats: {
        cpuUsage: Math.random() * 100,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
    });
    
  } catch (error) {
    requestLogger.error('Heavy processing POST request failed', error as Error);
    
    const errorResponse = formatErrorResponse(
      error as Error,
      '/api/heavy-processing',
      process.env.NODE_ENV === 'development'
    );

    return NextResponse.json(
      errorResponse,
      { status: errorResponse.error.statusCode }
    );
  }
}
