# Next.js Application with Enterprise Reliability Features

A production-ready Next.js application with TypeScript, Tailwind CSS, and comprehensive reliability features including error handling, logging, monitoring, and rate limiting.

## Features

✅ **Error Handling** - Custom error classes and consistent error responses  
✅ **Structured Logging** - Multi-level logging with context support  
✅ **Rate Limiting** - Protect APIs from abuse  
✅ **Request Validation** - Input validation and sanitization  
✅ **Performance Monitoring** - Track operation metrics  
✅ **Health Checks** - Service health monitoring  
✅ **Security Headers** - OWASP recommended headers  
✅ **Docker Support** - Multi-stage builds with health checks  
✅ **Environment Validation** - Configuration validation on startup  

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

## API Endpoints

### Health & Monitoring

- `GET /api/health` - Service health check
- `GET /api/metrics` - Performance metrics

### Application APIs

- `GET /api/test` - Test endpoint with error handling
- `GET /api/heavy-processing` - Heavy processing endpoint
- `POST /api/heavy-processing` - Heavy processing with parameters

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
│   └── globals.css       # Global styles
├── lib/                  # Utility libraries
│   ├── errors.ts         # Error handling
│   ├── logger.ts         # Structured logging
│   ├── rate-limiter.ts   # Rate limiting
│   ├── validation.ts     # Request validation
│   ├── monitoring.ts     # Performance monitoring
│   ├── config.ts         # Configuration management
│   └── api-wrapper.ts    # API utilities
└── middleware.ts         # Global middleware
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

The container includes automatic health checks via `/api/health`.

## Documentation

For detailed documentation on reliability features, see [RELIABILITY.md](./RELIABILITY.md).

Topics covered:
- Error Handling
- Logging
- Rate Limiting
- Request Validation
- Monitoring
- Health Checks
- Configuration
- Docker & Deployment
- API Best Practices
- Security Considerations

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `RATE_LIMIT_ENABLED` - Enable rate limiting
- `API_TIMEOUT` - API timeout in milliseconds

## Testing

### Test Health Check

```bash
curl http://localhost:3000/api/health
```

### Test Metrics

```bash
curl http://localhost:3000/api/metrics
```

### Test Rate Limiting

```bash
# Make multiple rapid requests
for i in {1..100}; do
  curl http://localhost:3000/api/heavy-processing
done
```

## Security

This application implements several security best practices:

- Security headers (HSTS, X-Frame-Options, etc.)
- Input validation and sanitization
- Rate limiting to prevent abuse
- Non-root Docker user
- Environment variable validation
- CORS configuration

## Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Ensure all checks pass (`pnpm lint`, `pnpm build`)

## License

MIT

## Support

For issues or questions, please check:
1. [RELIABILITY.md](./RELIABILITY.md) for detailed documentation
2. Application logs for error details
3. `/api/health` endpoint for service status
