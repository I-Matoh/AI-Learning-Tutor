/**
 * Supabase Client Configuration
 * 
 * =============================================================================
 * CLIENT INITIALIZATION
 * =============================================================================
 * 
 * This module initializes the Supabase JavaScript client with authentication
 * settings optimized for browser-based authentication flows.
 * 
 * Security Considerations:
 * 
 * 1. API Keys:
 *    - ANON_KEY: Public, safe to expose in client-side code
 *    - This key can only access public data and limited authenticated operations
 *    - Sensitive operations require authenticated users or server-side access
 * 
 * 2. Authentication Flow:
 *    - Uses Supabase's built-in authentication system
 *    - Tokens are automatically refreshed before expiration
 *    - Sessions persist across browser sessions (if enabled)
 * 
 * 3. Row Level Security (RLS):
 *    - Database access is controlled by RLS policies
 *    - Even with the anon key, users can only access permitted data
 *    - All authenticated operations respect user permissions
 * 
 * 4. Storage Security:
 *    - Session data is stored in localStorage by default
 *    - Browsers encrypt localStorage at rest when the device is locked
 *    - Consider using sessionStorage for more paranoid security
 * 
 * Environment Variables Required:
 *   VITE_SUPABASE_URL - Your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY - Your Supabase anonymous/public key
 * 
 * @module lib/supabaseClient
 */

'use strict';

import { createClient } from "@supabase/supabase-js";

// =============================================================================
// CONFIGURATION VALIDATION
// =============================================================================

/**
 * Load configuration from environment variables.
 * 
 * Security Note: These values are public (client-safe).
 * The URL and anon key can be visible to anyone.
 * Actual security comes from Supabase's RLS policies.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Validate that required environment variables are set.
 * 
 * @throws Error if configuration is missing
 * 
 * @security Note: We throw during initialization rather than
 * returning a broken client. This fails fast and visibly.
 */
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase configuration. " +
    "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
  );
}

// =============================================================================
// CLIENT CREATION
// =============================================================================

/**
 * Supabase client instance for the web application.
 * 
 * This client is configured for browser use with:
 * - Session persistence across page reloads
 * - Automatic token refresh before expiration
 * 
 * @security Note: The options here affect security behavior:
 * - persistSession: Keeps user logged in (convenient but slightly less secure)
 * - autoRefreshToken: Ensures tokens stay valid (improves security)
 * 
 * For maximum security, consider:
 * - Using sessionStorage instead of localStorage
 * - Shorter token expiration times
 * - Requiring re-authentication for sensitive operations
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    /**
     * Persist session to localStorage.
     * 
     * Pros:
     * - User stays logged in across browser sessions
     * - Better UX, fewer login prompts
     * 
     * Cons:
     * - Session persists even after browser closes
     * - If device is compromised, old sessions remain
     * 
     * Alternative: Use sessionStorage for session-only persistence
     * 
     * @security Consider: encryptSession: true (if available)
     */
    persistSession: true,
    
    /**
     * Automatically refresh access tokens before they expire.
     * 
     * This is important for security because:
     * - Short-lived access tokens reduce the window of opportunity
     *   if a token is compromised
     * - Users don't experience sudden logout due to token expiry
     * 
     * @security The refresh token is more sensitive and should
     * have limited lifetime (configured in Supabase dashboard)
     */
    autoRefreshToken: true,
    
    /**
     * Detect session changes from URL (OAuth callbacks).
     * 
     * Disable in environments where URL changes aren't expected
     * or could be manipulated.
     */
    detectSessionInUrl: typeof window !== 'undefined',
    
    /**
     * Redirect behavior after OAuth or other auth actions.
     * 
     * @security Should match your app's routing structure
     * to prevent redirect-based attacks
     */
  },
  
  /**
   * Global fetch options.
   * 
   * @security These can be used to add custom headers to all requests,
   * such as CSRF tokens or custom authentication headers.
   */
  global: {
    headers: {
      // Example: Add custom header for CORS verification
      // 'X-Client-Version': '1.0.0',
    },
  },
});

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/**
 * Example: Authentication Flow
 * 
 * ```typescript
 * // Sign up a new user
 * const { data, error } = await supabase.auth.signUp({
 *   email: 'user@example.com',
 *   password: 'secure-password'
 * });
 * 
 * // Sign in existing user
 * const { data, error } = await supabase.auth.signInWithPassword({
 *   email: 'user@example.com',
 *   password: 'secure-password'
 * });
 * 
 * // Get current session
 * const { data: { session } } = await supabase.auth.getSession();
 * 
 * // Sign out
 * await supabase.auth.signOut();
 * ```
 * 
 * Example: Protected Data Access
 * 
 * ```typescript
 * // This will respect RLS policies for the authenticated user
 * const { data, error } = await supabase
 *   .from('user_courses')
 *   .select('*')
 *   .eq('user_id', session.user.id);
 * ```
 */

// =============================================================================
// SECURITY BEST PRACTICES
// =============================================================================

/**
 * 1. Always validate the user session before sensitive operations:
 * 
 * ```typescript
 * const { data: { session } } = await supabase.auth.getSession();
 * if (!session) {
 *   // Redirect to login
 * }
 * ```
 * 
 * 2. Use server-side operations for sensitive data:
 * 
 * ```typescript
 * // Don't expose sensitive operations to the client
 * // Instead, call your backend API which uses service_role key
 * ```
 * 
 * 3. Implement proper error handling:
 * 
 * ```typescript
 * const { data, error } = await supabase.auth.signInWithPassword({
 *   email,
 *   password,
 * });
 * 
 * if (error) {
 *   // Log error for debugging (server-side)
 *   // Show generic message to user
 *   console.error('Auth error:', error.message);
 * }
 * ```
 * 
 * 4. Keep tokens short-lived:
 * 
 * Configure in Supabase Dashboard:
 * - Access Token TTL: 1 hour (or less)
 * - Refresh Token TTL: 1 week (or less)
 * - Refresh Token Reuse Window: None (immediate invalidation)
 */
