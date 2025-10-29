# Next.js Application with Production-Ready Features

A robust Next.js application with TypeScript, Tailwind CSS, and comprehensive production features including error handling, logging, rate limiting, and monitoring.

## 🚀 Features

- ✅ **TypeScript** - Full type safety
- ✅ **Tailwind CSS** - Modern styling
- ✅ **Error Handling** - Comprehensive error management with custom error classes
- ✅ **Structured Logging** - JSON-based logging for production
- ✅ **Rate Limiting** - API endpoint protection
- ✅ **Input Validation** - Request validation and sanitization
- ✅ **Health Checks** - Kubernetes-ready health and readiness probes
- ✅ **Monitoring** - Performance metrics endpoints
- ✅ **Security Headers** - OWASP recommended security headers
- ✅ **Docker Support** - Multi-stage builds with non-root user
- ✅ **Environment Validation** - Type-safe environment configuration

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Docker (optional, for containerized deployment)

## 🛠️ Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
```

### Development

```bash
# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

```bash
# Create production build
pnpm build

# Start production server
pnpm start
```

### Linting

```bash
# Run ESLint
pnpm lint
```

## 📁 Project Structure

```
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── health/        # Health check endpoint
│   │   │   ├── metrics/       # Metrics endpoint
│   │   │   ├── ready/         # Readiness probe
│   │   │   ├── test/          # Test endpoint
│   │   │   └── heavy-processing/ # Heavy processing demo
│   │   ├── components/        # React components
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   ├── error.tsx          # Error boundary
│   │   ├── loading.tsx        # Loading state
│   │   └── not-found.tsx      # 404 page
│   ├── lib/                   # Utility libraries
│   │   ├── api-response.ts    # Standardized API responses
│   │   ├── errors.ts          # Custom error classes
│   │   ├── logger.ts          # Structured logging
│   │   ├── rate-limiter.ts    # Rate limiting
│   │   ├── validation.ts      # Input validation
│   │   ├── request-utils.ts   # Request utilities
│   │   ├── env.ts             # Environment config
│   │   └── performance.ts     # Performance monitoring
│   └── types/                 # TypeScript types
│       └── api.ts             # API type definitions
├── public/                    # Static assets
├── .env.example              # Environment variables template
├── Dockerfile                # Multi-stage Docker build
├── .dockerignore            # Docker ignore patterns
├── SECURITY.md              # Security documentation
└── DEPLOYMENT.md            # Deployment guide
```

## 🔌 API Endpoints

### Health & Monitoring

- **GET `/api/health`** - Health check endpoint
  - Returns: Server health status, uptime, memory usage
  - Use: Liveness probe for Kubernetes

- **GET `/api/ready`** - Readiness check endpoint
  - Returns: Application readiness status
  - Use: Readiness probe for Kubernetes

- **GET `/api/metrics`** - System metrics endpoint
  - Returns: Detailed system metrics (CPU, memory, etc.)
  - Rate limited: 60 requests/minute

### Application Endpoints

- **GET `/api/test`** - Test endpoint with safe error handling
  - Returns: Sample data with proper null safety

- **GET `/api/heavy-processing`** - Heavy computation demo
  - Returns: Processing results with performance metrics
  - Rate limited: 60 requests/minute

- **POST `/api/heavy-processing`** - Custom heavy computation
  - Body: `{ iterations?: number, complexity?: 'light' | 'medium' | 'heavy' }`
  - Rate limited: 10 requests/minute

## 🔒 Security Features

### Input Validation
All API endpoints validate and sanitize user input using the validation utilities in `src/lib/validation.ts`.

### Rate Limiting
API endpoints are protected with configurable rate limits:
- **Strict**: 10 requests/minute (POST endpoints)
- **Moderate**: 60 requests/minute (GET endpoints)
- **Lenient**: 300 requests/minute (public endpoints)

### Security Headers
The application sets the following security headers:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS)
- `Referrer-Policy: origin-when-cross-origin`

### Error Handling
- Structured error responses
- No sensitive information in production errors
- Comprehensive error logging

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t nextjs-app:latest .
```

### Run Container

```bash
docker run -d \
  --name nextjs-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  nextjs-app:latest
```

### Docker Features
- Multi-stage build for optimized image size
- Non-root user for security
- Health checks included
- Alpine-based for minimal footprint

## 📊 Monitoring

### Health Checks

```bash
# Check application health
curl http://localhost:3000/api/health

# Check readiness
curl http://localhost:3000/api/ready

# Get detailed metrics
curl http://localhost:3000/api/metrics
```

### Logging

The application uses structured JSON logging. Logs include:
- Timestamp
- Log level (debug, info, warn, error)
- Message
- Context data
- Error details (when applicable)

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available configuration options:

- `NODE_ENV` - Environment (development/production/test)
- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `RATE_LIMIT_ENABLED` - Enable/disable rate limiting
- `TIMEOUT_MS` - Request timeout in milliseconds

## 📚 Additional Documentation

- [Security Policy](./SECURITY.md) - Security measures and best practices
- [Deployment Guide](./DEPLOYMENT.md) - Detailed deployment instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check the [Deployment Guide](./DEPLOYMENT.md)
- Review [Security Policy](./SECURITY.md)
- Open an issue on GitHub
