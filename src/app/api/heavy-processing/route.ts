import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, AppError, ErrorCode, generateRequestId, validateRange, validateString, withTimeout } from '@/lib/error-handling';
import { apiLogger } from '@/lib/logging';
import { config } from '@/lib/config';

// Heavy server-side processing endpoint
export async function GET() {
  const requestId = generateRequestId();
  const log = apiLogger.child('heavy-processing', { requestId });
  
  try {
    log.info('Starting heavy processing (GET)');
    
    if (!config.features.enableHeavyProcessing) {
      throw new AppError(
        ErrorCode.SERVER_ERROR,
        'Heavy processing is disabled',
        503,
        { feature: 'enableHeavyProcessing' },
        requestId
      );
    }

    const startTime = Date.now();
    
    // Wrap heavy processing with timeout
    const heavyData = await withTimeout(
      processHeavyData(log),
      config.api.timeoutMs,
      'Heavy processing timed out',
      requestId
    );
    
    const processingTime = Date.now() - startTime;
    
    log.info('Heavy processing completed', {
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
      meta: {
        requestId,
        capped: heavyData.length > 100
      }
    });

  } catch (error) {
    log.error('Heavy processing (GET) failed', { error });
    return handleApiError(error, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const log = apiLogger.child('heavy-processing-post', { requestId });
  
  try {
    log.info('Starting heavy processing (POST)');
    
    if (!config.features.enableHeavyProcessing) {
      throw new AppError(
        ErrorCode.SERVER_ERROR,
        'Heavy processing is disabled',
        503,
        { feature: 'enableHeavyProcessing' },
        requestId
      );
    }

    const startTime = Date.now();
    
    // Parse and validate request body with timeout
    const body = await withTimeout(
      request.json(),
      5000, // 5 second timeout for JSON parsing
      'Request body parsing timed out',
      requestId
    );

    // Validate input parameters
    const iterations = validateRange(
      body.iterations ?? 1000,
      1,
      50000, // Cap to prevent server overload
      'iterations',
      requestId
    );

    const complexity = validateString(
      body.complexity ?? 'medium',
      'complexity',
      1,
      10,
      requestId
    );

    if (!['light', 'medium', 'heavy'].includes(complexity)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Complexity must be one of: light, medium, heavy',
        400,
        { complexity, allowedValues: ['light', 'medium', 'heavy'] },
        requestId
      );
    }

    log.info('Processing heavy computation', {
      iterations,
      complexity,
      requestedIterations: body.iterations
    });

    // Heavy computation with timeout
    const results = await withTimeout(
      processHeavyComputation(iterations, complexity as 'light' | 'medium' | 'heavy', log),
      config.api.timeoutMs,
      'Heavy computation timed out',
      requestId
    );
    
    const processingTime = Date.now() - startTime;
    
    log.info('Heavy computation completed', {
      processingTime,
      iterations: results.length,
      complexity
    });
    
    return NextResponse.json({
      success: true,
      processingTime,
      requestedIterations: body.iterations,
      actualIterations: iterations,
      complexity,
      serverTimestamp: new Date().toISOString(),
      results: results.slice(0, 50), // Return sample results
      serverStats: {
        cpuUsage: Math.random() * 100, // In real app, use actual CPU monitoring
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
      meta: {
        requestId,
        capped: results.length > 50
      }
    });
    
  } catch (error) {
    log.error('Heavy processing (POST) failed', { error });
    return handleApiError(error, requestId);
  }
}

// Helper function for heavy data processing
async function processHeavyData(log: typeof apiLogger): Promise<Array<{
  id: number;
  result: number;
  timestamp: string;
  serverLoad: number;
}>> {
  const heavyData = [];
  
  for (let i = 0; i < 10000; i++) {
    try {
      // Simulate complex calculations with error handling
      const complexResult = Math.sqrt(
        Math.sin(i) * Math.cos(i) * Math.random() * 1000
      );
      
      // Validate computation result
      if (!isFinite(complexResult)) {
        log.warn('Invalid computation result', { iteration: i, result: complexResult });
        continue;
      }
      
      heavyData.push({
        id: i,
        result: complexResult,
        timestamp: new Date().toISOString(),
        serverLoad: Math.random() * 100,
      });
      
      // Add some delay to simulate real processing with periodic checks
      if (i % 1000 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
        log.debug('Heavy processing checkpoint', { iteration: i, progress: `${(i/10000*100).toFixed(1)}%` });
      }
    } catch (error) {
      log.error('Error in heavy data processing iteration', { iteration: i, error });
      // Continue processing instead of failing completely
    }
  }
  
  // Simulate database writes with error handling
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    log.debug('Simulated database write completed');
  } catch (error) {
    log.error('Simulated database write failed', { error });
    throw new AppError(
      ErrorCode.SERVER_ERROR,
      'Database operation failed',
      500,
      { operation: 'database_write' }
    );
  }
  
  return heavyData;
}

// Helper function for heavy computation
async function processHeavyComputation(
  iterations: number,
  complexity: 'light' | 'medium' | 'heavy',
  log: typeof apiLogger
): Promise<Array<{
  iteration: number;
  result: number;
  complexity: string;
}>> {
  const results = [];
  
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
      }

      // Validate computation result
      if (!isFinite(computation)) {
        log.warn('Invalid computation result', { iteration: i, complexity, result: computation });
        continue;
      }
      
      results.push({
        iteration: i,
        result: computation,
        complexity,
      });
      
      // Periodic delay for heavy operations with progress logging
      if (complexity === 'heavy' && i % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
        if (i % 1000 === 0) {
          log.debug('Heavy computation checkpoint', { 
            iteration: i, 
            complexity, 
            progress: `${(i/iterations*100).toFixed(1)}%` 
          });
        }
      }
    } catch (error) {
      log.error('Error in computation iteration', { iteration: i, complexity, error });
      // Continue processing instead of failing completely
    }
  }
  
  return results;
}
