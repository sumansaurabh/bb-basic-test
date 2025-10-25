import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // dummy user with complete profile structure
    const user = {
      "name": "John Doe",
      "email": "johdoe@gmail.com",
      "profile": {
        "address": {
          "name": "123 Main Street",
          "city": "Sample City",
          "country": "Sample Country"
        }
      }
    }

    // Safe property access with optional chaining and fallback
    const data = user?.profile?.address?.name || "Address not available";

    return NextResponse.json({
      success: true,
      data: data,
    });  
  } catch (error) {
    // Proper error handling
    console.error('Error in test API route:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
