# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by emailing the maintainers. Please do not create a public GitHub issue.

## Security Measures Implemented

### 1. API Security
- **Rate Limiting**: All API endpoints are rate-limited to prevent abuse
- **Request Validation**: Input validation on all API endpoints
- **Timeout Protection**: Request timeouts to prevent resource exhaustion
- **Error Handling**: Secure error messages that don't leak sensitive information

### 2. HTTP Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` (CSP)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` for camera, microphone, geolocation

### 3. Docker Security
- Non-root user execution
- Multi-stage builds to minimize attack surface
- Health checks for container monitoring
- Minimal base image (Alpine Linux)

### 4. Application Security
- React Strict Mode enabled
- Error boundaries to catch and handle errors gracefully
- Structured logging for security event monitoring
- Environment variable validation

### 5. Dependencies
- Regular dependency updates
- Use of lock files (`pnpm-lock.yaml`)
- Minimal dependency footprint

## Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use `.env.example` as a template
- Rotate secrets regularly
- Use strong, randomly generated secrets

### Production Deployment
1. Set `NODE_ENV=production`
2. Use HTTPS/TLS for all connections
3. Enable all security headers
4. Configure proper CORS policies
5. Set up monitoring and alerting
6. Regular security audits
7. Keep dependencies updated

### Rate Limiting
Default rate limits:
- API endpoints: 10 requests per minute per IP
- Adjust based on your needs in `/src/lib/rate-limiter.ts`

### Monitoring
- Health check endpoint: `/api/health`
- Structured logging with context
- Performance metrics collection
- Error tracking and alerting

## Security Checklist for Production

- [ ] All environment variables are set and secured
- [ ] HTTPS/TLS is configured
- [ ] Rate limiting is properly configured
- [ ] Security headers are enabled
- [ ] Error messages don't leak sensitive information
- [ ] Logging is configured and monitored
- [ ] Health checks are working
- [ ] Docker container runs as non-root user
- [ ] Dependencies are up to date
- [ ] Security scanning is enabled in CI/CD
- [ ] Backup and disaster recovery plan is in place
- [ ] Incident response plan is documented

## Known Security Considerations

### Rate Limiter
The current rate limiter uses in-memory storage. For production with multiple instances:
- Use Redis or a distributed rate limiting service
- Implement sticky sessions or shared state

### Logging
- Ensure logs don't contain sensitive information
- Set up log rotation and retention policies
- Use a centralized logging service for production

### Error Handling
- Error boundaries catch React errors
- API errors are handled with proper status codes
- Stack traces are only shown in development mode

## Updates and Patches

This project follows semantic versioning. Security patches will be released as soon as possible after a vulnerability is confirmed.

## Contact

For security concerns, please contact the project maintainers.
