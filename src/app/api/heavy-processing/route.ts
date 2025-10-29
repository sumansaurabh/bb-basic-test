import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { applyRateLimit, logRequest, getClientIdentifier } from '@/lib/middleware';
import { validateNumber, validateEnum } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { TimeoutError } from '@/lib/errors';

// Heavy server-side processing endpoint
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting for heavy operations
    applyRateLimit(request, 'heavy');
    
    // Log the request
    logRequest(request, { endpoint: 'heavy-processing-get' });
    
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
    
    // Timeout protection
    if (processingTime > 30000) {
      throw new TimeoutError('Processing took too long');
    }
    
    logger.info('Heavy processing completed', {
      processingTime,
      itemsProcessed: heavyData.length,
      clientIp: getClientIdentifier(request),
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
    return errorResponse(error, {
      endpoint: 'heavy-processing-get',
      clientIp: getClientIdentifier(request),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for heavy operations
    applyRateLimit(request, 'heavy');
    
    // Log the request
    logRequest(request, { endpoint: 'heavy-processing-post' });
    
    const startTime = Date.now();
    const body = await request.json();
    
    // Validate input parameters
    const iterations = body.iterations !== undefined 
      ? validateNumber(body.iterations, 'iterations', { min: 1, max: 50000, integer: true })
      : 1000;
    
    const complexity = body.complexity !== undefined
      ? validateEnum(body.complexity, 'complexity', ['light', 'medium', 'heavy'] as const)
      : 'medium';
    
    // Heavy computation based on request
    const results = [];
    const iterationCount = iterations; // Already validated and capped
    
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
    
    logger.info('Heavy processing POST completed', {
      processingTime,
      iterations: iterationCount,
      complexity,
      clientIp: getClientIdentifier(request),
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
    return errorResponse(error, {
      endpoint: 'heavy-processing-post',
      clientIp: getClientIdentifier(request),
    });
  }
}
