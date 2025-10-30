# Service Reliability Documentation

This document describes the reliability improvements and best practices implemented in this Next.js application.

## Table of Contents

1. [Error Handling](#error-handling)
2. [Logging](#logging)
3. [Rate Limiting](#rate-limiting)
4. [Request Validation](#request-validation)
5. [Monitoring](#monitoring)
6. [Health Checks](#health-checks)
7. [Configuration](#configuration)
8. [Docker & Deployment](#docker--deployment)
9. [API Best Practices](#api-best-practices)

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
logger.info('Operation completed', { duration: 150 });
logger.warn('Potential issue detected', { metric: 'high' });
logger.error('Operation failed', error, { context: 'data' });
logger.fatal('Critical system error', error);
```

**Log Levels:**
- `DEBUG` - Detailed debugging information
- `INFO` - General informational messages
- `WARN` - Warning messages
- `ERROR` - Error messages
- `FATAL` - Critical errors

### Child Loggers

Create child loggers with additional context:

```typescript
const requestLogger = logger.child({ requestId: '123', userId: 'user-456' });
requestLogger.info('Processing request'); // Includes requestId and userId
```

### Configuration

Set log level via environment variable:
```bash
LOG_LEVEL=debug  # development
LOG_LEVEL=info   # production
```

---

## Rate Limiting

### Implementation

Located in `src/lib/rate-limiter.ts`, provides in-memory rate limiting:

```typescript
import { rateLimiter, RateLimitPresets, getClientIdentifier } from '@/lib/rate-limiter';

// In API route
const clientId = getClientIdentifier(request);
rateLimiter.check(clientId, RateLimitPresets.STANDARD);
```

**Presets:**
- `STRICT` - 5 requests/minute (sensitive operations)
- `STANDARD` - 60 requests/minute (normal endpoints)
- `LENIENT` - 100 requests/minute (public endpoints)
- `HEAVY` - 10 requests/minute (resource-intensive operations)

### Custom Rate Limits

```typescript
rateLimiter.check(clientId, {
  windowMs: 60000,    // 1 minute
  maxRequests: 30,    // 30 requests
});
```

### Production Considerations

For production, consider using Redis-based rate limiting for distributed systems.

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
  pattern: /^[a-zA-Z0-9_]+$/
});

// Validate email
const email = validateEmail(body.email);

// Validate enum
const status = validateString(body.status, 'status', {
  enum: ['active', 'inactive', 'pending']
});
```

### Schema Validation

Create reusable validators:

```typescript
import { createValidator } from '@/lib/validation';

const userValidator = createValidator({
  name: (v) => validateString(v, 'name', { minLength: 1, maxLength: 100 }),
  email: (v) => validateEmail(v),
  age: (v) => validateNumber(v, 'age', { min: 0, max: 150, integer: true }),
});

const validatedData = userValidator(requestBody);
```

---

## Monitoring

### Performance Monitoring

Located in `src/lib/monitoring.ts`:

```typescript
import { performanceMonitor, measureAsync } from '@/lib/monitoring';

// Measure async operations
const result = await measureAsync('database-query', async () => {
  return await db.query('SELECT * FROM users');
}, { userId: 123 });

// Manual timing
const endTimer = performanceMonitor.startTimer('operation-name');
// ... do work ...
endTimer({ success: true, itemsProcessed: 100 });

// Get statistics
const stats = performanceMonitor.getStats('operation-name');
// Returns: { count, average, min, max, p95 }
```

### Metrics Endpoint

Access performance metrics at `/api/metrics`:

```json
{
  "timestamp": "2025-10-30T12:00:00.000Z",
  "operations": {
    "database-query": {
      "count": 150,
      "average": 45,
      "min": 12,
      "max": 234,
      "p95": 120
    }
  }
}
```

---

## Health Checks

### Health Check Endpoint

Located at `/api/health`, returns service health status:

```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "uptime": {
    "seconds": 3600,
    "formatted": "1h 0m 0s"
  },
  "memory": {
    "heapUsed": 45,
    "heapTotal": 89,
    "rss": 120,
    "usagePercent": 50
  },
  "system": {
    "nodeVersion": "v18.17.0",
    "platform": "linux",
    "arch": "x64",
    "pid": 1
  }
}
```

**Status Codes:**
- `200` - Healthy
- `503` - Degraded or Unhealthy

### Docker Health Check

The Dockerfile includes a health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', ...)"
```

---

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Application Environment
NODE_ENV=development

# Server Configuration
PORT=3000

# Logging
LOG_LEVEL=debug

# API Configuration
API_TIMEOUT=30000

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60

# CORS Configuration
CORS_ENABLED=true
CORS_ORIGINS=*
```

### Configuration Validation

Configuration is validated on startup in `src/lib/config.ts`. Invalid configuration will prevent the application from starting.

---

## Docker & Deployment

### Multi-Stage Build

The Dockerfile uses multi-stage builds for:
- Smaller image size
- Better security
- Faster builds

### Security Features

1. **Non-root user**: Application runs as `nextjs` user (UID 1001)
2. **Minimal base image**: Uses Alpine Linux
3. **Health checks**: Built-in container health monitoring
4. **Standalone output**: Optimized production build

### Building

```bash
docker build -t nextjs-app .
```

### Running

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

## API Best Practices

### Using API Wrapper

Wrap API handlers for automatic error handling, timeouts, and monitoring:

```typescript
import { withApiWrapper } from '@/lib/api-wrapper';

export const GET = withApiWrapper(
  async (request) => {
    // Your handler logic
    return NextResponse.json({ data: 'response' });
  },
  {
    timeout: 10000,
    operationName: 'get-users',
  }
);
```

### Complete API Route Example

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { formatErrorResponse, ValidationError } from '@/lib/errors';
import { rateLimiter, RateLimitPresets, getClientIdentifier } from '@/lib/rate-limiter';
import { validateNumber, validateString } from '@/lib/validation';
import { performanceMonitor } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const requestLogger = logger.child({ requestId, path: '/api/users' });
  const endTimer = performanceMonitor.startTimer('create-user');

  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    rateLimiter.check(clientId, RateLimitPresets.STANDARD);

    requestLogger.info('Creating user');

    // Parse and validate
    const body = await request.json();
    const name = validateString(body.name, 'name', { minLength: 1, maxLength: 100 });
    const age = validateNumber(body.age, 'age', { min: 0, max: 150, integer: true });

    // Business logic
    const user = await createUser({ name, age });

    endTimer({ success: true });
    requestLogger.info('User created', { userId: user.id });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    endTimer({ success: false });
    requestLogger.error('Failed to create user', error as Error);

    const errorResponse = formatErrorResponse(
      error as Error,
      '/api/users',
      process.env.NODE_ENV === 'development'
    );

    return NextResponse.json(
      errorResponse,
      { status: errorResponse.error.statusCode }
    );
  }
}
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

1. **Health Check Status** - `/api/health`
2. **Performance Metrics** - `/api/metrics`
3. **Error Rates** - Check logs for ERROR/FATAL levels
4. **Response Times** - Monitor `X-Response-Time` header
5. **Memory Usage** - From health check endpoint
6. **Rate Limit Hits** - Check logs for rate limit warnings

### Recommended Alerts

- Health check fails for > 2 minutes
- Memory usage > 90%
- Error rate > 5% of requests
- P95 response time > 1000ms
- Rate limit exceeded frequently

---

## Testing

### Testing Error Handling

```bash
# Test validation error
curl -X POST http://localhost:3000/api/heavy-processing \
  -H "Content-Type: application/json" \
  -d '{"iterations": -1}'

# Test rate limiting (make multiple rapid requests)
for i in {1..100}; do
  curl http://localhost:3000/api/heavy-processing
done
```

### Testing Health Check

```bash
curl http://localhost:3000/api/health
```

### Testing Metrics

```bash
curl http://localhost:3000/api/metrics
```

---

## Troubleshooting

### High Memory Usage

Check `/api/health` for memory metrics. If consistently high:
1. Review memory-intensive operations
2. Check for memory leaks in client components
3. Consider increasing container memory limits

### Rate Limiting Issues

If legitimate users are being rate limited:
1. Adjust rate limit configuration in `.env`
2. Consider implementing user-based rate limiting
3. Use Redis for distributed rate limiting

### Slow Response Times

Check `/api/metrics` for operation statistics:
1. Identify slow operations (high P95)
2. Add database indexes
3. Implement caching
4. Consider pagination for large datasets

---

## Security Considerations

1. **Never log sensitive data** (passwords, tokens, API keys)
2. **Validate all inputs** before processing
3. **Use HTTPS** in production
4. **Keep dependencies updated** (`pnpm update`)
5. **Review security headers** in `next.config.ts`
6. **Implement authentication** for sensitive endpoints
7. **Use environment variables** for secrets (never commit)

---

## Future Improvements

1. **Redis Integration** - For distributed rate limiting and caching
2. **Database Connection Pooling** - For better database performance
3. **Distributed Tracing** - OpenTelemetry integration
4. **APM Integration** - New Relic, DataDog, or similar
5. **Circuit Breaker** - For external service calls
6. **Request Queuing** - For handling traffic spikes
7. **Graceful Shutdown** - Proper cleanup on SIGTERM

---

## Support

For issues or questions:
1. Check logs for error details
2. Review this documentation
3. Check `/api/health` and `/api/metrics` endpoints
4. Review environment configuration

---

**Last Updated:** October 30, 2025
