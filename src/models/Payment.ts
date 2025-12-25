import { ObjectId } from 'mongodb';

export interface Payment {
  _id?: ObjectId;
  stripePaymentIntentId: string;
  customerId: string;
  customerEmail: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  paymentMethod?: string;
  description?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentInput {
  stripePaymentIntentId: string;
  customerId: string;
  customerEmail: string;
  amount: number;
  currency: string;
  status: Payment['status'];
  paymentMethod?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export function createPaymentDocument(input: CreatePaymentInput): Payment {
  return {
    ...input,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function updatePaymentDocument(
  payment: Payment,
  updates: Partial<Payment>
): Payment {
  return {
    ...payment,
    ...updates,
    updatedAt: new Date(),
  };
}
