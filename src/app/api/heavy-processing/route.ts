import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { formatErrorResponse, TimeoutError } from '@/lib/errors';
import { rateLimiter, getClientIdentifier } from '@/lib/rate-limiter';

// Heavy server-side processing endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const clientId = getClientIdentifier(request);

  // Rate limiting: 10 requests per minute
  const rateLimit = rateLimiter.check(clientId, 10, 60000);
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded', { clientId, endpoint: '/api/heavy-processing' });
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetTime),
        },
      }
    );
  }

  try {
    logger.info('Heavy processing GET request started', { clientId });
  
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

    // Timeout protection
    if (processingTime > 30000) {
      throw new TimeoutError('Processing took too long');
    }

    logger.info('Heavy processing GET request completed', {
      clientId,
      processingTime,
      itemsProcessed: heavyData.length,
    });
    
    return NextResponse.json(
      {
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
      },
      {
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetTime),
        },
      }
    );
  } catch (error) {
    logger.error('Heavy processing GET request failed', error as Error, { clientId });
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientId = getClientIdentifier(request);

  // Rate limiting: 5 POST requests per minute (more restrictive)
  const rateLimit = rateLimiter.check(`${clientId}:POST`, 5, 60000);
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded for POST', { clientId, endpoint: '/api/heavy-processing' });
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetTime),
        },
      }
    );
  }
  
  try {
    logger.info('Heavy processing POST request started', { clientId });

    const body = await request.json();
    
    // Validate and sanitize input
    const iterations = Math.min(Math.max(Number(body.iterations) || 1000, 1), 50000);
    const complexity = ['light', 'medium', 'heavy'].includes(body.complexity) 
      ? body.complexity 
      : 'medium';
    
    // Heavy computation based on request
    const results = [];
    const iterationCount = iterations; // Already validated above
    
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

    // Timeout protection
    if (processingTime > 30000) {
      throw new TimeoutError('Processing took too long');
    }

    logger.info('Heavy processing POST request completed', {
      clientId,
      processingTime,
      iterations: iterationCount,
      complexity,
    });
    
    return NextResponse.json(
      {
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
      },
      {
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetTime),
        },
      }
    );
    
  } catch (error) {
    logger.error('Heavy processing POST request failed', error as Error, { clientId });
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
  }
}
