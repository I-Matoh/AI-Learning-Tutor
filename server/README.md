# AI Learning Tutor - Backend Server

Express.js backend server providing protected API endpoints and security middleware.

## Features

- JWT authentication via Supabase
- Security headers (CSP, X-Frame-Options, HSTS)
- Rate limiting for API abuse prevention
- Input validation with Zod
- CORS configuration
- Graceful shutdown handling

## Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your credentials in .env:
# - SUPABASE_URL
# - SUPABASE_JWT_SECRET
# - SUPABASE_SERVICE_ROLE_KEY

# Start development server
npm run dev

# Start production server
npm start
```

## Scripts

```bash
npm start       # Start production server
npm run dev     # Start with nodemon (auto-reload)
npm run lint    # Run ESLint
```

## Project Structure

```
server/
├── index.js                 # Express app entry point
├── package.json
├── .env.example             # Environment template
├── config/
│   ├── securityHeaders.js   # Security header configuration
│   └── supabaseAdmin.js    # Supabase admin client
├── middleware/
│   ├── authMiddleware.js   # JWT verification
│   ├── rateLimiter.js      # Rate limiting
│   └── validation.js       # Input validation (Zod)
└── routes/
    └── protectedRoutes.js  # Protected API endpoints
```

## API Endpoints

### Health Checks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Basic health check |
| `/health/detailed` | GET | Detailed health with metrics |

### Protected Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/profile` | GET | Yes | Get authenticated user profile |
| `/api/usage` | GET | Yes | Get API usage statistics |
| `/api/validate-topic` | POST | Yes | Validate course topic |
| `/api/health` | GET | Yes | Authenticated health check |

## Security

### Security Headers

- Content-Security-Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy
- Strict-Transport-Security (production)

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/*` | 100 requests | 1 minute |
| `/api/auth/*` | 10 requests | 15 minutes |

## Environment Variables

See `.env.example` for all configuration options.

**Required:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_JWT_SECRET` - JWT verification secret
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key

**Optional:**
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment mode
- `ALLOWED_ORIGINS` - CORS origins (comma-separated)

## Deployment

```bash
# Build frontend
cd ../frontend && npm run build

# Start server (serves built frontend)
npm start
```

Or deploy separately:
1. Deploy frontend to Vercel/Netlify
2. Deploy server to Railway/Render
3. Configure CORS to allow frontend domain
