import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { formatErrorResponse, TimeoutError } from '@/lib/errors';
import { rateLimiter, RateLimitPresets, getRequestIdentifier } from '@/lib/rate-limiter';
import { validateNumber, validateString } from '@/lib/validation';

// Heavy server-side processing endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const identifier = getRequestIdentifier(request);

  try {
    // Apply rate limiting
    rateLimiter.check(identifier, RateLimitPresets.HEAVY);
    
    logger.logRequest('GET', '/api/heavy-processing', { identifier });
    // Timeout protection (30 seconds max)
    const timeout = 30000;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new TimeoutError('Processing timeout exceeded')), timeout);
    });

    const processingPromise = (async () => {
      // Simulate heavy database operations
      const heavyData = [];
      const maxIterations = 10000;
      
      for (let i = 0; i < maxIterations; i++) {
        // Check if we're approaching timeout
        if (Date.now() - startTime > timeout - 1000) {
          logger.warn('Approaching timeout, stopping early', {
            processedItems: i,
            maxIterations,
          });
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
    
    logger.logPerformance('heavy-processing-GET', processingTime, {
      itemsProcessed: heavyData.length,
    });

    const response = NextResponse.json({
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

    logger.logResponse('GET', '/api/heavy-processing', 200, processingTime);
    return response;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('Heavy processing GET error', error as Error, {
      processingTime,
      identifier,
    });

    const errorResponse = formatErrorResponse(
      error as Error,
      '/api/heavy-processing',
      process.env.NODE_ENV === 'development'
    );

    logger.logResponse(
      'GET',
      '/api/heavy-processing',
      errorResponse.error.statusCode,
      processingTime
    );

    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const identifier = getRequestIdentifier(request);
  
  try {
    // Apply rate limiting
    rateLimiter.check(identifier, RateLimitPresets.HEAVY);
    
    logger.logRequest('POST', '/api/heavy-processing', { identifier });

    const body = await request.json();
    
    // Validate input
    const iterations = body.iterations !== undefined
      ? validateNumber(body.iterations, 'iterations', { min: 1, max: 50000, integer: true })
      : 1000;
    
    const complexity = body.complexity !== undefined
      ? validateString(body.complexity, 'complexity', { enum: ['light', 'medium', 'heavy'] })
      : 'medium';
    
    // Timeout protection (30 seconds max)
    const timeout = 30000;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new TimeoutError('Processing timeout exceeded')), timeout);
    });

    const processingPromise = (async () => {
      // Heavy computation based on request
      const results = [];
      const iterationCount = iterations; // Already validated
      
      for (let i = 0; i < iterationCount; i++) {
        // Check if we're approaching timeout
        if (Date.now() - startTime > timeout - 1000) {
          logger.warn('Approaching timeout, stopping early', {
            processedItems: i,
            requestedIterations: iterationCount,
          });
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
    
    logger.logPerformance('heavy-processing-POST', processingTime, {
      requestedIterations: iterations,
      actualIterations: results.length,
      complexity,
    });

    const response = NextResponse.json({
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

    logger.logResponse('POST', '/api/heavy-processing', 200, processingTime);
    return response;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('Heavy processing POST error', error as Error, {
      processingTime,
      identifier,
    });

    const errorResponse = formatErrorResponse(
      error as Error,
      '/api/heavy-processing',
      process.env.NODE_ENV === 'development'
    );

    logger.logResponse(
      'POST',
      '/api/heavy-processing',
      errorResponse.error.statusCode,
      processingTime
    );

    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}
