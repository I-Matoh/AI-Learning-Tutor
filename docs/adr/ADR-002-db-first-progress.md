# ADR-002: DB-First Learning Progress Model

- Status: Accepted
- Date: 2026-05-18

## Context
`localStorage` progress is fast but non-durable and cannot support multi-device continuity.

## Decision
Supabase becomes source of truth for course/progress/attempt data. Local storage is cache-only.

## Alternatives
1. Keep local-only storage.
2. Mirror writes but treat local as authority.

## Trade-offs
- Pros: durability, device sync, RLS-backed ownership, analytics readiness.
- Cons: sync complexity, conflict handling, backend dependency for trust state.

## Consequences
- Add learning tables + RLS policies.
- UI surfaces save/sync confidence (`Saving...`, `Saved`, `Sync failed`).

## Rollout Notes
- Start with write-through behavior.
- Add offline queueing in a later phase.
