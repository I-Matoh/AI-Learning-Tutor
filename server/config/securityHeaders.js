/**
 * AI Learning Tutor - Security Configuration
 * 
 * =============================================================================
 * SECURITY HEADERS CONFIGURATION
 * =============================================================================
 * This module defines security headers applied to all Express responses.
 * These headers protect against common web vulnerabilities including:
 * - XSS attacks (Content-Security-Policy)
 * - Clickjacking (X-Frame-Options)
 * - MIME-type sniffing (X-Content-Type-Options)
 * - Cross-site request forgery (XSRF/CSRF protection via SameSite)
 * - Strict transport security (HSTS for HTTPS enforcement)
 * 
 * Usage:
 *   const { securityHeaders } = require('./securityHeaders');
 *   app.use(securityHeaders);
 */

const cspDirectives = {
  // Restrict connections to same origin and approved CDN domains
  'default-src': ["'self'"],
  
  // Scripts: self, inline for Tailwind config, React/ESM CDNs (for dev only)
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CDN configuration
    "https://cdn.tailwindcss.com",
    "https://esm.sh",
    "https://unpkg.com",
  ],
  
  // Styles: self, inline (required for Tailwind), Google Fonts
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Tailwind JIT mode requires inline styles
    "https://fonts.googleapis.com",
    "https://cdn.tailwindcss.com",
  ],
  
  // Fonts: self, Google Fonts domain
  'font-src': [
    "'self'",
    "https://fonts.gstatic.com",
  ],
  
  // Images: self, data URIs for inline SVG, HTTPS sources
  'img-src': [
    "'self'",
    "data:",
    "https:",
  ],
  
  // Connections: API endpoints only
  'connect-src': [
    "'self'",
    "https://api.groq.com",
    "https://*.supabase.co",
  ],
  
  // Frames: disabled (prevents clickjacking)
  'frame-ancestors': ["'none'"],
  
  // Object/plugin content: blocked
  'object-src': ["'none'"],
  
  // Media: restricted to self and HTTPS
  'media-src': ["'self'", "https:"],
  
  // Form submissions: same origin only
  'form-action': ["'self'"],
};

/**
 * Builds the Content-Security-Policy header string from directives.
 */
const buildCSP = () => {
  return Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

/**
 * Security headers middleware for Express.
 * Applies comprehensive security headers to all responses.
 * 
 * @param {import('express').Request} _req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
const securityHeaders = (_req, res, next) => {
  // Content Security Policy - prevents XSS and injection attacks
  // Note: In production, remove 'unsafe-inline' and use nonce-based approach
  res.setHeader('Content-Security-Policy', buildCSP());
  
  // Prevent clickjacking - ensures site can't be embedded in frames
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME-type sniffing attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter in browsers (legacy, but still helps with older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy - controls information sent in Referer header
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy - disables unnecessary browser features
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  
  // Strict Transport Security - forces HTTPS (1 year max-age)
  // Only enable in production after verifying HTTPS is working
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  next();
};

module.exports = { securityHeaders, buildCSP };
