import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { rateLimiter, RATE_LIMITS } from '@/lib/rate-limiter';
import { getClientIp, getRequestMetadata } from '@/lib/request-utils';
import { TimeoutError } from '@/lib/errors';

// Maximum processing time in milliseconds
const MAX_PROCESSING_TIME = 30000; // 30 seconds

// Heavy server-side processing endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(request);
  
  try {
    // Apply rate limiting
    const clientIp = getClientIp(request);
    rateLimiter.check(clientIp, RATE_LIMITS.HEAVY);
    
    logger.info('Heavy processing GET request started', {
      ...metadata,
      endpoint: '/api/heavy-processing',
    });
  
    // Simulate heavy database operations with timeout protection
    const heavyData = [];
    for (let i = 0; i < 10000; i++) {
      // Check for timeout
      if (Date.now() - startTime > MAX_PROCESSING_TIME) {
        throw new TimeoutError('Processing exceeded maximum allowed time');
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
    
    const processingTime = Date.now() - startTime;
    
    logger.info('Heavy processing GET request completed', {
      ...metadata,
      processingTime,
      itemsProcessed: heavyData.length,
    });
    
    return successResponse({
      processingTime,
      itemsProcessed: heavyData.length,
      data: heavyData.slice(0, 100), // Return only first 100 items
      serverInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
      },
    });
  } catch (error) {
    logger.error('Heavy processing GET request failed', error as Error, {
      ...metadata,
      processingTime: Date.now() - startTime,
    });
    return errorResponse(error, metadata);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(request);
  
  try {
    // Apply rate limiting
    const clientIp = getClientIp(request);
    rateLimiter.check(clientIp, RATE_LIMITS.HEAVY);
    
    logger.info('Heavy processing POST request started', {
      ...metadata,
      endpoint: '/api/heavy-processing',
    });
    
    const body = await request.json();
    const { iterations = 1000, complexity = 'medium' } = body;
    
    // Validate input
    const validComplexityLevels = ['light', 'medium', 'heavy'] as const;
    if (!validComplexityLevels.includes(complexity)) {
      logger.warn('Invalid complexity level provided', {
        ...metadata,
        providedComplexity: complexity,
      });
    }
    
    // Heavy computation based on request
    const results = [];
    const iterationCount = Math.min(iterations, 50000); // Cap to prevent server overload
    
    for (let i = 0; i < iterationCount; i++) {
      // Check for timeout
      if (Date.now() - startTime > MAX_PROCESSING_TIME) {
        throw new TimeoutError('Processing exceeded maximum allowed time');
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
    
    const processingTime = Date.now() - startTime;
    
    logger.info('Heavy processing POST request completed', {
      ...metadata,
      processingTime,
      requestedIterations: iterations,
      actualIterations: iterationCount,
      complexity,
    });
    
    return successResponse({
      processingTime,
      requestedIterations: iterations,
      actualIterations: iterationCount,
      complexity,
      results: results.slice(0, 50), // Return sample results
      serverStats: {
        cpuUsage: Math.random() * 100,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
    });
    
  } catch (error) {
    logger.error('Heavy processing POST request failed', error as Error, {
      ...metadata,
      processingTime: Date.now() - startTime,
    });
    return errorResponse(error, metadata);
  }
}
