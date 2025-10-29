import { NextResponse } from 'next/server';

interface User {
  name: string;
  email: string;
  profile?: {
    address?: {
      name?: string;
    };
  };
}

export async function GET() {

  // dummy user
  const user: User = {
    "name": "John Doe",
    "email": "johdoe@gmail.com",
  }

  // Safe property access with optional chaining
  const data = user?.profile?.address?.name;

  return NextResponse.json({
    success: true,
    data: data ?? null,
  });  
}
