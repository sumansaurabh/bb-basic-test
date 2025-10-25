import { NextResponse } from 'next/server';
import { logger, logApiRequest, logApiError } from '@/lib/logger';
import { AppError, ValidationError, safeGet } from '@/lib/errors';
import { rateLimiters, createRateLimitMiddleware } from '@/lib/rate-limit';
import { healthChecker } from '@/lib/health';

// Apply rate limiting
const rateLimitMiddleware = createRateLimitMiddleware(rateLimiters.api);

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    // Track request
    healthChecker.incrementRequest();
    logApiRequest('GET', '/api/test', { userAgent: request.headers.get('user-agent') });

    // Apply rate limiting
    const rateLimitResult = rateLimitMiddleware(request);
    if (!rateLimitResult.success) {
      healthChecker.incrementError();
      return rateLimitResult.response!;
    }

    // Dummy user with proper error handling
    const user = {
      "name": "John Doe",
      "email": "johndoe@gmail.com",
      "profile": null, // Simulate missing profile
    };

    // Safe property access instead of crashing
    const profileData = safeGet(user, 'profile.address.name', null);
    
    if (!profileData) {
      logger.warn('User profile data incomplete', { 
        userId: user.email,
        missingField: 'profile.address.name' 
      });
      
      // Return partial data instead of crashing
      return NextResponse.json({
        success: true,
        data: {
          name: user.name,
          email: user.email,
          profileComplete: false,
          message: "Profile data is incomplete"
        },
        warnings: ["User profile address information is missing"]
      });
    }

    // Log successful operation
    logger.debug('Test API completed successfully', { 
      userId: user.email,
      duration: Date.now() - startTime 
    });

    return NextResponse.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        profileData,
        profileComplete: true
      },
    });
    
  } catch (error) {
    healthChecker.incrementError();
    
    if (error instanceof AppError) {
      logApiError('/api/test', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          context: error.context 
        },
        { status: error.statusCode }
      );
    }
    
    // Handle unexpected errors
    const unexpectedError = error instanceof Error ? error : new Error('Unknown error');
    logApiError('/api/test', unexpectedError, { duration: Date.now() - startTime });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
