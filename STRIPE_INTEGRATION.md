# Stripe Payment Gateway Integration

This Next.js application now includes a complete Stripe payment gateway integration with MongoDB for payment tracking.

## Features

✅ **Payment Intent Creation** - Create secure payment intents with Stripe
✅ **Stripe Elements** - Beautiful, customizable payment forms
✅ **Webhook Handling** - Real-time payment status updates
✅ **MongoDB Integration** - Store and track all payment records
✅ **Payment Status Tracking** - Query payment status via API
✅ **Success Page** - Confirmation page with payment details
✅ **Test Mode Support** - Easy testing with Stripe test cards

## Setup Instructions

### 1. Get Stripe API Keys

1. Sign up for a Stripe account at https://stripe.com
2. Go to Developers → API keys
3. Copy your **Publishable key** and **Secret key** (use test keys for development)

### 2. Set Up Webhook (Optional but Recommended)

1. Go to Developers → Webhooks in Stripe Dashboard
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.succeeded`
   - `charge.failed`
5. Copy the **Webhook signing secret**

For local development, use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Install Dependencies

Dependencies are already installed. If needed, run:
```bash
npm install
```

### 5. Run the Application

```bash
npm run dev
```

Visit http://localhost:3000 and click the "💳 Stripe Payment" button in the top-right corner.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── stripe/
│   │       ├── create-payment-intent/
│   │       │   └── route.ts          # Create payment intent API
│   │       ├── webhook/
│   │       │   └── route.ts          # Stripe webhook handler
│   │       └── payment-status/
│   │           └── route.ts          # Get payment status API
│   ├── payment/
│   │   ├── page.tsx                  # Payment form page
│   │   └── success/
│   │       └── page.tsx              # Payment success page
│   └── page.tsx                      # Home page (updated with payment link)
├── components/
│   ├── StripeProvider.tsx            # Stripe Elements provider
│   └── CheckoutForm.tsx              # Payment form component
├── lib/
│   ├── stripe.ts                     # Stripe configuration
│   └── mongodb.ts                    # MongoDB connection
└── models/
    └── Payment.ts                    # Payment TypeScript interfaces
```

## API Endpoints

### POST `/api/stripe/create-payment-intent`

Create a new payment intent.

**Request Body:**
```json
{
  "amount": 50.00,
  "currency": "usd",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "description": "Payment for services",
  "metadata": {
    "orderId": "12345"
  }
}
```

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### POST `/api/stripe/webhook`

Webhook endpoint for Stripe events. Automatically updates payment status in MongoDB.

**Handled Events:**
- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.payment_failed` - Payment failed
- `payment_intent.canceled` - Payment canceled
- `charge.succeeded` - Charge succeeded
- `charge.failed` - Charge failed

### GET `/api/stripe/payment-status?paymentIntentId=pi_xxx`

Get payment status from MongoDB.

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "...",
    "stripePaymentIntentId": "pi_xxx",
    "amount": 50.00,
    "currency": "usd",
    "status": "succeeded",
    "customerEmail": "customer@example.com",
    "customerName": "John Doe",
    "description": "Payment for services",
    "createdAt": "2025-12-30T...",
    "updatedAt": "2025-12-30T..."
  }
}
```

## MongoDB Schema

The `payments` collection stores payment records:

```typescript
{
  _id: ObjectId,
  stripePaymentIntentId: string,
  amount: number,
  currency: string,
  status: 'pending' | 'succeeded' | 'failed' | 'canceled',
  customerEmail?: string,
  customerName?: string,
  description?: string,
  metadata?: object,
  createdAt: Date,
  updatedAt: Date
}
```

## Testing

### Test Card Numbers

Use these test cards in development mode:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`
- **Insufficient Funds**: `4000 0000 0000 9995`

Use any future expiry date and any 3-digit CVC.

### Testing Webhooks Locally

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy the webhook signing secret and add it to `.env.local`

## Payment Flow

1. **User visits `/payment`** - Enters payment details (amount, email, name)
2. **Click "Proceed to Checkout"** - Creates payment intent via API
3. **Stripe Elements loads** - Secure payment form appears
4. **User enters card details** - Stripe validates in real-time
5. **Click "Pay"** - Payment is processed
6. **Webhook fires** - Payment status updated in MongoDB
7. **Redirect to `/payment/success`** - Confirmation page with details

## Security Best Practices

✅ **Never expose secret keys** - Only use `NEXT_PUBLIC_` prefix for publishable keys
✅ **Verify webhook signatures** - Always validate webhook events
✅ **Use HTTPS in production** - Required for Stripe webhooks
✅ **Validate amounts server-side** - Never trust client-side amounts
✅ **Store minimal data** - Don't store card details (Stripe handles this)
✅ **Use environment variables** - Never commit secrets to git

## Production Deployment

1. Replace test API keys with live keys
2. Update webhook endpoint URL in Stripe Dashboard
3. Set `NEXT_PUBLIC_APP_URL` to your production domain
4. Ensure MongoDB is accessible from production
5. Enable HTTPS (required for webhooks)

## Troubleshooting

### Payment Intent Creation Fails
- Check `STRIPE_SECRET_KEY` is set correctly
- Verify amount is greater than 0
- Check MongoDB connection

### Webhook Not Working
- Verify `STRIPE_WEBHOOK_SECRET` is set
- Check webhook URL is accessible
- Use Stripe CLI for local testing
- Check webhook event types are selected in Stripe Dashboard

### Payment Form Not Loading
- Check `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Verify client secret is valid
- Check browser console for errors

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Next.js Documentation](https://nextjs.org/docs)

## Support

For issues or questions:
- Check Stripe Dashboard logs
- Review server logs for errors
- Test with Stripe CLI
- Consult Stripe documentation
