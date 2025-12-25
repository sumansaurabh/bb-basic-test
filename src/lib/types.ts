import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  name?: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sandbox {
  _id?: ObjectId;
  userId: ObjectId;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'stopped';
  billingRate: {
    hourly: number;
    daily: number;
  };
  totalCost: number;
  machineSpecs: {
    cpu: number;
    memory: number;
    storage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  _id?: ObjectId;
  userId: ObjectId;
  amount: number;
  type: 'topup' | 'debit' | 'refund';
  description: string;
  stripePaymentId?: string;
  sandboxId?: ObjectId;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export interface Payment {
  _id?: ObjectId;
  userId: ObjectId;
  amount: number;
  stripePaymentIntentId: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  metadata?: Record<string, string | number | boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}
