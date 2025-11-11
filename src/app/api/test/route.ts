import { NextResponse } from 'next/server';

export async function GET() {

  // dummy user with proper type definition
  const user: {
    name: string;
    email: string;
    profile?: {
      address?: {
        name?: string;
      };
    };
  } = {
    "name": "John Doe",
    "email": "johdoe@gmail.com",
  }

  // Fixed: Using optional chaining to safely access nested properties
  const data = user?.profile?.address?.name ?? 'Address not available';

  return NextResponse.json({
    success: true,
    data: data,
  });  
}
