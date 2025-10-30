# Quick Start Guide - Reliability Features

This guide helps you quickly start using the reliability features in your Next.js application.

## 🚀 5-Minute Setup

### 1. Environment Configuration (1 min)

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

Minimum required:
```bash
NODE_ENV=development
LOG_LEVEL=info
```

### 2. Install Dependencies (1 min)

```bash
pnpm install
```

### 3. Start Development Server (1 min)

```bash
pnpm dev
```

### 4. Test Health Check (1 min)

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "uptime": 10,
  "memory": { ... }
}
```

### 5. Review Documentation (1 min)

- **Quick Reference**: This file
- **Full Guide**: [RELIABILITY.md](./RELIABILITY.md)
- **Improvements**: [IMPROVEMENTS.md](./IMPROVEMENTS.md)

---

## 📝 Common Use Cases

### Use Case 1: Create a Protected API Endpoint

```typescript
// src/app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware, MiddlewarePresets } from '@/lib/api-middleware';
import { logger } from '@/lib/logger';
import { validateNumber } from '@/lib/validation';

const handler = async (request: NextRequest) => {
  logger.info('My endpoint called');
  
  const body = await request.json();
  const value = validateNumber(body.value, 'value', { min: 0, max: 100 });
  
  return NextResponse.json({ success: true, value });
};

export const POST = withMiddleware(handler, MiddlewarePresets.standard);
```

**Features included**:
- ✅ Rate limiting (60 req/min)
- ✅ Request logging
- ✅ Error handling
- ✅ 30s timeout
- ✅ Request ID

### Use Case 2: Add Logging to Existing Code

```typescript
import { logger } from '@/lib/logger';

// Simple logging
logger.info('User logged in');
logger.error('Database error', error);

// With context
logger.info('Processing payment', {
  userId: '123',
  amount: 99.99,
  currency: 'USD'
});

// Child logger for related operations
const requestLogger = logger.child({ requestId: 'req_123' });
requestLogger.info('Request started');
requestLogger.info('Request completed');
```

### Use Case 3: Validate User Input

```typescript
import { 
  validateNumber, 
  validateString, 
  validateEmail 
} from '@/lib/validation';

const body = await request.json();

// Validate number with constraints
const age = validateNumber(body.age, 'age', { 
  min: 18, 
  max: 120, 
  integer: true 
});

// Validate string with enum
const status = validateString(body.status, 'status', { 
  enum: ['active', 'inactive', 'pending'] 
});

// Validate email
const email = validateEmail(body.email);
```

### Use Case 4: Handle Errors Properly

```typescript
import { ValidationError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';

try {
  if (!isValid) {
    throw new ValidationError('Invalid input data');
  }
  
  if (!found) {
    throw new NotFoundError('User not found');
  }
  
  // Your logic here
  
} catch (error) {
  logger.error('Operation failed', error as Error);
  throw error; // Middleware will handle it
}
```

### Use Case 5: Monitor Performance

```typescript
import { performanceMonitor } from '@/lib/monitoring';

// Measure async operation
const result = await performanceMonitor.measure(
  'database-query',
  async () => {
    return await db.query('SELECT * FROM users');
  },
  { query: 'users' }
);

// Get statistics
const stats = performanceMonitor.getStats('database-query');
console.log(`Average: ${stats.average}ms`);
console.log(`P95: ${stats.p95}ms`);
```

---

## 🎯 Middleware Presets

Choose the right preset for your endpoint:

### Standard (Most Common)
```typescript
export const GET = withMiddleware(handler, MiddlewarePresets.standard);
```
- Timeout: 30s
- Rate limit: 60 req/min
- Use for: Normal API endpoints

### Heavy Processing
```typescript
export const POST = withMiddleware(handler, MiddlewarePresets.heavy);
```
- Timeout: 60s
- Rate limit: 10 req/min
- Use for: Resource-intensive operations

### Public Endpoints
```typescript
export const GET = withMiddleware(handler, MiddlewarePresets.public);
```
- Timeout: 30s
- Rate limit: 100 req/min
- Use for: Public APIs with lenient limits

### Strict (Sensitive Operations)
```typescript
export const POST = withMiddleware(handler, MiddlewarePresets.strict);
```
- Timeout: 10s
- Rate limit: 5 req/min
- Use for: Authentication, payments, etc.

### Custom Configuration
```typescript
export const POST = withMiddleware(handler, {
  timeout: 45000,
  rateLimit: {
    windowMs: 60000,
    maxRequests: 30,
  },
  logRequests: true,
});
```

---

## 🔍 Debugging Tips

### Check Logs
```bash
# Development (human-readable)
pnpm dev

# Production (JSON)
LOG_LEVEL=debug pnpm start
```

### Check Health
```bash
curl http://localhost:3000/api/health | jq
```

### Test Rate Limiting
```bash
# Should succeed
for i in {1..50}; do 
  curl http://localhost:3000/api/test
done

# Should fail with 429
for i in {1..100}; do 
  curl http://localhost:3000/api/test
done
```

### Check Performance
```typescript
import { performanceMonitor } from '@/lib/monitoring';

// Get all metrics
const summary = performanceMonitor.getSummary();
console.log(summary);
```

---

## 🐳 Docker Quick Start

### Build
```bash
docker build -t nextjs-app .
```

### Run
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  nextjs-app
```

### Check Health
```bash
docker ps  # Should show "healthy" status
curl http://localhost:3000/api/health
```

---

## 📊 Monitoring Checklist

Daily checks:
- [ ] Check `/api/health` endpoint
- [ ] Review error logs
- [ ] Check memory usage
- [ ] Review rate limit hits

Weekly checks:
- [ ] Review performance metrics
- [ ] Check slow operations
- [ ] Review error patterns
- [ ] Update rate limits if needed

---

## 🆘 Common Issues

### Issue: Rate limit too strict
**Solution**: Adjust rate limit preset or use custom config
```typescript
export const GET = withMiddleware(handler, {
  rateLimit: {
    windowMs: 60000,
    maxRequests: 200, // Increased
  }
});
```

### Issue: Timeout too short
**Solution**: Increase timeout for heavy operations
```typescript
export const POST = withMiddleware(handler, {
  timeout: 120000, // 2 minutes
});
```

### Issue: Too many logs
**Solution**: Adjust log level
```bash
LOG_LEVEL=warn pnpm start
```

### Issue: Memory usage high
**Solution**: Check `/api/health` and review memory-intensive operations
```bash
curl http://localhost:3000/api/health | jq '.memory'
```

---

## 📚 Next Steps

1. ✅ Complete this quick start
2. 📖 Read [RELIABILITY.md](./RELIABILITY.md) for detailed docs
3. 🔧 Configure environment variables
4. 🧪 Test your endpoints
5. 📊 Set up monitoring
6. 🚀 Deploy to production

---

## 🔗 Quick Links

- **Full Documentation**: [RELIABILITY.md](./RELIABILITY.md)
- **Improvements Summary**: [IMPROVEMENTS.md](./IMPROVEMENTS.md)
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)
- **Health Report**: [SERVICE_HEALTH_REPORT.md](./SERVICE_HEALTH_REPORT.md)

---

## 💡 Pro Tips

1. **Always use middleware** for API routes
2. **Validate all inputs** before processing
3. **Log with context** for better debugging
4. **Monitor performance** of critical operations
5. **Check health endpoint** regularly
6. **Use appropriate rate limits** for each endpoint
7. **Handle errors gracefully** with custom error classes
8. **Test in development** before deploying

---

**Need Help?**
- Check [RELIABILITY.md](./RELIABILITY.md) for detailed documentation
- Review error logs for specific issues
- Check `/api/health` for service status
- Review performance metrics for slow operations
