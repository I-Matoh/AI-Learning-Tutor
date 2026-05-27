# Progress

- [x] Parsed v2 docs + ticket specs.
- [x] Designed implementation scope for Phase 1 ticket set.
- [x] Backend generation endpoints and service layer.
- [x] Supabase migration + RLS policies.
- [x] Frontend backend generation migration.
- [x] Sync status UI.
- [x] DB-primary progress persistence service added (`frontend/src/services/progressService.ts`).
- [x] App boot flow now hydrates courses from Supabase when authenticated.
- [x] Reusable sync status component extracted (`frontend/src/components/SyncStatus.tsx`).
- [x] Validation pass (frontend typecheck).
- [!] `npm run build` failed in sandbox with `spawn EPERM` from esbuild process launch; not a code type error.
- [x] Phase 1 hardening migration added for atomic quota counters + RPC functions (`consume_generation_quota`, `release_generation_quota`).
- [x] Generation routes now use atomic quota consumption and fail-safe usage handling.
- [x] Course persistence now syncs relational `course_modules` + `module_lessons` in DB (not payload-only).
- [x] Quiz outcomes now persist to `quiz_attempts` and `lesson_attempts` tables.
- [x] Validation pass (server lint + frontend typecheck).
