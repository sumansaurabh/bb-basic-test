# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
pnpm dev
```

Visit: http://localhost:3000

## 🔍 Test the Improvements

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

### Heavy Processing (Rate Limited)
```bash
# GET request
curl http://localhost:3000/api/heavy-processing

# POST request with parameters
curl -X POST http://localhost:3000/api/heavy-processing \
  -H "Content-Type: application/json" \
  -d '{"iterations": 5000, "complexity": "medium"}'
```

## 🐳 Docker Quick Start

### Build and Run
```bash
# Build image
docker build -t nextjs-app .

# Run container
docker run -p 3000:3000 nextjs-app

# Check health
curl http://localhost:3000/api/health
```

## 📊 What's Been Improved?

### ✅ Fixed Issues
- Runtime errors from unsafe property access
- Memory leaks in client components
- Missing error handling
- No logging or monitoring
- Insecure Docker configuration

### ✅ Added Features
- Structured logging
- Rate limiting
- Input validation
- Health check endpoints
- Security headers
- Environment validation
- Performance monitoring utilities

## 📚 Documentation

- **[README.md](./README.md)** - Full documentation
- **[IMPROVEMENTS.md](./IMPROVEMENTS.md)** - Detailed improvement summary
- **[SECURITY.md](./SECURITY.md)** - Security measures
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide

## 🛠️ Available Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

## 🔑 Key Files

### Utilities
- `src/lib/logger.ts` - Logging
- `src/lib/errors.ts` - Error classes
- `src/lib/api-response.ts` - API responses
- `src/lib/rate-limiter.ts` - Rate limiting
- `src/lib/validation.ts` - Input validation

### API Endpoints
- `/api/health` - Health check
- `/api/ready` - Readiness probe
- `/api/metrics` - System metrics
- `/api/test` - Test endpoint
- `/api/heavy-processing` - Processing demo

## 💡 Tips

1. **Check logs**: All API calls are logged with structured JSON
2. **Rate limits**: Be aware of rate limits when testing
3. **Environment**: Use `.env.local` for local development
4. **Docker**: Use multi-stage build for production
5. **Monitoring**: Set up health check monitoring in production

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Build Errors
```bash
# Clean and reinstall
rm -rf node_modules .next
pnpm install
pnpm build
```

### Docker Issues
```bash
# Clean Docker cache
docker system prune -a
```

## 🎯 Next Steps

1. Review the [IMPROVEMENTS.md](./IMPROVEMENTS.md) for detailed changes
2. Check [SECURITY.md](./SECURITY.md) for security best practices
3. Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
4. Customize environment variables in `.env.local`
5. Add your own features using the established patterns

---

**Need Help?** Check the full documentation in [README.md](./README.md)
