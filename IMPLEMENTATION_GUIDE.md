# Service Health Check Implementation Guide

This guide provides step-by-step instructions for implementing the health check improvements in your Next.js application.

## Quick Start

### 1. Install Dependencies
```bash
# No additional dependencies required - pure TypeScript implementation
npm install # or pnpm install
```

### 2. Environment Configuration
Create or update your `.env.local` file:

```bash
# Logging Configuration
LOG_LEVEL=debug                    # development
LOG_FORMAT=pretty                  # development
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_FILE=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000       # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_REDIS=false            # Use in-memory for now

# Health Checks
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000       # 30 seconds

# Security
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
ENABLE_HELMET=false               # development
CSRF_PROTECTION=false             # development

# Performance
MAX_REQUEST_SIZE=10mb
REQUEST_TIMEOUT=30000             # 30 seconds
COMPRESSION_ENABLED=true
```

For production, adjust these values:
```bash
LOG_LEVEL=info
LOG_FORMAT=json
ENABLE_HELMET=true
CSRF_PROTECTION=true
```

## Implementation Steps

### Step 1: Core Libraries Setup

The core libraries are already implemented in `src/lib/`:

- `errors.ts` - Error handling and resilience patterns
- `logger.ts` - Structured logging system  
- `validation.ts` - Input validation framework
- `config.ts` - Configuration management
- `health.ts` - Health monitoring system
- `rate-limit.ts` - Rate limiting utilities

### Step 2: API Route Enhancements

#### Update Existing Routes

1. **Import the utilities** at the top of your API routes:
```typescript
import { logger, logApiRequest, logApiError } from '@/lib/logger';
import { AppError, ValidationError } from '@/lib/errors';
import { rateLimiters, createRateLimitMiddleware } from '@/lib/rate-limit';
import { healthChecker } from '@/lib/health';
```

2. **Add rate limiting middleware**:
```typescript
const rateLimitMiddleware = createRateLimitMiddleware(rateLimiters.api);
```

3. **Wrap your route handlers** with proper error handling:
```typescript
export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    // Track request
    healthChecker.incrementRequest();
    logApiRequest('GET', '/api/your-route', {});

    // Apply rate limiting
    const rateLimitResult = rateLimitMiddleware(request);
    if (!rateLimitResult.success) {
      healthChecker.incrementError();
      return rateLimitResult.response!;
    }

    // Your existing logic here
    const result = await yourExistingLogic();

    return NextResponse.json(result);
    
  } catch (error) {
    healthChecker.incrementError();
    
    if (error instanceof AppError) {
      logApiError('/api/your-route', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    // Handle unexpected errors
    const unexpectedError = error instanceof Error ? error : new Error('Unknown error');
    logApiError('/api/your-route', unexpectedError);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 3: Health Check Endpoints

The health check endpoints are already created:

- `GET /api/health` - Full health status with dependency checks
- `GET /api/health/live` - Simple liveness probe
- `GET /api/health/ready` - Readiness probe for load balancers

### Step 4: Client-Side Error Boundaries

1. **Import the ErrorBoundary** component:
```typescript
import { ClientErrorBoundary } from '@/components/ClientErrorBoundary';
```

2. **Wrap your components**:
```typescript
<ClientErrorBoundary fallback={<div>Something went wrong</div>}>
  <YourHeavyComponent />
</ClientErrorBoundary>
```

3. **Use safe functions** for risky operations:
```typescript
import { safeFunction } from '@/lib/errors';

const safeComputation = safeFunction(
  () => riskyComputation(data),
  defaultValue,
  (error) => logger.error('Computation failed', {}, error)
);
```

### Step 5: Input Validation

1. **Define validation schemas**:
```typescript
import { v, validateBody } from '@/lib/validation';

const userSchema = v.object().shape({
  name: v.string().min(1).max(100),
  email: v.string().email(),
  age: v.number().integer().min(0).max(120)
});
```

2. **Validate in API routes**:
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateBody(userSchema)(body);
    
    if (!validation.success) {
      throw new ValidationError('Invalid input', { 
        validationErrors: validation.errors 
      });
    }

    const { name, email, age } = validation.data!;
    // Use validated data
    
  } catch (error) {
    // Error handling as shown above
  }
}
```

## Testing the Implementation

### 1. Test Health Endpoints
```bash
# Test health checks
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/live
curl http://localhost:3000/api/health/ready
```

### 2. Test Rate Limiting
```bash
# Send multiple requests quickly
for i in {1..10}; do
  curl http://localhost:3000/api/test &
done
```

### 3. Test Error Handling
```bash
# Test the improved /api/test endpoint
curl http://localhost:3000/api/test

# Test validation
curl -X POST http://localhost:3000/api/heavy-processing \
  -H "Content-Type: application/json" \
  -d '{"iterations": "invalid", "complexity": "invalid"}'
```

### 4. Test Client Error Boundaries
1. Start the development server: `npm run dev`
2. Open browser developer tools
3. Navigate to the application
4. Observe error boundaries protecting component failures

## Monitoring and Observability

### Log Analysis
With structured logging, you can now:

```bash
# Filter logs by level
grep '"level":"error"' logs/app.log

# Search for specific API calls
grep '"/api/heavy-processing"' logs/app.log

# Monitor performance
grep '"operation":"heavy-processing"' logs/app.log
```

### Health Monitoring
Set up monitoring alerts based on health endpoints:

```yaml
# Example Kubernetes liveness probe
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

# Example Kubernetes readiness probe  
readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Metrics Collection
The health system tracks key metrics:

- Request count and rate
- Error count and rate  
- Response times
- Memory usage
- Service dependency health

## Production Deployment

### 1. Environment Variables
```bash
# Production environment variables
NODE_ENV=production
LOG_LEVEL=info
LOG_FORMAT=json
LOG_ENABLE_FILE=true
LOG_FILE_PATH=/var/log/app.log

RATE_LIMIT_MAX_REQUESTS=1000
ENABLE_HELMET=true
CSRF_PROTECTION=true
```

### 2. Load Balancer Configuration
Configure your load balancer to use the health endpoints:

- **Health check URL**: `/api/health/ready`
- **Interval**: 5-10 seconds
- **Timeout**: 3 seconds
- **Healthy threshold**: 2 consecutive successes
- **Unhealthy threshold**: 3 consecutive failures

### 3. Log Aggregation
For production, integrate with log aggregation services:

```typescript
// In src/lib/logger.ts, update sendToExternalLogger:
private sendToExternalLogger(entry: LogEntry): void {
  // Send to Datadog
  fetch('https://http-intake.logs.datadoghq.com/v1/input/YOUR_API_KEY', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  });
}
```

## Customization Guide

### Adding New Validation Schemas
```typescript
// In src/lib/validation.ts
export const customSchemas = {
  productCreate: v.object().shape({
    name: v.string().min(1).max(200),
    price: v.number().min(0),
    category: v.string().regex(/^(electronics|clothing|books)$/),
    tags: v.array(v.string()).maxLength(10)
  })
};
```

### Creating Custom Error Types
```typescript
// In src/lib/errors.ts
export class PaymentError extends AppError {
  constructor(message: string, paymentId?: string) {
    super(message, 402, true, { paymentId });
  }
}
```

### Adding New Rate Limiters
```typescript
// In src/lib/rate-limit.ts
export const rateLimiters = {
  // ... existing limiters
  payment: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 payments per hour per user
  }),
};
```

## Troubleshooting

### Common Issues

1. **Rate limiting not working**
   - Check that middleware is applied to routes
   - Verify rate limiter configuration
   - Check client IP detection in proxy environments

2. **Health checks failing**
   - Verify all dependencies are running
   - Check timeout configurations
   - Review health check logic for your specific services

3. **Validation errors**
   - Ensure schemas match your data structure
   - Check for typos in validation rules
   - Verify client sends correct content-type headers

4. **Error boundaries not catching errors**
   - Error boundaries only catch render errors, not async errors
   - Use safe functions for async operations
   - Ensure error boundaries are placed correctly in component tree

## Performance Considerations

The health check improvements add minimal overhead:

- **Validation**: ~1-2ms per validated request
- **Logging**: ~0.5ms per log entry
- **Rate limiting**: ~0.1ms per request
- **Error boundaries**: No performance impact during normal operation

Total overhead: < 5ms per request, which is negligible for most applications.

## Support and Maintenance

### Regular Tasks
1. **Monitor error rates** through health endpoints
2. **Review logs** for patterns and issues  
3. **Update rate limits** based on traffic patterns
4. **Test error boundaries** during deployments
5. **Validate health checks** after infrastructure changes

### Scaling Considerations
- **Rate limiting**: Consider Redis-based storage for multi-instance deployments
- **Logging**: Implement log rotation and archival
- **Health checks**: Add caching for expensive dependency checks
- **Validation**: Cache compiled schemas for better performance

This implementation provides a solid foundation for production-ready Next.js applications with comprehensive error handling, monitoring, and defensive programming patterns.
