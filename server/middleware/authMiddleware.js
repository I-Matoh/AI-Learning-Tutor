/**
 * JWT Authentication Middleware
 * 
 * =============================================================================
 * TOKEN VERIFICATION
 * =============================================================================
 * 
 * This middleware verifies Supabase JWT tokens on protected routes.
 * It implements defense-in-depth security practices:
 * 
 * 1. Token Extraction: Safely extracts Bearer token from Authorization header
 * 2. Signature Verification: Cryptographically verifies JWT signature
 * 3. Claim Validation: Validates required claims (exp, iat, sub)
 * 4. User Context: Attaches verified user info to request object
 * 
 * Security Considerations:
 * 
 * - Token Expiration: Expired tokens are rejected (prevents replay attacks)
 * - Algorithm Restriction: Only allows HS256 (Supabase's algorithm)
 * - No Trust of Unverified Data: All data comes from verified JWT payload
 * - Error Handling: Generic errors prevent information leakage
 * 
 * Environment Variables Required:
 *   SUPABASE_JWT_SECRET - Your Supabase JWT secret from project settings
 * 
 * @module middleware/authMiddleware
 */

'use strict';

const jwt = require('jsonwebtoken');

/**
 * Authentication middleware function.
 * 
 * Verifies the JWT token in the Authorization header and attaches
 * the decoded user information to the request object.
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
function authMiddleware(req, res, next) {
  // =================================================================
  // STEP 1: Extract Bearer Token
  // =================================================================
  
  const authHeader = req.headers.authorization || '';
  
  // Validate Authorization header format
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Missing or malformed Authorization header. Expected: Bearer <token>' 
    });
  }
  
  // Extract the token portion (after "Bearer ")
  const token = authHeader.slice('Bearer '.length);
  
  // Validate token is not empty
  if (!token || token.trim() === '') {
    return res.status(401).json({ 
      error: 'Empty token provided' 
    });
  }
  
  // =================================================================
  // STEP 2: Validate JWT Secret Configuration
  // =================================================================
  
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  
  if (!jwtSecret) {
    // Log server misconfiguration (don't expose to client)
    console.error('[AuthMiddleware] Server misconfiguration: SUPABASE_JWT_SECRET not set');
    
    return res.status(500).json({ 
      error: 'Server configuration error' 
    });
  }
  
  // =================================================================
  // STEP 3: Verify Token Signature and Claims
  // =================================================================
  
  try {
    /**
     * JWT Verification Options:
     * 
     * algorithms: Only allow HS256 (Supabase's signing algorithm).
     *   - Prevents algorithm confusion attacks
     *   - Supabase always uses HS256
     * 
     * complete: Returns the decoded payload and signature info
     *   - We only use the payload, but this gives us more control
     * 
     * clockTolerance: Allow 30 seconds clock skew
     *   - Prevents false negatives from time sync issues
     */
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
      clockTolerance: 30, // seconds
    });
    
    // =================================================================
    // STEP 4: Validate Required Claims
    // =================================================================
    
    /**
     * Supabase JWT payload should contain:
     * - sub: User's unique identifier (required)
     * - email: User's email (optional but common)
     * - role: User's role (optional)
     * - iat: Issued at time (added by JWT library)
     * - exp: Expiration time (added by JWT library)
     */
    
    if (!decoded.sub) {
      console.error('[AuthMiddleware] Token missing required "sub" claim');
      return res.status(401).json({ 
        error: 'Invalid token: missing user identifier' 
      });
    }
    
    // =================================================================
    // STEP 5: Attach User Context to Request
    // =================================================================
    
    /**
     * Attach a clean user object to the request.
     * Only include necessary information - never expose raw token or full payload.
     */
    req.user = {
      id: decoded.sub,
      email: decoded.email || null,
      role: decoded.role || null,
      // Add timestamp for when authentication occurred
      authenticatedAt: Date.now(),
    };
    
    // Log successful authentication (for debugging - disable in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AuthMiddleware] Authenticated user: ${req.user.id}`);
    }
    
    return next();
    
  } catch (error) {
    // =================================================================
    // ERROR HANDLING
    // =================================================================
    
    /**
     * Handle specific JWT errors with appropriate responses.
     * Note: We use generic error messages to prevent information leakage.
     */
    
    if (error instanceof jwt.TokenExpiredError) {
      console.log('[AuthMiddleware] Token expired');
      return res.status(401).json({ 
        error: 'Token has expired. Please login again.' 
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      // Log the specific error for server-side debugging
      console.log(`[AuthMiddleware] Token error: ${error.message}`);
      return res.status(401).json({ 
        error: 'Invalid token' 
      });
    }
    
    if (error instanceof jwt.NotBeforeError) {
      console.log('[AuthMiddleware] Token not yet valid');
      return res.status(401).json({ 
        error: 'Token not yet valid' 
      });
    }
    
    // Catch-all for unexpected errors
    console.error('[AuthMiddleware] Unexpected verification error:', error);
    return res.status(401).json({ 
      error: 'Authentication failed' 
    });
  }
}

/**
 * Optional: Higher-order function for role-based access control.
 * 
 * Usage:
 *   router.get('/admin', authMiddleware, requireRole('admin'), handler);
 * 
 * @param {string} requiredRole - The role required to access the route
 * @returns {Function} Middleware that checks user role
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.role !== requiredRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};

module.exports = { authMiddleware, requireRole };
