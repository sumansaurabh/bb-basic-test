# Service Reliability & Health Check Documentation

This document outlines the reliability improvements, monitoring capabilities, and best practices implemented in this Next.js application.

## Table of Contents

1. [Overview](#overview)
2. [Error Handling](#error-handling)
3. [Logging System](#logging-system)
4. [Rate Limiting](#rate-limiting)
5. [Request Validation](#request-validation)
6. [Health Checks](#health-checks)
7. [Performance Monitoring](#performance-monitoring)
8. [Configuration Management](#configuration-management)
9. [Security Enhancements](#security-enhancements)
10. [Docker Improvements](#docker-improvements)

---

## Overview

This application has been enhanced with comprehensive reliability features to ensure:
- **Robust error handling** with proper error categorization
- **Structured logging** for better observability
- **Rate limiting** to prevent abuse
- **Input validation** to prevent invalid data
- **Health monitoring** for load balancers and orchestrators
- **Performance tracking** for optimization
- **Security hardening** at multiple layers

---

## Error Handling

### Custom Error Classes

Located in `src/lib/errors.ts`, the application uses custom error classes for better error categorization:

```typescript
- AppError: Base error class with status codes
- ValidationError: 400 - Invalid input data
- NotFoundError: 404 - Resource not found
- UnauthorizedError: 401 - Authentication required
- ForbiddenError: 403 - Insufficient permissions
- RateLimitError: 429 - Too many requests
- TimeoutError: 408 - Request timeout
- DatabaseError: 500 - Database operations failed
```

### Error Response Format

All API errors return a consistent format:

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
  if (!data) {
    throw new ValidationError('Data is required');
  }
} catch (error) {
  const errorResponse = formatErrorResponse(error as Error, '/api/endpoint');
  return NextResponse.json(errorResponse, { 
    status: errorResponse.error.statusCode 
  });
}
```

---

## Logging System

### Structured Logging

Located in `src/lib/logger.ts`, provides structured JSON logging with multiple levels:

- **DEBUG**: Detailed debugging information
- **INFO**: General informational messages
- **WARN**: Warning messages for potential issues
- **ERROR**: Error messages with stack traces

### Configuration

Set log level via environment variable:

```bash
LOG_LEVEL=debug  # development
LOG_LEVEL=info   # production
```

### Usage Examples

```typescript
import { logger } from '@/lib/logger';

// Basic logging
logger.info('User logged in', { userId: '123' });
logger.error('Database connection failed', error, { database: 'main' });

// API request/response logging
logger.logRequest('GET', '/api/users', { userId: '123' });
logger.logResponse('GET', '/api/users', 200, 150);

// Performance logging
logger.logPerformance('database-query', 250, { query: 'SELECT * FROM users' });

// Security events
logger.logSecurity('Failed login attempt', { ip: '192.168.1.1' });
```

### Log Format

Development (pretty-printed):
```json
{
  "level": "info",
  "message": "API Request: GET /api/users",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "context": {
    "method": "GET",
    "path": "/api/users"
  }
}
```

Production (single-line):
```json
{"level":"info","message":"API Request: GET /api/users","timestamp":"2025-10-30T12:00:00.000Z","context":{"method":"GET","path":"/api/users"}}
```

---

## Rate Limiting

### In-Memory Rate Limiter

Located in `src/lib/rate-limiter.ts`, provides simple in-memory rate limiting:

### Presets

```typescript
import { RateLimitPresets } from '@/lib/rate-limiter';

// STRICT: 5 requests per 15 minutes
// STANDARD: 100 requests per 15 minutes
// RELAXED: 1000 requests per 15 minutes
// HEAVY: 10 requests per 1 minute (for resource-intensive operations)
```

### Usage Example

```typescript
import { rateLimiter, RateLimitPresets, getRequestIdentifier } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const identifier = getRequestIdentifier(request);
  
  try {
    rateLimiter.check(identifier, RateLimitPresets.STANDARD);
    // Process request...
  } catch (error) {
    // Returns 429 Too Many Requests
  }
}
```

### Production Considerations

For production deployments with multiple instances, consider:
- Redis-based rate limiting
- Distributed rate limiting services (e.g., Upstash, Redis Cloud)
- API Gateway rate limiting (e.g., AWS API Gateway, Cloudflare)

---

## Request Validation

### Validation Utilities

Located in `src/lib/validation.ts`, provides comprehensive input validation:

### Available Validators

```typescript
import { 
  validateNumber, 
  validateString, 
  validateEmail,
  validateUrl,
  validateArray,
  validateObject 
} from '@/lib/validation';

// Number validation
const age = validateNumber(body.age, 'age', { 
  min: 0, 
  max: 150, 
  integer: true 
});

// String validation
const name = validateString(body.name, 'name', { 
  minLength: 2, 
  maxLength: 50,
  pattern: /^[a-zA-Z\s]+$/
});

// Email validation
const email = validateEmail(body.email);

// Array validation
const tags = validateArray(body.tags, 'tags', { 
  maxLength: 10,
  itemValidator: (item) => validateString(item, 'tag')
});
```

### Sanitization

```typescript
import { sanitizeString } from '@/lib/validation';

const cleanInput = sanitizeString(userInput); // Removes < and >
```

---

## Health Checks

### Health Check Endpoint

**Endpoint**: `GET /api/health`

Returns application health status for monitoring and load balancers.

### Response Format

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
      "used": 52428800,
      "total": 104857600,
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

- **200**: Healthy or degraded (still operational)
- **503**: Unhealthy (service unavailable)

### Health Status Levels

- **healthy**: All checks passing
- **degraded**: Some warnings but still operational (e.g., high memory usage)
- **unhealthy**: Critical failures (e.g., memory exhausted)

### Docker Health Check

The Dockerfile includes a health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

---

## Performance Monitoring

### Metrics Endpoint

**Endpoint**: `GET /api/metrics`

Returns performance metrics and statistics.

### Response Format

```json
{
  "timestamp": "2025-10-30T12:00:00.000Z",
  "uptime": 3600,
  "performance": {
    "totalMetrics": 1000,
    "totalRequests": 500,
    "averageResponseTime": 125.5,
    "slowestOperations": [...],
    "recentRequests": [...]
  },
  "memory": {
    "heapUsed": 52428800,
    "heapTotal": 104857600,
    "heapUsedMB": 50.0,
    "heapTotalMB": 100.0
  },
  "process": {
    "pid": 1234,
    "version": "v18.0.0",
    "platform": "linux",
    "arch": "x64"
  }
}
```

### Performance Monitoring Utilities

Located in `src/lib/monitoring.ts`:

```typescript
import { performanceMonitor, measureAsync } from '@/lib/monitoring';

// Measure async operations
const result = await measureAsync('database-query', async () => {
  return await db.query('SELECT * FROM users');
}, { query: 'users' });

// Start/stop timer
const stopTimer = performanceMonitor.startTimer('operation-name');
// ... do work ...
stopTimer();

// Get metrics summary
const summary = performanceMonitor.getSummary();
```

---

## Configuration Management

### Environment Configuration

Located in `src/lib/config.ts`, provides validated configuration management.

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
# Application Environment
NODE_ENV=development

# Server Configuration
PORT=3000

# Logging Configuration
LOG_LEVEL=debug

# API Configuration
API_TIMEOUT=30000
MAX_REQUEST_SIZE=10mb

# Rate Limiting Configuration
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Usage

```typescript
import { config, isDevelopment, isProduction } from '@/lib/config';

if (isDevelopment()) {
  // Development-only code
}

const timeout = config.api.timeout;
```

### Validation

Configuration is validated on startup. Invalid configuration will prevent the application from starting with clear error messages.

---

## Security Enhancements

### Security Headers

Configured in `next.config.ts`:

- `Strict-Transport-Security`: Enforce HTTPS
- `X-Frame-Options`: Prevent clickjacking
- `X-Content-Type-Options`: Prevent MIME sniffing
- `X-XSS-Protection`: Enable XSS filter
- `Referrer-Policy`: Control referrer information

### Middleware

Located in `src/middleware.ts`:

- Request ID generation for tracing
- CORS headers for API routes
- Request timing headers

### Input Sanitization

All user inputs should be validated and sanitized:

```typescript
import { sanitizeString, validateString } from '@/lib/validation';

const cleanInput = sanitizeString(userInput);
const validatedInput = validateString(cleanInput, 'input', { maxLength: 100 });
```

---

## Docker Improvements

### Multi-Stage Build

The Dockerfile uses multi-stage builds for:
- Smaller image size
- Faster builds
- Better layer caching

### Security Features

1. **Non-root user**: Application runs as `nextjs` user (UID 1001)
2. **Minimal base image**: Uses Alpine Linux
3. **Health checks**: Built-in health monitoring
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

Docker will automatically check health every 30 seconds:

```bash
docker ps  # Check HEALTH status column
```

---

## Best Practices

### Error Handling

1. Always use try-catch blocks in API routes
2. Use custom error classes for better categorization
3. Log errors with context
4. Return consistent error responses
5. Never expose sensitive information in error messages

### Logging

1. Use appropriate log levels
2. Include relevant context in logs
3. Avoid logging sensitive data (passwords, tokens, etc.)
4. Use structured logging for better parsing
5. Monitor logs in production

### Rate Limiting

1. Apply rate limiting to all public endpoints
2. Use stricter limits for resource-intensive operations
3. Consider user-based rate limiting for authenticated endpoints
4. Monitor rate limit violations

### Validation

1. Validate all user inputs
2. Sanitize strings to prevent XSS
3. Use type-safe validation
4. Provide clear validation error messages
5. Validate on both client and server

### Monitoring

1. Regularly check health endpoint
2. Monitor performance metrics
3. Set up alerts for degraded health
4. Track slow operations
5. Monitor memory usage

### Configuration

1. Never commit secrets to version control
2. Use environment variables for configuration
3. Validate configuration on startup
4. Document all configuration options
5. Use different configs for different environments

---

## Troubleshooting

### High Memory Usage

Check `/api/metrics` for memory statistics. If memory usage is consistently high:

1. Check for memory leaks in client components
2. Review large data structures
3. Implement pagination for large datasets
4. Consider increasing container memory limits

### Slow Response Times

Check `/api/metrics` for slow operations:

1. Review database queries
2. Add caching where appropriate
3. Optimize heavy computations
4. Consider background job processing

### Rate Limit Issues

If legitimate users are being rate limited:

1. Review rate limit configuration
2. Consider user-based rate limiting
3. Implement rate limit bypass for trusted IPs
4. Use distributed rate limiting for multiple instances

---

## Monitoring Integration

### Recommended Tools

- **Application Monitoring**: New Relic, Datadog, Sentry
- **Log Aggregation**: ELK Stack, Splunk, Datadog Logs
- **Uptime Monitoring**: Pingdom, UptimeRobot, StatusCake
- **Container Monitoring**: Prometheus + Grafana

### Health Check Integration

Configure your load balancer or orchestrator to use `/api/health`:

**Kubernetes Example**:
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
```

**AWS ALB Example**:
```
Health Check Path: /api/health
Healthy Threshold: 2
Unhealthy Threshold: 3
Timeout: 5 seconds
Interval: 30 seconds
```

---

## Future Improvements

1. **Distributed Tracing**: Implement OpenTelemetry for request tracing
2. **Metrics Export**: Export metrics to Prometheus
3. **Circuit Breaker**: Add circuit breaker pattern for external services
4. **Graceful Shutdown**: Implement proper shutdown handling
5. **Database Health Checks**: Add database connectivity checks
6. **Cache Health Checks**: Monitor cache availability
7. **Custom Metrics**: Add business-specific metrics
8. **Alerting**: Implement automated alerting for critical issues

---

## Support

For issues or questions about reliability features:

1. Check this documentation
2. Review logs at `/api/metrics`
3. Check health status at `/api/health`
4. Review error logs for detailed error information

---

## License

This reliability implementation follows the same license as the main application.
