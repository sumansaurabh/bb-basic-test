# Payment System Documentation

## Overview
This application implements a complete credit-based billing system with Stripe payment integration for a cloud sandbox platform.

## Features

### 1. User Authentication
- JWT-based authentication
- Signup with $5 initial credits
- Login/Logout functionality
- Secure password hashing with bcryptjs

### 2. Credit System
- Initial $5 credits on signup
- Minimum $5 top-up amount
- Real-time credit balance display
- Transaction history tracking

### 3. Stripe Payment Integration
- Custom checkout page (no redirect)
- Stripe Elements for secure card input
- Payment Intent API
- Webhook for payment confirmation
- Automatic credit addition on successful payment

### 4. Sandbox Billing
- **Pricing**: $0.85/hour or $2/day (whichever is lower)
- **Machine Specs**: 1 CPU, 2GB RAM, 8GB Storage
- Real-time billing calculation
- Automatic credit deduction on sandbox stop
- Insufficient credits protection

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Payment
- `POST /api/payment/create-payment-intent` - Create Stripe payment intent
- `POST /api/payment/webhook` - Stripe webhook handler

### Credits
- `GET /api/credits/balance` - Get user credit balance
- `GET /api/credits/history` - Get transaction history

### Sandbox
- `POST /api/sandbox/start` - Start sandbox and begin billing
- `POST /api/sandbox/stop` - Stop sandbox and calculate charges
- `GET /api/sandbox/status` - Get current sandbox status

## Setup Instructions

### 1. Environment Variables
Create a `.env.local` file with the following variables:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key

# JWT
JWT_SECRET=your_jwt_secret
```

### 2. Stripe Setup

#### Get Stripe Keys
1. Create a Stripe account at https://stripe.com
2. Go to Developers → API keys
3. Copy your Publishable key and Secret key
4. Add them to `.env.local`

#### Setup Webhook
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to local:
   ```bash
   stripe listen --forward-to localhost:3000/api/payment/webhook
   ```
4. Copy the webhook signing secret and add to `.env.local`

For production:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/payment/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy the webhook signing secret

### 3. MongoDB Setup
The application uses the MongoDB connection string from `MDB_MCP_CONNECTION_STRING` environment variable or `MONGODB_URI`.

Collections created automatically:
- `users` - User accounts and credits
- `sandboxes` - Sandbox instances and billing
- `transactions` - Credit transactions
- `payments` - Stripe payment records

### 4. Run the Application
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Testing

### Test Cards (Stripe Test Mode)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

### Test Flow
1. **Signup**: Create account → Receive $5 credits
2. **Start Sandbox**: Click "Start Sandbox" → Billing begins
3. **Monitor**: Watch real-time cost updates
4. **Stop Sandbox**: Click "Stop Sandbox" → Credits deducted
5. **Add Credits**: Click "Add Credits" → Enter amount → Pay with test card
6. **Verify**: Check credit balance and transaction history

## UI Components

### Profile Sidebar
- User information
- Credit balance display
- Add credits button
- Pricing information
- Transaction history
- Logout button

### Sandbox Control Panel
- Start/Stop sandbox
- Real-time billing display
- Current charges
- Duration tracking
- Machine specifications

### Payment Modal
- Amount selection
- Quick amount buttons ($5, $10, $25, $50)
- Stripe Elements card input
- Secure payment processing
- No page redirect

## Security Features
- JWT token authentication
- Password hashing with bcrypt
- Stripe webhook signature verification
- Protected API routes
- Input validation
- SQL injection prevention (MongoDB)
- XSS protection

## Billing Logic
```javascript
// Calculate cost based on duration
const hourlyRate = 0.85; // $0.85/hour
const dailyRate = 2.00;  // $2.00/day

const durationHours = (endTime - startTime) / (1000 * 60 * 60);
const hourlyCost = durationHours * hourlyRate;
const dailyCost = (durationHours / 24) * dailyRate;

// User pays the lower amount
const totalCost = Math.min(hourlyCost, dailyCost);
```

## Database Schema

### Users Collection
```typescript
{
  _id: ObjectId,
  email: string,
  password: string (hashed),
  name: string,
  credits: number,
  createdAt: Date,
  updatedAt: Date
}
```

### Sandboxes Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  startTime: Date,
  endTime: Date,
  status: 'running' | 'stopped',
  billingRate: { hourly: number, daily: number },
  totalCost: number,
  machineSpecs: { cpu: number, memory: number, storage: number },
  createdAt: Date,
  updatedAt: Date
}
```

### Transactions Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  amount: number,
  type: 'topup' | 'debit' | 'refund',
  description: string,
  stripePaymentId: string,
  sandboxId: ObjectId,
  status: 'pending' | 'completed' | 'failed',
  createdAt: Date
}
```

### Payments Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  amount: number,
  stripePaymentIntentId: string,
  status: 'pending' | 'succeeded' | 'failed' | 'canceled',
  metadata: object,
  createdAt: Date,
  updatedAt: Date
}
```

## Troubleshooting

### Webhook Not Working
- Ensure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/payment/webhook`
- Check webhook secret in `.env.local`
- Verify endpoint URL in Stripe Dashboard (production)

### Payment Not Completing
- Check browser console for errors
- Verify Stripe publishable key is correct
- Ensure using test cards in test mode
- Check network tab for API responses

### Credits Not Updating
- Verify webhook is receiving events
- Check MongoDB connection
- Review server logs for errors
- Ensure payment status is 'succeeded'

## Production Deployment

### Environment Variables
Set all environment variables in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Railway: Project → Variables
- Heroku: Settings → Config Vars

### Stripe Webhook
1. Update webhook URL to production domain
2. Use production Stripe keys
3. Test with real payment (small amount)
4. Monitor webhook logs in Stripe Dashboard

### Security Checklist
- [ ] Change JWT_SECRET to strong random string
- [ ] Use production Stripe keys
- [ ] Enable HTTPS
- [ ] Set secure cookie flags
- [ ] Enable rate limiting
- [ ] Add CORS configuration
- [ ] Monitor error logs
- [ ] Set up backup for MongoDB

## Support
For issues or questions, please refer to:
- Stripe Documentation: https://stripe.com/docs
- Next.js Documentation: https://nextjs.org/docs
- MongoDB Documentation: https://docs.mongodb.com
