# TKT-004: Replace Frontend Course Generation with Backend API Client

## Problem Statement
Frontend currently calls model generation directly; this bypasses server-side governance and blocks premium-grade quota and reliability control.

## Goal
Route course generation through backend endpoint from the web app.

## Deliverables
- API client function for `POST /api/generate/course`
- Replace direct course-generation call path in frontend flow
- Preserve existing UX states (loading, error, success)
- Optional controlled fallback in development mode only

## Scope
- In:
  - Update generation call site(s) in onboarding flow
  - Ensure auth token is attached to API request
  - Keep existing `Course` state handling intact
- Out:
  - Full refactor of lesson/quiz generation paths
  - Full `App.tsx` decomposition

## Dependencies
- TKT-003

## Acceptance Criteria
- Course generation uses backend endpoint in production path.
- No production call depends on `VITE_GROQ_API_KEY`.
- Existing onboarding success/failure behavior remains functional.

## Test Plan
- Manual flow: login -> submit topic -> receive course.
- Network check confirms request to `/api/generate/course`.
- Failure simulation confirms graceful UI error handling.

## Rollback Plan
- Keep previous generation path behind explicit feature flag during first release.

## Effort
- Estimate: 0.5-1 day
- Owner: Frontend Engineer
