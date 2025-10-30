# Quick Start Guide

Get up and running with the reliability-enhanced Next.js application in minutes.

## Prerequisites

- Node.js 18 or higher
- pnpm (recommended) or npm/yarn
- Docker (optional, for containerized deployment)

## Installation

```bash
# Clone the repository (if not already done)
# cd into the project directory

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# (Optional) Edit .env with your configuration
nano .env
```

## Development

```bash
# Start development server
pnpm dev

# Open http://localhost:3000
```

## Testing the New Features

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "uptime": { "seconds": 120, "formatted": "2m 0s" },
  "memory": { "heapUsed": 45, "heapTotal": 89, ... }
}
```

### 2. Performance Metrics
```bash
curl http://localhost:3000/api/metrics
```

### 3. Test Error Handling
```bash
# Test the fixed /api/test endpoint
curl http://localhost:3000/api/test
```

### 4. Test Rate Limiting
```bash
# Make multiple rapid requests to trigger rate limiting
for i in {1..15}; do
  curl http://localhost:3000/api/heavy-processing
  echo ""
done
```

After 10 requests (HEAVY preset), you should see:
```json
{
  "success": false,
  "error": {
    "message": "Rate limit exceeded. Try again in X seconds.",
    "code": "RATE_LIMIT_EXCEEDED",
    "statusCode": 429
  }
}
```

### 5. Test Request Validation
```bash
# Test with invalid data
curl -X POST http://localhost:3000/api/heavy-processing \
  -H "Content-Type: application/json" \
  -d '{"iterations": -1}'
```

Expected response:
```json
{
  "success": false,
  "error": {
    "message": "iterations must be at least 1",
    "code": "VALIDATION_ERROR",
    "statusCode": 400
  }
}
```

## Building for Production

```bash
# Create production build
pnpm build

# Start production server
pnpm start
```

## Docker Deployment

```bash
# Build Docker image
docker build -t nextjs-app .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  nextjs-app

# Check health
curl http://localhost:3000/api/health
```

## Environment Variables

Key variables to configure (see `.env.example` for all options):

```bash
# Environment
NODE_ENV=development          # or production

# Logging
LOG_LEVEL=debug              # debug, info, warn, error, fatal

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=60   # requests per minute

# API
API_TIMEOUT=30000            # milliseconds
```

## Using the New Features in Your Code

### Error Handling
```typescript
import { ValidationError, NotFoundError } from '@/lib/errors';

// Throw specific errors
if (!data) {
  throw new NotFoundError('Data not found');
}

if (age < 0) {
  throw new ValidationError('Age must be positive');
}
```

### Logging
```typescript
import { logger } from '@/lib/logger';

// Log with context
logger.info('User created', { userId: 123, email: 'user@example.com' });
logger.error('Failed to save', error, { userId: 123 });

// Create child logger with persistent context
const requestLogger = logger.child({ requestId: '123' });
requestLogger.info('Processing request'); // Includes requestId
```

### Rate Limiting
```typescript
import { rateLimiter, RateLimitPresets, getClientIdentifier } from '@/lib/rate-limiter';

// In your API route
const clientId = getClientIdentifier(request);
rateLimiter.check(clientId, RateLimitPresets.STANDARD);
```

### Request Validation
```typescript
import { validateNumber, validateString, validateEmail } from '@/lib/validation';

// Validate request data
const age = validateNumber(body.age, 'age', { min: 0, max: 150 });
const email = validateEmail(body.email);
const status = validateString(body.status, 'status', { 
  enum: ['active', 'inactive'] 
});
```

### Performance Monitoring
```typescript
import { performanceMonitor, measureAsync } from '@/lib/monitoring';

// Measure async operations
const result = await measureAsync('database-query', async () => {
  return await db.query('SELECT * FROM users');
});

// Manual timing
const endTimer = performanceMonitor.startTimer('operation');
// ... do work ...
endTimer({ success: true });
```

## API Route Template

Use this template for new API routes:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { formatErrorResponse } from '@/lib/errors';
import { rateLimiter, RateLimitPresets, getClientIdentifier } from '@/lib/rate-limiter';
import { validateString } from '@/lib/validation';
import { performanceMonitor } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const requestLogger = logger.child({ requestId, path: '/api/your-endpoint' });
  const endTimer = performanceMonitor.startTimer('your-operation');

  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    rateLimiter.check(clientId, RateLimitPresets.STANDARD);

    requestLogger.info('Request started');

    // Parse and validate
    const body = await request.json();
    const name = validateString(body.name, 'name', { minLength: 1 });

    // Your business logic here
    const result = { success: true, data: { name } };

    endTimer({ success: true });
    requestLogger.info('Request completed');

    return NextResponse.json(result);
  } catch (error) {
    endTimer({ success: false });
    requestLogger.error('Request failed', error as Error);

    const errorResponse = formatErrorResponse(
      error as Error,
      '/api/your-endpoint',
      process.env.NODE_ENV === 'development'
    );

    return NextResponse.json(
      errorResponse,
      { status: errorResponse.error.statusCode }
    );
  }
}
```

## Monitoring in Production

### Health Checks
Set up automated health checks:
```bash
# Kubernetes liveness probe
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

# Docker Compose
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Log Aggregation
Configure your log aggregation tool to parse JSON logs:
```bash
# Example: Viewing logs in production
docker logs -f container-name | jq .
```

### Metrics Collection
Set up periodic metrics collection:
```bash
# Example: Collect metrics every minute
*/1 * * * * curl -s http://localhost:3000/api/metrics >> /var/log/metrics.log
```

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

### Port Already in Use
```bash
# Change port in .env
PORT=3001

# Or kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Rate Limiting Too Strict
```bash
# Adjust in .env
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

## Next Steps

1. **Read Full Documentation**: See `RELIABILITY.md` for comprehensive documentation
2. **Review Improvements**: See `IMPROVEMENTS_SUMMARY.md` for all changes made
3. **Customize Configuration**: Edit `.env` for your environment
4. **Add Tests**: Write unit and integration tests for your features
5. **Set Up Monitoring**: Configure health checks and log aggregation

## Support

- **Documentation**: `RELIABILITY.md`
- **API Reference**: Check individual route files in `src/app/api/`
- **Library Reference**: Check files in `src/lib/`
- **Issues**: Check logs and health endpoint first

## Useful Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Docker
docker build -t app . # Build image
docker run -p 3000:3000 app  # Run container
docker logs -f container-id  # View logs

# Testing
curl http://localhost:3000/api/health   # Health check
curl http://localhost:3000/api/metrics  # Metrics
```

---

**Ready to go!** 🚀

Your application now has enterprise-grade reliability features. Start the dev server and explore the new endpoints!
