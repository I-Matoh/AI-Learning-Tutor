/**
 * Supabase Admin Client Configuration
 * 
 * Server-side Supabase client with service role key.
 * Used for privileged operations that bypass Row Level Security (RLS).
 * 
 * WARNING: This client has elevated permissions.
 * Never expose this configuration to the client-side.
 */

const { createClient } = require("@supabase/supabase-js");

// Load configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing server env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
}

/**
 * Supabase admin client for server-side operations.
 * Configured with:
 * - No session persistence (server-only)
 * - No token refresh (service role tokens don't expire the same way)
 */
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    // Disable auto-refresh since service role keys don't need it
    autoRefreshToken: false,
    // Don't persist sessions in server environment
    persistSession: false,
  },
});

module.exports = { supabaseAdmin };
