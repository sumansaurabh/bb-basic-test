# Cloud Run Error Fixes

## 🔍 Issues Identified

Based on the error logs from Cloud Run service `bb-1`:

1. **Memory Limit Exceeded** (Error 1)
   - Service was using 512 MiB out of 512 MiB limit
   - Caused OOM (Out of Memory) kills

2. **Signal Crashes** (Errors 2-4)
   - SIGPIPE (signal 13): Broken pipe errors when writing to closed connections
   - SIGSEGV (signal 11): Segmentation fault due to memory pressure

## ✅ Fixes Applied

### 1. Increased Memory Limit

**File: `cloudrun.yaml`**
- Increased memory from 512Mi to **1Gi (1024Mi)**
- Added proper resource limits and CPU allocation
- Configured health checks and startup probes

### 2. Optimized Node.js Memory Usage

**File: `Dockerfile`**
- Set `NODE_OPTIONS="--max-old-space-size=460"` for runtime (leaves ~50MB for system)
- Used higher limit during build: `--max-old-space-size=920`
- Pruned dev dependencies after build to reduce memory footprint
- Set `NODE_ENV=production` for optimizations

### 3. Next.js Production Optimizations

**File: `next.config.ts`**
- Enabled `output: 'standalone'` for smaller Docker images
- Added `compress: true` for response compression
- Optimized package imports to reduce bundle size
- Configured image optimization with AVIF/WebP support

### 4. Graceful Shutdown Handling

**File: `server.js`**
- Created wrapper script to handle signals properly
- Catches SIGTERM, SIGINT for graceful shutdown
- Ignores SIGPIPE instead of crashing
- Handles uncaught exceptions and promise rejections
- 10-second graceful shutdown timeout

## 🚀 Deployment Instructions

### Option 1: Using gcloud CLI with YAML

```bash
# Deploy with the new configuration
gcloud run services replace cloudrun.yaml \
  --region=europe-west1 \
  --project=penify-prod
```

### Option 2: Update Existing Service

```bash
# Update memory limit
gcloud run services update bb-1 \
  --memory=1Gi \
  --cpu=1 \
  --region=europe-west1 \
  --project=penify-prod
```

### Option 3: Deploy New Container

```bash
# Build the optimized Docker image
docker build -t gcr.io/penify-prod/bb-1:latest .

# Push to Google Container Registry
docker push gcr.io/penify-prod/bb-1:latest

# Deploy to Cloud Run
gcloud run deploy bb-1 \
  --image=gcr.io/penify-prod/bb-1:latest \
  --memory=1Gi \
  --cpu=1 \
  --region=europe-west1 \
  --project=penify-prod \
  --platform=managed \
  --allow-unauthenticated
```

## 📊 Expected Results

After applying these fixes:

✅ **No more OOM errors** - 1Gi memory provides adequate headroom  
✅ **No more SIGPIPE crashes** - Signals are handled gracefully  
✅ **No more SIGSEGV crashes** - Memory pressure eliminated  
✅ **Faster cold starts** - Standalone output reduces image size  
✅ **Better performance** - Production optimizations enabled  

## 🔍 Monitoring

After deployment, monitor the service:

```bash
# Check service status
gcloud run services describe bb-1 \
  --region=europe-west1 \
  --project=penify-prod

# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bb-1" \
  --limit=50 \
  --project=penify-prod \
  --format=json

# Check for errors
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bb-1 AND severity>=ERROR" \
  --limit=20 \
  --project=penify-prod
```

## 📈 Memory Usage Breakdown

With 1Gi (1024Mi) allocation:

- **Node.js Heap**: ~460Mi (configured via --max-old-space-size)
- **Next.js Runtime**: ~200-300Mi
- **System/Buffer**: ~50-100Mi
- **Headroom**: ~200Mi (prevents OOM)

## 🛡️ Additional Recommendations

### 1. Enable Cloud Run Autoscaling

```bash
gcloud run services update bb-1 \
  --min-instances=1 \
  --max-instances=10 \
  --region=europe-west1 \
  --project=penify-prod
```

Benefits:
- Keeps 1 instance warm (no cold starts)
- Scales up to 10 instances under load
- Prevents single instance overload

### 2. Set Up Alerts

Create alerting policies for:
- Memory usage > 80%
- Error rate > 1%
- Request latency > 2s

### 3. Consider Further Optimizations

If memory usage is still high:
- Enable Next.js experimental features: `serverComponentsExternalPackages`
- Use dynamic imports for large components
- Implement route-based code splitting
- Consider upgrading to 2Gi if traffic increases

## 🔗 Related Files

- `Dockerfile` - Container configuration with memory optimizations
- `next.config.ts` - Next.js production settings
- `server.js` - Graceful shutdown wrapper
- `cloudrun.yaml` - Cloud Run service configuration
- `backend.json` - Load balancer backend config (unchanged)

## 📚 References

- [Cloud Run Memory Limits](https://cloud.google.com/run/docs/configuring/memory-limits)
- [Node.js Memory Management](https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes)
- [Next.js Standalone Output](https://nextjs.org/docs/app/api-reference/next-config-js/output)
- [Graceful Shutdown in Node.js](https://nodejs.org/api/process.html#signal-events)
