# Claude Project Guide

## Overview
This is a Vite + React + TypeScript app using shadcn-ui and Tailwind. Data/auth/storage use Supabase. Routing is `react-router-dom`. UI primitives live under `src/components/ui`. Supabase client and helpers live under `src/lib/supabase.ts`.

## Tech Stack
- Build/dev: Vite (`npm run dev`, `npm run build`, `npm run preview`)
- Lang: TypeScript 5
- UI: React 18 + shadcn-ui + Tailwind
- Routing: `react-router-dom`
- Forms/validation: `react-hook-form`, `zod`
- Data: Supabase JS v2 (`@supabase/supabase-js`)
- Optional: `@tanstack/react-query` available for server cache

## Runbook
- Install: `npm i`
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck` (added in this change)
- Required env: see `.env.example`

## Environment
Create `.env` in repo root:
- `VITE_SUPABASE_URL=<your-url>`
- `VITE_SUPABASE_ANON_KEY=<your-anon-key>`

## Key Paths
- `src/lib/supabase.ts` — exports `supabase` and helpers:
  - `callFn(name, { body, token, timeoutMs })` wrapper for Edge Functions
  - `signInWithEmail`, `signUpWithEmail`, `signInWithProvider`, `signOut`
- `src/pages/*` — app pages
- `src/components/*` — shared components
- `src/components/ui/*` — shadcn primitives
- `supabase/functions/*` — Edge Functions (e.g. `generate_syllabus`)
- `supabase/migrations/*` — SQL migrations

## Conventions and Preferences
- Prefer functional components with TypeScript props.
- Use `src/lib/supabase.ts` client for DB/Auth; use `callFn` for Edge Functions.
- When adding server interactions, consider `@tanstack/react-query` for caching.
- Keep Tailwind classes readable; use `clsx`/`tailwind-merge` as needed.
- Favor shadcn primitives in `src/components/ui` for consistent UI.
- Do not commit secrets; never hardcode keys.
- Keep routes defined in `src/App.tsx`.

## Common Tasks for Claude
- Add a new page:
  1) Create `src/pages/MyPage.tsx`
  2) Register route in `src/App.tsx`
  3) Use shadcn UI primitives; keep styles minimal and consistent
  4) Validate forms with `react-hook-form` + `zod` if user input involved
- Supabase calls:
  - For auth: use exported helpers.
  - For Edge Functions: `await callFn('function_name', { body })` and handle thrown errors.
- Error handling:
  - Surface actionable toasts when user actions fail.
  - Use `try/catch` and user-friendly messages.

## Quality Gates (Claude should ensure)
- Compiles (`npm run build`) and lints (`npm run lint`)
- Type-safe (`npm run typecheck`)
- No secrets leaked
- Routes wired and links navigable
- Empty and error states covered


