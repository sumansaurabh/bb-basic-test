# Deployment Guide

## Prerequisites

- Node.js 18+ and pnpm installed
- Docker (for containerized deployment)
- Environment variables configured

## Local Development

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Run development server:**
   ```bash
   pnpm dev
   ```

4. **Access the application:**
   - Main app: http://localhost:3000
   - Health check: http://localhost:3000/api/health
   - Metrics: http://localhost:3000/api/metrics

## Production Build

1. **Build the application:**
   ```bash
   pnpm build
   ```

2. **Start production server:**
   ```bash
   pnpm start
   ```

## Docker Deployment

### Build Docker Image

```bash
docker build -t nextjs-app:latest .
```

### Run Docker Container

```bash
docker run -d \
  --name nextjs-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  --restart unless-stopped \
  nextjs-app:latest
```

### Docker Compose (Optional)

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
      - PORT=3000
      - RATE_LIMIT_ENABLED=true
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
        - name: PORT
          value: "3000"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
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

## Vercel Deployment

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard**

## Health Checks

The application provides several endpoints for monitoring:

- **`/api/health`**: Basic health check (liveness probe)
- **`/api/ready`**: Readiness check (readiness probe)
- **`/api/metrics`**: Detailed system metrics

## Monitoring

### Recommended Monitoring Setup

1. **Application Performance Monitoring (APM)**
   - New Relic
   - Datadog
   - Sentry

2. **Log Aggregation**
   - ELK Stack (Elasticsearch, Logstash, Kibana)
   - Splunk
   - CloudWatch (AWS)

3. **Metrics Collection**
   - Prometheus + Grafana
   - CloudWatch
   - Datadog

### Key Metrics to Monitor

- Response times
- Error rates
- Memory usage
- CPU usage
- Request rate
- Rate limit hits

## Scaling Considerations

1. **Horizontal Scaling**: Add more instances behind a load balancer
2. **Vertical Scaling**: Increase container resources
3. **Caching**: Implement Redis for session/data caching
4. **CDN**: Use CDN for static assets
5. **Database**: Use connection pooling and read replicas

## Troubleshooting

### High Memory Usage
- Check for memory leaks in client components
- Review rate limiting configuration
- Monitor heavy processing endpoints

### Slow Response Times
- Check database query performance
- Review API endpoint complexity
- Enable caching where appropriate

### Container Won't Start
- Verify environment variables
- Check Docker logs: `docker logs nextjs-app`
- Ensure port 3000 is available

## Rollback Strategy

1. **Docker**: Keep previous image tags
   ```bash
   docker tag nextjs-app:latest nextjs-app:backup
   docker pull nextjs-app:previous-version
   docker run nextjs-app:previous-version
   ```

2. **Kubernetes**: Use rollout undo
   ```bash
   kubectl rollout undo deployment/nextjs-app
   ```

3. **Vercel**: Use deployment history in dashboard
