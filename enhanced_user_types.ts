// Type definitions for enhanced user data structure
// This provides type safety for the API route

export interface Address {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface Profile {
  address?: Address;
  bio?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
}

export interface User {
  name: string;
  email: string;
  profile?: Profile;
}

// Utility function to safely get address name
export function getAddressName(user: User): string {
  return user?.profile?.address?.name || "Address not available";
}

// Validation function to check if user has complete address
export function hasCompleteAddress(user: User): boolean {
  return !!(user?.profile?.address?.name && 
           user?.profile?.address?.street &&
           user?.profile?.address?.city);
}
