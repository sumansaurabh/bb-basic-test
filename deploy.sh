#!/bin/bash

# Cloud Run Deployment Script - Error Fix
# This script deploys the optimized container with increased memory

set -e

PROJECT_ID="penify-prod"
SERVICE_NAME="bb-1"
REGION="europe-west1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "🚀 Deploying Cloud Run Error Fixes"
echo "=================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: docker is not installed"
    echo "Install from: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Option 1: Quick fix - just update memory (no rebuild needed)
echo "Option 1: Quick Memory Update (No Rebuild)"
echo "==========================================="
echo "This will immediately fix OOM errors by increasing memory to 1Gi"
echo ""
read -p "Apply quick fix? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📝 Updating Cloud Run service memory..."
    gcloud run services update ${SERVICE_NAME} \
        --memory=1Gi \
        --cpu=1 \
        --region=${REGION} \
        --project=${PROJECT_ID}
    
    echo "✅ Memory updated to 1Gi"
    echo ""
fi

# Option 2: Full deployment with all optimizations
echo "Option 2: Full Deployment (Rebuild + All Optimizations)"
echo "======================================================="
echo "This includes:"
echo "  - Memory optimization (1Gi)"
echo "  - Graceful shutdown handling"
echo "  - Next.js standalone output"
echo "  - Signal handling (SIGPIPE, SIGSEGV)"
echo ""
read -p "Deploy full optimizations? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔨 Building Docker image..."
    docker build -t ${IMAGE_NAME} .
    
    echo "📤 Pushing to Google Container Registry..."
    docker push ${IMAGE_NAME}
    
    echo "🚀 Deploying to Cloud Run..."
    gcloud run deploy ${SERVICE_NAME} \
        --image=${IMAGE_NAME} \
        --memory=1Gi \
        --cpu=1 \
        --region=${REGION} \
        --project=${PROJECT_ID} \
        --platform=managed \
        --timeout=300s \
        --concurrency=80 \
        --min-instances=0 \
        --max-instances=10
    
    echo "✅ Full deployment complete"
    echo ""
fi

# Option 3: Deploy using YAML configuration
echo "Option 3: Deploy Using YAML Configuration"
echo "=========================================="
echo "This uses the cloudrun.yaml file for declarative deployment"
echo ""
read -p "Deploy using YAML? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📝 Deploying from cloudrun.yaml..."
    gcloud run services replace cloudrun.yaml \
        --region=${REGION} \
        --project=${PROJECT_ID}
    
    echo "✅ YAML deployment complete"
    echo ""
fi

# Verification
echo "🔍 Verification"
echo "==============="
echo ""

echo "Checking service status..."
gcloud run services describe ${SERVICE_NAME} \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --format="table(status.url, spec.template.spec.containers[0].resources.limits.memory)"

echo ""
echo "Checking recent logs for errors..."
gcloud logging read "resource.type=cloud_run_revision \
    AND resource.labels.service_name=${SERVICE_NAME} \
    AND severity>=ERROR" \
    --limit=5 \
    --project=${PROJECT_ID} \
    --format="table(timestamp, severity, textPayload)"

echo ""
echo "✅ Deployment script complete!"
echo ""
echo "📊 Next Steps:"
echo "  1. Monitor logs: gcloud logging read ..."
echo "  2. Check metrics in Cloud Console"
echo "  3. Verify no OOM or signal errors"
echo "  4. Test application endpoints"
echo ""
echo "📚 Documentation:"
echo "  - ERROR_FIX_SUMMARY.md - Quick overview"
echo "  - CLOUDRUN_FIX.md - Detailed guide"
echo ""
