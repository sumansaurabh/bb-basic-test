# Next.js Application with Enhanced Reliability

A production-ready Next.js application with TypeScript, Tailwind CSS, and comprehensive reliability features.

## Features

✅ **Error Handling** - Custom error classes and consistent error responses  
✅ **Structured Logging** - Multi-level logging with context support  
✅ **Rate Limiting** - Configurable rate limiting for API endpoints  
✅ **Request Validation** - Comprehensive input validation utilities  
✅ **Health Checks** - Built-in health monitoring endpoints  
✅ **Performance Monitoring** - Track and analyze operation performance  
✅ **Security Headers** - OWASP-recommended security headers  
✅ **Docker Support** - Multi-stage builds with security best practices  
✅ **Configuration Management** - Environment variable validation  

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
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

### Build Docker Image

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

The container includes automatic health checks. Check status:

```bash
docker ps  # Shows health status
curl http://localhost:3000/api/health
```

## API Endpoints

### Health Check
- `GET /api/health` - Comprehensive health status
- `HEAD /api/health` - Quick readiness check

### Test Endpoint
- `GET /api/test` - Test endpoint with proper error handling

### Heavy Processing
- `GET /api/heavy-processing` - Heavy computation endpoint
- `POST /api/heavy-processing` - Configurable heavy processing

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── health/          # Health check endpoint
│   │   ├── test/            # Test endpoint
│   │   └── heavy-processing/ # Heavy processing endpoint
│   ├── components/          # React components
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main page
│   └── globals.css          # Global styles
├── lib/
│   ├── errors.ts            # Error handling utilities
│   ├── logger.ts            # Structured logging
│   ├── rate-limiter.ts      # Rate limiting
│   ├── validation.ts        # Input validation
│   ├── config.ts            # Configuration management
│   ├── monitoring.ts        # Performance monitoring
│   └── api-middleware.ts    # API middleware utilities
public/                      # Static assets
```

## Reliability Features

For detailed information about reliability features, see [RELIABILITY.md](./RELIABILITY.md).

### Quick Examples

#### Using API Middleware

```typescript
import { ApiHandlerPresets } from '@/lib/api-middleware';

export const GET = ApiHandlerPresets.standard(async (request) => {
  // Your handler logic with automatic:
  // - Error handling
  // - Rate limiting
  // - Logging
  // - Performance monitoring
  // - Timeout protection
});
```

#### Input Validation

```typescript
import { validateNumber, validateString } from '@/lib/validation';

const age = validateNumber(input.age, 'age', { min: 0, max: 150 });
const name = validateString(input.name, 'name', { minLength: 2 });
```

#### Structured Logging

```typescript
import { logger } from '@/lib/logger';

logger.info('User action', { userId: '123', action: 'login' });
logger.error('Operation failed', error, { context: 'payment' });
```

## Environment Variables

See `.env.example` for all available configuration options:

```bash
NODE_ENV=development          # Environment: development, production, test
PORT=3000                     # Server port
LOG_LEVEL=info               # Logging level: debug, info, warn, error, fatal
API_TIMEOUT=30000            # API timeout in milliseconds
RATE_LIMIT_ENABLED=true      # Enable/disable rate limiting
CORS_ORIGINS=*               # CORS allowed origins
MAX_REQUEST_SIZE=10mb        # Maximum request body size
```

## Monitoring

### Health Monitoring

Check application health:

```bash
curl http://localhost:3000/api/health
```

Response includes:
- Service status (healthy/degraded/unhealthy)
- Uptime and response time
- Memory usage statistics
- System information

### Performance Metrics

Performance metrics are automatically collected for all API endpoints. Access them programmatically:

```typescript
import { performanceMonitor } from '@/lib/monitoring';

const stats = performanceMonitor.getStats('operation-name');
// Returns: { count, avg, min, max, p50, p95, p99 }
```

## Security

### Security Headers

The application includes OWASP-recommended security headers:
- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

### Rate Limiting

API endpoints are protected with configurable rate limiting:
- Standard: 60 requests/minute
- Heavy: 10 requests/minute
- Strict: 5 requests/minute
- Lenient: 100 requests/minute

### Input Validation

All API inputs are validated and sanitized to prevent:
- Injection attacks
- Invalid data types
- Out-of-range values
- XSS attacks

## Troubleshooting

### Application Won't Start

1. Check environment variables are set correctly
2. Review logs for configuration errors
3. Ensure all required dependencies are installed

### High Memory Usage

1. Check `/api/health` for memory metrics
2. Review client components for memory leaks
3. Ensure proper cleanup in useEffect hooks

### Rate Limit Errors

1. Check rate limit configuration
2. Verify client identifier logic
3. Consider implementing user-based rate limiting

For more troubleshooting tips, see [RELIABILITY.md](./RELIABILITY.md).

## Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Use the provided utilities (logging, validation, etc.)

## License

MIT

## Additional Documentation

- [Reliability Features](./RELIABILITY.md) - Comprehensive reliability documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
