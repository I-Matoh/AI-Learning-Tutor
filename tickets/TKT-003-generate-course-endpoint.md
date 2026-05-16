# TKT-003: Implement `POST /api/generate/course` with Contract Validation

## Problem Statement
Course generation currently occurs client-side, which weakens key security, quota control, and observability.

## Goal
Implement authenticated backend endpoint for course generation with strict request/response contracts.

## Deliverables
- New route handler: `POST /api/generate/course`
- Auth middleware enforcement
- Zod validation for request payload and AI response contract
- Standardized error responses
- Usage event write hook (if available from TKT-002)

## Scope
- In:
  - Input validation (`topic`, `skillLevel`)
  - Secure model key usage on server
  - Response shape compatibility with frontend `Course` type
- Out:
  - Lesson and quiz generation endpoints (separate tickets)
  - Entitlement logic beyond basic auth/quota gate

## Dependencies
- TKT-001
- TKT-002 (for usage event persistence; can be feature-flagged if not ready)

## Acceptance Criteria
- Unauthorized requests return `401`.
- Invalid payloads return `400` with safe validation errors.
- Success returns validated course JSON with modules/lessons.
- Server errors return generic `500` in production-safe format.

## Test Plan
- API smoke tests:
  - valid auth + valid payload => `200`
  - no auth => `401`
  - bad payload => `400`
- Contract tests confirm JSON schema compatibility.

## Rollback Plan
- Keep old client path behind temporary fallback flag during rollout.
- If severe failures occur, route traffic back to fallback while fixes ship.

## Effort
- Estimate: 1-1.5 days
- Owner: Backend Engineer
