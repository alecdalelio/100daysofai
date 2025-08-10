Audit Supabase usage and standardize it.

Tasks:
- List all Supabase calls across the app. Ensure imports come from `src/lib/supabase.ts` only (no direct `@supabase/supabase-js` in app code).
- Check each write/mutation has try/catch and user-facing toasts.
- Identify duplicated patterns that should be moved into helpers.

Deliverables:
- Short findings list (issues + files).
- Implement safe, trivial refactors now (imports, error handling, toasts).
- Do not edit `src/components/ui/**`.
- Finish by running: `npm run typecheck && npm run lint && npm run build` and posting a result summary.

