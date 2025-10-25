# Service Health Check and Monitoring Guide

This document outlines the improvements made to enhance service reliability and provides usage instructions.

## Overview of Improvements

### ✅ 1. Error Handling
- **Comprehensive Error Classes**: Custom error types for different scenarios
- **Global Error Handling**: Standardized error responses across all API routes
- **Circuit Breakers**: Prevent cascade failures during high load
- **Timeout Protection**: All operations have configurable timeouts
- **Retry Mechanisms**: Automatic retry with exponential backoff

### ✅ 2. Logging and Monitoring
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Request Tracking**: Full request lifecycle logging
- **Performance Metrics**: Detailed timing and resource usage
- **Security Events**: Logging of suspicious activities
- **Health Check Endpoints**: Comprehensive system health monitoring

### ✅ 3. Configuration Management
- **Environment Validation**: Schema-based configuration validation
- **Safe Defaults**: Fallback values for all configuration options
- **Runtime Configuration**: Dynamic configuration without restarts
- **Security**: Proper secrets management patterns

### ✅ 4. Rate Limiting and Security
- **Rate Limiting**: Configurable rate limits per IP
- **Request Size Limits**: Protection against oversized requests
- **Security Headers**: Comprehensive security header implementation
- **Input Validation**: Schema-based request validation

### ✅ 5. Resource Management
- **Memory Monitoring**: Active memory usage tracking
- **Garbage Collection**: Forced GC during heavy operations
- **Resource Limits**: Configurable limits for iterations and memory
- **Performance Throttling**: Dynamic throttling based on system load

## New API Endpoints

### Health Check Endpoints

#### `/api/health`
Comprehensive health check with system diagnostics:
```bash
curl http://localhost:3000/api/health
```

Response includes:
- Overall system status
- Memory usage
- CPU load
- Database connectivity (when applicable)
- External service status

#### `/api/ready`
Kubernetes readiness probe:
```bash
curl http://localhost:3000/api/ready
```

#### `/api/alive`
Kubernetes liveness probe:
```bash
curl http://localhost:3000/api/alive
```

### Improved API Endpoints

#### `/api/heavy-processing-improved`
Enhanced version of the heavy processing endpoint with:
- Input validation
- Rate limiting
- Circuit breaker protection
- Timeout handling
- Resource monitoring

```bash
# GET request
curl http://localhost:3000/api/heavy-processing-improved

# POST request with validation
curl -X POST http://localhost:3000/api/heavy-processing-improved \
  -H "Content-Type: application/json" \
  -d '{"iterations": 1000, "complexity": "medium", "timeout": 10000}'
```

#### `/api/test-improved`
Fixed version of the test endpoint with:
- Proper null checking
- Input validation
- Error handling
- Security logging

```bash
# Normal request
curl http://localhost:3000/api/test-improved

# Test error scenarios
curl -X POST "http://localhost:3000/api/test-improved?error=validation"
curl -X POST "http://localhost:3000/api/test-improved?error=not-found"
```

## Configuration

### Environment Variables

Copy `env.example` to `.env.local` and adjust values:

```bash
cp env.example .env.local
```

Key configuration options:

- `API_TIMEOUT`: Maximum API operation timeout (default: 30000ms)
- `MAX_ITERATIONS`: Maximum iterations for heavy processing (default: 50000)
- `RATE_LIMIT_MAX`: Maximum requests per window (default: 100)
- `LOG_LEVEL`: Logging level (error, warn, info, debug)
- `MEMORY_LIMIT_MB`: Memory limit for operations (default: 512MB)

### Logging Configuration

Set logging format and level:
```bash
LOG_LEVEL=debug
LOG_FORMAT=pretty  # or 'json' for production
```

## Monitoring and Observability

### Request Correlation
All requests now include correlation IDs for tracking:
```bash
curl -H "X-Correlation-ID: custom-trace-id" http://localhost:3000/api/health
```

### Performance Metrics
Check performance data in health endpoint:
```json
{
  "system": {
    "memory": {
      "heapUsed": 45123456,
      "heapTotal": 67890123
    },
    "cpu": {
      "loadAverage": [0.5, 0.3, 0.2]
    }
  }
}
```

### Rate Limit Headers
All responses include rate limit information:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200000
```

## Security Features

### Input Validation
All API endpoints now validate input using Zod schemas:
- Type checking
- Range validation
- Format validation
- Sanitization

### Security Headers
Automatic security headers on all responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (in production)

### Rate Limiting
Per-IP rate limiting with configurable limits:
- Default: 100 requests per 15 minutes
- Automatic cleanup of expired entries
- Proper HTTP 429 responses

## Error Handling

### Error Response Format
Standardized error responses:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": { "field": "iterations", "reason": "too large" },
    "timestamp": "2023-12-01T10:00:00.000Z",
    "requestId": "req_123456"
  }
}
```

### Circuit Breaker States
Monitor circuit breaker status in API responses:
```json
{
  "circuitBreakerStatus": "CLOSED",  // CLOSED, OPEN, or HALF_OPEN
  "serverStats": { ... }
}
```

## Testing the Improvements

### 1. Test Error Handling
```bash
# Test validation error
curl -X POST http://localhost:3000/api/heavy-processing-improved \
  -H "Content-Type: application/json" \
  -d '{"iterations": 999999}'  # Exceeds limit

# Test invalid JSON
curl -X POST http://localhost:3000/api/heavy-processing-improved \
  -H "Content-Type: application/json" \
  -d '{invalid json}'
```

### 2. Test Rate Limiting
```bash
# Send multiple rapid requests
for i in {1..150}; do
  curl -w "%{http_code}\n" -o /dev/null -s http://localhost:3000/api/health
done
```

### 3. Test Health Monitoring
```bash
# Check comprehensive health
curl http://localhost:3000/api/health | jq .

# Monitor during load
curl -X POST http://localhost:3000/api/heavy-processing-improved \
  -H "Content-Type: application/json" \
  -d '{"iterations": 10000, "complexity": "heavy"}'

# Check health again
curl http://localhost:3000/api/health | jq .system.memory
```

### 4. Test Circuit Breaker
```bash
# Trigger circuit breaker with multiple failing requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/test-improved?error=timeout
done
```

## Production Deployment

### Environment Configuration
Set production environment variables:
```bash
NODE_ENV=production
LOG_LEVEL=warn
LOG_FORMAT=json
RATE_LIMIT_MAX=1000
MAX_ITERATIONS=100000
```

### Docker Configuration
The existing Dockerfile works with the new health checks:
```dockerfile
# Health check in Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/alive || exit 1
```

### Kubernetes Configuration
```yaml
# deployment.yaml
spec:
  containers:
  - name: app
    livenessProbe:
      httpGet:
        path: /api/alive
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /api/ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
```

## Key Files Added

- `src/lib/config.ts` - Configuration management and validation
- `src/lib/logger.ts` - Structured logging with correlation IDs
- `src/lib/errors.ts` - Error handling utilities and circuit breakers
- `src/lib/middleware.ts` - Rate limiting and security middleware
- `src/lib/health.ts` - Health check implementations
- `src/app/api/health/route.ts` - Health check endpoint
- `src/app/api/ready/route.ts` - Readiness probe endpoint
- `src/app/api/alive/route.ts` - Liveness probe endpoint
- `src/app/api/heavy-processing-improved/route.ts` - Enhanced API endpoint
- `src/app/api/test-improved/route.ts` - Fixed test endpoint
- `env.example` - Environment configuration template

This comprehensive improvement addresses all the major reliability concerns while maintaining backward compatibility and providing clear upgrade paths.
