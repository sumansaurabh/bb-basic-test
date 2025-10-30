# Next.js Application with Enhanced Reliability

A production-ready Next.js application with TypeScript, Tailwind CSS, and comprehensive reliability features.

## 🚀 Features

- ✅ **Error Handling**: Custom error classes and consistent error responses
- ✅ **Structured Logging**: Multi-level logging with contextual information
- ✅ **Rate Limiting**: Protection against API abuse
- ✅ **Request Validation**: Type-safe input validation
- ✅ **Health Checks**: Service health monitoring endpoint
- ✅ **Performance Monitoring**: Track and analyze operation performance
- ✅ **API Middleware**: Reusable middleware for timeouts, logging, and error handling
- ✅ **Security Headers**: OWASP-recommended security headers
- ✅ **Docker Support**: Multi-stage builds with security best practices

## Getting Started

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

## 📁 Project Structure

### Application
- `src/app/page.tsx` - Main page component
- `src/app/layout.tsx` - Root layout component
- `src/app/globals.css` - Global styles
- `src/app/api/` - API routes
  - `health/` - Health check endpoint
  - `test/` - Test endpoint with proper error handling
  - `heavy-processing/` - Example of rate-limited endpoint

### Reliability Libraries
- `src/lib/errors.ts` - Custom error classes and error handling
- `src/lib/logger.ts` - Structured logging system
- `src/lib/rate-limiter.ts` - Rate limiting utilities
- `src/lib/validation.ts` - Input validation utilities
- `src/lib/monitoring.ts` - Performance monitoring
- `src/lib/api-middleware.ts` - API middleware utilities
- `src/lib/config.ts` - Environment configuration

### Documentation
- `RELIABILITY.md` - Comprehensive reliability documentation
- `IMPROVEMENTS.md` - Summary of improvements made
- `.env.example` - Environment variable template

## 🔧 Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
API_TIMEOUT=30000
RATE_LIMIT_ENABLED=true
CORS_ORIGINS=http://localhost:3000
```

## 🏥 Health Check

Check service health:
```bash
curl http://localhost:3000/api/health
```

Response includes:
- Service status (healthy/degraded/unhealthy)
- Memory usage metrics
- Process information
- Uptime

## 🐳 Docker

### Build
```bash
docker build -t nextjs-app .
```

### Run
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  nextjs-app
```

### Health Check
The Docker image includes automatic health checks using the `/api/health` endpoint.

## 📚 Documentation

For detailed documentation on reliability features, see:
- **[RELIABILITY.md](./RELIABILITY.md)** - Complete guide to all reliability features
- **[IMPROVEMENTS.md](./IMPROVEMENTS.md)** - Summary of improvements and migration guide

## 🛡️ Security Features

- Custom error handling prevents information leakage
- Rate limiting protects against abuse
- Input validation prevents injection attacks
- Security headers (HSTS, X-Frame-Options, CSP, etc.)
- Non-root Docker user
- XSS prevention through input sanitization

## 📊 Monitoring

### Logging
All requests and errors are logged with context:
```typescript
import { logger } from '@/lib/logger';

logger.info('Operation completed', { userId, duration });
logger.error('Operation failed', error, { context });
```

### Performance Monitoring
Track operation performance:
```typescript
import { performanceMonitor } from '@/lib/monitoring';

await performanceMonitor.measure('operation', async () => {
  // Your code
});
```

## 🔒 API Protection

All API routes use middleware for:
- Request/response logging
- Rate limiting
- Timeout handling
- Error handling
- Request ID generation

Example:
```typescript
import { withMiddleware, MiddlewarePresets } from '@/lib/api-middleware';

const handler = async (request: NextRequest) => {
  // Your logic
};

export const GET = withMiddleware(handler, MiddlewarePresets.standard);
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Rate Limiting
```bash
# Should succeed
for i in {1..50}; do curl http://localhost:3000/api/test; done

# Should fail with 429
for i in {1..100}; do curl http://localhost:3000/api/test; done
```

## 📈 Production Deployment

### Environment Variables
Ensure all required environment variables are set:
- `NODE_ENV=production`
- `LOG_LEVEL=info`
- `API_TIMEOUT=30000`
- `RATE_LIMIT_ENABLED=true`

### Kubernetes
Example deployment with health checks:
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
```

## 🤝 Contributing

When adding new API routes:
1. Use middleware for protection
2. Validate all inputs
3. Add proper error handling
4. Include logging
5. Update documentation

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions:
1. Check [RELIABILITY.md](./RELIABILITY.md) for detailed documentation
2. Review error logs
3. Check `/api/health` endpoint
4. Review performance metrics
