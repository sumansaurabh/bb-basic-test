import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { formatErrorResponse } from '@/lib/errors';

export async function GET() {
  try {
    logger.info('Test endpoint called');

    // dummy user
    const user = {
      name: "John Doe",
      email: "johndoe@gmail.com",
      profile: {
        address: {
          name: "Home Address",
          street: "123 Main St",
          city: "San Francisco",
          state: "CA",
          zip: "94102"
        }
      }
    };

    // Safe property access with proper error handling
    const data = user.profile?.address?.name || 'No address name available';

    logger.info('Test endpoint successful', { data });

    return NextResponse.json({
      success: true,
      data: data,
      user: {
        name: user.name,
        email: user.email,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Test endpoint error', error as Error);
    
    const errorResponse = formatErrorResponse(
      error as Error,
      '/api/test',
      process.env.NODE_ENV === 'development'
    );

    return NextResponse.json(errorResponse, { 
      status: 500 
    });
  }
}
