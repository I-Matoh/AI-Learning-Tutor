# Findings

- Existing frontend generated content directly with `VITE_GROQ_API_KEY`.
- `/api/usage` was placeholder-only and not DB-backed.
- `App.tsx` is monolithic; Phase 1 split is too large for one safe pass, so this implementation targets immediate ticketed foundations.
