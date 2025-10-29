import { NextRequest } from 'next/server';
import { successResponse, withErrorHandler } from '@/lib/api-response';
import { rateLimiter, RATE_LIMITS } from '@/lib/rate-limiter';
import { getClientIP } from '@/lib/request-utils';
import { logger } from '@/lib/logger';
import { TimeoutError } from '@/lib/errors';

// Heavy server-side processing endpoint with rate limiting
export const GET = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const clientIP = getClientIP(request);

  // Apply rate limiting
  rateLimiter.check(clientIP, RATE_LIMITS.moderate);

  logger.info('Heavy processing GET request started', { clientIP });
  
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

  // Check for timeout (30 seconds)
  if (processingTime > 30000) {
    throw new TimeoutError('Processing took too long');
  }

  logger.info('Heavy processing GET request completed', {
    clientIP,
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
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const clientIP = getClientIP(request);

  // Apply stricter rate limiting for POST
  rateLimiter.check(clientIP, RATE_LIMITS.strict);

  logger.info('Heavy processing POST request started', { clientIP });

  const body = await request.json();
  const { iterations = 1000, complexity = 'medium' } = body;

  // Validate complexity parameter
  const validComplexities = ['light', 'medium', 'heavy'] as const;
  if (!validComplexities.includes(complexity)) {
    throw new Error(`Invalid complexity. Must be one of: ${validComplexities.join(', ')}`);
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

  // Check for timeout
  if (processingTime > 30000) {
    throw new TimeoutError('Processing took too long');
  }

  logger.info('Heavy processing POST request completed', {
    clientIP,
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
});
