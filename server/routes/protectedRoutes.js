/**
 * Protected API Routes
 * 
 * =============================================================================
 * AUTHENTICATED ENDPOINTS
 * =============================================================================
 * 
 * All routes in this module require a valid JWT token in the Authorization header.
 * These endpoints demonstrate protected API access using Supabase JWT verification.
 * 
 * Security Features:
 * - JWT authentication via middleware
 * - Rate limiting (applied globally in index.js)
 * - Input validation and sanitization
 * - Proper error handling without information leakage
 * 
 * Authentication:
 *   Authorization: Bearer <jwt_token>
 * 
 * @module routes/protectedRoutes
 */

'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { sanitize } = require('../middleware/validation');

const router = express.Router();

/**
 * GET /api/profile
 * 
 * Returns the authenticated user's profile information.
 * This endpoint demonstrates secure authenticated API access.
 * 
 * Security Measures:
 * - Requires valid JWT token
 * - Only returns user ID and email (never password or sensitive data)
 * - Input sanitization on any parameters
 * 
 * Response:
 *   {
 *     "user": {
 *       "id": "uuid",
 *       "email": "user@example.com"
 *     }
 *   }
 * 
 * Errors:
 *   401 - Missing or invalid token
 *   500 - Server error
 */
router.get('/profile', authMiddleware, (req, res) => {
  // req.user is attached by authMiddleware after token verification
  // This contains the decoded JWT payload: { id, email, role }
  
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
    },
  });
});

/**
 * GET /api/usage
 * 
 * Returns API usage statistics for the authenticated user.
 * Helps users track their consumption of AI generations.
 * 
 * Note: In a production app, this would query a database for real stats.
 * The current implementation reads from localStorage on the client side.
 */
router.get('/usage', authMiddleware, (req, res) => {
  // In production: Query database for user-specific usage
  // For now, we return a placeholder structure
  
  return res.json({
    usage: {
      dailyGenerations: 0,
      dailyLimit: parseInt(process.env.GROQ_DAILY_LIMIT) || 5,
      resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });
});

/**
 * POST /api/validate-topic
 * 
 * Server-side validation of course topic before generation.
 * Provides an additional layer of validation beyond client-side checks.
 * 
 * Body:
 *   { "topic": "string" }
 * 
 * Response:
 *   { "valid": true, "sanitized": "string" }
 *   or
 *   { "valid": false, "error": "message" }
 */
router.post('/validate-topic', authMiddleware, (req, res) => {
  const { topic } = req.body || {};
  
  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({
      valid: false,
      error: 'Topic is required',
    });
  }
  
  // Sanitize the topic
  const sanitized = sanitize.string(topic);
  
  // Validate length
  if (sanitized.length < 2) {
    return res.status(400).json({
      valid: false,
      error: 'Topic must be at least 2 characters',
    });
  }
  
  if (sanitized.length > 200) {
    return res.status(400).json({
      valid: false,
      error: 'Topic must be less than 200 characters',
    });
  }
  
  return res.json({
    valid: true,
    sanitized,
  });
});

/**
 * GET /api/health
 * 
 * Authenticated health check for internal monitoring.
 * Returns server status including authentication service health.
 */
router.get('/health', authMiddleware, (req, res) => {
  return res.json({
    status: 'healthy',
    authenticated: true,
    userId: req.user.id,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
