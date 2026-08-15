# Prisma Research Log

**Status:** Active  
**Last Updated:** January 30, 2026 03:47 AM  
**Session:** Investigated Prisma connection management, pooling, and Data Proxy guidance  
**Tags:** Prisma, Data Proxy, pooling

---

## Summary
Prisma’s docs now split guidance between raw connection settings (`Prisma Client`), migrations, and connection pooling/Data Proxy layers for high-concurrency workloads.

## Layer 1: Connection basics
- Keep every `DATABASE_URL` or `PRISMA_ANY` entry in `.env`/Dotenvx. Prisma Client changes (e.g., `connectTimeout`, `poolTimeout`) are handled via `schema.prisma` or `datasource` block settings.
- Migration scripts (`prisma migrate`) must run inside the same environment that agents use, so they share the same credentials and drift detection.

## Layer 2: Pooling strategies
- In long-running (agentic) workloads, Prisma recommends either the Data Proxy or an external pooler (PgBouncer, Neon) to avoid connection exhaustion; Data Proxy also enforces connection reuse automatically.
- Monitoring query latency, pool saturation, and retries (via Prisma’s logging/tracing) lets agents correlate incidents with specific credentials or workloads before they escalate.

## Layer 3: Security & instrumentation
- Use separate read-only and write credentials stored in Dotenvx; rotate them through Forgejo Actions that update the encrypted `.env.production` and log audit events.
- Prisma Data Proxy hides the connection string, reducing credential sprawl, while the Prisma CLI still needs API keys stored inside Dotenvx or a vault.

## Next Steps
1. Document the credential split and rotation cadence inside `databases/prisma-connections.md`.  
2. Link pool saturation telemetry to the GitOps issue log for quick forensics.  
3. Keep `Dotenvx` instructions updated so migrations share the same secret pipeline.

## Sources & Related
- Prisma connection management page (timeouts, logging).
- Prisma connection pooling overview (Data Proxy, PgBouncer).
- Prisma migrations guide for context alignment.

## Change Log
- January 30, 2026 03:47 AM — Added Prisma connection layering notes, pooling guidance, and security expectations for agentic workloads.
