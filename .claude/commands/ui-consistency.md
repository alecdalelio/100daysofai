Adopt shadcn primitives where obvious.

Scope:
- Scan for raw HTML where we have a matching `src/components/ui/*` primitive (Button, Input, Card, Alert, Skeleton, etc.).

Do:
- Convert only safe, obvious cases; keep edits small and cohesive.
- Preserve behavior and styling; improve accessibility where trivial (labels, roles, focus).
- Avoid changes inside `src/components/ui/**`.

Finish:
- List changed files briefly.
- Run: `npm run typecheck && npm run lint && npm run build` and post a quick summary.

