import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { formatErrorResponse, TimeoutError } from '@/lib/errors';
import { rateLimiter, RateLimitConfigs, getRequestIdentifier } from '@/lib/rate-limiter';
import { Validator } from '@/lib/validation';

// Heavy server-side processing endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    // Rate limiting
    const identifier = getRequestIdentifier(request);
    rateLimiter.check(identifier, RateLimitConfigs.HEAVY_PROCESSING);
    
    logger.info('Heavy processing GET started', { requestId, identifier });
  
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
  
  // Check for timeout (30 seconds max)
  if (processingTime > 30000) {
    throw new TimeoutError('Processing took too long');
  }
  
  logger.info('Heavy processing GET completed', { 
    requestId, 
    processingTime, 
    itemsProcessed: heavyData.length 
  });
  
  return NextResponse.json({
    success: true,
    requestId,
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
    logger.error('Heavy processing GET error', error as Error, { requestId });
    
    const errorResponse = formatErrorResponse(
      error as Error,
      '/api/heavy-processing',
      process.env.NODE_ENV === 'development'
    );

    return NextResponse.json(errorResponse, { 
      status: errorResponse.error.statusCode 
    });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    // Rate limiting
    const identifier = getRequestIdentifier(request);
    rateLimiter.check(identifier, RateLimitConfigs.HEAVY_PROCESSING);
    
    logger.info('Heavy processing POST started', { requestId, identifier });
    
    const body = await request.json();
    const { iterations = 1000, complexity = 'medium' } = body;
    
    // Validate input
    if (iterations !== undefined) {
      Validator.isNumber(iterations, 'iterations');
      Validator.isPositive(iterations, 'iterations');
      Validator.inRange(iterations, 1, 50000, 'iterations');
    }
    
    if (complexity !== undefined) {
      Validator.isString(complexity, 'complexity');
      Validator.isOneOf(complexity, ['light', 'medium', 'heavy'], 'complexity');
    }
    
    // Heavy computation based on request
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
    
    const processingTime = Date.now() - startTime;
    
    // Check for timeout (30 seconds max)
    if (processingTime > 30000) {
      throw new TimeoutError('Processing took too long');
    }
    
    logger.info('Heavy processing POST completed', { 
      requestId, 
      processingTime, 
      iterations: iterationCount,
      complexity 
    });
    
    return NextResponse.json({
      success: true,
      requestId,
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
    logger.error('Heavy processing POST error', error as Error, { requestId });
    
    const errorResponse = formatErrorResponse(
      error as Error,
      '/api/heavy-processing',
      process.env.NODE_ENV === 'development'
    );

    return NextResponse.json(errorResponse, { 
      status: errorResponse.error.statusCode 
    });
  }
}
