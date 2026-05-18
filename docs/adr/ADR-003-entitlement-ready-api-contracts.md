# ADR-003: Entitlement-Ready API Contract Patterns

- Status: Accepted
- Date: 2026-05-18

## Context
Premium gating requires server-verifiable entitlement and usage decisions without API surface churn.

## Decision
Adopt authenticated JSON contracts with standardized envelopes and machine-readable error codes:
- Success: `{ data: ... }`
- Error: `{ error: { code, message, details? } }`

## Alternatives
1. Ad-hoc route response shapes.
2. Entitlements only in frontend logic.

## Trade-offs
- Pros: stable client integration, easier policy middleware insertion, better observability.
- Cons: upfront consistency work across routes.

## Consequences
- Generation routes include quota/validation gates before model calls.
- Usage ledger records are created per generation attempt.

## Rollout Notes
- Implement contract pattern for new Phase 1 generation routes first.
- Backfill legacy routes incrementally.
