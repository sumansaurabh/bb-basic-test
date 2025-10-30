# Service Reliability Documentation

This document outlines the reliability improvements and best practices implemented in this Next.js application.

## Table of Contents

1. [Error Handling](#error-handling)
2. [Logging System](#logging-system)
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

### Usage Example

```typescript
import { logger } from '@/lib/logger';

logger.info('User logged in', { userId: '123', email: 'user@example.com' });
logger.error('Database connection failed', error, { database: 'main' });
logger.warn('High memory usage detected', { usage: '85%' });
```

### Log Levels

Set the minimum log level via environment variable:

```bash
LOG_LEVEL=info  # Options: debug, info, warn, error, fatal
```

### Child Loggers

Create child loggers with default context:

```typescript
const requestLogger = logger.child({ requestId: '123', userId: 'abc' });
requestLogger.info('Processing request');  // Includes requestId and userId
```

---

## Rate Limiting

### In-Memory Rate Limiter

Located in `src/lib/rate-limiter.ts`, provides simple in-memory rate limiting:

### Presets

- **STRICT**: 5 requests per minute (sensitive operations)
- **STANDARD**: 60 requests per minute (normal API endpoints)
- **LENIENT**: 100 requests per minute (public endpoints)
- **HEAVY**: 10 requests per 5 minutes (resource-intensive operations)

### Usage Example

```typescript
import { rateLimiter, RateLimitPresets, getClientIdentifier } from '@/lib/rate-limiter';

const clientId = getClientIdentifier(request);
const rateLimit = rateLimiter.check(clientId, RateLimitPresets.STANDARD);

if (!rateLimit.allowed) {
  return NextResponse.json(
    { error: 'Too many requests' },
    { 
      status: 429,
      headers: {
        'Retry-After': String(rateLimit.retryAfter),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      }
    }
  );
}
```

### Production Considerations

For production environments, consider using:
- Redis-based rate limiting for distributed systems
- External services like Cloudflare or AWS WAF
- Database-backed rate limiting for persistence

---

## Request Validation

### Validation Utilities

Located in `src/lib/validation.ts`, provides comprehensive input validation:

### Available Validators

- `validateNumber()`: Validates numbers with min/max/integer constraints
- `validateString()`: Validates strings with length/pattern/enum constraints
- `validateBoolean()`: Validates boolean values
- `validateArray()`: Validates arrays with length and item validation
- `validateEmail()`: Validates email format
- `validateUrl()`: Validates URL format
- `validateObject()`: Validates objects against a schema
- `sanitizeString()`: Sanitizes strings to prevent XSS

### Usage Example

```typescript
import { validateNumber, validateString } from '@/lib/validation';

const iterations = validateNumber(body.iterations, 'iterations', {
  min: 1,
  max: 10000,
  integer: true
});

const complexity = validateString(body.complexity, 'complexity', {
  enum: ['light', 'medium', 'heavy']
});
```

---

## Health Checks

### Health Check Endpoint

**Endpoint**: `GET /api/health`

Returns service health status and metrics:

```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "uptime": {
    "seconds": 3600,
    "formatted": "1h 0m 0s"
  },
  "memory": {
    "heapUsed": "50.25 MB",
    "heapTotal": "100.00 MB",
    "usagePercent": "50.25"
  },
  "process": {
    "pid": 1234,
    "version": "v18.0.0",
    "platform": "linux"
  },
  "responseTime": "5ms"
}
```

### Health Status Levels

- **healthy**: All systems operational
- **degraded**: System operational but with warnings (e.g., high memory usage)
- **unhealthy**: System experiencing critical issues

### Docker Health Check

The Dockerfile includes a health check that pings the `/api/health` endpoint:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', ...)"
```

---

## Monitoring

### Metrics Endpoint

**Endpoint**: `GET /api/metrics`

Returns detailed performance metrics:

```json
{
  "timestamp": "2025-10-30T12:00:00.000Z",
  "process": {
    "pid": 1234,
    "uptime": 3600,
    "version": "v18.0.0"
  },
  "memory": {
    "rss": 104857600,
    "heapTotal": 52428800,
    "heapUsed": 26214400
  },
  "cpu": {
    "user": 1000000,
    "system": 500000
  }
}
```

### Integration with Monitoring Services

The metrics endpoint can be integrated with:
- Prometheus
- DataDog
- New Relic
- CloudWatch
- Grafana

---

## Security

### Security Headers

Configured in `next.config.ts`:

- **Strict-Transport-Security**: Enforces HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Enables XSS filtering
- **Referrer-Policy**: Controls referrer information

### Docker Security

- **Non-root user**: Application runs as `nextjs` user (UID 1001)
- **Multi-stage build**: Reduces attack surface
- **Minimal base image**: Uses Alpine Linux
- **No secrets in image**: Environment variables for sensitive data

### Input Sanitization

All user inputs should be validated and sanitized:

```typescript
import { sanitizeString } from '@/lib/validation';

const cleanInput = sanitizeString(userInput);
```

---

## Docker Configuration

### Multi-Stage Build

The Dockerfile uses a multi-stage build for:
- Smaller image size
- Better security
- Faster builds with layer caching

### Stages

1. **deps**: Install dependencies
2. **builder**: Build the application
3. **runner**: Production runtime

### Best Practices Implemented

- Non-root user execution
- Health checks
- Minimal base image (Alpine)
- Production-optimized build
- Proper file permissions
- Environment variable configuration

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

---

## Environment Configuration

### Configuration Validation

Located in `src/lib/config.ts`, validates all environment variables on startup.

### Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
# Application Environment
NODE_ENV=development

# Server Configuration
PORT=3000

# Logging Configuration
LOG_LEVEL=debug

# API Configuration
API_TIMEOUT=30000

# Rate Limiting Configuration
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring Configuration
MONITORING_ENABLED=false
```

### Configuration Access

```typescript
import { config, isDevelopment } from '@/lib/config';

if (isDevelopment()) {
  console.log('Running in development mode');
}

const timeout = config.apiTimeout;
```

---

## Best Practices

### API Route Development

1. **Always use error handling**:
   ```typescript
   try {
     // Your code
   } catch (error) {
     logger.error('Operation failed', error as Error);
     return formatErrorResponse(error as Error);
   }
   ```

2. **Implement rate limiting**:
   ```typescript
   const rateLimit = rateLimiter.check(clientId, RateLimitPresets.STANDARD);
   if (!rateLimit.allowed) {
     return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
   }
   ```

3. **Validate all inputs**:
   ```typescript
   const validatedData = validateNumber(input, 'fieldName', { min: 0, max: 100 });
   ```

4. **Log important operations**:
   ```typescript
   logger.info('User action', { userId, action: 'login' });
   ```

5. **Set timeouts for long operations**:
   ```typescript
   const timeout = setTimeout(() => {
     throw new TimeoutError('Operation timed out');
   }, 30000);
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
     console.error('Failed to fetch data:', error);
     setError('Failed to load data');
   }
   ```

3. **Implement loading states**:
   ```typescript
   const [loading, setLoading] = useState(false);
   ```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Health check endpoint accessible
- [ ] Logging configured for production
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Docker health check working
- [ ] Monitoring integrated
- [ ] Error tracking configured
- [ ] Backup and recovery plan in place

---

## Troubleshooting

### High Memory Usage

Check the health endpoint for memory metrics:
```bash
curl http://localhost:3000/api/health
```

If memory usage is high:
1. Check for memory leaks in client components
2. Review large data processing operations
3. Implement pagination for large datasets
4. Consider increasing container memory limits

### Rate Limiting Issues

If legitimate requests are being rate limited:
1. Adjust rate limit presets in `src/lib/rate-limiter.ts`
2. Implement user-based rate limiting instead of IP-based
3. Use Redis for distributed rate limiting

### Timeout Errors

If requests are timing out:
1. Increase `API_TIMEOUT` environment variable
2. Optimize heavy processing operations
3. Implement background job processing
4. Add caching for expensive operations

---

## Support

For issues or questions:
1. Check the logs: `docker logs <container-id>`
2. Review health status: `GET /api/health`
3. Check metrics: `GET /api/metrics`
4. Review error logs in application logs

---

## License

This documentation is part of the Next.js application and follows the same license.
