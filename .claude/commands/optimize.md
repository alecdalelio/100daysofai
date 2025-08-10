Analyze performance hotspots and implement small wins.

Do:
- Identify components prone to unnecessary re-renders (unstable props, inline lambdas, heavy derived data).
- Propose 3 improvements; implement the top 1–2 low-risk ones now (memoization, splitting, stable callbacks).
- Avoid premature optimization; keep diffs small and readable.

Close with:
- Before/after reasoning (qualitative)
- Any follow-ups to measure (React Profiler notes, potential lazy-loads)
- Run gates: `npm run typecheck && npm run lint && npm run build` and report.

