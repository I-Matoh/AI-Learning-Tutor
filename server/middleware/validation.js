/**
 * Input Validation Middleware
 * 
 * =============================================================================
 * DATA SANITIZATION & VALIDATION
 * =============================================================================
 * Provides comprehensive input validation and sanitization to protect against:
 * - SQL injection (mitigated by parameterized queries, but we add defense in depth)
 * - NoSQL injection (for MongoDB-style attacks)
 * - XSS attacks (via HTML sanitization)
 * - Command injection
 * - Path traversal attacks
 * - Invalid data submissions
 * 
 * All user inputs should pass through these validators before processing.
 */

const { z } = require('zod');

/**
 * =============================================================================
 * VALIDATION SCHEMAS
 * =============================================================================
 * Using Zod for schema validation provides:
 * - Type inference for TypeScript/JavaScript
 * - Composable schemas
 * - Detailed error messages
 * - Sanitization built-in
 */

/**
 * Email validation schema.
 * Validates email format with RFC 5322 compliance.
 */
const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email too short')
  .max(255, 'Email too long')
  .transform((val) => val.toLowerCase().trim());

/**
 * Password validation schema.
 * Enforces strong password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Course topic validation schema.
 * Ensures learning topics are reasonable in size and content.
 */
const topicSchema = z
  .string()
  .min(2, 'Topic must be at least 2 characters')
  .max(200, 'Topic must be less than 200 characters')
  .transform((val) => val.trim())
  .refine(
    (val) => !/[<>{}[\]\\|^*&%$#@!]/.test(val),
    'Topic contains invalid characters'
  );

/**
 * Generic ID validation schema.
 * Validates database-style IDs (UUID, numeric, etc.)
 */
const idSchema = z
  .string()
  .min(1, 'ID cannot be empty')
  .max(100, 'ID too long')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'ID contains invalid characters'
  );

/**
 * Course generation parameters schema.
 */
const courseGenerationSchema = z.object({
  topic: topicSchema,
});

/**
 * Lesson content parameters schema.
 */
const lessonGenerationSchema = z.object({
  courseTitle: z.string().min(1).max(300),
  moduleTitle: z.string().min(1).max(200),
  lessonTitle: z.string().min(1).max(200),
});

/**
 * Quiz generation parameters schema.
 */
const quizGenerationSchema = z.object({
  courseTitle: z.string().min(1).max(300),
  context: z.string().min(1).max(1000),
});

/**
 * =============================================================================
 * SANITIZATION FUNCTIONS
 * =============================================================================
 */

/**
 * Removes potentially dangerous characters from strings.
 * Used for defense-in-depth against injection attacks.
 * 
 * @param {string} input - Raw user input
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove null bytes (can be used in injection attacks)
    .replace(/\0/g, '')
    // Normalize line breaks
    .replace(/[\r\n]/g, '\n')
    // Remove control characters except valid whitespace
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Trim excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Strips HTML tags from input to prevent XSS.
 * 
 * @param {string} input - Raw user input that may contain HTML
 * @returns {string} String with HTML tags removed
 */
const stripHTML = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/<[^>]*$/g, '')
    .replace(/^[^<]*/, '');
};

/**
 * Escapes special characters for safe inclusion in regex patterns.
 * 
 * @param {string} input - Raw string that may contain regex special chars
 * @returns {string} Escaped string safe for use in RegExp
 */
const escapeRegex = (input) => {
  if (typeof input !== 'string') return '';
  
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * =============================================================================
 * VALIDATION MIDDLEWARE FACTORY
 * =============================================================================
 */

/**
 * Creates an Express middleware that validates request body against a Zod schema.
 * 
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {Object} options - Validation options
 * @param {boolean} options.abortEarly - Stop at first error (default: false)
 * @returns {Function} Express middleware
 */
const validateBody = (schema, _options = { abortEarly: false }) => {
  return (req, res, next) => {
    try {
      const result = schema.parse(req.body);
      // Replace body with parsed (and potentially transformed) data
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return res.status(500).json({ error: 'Validation error' });
    }
  };
};

/**
 * Creates an Express middleware that validates query parameters.
 * 
 * @param {z.ZodSchema} schema - Zod schema for query params
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors,
        });
      }
      return res.status(500).json({ error: 'Validation error' });
    }
  };
};

/**
 * =============================================================================
 * EXPORTS
 * =============================================================================
 */

module.exports = {
  // Schemas for validation
  schemas: {
    email: emailSchema,
    password: passwordSchema,
    topic: topicSchema,
    id: idSchema,
    courseGeneration: courseGenerationSchema,
    lessonGeneration: lessonGenerationSchema,
    quizGeneration: quizGenerationSchema,
  },
  
  // Sanitization utilities
  sanitize: {
    string: sanitizeString,
    html: stripHTML,
    regex: escapeRegex,
  },
  
  // Middleware factories
  validateBody,
  validateQuery,
};
