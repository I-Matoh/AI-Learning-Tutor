# V2 Implementation Plan

## Scope
This plan operationalizes Phase 1 from `v2.md` into sprint-ready execution for 3 weeks.

## Outcomes for Phase 1
- AI generation moved to authenticated backend endpoints.
- Learning progress persisted in Supabase (DB as source of truth).
- Frontend monolith split into feature modules with clear boundaries.
- Premium trust UX improvements (loading/error/recovery/sync status).

## Skill-Driven Execution Order
1. `product-manager` for KPI alignment and scope control.
2. `architecture` for ADR decisions and trade-offs.
3. `database-design` + `supabase-automation` for schema + RLS.
4. `nodejs-backend-patterns` for generation APIs and service layering.
5. `software-architecture` for frontend modularization.
6. `executing-plans` for batch implementation/checkpoints.

## Working Files (create at project root)
- `task_plan.md`
- `findings.md`
- `progress.md`

## Sprint Plan (3 x 1 week)

## Sprint 1: Backend Ownership + Data Foundation

### Task 1: Create ADRs for V2 foundation
- Owner: Architecture
- Dependencies: none
- Deliverables:
  - ADR-001: AI generation server-side ownership
  - ADR-002: DB-first progress model with local cache fallback
  - ADR-003: Entitlement-ready API contract patterns
- Acceptance criteria:
  - Each ADR includes alternatives, trade-offs, and final decision.

### Task 2: Design and apply Supabase schema
- Owner: Data/Backend
- Dependencies: Task 1
- Deliverables:
  - Tables: `courses`, `course_modules`, `module_lessons`, `lesson_attempts`, `quiz_attempts`, `mastery_scores`, `usage_events`
  - Indexes on user_id + updated_at and lookup keys
- Acceptance criteria:
  - Schema migration runs cleanly.
  - Test user can create/read only own rows.

### Task 3: Add RLS policies for all Phase 1 tables
- Owner: Security/Data
- Dependencies: Task 2
- Deliverables:
  - Per-table `SELECT/INSERT/UPDATE/DELETE` user-scoped policies
- Acceptance criteria:
  - Cross-user access attempts denied.
  - Own-data access succeeds.
 
### Task 4: Implement generation endpoints (server)
- Owner: Backend
- Dependencies: Task 1
- Deliverables:
  - `POST /api/generate/course`
  - `POST /api/generate/lesson`
  - `POST /api/generate/quiz`
  - Auth required on all endpoints
- Acceptance criteria:
  - Endpoints return validated JSON contracts.
  - Failure responses are consistent and safe.

### Task 5: Add user-level usage ledger and quota enforcement
- Owner: Backend/Data
- Dependencies: Tasks 2, 4
- Deliverables:
  - Usage events written per generation call
  - Quota checks before generation
- Acceptance criteria:
  - Quota exceeded returns `429` with reset hint.
  - Usage endpoint returns real user stats.

### Sprint 1 Validation
- API smoke tests for all generation endpoints.
- RLS verification script for cross-user denial.
- Manual run: authenticated user generates course + lesson + quiz end-to-end.

## Sprint 2: Frontend Migration to Durable State

### Task 6: Introduce frontend service layer for backend generation
- Owner: Frontend
- Dependencies: Sprint 1 Tasks 4, 5
- Deliverables:
  - Replace direct `groqService` production path with backend API client
  - Keep local dev fallback behind explicit flag
- Acceptance criteria:
  - No production calls to client-side model key path.

### Task 7: Persist progress to Supabase (DB-primary)
- Owner: Frontend/Data
- Dependencies: Sprint 1 Tasks 2, 3
- Deliverables:
  - Save/resume courses and progress from DB
  - Local cache only for performance fallback
- Acceptance criteria:
  - Progress survives logout/login and device switch.

### Task 8: Split `frontend/App.tsx` into feature modules
- Owner: Frontend
- Dependencies: none
- Deliverables:
  - `features/onboarding`
  - `features/course-map`
  - `features/lesson-viewer`
  - `features/quiz`
  - shared typed API/service module
- Acceptance criteria:
  - `App.tsx` becomes orchestration shell only.
  - Existing behavior remains unchanged.

### Sprint 2 Validation
- Regression pass: onboarding -> course -> lesson -> quiz -> unlock flow.
- State durability test across refresh and re-login.
- Typecheck/build pass in frontend.

## Sprint 3: Premium Trust UX + Reliability

### Task 9: Add premium-grade loading and failure states
- Owner: Frontend
- Dependencies: Sprint 2
- Deliverables:
  - Skeletons for course/lesson/quiz loading
  - Recovery actions: retry/regenerate/go back
- Acceptance criteria:
  - No dead-end error screens.
  - Each failure path has at least one recovery action.

### Task 10: Add sync and save confidence indicators
- Owner: Frontend
- Dependencies: Task 7
- Deliverables:
  - `Saving...` / `Saved` / `Sync failed` state surfaces
  - Last saved timestamp on learning screens
- Acceptance criteria:
  - Users can see sync status at all times during progression.

### Task 11: Add telemetry for phase-1 KPIs
- Owner: Full-stack
- Dependencies: Sprints 1-2
- Deliverables:
  - Events for activation, lesson completion, quiz attempts, generation failures
  - Dashboard-ready metric definitions
- Acceptance criteria:
  - KPI queries available for week-over-week tracking.

### Sprint 3 Validation
- End-to-end user run with intermittent failure simulation.
- Telemetry checks for core funnel events.
- Backend and frontend logs confirm stable error handling.

## Backlog Ready Ticket Format
Use this template for each ticket:
- Title
- Problem statement
- Scope in/out
- Dependencies
- Acceptance criteria
- Test plan
- Rollback plan

## Risks and Mitigations
- Risk: schema churn during migration
  - Mitigation: add versioned migrations + rollback scripts.
- Risk: behavior regression from App.tsx split
  - Mitigation: preserve contracts and add regression checklist.
- Risk: quota false positives
  - Mitigation: include idempotency key + event de-duplication.

## Definition of Done (Phase 1)
- All generation calls proxied through authenticated backend in production.
- User progress and attempts stored server-side with RLS.
- Frontend split into feature modules with clear service boundaries.
- Trust UX improvements shipped (skeletons, recovery, sync visibility).
- KPI telemetry present for activation/completion/quality tracking.

## Immediate Next 5 Tickets
1. Write ADR-001/002/003 in `/docs/adr/`.
2. Add Supabase migration for phase-1 learning tables.
3. Implement `POST /api/generate/course` with contract validation.
4. Replace frontend course generation call with backend client.
5. Add sync status component and wire to progress-save actions.
