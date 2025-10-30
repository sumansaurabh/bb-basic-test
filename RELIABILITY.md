# Service Reliability Documentation

This document outlines the reliability features and improvements implemented in this Next.js application.

## Table of Contents

1. [Error Handling](#error-handling)
2. [Logging](#logging)
3. [Rate Limiting](#rate-limiting)
4. [Request Validation](#request-validation)
5. [Health Checks](#health-checks)
6. [Monitoring](#monitoring)
7. [Security](#security)
8. [Docker Configuration](#docker-configuration)
9. [Environment Configuration](#environment-configuration)
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

### Error Response Format

All errors return a consistent JSON structure:

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

---

## Logging

### Structured Logging System

Located in `src/lib/logger.ts`, provides consistent logging across the application.

### Log Levels

- **DEBUG**: Detailed information for debugging
- **INFO**: General informational messages
- **WARN**: Warning messages for potentially harmful situations
- **ERROR**: Error messages for failures
- **FATAL**: Critical errors that may cause system failure

### Configuration

Set log level via environment variable:

```bash
LOG_LEVEL=info  # Options: debug, info, warn, error, fatal
```

### Usage Example

```typescript
import { logger } from '@/lib/logger';

logger.info('User logged in', { userId: '123', ip: '192.168.1.1' });
logger.error('Database connection failed', error, { database: 'main' });
logger.warn('High memory usage detected', { usage: 85 });
```

### Output Formats

- **Development**: Human-readable format with colors
- **Production**: JSON format for log aggregators

---

## Rate Limiting

### In-Memory Rate Limiter

Located in `src/lib/rate-limiter.ts`, provides protection against abuse.

### Presets

```typescript
import { rateLimiter, RateLimitPresets, getClientIdentifier } from '@/lib/rate-limiter';

// STRICT: 5 requests per minute
// STANDARD: 60 requests per minute
// LENIENT: 100 requests per minute
// HEAVY: 10 requests per minute (for resource-intensive operations)
```

### Usage Example

```typescript
export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  rateLimiter.check(clientId, RateLimitPresets.STANDARD);
  
  // Your handler logic
}
```

### Configuration

Configure via environment variables:

```bash
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Production Considerations

For production, consider using:
- Redis-based rate limiting for distributed systems
- CDN-level rate limiting (Cloudflare, AWS CloudFront)
- API Gateway rate limiting

---

## Request Validation

### Validation Utilities

Located in `src/lib/validation.ts`, provides type-safe input validation.

### Available Validators

- `validateNumber()`: Validate numeric inputs with min/max/integer constraints
- `validateString()`: Validate strings with length and pattern constraints
- `validateEnum()`: Validate against allowed values
- `validateBoolean()`: Validate boolean inputs
- `validateArray()`: Validate arrays with item validation
- `validateEmail()`: Validate email format
- `validateUrl()`: Validate URL format
- `validateObject()`: Validate objects with allowed keys
- `sanitizeString()`: Sanitize strings to prevent XSS

### Usage Example

```typescript
import { validateNumber, validateEnum, validateString } from '@/lib/validation';

const iterations = validateNumber(body.iterations, 'iterations', {
  min: 1,
  max: 50000,
  integer: true
});

const complexity = validateEnum(body.complexity, 'complexity', ['light', 'medium', 'heavy']);

const email = validateEmail(body.email);
```

---

## Health Checks

### Health Check Endpoint

**Endpoint**: `GET /api/health`

Returns comprehensive health status including:
- Overall status (healthy/degraded/unhealthy)
- Memory usage
- Process information
- Uptime

### Response Example

```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "uptime": 3600,
  "version": "0.1.0",
  "environment": "production",
  "checks": {
    "memory": {
      "status": "pass",
      "used": 50000000,
      "total": 100000000,
      "percentage": 50.0
    },
    "process": {
      "status": "pass",
      "pid": 1234,
      "uptime": 3600
    }
  }
}
```

### Status Codes

- **200**: Healthy or degraded
- **503**: Unhealthy

### Load Balancer Integration

Use `HEAD /api/health` for simple health checks:

```bash
curl -I http://localhost:3000/api/health
```

---

## Monitoring

### Metrics Endpoint

**Endpoint**: `GET /api/metrics`

Returns detailed system metrics:
- Process information (PID, uptime, Node version)
- Memory usage (RSS, heap, external)
- CPU usage
- System information (load average, free memory)

### Response Example

```json
{
  "timestamp": "2025-10-30T12:00:00.000Z",
  "process": {
    "pid": 1234,
    "uptime": 3600,
    "nodeVersion": "v18.0.0",
    "platform": "linux",
    "arch": "x64"
  },
  "memory": {
    "rss": 100000000,
    "heapTotal": 50000000,
    "heapUsed": 25000000,
    "external": 1000000,
    "arrayBuffers": 500000
  },
  "cpu": {
    "user": 1000000,
    "system": 500000
  },
  "system": {
    "loadAverage": [1.5, 1.2, 1.0],
    "freeMemory": 1000000000,
    "totalMemory": 8000000000
  }
}
```

### Integration with Monitoring Tools

These endpoints can be integrated with:
- Prometheus
- Grafana
- Datadog
- New Relic
- Custom monitoring solutions

---

## Security

### Security Headers

Configured in `next.config.ts`:

- `X-DNS-Prefetch-Control`: Controls DNS prefetching
- `Strict-Transport-Security`: Enforces HTTPS
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-XSS-Protection`: Enables XSS filter
- `Referrer-Policy`: Controls referrer information

### Request Tracking

Every request gets:
- Unique request ID (`X-Request-ID` header)
- Response time tracking (`X-Response-Time` header)

### Input Sanitization

All user inputs should be validated and sanitized:

```typescript
import { sanitizeString } from '@/lib/validation';

const cleanInput = sanitizeString(userInput);
```

---

## Docker Configuration

### Multi-Stage Build

The Dockerfile uses multi-stage builds for:
- Smaller image size
- Better security
- Faster builds

### Security Features

1. **Non-root user**: Application runs as `nextjs` user (UID 1001)
2. **Minimal base image**: Uses Alpine Linux
3. **Health checks**: Built-in Docker health check
4. **Production optimizations**: Standalone output mode

### Building the Image

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

### Health Check

Docker automatically checks health every 30 seconds:

```bash
docker ps  # Check HEALTH status
```

---

## Environment Configuration

### Configuration System

Located in `src/lib/config.ts`, provides validated environment configuration.

### Environment Variables

See `.env.example` for all available variables:

```bash
# Required
NODE_ENV=production

# Optional with defaults
PORT=3000
LOG_LEVEL=info
API_TIMEOUT=30000
RATE_LIMIT_ENABLED=true
```

### Validation

Configuration is validated on startup. Invalid values will prevent the application from starting.

### Usage

```typescript
import { config } from '@/lib/config';

console.log(config.nodeEnv);  // 'production'
console.log(config.port);     // 3000
console.log(config.isDevelopment);  // false
```

---

## Best Practices

### API Route Development

1. **Always use error handling**:
   ```typescript
   try {
     // Your logic
   } catch (error) {
     logger.error('Operation failed', error as Error);
     return formatErrorResponse(error as Error, path);
   }
   ```

2. **Apply rate limiting**:
   ```typescript
   const clientId = getClientIdentifier(request);
   rateLimiter.check(clientId, RateLimitPresets.STANDARD);
   ```

3. **Validate inputs**:
   ```typescript
   const validated = validateNumber(input, 'fieldName', { min: 0, max: 100 });
   ```

4. **Add timeout protection**:
   ```typescript
   const result = await Promise.race([
     operation(),
     timeoutPromise(30000)
   ]);
   ```

5. **Log important events**:
   ```typescript
   logger.info('Operation started', { userId, operation });
   ```

### Client Component Development

1. **Clean up effects**:
   ```typescript
   useEffect(() => {
     const interval = setInterval(() => {}, 1000);
     return () => clearInterval(interval);
   }, []);
   ```

2. **Handle errors gracefully**:
   ```typescript
   try {
     await fetchData();
   } catch (error) {
     console.error('Failed to fetch', error);
     setError(error);
   }
   ```

3. **Optimize performance**:
   - Use `useMemo` for expensive calculations
   - Use `useCallback` for event handlers
   - Implement virtualization for large lists

### Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure appropriate `LOG_LEVEL`
- [ ] Set up rate limiting
- [ ] Configure security headers
- [ ] Set up health check monitoring
- [ ] Configure metrics collection
- [ ] Set up error alerting
- [ ] Review and set all environment variables
- [ ] Test Docker build and deployment
- [ ] Verify health check endpoint
- [ ] Load test critical endpoints

---

## Troubleshooting

### High Memory Usage

1. Check `/api/metrics` for memory statistics
2. Review `/api/health` for memory status
3. Check logs for memory warnings
4. Consider increasing container memory limits

### Rate Limit Issues

1. Check rate limit configuration
2. Review client identification logic
3. Consider adjusting limits for specific endpoints
4. Implement user-based rate limiting for authenticated users

### Timeout Errors

1. Review `API_TIMEOUT` configuration
2. Check slow database queries
3. Optimize heavy computations
4. Consider implementing caching

### Docker Build Failures

1. Ensure all dependencies are in `package.json`
2. Check `.dockerignore` is not excluding required files
3. Verify multi-stage build steps
4. Check for platform-specific dependencies

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [OWASP Security Guidelines](https://owasp.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## Support

For issues or questions:
1. Check this documentation
2. Review application logs
3. Check health and metrics endpoints
4. Review error messages and stack traces
