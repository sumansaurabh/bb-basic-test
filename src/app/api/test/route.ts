import { NextResponse } from 'next/server';

/**
 * Handles GET requests and returns a JSON response with user data.
 */
export async function GET() {

  // dummy user
  const user = {
    "name": "John Doe",
    "email": "johdoe@gmail.com",
  }

  // This will throw a runtime error: Cannot read property 'name' of undefined
  // @ts-expect-error - Intentionally accessing undefined property for testing
  const data = user.profile.address.name;

  return NextResponse.json({
    success: true,
    data: data,
  });  
}
