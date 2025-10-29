# Next.js Application with Enhanced Reliability

A production-ready Next.js application with TypeScript, Tailwind CSS, and comprehensive reliability improvements including error handling, logging, rate limiting, and monitoring.

## 🚀 Features

- ✅ **Error Handling**: Structured error handling with custom error classes
- ✅ **Logging**: Comprehensive structured logging system
- ✅ **Rate Limiting**: API endpoint protection with configurable limits
- ✅ **Input Validation**: Type-safe request validation and sanitization
- ✅ **Health Checks**: Multiple health check endpoints for monitoring
- ✅ **Security**: HTTP security headers, Docker security, non-root user
- ✅ **Performance**: Memory leak fixes, performance monitoring utilities
- ✅ **Type Safety**: Full TypeScript coverage with strict mode
- ✅ **Docker**: Multi-stage builds with health checks

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

## 🛠️ Getting Started

### Installation

```bash
# Install dependencies
pnpm install
```

### Environment Setup

Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration.

### Development

Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

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

## 📁 Project Structure

```
├── src/
│   ├── app/                      # Next.js app directory
│   │   ├── api/                  # API routes
│   │   │   ├── health/           # Health check endpoint
│   │   │   ├── metrics/          # Metrics endpoint
│   │   │   ├── ready/            # Readiness probe
│   │   │   ├── test/             # Test endpoint
│   │   │   └── heavy-processing/ # Heavy processing endpoint
│   │   ├── components/           # React components
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   ├── error.tsx             # Error boundary
│   │   ├── loading.tsx           # Loading state
│   │   └── not-found.tsx         # 404 page
│   ├── lib/                      # Utility libraries
│   │   ├── logger.ts             # Structured logging
│   │   ├── errors.ts             # Custom error classes
│   │   ├── rate-limiter.ts       # Rate limiting
│   │   ├── validation.ts         # Input validation
│   │   ├── config.ts             # Environment config
│   │   └── performance.ts        # Performance utilities
│   └── types/                    # TypeScript types
│       └── api.ts                # API type definitions
├── public/                       # Static assets
├── Dockerfile                    # Multi-stage Docker build
├── .dockerignore                 # Docker ignore patterns
├── .env.example                  # Environment variables template
├── SECURITY.md                   # Security documentation
└── IMPROVEMENTS.md               # Detailed improvements log
```

## 🔌 API Endpoints

### Health & Monitoring

- `GET /api/health` - Basic health check
- `GET /api/metrics` - Detailed performance metrics
- `GET /api/ready` - Readiness probe for orchestration

### Application

- `GET /api/test` - Test endpoint with safe error handling
- `GET /api/heavy-processing` - Heavy computation (rate limited: 10/min)
- `POST /api/heavy-processing` - Custom heavy processing (rate limited: 5/min)

### Rate Limiting

All API endpoints include rate limit headers:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests in window
- `X-RateLimit-Reset` - Timestamp when limit resets

## 🐳 Docker

### Build

```bash
docker build -t nextjs-app .
```

### Run

```bash
docker run -p 3000:3000 nextjs-app
```

### Health Check

```bash
docker inspect --format='{{.State.Health.Status}}' <container-id>
```

## 🔒 Security

This application implements multiple security measures:

- HTTP security headers (HSTS, X-Frame-Options, CSP, etc.)
- Input validation and sanitization
- Rate limiting on API endpoints
- Non-root Docker user
- Environment variable validation
- Structured error handling (no sensitive data exposure)

See [SECURITY.md](SECURITY.md) for detailed security information.

## 📊 Monitoring

### Health Checks

```bash
# Basic health
curl http://localhost:3000/api/health

# Detailed metrics
curl http://localhost:3000/api/metrics

# Readiness
curl http://localhost:3000/api/ready
```

### Key Metrics

- Memory usage (heap, RSS)
- CPU usage
- Uptime
- Process information
- Response times

## 🧪 Testing

```bash
# Lint code
pnpm lint

# Build for production
pnpm build

# Run production build
pnpm start
```

## 📚 Documentation

- [IMPROVEMENTS.md](IMPROVEMENTS.md) - Detailed list of improvements made
- [SECURITY.md](SECURITY.md) - Security policies and best practices
- [.env.example](.env.example) - Environment variable documentation

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available configuration options:

- `NODE_ENV` - Environment (development/production/test)
- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window
- `CORS_ORIGINS` - Allowed CORS origins
- `TRUST_PROXY` - Trust proxy headers (true/false)

## 🚀 Production Deployment

### Recommendations

1. **Environment**: Use production environment variables
2. **HTTPS**: Enable TLS/SSL certificates
3. **Reverse Proxy**: Use nginx or cloud load balancer
4. **Monitoring**: Set up APM (Datadog, New Relic, Sentry)
5. **Caching**: Implement Redis for rate limiting
6. **CDN**: Serve static assets via CDN
7. **Backups**: Regular backups and disaster recovery plan

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker Deployment

```bash
# Build
docker build -t nextjs-app .

# Run with environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  nextjs-app
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🐛 Bug Reports

For bug reports and feature requests, please create an issue on GitHub.
