# Stripe Payment Gateway Integration

This document describes the Stripe payment gateway integration with webhooks for the bb-basic-test Next.js application.

## Overview

The integration includes:
- Stripe Checkout Sessions for hosted payment pages
- Payment Intents API for custom payment flows
- Webhook handlers for payment events
- Success and cancel pages
- Secure payment processing

## Files Created

### Configuration
- `src/lib/stripe.ts` - Stripe client initialization and configuration

### API Endpoints
- `src/app/api/create-payment-intent/route.ts` - Creates payment intents
- `src/app/api/create-checkout-session/route.ts` - Creates checkout sessions
- `src/app/api/webhooks/stripe/route.ts` - Handles Stripe webhook events
- `src/app/api/checkout-session/route.ts` - Retrieves checkout session details

### Pages
- `src/app/checkout/page.tsx` - Checkout page
- `src/app/payment/success/page.tsx` - Payment success page
- `src/app/payment/cancel/page.tsx` - Payment cancelled page

### Configuration Files
- `.env.example` - Environment variables template

## Setup Instructions

### 1. Install Dependencies

Dependencies have already been installed:
```bash
npm install stripe @stripe/stripe-js
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Stripe keys:

```env
# Get your keys from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Get this after setting up webhooks (see step 4)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Your application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Get Your Stripe API Keys

1. Sign up or log in to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to Developers > API keys
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Copy your **Secret key** (starts with `sk_test_`)

### 4. Set Up Webhooks

#### For Local Development (using Stripe CLI)

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows (with Scoop)
   scoop install stripe

   # Linux
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. The CLI will output a webhook signing secret (starts with `whsec_`). Add it to your `.env.local` file.

#### For Production

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to (or select "receive all events"):
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `charge.succeeded`
   - `charge.failed`
   - `customer.created`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the webhook signing secret and add it to your environment variables

## Usage

### Option 1: Using Stripe Checkout (Hosted Payment Page)

This is the recommended approach for most use cases.

```typescript
// Example: Create a checkout session
const response = await fetch('/api/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [
      {
        name: 'Product Name',
        description: 'Product Description',
        price: 29.99, // in dollars
        quantity: 1,
        images: ['https://example.com/image.jpg'], // optional
      },
    ],
    successUrl: 'https://your-domain.com/payment/success',
    cancelUrl: 'https://your-domain.com/payment/cancel',
  }),
});

const { sessionId, url } = await response.json();

// Redirect to Stripe Checkout
const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
await stripe.redirectToCheckout({ sessionId });
```

### Option 2: Using Payment Intents (Custom Payment Flow)

For custom payment forms with more control.

```typescript
// Example: Create a payment intent
const response = await fetch('/api/create-payment-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 29.99, // in dollars
    currency: 'usd',
    metadata: {
      orderId: '123',
      customerId: 'user_456',
    },
  }),
});

const { clientSecret } = await response.json();

// Use with Stripe Elements to collect payment details
// See: https://stripe.com/docs/payments/accept-a-payment
```

## Testing the Integration

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Visit the Checkout Page

Navigate to: http://localhost:3000/checkout

### 3. Use Stripe Test Cards

- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0027 6000 3184

More test cards: https://stripe.com/docs/testing

### 4. Monitor Webhook Events

If using Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Watch the console for webhook events as payments are processed.

## Webhook Event Handlers

The webhook handler (`src/app/api/webhooks/stripe/route.ts`) includes handlers for:

- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.payment_failed` - Payment failed
- `checkout.session.completed` - Checkout session completed
- `checkout.session.async_payment_succeeded` - Async payment succeeded
- `checkout.session.async_payment_failed` - Async payment failed
- `charge.succeeded` - Charge succeeded
- `charge.failed` - Charge failed
- `customer.created` - New customer created
- `invoice.paid` - Invoice paid
- `invoice.payment_failed` - Invoice payment failed

### Implementing Business Logic

Edit the handler functions in `src/app/api/webhooks/stripe/route.ts` to add your business logic:

```typescript
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // TODO: Implement your business logic
  // Examples:
  // - Update order status in database
  // - Send confirmation email
  // - Fulfill order
  // - Update inventory
  console.log('Payment succeeded:', paymentIntent.id);
}
```

## Security Best Practices

1. **Never expose secret keys** - Keep `STRIPE_SECRET_KEY` server-side only
2. **Verify webhook signatures** - Always verify webhook signatures to prevent tampering
3. **Use HTTPS in production** - Webhooks require HTTPS endpoints
4. **Validate amounts server-side** - Never trust client-side amounts
5. **Handle idempotency** - Webhooks may be sent multiple times, handle this gracefully
6. **Log webhook events** - Keep logs for debugging and audit purposes

## Deployment

### Environment Variables for Production

Add these environment variables to your deployment platform:

```env
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
```

### Google Cloud Run Deployment

If deploying to Google Cloud Run, update `cloudrun.yaml` to include environment variables:

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: bb-basic-test
spec:
  template:
    spec:
      containers:
      - image: gcr.io/YOUR_PROJECT/bb-basic-test
        env:
        - name: STRIPE_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: stripe-secret-key
              key: latest
        - name: STRIPE_WEBHOOK_SECRET
          valueFrom:
            secretKeyRef:
              name: stripe-webhook-secret
              key: latest
        - name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
          value: "pk_live_your_publishable_key"
        - name: NEXT_PUBLIC_BASE_URL
          value: "https://your-domain.com"
```

Store secrets using Google Secret Manager:
```bash
echo -n "sk_live_your_secret_key" | gcloud secrets create stripe-secret-key --data-file=-
echo -n "whsec_your_webhook_secret" | gcloud secrets create stripe-webhook-secret --data-file=-
```

## Troubleshooting

### Webhook signature verification fails

- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- Check that you're using the correct secret for your environment (test vs. live)
- Verify the webhook endpoint URL matches your configuration

### Payments not processing

- Check Stripe Dashboard > Logs for errors
- Verify API keys are correct
- Ensure environment variables are loaded properly
- Check browser console and server logs for errors

### Checkout redirect fails

- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Check that the publishable key matches your environment
- Ensure the checkout session was created successfully

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Next.js Documentation](https://nextjs.org/docs)

## Support

For issues with:
- **Stripe integration**: Check [Stripe Documentation](https://stripe.com/docs) or contact Stripe Support
- **Application code**: Review this documentation or check the code comments
- **Deployment**: Refer to your hosting platform's documentation

## License

This integration follows the same license as the main project.
