export interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface CheckoutSessionRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface CustomerRequest {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CustomerResponse {
  customerId: string;
  email: string;
}

export interface SubscriptionResponse {
  subscriptionId: string;
  status: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  plan: {
    name: string;
    amount: number;
    interval: string;
  };
}

export interface PortalSessionRequest {
  customerId: string;
  returnUrl: string;
}

export interface PortalSessionResponse {
  url: string;
}
