# TKT-002: Add Supabase Migration for Phase 1 Learning Tables

## Problem Statement
Learning data currently relies heavily on local storage. Premium reliability requires durable, user-scoped persistence with enforceable access controls.

## Goal
Create and apply initial SQL migration for Phase 1 learning/progress tables.

## Deliverables
- Migration SQL file under server/db or supabase migrations path (project convention to be confirmed).
- Tables:
  - `courses`
  - `course_modules`
  - `module_lessons`
  - `lesson_attempts`
  - `quiz_attempts`
  - `mastery_scores`
  - `usage_events`
- Primary and foreign keys, timestamps, and user-scoped indexes.

## Scope
- In:
  - Schema creation with relational integrity.
  - Minimal columns needed for current web flow + usage accounting.
- Out:
  - Full subscription/billing schema.
  - Analytics warehouse modeling.

## Dependencies
- TKT-001 (ADRs finalized).

## Acceptance Criteria
- Migration runs cleanly on a fresh environment.
- Core relationships enforce referential integrity.
- Indexes exist for `user_id`, `course_id`, and time-based queries.

## Test Plan
- Apply migration in dev.
- Insert/select smoke checks for one test user.
- Verify FK constraints reject invalid references.

## Rollback Plan
- Provide down migration or explicit drop script for new tables in reverse dependency order.

## Effort
- Estimate: 1 day
- Owner: Data/Backend Engineer
