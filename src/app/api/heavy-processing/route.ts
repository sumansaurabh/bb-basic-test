import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { formatErrorResponse, TimeoutError } from '@/lib/errors';
import { rateLimiter, RateLimitPresets, getClientIdentifier } from '@/lib/rate-limiter';
import { validateNumber, validateEnum } from '@/lib/validation';

// Heavy server-side processing endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    rateLimiter.check(clientId, RateLimitPresets.HEAVY);
    
    logger.info('Heavy processing GET request started', { clientId });
  
    // Timeout protection
    const TIMEOUT_MS = 30000; // 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new TimeoutError('Processing timeout exceeded')), TIMEOUT_MS);
    });

    // Simulate heavy database operations
    const processingPromise = (async () => {
      const heavyData = [];
      for (let i = 0; i < 10000; i++) {
        // Check if we're approaching timeout
        if (Date.now() - startTime > TIMEOUT_MS - 1000) {
          logger.warn('Approaching timeout, stopping early', { itemsProcessed: i });
          break;
        }

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
    })();

    const heavyData = await Promise.race([processingPromise, timeoutPromise]) as Array<{
      id: number;
      result: number;
      timestamp: string;
      serverLoad: number;
    }>;
    
    const processingTime = Date.now() - startTime;
    
    logger.info('Heavy processing GET completed', {
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
    logger.error('Heavy processing GET error', error as Error);
    
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
  const startTime = Date.now();
  
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    rateLimiter.check(clientId, RateLimitPresets.HEAVY);
    
    logger.info('Heavy processing POST request started', { clientId });

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    
    // Validate inputs
    const iterations = body.iterations !== undefined 
      ? validateNumber(body.iterations, 'iterations', { min: 1, max: 50000, integer: true })
      : 1000;
    
    const complexity = body.complexity !== undefined
      ? validateEnum(body.complexity, 'complexity', ['light', 'medium', 'heavy'] as const)
      : 'medium';
    
    // Timeout protection
    const TIMEOUT_MS = 30000; // 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new TimeoutError('Processing timeout exceeded')), TIMEOUT_MS);
    });

    // Heavy computation based on request
    const processingPromise = (async () => {
      const results = [];
      const iterationCount = iterations; // Already validated
    
      for (let i = 0; i < iterationCount; i++) {
        // Check if we're approaching timeout
        if (Date.now() - startTime > TIMEOUT_MS - 1000) {
          logger.warn('Approaching timeout, stopping early', { itemsProcessed: i });
          break;
        }

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
      
      return results;
    })();

    const results = await Promise.race([processingPromise, timeoutPromise]) as Array<{
      iteration: number;
      result: number;
      complexity: string;
    }>;
    
    const processingTime = Date.now() - startTime;
    
    logger.info('Heavy processing POST completed', {
      processingTime,
      iterations: results.length,
      complexity,
    });
    
    return NextResponse.json({
      success: true,
      processingTime,
      requestedIterations: iterations,
      actualIterations: results.length,
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
    logger.error('Heavy processing POST error', error as Error);
    
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
