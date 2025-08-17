import { NextRequest, NextResponse } from 'next/server';

// Heavy server-side processing endpoint
/**
 * Handles a GET request by simulating heavy database operations and returning processed data.
 *
 * The function performs complex calculations in a loop, simulating a heavy load on the server.
 * It collects results in an array, introduces delays to mimic processing time, and finally
 * returns a JSON response containing the processing time, number of items processed, and server information.
 */
export async function GET() {
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

/**
 * Handles a POST request to perform heavy computations based on the request body.
 *
 * The function extracts the number of iterations and complexity level from the request body,
 * performs computations based on the specified complexity, and returns a JSON response
 * with the results and server statistics. It also includes a mechanism to cap iterations
 * to prevent server overload and introduces periodic delays for heavy computations.
 *
 * @param request - The NextRequest object containing the request data.
 * @returns A JSON response containing the success status, processing time, requested and actual iterations,
 *          complexity level, server timestamp, sample results, and server statistics.
 * @throws Error If there is an error during the processing of the heavy computation.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { iterations = 1000, complexity = 'medium' } = body;
    
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
    
    return NextResponse.json({
      success: true,
      processingTime,
      requestedIterations: iterations,
      actualIterations: iterationCount,
      complexity,
      serverTimestamp: new Date().toISOString(),
      results: results.slice(0, 50), // Return sample results
      serverStats: {
        cpuUsage: Math.random() * 100,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
    });
    
  } catch (err) {
    console.error('Heavy processing error:', err);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process heavy computation',
        serverTimestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
