import { NextResponse } from 'next/server';

export async function GET() {

  // dummy user with proper typing
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

  // Safe access with optional chaining and default value
  const data = user.profile?.address?.name ?? 'Address not available';

  return NextResponse.json({
    success: true,
    data: data,
  });  
}
