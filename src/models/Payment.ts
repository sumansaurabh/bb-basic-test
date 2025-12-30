export interface Payment {
  _id?: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  customerEmail?: string;
  customerName?: string;
  description?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CreatePaymentRequest {
  amount: number;
  currency?: string;
  description?: string;
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResponse {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}
