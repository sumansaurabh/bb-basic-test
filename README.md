# Next.js Application with Enhanced Reliability

A production-ready Next.js application with TypeScript, Tailwind CSS, and comprehensive reliability features.

## Features

✅ **Error Handling**: Custom error classes and consistent error responses  
✅ **Structured Logging**: Multi-level logging with development and production modes  
✅ **Rate Limiting**: Protect APIs from abuse with configurable rate limits  
✅ **Request Validation**: Type-safe input validation and sanitization  
✅ **Health Checks**: Built-in health and metrics endpoints  
✅ **Security Headers**: OWASP-recommended security headers  
✅ **Docker Support**: Multi-stage builds with security best practices  
✅ **Timeout Protection**: Prevent long-running requests from blocking resources  
✅ **Request Tracking**: Unique request IDs and response time tracking  

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your configuration
```

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

### Health Check

```bash
curl http://localhost:3000/api/health
```

## API Endpoints

### Health & Monitoring

- `GET /api/health` - Health check endpoint
- `GET /api/metrics` - System metrics endpoint

### Application APIs

- `GET /api/test` - Test endpoint with error handling
- `GET /api/heavy-processing` - Heavy processing endpoint (rate limited)
- `POST /api/heavy-processing` - Heavy processing with custom parameters

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── health/       # Health check endpoint
│   │   ├── metrics/      # Metrics endpoint
│   │   ├── test/         # Test endpoint
│   │   └── heavy-processing/  # Heavy processing endpoint
│   ├── components/       # React components
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   ├── error.tsx         # Error boundary
│   ├── loading.tsx       # Loading state
│   └── not-found.tsx     # 404 page
├── lib/                  # Utility libraries
│   ├── errors.ts         # Error handling utilities
│   ├── logger.ts         # Logging system
│   ├── rate-limiter.ts   # Rate limiting
│   ├── validation.ts     # Input validation
│   ├── config.ts         # Configuration management
│   └── api-wrapper.ts    # API route wrapper
├── middleware.ts         # Global middleware
└── ...
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `NODE_ENV` - Environment (development/production/test)
- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging level (debug/info/warn/error/fatal)
- `API_TIMEOUT` - API request timeout in ms
- `RATE_LIMIT_ENABLED` - Enable/disable rate limiting
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window

## Reliability Features

For detailed documentation on reliability features, see [RELIABILITY.md](./RELIABILITY.md).

### Error Handling

All API routes use consistent error handling with custom error classes:

```typescript
import { ValidationError } from '@/lib/errors';

throw new ValidationError('Invalid input');
```

### Logging

Structured logging with multiple levels:

```typescript
import { logger } from '@/lib/logger';

logger.info('User action', { userId: '123' });
logger.error('Operation failed', error);
```

### Rate Limiting

Protect endpoints from abuse:

```typescript
import { rateLimiter, RateLimitPresets, getClientIdentifier } from '@/lib/rate-limiter';

const clientId = getClientIdentifier(request);
rateLimiter.check(clientId, RateLimitPresets.STANDARD);
```

### Input Validation

Type-safe validation:

```typescript
import { validateNumber, validateEmail } from '@/lib/validation';

const age = validateNumber(input, 'age', { min: 0, max: 120 });
const email = validateEmail(input);
```

## Monitoring

### Health Check

```bash
curl http://localhost:3000/api/health
```

Returns service health status, memory usage, and uptime.

### Metrics

```bash
curl http://localhost:3000/api/metrics
```

Returns detailed system metrics including CPU, memory, and process information.

## Security

- Security headers configured (HSTS, X-Frame-Options, CSP, etc.)
- Input validation and sanitization
- Rate limiting on all API endpoints
- Non-root Docker user
- Request tracking and logging

## Performance

- Multi-stage Docker builds for smaller images
- Standalone output mode for optimized production builds
- Response compression enabled
- Timeout protection on long-running operations
- Memory leak prevention in client components

## Contributing

1. Follow the existing code structure
2. Add error handling to all API routes
3. Validate all user inputs
4. Add appropriate logging
5. Update tests and documentation

## License

MIT

## Support

For detailed documentation, troubleshooting, and best practices, see [RELIABILITY.md](./RELIABILITY.md).
