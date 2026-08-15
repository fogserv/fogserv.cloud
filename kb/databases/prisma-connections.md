# Prisma Connection Management

**Status:** Active  
**Last Updated:** January 30, 2026 03:06 AM  
**Session:** Documenting Prisma connectivity for KB stores  
**Tags:** Prisma, database, pooling

---

## Summary
This page explains how fogserv.cloud wires Prisma into the stack, keeps credentials secure, and avoids connection saturation while staying compatible with Forgejo-driven GitOps flows.

## Context
Agents rely on Prisma for data access. Keeping `DATABASE_URL`, `PRISMA_ORM`, and `PRISMA_ANY` consistent across environments—logically defined through Dotenvx—means no agent ever introduces drift or connection issues.

## Connection & Pooling Strategy
- Define every environment’s `DATABASE_URL` in `.env`, `.dotenvx`, or the production secret store; Prisma reads the values through Dotenvx wrappers.  
- Generate the Prisma client and migration history via the CLI so schema changes stay in Git alongside the code that uses them.  
- Enable pooling via PgBouncer, Neon, or the Prisma Data Proxy before agents with long-running tasks touch the database. Keep telemetry on query latency and pool health so the KB can point to saturation incidents.

## Security & Lifecycle
- Role-based credentials separate read-only agents from writers; store each credential set in Dotenvx and rotate them regularly.  
- Document which Prisma workloads use which secret (client, migrations, reporting) so tickets capture the reason behind each rotation.  
- Prisma Data Proxy or PgBouncer minimizes credential sprawl by centralizing pooling and reducing the number of clients that hold direct database secrets.

## Next Steps
- Expand this entry with telemetry links (connection pool metrics, query times) so agents can correlate incidents with specific credentials.  
- Link to Forgejo Issues covering recent connection errors for retrospective analysis.  
- Review the Prisma CLI scripts to ensure they always run through `dotenvx run --` for consistent secrets loading.

## Sources & Related
- `../research/prisma.md` for the citation-backed strategy  
- Prisma docs on connection management and pooling  
- Prisma Data Proxy documentation  
- Prisma Migrate workflow guides  
- `../sysadmin/dotenvx.md` for secrets/configuration links  
- `../agentic/ai-server-management.md` for the agentic connection narrative

## Change Log
- January 30, 2026 03:06 AM — Shifted into KB store layout and clarified pooling/security guidance for ticketed rotations.
