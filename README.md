# Next.js Application with Enhanced Reliability

A production-ready Next.js application with TypeScript, Tailwind CSS, and comprehensive error handling, monitoring, and security features.

## Features

✅ **Error Handling**
- Structured error handling with custom error classes
- Comprehensive logging system
- Safe error messages (no sensitive data exposure)

✅ **API Protection**
- Rate limiting on all endpoints
- Input validation and sanitization
- Request timeout protection
- Type-safe API responses

✅ **Monitoring & Health Checks**
- `/api/health` - Overall health status
- `/api/live` - Liveness probe
- `/api/ready` - Readiness probe
- `/api/metrics` - System metrics

✅ **Security**
- Security headers configured
- Non-root Docker user
- Multi-stage Docker builds
- Environment variable validation
- XSS and injection protection

✅ **Performance**
- Memory leak prevention
- Optimized client components
- Response compression
- Standalone output for Docker

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm package manager

### Development

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Run development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000)

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
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── health/        # Health check endpoint
│   │   │   ├── metrics/       # Metrics endpoint
│   │   │   ├── live/          # Liveness probe
│   │   │   ├── ready/         # Readiness probe
│   │   │   ├── test/          # Test endpoint
│   │   │   └── heavy-processing/ # Heavy processing endpoint
│   │   ├── components/        # React components
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   ├── error.tsx          # Error boundary
│   │   ├── loading.tsx        # Loading state
│   │   └── not-found.tsx      # 404 page
│   ├── lib/                   # Utility libraries
│   │   ├── logger.ts          # Structured logging
│   │   ├── errors.ts          # Custom error classes
│   │   ├── api-response.ts    # API response utilities
│   │   ├── rate-limiter.ts    # Rate limiting
│   │   ├── validation.ts      # Input validation
│   │   ├── request-utils.ts   # Request utilities
│   │   ├── env.ts             # Environment config
│   │   └── performance-monitor.ts # Performance monitoring
│   └── types/                 # TypeScript types
│       └── api.ts             # API type definitions
├── public/                    # Static assets
├── Dockerfile                 # Multi-stage Docker build
├── .dockerignore             # Docker ignore patterns
├── next.config.ts            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
├── .env.example              # Environment variables template
├── SECURITY.md               # Security guidelines
└── DEPLOYMENT.md             # Deployment guide
```

## API Endpoints

### Health & Monitoring
- `GET /api/health` - Health check with memory and process status
- `GET /api/live` - Liveness probe (returns 200 if alive)
- `GET /api/ready` - Readiness probe (returns 200 if ready)
- `GET /api/metrics` - System metrics (memory, CPU, uptime)

### Application
- `GET /api/test` - Test endpoint with safe error handling
- `GET /api/heavy-processing` - Heavy processing simulation
- `POST /api/heavy-processing` - Configurable heavy processing

## Environment Variables

See `.env.example` for all available configuration options:

```bash
NODE_ENV=development          # Environment (development/production/test)
PORT=3000                     # Server port
LOG_LEVEL=debug              # Logging level (debug/info/warn/error)
RATE_LIMIT_ENABLED=true      # Enable rate limiting
MAX_REQUEST_SIZE=10mb        # Maximum request body size
API_TIMEOUT_MS=30000         # API timeout in milliseconds
```

## Docker Deployment

Build and run with Docker:

```bash
# Build image
docker build -t nextjs-app:latest .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e RATE_LIMIT_ENABLED=true \
  nextjs-app:latest
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Security

This application implements multiple security best practices:
- Input validation and sanitization
- Rate limiting
- Security headers (HSTS, X-Frame-Options, etc.)
- Non-root Docker user
- Environment variable validation
- Safe error handling

See [SECURITY.md](./SECURITY.md) for complete security documentation.

## Monitoring

The application provides comprehensive monitoring capabilities:

1. **Health Checks**: Use `/api/health` for load balancer health checks
2. **Metrics**: Use `/api/metrics` for system metrics
3. **Logging**: Structured JSON logs for easy parsing
4. **Performance**: Built-in performance monitoring utilities

## Error Handling

All API endpoints use standardized error handling:
- Custom error classes for different error types
- Structured logging with context
- Safe error messages (no sensitive data)
- Proper HTTP status codes

## Rate Limiting

API endpoints are protected with configurable rate limiting:
- Heavy endpoints: 10 requests/minute
- Standard endpoints: 60 requests/minute
- Lenient endpoints: 100 requests/minute

## Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Run linting before committing

## License

MIT

## Support

For issues and questions:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Review [SECURITY.md](./SECURITY.md) for security guidelines
- Check health endpoints for system status
