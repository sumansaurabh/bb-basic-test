# ⚡ Quick Fix Guide - Cloud Run Errors

## 🚨 Problem
- Memory limit exceeded (512 MiB)
- SIGPIPE crashes (signal 13)
- SIGSEGV crashes (signal 11)

## ✅ Solution
Increase memory to 1Gi and deploy optimized container

---

## 🚀 Fastest Fix (30 seconds)

```bash
gcloud run services update bb-1 \
  --memory=1Gi \
  --cpu=1 \
  --region=europe-west1 \
  --project=penify-prod
```

**This immediately fixes OOM errors!**

---

## 🔧 Complete Fix (5 minutes)

### 1. Build & Push
```bash
docker build -t gcr.io/penify-prod/bb-1:latest .
docker push gcr.io/penify-prod/bb-1:latest
```

### 2. Deploy
```bash
gcloud run deploy bb-1 \
  --image=gcr.io/penify-prod/bb-1:latest \
  --memory=1Gi \
  --cpu=1 \
  --region=europe-west1 \
  --project=penify-prod
```

---

## 🎯 What Was Fixed

| Issue | Fix |
|-------|-----|
| OOM errors | 512Mi → 1Gi memory |
| SIGPIPE crashes | Graceful signal handling |
| SIGSEGV crashes | Memory optimization |
| Slow cold starts | Standalone output |

---

## 📊 Verify Fix

```bash
# Check memory
gcloud run services describe bb-1 \
  --region=europe-west1 \
  --project=penify-prod \
  --format="value(spec.template.spec.containers[0].resources.limits.memory)"

# Check for errors (should be empty)
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=bb-1 \
  AND severity>=ERROR" \
  --limit=10 \
  --project=penify-prod
```

---

## 📁 Files Changed

- ✏️ `Dockerfile` - Memory limits + signal handling
- ✏️ `next.config.ts` - Production optimizations
- ✨ `server.js` - Graceful shutdown wrapper
- ✨ `cloudrun.yaml` - 1Gi memory config

---

## 🆘 Still Having Issues?

1. Check `ERROR_FIX_SUMMARY.md` for overview
2. Read `CLOUDRUN_FIX.md` for detailed guide
3. Run `./deploy.sh` for interactive deployment
4. Increase to 2Gi if traffic is very high

---

**Status**: ✅ Ready to deploy  
**Priority**: 🔴 Critical  
**Downtime**: None (rolling update)
