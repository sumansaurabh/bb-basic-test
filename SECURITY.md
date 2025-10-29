# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by emailing the maintainers. Please do not create a public GitHub issue.

## Security Measures Implemented

### 1. Input Validation
- All API endpoints validate and sanitize user input
- Type checking with TypeScript
- Request body validation with custom validators

### 2. Rate Limiting
- API endpoints are protected with rate limiting
- Different limits for GET and POST requests
- In-memory rate limiter (consider Redis for production)

### 3. Error Handling
- Structured error handling with custom error classes
- Safe error responses (no sensitive data exposure)
- Comprehensive logging for debugging

### 4. Docker Security
- Multi-stage builds to reduce image size
- Non-root user execution
- Minimal base image (Alpine Linux)
- Health checks for container orchestration

### 5. HTTP Security Headers
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)
- Referrer-Policy: origin-when-cross-origin

### 6. Environment Variables
- Environment variable validation
- No secrets in code or version control
- .env.example for documentation

## Best Practices

### For Development
1. Never commit `.env` files
2. Use `.env.local` for local development
3. Keep dependencies updated
4. Run security audits: `pnpm audit`

### For Production
1. Use environment-specific configurations
2. Enable HTTPS/TLS
3. Use a reverse proxy (nginx, Cloudflare)
4. Implement proper authentication/authorization
5. Use Redis for rate limiting
6. Set up monitoring and alerting
7. Regular security audits and penetration testing

## Dependencies

Keep dependencies updated to patch security vulnerabilities:

```bash
# Check for vulnerabilities
pnpm audit

# Update dependencies
pnpm update

# Fix vulnerabilities automatically
pnpm audit fix
```

## Environment Variables

Never expose sensitive environment variables:
- API keys
- Database credentials
- Secret tokens
- Private keys

Use a secrets management service in production (AWS Secrets Manager, HashiCorp Vault, etc.)
