# Next.js Application with Reliability Features

A Next.js application with TypeScript, Tailwind CSS, and comprehensive reliability enhancements including error handling, logging, monitoring, and security features.

## Features

✅ **Error Handling**: Custom error classes with proper categorization  
✅ **Structured Logging**: JSON logging with multiple levels  
✅ **Rate Limiting**: Protect endpoints from abuse  
✅ **Request Validation**: Comprehensive input validation  
✅ **Health Checks**: Monitor application health  
✅ **Performance Monitoring**: Track metrics and slow operations  
✅ **Security Headers**: Multiple layers of security  
✅ **Docker Support**: Production-ready containerization  

## Getting Started

### Development

1. **Install dependencies**:
```bash
pnpm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env.local
```

3. **Run the development server**:
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

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/          # Health check endpoint
│   │   │   ├── metrics/         # Performance metrics endpoint
│   │   │   ├── test/            # Test endpoint
│   │   │   └── heavy-processing/ # Heavy processing endpoint
│   │   ├── components/          # React components
│   │   ├── page.tsx             # Main page
│   │   ├── layout.tsx           # Root layout
│   │   ├── error.tsx            # Error boundary
│   │   └── globals.css          # Global styles
│   ├── lib/
│   │   ├── errors.ts            # Custom error classes
│   │   ├── logger.ts            # Structured logging
│   │   ├── rate-limiter.ts      # Rate limiting
│   │   ├── validation.ts        # Input validation
│   │   ├── config.ts            # Configuration management
│   │   └── monitoring.ts        # Performance monitoring
│   └── middleware.ts            # Next.js middleware
├── public/                      # Static assets
├── Dockerfile                   # Docker configuration
├── next.config.ts               # Next.js configuration
├── .env.example                 # Environment variables example
└── RELIABILITY.md               # Reliability documentation
```

## API Endpoints

### Health Check
```bash
GET /api/health
```
Returns application health status for monitoring.

### Metrics
```bash
GET /api/metrics
```
Returns performance metrics and statistics.

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
Resource-intensive operations with rate limiting and timeouts.

## Environment Variables

See `.env.example` for all available configuration options:

- `NODE_ENV`: Application environment (development/production/test)
- `PORT`: Server port (default: 3000)
- `LOG_LEVEL`: Logging level (debug/info/warn/error)
- `API_TIMEOUT`: API request timeout in milliseconds
- `RATE_LIMIT_ENABLED`: Enable/disable rate limiting
- `RATE_LIMIT_WINDOW_MS`: Rate limit time window
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window

## Docker

### Build the image
```bash
docker build -t nextjs-app .
```

### Run the container
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  nextjs-app
```

### Health check
Docker automatically monitors health every 30 seconds using `/api/health`.

## Reliability Features

For detailed information about reliability features, see [RELIABILITY.md](./RELIABILITY.md).

### Error Handling
- Custom error classes for better categorization
- Consistent error response format
- Proper error logging with context

### Logging
- Structured JSON logging
- Multiple log levels (debug, info, warn, error)
- Request/response logging
- Performance logging

### Rate Limiting
- In-memory rate limiter
- Multiple presets (strict, standard, relaxed, heavy)
- Per-IP rate limiting
- Configurable via environment variables

### Validation
- Comprehensive input validation
- Type-safe validators
- Input sanitization
- Clear validation error messages

### Monitoring
- Health check endpoint
- Performance metrics
- Memory usage tracking
- Slow operation detection

### Security
- Security headers (HSTS, X-Frame-Options, etc.)
- CORS configuration
- Input sanitization
- Non-root Docker user

## Development Guidelines

### Error Handling
```typescript
import { ValidationError, formatErrorResponse } from '@/lib/errors';

try {
  // Your code
} catch (error) {
  const errorResponse = formatErrorResponse(error as Error, '/api/endpoint');
  return NextResponse.json(errorResponse, { 
    status: errorResponse.error.statusCode 
  });
}
```

### Logging
```typescript
import { logger } from '@/lib/logger';

logger.info('Operation completed', { userId: '123' });
logger.error('Operation failed', error, { context: 'data' });
```

### Rate Limiting
```typescript
import { rateLimiter, RateLimitPresets, getRequestIdentifier } from '@/lib/rate-limiter';

const identifier = getRequestIdentifier(request);
rateLimiter.check(identifier, RateLimitPresets.STANDARD);
```

### Validation
```typescript
import { validateNumber, validateString } from '@/lib/validation';

const age = validateNumber(body.age, 'age', { min: 0, max: 150 });
const name = validateString(body.name, 'name', { maxLength: 50 });
```

## Monitoring

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Metrics
```bash
curl http://localhost:3000/api/metrics
```

## Troubleshooting

### High Memory Usage
Check `/api/metrics` for memory statistics and review the application for memory leaks.

### Slow Response Times
Check `/api/metrics` for slow operations and optimize accordingly.

### Rate Limit Issues
Review rate limit configuration in `.env.local` and adjust as needed.

## Contributing

1. Follow the existing code structure
2. Use proper error handling
3. Add logging for important operations
4. Validate all user inputs
5. Write tests for new features
6. Update documentation

## License

This project is licensed under the MIT License.
