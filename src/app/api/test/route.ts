import { NextResponse } from 'next/server';

// Define proper types for the user data
interface UserProfile {
  address?: {
    name?: string;
    street?: string;
    city?: string;
    country?: string;
  };
}

interface User {
  name: string;
  email: string;
  profile?: UserProfile;
}

export async function GET() {
  try {
    // dummy user with proper typing
    const user: User = {
      "name": "John Doe",
      "email": "johdoe@gmail.com",
    };

    // Safe property access with optional chaining and default values
    const data = user.profile?.address?.name || 'Address not available';

    // Alternative approach: Check if properties exist before accessing
    // const data = user.profile && user.profile.address && user.profile.address.name 
    //   ? user.profile.address.name 
    //   : 'Address not available';

    return NextResponse.json({
      success: true,
      data: data,
      message: 'User data retrieved successfully',
      user: {
        name: user.name,
        email: user.email,
        hasProfile: !!user.profile,
        hasAddress: !!(user.profile?.address)
      }
    });
  } catch (error) {
    // Proper error handling with meaningful error messages
    console.error('Error in GET /api/test:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve user data'
    }, { status: 500 });
  }
}
