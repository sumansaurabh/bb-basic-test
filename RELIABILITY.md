# Service Reliability Documentation

This document outlines the reliability improvements and best practices implemented in this Next.js application.

## Table of Contents

1. [Error Handling](#error-handling)
2. [Logging](#logging)
3. [Rate Limiting](#rate-limiting)
4. [Request Validation](#request-validation)
5. [Monitoring](#monitoring)
6. [Health Checks](#health-checks)
7. [API Middleware](#api-middleware)
8. [Configuration Management](#configuration-management)
9. [Docker & Deployment](#docker--deployment)
10. [Best Practices](#best-practices)

---

## Error Handling

### Custom Error Classes

Located in `src/lib/errors.ts`, we provide structured error handling:

```typescript
import { ValidationError, NotFoundError, RateLimitError } from '@/lib/errors';

// Throw specific errors
throw new ValidationError('Invalid input');
throw new NotFoundError('Resource not found');
throw new RateLimitError('Too many requests');
```

**Available Error Classes:**
- `AppError` - Base error class
- `ValidationError` - 400 Bad Request
- `NotFoundError` - 404 Not Found
- `UnauthorizedError` - 401 Unauthorized
- `ForbiddenError` - 403 Forbidden
- `RateLimitError` - 429 Too Many Requests
- `TimeoutError` - 408 Request Timeout
- `ServiceUnavailableError` - 503 Service Unavailable

### Error Response Format

All errors return a consistent format:

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

## Logging

### Structured Logging

Located in `src/lib/logger.ts`, provides consistent logging across the application:

```typescript
import { logger } from '@/lib/logger';

// Different log levels
logger.debug('Debug information', { userId: 123 });
logger.info('User logged in', { userId: 123 });
logger.warn('Deprecated API used', { endpoint: '/old-api' });
logger.error('Database connection failed', error, { retries: 3 });
logger.fatal('Critical system failure', error);
```

**Log Levels:**
- `DEBUG` - Detailed debugging information
- `INFO` - General informational messages
- `WARN` - Warning messages
- `ERROR` - Error messages
- `FATAL` - Critical errors requiring immediate attention

**Environment Variables:**
- `LOG_LEVEL` - Set minimum log level (default: `info` in production, `debug` in development)

### Child Loggers

Create child loggers with additional context:

```typescript
const requestLogger = logger.child({ requestId: 'req_123', userId: 456 });
requestLogger.info('Processing request'); // Includes requestId and userId
```

---

## Rate Limiting

### In-Memory Rate Limiter

Located in `src/lib/rate-limiter.ts`:

```typescript
import { rateLimiter, RateLimitPresets, getClientIdentifier } from '@/lib/rate-limiter';

// Check rate limit
const clientId = getClientIdentifier(request);
rateLimiter.check(clientId, RateLimitPresets.STANDARD);
```

**Rate Limit Presets:**
- `STRICT` - 5 requests/minute (sensitive operations)
- `STANDARD` - 60 requests/minute (normal API endpoints)
- `LENIENT` - 100 requests/minute (public endpoints)
- `HEAVY` - 10 requests/minute (resource-intensive operations)

**Custom Rate Limits:**

```typescript
rateLimiter.check(clientId, {
  windowMs: 60000, // 1 minute
  maxRequests: 30,
});
```

**Environment Variables:**
- `RATE_LIMIT_ENABLED` - Enable/disable rate limiting (default: `true`)

---

## Request Validation

### Validation Utilities

Located in `src/lib/validation.ts`:

```typescript
import { validateNumber, validateString, validateEmail } from '@/lib/validation';

// Validate number with constraints
const age = validateNumber(body.age, 'age', { min: 0, max: 150, integer: true });

// Validate string with pattern
const username = validateString(body.username, 'username', {
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9_]+$/,
});

// Validate email
const email = validateEmail(body.email);

// Validate required fields
const data = validateRequiredFields(body, ['name', 'email', 'age']);
```

**Available Validators:**
- `validateNumber()` - Number validation with min/max/integer constraints
- `validateString()` - String validation with length/pattern/enum constraints
- `validateBoolean()` - Boolean validation
- `validateArray()` - Array validation with item validation
- `validateEmail()` - Email format validation
- `validateUrl()` - URL format validation
- `validateRequiredFields()` - Check required object fields
- `sanitizeString()` - XSS prevention

---

## Monitoring

### Performance Monitoring

Located in `src/lib/monitoring.ts`:

```typescript
import { performanceMonitor, measureAsync } from '@/lib/monitoring';

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

**Features:**
- Automatic slow operation detection (>1000ms)
- Performance statistics (average, percentiles)
- Operation tracking and metrics

---

## Health Checks

### Health Check Endpoint

**Endpoint:** `GET /api/health`

Returns service health status and metrics:

```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "uptime": 3600,
  "responseTime": 5,
  "version": "v18.0.0",
  "environment": "production",
  "memory": {
    "heapUsed": 50,
    "heapTotal": 100,
    "heapUsedPercent": 50,
    "rss": 150,
    "external": 10
  }
}
```

**Status Values:**
- `healthy` - Service is operating normally
- `degraded` - Service is operational but experiencing issues
- `unhealthy` - Service is not functioning properly

**Readiness Check:** `HEAD /api/health`

Returns 200 if ready, 503 if not ready.

### Docker Health Check

The Dockerfile includes a health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', ...)"
```

---

## API Middleware

### Middleware Wrapper

Located in `src/lib/api-middleware.ts`:

```typescript
import { withMiddleware, MiddlewarePresets } from '@/lib/api-middleware';

async function handler(request: NextRequest) {
  // Your handler logic
  return NextResponse.json({ success: true });
}

// Apply middleware with preset
export const GET = withMiddleware(handler, MiddlewarePresets.standard);

// Custom middleware options
export const POST = withMiddleware(handler, {
  timeout: 30000,
  rateLimit: { windowMs: 60000, maxRequests: 60 },
  logRequests: true,
});
```

**Middleware Presets:**
- `standard` - 30s timeout, 60 req/min
- `heavy` - 60s timeout, 10 req/min
- `public` - 30s timeout, 100 req/min
- `strict` - 10s timeout, 5 req/min

**Features:**
- Automatic error handling
- Request/response logging
- Rate limiting
- Timeout protection
- Request ID generation
- Performance tracking

### CORS Middleware

```typescript
import { withCors, compose } from '@/lib/api-middleware';

const handler = async (request: NextRequest) => {
  return NextResponse.json({ data: 'Hello' });
};

// Apply CORS
export const GET = withCors(handler, {
  origins: ['https://example.com'],
  methods: ['GET', 'POST'],
  headers: ['Content-Type', 'Authorization'],
});

// Compose multiple middleware
export const POST = compose(
  (h) => withCors(h, { origins: ['*'] }),
  (h) => withMiddleware(h, MiddlewarePresets.standard)
)(handler);
```

---

## Configuration Management

### Environment Configuration

Located in `src/lib/config.ts`:

```typescript
import { config } from '@/lib/config';

// Get configuration
const appConfig = config.get();
console.log(appConfig.port); // 3000

// Check environment
if (config.isDevelopment()) {
  // Development-specific code
}

if (config.isProduction()) {
  // Production-specific code
}
```

**Configuration Values:**
- `nodeEnv` - Environment (development/production/test)
- `port` - Server port
- `logLevel` - Logging level
- `apiTimeout` - API timeout in milliseconds
- `rateLimitEnabled` - Rate limiting enabled
- `corsOrigins` - Allowed CORS origins

**Environment Variables:**

See `.env.example` for all available environment variables.

---

## Docker & Deployment

### Multi-Stage Docker Build

The Dockerfile uses multi-stage builds for:
- Smaller image size
- Better security
- Faster builds

**Key Features:**
- Non-root user (`nextjs`)
- Health checks
- Standalone output
- Security headers

### Building the Docker Image

```bash
docker build -t nextjs-app .
```

### Running the Container

```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  nextjs-app
```

### Docker Compose Example

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - RATE_LIMIT_ENABLED=true
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## Best Practices

### 1. Always Use Error Handling

```typescript
// ❌ Bad
export async function GET() {
  const data = await fetchData();
  return NextResponse.json(data);
}

// ✅ Good
export const GET = withMiddleware(async (request) => {
  const data = await fetchData();
  return NextResponse.json(data);
}, MiddlewarePresets.standard);
```

### 2. Validate All Inputs

```typescript
// ❌ Bad
const age = body.age;

// ✅ Good
const age = validateNumber(body.age, 'age', { min: 0, max: 150 });
```

### 3. Use Structured Logging

```typescript
// ❌ Bad
console.log('User logged in:', userId);

// ✅ Good
logger.info('User logged in', { userId, timestamp: Date.now() });
```

### 4. Apply Rate Limiting

```typescript
// ✅ Good - Automatic with middleware
export const POST = withMiddleware(handler, {
  rateLimit: RateLimitPresets.STANDARD,
});
```

### 5. Monitor Performance

```typescript
// ✅ Good
const result = await measureAsync('expensive-operation', async () => {
  return await expensiveOperation();
});
```

### 6. Set Timeouts

```typescript
// ✅ Good - Automatic with middleware
export const GET = withMiddleware(handler, {
  timeout: 30000, // 30 seconds
});
```

### 7. Use Health Checks

Always implement health checks for:
- Kubernetes liveness/readiness probes
- Load balancer health checks
- Monitoring systems

### 8. Clean Up Resources

```typescript
// ✅ Good - Always clean up in useEffect
useEffect(() => {
  const interval = setInterval(() => {
    // Do work
  }, 1000);

  return () => clearInterval(interval); // Cleanup
}, []);
```

### 9. Secure Your Application

- Use HTTPS in production
- Set security headers (already configured in `next.config.ts`)
- Validate and sanitize all inputs
- Use environment variables for secrets
- Run containers as non-root user

### 10. Monitor in Production

- Check `/api/health` regularly
- Monitor error logs
- Track performance metrics
- Set up alerts for critical issues

---

## Quick Start Checklist

- [ ] Copy `.env.example` to `.env` and configure
- [ ] Review and adjust rate limits for your use case
- [ ] Set up health check monitoring
- [ ] Configure logging level for production
- [ ] Test error handling in all API routes
- [ ] Verify Docker build and health checks
- [ ] Set up log aggregation (e.g., CloudWatch, Datadog)
- [ ] Configure alerts for critical errors
- [ ] Test rate limiting behavior
- [ ] Review security headers

---

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments in `src/lib/`
3. Check application logs
4. Monitor `/api/health` endpoint

---

## License

This reliability framework is part of the Next.js application and follows the same license.
