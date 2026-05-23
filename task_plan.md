# Task Plan

## Phase 1 Implementation (current pass)
1. [x] Add ADRs for server-side generation, DB-first progress, entitlement-ready contracts.
2. [x] Add Phase 1 Supabase migration with RLS policies for learning + usage tables.
3. [x] Implement authenticated generation endpoints (`/api/generate/course|lesson|quiz`) with Zod validation.
4. [x] Add user-level usage ledger writes and usage stats endpoint backed by DB.
5. [x] Migrate frontend course generation to backend API client.
6. [x] Add sync status indicator (`Saving...`, `Saved`, `Sync failed`) in dashboard.
7. [x] Switch progress persistence to DB-primary (`courses` table payload) with local cache fallback.
8. [x] Load saved courses from Supabase on authenticated sessions for cross-device resume.
