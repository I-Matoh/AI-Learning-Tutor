/**
 * Express Server Entry Point
 * 
 * =============================================================================
 * APPLICATION BOOTSTRAP
 * =============================================================================
 * 
 * This is the main server application that handles:
 * - Serving the built React client for production
 * - Providing protected API endpoints with JWT authentication
 * - Implementing comprehensive security measures
 * - Rate limiting to prevent abuse
 * 
 * Security Features Implemented:
 * - Helmet-style security headers (custom implementation)
 * - Rate limiting for API and auth endpoints
 * - CORS configuration
 * - Input validation middleware
 * - JWT authentication
 * 
 * @module server
 */

'use strict';

// =============================================================================
// IMPORTS & CONFIGURATION
// =============================================================================

const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
// In production, use proper secrets management (AWS Secrets, HashiCorp Vault, etc.)
dotenv.config();

// Security middleware
const { securityHeaders } = require('./config/securityHeaders');
const { rateLimiter, authRateLimiter } = require('./middleware/rateLimiter');

// Routes
const protectedRoutes = require('./routes/protectedRoutes');

// Supabase admin client initialization (validates env vars on load)
require('./config/supabaseAdmin');

// =============================================================================
// SERVER SETUP
// =============================================================================

const app = express();
const port = process.env.PORT || 4000;

// Determine if running in production
const isProduction = process.env.NODE_ENV === 'production';

// =============================================================================
// GLOBAL MIDDLEWARE
// =============================================================================

/**
 * Enable CORS for cross-origin requests.
 * 
 * Security Note: In production, restrict this to your specific domains:
 * app.use(cors({
 *   origin: ['https://yourdomain.com'],
 *   credentials: true
 * }));
 */
app.use(cors({
  origin: isProduction 
    ? process.env.ALLOWED_ORIGINS?.split(',') || false 
    : true, // Allow all in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * Parse JSON request bodies with size limit.
 * 
 * Security Note: The size limit prevents large payload attacks:
 * - 100KB is sufficient for most API payloads
 * - Adjust based on your application's needs
 */
app.use(express.json({ limit: '100kb' }));

/**
 * Parse URL-encoded form data with size limit.
 * 
 * Security Note: Extended mode disabled reduces attack surface.
 * Extended: false uses simple querystring parsing instead of
 * the more complex (and potentially exploitable) qs parser.
 */
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

/**
 * Apply security headers to all responses.
 * See: ./config/securityHeaders.js for details on each header.
 */
app.use(securityHeaders);

/**
 * Apply global rate limiting to all API routes.
 * See: ./middleware/rateLimiter.js for configuration.
 */
app.use('/api', rateLimiter);

/**
 * Apply stricter rate limiting to authentication endpoints.
 * This prevents brute force attacks on login/signup.
 */
app.use('/api/auth', authRateLimiter);

// =============================================================================
// HEALTH CHECK & MONITORING
// =============================================================================

/**
 * Health check endpoint for load balancers and monitoring systems.
 * 
 * Security Note: This endpoint intentionally reveals minimal information.
 * In production, consider adding authentication for detailed health checks.
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
  });
});

/**
 * Detailed health check (authenticated or internal only).
 * Provides memory usage and uptime information.
 */
app.get('/health/detailed', (req, res) => {
  // In production, protect this endpoint with IP allowlist or authentication
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
    },
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// API ROUTES
// =============================================================================

/**
 * Mount protected API routes under /api prefix.
 * All routes in protectedRoutes.js require JWT authentication.
 * See: ./routes/protectedRoutes.js
 */
app.use('/api', protectedRoutes);

// =============================================================================
// STATIC FILE SERVING
// =============================================================================

/**
 * Serve built client assets from the dist directory.
 * This handles production deployment of the React frontend.
 */
const clientBuildPath = path.join(__dirname, '..', 'dist');

// Serve static files from dist
app.use(express.static(clientBuildPath));

/**
 * SPA fallback: serve index.html for all non-API routes.
 * This enables client-side routing (React Router style URLs).
 * 
 * Security Note: The regex ensures we don't match API routes:
 * - /api/* routes are handled by protectedRoutes
 * - /health* routes are handled above
 * - All other routes serve the React app
 */
app.get(/^\/(?!api)(?!health).*/, (_req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Global error handler for unexpected errors.
 * 
 * Security Note: Error details are not exposed to clients in production.
 * This prevents information leakage about the server's internals.
 */
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err);
  
  // Don't leak error details in production
  if (isProduction) {
    return res.status(500).json({
      error: 'An unexpected error occurred',
    });
  }
  
  // Include details in development for debugging
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    stack: err.stack,
  });
});

// =============================================================================
// SERVER START
// =============================================================================

const server = app.listen(port, () => {
  console.log(`

                                                               
   🚀 AI Learning Tutor Server                                 
                                                               
   Environment: ${isProduction ? 'PRODUCTION ⚠️' : 'DEVELOPMENT'}
   Port: ${port}                                                 
   CORS: ${isProduction ? 'Restricted' : 'Open (development only)'}                            
   Rate Limiting: ${isProduction ? 'Enabled' : 'Enabled (dev relaxed)'}
                                                               
   Security headers: ENABLED                                   
   JWT auth: ENABLED                                          
  `);
  
  // Log warning if running in production without HTTPS
  if (isProduction && !process.env.HTTPS === 'true') {
    console.warn('⚠️  WARNING: Running in production without HTTPS');
    console.warn('⚠️  Set HTTPS=true and configure SSL certificates');
  }
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

/**
 * Handle graceful shutdown for container orchestration and zero-downtime deploys.
 * 
 * Security Note: Proper shutdown handling prevents:
 * - In-flight requests from being dropped
 * - Database connections from being orphaned
 * - Rate limit counters from becoming inconsistent
 */

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connections
    // Add your database cleanup here if needed
    
    console.log('Graceful shutdown complete');
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app;
