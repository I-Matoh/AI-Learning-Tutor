# TKT-005: Add Sync Status Component and Wire to Progress Saves

## Problem Statement
Users currently lack visibility into whether progress is safely saved, which reduces trust and perceived premium quality.

## Goal
Implement visible sync/save state in lesson progression UI.

## Deliverables
- Reusable sync status UI component with states:
  - `Saving...`
  - `Saved`
  - `Sync failed`
- Last-saved timestamp rendering
- Wiring to course/progress save actions

## Scope
- In:
  - UI component + state transitions
  - Hook into existing save/update flows
  - Retry affordance on failed sync
- Out:
  - Offline queueing engine
  - Multi-device conflict resolution

## Dependencies
- TKT-002 (DB persistence available)
- TKT-004 (frontend backend migration baseline)

## Acceptance Criteria
- Sync status visible during and after progression actions.
- Failed save state appears when backend persistence fails.
- User can trigger retry without page refresh.

## Test Plan
- Simulate normal save: `Saving...` -> `Saved` + timestamp.
- Simulate API failure: `Saving...` -> `Sync failed`.
- Retry action returns to `Saved` on recovery.

## Rollback Plan
- Hide component behind feature flag if unexpected UI regressions occur.

## Effort
- Estimate: 0.5-1 day
- Owner: Frontend Engineer
