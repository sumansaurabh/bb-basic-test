import { NextResponse } from 'next/server';

interface User {
  name: string;
  email: string;
  profile?: {
    address?: {
      name?: string;
      street?: string;
      city?: string;
    };
  };
}

export async function GET() {
  try {
    // Dummy user with proper typing
    const user: User = {
      name: "John Doe",
      email: "johndoe@gmail.com",
    };

    // Safe property access with optional chaining and nullish coalescing
    const addressName = user.profile?.address?.name ?? 'No address name available';

    return NextResponse.json({
      success: true,
      data: {
        userName: user.name,
        userEmail: user.email,
        addressName,
        hasProfile: !!user.profile,
        hasAddress: !!user.profile?.address,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
