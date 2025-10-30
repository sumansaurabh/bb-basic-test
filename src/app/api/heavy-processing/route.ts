import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware, MiddlewarePresets } from '@/lib/api-middleware';
import { logger } from '@/lib/logger';
import { validateNumber } from '@/lib/validation';

// Heavy server-side processing endpoint
async function getHandler() {
  const startTime = Date.now();
  
  logger.info('Starting heavy GET processing');
  
  // Simulate heavy database operations with safety limits
  const heavyData = [];
  const maxItems = 10000;
  
  for (let i = 0; i < maxItems; i++) {
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
  
  logger.info('Heavy GET processing completed', { processingTime, itemsProcessed: heavyData.length });
  
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
  
  logger.info('Starting heavy POST processing');
  
  const body = await request.json();
  const { iterations = 1000, complexity = 'medium' } = body;
  
  // Validate inputs
  const validatedIterations = validateNumber(iterations, 'iterations', { min: 1, max: 50000, integer: true });
  const validComplexity = ['light', 'medium', 'heavy'].includes(complexity) ? complexity : 'medium';
    
  // Heavy computation based on request
  const results = [];
  const iterationCount = validatedIterations;
  
  for (let i = 0; i < iterationCount; i++) {
    let computation = 0;
    
    switch (validComplexity) {
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
      complexity: validComplexity,
    });
    
    // Periodic delay for heavy operations
    if (validComplexity === 'heavy' && i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
  
  const processingTime = Date.now() - startTime;
  
  logger.info('Heavy POST processing completed', { 
    processingTime, 
    iterations: iterationCount,
    complexity: validComplexity 
  });
  
  return NextResponse.json({
    success: true,
    processingTime,
    requestedIterations: iterations,
    actualIterations: iterationCount,
    complexity: validComplexity,
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
export const GET = withMiddleware(getHandler, MiddlewarePresets.heavy);
export const POST = withMiddleware(postHandler, MiddlewarePresets.heavy);
