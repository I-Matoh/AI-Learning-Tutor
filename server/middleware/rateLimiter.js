/**
 * Rate Limiting Middleware
 * 
 * =============================================================================
 * PROTECTION AGAINST ABUSE
 * =============================================================================
 * Implements rate limiting to prevent:
 * - Brute force attacks on authentication endpoints
 * - API abuse and DoS attacks
 * - Resource exhaustion from excessive requests
 * 
 * Uses a sliding window algorithm with in-memory store.
 * For production, use Redis-backed store for distributed rate limiting.
 * 
 * Usage:
 *   const { rateLimiter, authRateLimiter } = require('./rateLimiter');
 *   app.use('/api', rateLimiter);
 *   app.use('/api/auth', authRateLimiter);
 */

// In-memory store for rate limit tracking
// In production, replace with Redis for distributed deployments
const rateLimitStore = new Map();

/**
 * Configuration for general API rate limiting.
 */
const API_CONFIG = {
  windowMs: 60 * 1000,     // 1 minute window
  maxRequests: 100,         // 100 requests per window
  message: 'Too many requests. Please try again later.',
  statusCode: 429,
};

/**
 * Configuration for authentication endpoint rate limiting.
 * Stricter limits to prevent brute force attacks.
 */
const AUTH_CONFIG = {
  windowMs: 15 * 60 * 1000,  // 15 minute window
  maxRequests: 10,             // 10 attempts per window
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  statusCode: 429,
};

/**
 * Configuration for content generation rate limiting.
 * Limits expensive AI API calls.
 */
const GENERATION_CONFIG = {
  windowMs: 60 * 60 * 1000,   // 1 hour window
  maxRequests: 20,             // 20 generations per hour
  message: 'AI generation limit reached. Please try again later.',
  statusCode: 429,
};

/**
 * Creates a rate limiting middleware with the given configuration.
 * 
 * @param {Object} config - Rate limit configuration
 * @param {number} config.windowMs - Time window in milliseconds
 * @param {number} config.maxRequests - Maximum requests per window
 * @param {string} config.message - Error message when limit exceeded
 * @param {number} config.statusCode - HTTP status code for rate limit errors
 * @returns {Function} Express middleware function
 */
const createRateLimiter = (config) => {
  return (req, res, next) => {
    // Use IP address as the identifier (consider X-Forwarded-For in production behind proxy)
    const clientIp = req.ip || 
                     req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                     'unknown';
    
    // Use IP + path combination for granular rate limiting
    const key = `${clientIp}:${req.path}`;
    const now = Date.now();
    
    // Get or initialize client record
    let clientRecord = rateLimitStore.get(key);
    
    if (!clientRecord || now > clientRecord.resetTime) {
      // Initialize new window for this client
      clientRecord = {
        count: 1,
        resetTime: now + config.windowMs,
        windowStart: now,
      };
      rateLimitStore.set(key, clientRecord);
      return next();
    }
    
    // Increment request count within current window
    clientRecord.count++;
    
    // Check if rate limit exceeded
    if (clientRecord.count > config.maxRequests) {
      const retryAfter = Math.ceil((clientRecord.resetTime - now) / 1000);
      
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(clientRecord.resetTime / 1000));
      res.setHeader('Retry-After', retryAfter);
      
      return res.status(config.statusCode).json({
        error: config.message,
        retryAfter,
      });
    }
    
    // Add rate limit headers to response
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', config.maxRequests - clientRecord.count);
    res.setHeader('X-RateLimit-Reset', Math.ceil(clientRecord.resetTime / 1000));
    
    next();
  };
};

/**
 * Periodic cleanup of expired rate limit records.
 * Prevents memory leaks from stale entries.
 * Runs every 5 minutes.
 */
const CLEANUP_INTERVAL = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[RateLimiter] Cleaned up ${cleaned} expired rate limit records`);
  }
}, CLEANUP_INTERVAL);

// Export configured rate limiters
const rateLimiter = createRateLimiter(API_CONFIG);
const authRateLimiter = createRateLimiter(AUTH_CONFIG);
const generationRateLimiter = createRateLimiter(GENERATION_CONFIG);

module.exports = {
  rateLimiter,
  authRateLimiter,
  generationRateLimiter,
  createRateLimiter,
  API_CONFIG,
  AUTH_CONFIG,
  GENERATION_CONFIG,
};
