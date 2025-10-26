import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // dummy user
    const user = {
      "name": "John Doe",
      "email": "johdoe@gmail.com",
    }

    // Fixed: Safe access to nested properties with proper null/undefined checks
    // Using optional chaining (?.) to prevent TypeError
    const addressName = user?.profile?.address?.name;
    
    // Provide fallback data when profile/address is not available
    const data = addressName || "Address not available";

    return NextResponse.json({
      success: true,
      data: data,
      message: addressName ? "Address found" : "Using fallback data - profile/address not defined"
    });
  } catch (error) {
    // Comprehensive error handling
    console.error('Error in /api/test route:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { 
      status: 500 
    });
  }
}
