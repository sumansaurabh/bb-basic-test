import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { formatErrorResponse, TimeoutError } from '@/lib/errors';
import { rateLimiter, RateLimitPresets, getClientIdentifier } from '@/lib/rate-limiter';
import { validateNumber, validateString } from '@/lib/validation';

// Heavy server-side processing endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = rateLimiter.check(clientId, RateLimitPresets.HEAVY);
    
    if (!rateLimit.allowed) {
      logger.warn('Rate limit exceeded', { clientId, retryAfter: rateLimit.retryAfter });
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: rateLimit.retryAfter,
          },
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter),
            'X-RateLimit-Limit': String(RateLimitPresets.HEAVY.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetTime),
          },
        }
      );
    }
    
    logger.info('Heavy processing GET started', { clientId });
  
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
    processingTime, 
    itemsProcessed: heavyData.length 
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
    return NextResponse.json(errorResponse, { 
      status: errorResponse.error.statusCode 
    });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = rateLimiter.check(clientId, RateLimitPresets.HEAVY);
    
    if (!rateLimit.allowed) {
      logger.warn('Rate limit exceeded', { clientId, retryAfter: rateLimit.retryAfter });
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: rateLimit.retryAfter,
          },
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter),
            'X-RateLimit-Limit': String(RateLimitPresets.HEAVY.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetTime),
          },
        }
      );
    }
    
    logger.info('Heavy processing POST started', { clientId });
    
    const body = await request.json();
    const { iterations = 1000, complexity = 'medium' } = body;
    
    // Validate inputs
    const validatedIterations = validateNumber(iterations, 'iterations', { 
      min: 1, 
      max: 50000, 
      integer: true 
    });
    
    const validatedComplexity = validateString(complexity, 'complexity', {
      enum: ['light', 'medium', 'heavy']
    });
    
    // Heavy computation based on request
    const results = [];
    const iterationCount = validatedIterations;
    
    for (let i = 0; i < iterationCount; i++) {
      let computation = 0;
      
      switch (validatedComplexity) {
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
        complexity: validatedComplexity,
      });
      
      // Periodic delay for heavy operations
      if (validatedComplexity === 'heavy' && i % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      // Check for timeout every 1000 iterations
      if (i % 1000 === 0) {
        const elapsed = Date.now() - startTime;
        if (elapsed > 30000) {
          throw new TimeoutError('Processing took too long');
        }
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    logger.info('Heavy processing POST completed', { 
      processingTime, 
      iterations: iterationCount,
      complexity: validatedComplexity
    });
    
    return NextResponse.json({
      success: true,
      processingTime,
      requestedIterations: validatedIterations,
      actualIterations: iterationCount,
      complexity: validatedComplexity,
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
    return NextResponse.json(errorResponse, { 
      status: errorResponse.error.statusCode 
    });
  }
}
