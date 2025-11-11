# Quick Reference Guide

## API Endpoints

### Health Check
```bash
curl http://localhost:3000/api/health
```
**Response:**
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2025-11-11T08:00:00.000Z",
  "uptime": 123,
  "checks": {
    "memory": { "status": "ok", "used": 162, "total": 189, "percentage": 85.65 },
    "process": { "status": "ok", "pid": 12345, "uptime": 123 }
  }
}
```

### Metrics
```bash
curl http://localhost:3000/api/metrics
```
**Response:**
```json
{
  "timestamp": "2025-11-11T08:00:00.000Z",
  "system": { "platform": "linux", "nodeVersion": "v22.14.0", "uptime": 123 },
  "memory": { "rss": 476, "heapTotal": 186, "heapUsed": 162 },
  "cpu": { "user": 9597, "system": 582 }
}
```

### Test Endpoint
```bash
curl http://localhost:3000/api/test
```

### Heavy Processing (GET)
```bash
curl http://localhost:3000/api/heavy-processing
```

### Heavy Processing (POST)
```bash
curl -X POST http://localhost:3000/api/heavy-processing \
  -H "Content-Type: application/json" \
  -d '{"iterations": 1000, "complexity": "medium"}'
```

**Parameters:**
- `iterations`: 1-50000 (default: 1000)
- `complexity`: "light" | "medium" | "heavy" (default: "medium")

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/heavy-processing` | 10 req | 1 min |
| `/api/test` | 100 req | 1 min |
| `/api/health` | 1000 req | 1 min |
| `/api/metrics` | 1000 req | 1 min |

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Type checking
npx tsc --noEmit
```

## Docker Commands

```bash
# Build image
docker build -t nextjs-app .

# Run container
docker run -p 3000:3000 nextjs-app

# Check health
docker ps --filter health=healthy
```

## Environment Variables

```bash
NODE_ENV=production          # Environment mode
PORT=3000                    # Server port
LOG_LEVEL=info              # Logging level (debug|info|warn|error)
API_TIMEOUT=30000           # API timeout in milliseconds
MAX_REQUEST_SIZE=10mb       # Max request body size
ENABLE_RATE_LIMIT=true      # Enable/disable rate limiting
```

## Monitoring

### Check Server Health
```bash
curl http://localhost:3000/api/health
```

### View Metrics
```bash
curl http://localhost:3000/api/metrics
```

### Check Rate Limit Headers
```bash
curl -I http://localhost:3000/api/heavy-processing
# Look for: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
```

### View Logs
Logs are structured JSON with format:
```
[timestamp] [level] message | context
```

Example:
```
[2025-11-11T08:00:00.000Z] [INFO] GET /api/health | {"type":"request","requestId":"..."}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Invalid input | 400 |
| `NOT_FOUND` | Resource not found | 404 |
| `RATE_LIMIT` | Too many requests | 429 |
| `TIMEOUT` | Request timeout | 504 |
| `INTERNAL_ERROR` | Server error | 500 |

## Common Issues

### Rate Limited
**Error:** `{"success":false,"error":{"code":"RATE_LIMIT",...}}`  
**Solution:** Wait for the time specified in `Retry-After` header

### Validation Error
**Error:** `{"success":false,"error":{"code":"VALIDATION_ERROR",...}}`  
**Solution:** Check the error message for details on invalid input

### Timeout
**Error:** `{"success":false,"error":{"code":"TIMEOUT",...}}`  
**Solution:** Reduce iterations or complexity for heavy processing

## File Structure

```
src/
├── lib/                      # Utility modules
│   ├── logger.ts            # Structured logging
│   ├── validation.ts        # Input validation
│   ├── error-handler.ts     # Error handling
│   ├── rate-limiter.ts      # Rate limiting
│   ├── api-middleware.ts    # API middleware
│   ├── env.ts              # Environment validation
│   └── shutdown.ts         # Graceful shutdown
├── app/
│   ├── api/                # API routes
│   │   ├── health/         # Health check
│   │   ├── metrics/        # Metrics
│   │   ├── test/           # Test endpoint
│   │   └── heavy-processing/ # Heavy processing
│   ├── components/         # React components
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
└── instrumentation.ts      # Server initialization
```

## Security Headers

All responses include:
- `Strict-Transport-Security`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`

API responses also include:
- `X-Request-Id` - Unique request identifier
- `X-Response-Time` - Response time in milliseconds
- `X-RateLimit-*` - Rate limit information

## Troubleshooting

### Server won't start
1. Check port 3000 is available: `lsof -i :3000`
2. Check environment variables are set
3. Check logs for errors

### High memory usage
1. Check `/api/health` for memory status
2. Check `/api/metrics` for detailed memory info
3. Review client-side components for memory leaks

### Rate limiting issues
1. Check `X-RateLimit-*` headers in response
2. Wait for rate limit window to reset
3. Adjust rate limits in `src/lib/rate-limiter.ts` if needed

### Build failures
1. Run `pnpm lint` to check for linting errors
2. Run `npx tsc --noEmit` to check for type errors
3. Check Node version matches package.json (20+)

## Support

For issues or questions:
1. Check logs for error details
2. Review `IMPROVEMENTS.md` for detailed documentation
3. Check `HEALTH_CHECK_SUMMARY.md` for testing results
