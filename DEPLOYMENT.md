# Deployment Guide

## Prerequisites

- Node.js 18+ or Docker
- pnpm package manager
- Environment variables configured

## Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Configure environment variables:
```bash
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
RATE_LIMIT_ENABLED=true
API_TIMEOUT_MS=30000
```

## Local Development

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
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t nextjs-app:latest .
```

### Run Docker Container

```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e RATE_LIMIT_ENABLED=true \
  --name nextjs-app \
  nextjs-app:latest
```

### Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - RATE_LIMIT_ENABLED=true
      - LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Run with:
```bash
docker-compose up -d
```

## Kubernetes Deployment

### Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nextjs-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nextjs-app
  template:
    metadata:
      labels:
        app: nextjs-app
    spec:
      containers:
      - name: nextjs-app
        image: nextjs-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: RATE_LIMIT_ENABLED
          value: "true"
        livenessProbe:
          httpGet:
            path: /api/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: nextjs-app-service
spec:
  selector:
    app: nextjs-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Health Check Endpoints

The application provides several health check endpoints:

- `/api/health` - Overall health status
- `/api/live` - Liveness probe (for K8s)
- `/api/ready` - Readiness probe (for K8s)
- `/api/metrics` - System metrics

## Monitoring

### Prometheus Metrics (Future Enhancement)

Consider adding Prometheus metrics for:
- Request rate
- Response time
- Error rate
- Memory usage
- CPU usage

### Logging

Logs are output in JSON format for easy parsing by log aggregation tools:
- Structured logging with context
- Different log levels (debug, info, warn, error)
- Request/response logging

### Recommended Monitoring Tools

- **APM**: New Relic, Datadog, or Sentry
- **Logs**: ELK Stack, Splunk, or CloudWatch
- **Metrics**: Prometheus + Grafana
- **Uptime**: UptimeRobot, Pingdom

## Performance Optimization

### Production Checklist

- [ ] Enable compression (already configured)
- [ ] Configure CDN for static assets
- [ ] Enable HTTP/2
- [ ] Set up caching headers
- [ ] Optimize images (use Next.js Image component)
- [ ] Enable database connection pooling (if applicable)
- [ ] Configure load balancing
- [ ] Set up auto-scaling

### Resource Limits

Recommended resource allocation:
- **Memory**: 512MB - 1GB per instance
- **CPU**: 0.5 - 1 vCPU per instance
- **Disk**: 1GB minimum

## Security Considerations

See [SECURITY.md](./SECURITY.md) for detailed security guidelines.

Key points:
- Always use HTTPS in production
- Enable rate limiting
- Configure CORS properly
- Keep dependencies updated
- Regular security audits

## Troubleshooting

### High Memory Usage

Check `/api/metrics` endpoint for memory statistics. Consider:
- Increasing memory limits
- Reducing concurrent requests
- Implementing caching

### Slow Response Times

- Check `/api/health` for system status
- Review logs for errors
- Monitor CPU usage
- Consider horizontal scaling

### Container Won't Start

- Check logs: `docker logs <container-id>`
- Verify environment variables
- Ensure port 3000 is available
- Check health check configuration

## Rollback Strategy

1. Keep previous Docker images tagged
2. Use blue-green deployment
3. Implement canary releases
4. Have database migration rollback plan

## Support

For issues and questions:
- Check logs first
- Review health check endpoints
- Consult documentation
- Contact maintainers
