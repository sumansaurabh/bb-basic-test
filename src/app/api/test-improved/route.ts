/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { 
  withErrorHandler, 
  ValidationError,
  NotFoundError 
} from '@/lib/errors';
import { 
  withRateLimit, 
  withSecurityHeaders,
  combineMiddleware 
} from '@/lib/middleware';
import {
  createRequestLogger,
  logRequestStart,
  logSecurityEvent
} from '@/lib/logger';

type Logger = any;

async function testHandler(request: NextRequest): Promise<NextResponse> {
  const requestLogger: Logger = createRequestLogger(request);
  
  // Log request start
  logRequestStart(request, requestLogger, { operation: 'test-endpoint' });

  try {
    // Simulate a user lookup with proper null checking
    const user = await getUserSafely();
    
    if (!user) {
      throw new NotFoundError('User');
    }

    // Safe property access with validation
    const userData = validateUserData(user);
    
    requestLogger.info('Test endpoint accessed successfully', {
      userId: userData.id,
      hasProfile: !!userData.profile,
    });

    return NextResponse.json({
      success: true,
      message: 'Test endpoint working correctly',
      data: {
        user: {
          name: userData.name,
          email: userData.email,
          profile: userData.profile ? {
            address: userData.profile.address || null,
            preferences: userData.profile.preferences || {},
          } : null,
        },
        timestamp: new Date().toISOString(),
        requestId: requestLogger['correlationId'] || 'unknown',
      },
    });

  } catch (error) {
    // Log security event for potential probing
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      logSecurityEvent(
        'Invalid test request',
        request,
        'low',
        { error: error.message }
      );
    }
    
    throw error; // Re-throw to be handled by error middleware
  }
}

/**
 * Safely retrieve user data with proper error handling
 */
async function getUserSafely(): Promise<any | null> {
  try {
    // Simulate database call that might fail
    const user = {
      id: 1,
      name: "John Doe",
      email: "johndoe@gmail.com",
      profile: {
        address: {
          name: "John's Home Address",
          street: "123 Main St",
          city: "Anytown",
          zipCode: "12345",
        },
        preferences: {
          theme: "dark",
          notifications: true,
        },
      },
    };

    // Simulate occasional database failures
    if (Math.random() < 0.1) { // 10% chance of failure
      throw new Error('Database connection timeout');
    }

    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Validate user data structure with proper type checking
 */
function validateUserData(user: any): {
  id: number;
  name: string;
  email: string;
  profile: any;
} {
  if (!user || typeof user !== 'object') {
    throw new ValidationError('Invalid user object');
  }

  if (!user.name || typeof user.name !== 'string') {
    throw new ValidationError('User name is required and must be a string');
  }

  if (!user.email || typeof user.email !== 'string') {
    throw new ValidationError('User email is required and must be a string');
  }

  if (!user.id || typeof user.id !== 'number') {
    throw new ValidationError('User ID is required and must be a number');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(user.email)) {
    throw new ValidationError('Invalid email format');
  }

  // Profile is optional, but if present, validate its structure
  if (user.profile) {
    if (typeof user.profile !== 'object') {
      throw new ValidationError('User profile must be an object');
    }

    // Validate nested address if present
    if (user.profile.address) {
      if (typeof user.profile.address !== 'object') {
        throw new ValidationError('User profile address must be an object');
      }
      
      // Check for required address fields
      if (user.profile.address.name && typeof user.profile.address.name !== 'string') {
        throw new ValidationError('Address name must be a string');
      }
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile || null,
  };
}

/**
 * Alternative test endpoint with different error scenarios
 */
async function testErrorScenariosHandler(request: NextRequest): Promise<NextResponse> {
  const requestLogger = createRequestLogger(request);
  const errorType = new URL(request.url).searchParams.get('error');

  logRequestStart(request, requestLogger, { operation: 'test-error-scenarios', errorType });

  switch (errorType) {
    case 'validation':
      throw new ValidationError('Test validation error', { field: 'test', reason: 'intentional' });
    
    case 'not-found':
      throw new NotFoundError('Test resource');
    
    case 'timeout':
      // Simulate a timeout scenario
      await new Promise(resolve => setTimeout(resolve, 35000)); // Will timeout before this
      break;
    
    case 'memory':
      // Simulate memory intensive operation
      const largeArray = new Array(1000000).fill(0).map((_, i) => ({ id: i, data: `item-${i}` }));
      return NextResponse.json({
        success: true,
        message: 'Memory test completed',
        itemsGenerated: largeArray.length,
      });
    
    default:
      return NextResponse.json({
        success: true,
        message: 'Test error scenarios endpoint',
        availableErrors: ['validation', 'not-found', 'timeout', 'memory'],
        usage: 'Add ?error=<type> to test different error scenarios',
      });
  }

  return NextResponse.json({
    success: true,
    message: 'Error scenario test completed',
    errorType,
  });
}

// Export handlers with middleware
export const GET = combineMiddleware(
  withSecurityHeaders,
  withRateLimit,
  withErrorHandler
)(testHandler);

// Add a POST handler for testing different scenarios
export const POST = combineMiddleware(
  withSecurityHeaders,
  withRateLimit,
  withErrorHandler
)(testErrorScenariosHandler);
