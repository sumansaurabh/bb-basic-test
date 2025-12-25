import { ObjectId } from 'mongodb';

export interface Subscription {
  _id?: ObjectId;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  customerEmail: string;
  planType: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  priceId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionInput {
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  customerEmail: string;
  planType: Subscription['planType'];
  status: Subscription['status'];
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  priceId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

export function createSubscriptionDocument(
  input: CreateSubscriptionInput
): Subscription {
  return {
    ...input,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function updateSubscriptionDocument(
  subscription: Subscription,
  updates: Partial<Subscription>
): Subscription {
  return {
    ...subscription,
    ...updates,
    updatedAt: new Date(),
  };
}
