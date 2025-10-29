# 🚀 Quick Reference Guide

## 📁 New Utility Libraries

### Logger (`src/lib/logger.ts`)
```typescript
import { logger } from '@/lib/logger';

// Log levels
logger.debug('Debug message', { context });
logger.info('Info message', { context });
logger.warn('Warning message', { context });
logger.error('Error message', error, { context });

// API logging
logger.logRequest('GET', '/api/endpoint', { clientId });
logger.logResponse('GET', '/api/endpoint', 200, duration, { clientId });
```

### Error Handling (`src/lib/errors.ts`)
```typescript
import { ValidationError, NotFoundError, RateLimitError, TimeoutError, handleApiError } from '@/lib/errors';

// Throw custom errors
throw new ValidationError('Invalid input', { field: 'email' });
throw new NotFoundError('User not found', { userId: 123 });
throw new RateLimitError('Too many requests');
throw new TimeoutError('Operation timed out');

// Handle errors in API routes
try {
  // ... your code
} catch (error) {
  const errorResponse = handleApiError(error);
  return NextResponse.json(
    { success: false, error: errorResponse.message, ...errorResponse.context },
    { status: errorResponse.statusCode }
  );
}
```

### Input Validation (`src/lib/validation.ts`)
```typescript
import { Validator } from '@/lib/validation';

// Validate numbers
const age = Validator.isNumberInRange(body.age, 0, 120, 'age');

// Validate enums
const status = Validator.isOneOf(body.status, ['active', 'inactive'], 'status');

// Validate strings
const name = Validator.isNonEmptyString(body.name, 'name');

// Validate email
const email = Validator.isEmail(body.email);

// Validate request body
const validatedBody = Validator.validateBody<{ name: string; email: string }>(
  body,
  ['name', 'email']
);

// Sanitize input
const clean = Validator.sanitizeString(userInput);
```

### Rate Limiting (`src/lib/rate-limiter.ts`)
```typescript
import { rateLimiter, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limiter';

// In API route
const clientId = getClientIdentifier(request);

// Check rate limit (throws RateLimitError if exceeded)
rateLimiter.check(clientId, RATE_LIMITS.heavy);

// Get rate limit info
const info = rateLimiter.getInfo(clientId, RATE_LIMITS.standard);
// Returns: { remaining: 50, resetTime: 1234567890, limit: 60 }

// Available rate limits
RATE_LIMITS.standard  // 60 req/min
RATE_LIMITS.heavy     // 10 req/min
RATE_LIMITS.strict    // 5 req/min

// Custom rate limit
rateLimiter.check(clientId, {
  windowMs: 60000,
  maxRequests: 100
});
```

### Timeout Protection (`src/lib/timeout.ts`)
```typescript
import { withTimeout, TIMEOUTS } from '@/lib/timeout';

// Wrap async operation with timeout
const result = await withTimeout(
  someAsyncOperation(),
  TIMEOUTS.heavy,
  'Operation timed out'
);

// Available timeouts
TIMEOUTS.quick     // 5 seconds
TIMEOUTS.standard  // 30 seconds
TIMEOUTS.heavy     // 60 seconds
TIMEOUTS.maximum   // 2 minutes

// Custom timeout
const result = await withTimeout(
  fetchData(),
  10000, // 10 seconds
  'Data fetch timed out'
);
```

### Configuration (`src/lib/config.ts`)
```typescript
import { config } from '@/lib/config';

// Get configuration
const appConfig = config.get();

// Check environment
if (config.isProduction()) {
  // Production-specific code
}

if (config.isDevelopment()) {
  // Development-specific code
}

// Access specific config values
const { port, serviceName, rateLimitEnabled } = config.get();
```

## 🔌 API Endpoints

### Health Check
```bash
# Get service health status
GET /api/health

# Quick readiness check
HEAD /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-29T...",
  "uptime": 123.45,
  "environment": "development",
  "memory": {
    "heapUsedMB": 50,
    "heapTotalMB": 100
  },
  "checks": {
    "memory": { "status": "ok", "message": "..." },
    "uptime": { "status": "ok", "message": "..." }
  }
}
```

### Test Endpoint (Fixed)
```bash
GET /api/test
```

### Heavy Processing
```bash
# GET - Run default heavy processing
GET /api/heavy-processing

# POST - Custom heavy processing
POST /api/heavy-processing
Content-Type: application/json

{
  "iterations": 5000,
  "complexity": "medium"  // "light" | "medium" | "heavy"
}
```

## 🛡️ API Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { handleApiError, ValidationError } from '@/lib/errors';
import { rateLimiter, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limiter';
import { withTimeout, TIMEOUTS } from '@/lib/timeout';
import { Validator } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const clientId = getClientIdentifier(request);

  try {
    // Rate limiting
    rateLimiter.check(clientId, RATE_LIMITS.standard);
    
    // Log request
    logger.logRequest('GET', '/api/your-endpoint', { clientId });

    // Your logic here (with timeout if needed)
    const result = await withTimeout(
      yourAsyncOperation(),
      TIMEOUTS.standard,
      'Operation timed out'
    );

    const duration = Date.now() - startTime;
    
    // Log response
    logger.logResponse('GET', '/api/your-endpoint', 200, duration, { clientId });

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Endpoint error', error, { clientId, duration });
    
    const errorResponse = handleApiError(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.message,
        timestamp: new Date().toISOString(),
        ...errorResponse.context,
      },
      { status: errorResponse.statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientId = getClientIdentifier(request);

  try {
    // Rate limiting
    rateLimiter.check(clientId, RATE_LIMITS.standard);
    
    // Log request
    logger.logRequest('POST', '/api/your-endpoint', { clientId });

    // Parse and validate body
    const body = await request.json();
    const validatedBody = Validator.validateBody(body, ['requiredField']);
    
    // Validate specific fields
    const value = Validator.isNumberInRange(
      validatedBody.requiredField,
      0,
      100,
      'requiredField'
    );

    // Your logic here
    const result = await yourOperation(value);

    const duration = Date.now() - startTime;
    logger.logResponse('POST', '/api/your-endpoint', 200, duration, { clientId });

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Endpoint error', error, { clientId, duration });
    
    const errorResponse = handleApiError(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.message,
        timestamp: new Date().toISOString(),
        ...errorResponse.context,
      },
      { status: errorResponse.statusCode }
    );
  }
}
```

## 🐳 Docker Commands

```bash
# Build image
docker build -t nextjs-app .

# Run container
docker run -p 3000:3000 nextjs-app

# Check health
docker inspect --format='{{.State.Health.Status}}' <container-id>

# View logs
docker logs <container-id>
```

## 🔧 Development Commands

```bash
# Install dependencies
pnpm install

# Development server (DO NOT USE IN PRODUCTION)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## 🌍 Environment Variables

Create a `.env.local` file (see `.env.example`):

```bash
NODE_ENV=development
SERVICE_NAME=nextjs-app
PORT=3000
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_ENABLED=true

# Timeouts (milliseconds)
API_TIMEOUT=30000
HEAVY_PROCESSING_TIMEOUT=60000

# Security
CORS_ENABLED=true
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 📊 Monitoring

### Health Check Integration

**Kubernetes:**
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

**Docker Compose:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## 🔍 Debugging

### View Logs
```bash
# Development - logs to console
pnpm dev

# Production - structured JSON logs
pnpm start | jq .
```

### Test Rate Limiting
```bash
# Bash
for i in {1..15}; do curl http://localhost:3000/api/heavy-processing; echo ""; done

# Or use a tool like Apache Bench
ab -n 20 -c 5 http://localhost:3000/api/heavy-processing
```

### Test Timeout
```bash
curl -X POST http://localhost:3000/api/heavy-processing \
  -H "Content-Type: application/json" \
  -d '{"iterations": 50000, "complexity": "heavy"}'
```

## 📚 Additional Documentation

- **IMPROVEMENTS.md** - Detailed documentation of all improvements
- **HEALTH_CHECK_SUMMARY.md** - Summary of health check results
- **.env.example** - Environment variable template

## 🆘 Common Issues

### Rate Limit Errors
**Problem:** Getting 429 errors
**Solution:** Wait for the rate limit window to reset or adjust limits in code

### Timeout Errors
**Problem:** Getting 408 timeout errors
**Solution:** Reduce iterations/complexity or increase timeout values

### Memory Issues
**Problem:** Health check shows high memory usage
**Solution:** Restart service or investigate memory leaks

### Build Errors
**Problem:** Build fails
**Solution:** Run `pnpm install` and check for TypeScript errors

## 🎯 Best Practices

1. **Always validate input** before processing
2. **Use rate limiting** for resource-intensive endpoints
3. **Wrap long operations** with timeout protection
4. **Log all errors** with context
5. **Monitor health endpoint** in production
6. **Use structured logging** for easy parsing
7. **Handle errors gracefully** with user-friendly messages
8. **Test rate limits** before deploying
9. **Set appropriate timeouts** based on operation type
10. **Review logs regularly** for issues
