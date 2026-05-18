# ADR-001: Server-Side AI Generation Ownership

- Status: Accepted
- Date: 2026-05-18

## Context
Client-side model calls expose generation keys and prevent trustable quotas, telemetry, and policy enforcement.

## Decision
All production generation flows run through authenticated backend endpoints (`/api/generate/course`, `/api/generate/lesson`, `/api/generate/quiz`). Model keys remain server-only.

## Alternatives
1. Keep client-side generation with local quota.
2. Hybrid client-first generation with backend fallback.

## Trade-offs
- Pros: key custody, consistent validation, centralized error handling, auditable usage.
- Cons: added backend latency and operational complexity.

## Consequences
- Frontend must attach JWT and consume typed API responses.
- Server must validate request and response contracts and handle retries/failures.

## Rollout Notes
- Keep dev-only fallback behind explicit environment flag.
- Ship course endpoint first, then lesson and quiz endpoints.
