# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment (Optional)
```bash
cp .env.example .env.local
# Edit .env.local if needed
```

### 3. Run Development Server
```bash
pnpm dev
```

Visit: http://localhost:3000

## 🔍 Quick Health Check

Once the server is running:

```bash
# Check service health
curl http://localhost:3000/api/health

# View metrics
curl http://localhost:3000/api/metrics

# Test endpoint
curl http://localhost:3000/api/test
```

## 📊 Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Service health status |
| `/api/metrics` | GET | Performance metrics |
| `/api/test` | GET | Simple test endpoint |
| `/api/heavy-processing` | GET/POST | Heavy computation endpoint |

## 🔧 Common Commands

```bash
# Development
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Test API endpoints (requires server running)
./test-api.sh
```

## 🐳 Docker Quick Start

```bash
# Build image
docker build -t nextjs-app .

# Run container
docker run -p 3000:3000 nextjs-app

# Check health
curl http://localhost:3000/api/health
```

## ⚙️ Key Features

✅ **Error Handling** - All endpoints have comprehensive error handling  
✅ **Rate Limiting** - 100 requests/minute per client  
✅ **Logging** - Structured logging with Winston  
✅ **Validation** - Input validation with Zod  
✅ **Timeouts** - 30-second request timeout protection  
✅ **Health Checks** - Built-in health and metrics endpoints  
✅ **Security** - Security headers and CORS configuration  

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Change port in .env.local
PORT=3001
```

### Rate Limited
Wait 60 seconds or adjust in `.env.local`:
```bash
RATE_LIMIT_MAX=200
```

### Build Errors
```bash
# Clean and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

## 📚 More Information

- Full documentation: [README.md](README.md)
- Improvements summary: [IMPROVEMENTS.md](IMPROVEMENTS.md)
- Environment variables: [.env.example](.env.example)

## 🎯 What's New

This service now includes:
- ✅ Fixed critical runtime errors
- ✅ Comprehensive error handling
- ✅ Structured logging and monitoring
- ✅ Rate limiting and security
- ✅ Health check endpoints
- ✅ Request timeout protection
- ✅ Input validation
- ✅ Memory leak prevention
- ✅ Improved Docker configuration

Ready to go! 🚀
