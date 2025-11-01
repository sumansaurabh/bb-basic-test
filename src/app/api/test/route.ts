import { NextResponse } from 'next/server';

export async function GET() {
  try {
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
    const data = user.profile?.address?.name || "Address not available";

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
    console.error('Error in test API route:', error);
    
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
