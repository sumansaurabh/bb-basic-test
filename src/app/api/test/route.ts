import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { formatErrorResponse, ValidationError } from '@/lib/errors';

export async function GET() {
  try {
    logger.info('Test endpoint called');

    // dummy user
    const user = {
      name: "John Doe",
      email: "johndoe@gmail.com",
    };

    // Safe property access with proper validation
    // Check if nested properties exist before accessing
    if (!user || typeof user !== 'object') {
      throw new ValidationError('Invalid user object');
    }

    // Safely access nested properties with optional chaining
    const userWithProfile = user as Record<string, unknown>;
    const profile = userWithProfile.profile as Record<string, unknown> | undefined;
    const address = profile?.address as Record<string, unknown> | undefined;
    const data = address?.name as string | undefined;

    // If the data doesn't exist, provide a meaningful response
    if (!data) {
      logger.warn('User profile data not found', { userId: user.email });
      return NextResponse.json({
        success: true,
        data: null,
        message: 'User profile data not available',
        user: {
          name: user.name,
          email: user.email,
        },
      });
    }

    logger.info('Test endpoint successful', { data });

    return NextResponse.json({
      success: true,
      data: data,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error('Test endpoint error', error as Error);
    const errorResponse = formatErrorResponse(
      error as Error,
      '/api/test',
      process.env.NODE_ENV === 'development'
    );
    return NextResponse.json(errorResponse, { 
      status: errorResponse.error.statusCode 
    });
  }
}
