import { NextResponse } from 'next/server';

export async function GET() {

  // dummy user with complete profile information
  const user = {
    "name": "John Doe",
    "email": "johdoe@gmail.com",
    "profile": {
      "address": {
        "name": "123 Main Street"
      }
    }
  }

  // Safely access nested properties using optional chaining
  const data = user.profile?.address?.name ?? 'Address not available';

  return NextResponse.json({
    success: true,
    data: data,
  });  
}
