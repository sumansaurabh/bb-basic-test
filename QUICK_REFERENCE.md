# Quick Reference Guide

## Common Tasks

### Check Service Health
```bash
curl http://localhost:3000/api/health
```

### View Metrics
```bash
curl http://localhost:3000/api/metrics
```

### View Logs
Logs are output to stdout/stderr. In development, they're human-readable. In production, they're JSON formatted.

### Test Rate Limiting
```bash
# Make 70 requests rapidly (limit is 60/min for standard endpoints)
for i in {1..70}; do curl http://localhost:3000/api/test; done
```

## Error Handling

### Throw Custom Errors
```typescript
import { ValidationError, NotFoundError } from '@/lib/errors';

// Validation error (400)
throw new ValidationError('Invalid email format');

// Not found error (404)
throw new NotFoundError('User not found');
```

### Handle Errors in API Routes
```typescript
import { formatErrorResponse } from '@/lib/errors';

try {
  // Your logic
} catch (error) {
  const errorResponse = formatErrorResponse(error as Error, '/api/endpoint');
  return NextResponse.json(errorResponse, { 
    status: errorResponse.error.statusCode 
  });
}
```

## Logging

### Basic Logging
```typescript
import { logger } from '@/lib/logger';

logger.debug('Debug message', { userId: '123' });
logger.info('User logged in', { userId: '123' });
logger.warn('High memory usage', { usage: 85 });
logger.error('Database error', error, { query: 'SELECT *' });
logger.fatal('Critical system error', error);
```

### Child Logger with Context
```typescript
const userLogger = logger.child({ userId: '123', sessionId: 'abc' });
userLogger.info('Action performed');  // Automatically includes userId and sessionId
```

## Rate Limiting

### Apply Rate Limiting
```typescript
import { rateLimiter, RateLimitPresets, getClientIdentifier } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  rateLimiter.check(clientId, RateLimitPresets.STANDARD);
  
  // Your handler logic
}
```

### Available Presets
- `RateLimitPresets.STRICT` - 5 requests/minute
- `RateLimitPresets.STANDARD` - 60 requests/minute
- `RateLimitPresets.LENIENT` - 100 requests/minute
- `RateLimitPresets.HEAVY` - 10 requests/minute

### Custom Rate Limit
```typescript
rateLimiter.check(clientId, {
  windowMs: 60000,  // 1 minute
  maxRequests: 30,  // 30 requests
});
```

## Input Validation

### Validate Numbers
```typescript
import { validateNumber } from '@/lib/validation';

const age = validateNumber(input, 'age', {
  min: 0,
  max: 120,
  integer: true
});
```

### Validate Strings
```typescript
import { validateString } from '@/lib/validation';

const username = validateString(input, 'username', {
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9_]+$/
});
```

### Validate Enums
```typescript
import { validateEnum } from '@/lib/validation';

const role = validateEnum(input, 'role', ['admin', 'user', 'guest']);
```

### Validate Email
```typescript
import { validateEmail } from '@/lib/validation';

const email = validateEmail(input);
```

### Sanitize Input
```typescript
import { sanitizeString } from '@/lib/validation';

const clean = sanitizeString(userInput);  // Removes < and >
```

## Configuration

### Access Configuration
```typescript
import { config } from '@/lib/config';

console.log(config.nodeEnv);        // 'development' | 'production' | 'test'
console.log(config.port);           // 3000
console.log(config.isDevelopment);  // true/false
console.log(config.api.timeout);    // 30000
```

### Environment Variables
Create `.env.local` from `.env.example`:
```bash
cp .env.example .env.local
```

## Docker

### Build Image
```bash
docker build -t nextjs-app .
```

### Run Container
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  nextjs-app
```

### Check Container Health
```bash
docker ps  # Look at HEALTH column
```

### View Container Logs
```bash
docker logs <container-id>
```

## Development

### Install Dependencies
```bash
pnpm install
```

### Run Development Server
```bash
pnpm dev
```

### Build for Production
```bash
pnpm build
```

### Start Production Server
```bash
pnpm start
```

### Run Linter
```bash
pnpm lint
```

## API Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { formatErrorResponse } from '@/lib/errors';
import { rateLimiter, RateLimitPresets, getClientIdentifier } from '@/lib/rate-limiter';
import { validateNumber } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    rateLimiter.check(clientId, RateLimitPresets.STANDARD);
    
    // Log request
    logger.info('API endpoint called', { clientId });
    
    // Your logic here
    const result = await doSomething();
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Log error
    logger.error('API endpoint error', error as Error);
    
    // Return error response
    const errorResponse = formatErrorResponse(
      error as Error,
      '/api/endpoint',
      process.env.NODE_ENV === 'development'
    );
    
    return NextResponse.json(
      errorResponse,
      { status: errorResponse.error.statusCode }
    );
  }
}
```

## Monitoring

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "memory": {
      "status": "pass",
      "percentage": 50.0
    }
  }
}
```

### Metrics Response
```json
{
  "timestamp": "2025-10-30T12:00:00.000Z",
  "process": {
    "pid": 1234,
    "uptime": 3600
  },
  "memory": {
    "heapUsed": 25000000
  }
}
```

## Troubleshooting

### High Memory Usage
1. Check `/api/metrics` for memory stats
2. Review logs for memory warnings
3. Check for memory leaks in client components

### Rate Limit Errors
1. Check rate limit configuration in `.env.local`
2. Adjust limits if needed
3. Implement user-based rate limiting for authenticated users

### Timeout Errors
1. Check `API_TIMEOUT` in configuration
2. Optimize slow operations
3. Consider implementing caching

### Build Errors
1. Run `pnpm install` to ensure dependencies are installed
2. Check TypeScript errors with `pnpm build`
3. Run linter with `pnpm lint`

## Security Best Practices

1. ✅ Always validate user input
2. ✅ Sanitize strings to prevent XSS
3. ✅ Use rate limiting on all public endpoints
4. ✅ Log security-relevant events
5. ✅ Never expose sensitive data in error messages
6. ✅ Use HTTPS in production
7. ✅ Keep dependencies updated
8. ✅ Review security headers configuration

## Performance Tips

1. Use `useMemo` for expensive calculations
2. Use `useCallback` for event handlers
3. Implement cleanup in `useEffect`
4. Use virtualization for large lists
5. Optimize images with Next.js Image component
6. Enable caching where appropriate
7. Monitor metrics regularly

## Support

- **Documentation**: See `RELIABILITY.md` for detailed documentation
- **Summary**: See `IMPROVEMENTS_SUMMARY.md` for all changes
- **Health Check**: `GET /api/health`
- **Metrics**: `GET /api/metrics`
