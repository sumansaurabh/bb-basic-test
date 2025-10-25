import { NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse, safeGet, validateRequiredFields } from '@/lib/errorHandler';

// Type definitions for better type safety
interface Address {
  name?: string;
  street?: string;
  city?: string;
  country?: string;
}

interface Profile {
  address?: Address;
  bio?: string;
}

interface User {
  name: string;
  email: string;
  profile?: Profile;
}

export async function GET() {
  try {
    // dummy user - properly typed
    const user: User = {
      "name": "John Doe",
      "email": "johdoe@gmail.com",
    };

    // Validate that required user fields are present
    const validation = validateRequiredFields(user, ['name', 'email']);
    if (!validation.valid) {
      return createErrorResponse(
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        400
      );
    }

    // Safe property access using utility functions and optional chaining
    const addressName = user?.profile?.address?.name ?? safeGet(user, 'profile.address.name', 'No address name available');
    
    // Build response data with safe property access
    const safeData = {
      userName: user.name,
      userEmail: user.email,
      addressName: addressName,
      hasProfile: Boolean(user.profile),
      hasAddress: Boolean(user.profile?.address),
      profileBio: safeGet(user, 'profile.bio', 'No bio available'),
      addressDetails: {
        street: safeGet(user, 'profile.address.street', 'Not provided'),
        city: safeGet(user, 'profile.address.city', 'Not provided'),
        country: safeGet(user, 'profile.address.country', 'Not provided'),
      }
    };

    return createSuccessResponse(
      safeData,
      'User data retrieved successfully'
    );

  } catch (error) {
    return createErrorResponse(
      'Internal server error occurred while processing user data',
      500,
      error
    );
  }
}
