# Stripe Payment Gateway - Quick Start Guide

## What Was Added

A complete Stripe payment integration with the following features:

### API Endpoints
1. **POST /api/create-payment-intent** - Create payment intents for custom payment flows
2. **POST /api/create-checkout-session** - Create hosted checkout sessions
3. **POST /api/webhooks/stripe** - Handle Stripe webhook events
4. **GET /api/checkout-session** - Retrieve checkout session details

### Pages
1. **/checkout** - Checkout page with Stripe integration
2. **/payment/success** - Payment success page
3. **/payment/cancel** - Payment cancellation page

### Configuration
- Stripe SDK initialized in `src/lib/stripe.ts`
- Environment variables template in `.env.example`

## Quick Setup (5 Minutes)

### 1. Get Stripe Keys
1. Sign up at https://stripe.com
2. Go to: Dashboard > Developers > API keys
3. Copy your test keys

### 2. Set Environment Variables
Create `.env.local` file:
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Test Webhooks Locally
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# OR download from: https://github.com/stripe/stripe-cli/releases

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook secret (whsec_...) to your `.env.local`

### 4. Start the App
```bash
npm run dev
```

### 5. Test Payment
1. Visit: http://localhost:3000
2. Click "💳 Stripe Checkout Demo"
3. Use test card: **4242 4242 4242 4242**
4. Any future date, any CVC, any ZIP

## Test Cards

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0027 6000 3184 | 3D Secure |

More: https://stripe.com/docs/testing

## File Structure

```
bb-basic-test/
├── src/
│   ├── lib/
│   │   └── stripe.ts                          # Stripe config
│   └── app/
│       ├── checkout/
│       │   └── page.tsx                       # Checkout page
│       ├── payment/
│       │   ├── success/page.tsx               # Success page
│       │   └── cancel/page.tsx                # Cancel page
│       └── api/
│           ├── create-payment-intent/route.ts  # Payment Intent API
│           ├── create-checkout-session/route.ts # Checkout Session API
│           ├── checkout-session/route.ts       # Get session details
│           └── webhooks/
│               └── stripe/route.ts             # Webhook handler
├── .env.example                               # Environment template
├── STRIPE_INTEGRATION.md                      # Full documentation
└── STRIPE_SETUP_QUICK_START.md               # This file
```

## Webhook Events Handled

The webhook handler processes these events:
- ✅ payment_intent.succeeded
- ❌ payment_intent.payment_failed
- ✅ checkout.session.completed
- ✅ checkout.session.async_payment_succeeded
- ❌ checkout.session.async_payment_failed
- ✅ charge.succeeded
- ❌ charge.failed
- 👤 customer.created
- 📄 invoice.paid
- ❌ invoice.payment_failed

## Next Steps

1. **Add Your Business Logic**
   - Edit handler functions in `src/app/api/webhooks/stripe/route.ts`
   - Add database updates, email notifications, etc.

2. **Customize Checkout**
   - Modify `src/app/checkout/page.tsx`
   - Add products from your database
   - Customize styling

3. **Production Setup**
   - Get live API keys from Stripe Dashboard
   - Set up production webhook endpoint
   - Deploy to Cloud Run or your platform
   - Update environment variables

## Need Help?

- **Full Documentation**: See `STRIPE_INTEGRATION.md`
- **Stripe Docs**: https://stripe.com/docs
- **Stripe API**: https://stripe.com/docs/api
- **Testing Guide**: https://stripe.com/docs/testing

## Security Notes

- ✅ Webhook signatures are verified
- ✅ Secret keys are server-side only
- ✅ Amounts are validated server-side
- ⚠️ Use HTTPS in production
- ⚠️ Never commit `.env.local` file

## Support

For issues:
1. Check `STRIPE_INTEGRATION.md` for detailed troubleshooting
2. Review Stripe Dashboard logs
3. Check browser console and server logs
4. Visit Stripe documentation or support

---

**Ready to test?** Start the dev server and visit http://localhost:3000/checkout
