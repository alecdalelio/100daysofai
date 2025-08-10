## Claude Project Guide

### Overview
Vite + React 18 + TypeScript app using shadcn-ui and Tailwind. Data/auth/storage via Supabase. Routing with `react-router-dom`. UI primitives in `src/components/ui`. Supabase client and helpers in `src/lib/supabase.ts`. Query cache via `@tanstack/react-query`.

### Tech Stack
- Build/dev: Vite
- Lang: TypeScript 5 (strict)
- UI: React 18 + shadcn-ui + Tailwind
- Routing: `react-router-dom`
- Forms/validation: `react-hook-form`, `zod`
- Data: Supabase JS v2 (`@supabase/supabase-js`)
- Server cache: `@tanstack/react-query`

### Environment
- Node: >=18
- `.env` (repo root):
  - `VITE_SUPABASE_URL=<your-url>`
  - `VITE_SUPABASE_ANON_KEY=<your-anon-key>`
- Do not commit secrets; never hardcode keys.

### Commands
- Install: `npm i`
- Dev server: `npm run dev`
- Build: `npm run build` (use `npm run build:dev` for fast dev build)
- Preview: `npm run preview`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`

### Editing Boundaries
- Prefer edits in `src/pages/**`, `src/components/**`, `src/lib/**`
- Avoid editing `src/components/ui/**` (shadcn primitives)
- Keep routes in `src/App.tsx`

### Code Style & Conventions
- Functional components with typed props; no `any` unless justified.
- ES modules only; destructure imports.
- Naming:
  - Components: `PascalCase`
  - Hooks/utils: `camelCase`
  - Files: match default export where reasonable.
- Keep Tailwind classes readable; use `clsx`/`tailwind-merge` when helpful.

### Supabase Usage
- Import from `src/lib/supabase.ts`: `supabase`, `callFn`, auth helpers.
- Edge Functions: `await callFn('name', { body, timeoutMs })` (60s default timeout). Handle thrown errors.
- Auth: use `signInWithEmail`, `signUpWithEmail`, `signInWithProvider`, `signOut`.
- Add clear error handling and user-facing toasts for all writes.
- Do not import directly from `@supabase/supabase-js` in app code.

### Routing
- Routes are in `src/App.tsx`. Protected routes wrap with `ProtectedRoute`.
- Add new pages under `src/pages/*` and register in `src/App.tsx`.
- Ensure catch-all `*` remains last.

### Forms
- Use `react-hook-form` + `zod` for validation when user input is involved.
- Surface validation errors near fields and as a toast for form-level errors.

### UI & A11y
- Prefer primitives from `src/components/ui/*` (Button, Input, Card, Alert, Skeleton, etc.).
- Keep interactive targets accessible (labels, roles, focus states).
- Dark/light themes via `ThemeProvider` (`next-themes`).

### Data Fetching & State
- Prefer `@tanstack/react-query` for server state:
  - Handle loading (Skeleton), error (Alert/Toast), and empty states.
  - Use stable query keys; avoid unnecessary invalidations.
- Local state with React hooks only; derive minimal state.

### Error, Empty, Loading Standards
- Loading: use `Skeleton` or minimal spinners.
- Error: `Alert` + toast with actionable copy.
- Empty: concise placeholder and primary call-to-action.

### Performance
- Avoid unnecessary re-renders (stable props, `useCallback`/`useMemo` for heavy derivations).
- Split large components; lazy-load obviously heavy pages if needed.
- Clean up subscriptions/listeners in `useEffect`.

### Quality Gates (Claude must ensure)
- Compiles: `npm run build`
- Lints: `npm run lint`
- Type-safe: `npm run typecheck`
- No secrets leaked
- Routes navigable; states handled (loading/error/empty)

### Common Tasks for Claude
- Add a page:
  1) Create `src/pages/MyPage.tsx`
  2) Register it in `src/App.tsx`
  3) Use shadcn primitives
  4) Validate with RHF + zod
- Supabase call:
  - Prefer helpers; add try/catch and user-friendly toast
- Edge Function:
  - `await callFn('function_name', { body })` and handle errors

### High-ROI Workflows
- Route & data-flow map from `src/App.tsx`, mark protected routes.
- Supabase usage audit: ensure calls come from `src/lib/supabase.ts` and have error toasts.
- Type/lint stabilization until clean.
- UI consistency pass: adopt shadcn primitives where obvious.
- Fill missing loading/error/empty states on key pages.
- Remove dead code and heavy unused deps.

### Prompt Recipes
Kickoff:
Stabilize and optimize pass:
1) Map routes and data flows
2) Fix type/lint issues
3) Enforce UI/Supabase conventions
4) Identify quick wins
Deliverables: roadmap (6–10 items), implement top 2–3 now, then run typecheck/lint/build and report.

Feature:
Task: <brief>
Acceptance:
<criteria>
Constraints:
Edit only pages/components/lib
Use supabase helpers and shadcn
Finish: run typecheck/lint/build and report.

Review:
Do a focused code review for <files/area>, list issues by severity with specific edits. Ensure suggestions align with conventions above.


### PR Guidelines
- Summary, rationale, user impact
- Env/migration steps if any
- Acceptance criteria + how verified locally (include commands)
- Risks and rollback

### Power Tips
- Use background commands frequently (`npm run typecheck && npm run lint && npm run build`).
- Clear context between tasks (`/clear`) to avoid drift.
- Keep this file updated as standards evolve.
- Be brutally honest—point out problems directly.