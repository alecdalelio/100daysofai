!npm run typecheck || true
!npm run lint || true

Stabilize and get the repo green.

Goals:
- Group type and lint issues by root cause
- Implement the smallest safe fixes now
- Keep edits scoped to `src/pages/**`, `src/components/**`, `src/lib/**` (avoid `src/components/ui/**`)
- Use `src/lib/supabase.ts` helpers; keep UI consistent with shadcn

Steps:
1) Summarize typecheck/lint failures by category with offending files.
2) Propose minimal cohesive edits to fix them.
3) Implement the fixes now (limit scope, preserve behavior).
4) Re-run: `npm run typecheck && npm run lint && npm run build` and report results.
5) If still failing, iterate once more; otherwise, stop and summarize changes and follow-ups.

