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

Located in `src/lib/errors.ts`, we provide structured error handling with custom error classes:

- **AppError**: Base error class with status codes and operational flags
- **ValidationError**: For input validation failures (400)
- **NotFoundError**: For missing resources (404)
- **UnauthorizedError**: For authentication failures (401)
- **ForbiddenError**: For authorization failures (403)
- **RateLimitError**: For rate limit exceeded (429)
- **TimeoutError**: For request timeouts (408)
- **ServiceUnavailableError**: For service unavailability (503)

### Usage Example

```typescript
import { ValidationError, formatErrorResponse } from '@/lib/errors';

try {
  if (!isValid) {
    throw new ValidationError('Invalid input data');
  }
} catch (error) {
  const errorResponse = formatErrorResponse(error as Error, '/api/endpoint');
  return NextResponse.json(errorResponse, { 
    status: errorResponse.error.statusCode 
  });
}
```

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

### Structured Logging System

Located in `src/lib/logger.ts`, provides consistent logging across the application.

### Log Levels

- **DEBUG**: Detailed debugging information
- **INFO**: General informational messages
- **WARN**: Warning messages for potentially harmful situations
- **ERROR**: Error messages for failures
- **FATAL**: Critical errors that may cause system failure

### Usage Example

```typescript
import { logger } from '@/lib/logger';

// Simple logging
logger.info('User logged in');
logger.error('Database connection failed', error);

// With context
logger.info('Processing request', {
  userId: '123',
  action: 'update',
});

// Child logger with persistent context
const requestLogger = logger.child({ requestId: 'req_123' });
requestLogger.info('Request started');
requestLogger.info('Request completed');
```

### Configuration

Set the `LOG_LEVEL` environment variable to control logging verbosity:

```bash
LOG_LEVEL=debug  # Development
LOG_LEVEL=info   # Production
```

---

## Rate Limiting

### In-Memory Rate Limiter

Located in `src/lib/rate-limiter.ts`, provides protection against abuse.

### Rate Limit Presets

- **STRICT**: 5 requests per minute (sensitive operations)
- **STANDARD**: 60 requests per minute (normal endpoints)
- **LENIENT**: 100 requests per minute (public endpoints)
- **HEAVY**: 10 requests per minute (resource-intensive operations)

### Usage Example

```typescript
import { rateLimiter, RateLimitPresets, getClientIdentifier } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  
  try {
    rateLimiter.check(clientId, RateLimitPresets.STANDARD);
    // Process request...
  } catch (error) {
    // Returns 429 Too Many Requests
  }
}
```

### Production Considerations

For production environments with multiple instances, consider using:
- Redis-based rate limiting
- Distributed rate limiting services (e.g., Upstash, Redis Cloud)
- API Gateway rate limiting (e.g., AWS API Gateway, Cloudflare)

---

## Request Validation

### Validation Utilities

Located in `src/lib/validation.ts`, provides type-safe input validation.

### Available Validators

- `validateNumber()`: Validate numeric inputs with min/max/integer constraints
- `validateString()`: Validate strings with length/pattern/enum constraints
- `validateBoolean()`: Validate boolean values
- `validateArray()`: Validate arrays with length and item validation
- `validateEmail()`: Validate email format
- `validateUrl()`: Validate URL format
- `validateRequiredFields()`: Ensure required fields exist
- `sanitizeString()`: Sanitize strings to prevent XSS

### Usage Example

```typescript
import { validateNumber, validateString } from '@/lib/validation';

const body = await request.json();

const age = validateNumber(body.age, 'age', { 
  min: 0, 
  max: 120, 
  integer: true 
});

const status = validateString(body.status, 'status', { 
  enum: ['active', 'inactive', 'pending'] 
});
```

---

## Monitoring

### Performance Monitoring

Located in `src/lib/monitoring.ts`, tracks operation performance.

### Features

- Measure async and sync function execution time
- Track performance metrics
- Calculate statistics (average, min, max, percentiles)
- Automatic slow operation detection

### Usage Example

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
console.log(`Average: ${stats.average}ms, P95: ${stats.p95}ms`);
```

---

## Health Checks

### Health Check Endpoint

Located at `/api/health`, provides service health status.

### Response Format

```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "uptime": 3600,
  "responseTime": 5,
  "version": "0.1.0",
  "environment": "production",
  "memory": {
    "heapUsed": 50,
    "heapTotal": 100,
    "heapUsedPercent": 50,
    "rss": 150,
    "external": 10
  },
  "process": {
    "pid": 1234,
    "nodeVersion": "v18.0.0",
    "platform": "linux",
    "arch": "x64"
  }
}
```

### Health Status Levels

- **healthy**: All systems operational
- **degraded**: Service operational but with issues (e.g., high memory)
- **unhealthy**: Service experiencing critical issues

### Kubernetes/Docker Integration

The health check endpoint is used by:
- Docker HEALTHCHECK directive
- Kubernetes liveness and readiness probes
- Load balancer health checks

---

## API Middleware

### Middleware System

Located in `src/lib/api-middleware.ts`, provides reusable middleware for API routes.

### Features

- Request/response logging
- Rate limiting
- Timeout handling
- Error handling
- Performance monitoring
- CORS support
- Request ID generation

### Usage Example

```typescript
import { withMiddleware, MiddlewarePresets } from '@/lib/api-middleware';

const handler = async (request: NextRequest) => {
  // Your API logic here
  return NextResponse.json({ success: true });
};

// Apply middleware with preset configuration
export const GET = withMiddleware(handler, MiddlewarePresets.standard);

// Or with custom configuration
export const POST = withMiddleware(handler, {
  timeout: 60000,
  rateLimit: {
    windowMs: 60000,
    maxRequests: 10,
  },
  logRequests: true,
});
```

### Middleware Presets

- **standard**: 30s timeout, 60 req/min
- **heavy**: 60s timeout, 10 req/min
- **public**: 30s timeout, 100 req/min
- **strict**: 10s timeout, 5 req/min

### Composing Middleware

```typescript
import { compose, withMiddleware, withCors, withPerformanceMonitoring } from '@/lib/api-middleware';

const handler = async (request: NextRequest) => {
  return NextResponse.json({ success: true });
};

export const GET = compose(
  withPerformanceMonitoring,
  (h) => withCors(h, { origins: ['https://example.com'] }),
  (h) => withMiddleware(h, MiddlewarePresets.standard)
)(handler);
```

---

## Configuration Management

### Environment Configuration

Located in `src/lib/config.ts`, validates environment variables on startup.

### Configuration Options

See `.env.example` for all available options:

```bash
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
API_TIMEOUT=30000
RATE_LIMIT_ENABLED=true
CORS_ORIGINS=https://yourdomain.com
```

### Usage Example

```typescript
import { config } from '@/lib/config';

const appConfig = config.get();
console.log(`Running on port ${appConfig.port}`);

if (config.isDevelopment()) {
  // Development-only code
}
```

---

## Docker & Deployment

### Multi-Stage Docker Build

The `Dockerfile` uses multi-stage builds for:
- Smaller image size
- Better security
- Faster builds
- Production optimization

### Security Features

- Non-root user (nextjs:nodejs)
- Minimal base image (Alpine Linux)
- Health check integration
- Proper file permissions

### Building and Running

```bash
# Build image
docker build -t nextjs-app .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  nextjs-app

# Check health
curl http://localhost:3000/api/health
```

### Kubernetes Deployment

Example deployment with health checks:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nextjs-app
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: nextjs
        image: nextjs-app:latest
        ports:
        - containerPort: 3000
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
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

---

## Best Practices

### 1. Always Use Middleware

Wrap all API routes with appropriate middleware:

```typescript
export const GET = withMiddleware(handler, MiddlewarePresets.standard);
```

### 2. Validate All Inputs

Never trust user input:

```typescript
const validated = validateNumber(input, 'field', { min: 0, max: 100 });
```

### 3. Use Structured Logging

Include context in logs:

```typescript
logger.info('Operation completed', { userId, duration, status });
```

### 4. Handle Errors Gracefully

Use try-catch and custom error classes:

```typescript
try {
  // Operation
} catch (error) {
  logger.error('Operation failed', error as Error);
  throw new AppError('User-friendly message', 500);
}
```

### 5. Monitor Performance

Track critical operations:

```typescript
await performanceMonitor.measure('critical-operation', async () => {
  // Your code
});
```

### 6. Set Appropriate Timeouts

Prevent hanging requests:

```typescript
export const POST = withMiddleware(handler, {
  timeout: 30000, // 30 seconds
});
```

### 7. Implement Rate Limiting

Protect against abuse:

```typescript
rateLimiter.check(clientId, RateLimitPresets.STANDARD);
```

### 8. Use Health Checks

Monitor service health:

```bash
# In your monitoring system
curl -f http://localhost:3000/api/health || exit 1
```

### 9. Clean Up Resources

Always clean up in useEffect:

```typescript
useEffect(() => {
  const interval = setInterval(() => {}, 1000);
  return () => clearInterval(interval); // Cleanup
}, []);
```

### 10. Security Headers

Already configured in `next.config.ts`:
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- X-XSS-Protection

---

## Troubleshooting

### High Memory Usage

Check `/api/health` endpoint for memory metrics. If consistently high:
1. Review memory-intensive operations
2. Implement pagination for large datasets
3. Add caching where appropriate
4. Consider horizontal scaling

### Rate Limit Issues

If legitimate users are being rate limited:
1. Adjust rate limit presets
2. Implement user-based rate limiting (not just IP)
3. Use Redis for distributed rate limiting

### Slow API Responses

Check performance metrics:
```typescript
const stats = performanceMonitor.getStats('operation-name');
console.log(stats);
```

Optimize slow operations:
1. Add database indexes
2. Implement caching
3. Use pagination
4. Optimize queries

### Error Tracking

All errors are logged with context. In production, consider:
- Sentry for error tracking
- DataDog for APM
- CloudWatch for AWS deployments

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [OWASP Security Guidelines](https://owasp.org/)
- [12 Factor App](https://12factor.net/)

---

## Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Check `/api/health` endpoint
4. Review performance metrics
