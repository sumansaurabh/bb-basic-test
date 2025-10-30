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
    if (!user || typeof user !== 'object') {
      throw new ValidationError('Invalid user data');
    }

    // Demonstrate safe access pattern
    const profile = (user as Record<string, unknown>).profile;
    if (!profile) {
      logger.warn('User profile not found', { userId: user.name });
      
      return NextResponse.json({
        success: true,
        data: {
          user: {
            name: user.name,
            email: user.email,
          },
          profile: null,
          message: 'User profile not available',
        },
      });
    }

    // If profile exists, safely access nested properties
    const address = (profile as Record<string, unknown>).address as Record<string, unknown> | undefined;
    const addressName = (address?.name as string) || 'No address name';

    return NextResponse.json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
        },
        profile: {
          addressName,
        },
      },
    });
  } catch (error) {
    logger.error('Test endpoint error', error as Error);
    
    const errorResponse = formatErrorResponse(
      error as Error,
      '/api/test',
      process.env.NODE_ENV === 'development'
    );

    return NextResponse.json(
      errorResponse,
      { status: errorResponse.error.statusCode }
    );
  }
}
