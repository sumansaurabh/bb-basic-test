# Production Deployment Checklist

Use this checklist before deploying to production.

## ✅ Pre-Deployment Checks

### Code Quality
- [x] All ESLint warnings resolved
- [x] TypeScript compilation successful
- [x] Production build successful (`pnpm build`)
- [x] No console errors in browser
- [x] All tests passing (if applicable)

### Security
- [ ] Environment variables configured (copy from `.env.example`)
- [ ] Secrets not committed to version control
- [ ] HTTPS/TLS certificates configured
- [ ] Security headers verified
- [ ] Rate limits configured appropriately
- [ ] CORS origins configured (not using `*` in production)
- [ ] Authentication/authorization implemented (if needed)

### Configuration
- [ ] `NODE_ENV=production` set
- [ ] `LOG_LEVEL` set appropriately (info or warn)
- [ ] Rate limit values reviewed and adjusted
- [ ] Port configuration verified
- [ ] Database connection strings configured (if applicable)
- [ ] External API keys configured (if applicable)

### Monitoring
- [ ] Health check endpoint accessible (`/api/health`)
- [ ] Metrics endpoint accessible (`/api/metrics`)
- [ ] Readiness probe configured (`/api/ready`)
- [ ] Logging destination configured (stdout, file, service)
- [ ] Error tracking service configured (Sentry, etc.)
- [ ] APM configured (Datadog, New Relic, etc.)
- [ ] Alerts configured for critical metrics

### Infrastructure
- [ ] Load balancer configured
- [ ] Auto-scaling configured (if needed)
- [ ] Backup strategy in place
- [ ] Disaster recovery plan documented
- [ ] CDN configured for static assets
- [ ] Database backups automated (if applicable)

### Docker (if using)
- [ ] Docker image built successfully
- [ ] Image scanned for vulnerabilities
- [ ] Health check working in container
- [ ] Non-root user verified
- [ ] Resource limits configured (CPU, memory)
- [ ] Container registry configured

### Performance
- [ ] Load testing completed
- [ ] Performance benchmarks met
- [ ] Memory leaks verified as fixed
- [ ] Database queries optimized (if applicable)
- [ ] Caching strategy implemented
- [ ] Static assets optimized

### Documentation
- [x] README.md updated
- [x] SECURITY.md reviewed
- [x] IMPROVEMENTS.md reviewed
- [ ] API documentation updated
- [ ] Deployment procedures documented
- [ ] Rollback procedures documented

## 🚀 Deployment Steps

### 1. Pre-Deployment
```bash
# Pull latest code
git pull origin main

# Install dependencies
pnpm install

# Run linting
pnpm lint

# Build for production
pnpm build

# Test production build locally
pnpm start
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env.production

# Edit with production values
nano .env.production

# Verify configuration
node -e "require('./src/lib/config').config && console.log('✓ Config valid')"
```

### 3. Docker Deployment (if applicable)
```bash
# Build image
docker build -t nextjs-app:latest .

# Tag for registry
docker tag nextjs-app:latest registry.example.com/nextjs-app:latest

# Push to registry
docker push registry.example.com/nextjs-app:latest

# Deploy
docker run -d \
  --name nextjs-app \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  registry.example.com/nextjs-app:latest

# Verify health
curl http://localhost:3000/api/health
```

### 4. Vercel Deployment (if applicable)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Verify deployment
curl https://your-domain.vercel.app/api/health
```

### 5. Post-Deployment Verification
```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Check metrics endpoint
curl https://your-domain.com/api/metrics

# Check readiness
curl https://your-domain.com/api/ready

# Test rate limiting
for i in {1..15}; do curl https://your-domain.com/api/heavy-processing; done

# Check logs
docker logs nextjs-app  # or your logging service
```

## 🔍 Post-Deployment Monitoring

### First 24 Hours
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify health checks passing
- [ ] Monitor memory usage
- [ ] Check rate limit effectiveness
- [ ] Review logs for anomalies

### First Week
- [ ] Review performance metrics
- [ ] Analyze user feedback
- [ ] Check for memory leaks
- [ ] Verify backup procedures
- [ ] Review security logs
- [ ] Optimize based on real traffic

## 🚨 Rollback Procedure

If issues are detected:

### Quick Rollback
```bash
# Docker
docker stop nextjs-app
docker run -d --name nextjs-app-old [previous-image]

# Vercel
vercel rollback
```

### Full Rollback
```bash
# Revert code
git revert HEAD
git push origin main

# Rebuild and redeploy
pnpm build
# ... deploy steps
```

## 📊 Success Criteria

Deployment is successful when:
- [ ] Health check returns 200 OK
- [ ] Response times < 500ms (p95)
- [ ] Error rate < 0.1%
- [ ] Memory usage stable
- [ ] No critical errors in logs
- [ ] All features working as expected

## 🆘 Emergency Contacts

- **On-Call Engineer**: [Contact Info]
- **DevOps Team**: [Contact Info]
- **Security Team**: [Contact Info]

## 📝 Deployment Log

| Date | Version | Deployed By | Status | Notes |
|------|---------|-------------|--------|-------|
| YYYY-MM-DD | v1.0.0 | Name | ✅ | Initial deployment |

---

**Remember**: Always test in staging before production!
