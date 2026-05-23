# PR Checklist (Phase 1 Standards)

## Architecture
- [ ] `frontend/App.tsx` changes do not add new business logic; logic is moved to `src/services` or feature modules.
- [ ] API contracts remain backward-compatible (`/api/generate/course|lesson|quiz`, `/api/usage`).
- [ ] DB remains source of truth for learning progress; local cache is fallback only.

## Security
- [ ] No client-exposed model keys used in production paths.
- [ ] All generation routes require auth middleware.
- [ ] Input validation is enforced with Zod before service calls.
- [ ] No sensitive tokens or secrets logged.
- [ ] RLS-sensitive tables are accessed with correct user scoping.

## Code Quality
- [ ] `npm run typecheck` passes in `frontend/`.
- [ ] `npm run lint` passes in `server/`.
- [ ] New code avoids race conditions in async state updates.
- [ ] Errors are surfaced with actionable and safe messages.

## Reliability & UX Trust
- [ ] Sync states are accurate: `Saving...` -> `Saved` / `Sync failed`.
- [ ] Retry paths work without page reload.
- [ ] Quota metadata (`resetsAt`) matches server enforcement window.

## Test Evidence (attach in PR)
- [ ] Frontend typecheck output
- [ ] Backend lint output
- [ ] Manual flow: login -> generate course -> open lesson -> complete quiz -> refresh -> resume
- [ ] Failure flow: simulate save failure and verify retry recovery

