import { NextRequest, NextResponse } from 'next/server';
import { ApiHandlerPresets } from '@/lib/api-middleware';
import { validateNumber, validateString } from '@/lib/validation';
import { logger } from '@/lib/logger';

// Heavy server-side processing endpoint
async function getHandler() {
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
}

async function postHandler(request: NextRequest) {
  const startTime = Date.now();
  
  logger.info('Heavy processing request received');
  
  const body = await request.json();
  const { iterations = 1000, complexity = 'medium' } = body;
  
  // Validate inputs
  const validatedIterations = validateNumber(iterations, 'iterations', {
    min: 1,
    max: 50000,
    integer: true,
  });
  
  const validatedComplexity = validateString(complexity, 'complexity', {
    enum: ['light', 'medium', 'heavy'],
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
  }
  
  const processingTime = Date.now() - startTime;
  
  logger.info('Heavy processing completed', {
    iterations: iterationCount,
    complexity: validatedComplexity,
    processingTime,
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
}

// Export wrapped handlers with middleware
export const GET = ApiHandlerPresets.heavy(getHandler);
export const POST = ApiHandlerPresets.heavy(postHandler);
