# Stripe Payment Gateway Integration

This project includes a complete Stripe payment gateway integration with support for both custom one-time payments and recurring subscriptions.

## Features

### ✅ Custom Payments
- One-time payment processing
- Secure payment intent creation
- Payment confirmation with Stripe Elements
- Payment history tracking
- Success/failure handling

### ✅ Subscriptions
- Multiple subscription tiers (Basic, Pro, Enterprise)
- Recurring monthly billing
- Subscription management dashboard
- Cancel/modify subscriptions
- Automatic payment retry handling

### ✅ Backend Integration
- Secure API routes for payment processing
- Webhook handling for payment events
- MongoDB integration for payment records
- Customer management
- Payment history tracking

## Project Structure

```
/vercel/sandbox/
├── src/
│   ├── lib/
│   │   ├── stripe.ts              # Stripe configuration
│   │   └── mongodb.ts             # MongoDB connection
│   ├── models/
│   │   ├── Payment.ts             # Payment data model
│   │   ├── Subscription.ts        # Subscription data model
│   │   └── Customer.ts            # Customer data model
│   ├── app/
│   │   ├── api/stripe/
│   │   │   ├── create-payment-intent/route.ts
│   │   │   ├── create-subscription/route.ts
│   │   │   ├── cancel-subscription/route.ts
│   │   │   ├── get-subscription/route.ts
│   │   │   ├── get-payment-history/route.ts
│   │   │   └── webhook/route.ts
│   │   ├── components/
│   │   │   ├── PaymentForm.tsx
│   │   │   ├── SubscriptionPlans.tsx
│   │   │   ├── SubscriptionCard.tsx
│   │   │   └── PaymentHistory.tsx
│   │   ├── payment/
│   │   │   ├── page.tsx           # Custom payment page
│   │   │   └── success/page.tsx
│   │   └── subscription/
│   │       ├── page.tsx           # Subscription plans page
│   │       ├── manage/page.tsx    # Manage subscriptions
│   │       └── success/page.tsx
```

## Setup Instructions

### 1. Install Dependencies

Dependencies are already installed:
- `stripe` - Stripe Node.js SDK
- `@stripe/stripe-js` - Stripe.js client library
- `@stripe/react-stripe-js` - React components for Stripe
- `mongodb` - MongoDB driver

### 2. Configure Environment Variables

Create a `.env.local` file in the project root with your Stripe credentials:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# MongoDB Configuration (Already set via MCP)
MDB_MCP_CONNECTION_STRING=your_mongodb_connection_string

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **API keys**
3. Copy your **Publishable key** and **Secret key**
4. For testing, use the test mode keys (starting with `pk_test_` and `sk_test_`)

### 4. Set Up Stripe Webhook

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Enter your webhook URL: `https://your-domain.com/api/stripe/webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** and add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### 5. Create Subscription Products in Stripe

Before using subscriptions, you need to create products and prices in Stripe:

1. Go to **Products** in Stripe Dashboard
2. Create three products:
   - **Basic Plan** - $9.99/month
   - **Pro Plan** - $29.99/month
   - **Enterprise Plan** - $99.99/month
3. Copy the **Price IDs** for each plan
4. Update the subscription plans in your code if needed

## Usage

### Custom Payment Flow

1. Navigate to `/payment`
2. Enter customer details (email, name, amount)
3. Click "Continue to Payment"
4. Enter card details using Stripe Elements
5. Submit payment
6. Redirect to success page

### Subscription Flow

1. Navigate to `/subscription`
2. Select a subscription plan
3. Enter customer details
4. Enter payment method
5. Subscribe
6. Redirect to success page

### Manage Subscriptions

1. Navigate to `/subscription/manage`
2. Enter email address
3. View active subscriptions
4. Cancel or modify subscriptions
5. View payment history

## API Endpoints

### POST `/api/stripe/create-payment-intent`
Create a payment intent for one-time payments.

**Request Body:**
```json
{
  "amount": 50.00,
  "email": "customer@example.com",
  "name": "John Doe",
  "description": "Custom payment"
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "customerId": "cus_xxx"
}
```

### POST `/api/stripe/create-subscription`
Create a new subscription.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "name": "John Doe",
  "planType": "pro",
  "priceId": "price_xxx"
}
```

**Response:**
```json
{
  "subscriptionId": "sub_xxx",
  "clientSecret": "pi_xxx_secret_xxx",
  "customerId": "cus_xxx",
  "status": "active"
}
```

### POST `/api/stripe/cancel-subscription`
Cancel a subscription.

**Request Body:**
```json
{
  "subscriptionId": "sub_xxx",
  "cancelAtPeriodEnd": true
}
```

### GET `/api/stripe/get-subscription?email=customer@example.com`
Get subscriptions for a customer.

### GET `/api/stripe/get-payment-history?email=customer@example.com`
Get payment history for a customer.

### POST `/api/stripe/webhook`
Handle Stripe webhook events (automatically called by Stripe).

## Database Schema

### Payments Collection
```typescript
{
  _id: ObjectId,
  stripePaymentIntentId: string,
  customerId: string,
  customerEmail: string,
  amount: number,
  currency: string,
  status: 'pending' | 'succeeded' | 'failed' | 'canceled',
  paymentMethod?: string,
  description?: string,
  metadata?: Record<string, string>,
  createdAt: Date,
  updatedAt: Date
}
```

### Subscriptions Collection
```typescript
{
  _id: ObjectId,
  stripeSubscriptionId: string,
  stripeCustomerId: string,
  customerEmail: string,
  planType: 'basic' | 'pro' | 'enterprise',
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing',
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: boolean,
  priceId: string,
  amount: number,
  currency: string,
  metadata?: Record<string, string>,
  createdAt: Date,
  updatedAt: Date
}
```

### Customers Collection
```typescript
{
  _id: ObjectId,
  stripeCustomerId: string,
  email: string,
  name?: string,
  phone?: string,
  address?: {
    line1?: string,
    line2?: string,
    city?: string,
    state?: string,
    postalCode?: string,
    country?: string
  },
  metadata?: Record<string, string>,
  createdAt: Date,
  updatedAt: Date
}
```

## Testing

### Test Card Numbers

Use these test card numbers in Stripe test mode:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Authentication:** `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any postal code.

### Testing Webhooks Locally

1. Install Stripe CLI: `brew install stripe/stripe-brew/stripe`
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy the webhook signing secret and update `.env.local`

## Security Best Practices

✅ **Implemented:**
- Server-side payment intent creation
- Webhook signature verification
- Environment variable protection
- No sensitive data in client-side code
- Secure MongoDB connection
- Input validation on all API routes

## Navigation

The main page now includes a payment navigation bar with links to:
- **Custom Payment** - One-time payments
- **Subscriptions** - View and select subscription plans
- **Manage** - Manage existing subscriptions and view payment history

## Subscription Plans

### Basic Plan - $9.99/month
- Access to basic features
- Email support
- 5 GB storage
- Basic analytics

### Pro Plan - $29.99/month (Most Popular)
- All basic features
- Priority support
- 50 GB storage
- Advanced analytics
- Custom integrations

### Enterprise Plan - $99.99/month
- All pro features
- 24/7 dedicated support
- Unlimited storage
- Custom analytics
- API access
- White-label options

## Troubleshooting

### Build Errors
- Ensure all environment variables are set
- Check Stripe API version compatibility
- Verify MongoDB connection string

### Payment Failures
- Check Stripe Dashboard for error details
- Verify webhook is receiving events
- Check MongoDB for payment records

### Subscription Issues
- Ensure products and prices are created in Stripe
- Verify price IDs match your configuration
- Check subscription status in Stripe Dashboard

## Support

For issues or questions:
1. Check Stripe Dashboard logs
2. Review MongoDB collections for data
3. Check browser console for client-side errors
4. Review server logs for API errors

## License

This integration is part of the Next.js project and follows the same license.
