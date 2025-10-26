import { NextResponse } from 'next/server';
import { handleApiError, AppError, ErrorCode, generateRequestId, safePropertyAccess } from '@/lib/error-handling';
import { apiLogger } from '@/lib/logging';

export async function GET() {
  const requestId = generateRequestId();
  const log = apiLogger.child('test-endpoint', { requestId });
  
  try {
    log.info('Processing test API request');

    // dummy user
    const user = {
      "name": "John Doe",
      "email": "johndoe@gmail.com", // Fixed typo
    };

    // Safe property access instead of direct access
    const profileName = safePropertyAccess(user, ['profile', 'address', 'name'], 'Unknown');
    
    // Alternative: validate the user object structure
    if (!user.name || !user.email) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'User object is missing required fields',
        400,
        { user },
        requestId
      );
    }

    log.info('Test API request completed successfully', {
      userEmail: user.email,
      profileName
    });

    return NextResponse.json({
      success: true,
      data: {
        user,
        profileName,
        message: 'API endpoint working correctly'
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    log.error('Test API request failed', { error });
    return handleApiError(error, requestId);
  }
}
