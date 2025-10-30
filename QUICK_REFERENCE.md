# Quick Reference Guide

## 🚀 Common Tasks

### Using Error Handling
```typescript
import { ValidationError, formatErrorResponse } from '@/lib/errors';

// Throw specific errors
throw new ValidationError('Invalid email format');
throw new NotFoundError('User not found');
throw new RateLimitError('Too many requests');

// Format error responses
const errorResponse = formatErrorResponse(error, '/api/endpoint');
return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
```

### Using Logging
```typescript
import { logger } from '@/lib/logger';

// Log at different levels
logger.debug('Debug info', { userId: 123 });
logger.info('User logged in', { userId: 123, timestamp: Date.now() });
logger.warn('Deprecated API used', { endpoint: '/old-api' });
logger.error('Database error', error, { query: 'SELECT * FROM users' });
logger.fatal('Critical failure', error);

// Create child logger with context
const requestLogger = logger.child({ requestId: 'req_123' });
requestLogger.info('Processing request');
```

### Using Validation
```typescript
import { validateNumber, validateString, validateEmail } from '@/lib/validation';

// Validate number
const age = validateNumber(body.age, 'age', { 
  min: 0, 
  max: 150, 
  integer: true 
});

// Validate string
const username = validateString(body.username, 'username', {
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9_]+$/
});

// Validate email
const email = validateEmail(body.email);

// Validate required fields
const data = validateRequiredFields(body, ['name', 'email', 'age']);
```

### Using Middleware
```typescript
import { withMiddleware, MiddlewarePresets } from '@/lib/api-middleware';

// Basic usage with preset
async function handler(request: NextRequest) {
  return NextResponse.json({ success: true });
}

export const GET = withMiddleware(handler, MiddlewarePresets.standard);

// Custom configuration
export const POST = withMiddleware(handler, {
  timeout: 30000,
  rateLimit: { windowMs: 60000, maxRequests: 60 },
  logRequests: true,
});
```

### Using Rate Limiting
```typescript
import { rateLimiter, RateLimitPresets, getClientIdentifier } from '@/lib/rate-limiter';

// Check rate limit
const clientId = getClientIdentifier(request);
rateLimiter.check(clientId, RateLimitPresets.STANDARD);

// Custom rate limit
rateLimiter.check(clientId, {
  windowMs: 60000, // 1 minute
  maxRequests: 30,
});

// Get rate limit status
const status = rateLimiter.getStatus(clientId, RateLimitPresets.STANDARD);
console.log(`Remaining: ${status.remaining}/${status.total}`);
```

### Using Performance Monitoring
```typescript
import { measureAsync, performanceMonitor } from '@/lib/monitoring';

// Measure async operation
const result = await measureAsync('database-query', async () => {
  return await db.query('SELECT * FROM users');
}, { userId: 123 });

// Manual timing
const endTimer = performanceMonitor.startTimer('custom-operation');
// ... do work ...
endTimer({ success: true, itemsProcessed: 100 });

// Get statistics
const stats = performanceMonitor.getStats('database-query');
// Returns: { count, average, min, max, p50, p95, p99 }
```

---

## 🔧 Configuration

### Environment Variables
```bash
# .env file
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
API_TIMEOUT=30000
RATE_LIMIT_ENABLED=true
CORS_ORIGINS=http://localhost:3000,https://example.com
```

### Using Configuration
```typescript
import { config } from '@/lib/config';

const appConfig = config.get();
console.log(appConfig.port); // 3000

if (config.isDevelopment()) {
  // Development-specific code
}
```

---

## 🏥 Health Checks

### Check Service Health
```bash
curl http://localhost:3000/api/health
```

### Response Format
```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "uptime": 3600,
  "responseTime": 5,
  "memory": {
    "heapUsed": 50,
    "heapTotal": 100,
    "heapUsedPercent": 50
  }
}
```

---

## 🐳 Docker Commands

### Build Image
```bash
docker build -t nextjs-app .
```

### Run Container
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  -e RATE_LIMIT_ENABLED=true \
  nextjs-app
```

### Check Container Health
```bash
docker ps
# Look for "healthy" status
```

---

## 📊 Middleware Presets

| Preset | Timeout | Rate Limit | Use Case |
|--------|---------|------------|----------|
| `standard` | 30s | 60/min | Normal API endpoints |
| `heavy` | 60s | 10/min | Resource-intensive operations |
| `public` | 30s | 100/min | Public endpoints |
| `strict` | 10s | 5/min | Sensitive operations |

---

## 🔒 Security Headers (Auto-Applied)

- `Strict-Transport-Security` - Force HTTPS
- `X-Frame-Options` - Prevent clickjacking
- `X-Content-Type-Options` - Prevent MIME sniffing
- `X-XSS-Protection` - XSS protection
- `Referrer-Policy` - Control referrer information

---

## 📝 Error Response Format

All errors return this format:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "timestamp": "2025-10-30T12:00:00.000Z",
    "path": "/api/endpoint"
  }
}
```

---

## 🎯 Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `TIMEOUT` | 408 | Request timeout |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service down |

---

## 🧪 Testing Examples

### Test Rate Limiting
```bash
for i in {1..100}; do 
  curl http://localhost:3000/api/test
done
```

### Test Validation
```bash
curl -X POST http://localhost:3000/api/heavy-processing \
  -H "Content-Type: application/json" \
  -d '{"iterations": -1}'
```

### Test Error Handling
```bash
curl http://localhost:3000/api/test
```

---

## 📈 Monitoring Checklist

- [ ] Monitor `/api/health` every 30 seconds
- [ ] Alert on `status: "unhealthy"`
- [ ] Alert on memory usage > 90%
- [ ] Alert on error rate > 5%
- [ ] Track response time p95 and p99
- [ ] Monitor rate limit violations
- [ ] Check logs for slow operations (>1000ms)

---

## 🚨 Troubleshooting

### High Memory Usage
```typescript
// Check health endpoint
curl http://localhost:3000/api/health

// Look for memory.heapUsedPercent > 75%
```

### Slow Requests
```typescript
// Check logs for slow operations
// Look for: "Slow operation detected"
```

### Rate Limit Issues
```typescript
// Check rate limit status
const status = rateLimiter.getStatus(clientId, preset);
console.log(`Remaining: ${status.remaining}`);

// Reset if needed (development only)
rateLimiter.reset(clientId);
```

---

## 📚 Full Documentation

- **RELIABILITY.md** - Complete reliability guide
- **IMPROVEMENTS.md** - Detailed improvements
- **SUMMARY.md** - Project summary
- **QUICK_REFERENCE.md** - This file

---

## 💡 Tips

1. Always wrap API handlers with middleware
2. Validate all user inputs
3. Use structured logging instead of console.log
4. Monitor the health endpoint regularly
5. Set appropriate rate limits for each endpoint
6. Use child loggers for request context
7. Clean up resources in useEffect
8. Test error handling in development
9. Review logs for slow operations
10. Keep environment variables in .env file

---

## 🔗 Useful Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Start production
pnpm start

# Lint
pnpm lint

# Install dependencies
pnpm install

# Docker build
docker build -t nextjs-app .

# Docker run
docker run -p 3000:3000 nextjs-app
```

---

**For detailed information, see RELIABILITY.md**
