import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/error-handler';

export async function GET() {
  try {
    logger.info('Test API endpoint called');

    // dummy user
    const user = {
      name: "John Doe",
      email: "johndoe@gmail.com",
    };

    // Safe property access with optional chaining and nullish coalescing
    const data = user?.name ?? 'Unknown';

    logger.info('Test API endpoint successful', { data });

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Test endpoint working correctly',
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/test');
  }
}
