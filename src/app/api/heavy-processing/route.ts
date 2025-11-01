import { NextRequest, NextResponse } from 'next/server';
import { logInfo, logError, logWarn } from '@/lib/logger';
import { getConfig } from '@/lib/config';

// Heavy server-side processing endpoint
export async function GET() {
  const startTime = Date.now();
  const config = getConfig();
  
  try {
    logInfo('Heavy processing GET request started');
    
    // Check if request exceeds timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), config.requestTimeoutMs);
    });
    
    const processingPromise = (async () => {
      // Simulate heavy database operations
      const heavyData = [];
      const maxItems = 10000;
      
      for (let i = 0; i < maxItems; i++) {
        // Check for timeout periodically
        if (i % 1000 === 0 && Date.now() - startTime > config.requestTimeoutMs - 1000) {
          logWarn('Processing approaching timeout, stopping early', { itemsProcessed: i });
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
    
    // Race between processing and timeout
    const heavyData = await Promise.race([processingPromise, timeoutPromise]) as Array<{
      id: number;
      result: number;
      timestamp: string;
      serverLoad: number;
    }>;
    
    const processingTime = Date.now() - startTime;
    
    logInfo('Heavy processing GET request completed', {
      processingTime,
      itemsProcessed: heavyData.length,
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
    const processingTime = Date.now() - startTime;
    
    logError('Heavy processing GET request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
    });
    
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json(
        {
          success: false,
          error: 'Request timeout',
          message: 'Processing took too long and was terminated',
          processingTime,
          timestamp: new Date().toISOString(),
        },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const config = getConfig();
  
  try {
    logInfo('Heavy processing POST request started');
    
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      logError('Failed to parse request body', {
        error: parseError instanceof Error ? parseError.message : 'Unknown error',
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Validate input
    const { iterations = 1000, complexity = 'medium' } = body;
    
    // Validate iterations
    if (typeof iterations !== 'number' || iterations < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          message: 'Iterations must be a positive number',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Validate complexity
    if (!['light', 'medium', 'heavy'].includes(complexity)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          message: 'Complexity must be one of: light, medium, heavy',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Cap iterations to prevent server overload
    const iterationCount = Math.min(iterations, config.maxIterations);
    
    if (iterationCount < iterations) {
      logWarn('Iterations capped to maximum allowed', {
        requested: iterations,
        actual: iterationCount,
        max: config.maxIterations,
      });
    }
    
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), config.requestTimeoutMs);
    });
    
    // Heavy computation based on request
    const processingPromise = (async () => {
      const results = [];
      
      for (let i = 0; i < iterationCount; i++) {
        // Check for timeout periodically
        if (i % 1000 === 0 && Date.now() - startTime > config.requestTimeoutMs - 1000) {
          logWarn('Processing approaching timeout, stopping early', {
            iterationsCompleted: i,
            requested: iterationCount,
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
    
    // Race between processing and timeout
    const results = await Promise.race([processingPromise, timeoutPromise]) as Array<{
      iteration: number;
      result: number;
      complexity: string;
    }>;
    
    const processingTime = Date.now() - startTime;
    
    logInfo('Heavy processing POST request completed', {
      processingTime,
      requestedIterations: iterations,
      actualIterations: results.length,
      complexity,
    });
    
    return NextResponse.json({
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
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logError('Heavy processing POST request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
    });
    
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json(
        {
          success: false,
          error: 'Request timeout',
          message: 'Processing took too long and was terminated',
          processingTime,
          timestamp: new Date().toISOString(),
        },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
