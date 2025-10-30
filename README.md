# Next.js Application with Enhanced Reliability

A production-ready Next.js application with TypeScript, Tailwind CSS, and comprehensive reliability features.

## Features

✅ **Error Handling**: Custom error classes and consistent error responses  
✅ **Structured Logging**: Multi-level logging with context support  
✅ **Rate Limiting**: Protect APIs from abuse with configurable limits  
✅ **Request Validation**: Comprehensive input validation and sanitization  
✅ **Health Checks**: Monitor service health and performance metrics  
✅ **Security Headers**: Production-ready security configuration  
✅ **Docker Support**: Multi-stage builds with health checks  
✅ **Environment Validation**: Ensure all required config is present  
✅ **API Middleware**: Timeout handling and request tracking  
✅ **Memory Leak Prevention**: Proper cleanup in client components  

## Getting Started

### Development
Run the development server:
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the website.

### Build
Create a production build:
```bash
pnpm build
```

### Production
Start the production server:
```bash
pnpm start
```

### Linting
Run ESLint:
```bash
pnpm lint
```

## Docker

### Build the Docker image:
```bash
docker build -t nextjs-app .
```

### Run the container:
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  nextjs-app
```

### Check health:
```bash
curl http://localhost:3000/api/health
```

## API Endpoints

### Health Check
```bash
GET /api/health
```
Returns service health status and metrics.

### Metrics
```bash
GET /api/metrics
```
Returns detailed performance metrics.

### Test Endpoint
```bash
GET /api/test
```
Test endpoint with proper error handling.

### Heavy Processing
```bash
GET /api/heavy-processing
POST /api/heavy-processing
```
Resource-intensive operations with rate limiting and validation.

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
API_TIMEOUT=30000
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
MONITORING_ENABLED=false
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── health/          # Health check endpoint
│   │   ├── metrics/         # Metrics endpoint
│   │   ├── test/            # Test endpoint
│   │   └── heavy-processing/ # Heavy processing endpoint
│   ├── components/          # React components
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── lib/
│   ├── errors.ts            # Custom error classes
│   ├── logger.ts            # Structured logging
│   ├── rate-limiter.ts      # Rate limiting
│   ├── validation.ts        # Input validation
│   ├── config.ts            # Environment config
│   └── api-middleware.ts    # API middleware utilities
└── middleware.ts            # Global middleware
```

## Reliability Features

For detailed information about reliability features, see [RELIABILITY.md](./RELIABILITY.md).

### Error Handling
All API routes use consistent error handling with custom error classes:
- ValidationError (400)
- NotFoundError (404)
- UnauthorizedError (401)
- RateLimitError (429)
- TimeoutError (408)
- ServiceUnavailableError (503)

### Logging
Structured logging with multiple levels (debug, info, warn, error, fatal):
```typescript
import { logger } from '@/lib/logger';
logger.info('User action', { userId: '123' });
```

### Rate Limiting
Protect your APIs with configurable rate limits:
```typescript
import { rateLimiter, RateLimitPresets } from '@/lib/rate-limiter';
const rateLimit = rateLimiter.check(clientId, RateLimitPresets.STANDARD);
```

### Validation
Comprehensive input validation:
```typescript
import { validateNumber, validateString } from '@/lib/validation';
const value = validateNumber(input, 'fieldName', { min: 0, max: 100 });
```

## Monitoring

### Health Check
Monitor service health:
```bash
curl http://localhost:3000/api/health
```

### Metrics
Get performance metrics:
```bash
curl http://localhost:3000/api/metrics
```

### Docker Health Check
The Docker container includes automatic health checks that run every 30 seconds.

## Security

- Security headers configured (HSTS, X-Frame-Options, CSP, etc.)
- Non-root Docker user
- Input validation and sanitization
- Rate limiting on all API endpoints
- Request timeout protection

## Best Practices

1. **Always handle errors**: Use try-catch blocks and custom error classes
2. **Validate inputs**: Use validation utilities for all user inputs
3. **Log important operations**: Use structured logging with context
4. **Implement rate limiting**: Protect APIs from abuse
5. **Clean up resources**: Properly cleanup intervals, timeouts, and event listeners
6. **Monitor health**: Regularly check health and metrics endpoints

## Troubleshooting

### High Memory Usage
Check health endpoint and review client components for memory leaks.

### Rate Limiting Issues
Adjust rate limit presets in `src/lib/rate-limiter.ts`.

### Timeout Errors
Increase `API_TIMEOUT` environment variable or optimize operations.

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include logging for important operations
4. Validate all inputs
5. Add tests for new features
6. Update documentation

## License

MIT
