# Testing Guide - Payment System

## Prerequisites

### 1. MongoDB Connection
Ensure MongoDB is accessible. The application uses:
- `MONGODB_URI` from `.env.local`, OR
- `MDB_MCP_CONNECTION_STRING` environment variable

### 2. Stripe Test Keys
Get your test keys from https://dashboard.stripe.com/test/apikeys

Add to `.env.local`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Start Stripe Webhook Listener
```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

Copy the webhook signing secret to `.env.local`

## Testing Steps

### 1. Start Development Server
```bash
pnpm dev
```

### 2. Test User Signup (API)
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "credits": 5
  }
}
```

### 3. Test Login (API)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### 4. Test Get User Info (API)
```bash
TOKEN="your_jwt_token_from_signup_or_login"

curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Test Credit Balance (API)
```bash
curl http://localhost:3000/api/credits/balance \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Test Create Payment Intent (API)
```bash
curl -X POST http://localhost:3000/api/payment/create-payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 10}'
```

Expected Response:
```json
{
  "success": true,
  "clientSecret": "pi_..._secret_...",
  "paymentIntentId": "pi_..."
}
```

### 7. Test Sandbox Start (API)
```bash
curl -X POST http://localhost:3000/api/sandbox/start \
  -H "Authorization: Bearer $TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "message": "Sandbox started successfully",
  "sandbox": {
    "id": "...",
    "startTime": "2025-12-25T...",
    "status": "running",
    "billingRate": {
      "hourly": 0.85,
      "daily": 2
    },
    "machineSpecs": {
      "cpu": 1,
      "memory": 2,
      "storage": 8
    }
  }
}
```

### 8. Test Sandbox Status (API)
```bash
curl http://localhost:3000/api/sandbox/status \
  -H "Authorization: Bearer $TOKEN"
```

### 9. Test Sandbox Stop (API)
```bash
curl -X POST http://localhost:3000/api/sandbox/stop \
  -H "Authorization: Bearer $TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "message": "Sandbox stopped successfully",
  "billing": {
    "totalCost": 0.02,
    "duration": {
      "start": "2025-12-25T...",
      "end": "2025-12-25T...",
      "milliseconds": 85000
    },
    "remainingCredits": 4.98
  }
}
```

### 10. Test Transaction History (API)
```bash
curl http://localhost:3000/api/credits/history?limit=10 \
  -H "Authorization: Bearer $TOKEN"
```

## UI Testing

### 1. Open Browser
Navigate to http://localhost:3000

### 2. Test Signup Flow
1. Click "Sign up" button
2. Enter email, password, and name
3. Click "Sign Up"
4. Verify you receive $5 initial credits
5. Should be logged in automatically

### 3. Test Login Flow
1. Logout if logged in
2. Click "Login" button
3. Enter credentials
4. Click "Login"
5. Should see dashboard with credit balance

### 4. Test Profile Sidebar
1. Click profile button (top right)
2. Verify user info displays
3. Verify credit balance shows $5.00
4. Check pricing information
5. View transaction history (should show "Initial signup bonus")

### 5. Test Payment Flow
1. Click "Add Credits" button in profile sidebar
2. Enter amount (minimum $5)
3. Try quick amount buttons ($5, $10, $25, $50)
4. Click "Continue to Payment"
5. Enter test card: `4242 4242 4242 4242`
6. Enter any future expiry (e.g., 12/26)
7. Enter any 3-digit CVC (e.g., 123)
8. Enter any ZIP code (e.g., 12345)
9. Click "Pay $X"
10. Wait for payment processing
11. Verify credits updated in profile
12. Check transaction history for new entry

### 6. Test Sandbox Control
1. Verify "Start Sandbox" button is enabled
2. Click "Start Sandbox"
3. Verify status changes to "Running"
4. Watch real-time cost updates (every 5 seconds)
5. Verify duration timer
6. Wait at least 10 seconds
7. Click "Stop Sandbox"
8. Verify billing summary alert
9. Check credits deducted
10. Verify transaction history shows debit

### 7. Test Insufficient Credits
1. Start and stop sandbox multiple times to drain credits
2. When credits < $0.10, verify:
   - "Start Sandbox" button is disabled
   - Error message shows "Insufficient credits"
3. Add credits via payment
4. Verify button becomes enabled

### 8. Test Responsive Design
1. Resize browser window
2. Test mobile view (< 768px)
3. Verify sidebar becomes bottom panel
4. Test tablet view (768px - 1024px)
5. Test desktop view (> 1024px)

## Stripe Test Cards

### Success Cards
- **Basic**: `4242 4242 4242 4242`
- **3D Secure**: `4000 0025 0000 3155`

### Decline Cards
- **Generic Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **Lost Card**: `4000 0000 0000 9987`
- **Stolen Card**: `4000 0000 0000 9979`

### Other Test Scenarios
- **Expired Card**: `4000 0000 0000 0069`
- **Incorrect CVC**: `4000 0000 0000 0127`
- **Processing Error**: `4000 0000 0000 0119`

## Webhook Testing

### 1. Verify Webhook Listener
```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

Should show:
```
> Ready! Your webhook signing secret is whsec_... (^C to quit)
```

### 2. Test Webhook Manually
```bash
stripe trigger payment_intent.succeeded
```

### 3. Verify Webhook Logs
Check Stripe CLI output for:
- `payment_intent.succeeded` event received
- Webhook endpoint responded with 200
- Credits added to user account

### 4. Check Application Logs
Look for:
```
Payment succeeded: pi_..., Credits added: $10
```

## Database Verification

### Check Collections
```bash
# Using MongoDB CLI tools
mongoexport --uri="$MDB_MCP_CONNECTION_STRING" \
  --db=sandbox_billing \
  --collection=users \
  --limit=5

mongoexport --uri="$MDB_MCP_CONNECTION_STRING" \
  --db=sandbox_billing \
  --collection=transactions \
  --limit=10

mongoexport --uri="$MDB_MCP_CONNECTION_STRING" \
  --db=sandbox_billing \
  --collection=sandboxes \
  --limit=5

mongoexport --uri="$MDB_MCP_CONNECTION_STRING" \
  --db=sandbox_billing \
  --collection=payments \
  --limit=5
```

## Common Issues

### 1. MongoDB Connection Failed
- Verify `MONGODB_URI` or `MDB_MCP_CONNECTION_STRING` is set
- Check network connectivity
- Verify MongoDB Atlas IP whitelist (0.0.0.0/0 for testing)

### 2. Stripe Webhook Not Working
- Ensure Stripe CLI is running
- Verify webhook secret in `.env.local`
- Check webhook endpoint URL
- Review Stripe CLI logs

### 3. Payment Not Completing
- Check browser console for errors
- Verify Stripe publishable key
- Ensure using test mode keys
- Check network tab for API responses

### 4. Credits Not Updating
- Verify webhook received event
- Check MongoDB connection
- Review server logs
- Ensure payment status is 'succeeded'

### 5. JWT Token Expired
- Token expires after 7 days
- Logout and login again
- Check JWT_SECRET is consistent

## Performance Testing

### 1. Concurrent Users
```bash
# Install Apache Bench
sudo dnf install httpd-tools -y

# Test signup endpoint
ab -n 100 -c 10 -p signup.json -T application/json \
  http://localhost:3000/api/auth/signup
```

### 2. Load Testing Sandbox Operations
```bash
# Create test script
cat > test_sandbox.sh << 'EOF'
#!/bin/bash
TOKEN="your_token_here"

for i in {1..10}; do
  echo "Test $i: Starting sandbox..."
  curl -X POST http://localhost:3000/api/sandbox/start \
    -H "Authorization: Bearer $TOKEN"
  
  sleep 5
  
  echo "Test $i: Stopping sandbox..."
  curl -X POST http://localhost:3000/api/sandbox/stop \
    -H "Authorization: Bearer $TOKEN"
  
  sleep 2
done
EOF

chmod +x test_sandbox.sh
./test_sandbox.sh
```

## Security Testing

### 1. Test Authentication
- Try accessing protected endpoints without token
- Try with invalid token
- Try with expired token

### 2. Test Authorization
- Try accessing other user's data
- Try manipulating userId in requests

### 3. Test Input Validation
- Try SQL injection in email field
- Try XSS in name field
- Try negative amounts for payment
- Try amounts below minimum ($5)

## Success Criteria

✅ User can signup and receive $5 credits
✅ User can login and logout
✅ User can view credit balance
✅ User can add credits via Stripe payment
✅ Payment modal works without page redirect
✅ Webhook processes payments correctly
✅ Credits update after successful payment
✅ User can start sandbox
✅ Billing calculates correctly (hourly vs daily)
✅ Real-time cost updates work
✅ User can stop sandbox
✅ Credits deducted on sandbox stop
✅ Transaction history shows all activities
✅ Insufficient credits prevents sandbox start
✅ UI is responsive on all devices
✅ All API endpoints return correct responses
✅ Error handling works properly
✅ Security measures are in place

## Next Steps

1. Deploy to production environment
2. Set up production Stripe webhook
3. Configure production MongoDB
4. Set up monitoring and logging
5. Implement rate limiting
6. Add email notifications
7. Create admin dashboard
8. Add usage analytics
