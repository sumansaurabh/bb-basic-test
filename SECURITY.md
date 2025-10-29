# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by emailing the maintainers. Please do not create a public GitHub issue for security vulnerabilities.

## Security Best Practices Implemented

### 1. Input Validation
- All API endpoints validate and sanitize user input
- Type checking with TypeScript
- Request body size limits
- Input range validation

### 2. Rate Limiting
- API endpoints are protected with rate limiting
- Configurable limits per endpoint type
- IP-based rate limiting

### 3. Error Handling
- Structured error handling with custom error classes
- Safe error messages (no sensitive data exposure)
- Comprehensive logging for debugging

### 4. Docker Security
- Multi-stage builds to minimize image size
- Non-root user execution
- Minimal base image (Alpine Linux)
- Health checks for container orchestration
- Security headers configured

### 5. HTTP Security Headers
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)
- Referrer-Policy: origin-when-cross-origin

### 6. Environment Configuration
- Environment variable validation
- No hardcoded secrets
- .env files excluded from version control

### 7. Dependencies
- Regular dependency updates
- Lock files for reproducible builds
- Minimal dependency footprint

## Security Checklist for Deployment

- [ ] Set NODE_ENV=production
- [ ] Enable rate limiting (RATE_LIMIT_ENABLED=true)
- [ ] Configure proper CORS policies
- [ ] Set up HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Regular security audits (npm audit)
- [ ] Keep dependencies updated
- [ ] Review and rotate secrets regularly
- [ ] Enable container security scanning
- [ ] Set up intrusion detection
- [ ] Configure proper logging and log retention

## Known Security Considerations

### Load Testing Endpoints
This application includes heavy processing endpoints designed for load testing. In production:
- Consider removing or protecting these endpoints
- Implement authentication/authorization
- Use separate environments for testing
- Monitor resource usage closely

### Rate Limiting
The current rate limiting implementation uses in-memory storage. For production:
- Consider using Redis or similar for distributed rate limiting
- Implement more sophisticated rate limiting strategies
- Add IP whitelisting for trusted sources

## Compliance

This project follows OWASP security guidelines and implements defense-in-depth strategies.
