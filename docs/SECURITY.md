# AI Learning Tutor - Security Documentation

## Overview

This document outlines the security architecture, implemented measures, and best practices for the AI Learning Tutor application.

---

## Architecture Security

### Frontend (React + TypeScript)

| Concern | Implementation |
|---------|---------------|
| **Authentication** | Supabase Auth with JWT tokens |
| **Session Management** | Auto-refresh tokens, localStorage persistence |
| **Input Validation** | Client-side validation before API calls |
| **XSS Protection** | React's built-in escaping, CSP headers |
| **Environment Variables** | API keys stored in `.env`, never committed |

### Backend (Express.js)

| Concern | Implementation |
|---------|---------------|
| **Authentication** | JWT verification middleware |
| **Rate Limiting** | IP-based limits with sliding window |
| **Input Validation** | Zod schemas for all endpoints |
| **Security Headers** | CSP, X-Frame-Options, HSTS, etc. |
| **Error Handling** | Generic errors in production |

### Infrastructure

| Concern | Implementation |
|---------|---------------|
| **CORS** | Restricted origins in production |
| **Secrets** | Environment variables, never in code |
| **Rate Limits** | Client-side + server-side enforcement |

---

## Security Headers

All responses include these security headers:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Strict-Transport-Security: max-age=31536000; includeSubDomains (production only)
```

---

## Rate Limiting

### Configuration

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/*` | 100 requests | 1 minute | General API protection |
| `/api/auth/*` | 10 requests | 15 minutes | Brute force prevention |
| Client-side (Groq) | 5 requests | 24 hours | AI generation limit |

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1712345678
Retry-After: 30 (when exceeded)
```

---

## Authentication Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Client  │───▶│ Supabase │───▶│  Token   │───▶│  JWT     │
│  Login   │    │   Auth   │    │ Returned │    │ Verified │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                              │
                                              ▼
                                         ┌──────────┐
                                         │ Protected │
                                         │  Route    │
                                         └──────────┘
```

### Token Storage

- **Access Token**: Stored in memory (JS variable)
- **Refresh Token**: Stored in localStorage (encrypted at rest by browser)
- **Session**: Persisted via Supabase client

---

## Input Validation

### Server-Side Validation

All user inputs are validated using Zod schemas:

```javascript
// Example: Topic validation
const topicSchema = z
  .string()
  .min(2, 'Topic must be at least 2 characters')
  .max(200, 'Topic must be less than 200 characters')
  .transform((val) => val.trim())
  .refine(
    (val) => !/[<>{}[\]\\|^*&%$#@!]/.test(val),
    'Topic contains invalid characters'
  );
```

### Sanitization Functions

| Function | Purpose |
|----------|---------|
| `sanitize.string()` | Remove null bytes, normalize whitespace |
| `sanitize.html()` | Strip HTML tags |
| `sanitize.regex()` | Escape regex special characters |

---

## AI Content Generation

### Client-Side Quota Management

```javascript
// Located in: services/groqService.ts

// Daily limit tracked in localStorage
const GROQ_DAILY_LIMIT = 5; // Default
const windowMs = 24 * 60 * 60 * 1000; // 24 hours

// Automatic reset when window expires
// Throws error when limit exceeded
```

### Server-Side Rate Limiting

- AI generation endpoints are rate-limited per IP
- 20 generations per hour maximum (configurable)
- Returns `429 Too Many Requests` when exceeded

---

## Environment Variables

### Frontend (`.env`)

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...  # Public, safe to expose
VITE_GROQ_API_KEY=xxx             # Keep private
VITE_GROQ_DAILY_LIMIT=5
```

### Server (`.env`)

```bash
PORT=4000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx     # Server-only, never expose
SUPABASE_JWT_SECRET=xxx           # Server-only, verify tokens
NODE_ENV=production               # Enables security features
```

---

## Known Security Considerations

### Current Mitigations

| Risk | Current Mitigation |
|------|-------------------|
| XSS in user content | React escaping, CSP headers |
| CSRF | SameSite cookies (handled by Supabase) |
| SQL Injection | No direct DB queries (using Supabase SDK) |
| Rate Limiting | IP-based limits on all endpoints |
| Token Theft | Short-lived access tokens, auto-refresh |

### Future Improvements

- [ ] Add CAPTCHA for repeated failed logins
- [ ] Implement IP allowlisting for admin endpoints
- [ ] Add audit logging for sensitive operations
- [ ] Implement mTLS for server-to-server communication
- [ ] Add request signing for API calls
- [ ] Implement Redis for distributed rate limiting

---

## Security Checklist

### Pre-Deployment

- [ ] Set `NODE_ENV=production`
- [ ] Configure `ALLOWED_ORIGINS` for CORS
- [ ] Update JWT secret (not default)
- [ ] Enable HTTPS
- [ ] Set rate limits appropriately
- [ ] Remove debug endpoints
- [ ] Review CSP policy for production
- [ ] Enable HSTS
- [ ] Set up monitoring/alerting
- [ ] Backup and disaster recovery plan

### Monitoring

- [ ] Failed authentication attempts
- [ ] Rate limit hits
- [ ] API error rates
- [ ] Unusual traffic patterns
- [ ] Server resource usage

---

## Incident Response

If a security incident is detected:

1. **Contain**: Isolate affected systems
2. **Assess**: Determine scope and impact
3. **Remediate**: Fix vulnerabilities
4. **Notify**: Inform affected users (if required)
5. **Review**: Post-mortem and improvements

### Contact

For security vulnerabilities, please contact: security@example.com

---

## Compliance

This application follows these security principles:

- **Least Privilege**: Minimal permissions at each layer
- **Defense in Depth**: Multiple security layers
- **Fail Securely**: Default deny, explicit allow
- **Security by Obscurity**: Not relied upon, but implemented
- **Zero Trust**: Verify all requests, even internal

---

*Last Updated: March 2026*
*Version: 1.0.0*
