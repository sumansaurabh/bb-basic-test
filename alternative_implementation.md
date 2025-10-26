# Alternative Implementation with Full User Profile

Here's an enhanced version of the API route that includes a complete user profile structure:

```typescript
import { NextResponse } from 'next/server';

interface Address {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface Profile {
  address?: Address;
  bio?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
}

interface User {
  name: string;
  email: string;
  profile?: Profile;
}

export async function GET() {
  try {
    // Enhanced user with complete profile structure
    const user: User = {
      "name": "John Doe",
      "email": "johdoe@gmail.com",
      "profile": {
        "bio": "Software developer",
        "phoneNumber": "+1-555-0123",
        "address": {
          "name": "Home Address",
          "street": "123 Main St",
          "city": "Anytown",
          "state": "CA",
          "zipCode": "12345",
          "country": "USA"
        }
      }
    }

    // Safe access to nested properties
    const addressName = user?.profile?.address?.name;
    const data = addressName || "Address not available";

    return NextResponse.json({
      success: true,
      data: data,
      user: {
        name: user.name,
        email: user.email,
        hasProfile: !!user.profile,
        hasAddress: !!(user?.profile?.address)
      },
      message: addressName ? "Address found successfully" : "Using fallback data"
    });
  } catch (error) {
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
```

This implementation provides:
1. **Complete type safety** with TypeScript interfaces
2. **Proper data structure** that matches the expected access pattern
3. **Defensive programming** with optional chaining
4. **Comprehensive error handling**
5. **Detailed response information** for debugging
