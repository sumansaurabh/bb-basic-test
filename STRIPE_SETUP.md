# Stripe Payment Gateway Setup Guide

This guide will help you set up and configure the Stripe payment gateway integration in your Next.js application.

## Features

✅ **Custom One-Time Payments** - Accept custom amount payments  
✅ **Subscription Plans** - Three-tier subscription system (Basic, Pro, Enterprise)  
✅ **Secure Payment Processing** - PCI-compliant payment handling via Stripe  
✅ **Webhook Support** - Real-time payment event notifications  
✅ **Customer Portal** - Self-service subscription management  
✅ **Modern UI** - Beautiful, responsive payment interface with Tailwind CSS

## Prerequisites

1. A Stripe account (sign up at [stripe.com](https://stripe.com))
2. Node.js 18+ installed
3. Next.js 15+ application

## Installation

The required dependencies are already installed:
- `stripe` - Stripe Node.js SDK
- `@stripe/stripe-js` - Stripe.js for client-side
- `@stripe/react-stripe-js` - React components for Stripe

## Configuration

### 1. Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy your **Publishable key** and **Secret key**
4. For testing, use the test mode keys (they start with `pk_test_` and `sk_test_`)

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Stripe keys:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Create Subscription Products in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Products**
2. Click **Add product**
3. Create three products matching the plans:

   **Basic Plan:**
   - Name: Basic Plan
   - Price: $9.99/month
   - Copy the Price ID (starts with `price_`)

   **Pro Plan:**
   - Name: Pro Plan
   - Price: $29.99/month
   - Copy the Price ID

   **Enterprise Plan:**
   - Name: Enterprise Plan
   - Price: $99.99/month
   - Copy the Price ID

4. Add the Price IDs to your `.env.local`:

```env
STRIPE_BASIC_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxxxxxxxxxx
```

### 4. Set Up Webhooks (Optional but Recommended)

Webhooks allow your application to receive real-time notifications about payment events.

#### For Local Development:

1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`) and add it to `.env.local`

#### For Production:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret and add it to your environment variables

## Usage

### Accessing the Payment Page

Navigate to `/payment` in your application or click the "💳 Payments" button in the top-right corner of the home page.

### Custom Payments

1. Click on the **Custom Payment** tab
2. Enter the desired amount
3. Click **Continue to Payment**
4. Fill in card details (use test cards in test mode)
5. Complete the payment

**Test Card Numbers:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Authentication: `4000 0025 0000 3155`
- Use any future expiry date, any 3-digit CVC, and any postal code

### Subscription Payments

1. Click on the **Subscription Plans** tab
2. Choose a plan (Basic, Pro, or Enterprise)
3. Click **Get Started**
4. You'll be redirected to Stripe Checkout
5. Complete the payment
6. You'll be redirected back to the success page

## API Endpoints

The following API endpoints are available:

### Payment Intent (Custom Payments)
```
POST /api/stripe/create-payment-intent
Body: { amount: number, currency?: string, description?: string }
```

### Checkout Session (Subscriptions)
```
POST /api/stripe/create-checkout-session
Body: { priceId: string, successUrl: string, cancelUrl: string }
```

### Customer Management
```
POST /api/stripe/create-customer
Body: { email: string, name?: string }
```

### Subscription Management
```
GET /api/stripe/get-subscription?subscriptionId=sub_xxx
POST /api/stripe/cancel-subscription
Body: { subscriptionId: string }
```

### Customer Portal
```
POST /api/stripe/create-portal-session
Body: { customerId: string, returnUrl: string }
```

### Webhooks
```
POST /api/stripe/webhook
Headers: { stripe-signature: string }
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── stripe/
│   │       ├── create-payment-intent/route.ts
│   │       ├── create-checkout-session/route.ts
│   │       ├── create-customer/route.ts
│   │       ├── cancel-subscription/route.ts
│   │       ├── get-subscription/route.ts
│   │       ├── create-portal-session/route.ts
│   │       └── webhook/route.ts
│   ├── components/
│   │   ├── PaymentForm.tsx
│   │   ├── SubscriptionPlans.tsx
│   │   └── CheckoutButton.tsx
│   └── payment/
│       ├── page.tsx
│       ├── success/page.tsx
│       └── cancel/page.tsx
├── lib/
│   └── stripe.ts
└── types/
    └── stripe.ts
```

## Customization

### Updating Subscription Plans

Edit `src/lib/stripe.ts` to modify plan details:

```typescript
export const SUBSCRIPTION_PLANS = {
  basic: {
    priceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
    name: 'Basic Plan',
    price: 9.99,
    interval: 'month',
    features: [
      'Your features here',
    ],
  },
  // ... more plans
};
```

### Styling

The payment UI uses Tailwind CSS. Customize colors and styles in the component files:
- `src/app/payment/page.tsx` - Main payment page
- `src/app/components/PaymentForm.tsx` - Payment form
- `src/app/components/SubscriptionPlans.tsx` - Subscription cards

## Testing

### Test Card Numbers

Use these test cards in test mode:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Card declined |
| 4000 0025 0000 3155 | Requires authentication |
| 4000 0000 0000 9995 | Insufficient funds |

### Testing Webhooks

1. Use Stripe CLI to forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. Trigger test events:
   ```bash
   stripe trigger payment_intent.succeeded
   stripe trigger customer.subscription.created
   ```

## Security Best Practices

1. ✅ Never expose your secret key (`STRIPE_SECRET_KEY`) in client-side code
2. ✅ Always validate webhook signatures
3. ✅ Use HTTPS in production
4. ✅ Implement proper error handling
5. ✅ Log payment events for auditing
6. ✅ Validate amounts on the server-side
7. ✅ Use environment variables for sensitive data

## Troubleshooting

### "Stripe key not found" error
- Ensure `.env.local` exists and contains your Stripe keys
- Restart the development server after adding environment variables

### Webhook signature verification failed
- Check that `STRIPE_WEBHOOK_SECRET` is correctly set
- Ensure the webhook endpoint URL is correct
- Verify the webhook is sending to the correct endpoint

### Payment form not loading
- Check browser console for errors
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Ensure Stripe.js is loading correctly

### Subscription checkout not working
- Verify Price IDs are correct in Stripe Dashboard
- Check that products are active in Stripe
- Ensure success and cancel URLs are valid

## Going to Production

1. Switch to live mode in Stripe Dashboard
2. Get your live API keys (start with `pk_live_` and `sk_live_`)
3. Update environment variables with live keys
4. Create live products and get live Price IDs
5. Set up production webhooks
6. Test thoroughly with real cards (small amounts)
7. Enable Stripe Radar for fraud prevention
8. Set up proper logging and monitoring

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Next.js Documentation](https://nextjs.org/docs)

## Support

For issues related to:
- **Stripe Integration**: Check [Stripe Support](https://support.stripe.com)
- **Next.js**: Check [Next.js Documentation](https://nextjs.org/docs)
- **This Implementation**: Review the code comments and this guide

## License

This implementation is part of your Next.js application and follows your project's license.
