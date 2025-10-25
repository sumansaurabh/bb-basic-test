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
          "city": "Anytown",
          "state": "CA",
          "zip": "12345"
        }
      }
    }

    // Safe access to nested properties with optional chaining
    const data = user?.profile?.address?.name ?? "No address available";

    return NextResponse.json({
      success: true,
      data: data,
      message: "Address retrieved successfully"
    });  
    
  } catch (error) {
    // Proper error handling to prevent "No message" errors
    console.error('Error in /api/test route:', error);
    
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
}
