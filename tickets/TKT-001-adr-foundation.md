# TKT-001: Author ADR-001/002/003 for V2 Foundation

## Problem Statement
Phase 1 contains major architectural moves (server-side generation, DB-first progress, entitlement-ready APIs). Without explicit decisions, implementation will drift and create rework.

## Goal
Create three architecture decision records in `/docs/adr/` that lock scope and trade-offs for Phase 1.

## Deliverables
- `docs/adr/ADR-001-server-side-generation.md`
- `docs/adr/ADR-002-db-first-progress.md`
- `docs/adr/ADR-003-entitlement-ready-api-contracts.md`

## Scope
- In:
  - Context, decision, alternatives considered, trade-offs, consequences, rollout notes.
  - Explicit migration implications for frontend and backend.
- Out:
  - Code implementation.
  - Pricing and billing provider details.

## Dependencies
- None.

## Acceptance Criteria
- 3 ADR files exist in `/docs/adr/`.
- Each ADR includes:
  - Status (`Proposed` or `Accepted`)
  - Date
  - Decision
  - Alternatives
  - Trade-offs
  - Consequences
- ADRs are internally consistent (no contradictory contracts).

## Test Plan
- Manual review checklist:
  - All required sections present.
  - API contract conventions match current Express stack.
  - Data ownership model aligns with Supabase RLS.

## Rollback Plan
- If disputed, set ADR status to `Superseded` and publish replacement ADR with cross-links.

## Effort
- Estimate: 0.5-1 day
- Owner: Architecture Lead
