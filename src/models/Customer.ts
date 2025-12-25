import { ObjectId } from 'mongodb';

export interface Customer {
  _id?: ObjectId;
  stripeCustomerId: string;
  email: string;
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerInput {
  stripeCustomerId: string;
  email: string;
  name?: string;
  phone?: string;
  address?: Customer['address'];
  metadata?: Record<string, string>;
}

export function createCustomerDocument(input: CreateCustomerInput): Customer {
  return {
    ...input,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function updateCustomerDocument(
  customer: Customer,
  updates: Partial<Customer>
): Customer {
  return {
    ...customer,
    ...updates,
    updatedAt: new Date(),
  };
}
