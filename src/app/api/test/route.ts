import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // dummy user with complete profile structure
    const user = {
      "name": "John Doe",
      "email": "johdoe@gmail.com",
      "profile": {
        "address": {
          "name": "Home Address",
          "street": "123 Main St",
          "city": "Anytown",
          "zipCode": "12345"
        }
      }
    }

    // Safe access with optional chaining and null checks
    const addressName = user?.profile?.address?.name;
    
    // Validate that we have the required data
    if (!addressName) {
      return NextResponse.json({
        success: false,
        error: "Address name not found in user profile",
        data: null
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: addressName,
    });
    
  } catch (error) {
    console.error('Error in /api/test route:', error);
    
    return NextResponse.json({
      success: false,
      error: "Internal server error occurred",
      data: null
    }, { status: 500 });
  }
}
