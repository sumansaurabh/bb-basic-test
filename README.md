# Next.js Load Testing Application

A Next.js application with TypeScript, Tailwind CSS, and comprehensive error handling, logging, and monitoring capabilities.

## 🚀 Features

- ✅ **Comprehensive Error Handling** - Try-catch blocks, error boundaries, and graceful degradation
- 📊 **Structured Logging** - Winston-based logging with multiple log levels
- 🔒 **Security Middleware** - Rate limiting, CORS, and security headers
- 🏥 **Health Checks** - `/api/health` and `/api/metrics` endpoints
- ⚡ **Request Timeouts** - Automatic timeout protection for long-running operations
- 🛡️ **Input Validation** - Zod-based schema validation
- 🐳 **Docker Support** - Multi-stage builds with health checks
- 🔄 **Memory Leak Prevention** - Proper cleanup in React components

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

## 🛠️ Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=100
REQUEST_TIMEOUT_MS=30000
```

### 3. Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Build

Create a production build:

```bash
pnpm build
```

### 5. Production

Start the production server:

```bash
pnpm start
```

### 6. Linting

Run ESLint:

```bash
pnpm lint
```

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/          # Health check endpoint
│   │   │   ├── metrics/         # Metrics endpoint
│   │   │   ├── test/            # Test endpoint
│   │   │   └── heavy-processing/ # Heavy processing endpoint
│   │   ├── components/
│   │   │   ├── ClientHeavyComponents.tsx
│   │   │   ├── ServerSideContent.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   └── not-found.tsx
│   ├── lib/
│   │   ├── logger.ts           # Winston logging utility
│   │   ├── config.ts           # Environment configuration
│   │   └── validation.ts       # Zod validation schemas
│   └── middleware.ts           # Rate limiting & security
├── public/                     # Static assets
├── Dockerfile                  # Multi-stage Docker build
├── .env.example               # Environment variables template
└── README.md

```

## 🔌 API Endpoints

### Health Check
```bash
GET /api/health
```

Returns service health status, memory usage, and uptime.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T12:00:00.000Z",
  "uptime": 123.45,
  "memory": {
    "heapUsedMB": 45,
    "heapTotalMB": 100
  }
}
```

### Metrics
```bash
GET /api/metrics
```

Returns detailed performance metrics.

### Test Endpoint
```bash
GET /api/test
```

Simple test endpoint with error handling.

### Heavy Processing
```bash
GET /api/heavy-processing
POST /api/heavy-processing
```

**POST Body:**
```json
{
  "iterations": 1000,
  "complexity": "medium"
}
```

Complexity options: `light`, `medium`, `heavy`

## 🔒 Security Features

### Rate Limiting
- Default: 100 requests per minute per client
- Configurable via environment variables
- Returns `429 Too Many Requests` when exceeded

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`
- `Referrer-Policy`

### CORS
- Configurable origins
- Supports preflight requests

## 📊 Logging

Structured logging with Winston:

```typescript
import { logInfo, logError, logWarn } from '@/lib/logger';

logInfo('Operation completed', { userId: 123 });
logError('Operation failed', { error: err.message });
```

Log levels: `error`, `warn`, `info`, `http`, `debug`

## 🐳 Docker

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
The Docker container includes automatic health checks via `/api/health`.

## 🧪 Testing

### Manual API Testing

Test health endpoint:
```bash
curl http://localhost:3000/api/health
```

Test with rate limiting:
```bash
for i in {1..110}; do curl http://localhost:3000/api/test; done
```

Test heavy processing:
```bash
curl -X POST http://localhost:3000/api/heavy-processing \
  -H "Content-Type: application/json" \
  -d '{"iterations": 5000, "complexity": "heavy"}'
```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |
| `LOG_LEVEL` | `info` | Logging level |
| `RATE_LIMIT_ENABLED` | `true` | Enable rate limiting |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window (ms) |
| `REQUEST_TIMEOUT_MS` | `30000` | Request timeout (ms) |
| `MAX_ITERATIONS` | `50000` | Max processing iterations |
| `CORS_ORIGIN` | `*` | CORS allowed origins |

## 🐛 Troubleshooting

### Memory Issues
Check memory usage:
```bash
curl http://localhost:3000/api/metrics
```

### Rate Limiting
If you're being rate limited, wait for the reset time indicated in the response headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

### Timeout Errors
Reduce iterations or complexity in heavy processing requests, or increase `REQUEST_TIMEOUT_MS`.

## 📝 Error Handling Patterns

### API Routes
All API routes include:
- Try-catch blocks
- Input validation
- Timeout protection
- Structured error responses

### Client Components
- Error boundaries for graceful error handling
- Proper cleanup in useEffect hooks
- Memory leak prevention

## 🚀 Performance Optimization

- Multi-stage Docker builds for smaller images
- Standalone output for optimized production builds
- Request timeouts to prevent hanging
- Rate limiting to prevent abuse
- Memory usage monitoring

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
