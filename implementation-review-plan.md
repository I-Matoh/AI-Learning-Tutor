# AI Learning Tutor Implementation Review Plan

Date: 2026-06-11

## Review Scope

- Reviewed existing V2 plans: `v2.md`, `v2-implementation-plan.md`, `task_plan.md`, `progress.md`, and tickets.
- Reviewed core app code across `frontend`, `server`, `mobile`, Supabase migrations, environment examples, and README docs.
- Applied relevant local skills from `skills/skills`: `architecture`, `software-architecture`, and `nodejs-backend-patterns`.
- Validation run:
  - `frontend`: `npm run typecheck` passed.
  - `frontend`: `npm run build` blocked locally by `esbuild` `spawn EPERM`.
  - `server`: `npm run lint` passed.
  - `server`: `npm test` failed because `jest` is configured but not installed.

## Executive Summary

Phase 1 is partially implemented and directionally correct: generation is routed through authenticated backend APIs, Supabase persistence exists, and the frontend has begun moving into feature folders. The main remaining risk is that the project notes overstate readiness. Database migrations likely fail as written, tests are not actually available, deployment/static serving paths are inconsistent, and several UX/security details still prevent a reliable premium product.

The best next move is a hardening phase before adding new premium features. Fix migration correctness, deployment config, generation fallbacks, test setup, and stale documentation first. Then split the learning flow into domain modules, add robust telemetry, and only then build mastery, mobile parity, and monetization.

## Priority Findings

### P0: App Must Build, Migrate, And Deploy Reliably

- Supabase migrations use `create policy if not exists`, which is not valid PostgreSQL policy syntax in standard Supabase migrations. This appears in `server/db/migrations/2026-05-18_phase1_learning_schema.sql` and `server/db/migrations/2026-05-27_phase1_hardening.sql`. Replace with guarded `drop policy if exists` plus `create policy`, or `do $$ begin if not exists (...) then create policy ... end if; end $$;`.
- The server serves static assets from `../dist`, but the Vite frontend builds to `frontend/dist`. Either change `server/index.js` to serve `../frontend/dist`, or add a root build step that copies assets to `dist`.
- The production HTTPS warning condition is wrong: `!process.env.HTTPS === 'true'` always evaluates incorrectly. Use `process.env.HTTPS !== 'true'`.
- `server/package.json` declares `npm test`, but `jest` is not installed. Either add Jest and tests or remove/replace the script with a real validation command.

### P1: Generation Reliability And Data Quality

- `generationService` returns empty fallback modules/questions when model JSON parsing fails. Server response schemas then reject the fallback, turning recoverable AI output issues into 500s.
- Course generation asks for exactly 5 modules and 4 lessons each but does not normalize or repair model output before validation.
- API client methods cast `payload.data` directly to app types. Add runtime validation on the client or shared contract schemas to prevent broken UI state from malformed responses.
- Quiz answers and pass/fail are evaluated client-side. This is acceptable for MVP, but premium progress, mastery, and certificates should be validated server-side.

### P1: Progress Sync And Learning Flow

- `Dashboard` still owns lesson generation, quiz generation, completion logic, unlocking, quiz attempt recording, and sync state. Split this before adding mastery or mobile parity.
- Completing a lesson updates the course state but not the `activeLesson` object, so the current lesson UI can remain stale until reselected.
- `completed_at` is set to the current timestamp on every save for completed lessons, which can erase the original completion moment.
- `recordQuizOutcome` silently returns on errors or missing rows, which can hide broken persistence and make analytics incomplete.

### P2: Trust, UX, And Documentation

- Root README is stale: it still labels backend as optional, shows Groq as a direct frontend dependency, includes `VITE_GROQ_API_KEY`, and contains mojibake/encoding artifacts.
- Onboarding shows "Trusted Partners" with major brands/institutions. Unless those are real partnerships, remove or rename this section.
- Theme toggle text contains replacement characters (`?? Light mode`, `?? Dark mode`), which looks broken in the first viewport.
- Error handling for lesson/quiz generation mostly logs to console without visible recovery actions.

### P2: Security And Production Readiness

- CSP still allows `unsafe-inline`, CDN script domains, and direct Groq connections. After backend migration, production CSP should remove client Groq access and tighten script/style policy.
- Rate limiting is in-memory, which does not protect multi-instance production deployments. Keep it for dev, but move production generation/API limiting to Redis, Upstash, or Supabase-backed counters.
- `/health/detailed` is public. Protect it, remove memory details, or expose it only internally.

## Phased Implementation Plan

### Phase 0: Baseline Hardening

Goal: make the current Phase 1 work reproducibly before building more.

1. Fix Supabase migration policy syntax and verify migrations on a fresh project.
2. Fix frontend static asset serving/deployment path.
3. Fix the production HTTPS check.
4. Add a real root-level script map for `frontend`, `server`, and future `mobile` checks.
5. Decide on test runner setup; add Jest/Supertest or remove the broken `npm test` until ready.
6. Update `.env.example` and README so no client-side Groq key is documented.
7. Run validation: migration dry run, frontend typecheck, frontend build, server lint, server API smoke test.

Exit criteria:
- Fresh checkout can install, build, run server, and apply migrations using documented commands.
- README matches the actual backend-owned generation architecture.

### Phase 1: Backend Generation And Contract Reliability

Goal: make AI generation resilient, observable, and contract-safe.

1. Add schema repair/normalization for model output before response validation.
2. Add deterministic fallback course/quiz content that still satisfies schemas when model output is malformed.
3. Centralize API error shape and include retry-safe error codes.
4. Add server-side tests for validation errors, quota exceeded, generation success, and generation failure quota release.
5. Add request IDs and structured logs for generation latency/failure reasons.
6. Remove production CSP `connect-src` access to Groq from client policy.

Exit criteria:
- Model parse failures do not crash the learning flow.
- Generation endpoints have automated coverage for success, validation, quota, and failure paths.

### Phase 2: Durable Progress And Learning Domain Split

Goal: separate learning domain behavior from UI and make progress trustworthy.

1. Extract learning progression logic into a `learningProgress` domain module.
2. Extract lesson content loading into a service/hook with retry/error state.
3. Extract quiz session state into a quiz domain module or hook.
4. Update `activeLesson` after completion so UI reflects persisted state immediately.
5. Preserve first `completed_at` instead of overwriting it on every save.
6. Make quiz/lesson attempt persistence failures visible in sync status or telemetry.
7. Add tests for unlock rules, progress percent, completion timestamps, and quiz pass thresholds.

Exit criteria:
- `Dashboard` becomes mostly orchestration/rendering.
- Unlocking and progress rules are covered by tests and reusable by mobile.

### Phase 3: Premium Trust UX

Goal: remove dead ends and make the app feel reliable during failures.

1. Replace `alert` and console-only generation failures with inline recoverable states.
2. Add retry/regenerate/back actions for course, lesson, and quiz generation.
3. Add saved timestamp visibility on lesson screens, not only sidebar.
4. Replace unverified "Trusted Partners" with truthful trust signals: privacy, AI disclosure, progress durability, and quality commitment.
5. Fix encoding/mojibake throughout README and UI text.
6. Audit mobile and desktop layouts for text overflow, button wrapping, and first-viewport clarity.

Exit criteria:
- Every async failure path gives users a clear recovery action.
- First-run experience no longer contains questionable or broken trust signals.

### Phase 4: Mastery, Practice, And Analytics

Goal: turn the product from generated content into measurable learning progress.

1. Implement `mastery_scores` updates based on quiz attempts, retries, and lesson completion.
2. Add weak-topic tracking from missed quiz explanations and lesson metadata.
3. Add a "Today" view with next best lesson/practice action.
4. Add spaced repetition queue with due dates.
5. Add product analytics events for activation, course generation, lesson opened, quiz passed/failed, lesson completed, and sync failed.
6. Add KPI queries for retention, lesson completion, quiz pass rate, and generation failure rate.

Exit criteria:
- Users can see what to do next and why.
- Team can measure the core learning funnel from database/analytics events.

### Phase 5: Mobile Learning Parity

Goal: make mobile a real companion app, not an auth shell.

1. Reuse shared learning contracts and progression rules from Phase 2.
2. Add roadmap, lesson reader, quiz, and completion screens.
3. Add offline lesson cache with explicit sync status.
4. Add background-safe refresh of saved courses and attempts.
5. Add mobile-specific navigation and empty/error states.

Exit criteria:
- A signed-in mobile user can resume a web-created course, complete a lesson, take a quiz, and sync progress.

### Phase 6: Entitlements And Monetization

Goal: add paid capabilities only after trust and progress are solid.

1. Add `subscriptions` and `entitlements` schema.
2. Enforce limits server-side for generations, history, mastery dashboard, and exports.
3. Add contextual upgrade surfaces at natural high-intent moments.
4. Add billing-provider integration behind server-side webhooks.
5. Add entitlement tests for every gated API and UI path.

Exit criteria:
- Paid/free differences are enforced server-side and explained clearly in UI.

## Recommended Execution Order

1. Phase 0 first, because broken migrations/deployment invalidate all higher-level work.
2. Phase 1 next, because AI generation quality is the product's main value loop.
3. Phase 2 before new features, because mastery and mobile should reuse clean progression rules.
4. Phase 3 in parallel with late Phase 2 if needed, because UX recovery states are low-risk and high-impact.
5. Phase 4 and Phase 5 after the learning domain is stable.
6. Phase 6 last, because monetization should sell trustworthy progress, not just usage limits.

## Validation Matrix

- Database: fresh migration apply, RLS same-user allowed, cross-user denied, quota RPC concurrent calls.
- Backend: lint, endpoint tests, quota release tests, malformed model output tests, auth-required tests.
- Frontend: typecheck, production build, learning happy path, failed generation recovery, refresh/re-login persistence.
- Mobile: auth, course resume, lesson read, quiz submit, offline cache restore, sync conflict behavior.
- Product: activation event, lesson completion event, quiz attempt event, generation failure event, sync failure event.

