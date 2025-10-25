/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { 
  withErrorHandler, 
  withTimeout,
  ValidationError,
  circuitBreakers 
} from '@/lib/errors';
import { 
  withRateLimit, 
  withRequestSizeLimit, 
  withSecurityHeaders,
  combineMiddleware 
} from '@/lib/middleware';
import {
  createRequestLogger,
  logRequestStart,
  logRequestComplete,
  logPerformanceMetrics
} from '@/lib/logger';
import { 
  validateRequestBody, 
  heavyProcessingSchema,
  getSafeRequestInfo,
  getConfig 
} from '@/lib/config';

type Logger = any;
type Config = any;

async function heavyProcessingHandler(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestLogger: Logger = createRequestLogger(request);
  const config: Config = getConfig();
  
  // Log request start
  logRequestStart(request, requestLogger, { operation: 'heavy-processing' });

  if (request.method === 'GET') {
    return handleGETRequest(requestLogger, startTime);
  } else if (request.method === 'POST') {
    return handlePOSTRequest(request, requestLogger, startTime, config);
  } else {
    throw new ValidationError(`Method ${request.method} not allowed`);
  }
}

async function handleGETRequest(requestLogger: Logger, startTime: number): Promise<NextResponse> {
  // Use circuit breaker for heavy operations
  const result = await circuitBreakers.heavyProcessing.execute(async () => {
    requestLogger.info('Starting GET heavy processing');
    
    // Simulate heavy database operations with timeout
    const heavyData = await withTimeout(
      performHeavyComputation(10000),
      30000, // 30 second timeout
      'Heavy GET computation'
    );
    
    requestLogger.info('Completed GET heavy processing', {
      itemsProcessed: heavyData.length,
      duration: Date.now() - startTime
    });
    
    return heavyData;
  });

  // Log performance metrics
  const processingTime = Date.now() - startTime;
  logPerformanceMetrics('heavy-processing-get', processingTime, {
    itemsProcessed: result.length,
  });

  const response = {
    success: true,
    processingTime,
    itemsProcessed: result.length,
    serverTimestamp: new Date().toISOString(),
    data: result.slice(0, 100), // Return only first 100 items
    serverInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    },
    circuitBreakerStatus: circuitBreakers.heavyProcessing.getState(),
  };

  return NextResponse.json(response);
}

async function handlePOSTRequest(
  request: NextRequest, 
  requestLogger: Logger, 
  startTime: number, 
  config: Config
): Promise<NextResponse> {
  let requestBody: any;
  
  try {
    const bodyText = await request.text();
    const parseResult = JSON.parse(bodyText);
    requestBody = parseResult;
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body');
  }

  // Validate request body
  const validation = validateRequestBody(heavyProcessingSchema, requestBody);
  if (!validation.success) {
    throw new ValidationError(`Invalid request parameters: ${validation.error}`);
  }

  const { iterations, complexity, timeout } = validation.data;

  // Apply configuration limits
  const safeIterations = Math.min(iterations, config.MAX_ITERATIONS);
  const operationTimeout = timeout || config.API_TIMEOUT;

  requestLogger.info('Starting POST heavy processing', {
    requestedIterations: iterations,
    safeIterations,
    complexity,
    timeout: operationTimeout,
  });

  // Validate parameters are within safe bounds
  if (iterations > config.MAX_ITERATIONS) {
    requestLogger.warn('Iteration count exceeded maximum', {
      requested: iterations,
      maximum: config.MAX_ITERATIONS,
      applied: safeIterations,
    });
  }

  // Use circuit breaker for heavy operations
  const results = await circuitBreakers.heavyProcessing.execute(async () => {
    return withTimeout(
      performHeavyComputationWithParams(safeIterations, complexity),
      operationTimeout,
      `Heavy POST computation with ${safeIterations} iterations`
    );
  });

  const processingTime = Date.now() - startTime;
  
  // Log completion
  requestLogger.info('Completed POST heavy processing', {
    actualIterations: safeIterations,
    complexity,
    duration: processingTime,
    resultsCount: results.length,
  });

  // Log performance metrics
  logPerformanceMetrics('heavy-processing-post', processingTime, {
    iterations: safeIterations,
    complexity,
    resultsCount: results.length,
  });

  const response = {
    success: true,
    processingTime,
    requestedIterations: iterations,
    actualIterations: safeIterations,
    complexity,
    serverTimestamp: new Date().toISOString(),
    results: results.slice(0, 50), // Return sample results
    serverStats: {
      cpuUsage: Math.random() * 100, // Placeholder - in real app, get actual CPU usage
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    },
    circuitBreakerStatus: circuitBreakers.heavyProcessing.getState(),
    warnings: iterations > config.MAX_ITERATIONS ? 
      [`Iteration count capped at ${config.MAX_ITERATIONS} for safety`] : [],
  };

  return NextResponse.json(response);
}

async function performHeavyComputation(count: number): Promise<any[]> {
  const heavyData: any[] = [];
  
  for (let i = 0; i < count; i++) {
    // Simulate complex calculations with proper error handling
    try {
      const complexResult = Math.sqrt(
        Math.sin(i) * Math.cos(i) * Math.random() * 1000
      );
      
      if (!Number.isFinite(complexResult)) {
        throw new Error(`Invalid computation result at iteration ${i}`);
      }
      
      heavyData.push({
        id: i,
        result: complexResult,
        timestamp: new Date().toISOString(),
        serverLoad: Math.random() * 100,
      });
      
      // Add some delay and memory pressure relief
      if (i % 1000 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
        // Allow garbage collection
        if (global.gc) {
          global.gc();
        }
      }
    } catch (error) {
      // Log error but continue processing
      console.error(`Computation error at iteration ${i}:`, error);
      continue;
    }
  }
  
  return heavyData;
}

async function performHeavyComputationWithParams(
  iterations: number, 
  complexity: string
): Promise<any[]> {
  const results: any[] = [];
  
  for (let i = 0; i < iterations; i++) {
    try {
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
      
      if (!Number.isFinite(computation)) {
        throw new Error(`Invalid computation result at iteration ${i}`);
      }
      
      results.push({
        iteration: i,
        result: computation,
        complexity,
        timestamp: new Date().toISOString(),
      });
      
      // Memory management and performance throttling
      if (complexity === 'heavy' && i % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
        
        // Check memory usage and throttle if needed
        const memoryUsage = process.memoryUsage();
        if (memoryUsage.heapUsed > 400 * 1024 * 1024) { // 400MB
          await new Promise(resolve => setTimeout(resolve, 10));
          if (global.gc) {
            global.gc();
          }
        }
      }
    } catch (error) {
      console.error(`Computation error at iteration ${i}:`, error);
      continue;
    }
  }
  
  return results;
}

// Apply all middleware layers
export const GET = combineMiddleware(
  withSecurityHeaders,
  withRateLimit,
  withErrorHandler
)(heavyProcessingHandler);

export const POST = combineMiddleware(
  withSecurityHeaders,
  withRequestSizeLimit,
  withRateLimit,
  withErrorHandler
)(heavyProcessingHandler);
