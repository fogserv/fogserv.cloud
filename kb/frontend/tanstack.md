# TanStack Stack (Query + Router + Table)

**Status:** Active  
**Last Updated:** January 30, 2026 03:06 AM  
**Session:** Front-end guidance for KB stores  
**Tags:** TanStack, UI, query

---

## Summary
TanStack Query, Router, and Table form the UI glue for fogserv.cloud. This entry captures how each library handles asynchronous state, routing, and tabular data so agentic dashboards stay consistent with GitOps data sources.

## Context
TanStack libraries surface agent telemetry, infrastructure status, and documentation so the UI can be both a portal for humans and a dashboard for autonomous agents. Aligning caching, routing, and table derivations with the query cache ensures the UI reflects the live GitOps state.

## Query Best Practices
- Use TanStack Query v5+ and define a single source of truth per resource with meaningful `queryKey`s to ensure stale data gets refreshed automatically.  
- Apply `select` + `meta` before passing data to components, and tune `staleTime`/`cacheTime` per resource so expensive queries stay cached when needed.  
- Configure `QueryClient` defaults (retry policies, suspense, error boundaries) so agentic workflows benefit from consistent error handling across views.

## Router & Navigation
- TanStack Router powers query-indexed routes that mirror GitOps workflows; each route can include loaders/actions tied to the ticketing system.  
- Use loaders to fetch data before rendering and actions to mutate state in a way that leaves a clear trail (Action → mutate → record result in `/kb/`).

## Tables & Devtools
- TanStack Table derives inventories and network maps directly from the query cache, keeping the UI synchronized with GitOps state.  
- Install TanStack Devtools in development so every agent can inspect caches and verify caching policies before the change lands.

## Next Steps
- Sketch dashboards that link TanStack routes to their GitOps sources (commits, tickets, telemetry).  
- Document any custom queries or table derivations in this entry so future agents can understand the data flow.  
- Share the Devtools workflow and QueryClient defaults with the front-end agent handbook.

## Sources & Related
- `../research/tanstack.md` for the citation-backed playbook  
- TanStack Query documentation  
- TanStack Router guide  
- TanStack Table guide  
- TanStack Devtools documentation  
- `../agentic/ai-server-management.md` and `../agentic/agentic-workflows.md` for how front-end dashboards surf agent actions

## Change Log
- January 30, 2026 03:06 AM — Converted the TanStack guidance to the KB store template and documented query/router/table responsibilities.
