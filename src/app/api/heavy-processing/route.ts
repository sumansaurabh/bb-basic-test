import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { handleApiError, withTimeout } from '@/lib/error-handler';
import { rateLimiter, getClientIdentifier } from '@/lib/rate-limiter';

// Configuration
const MAX_ITEMS = 10000;
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const RATE_LIMIT = 10; // requests per window
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

// Heavy server-side processing endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const clientId = getClientIdentifier(request);

  try {
    // Rate limiting
    if (rateLimiter.isRateLimited(clientId, RATE_LIMIT, RATE_LIMIT_WINDOW_MS)) {
      const info = rateLimiter.getRateLimitInfo(clientId, RATE_LIMIT, RATE_LIMIT_WINDOW_MS);
      logger.warn('Rate limit exceeded', { clientId, endpoint: 'GET /api/heavy-processing' });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((info.resetTime - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((info.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(RATE_LIMIT),
            'X-RateLimit-Remaining': String(info.remaining),
            'X-RateLimit-Reset': String(info.resetTime),
          },
        }
      );
    }

    logger.info('Heavy processing GET started', { clientId });
  
    // Wrap heavy processing with timeout
    const result = await withTimeout(
      processHeavyData(),
      REQUEST_TIMEOUT_MS,
      'heavy-processing-GET'
    );

    const processingTime = Date.now() - startTime;
    logger.logPerformance('heavy-processing-GET', processingTime, { 
      clientId,
      itemsProcessed: result.length,
    });

    const info = rateLimiter.getRateLimitInfo(clientId, RATE_LIMIT, RATE_LIMIT_WINDOW_MS);

    return NextResponse.json(
      {
        success: true,
        processingTime,
        itemsProcessed: result.length,
        serverTimestamp: new Date().toISOString(),
        data: result.slice(0, 100), // Return only first 100 items
        serverInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage(),
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': String(info.remaining),
          'X-RateLimit-Reset': String(info.resetTime),
        },
      }
    );
  } catch (error) {
    return handleApiError(error, 'GET /api/heavy-processing');
  }
}

async function processHeavyData() {
  const heavyData = [];
  
  for (let i = 0; i < MAX_ITEMS; i++) {
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
  const startTime = Date.now();
  const clientId = getClientIdentifier(request);
  
  try {
    // Rate limiting
    if (rateLimiter.isRateLimited(clientId, RATE_LIMIT, RATE_LIMIT_WINDOW_MS)) {
      const info = rateLimiter.getRateLimitInfo(clientId, RATE_LIMIT, RATE_LIMIT_WINDOW_MS);
      logger.warn('Rate limit exceeded', { clientId, endpoint: 'POST /api/heavy-processing' });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((info.resetTime - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((info.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(RATE_LIMIT),
            'X-RateLimit-Remaining': String(info.remaining),
            'X-RateLimit-Reset': String(info.resetTime),
          },
        }
      );
    }

    logger.info('Heavy processing POST started', { clientId });

    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { iterations = 1000, complexity = 'medium' } = body;

    // Validate iterations
    if (typeof iterations !== 'number' || iterations < 1 || iterations > 50000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'iterations must be a number between 1 and 50000',
          field: 'iterations',
        },
        { status: 400 }
      );
    }

    // Validate complexity
    const validComplexities = ['light', 'medium', 'heavy'];
    if (!validComplexities.includes(complexity)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `complexity must be one of: ${validComplexities.join(', ')}`,
          field: 'complexity',
        },
        { status: 400 }
      );
    }
    
    // Wrap heavy computation with timeout
    const results = await withTimeout(
      performComputation(iterations, complexity),
      REQUEST_TIMEOUT_MS,
      'heavy-processing-POST'
    );
    
    const processingTime = Date.now() - startTime;
    logger.logPerformance('heavy-processing-POST', processingTime, { 
      clientId,
      iterations,
      complexity,
    });

    const info = rateLimiter.getRateLimitInfo(clientId, RATE_LIMIT, RATE_LIMIT_WINDOW_MS);
    
    return NextResponse.json(
      {
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
      },
      {
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': String(info.remaining),
          'X-RateLimit-Reset': String(info.resetTime),
        },
      }
    );
    
  } catch (error) {
    return handleApiError(error, 'POST /api/heavy-processing');
  }
}

async function performComputation(iterations: number, complexity: string) {
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
  
  return results;
}
