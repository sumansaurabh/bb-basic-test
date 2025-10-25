import { NextRequest, NextResponse } from 'next/server';
import { logger, logApiRequest, logApiError, logPerformance } from '@/lib/logger';
import { AppError, ValidationError, withRetry, CircuitBreaker } from '@/lib/errors';
import { validateBody, commonSchemas } from '@/lib/validation';
import { rateLimiters, createRateLimitMiddleware } from '@/lib/rate-limit';
import { healthChecker } from '@/lib/health';

// Apply rate limiting for heavy operations
const heavyRateLimitMiddleware = createRateLimitMiddleware(rateLimiters.heavy);

// Circuit breaker for heavy operations
const heavyOperationCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  recoveryTime: 30000, // 30 seconds
  timeout: 60000, // 60 seconds
});

// Heavy server-side processing endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Track request
    healthChecker.incrementRequest();
    logApiRequest('GET', '/api/heavy-processing', { userAgent: request.headers.get('user-agent') });

    // Apply rate limiting
    const rateLimitResult = heavyRateLimitMiddleware(request as any);
    if (!rateLimitResult.success) {
      healthChecker.incrementError();
      return rateLimitResult.response!;
    }

    // Execute heavy operation through circuit breaker
    const result = await heavyOperationCircuitBreaker.execute(async () => {
      return await performHeavyOperation(10000, 'medium');
    });

    logger.info('Heavy processing completed', { 
      processingTime: result.processingTime,
      itemsProcessed: result.itemsProcessed 
    });

    logPerformance('heavy-processing-get', startTime, { itemsProcessed: result.itemsProcessed });

    return NextResponse.json(result);
    
  } catch (error) {
    healthChecker.incrementError();
    
    if (error instanceof AppError) {
      logApiError('/api/heavy-processing', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: error.statusCode }
      );
    }
    
    const unexpectedError = error instanceof Error ? error : new Error('Unknown error');
    logApiError('/api/heavy-processing', unexpectedError, { duration: Date.now() - startTime });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Heavy processing failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Track request
    healthChecker.incrementRequest();
    logApiRequest('POST', '/api/heavy-processing', { userAgent: request.headers.get('user-agent') });

    // Apply rate limiting
    const rateLimitResult = heavyRateLimitMiddleware(request as any);
    if (!rateLimitResult.success) {
      healthChecker.incrementError();
      return rateLimitResult.response!;
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateBody(commonSchemas.heavyProcessingRequest)(body);
    
    if (!validation.success) {
      throw new ValidationError('Invalid request parameters', { 
        validationErrors: validation.errors 
      });
    }

    const { iterations, complexity } = validation.data!;

    // Execute heavy operation with retry mechanism
    const result = await withRetry(
      () => heavyOperationCircuitBreaker.execute(() => performHeavyOperation(iterations, complexity)),
      {
        maxAttempts: 3,
        baseDelay: 1000,
        shouldRetry: (error) => !(error instanceof ValidationError),
      }
    );

    logger.info('Heavy processing POST completed', { 
      iterations,
      complexity,
      processingTime: result.processingTime 
    });

    logPerformance('heavy-processing-post', startTime, { 
      iterations, 
      complexity,
      actualIterations: result.actualIterations 
    });

    return NextResponse.json(result);
    
  } catch (error) {
    healthChecker.incrementError();
    
    if (error instanceof AppError) {
      logApiError('/api/heavy-processing', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          context: error.context,
          timestamp: new Date().toISOString()
        },
        { status: error.statusCode }
      );
    }
    
    const unexpectedError = error instanceof Error ? error : new Error('Unknown error');
    logApiError('/api/heavy-processing', unexpectedError, { duration: Date.now() - startTime });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Heavy processing failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Extracted heavy operation function with better error handling
async function performHeavyOperation(iterations: number, complexity: string) {
  const operationStartTime = Date.now();
  
  if (iterations <= 0) {
    throw new ValidationError('Iterations must be a positive number');
  }

  if (!['light', 'medium', 'heavy'].includes(complexity)) {
    throw new ValidationError('Complexity must be light, medium, or heavy');
  }

  // Cap iterations to prevent memory issues
  const safeIterations = Math.min(iterations, 50000);
  
  if (safeIterations !== iterations) {
    logger.warn('Iterations capped for safety', { 
      requested: iterations, 
      actual: safeIterations 
    });
  }

  const heavyData = [];
  let processedCount = 0;

  try {
    for (let i = 0; i < safeIterations; i++) {
      // Simulate complex calculations with bounds checking
      let complexResult = 0;
      
      try {
        switch (complexity) {
          case 'light':
            complexResult = Math.random() * i;
            break;
          case 'medium':
            complexResult = Math.sin(i) * Math.cos(i) * Math.sqrt(Math.max(1, i + 1));
            break;
          case 'heavy':
            complexResult = Math.sin(i) * Math.cos(i) * Math.sqrt(Math.max(1, i + 1)) * Math.log(Math.max(1, i + 1));
            // Controlled inner loop
            for (let j = 0; j < Math.min(100, i); j++) {
              complexResult += Math.random() * j;
            }
            break;
        }

        // Ensure result is finite
        if (!Number.isFinite(complexResult)) {
          complexResult = 0;
        }

        heavyData.push({
          id: i,
          result: complexResult,
          timestamp: new Date().toISOString(),
          serverLoad: Math.random() * 100,
        });

        processedCount++;

        // Periodic yield and memory check
        if (i % 1000 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
          
          // Memory usage check
          const memUsage = process.memoryUsage();
          if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB limit
            logger.warn('Memory usage high, stopping processing', { 
              heapUsed: memUsage.heapUsed,
              processedSoFar: processedCount 
            });
            break;
          }
        }
      } catch (calculationError) {
        logger.debug('Calculation error for iteration', { 
          iteration: i, 
          error: calculationError instanceof Error ? calculationError.message : 'Unknown error' 
        });
        // Continue processing despite individual calculation errors
        processedCount++;
      }
    }

    // Simulate database writes with error handling
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (dbError) {
      logger.warn('Database simulation failed', {}, dbError instanceof Error ? dbError : new Error('Unknown DB error'));
      // Continue execution as this is just a simulation
    }

    const processingTime = Date.now() - operationStartTime;

    return {
      success: true,
      processingTime,
      requestedIterations: iterations,
      actualIterations: processedCount,
      itemsProcessed: heavyData.length,
      serverTimestamp: new Date().toISOString(),
      data: heavyData.slice(0, 100), // Return sample data
      serverInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
        complexity,
      },
    };

  } catch (error) {
    const processingTime = Date.now() - operationStartTime;
    
    throw new AppError(
      'Heavy processing operation failed',
      500,
      true,
      { 
        processingTime, 
        processedCount,
        originalError: error instanceof Error ? error.message : 'Unknown error'
      }
    );
  }
}
