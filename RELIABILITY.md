# Service Reliability Documentation

This document outlines the reliability features and improvements implemented in this Next.js application.

## Table of Contents

1. [Error Handling](#error-handling)
2. [Logging System](#logging-system)
3. [Rate Limiting](#rate-limiting)
4. [Request Validation](#request-validation)
5. [Health Checks](#health-checks)
6. [Performance Monitoring](#performance-monitoring)
7. [Security Enhancements](#security-enhancements)
8. [Docker Improvements](#docker-improvements)
9. [Configuration Management](#configuration-management)
10. [Best Practices](#best-practices)

---

## Error Handling

### Custom Error Classes

Located in `src/lib/errors.ts`, the application provides structured error handling with custom error classes:

- **AppError**: Base error class with status codes and operational flags
- **ValidationError**: For input validation failures (400)
- **NotFoundError**: For missing resources (404)
- **UnauthorizedError**: For authentication failures (401)
- **ForbiddenError**: For authorization failures (403)
- **RateLimitError**: For rate limit violations (429)
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
  return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
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

## Logging System

### Structured Logging

Located in `src/lib/logger.ts`, provides structured logging with multiple log levels:

- **DEBUG**: Detailed debugging information
- **INFO**: General informational messages
- **WARN**: Warning messages for potential issues
- **ERROR**: Error messages for failures
- **FATAL**: Critical errors requiring immediate attention

### Configuration

Set the log level via environment variable:

```bash
LOG_LEVEL=info  # debug, info, warn, error, fatal
```

### Usage Example

```typescript
import { logger } from '@/lib/logger';

// Simple logging
logger.info('User logged in');
logger.error('Database connection failed', error);

// With context
logger.info('API request completed', {
  userId: '123',
  duration: 150,
  endpoint: '/api/users'
});

// Child logger with persistent context
const requestLogger = logger.child({ requestId: 'abc-123' });
requestLogger.info('Processing request');
```

### Output Formats

- **Development**: Human-readable format with colors
- **Production**: JSON format for log aggregators

---

## Rate Limiting

### In-Memory Rate Limiter

Located in `src/lib/rate-limiter.ts`, provides configurable rate limiting:

### Preset Configurations

```typescript
import { RateLimitPresets } from '@/lib/rate-limiter';

// STRICT: 5 requests per minute
// STANDARD: 60 requests per minute
// LENIENT: 100 requests per minute
// HEAVY: 10 requests per minute (for resource-intensive operations)
```

### Usage with API Middleware

```typescript
import { createApiHandler } from '@/lib/api-middleware';
import { RateLimitPresets } from '@/lib/rate-limiter';

export const GET = createApiHandler(
  async (request) => {
    // Your handler logic
  },
  {
    rateLimit: RateLimitPresets.STANDARD,
    timeout: 30000,
  }
);
```

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2025-10-30T12:01:00.000Z
```

### Configuration

Enable/disable rate limiting:

```bash
RATE_LIMIT_ENABLED=true
```

---

## Request Validation

### Validation Utilities

Located in `src/lib/validation.ts`, provides comprehensive input validation:

### Available Validators

```typescript
import {
  validateNumber,
  validateString,
  validateBoolean,
  validateArray,
  validateEmail,
  validateUrl,
  validateRequiredFields,
  sanitizeString,
} from '@/lib/validation';

// Number validation
const age = validateNumber(input.age, 'age', {
  min: 0,
  max: 150,
  integer: true,
});

// String validation
const username = validateString(input.username, 'username', {
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9_]+$/,
});

// Email validation
const email = validateEmail(input.email);

// Required fields
const data = validateRequiredFields(body, ['name', 'email', 'age']);
```

### Custom Validators

Create schema-based validators:

```typescript
import { createValidator } from '@/lib/validation';

const userValidator = createValidator({
  name: (v) => validateString(v, 'name', { minLength: 2 }),
  email: (v) => validateEmail(v),
  age: (v) => validateNumber(v, 'age', { min: 18, max: 120 }),
});

const validatedUser = userValidator(requestBody);
```

---

## Health Checks

### Health Check Endpoint

**Endpoint**: `GET /api/health`

Returns comprehensive health information:

```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "uptime": 3600,
  "responseTime": 5,
  "version": "0.1.0",
  "environment": "production",
  "system": {
    "nodeVersion": "v18.0.0",
    "platform": "linux",
    "arch": "x64",
    "memory": {
      "heapUsed": 50,
      "heapTotal": 100,
      "heapUsedPercent": 50,
      "rss": 150,
      "external": 10
    }
  }
}
```

### Health Status Levels

- **healthy**: All systems operational (200)
- **degraded**: Some issues detected but service operational (200)
- **unhealthy**: Critical issues, service may not function properly (503)

### Readiness Check

**Endpoint**: `HEAD /api/health`

Quick check for container orchestration (returns 200 or 503).

### Docker Health Check

The Dockerfile includes automatic health checks:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', ...)"
```

---

## Performance Monitoring

### Performance Monitor

Located in `src/lib/monitoring.ts`, tracks operation performance:

### Usage

```typescript
import { performanceMonitor, measureAsync } from '@/lib/monitoring';

// Manual timing
const endTimer = performanceMonitor.startTimer('database-query');
// ... perform operation
endTimer({ userId: '123', success: true });

// Async function wrapper
const result = await measureAsync(
  'api-call',
  async () => {
    return await fetchData();
  },
  { endpoint: '/api/users' }
);

// Get statistics
const stats = performanceMonitor.getStats('database-query');
// Returns: { count, avg, min, max, p50, p95, p99 }
```

### Automatic Monitoring

API middleware automatically tracks all endpoint performance:

```typescript
import { ApiHandlerPresets } from '@/lib/api-middleware';

// Automatically includes performance monitoring
export const GET = ApiHandlerPresets.standard(handler);
```

### Slow Operation Detection

Operations taking longer than 1 second are automatically logged as warnings.

---

## Security Enhancements

### Security Headers

Configured in `next.config.ts`:

- **Strict-Transport-Security**: Enforces HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Enables XSS filtering
- **Referrer-Policy**: Controls referrer information
- **X-DNS-Prefetch-Control**: Controls DNS prefetching

### Input Sanitization

```typescript
import { sanitizeString } from '@/lib/validation';

const cleanInput = sanitizeString(userInput); // Removes < and > characters
```

### Docker Security

- Runs as non-root user (nextjs:nodejs)
- Multi-stage build reduces attack surface
- Minimal base image (Alpine Linux)
- No unnecessary packages installed

---

## Docker Improvements

### Multi-Stage Build

The Dockerfile uses multi-stage builds for:

- Smaller final image size
- Separation of build and runtime dependencies
- Better layer caching

### Security Features

```dockerfile
# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Switch to non-root user
USER nextjs
```

### Health Checks

Automatic health monitoring for container orchestration:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', ...)"
```

### Build Command

```bash
docker build -t nextjs-app .
docker run -p 3000:3000 nextjs-app
```

---

## Configuration Management

### Environment Configuration

Located in `src/lib/config.ts`, validates all environment variables on startup.

### Available Configuration

Create a `.env` file based on `.env.example`:

```bash
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
API_TIMEOUT=30000
RATE_LIMIT_ENABLED=true
CORS_ORIGINS=*
MAX_REQUEST_SIZE=10mb
```

### Usage

```typescript
import { config } from '@/lib/config';

const appConfig = config.get();
console.log(appConfig.port); // 3000

if (config.isDevelopment()) {
  // Development-specific logic
}
```

### Validation

The configuration system validates:

- Required variables are present
- Values are in correct format
- Ranges are within acceptable limits
- Fails fast on startup if configuration is invalid

---

## Best Practices

### API Route Development

1. **Always use middleware wrappers**:

```typescript
import { ApiHandlerPresets } from '@/lib/api-middleware';

export const GET = ApiHandlerPresets.standard(async (request) => {
  // Your logic here
});
```

2. **Validate all inputs**:

```typescript
import { validateNumber, validateString } from '@/lib/validation';

const body = await request.json();
const validatedData = {
  name: validateString(body.name, 'name', { minLength: 2 }),
  age: validateNumber(body.age, 'age', { min: 0, max: 150 }),
};
```

3. **Use structured logging**:

```typescript
import { logger } from '@/lib/logger';

logger.info('Operation completed', { userId, duration, success: true });
```

4. **Handle errors properly**:

```typescript
import { ValidationError } from '@/lib/errors';

if (!isValid) {
  throw new ValidationError('Invalid input');
}
```

### Client Component Development

1. **Always cleanup effects**:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    // Do something
  }, 1000);

  return () => clearInterval(interval); // Cleanup
}, []);
```

2. **Avoid memory leaks**:

```typescript
useEffect(() => {
  let isActive = true;
  
  const fetchData = async () => {
    const data = await fetch('/api/data');
    if (isActive) {
      setData(data);
    }
  };
  
  fetchData();
  
  return () => {
    isActive = false; // Prevent state updates after unmount
  };
}, []);
```

### Monitoring and Debugging

1. **Check health endpoint regularly**: `GET /api/health`
2. **Monitor logs for warnings and errors**
3. **Track performance metrics** using the monitoring utilities
4. **Set appropriate log levels** for different environments

### Production Deployment

1. **Set environment variables**:
   - `NODE_ENV=production`
   - `LOG_LEVEL=warn` or `error`
   - Configure appropriate rate limits

2. **Enable security features**:
   - Use HTTPS
   - Set proper CORS origins
   - Enable rate limiting

3. **Monitor health**:
   - Set up health check monitoring
   - Configure alerts for unhealthy status
   - Monitor memory usage

4. **Use Docker**:
   - Build with production Dockerfile
   - Run with resource limits
   - Use container orchestration (Kubernetes, ECS, etc.)

---

## Troubleshooting

### High Memory Usage

Check `/api/health` for memory metrics. If heap usage is consistently high:

1. Review for memory leaks in client components
2. Check for large data structures in API routes
3. Increase container memory limits if needed

### Rate Limit Issues

If legitimate users are being rate limited:

1. Adjust rate limit presets in `src/lib/rate-limiter.ts`
2. Implement user-based rate limiting instead of IP-based
3. Consider using Redis for distributed rate limiting

### Slow API Responses

1. Check performance metrics: `performanceMonitor.getStats('operation-name')`
2. Review logs for slow operation warnings
3. Consider adding caching
4. Optimize database queries

### Configuration Errors

If the application fails to start:

1. Check logs for configuration validation errors
2. Verify all required environment variables are set
3. Ensure values are in correct format and range
4. Review `.env.example` for reference

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## Support

For issues or questions:

1. Check this documentation
2. Review application logs
3. Check `/api/health` endpoint
4. Review error messages and stack traces
