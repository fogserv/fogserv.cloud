# TanStack Research Log

**Status:** Active  
**Last Updated:** January 30, 2026 03:49 AM  
**Session:** Surveyed TanStack Query, Router, Table, and Devtools for UI instrumentation  
**Tags:** TanStack, query, router, table

---

## Summary
TanStack’s ecosystem (Query, Router, Table, Devtools) emphasizes explicit caching, loaders/actions, and dev tooling that fits agentic dashboards tied to GitOps data.

## Layer 1: Query fundamentals
- `QueryClient` defaults (retry, suspense, staleTime) become the foundation for agent dashboards by preventing manual refresh loops.
- Query keys must be precise; TanStack docs recommend nested arrays so agents can target subset invalidations without re-fetching entire graphs.
- Devtools surface `queryKey`, cache duration, and errors; ship them in dev vs. prod to let agents inspect caching before merging.

## Layer 2: Router + Table patterns
- TanStack Router supports loaders/actions that map to GitOps tickets, enabling data prefetching and optimistic updates while neatly tying UI actions to KB updates.
- Tables derive their data from the Query cache so a single source of truth avoids duplication; the docs also cover column pinning/aggregation for telemetry dashboards.

## Layer 3: Devtools + observability
- Devtools and `useHydrate` assist in debugging caching mismatches; the docs highlight bundling them only in dev builds yet enabling remote debugging for agents.
- TanStack Table’s plugin system (sorting/filtering) fosters the dynamic network map we plan for the KB browser.

## Next Steps
1. Capture Query key conventions in `frontend/tanstack.md` so every UI change maps to a KB entry and GitOps commit.  
2. Document the Router loader/action pattern for operations dashboards, tying them to specific Forgejo Issues.  
3. Keep the Devtools workflow in the KB so agents can verify React state before merging.

## Sources & Related
- TanStack Query overview (retry, cache, metadata).
- Query key hygiene + caching recommendations.
- Router guide (loaders, actions).
- TanStack Table introduction (cache-driven tables).
- Devtools documentation for debugging.
- Table plugin details for sorting/aggregation.

## Change Log
- January 30, 2026 03:49 AM — Logged TanStack best practices for queries, routers, tables, and devtools with citations for the KB browser roadmap.
