import { NextResponse } from 'next/server';

export async function GET() {

  // dummy user
  const user = {
    "name": "John Doe",
    "email": "johdoe@gmail.com",
    "profile": {
      "address": {
        "name": "123 Main Street"
      }
    }
  }

  const data = user.profile.address.name;

  return NextResponse.json({
    success: true,
    data: data,
  });  
}
