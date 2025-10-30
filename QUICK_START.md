# Quick Start Guide

## Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
```

## Development

```bash
# Start development server
pnpm dev

# Open browser
# http://localhost:3000
```

## Testing Endpoints

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Metrics
```bash
curl http://localhost:3000/api/metrics
```

### Test Endpoint (Fixed)
```bash
curl http://localhost:3000/api/test
```

### Heavy Processing (with Rate Limiting)
```bash
# GET request
curl http://localhost:3000/api/heavy-processing

# POST request with validation
curl -X POST http://localhost:3000/api/heavy-processing \
  -H "Content-Type: application/json" \
  -d '{"iterations": 5000, "complexity": "medium"}'
```

## Build & Deploy

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## Docker

```bash
# Build image
docker build -t nextjs-app .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  nextjs-app

# Check health
docker ps  # Look at HEALTH column
```

## Environment Variables

```bash
# Development
NODE_ENV=development
LOG_LEVEL=debug
PORT=3000

# Production
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
RATE_LIMIT_ENABLED=true
```

## Monitoring

### Check Application Health
```bash
# Should return 200 OK with health status
curl -i http://localhost:3000/api/health
```

### View Performance Metrics
```bash
# Returns detailed metrics
curl http://localhost:3000/api/metrics | jq
```

### Watch Logs
```bash
# Development - pretty printed
pnpm dev

# Production - JSON format
pnpm start
```

## Common Issues

### Rate Limited
**Error**: 429 Too Many Requests  
**Solution**: Wait for rate limit window to reset or adjust `RATE_LIMIT_MAX_REQUESTS`

### Build Errors
**Error**: TypeScript or ESLint errors  
**Solution**: Run `pnpm lint` to see specific issues

### Memory Issues
**Error**: High memory usage  
**Solution**: Check `/api/metrics` and review memory-intensive operations

## Documentation

- **Full Documentation**: See [RELIABILITY.md](./RELIABILITY.md)
- **Improvements Summary**: See [IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md)
- **Main README**: See [README.md](./README.md)

## Support

For detailed information about any feature, refer to the comprehensive documentation in `RELIABILITY.md`.
