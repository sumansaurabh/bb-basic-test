/**
 * Test endpoint with proper error handling
 * Previously had intentional error - now fixed
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import { RATE_LIMITS } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  return withApiMiddleware(
    request,
    async (context) => {
      // Dummy user with proper structure
      const user = {
        name: "John Doe",
        email: "johndoe@gmail.com",
        profile: {
          address: {
            name: "Home Address",
            street: "123 Main St",
            city: "San Francisco",
            state: "CA",
            zip: "94102",
          },
          phone: "+1-555-0123",
        },
      };

      // Safe access to nested properties
      const addressName = user.profile?.address?.name || 'No address';

      return NextResponse.json({
        success: true,
        data: {
          userName: user.name,
          email: user.email,
          addressName,
          fullAddress: user.profile.address,
        },
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
      });
    },
    {
      rateLimit: RATE_LIMITS.STANDARD,
    }
  );
}
