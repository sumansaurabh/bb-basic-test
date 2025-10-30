# Quick Start Guide

Get up and running with the reliability-enhanced Next.js application in minutes.

## Prerequisites

- Node.js 18 or higher
- pnpm (or npm/yarn)
- Docker (optional, for containerized deployment)

## Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env

# 3. (Optional) Edit .env with your settings
nano .env
```

## Development

```bash
# Start development server
pnpm dev

# Open browser
open http://localhost:3000
```

## Testing the New Features

### 1. Health Check
```bash
curl http://localhost:3000/api/health | jq
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "uptime": 60,
  "responseTime": 5,
  "system": {
    "memory": {
      "heapUsedPercent": 45
    }
  }
}
```

### 2. Test Error Handling
```bash
curl http://localhost:3000/api/test | jq
```

Expected: Graceful error response (no crash!)

### 3. Test Rate Limiting
```bash
# Send 70 requests quickly (limit is 60/min)
for i in {1..70}; do 
  curl -s http://localhost:3000/api/test
  echo ""
done
```

Expected: First 60 succeed, then 429 rate limit errors

### 4. Test Input Validation
```bash
curl -X POST http://localhost:3000/api/heavy-processing \
  -H "Content-Type: application/json" \
  -d '{"iterations": 999999, "complexity": "invalid"}' | jq
```

Expected: Validation error with clear message

### 5. Test Heavy Processing
```bash
curl -X POST http://localhost:3000/api/heavy-processing \
  -H "Content-Type: application/json" \
  -d '{"iterations": 1000, "complexity": "medium"}' | jq
```

Expected: Successful processing with metrics

## Production Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Docker Deployment

```bash
# Build Docker image
docker build -t nextjs-app .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  nextjs-app

# Check health
docker ps  # Shows health status
curl http://localhost:3000/api/health
```

## Using the New Features in Your Code

### 1. Create a Protected API Route

```typescript
// src/app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ApiHandlerPresets } from '@/lib/api-middleware';
import { validateString, validateNumber } from '@/lib/validation';
import { logger } from '@/lib/logger';

async function handler(request: NextRequest) {
  // Validate input
  const body = await request.json();
  const name = validateString(body.name, 'name', { minLength: 2 });
  const age = validateNumber(body.age, 'age', { min: 0, max: 150 });

  // Log the operation
  logger.info('Processing user data', { name, age });

  // Your business logic here
  const result = { name, age, processed: true };

  return NextResponse.json({ success: true, data: result });
}

// Export with automatic middleware
export const POST = ApiHandlerPresets.standard(handler);
```

### 2. Add Logging to Your Code

```typescript
import { logger } from '@/lib/logger';

// Simple logging
logger.info('User action completed');
logger.error('Operation failed', error);

// With context
logger.info('Payment processed', {
  userId: '123',
  amount: 99.99,
  currency: 'USD'
});

// Create child logger with persistent context
const requestLogger = logger.child({ requestId: 'abc-123' });
requestLogger.info('Step 1 completed');
requestLogger.info('Step 2 completed');
```

### 3. Validate User Input

```typescript
import {
  validateString,
  validateNumber,
  validateEmail,
  validateRequiredFields
} from '@/lib/validation';

// Validate individual fields
const email = validateEmail(input.email);
const age = validateNumber(input.age, 'age', { min: 18, max: 120 });
const username = validateString(input.username, 'username', {
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9_]+$/
});

// Validate required fields
const data = validateRequiredFields(body, ['name', 'email', 'age']);
```

### 4. Throw Proper Errors

```typescript
import { ValidationError, NotFoundError } from '@/lib/errors';

if (!user) {
  throw new NotFoundError('User not found');
}

if (age < 18) {
  throw new ValidationError('User must be at least 18 years old');
}
```

### 5. Monitor Performance

```typescript
import { measureAsync, performanceMonitor } from '@/lib/monitoring';

// Measure async operation
const result = await measureAsync(
  'database-query',
  async () => {
    return await db.query('SELECT * FROM users');
  },
  { table: 'users' }
);

// Get statistics
const stats = performanceMonitor.getStats('database-query');
console.log(`Average: ${stats.avg}ms, P95: ${stats.p95}ms`);
```

## Environment Variables

Key environment variables (see `.env.example` for all):

```bash
# Required
NODE_ENV=development          # development, production, test

# Optional (with defaults)
PORT=3000                     # Server port
LOG_LEVEL=info               # debug, info, warn, error, fatal
API_TIMEOUT=30000            # API timeout in ms
RATE_LIMIT_ENABLED=true      # Enable rate limiting
```

## Monitoring in Production

### Check Application Health
```bash
# Full health check
curl https://your-domain.com/api/health

# Quick readiness check
curl -I https://your-domain.com/api/health
```

### View Logs
```bash
# If using Docker
docker logs <container-id> --tail 100 -f

# If using PM2
pm2 logs nextjs-app

# If using systemd
journalctl -u nextjs-app -f
```

### Monitor Memory Usage
```bash
# Check health endpoint for memory metrics
curl https://your-domain.com/api/health | jq '.system.memory'
```

## Troubleshooting

### Application Won't Start
1. Check environment variables: `cat .env`
2. Verify dependencies: `pnpm install`
3. Check logs for errors

### High Memory Usage
1. Check health endpoint: `curl http://localhost:3000/api/health`
2. Look for memory leaks in custom code
3. Review client components for proper cleanup

### Rate Limit Errors
1. Check rate limit configuration in `.env`
2. Verify client IP detection is working
3. Consider increasing limits for legitimate traffic

### Build Errors
```bash
# Clean and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

## Next Steps

1. ✅ Read [RELIABILITY.md](./RELIABILITY.md) for detailed documentation
2. ✅ Review [IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md) for all changes
3. ✅ Customize rate limits for your use case
4. ✅ Set up monitoring and alerting
5. ✅ Configure production environment variables
6. ✅ Set up CI/CD pipeline
7. ✅ Add automated tests

## Support

- **Documentation**: See [RELIABILITY.md](./RELIABILITY.md)
- **Issues**: Check logs and health endpoint
- **Configuration**: Review `.env.example`

## Quick Reference

| Feature | File | Usage |
|---------|------|-------|
| Error Handling | `src/lib/errors.ts` | `throw new ValidationError('message')` |
| Logging | `src/lib/logger.ts` | `logger.info('message', { context })` |
| Validation | `src/lib/validation.ts` | `validateString(value, 'field')` |
| Rate Limiting | `src/lib/rate-limiter.ts` | Automatic via middleware |
| Monitoring | `src/lib/monitoring.ts` | `measureAsync('name', fn)` |
| API Middleware | `src/lib/api-middleware.ts` | `ApiHandlerPresets.standard(handler)` |
| Health Check | `/api/health` | `GET /api/health` |

---

**You're all set!** 🚀

The application now has production-grade reliability features. Start building your features with confidence!
