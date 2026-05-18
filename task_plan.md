# Task Plan

## Phase 1 Implementation (current pass)
1. Add ADRs for server-side generation, DB-first progress, entitlement-ready contracts.
2. Add Phase 1 Supabase migration with RLS policies for learning + usage tables.
3. Implement authenticated generation endpoints (`/api/generate/course|lesson|quiz`) with Zod validation.
4. Add user-level usage ledger writes and usage stats endpoint backed by DB.
5. Migrate frontend course generation to backend API client.
6. Add sync status indicator (`Saving...`, `Saved`, `Sync failed`) in dashboard.
