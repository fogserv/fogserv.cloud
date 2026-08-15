# Dotenvx (environment templating)

**Status:** Active  
**Last Updated:** January 30, 2026 03:06 AM  
**Session:** Dotenvx guidance refresh for KB stores  
**Tags:** secrets, dotenvx, configuration

---

## Summary
Dotenvx provides layered configuration, schema validation, and encryption for fogserv.cloud. It lets agents manage `.env`, `.env.production`, and `.dotenvx` without leaking secrets and fits into the GitOps + KB workflow.

## Context
The stack relies on Dotenvx for consistent runtime builds: local dev, staging, and production all share the same template, but secrets stay encrypted or are injected via Forgejo Actions. This entry complements `SECRETS_MANAGEMENT.md` by describing how to position Dotenvx in agentic flows.

## Recommended Usage
1. Base values live in `.env.example` with placeholder descriptions; local developers copy that into `.env`.  
2. Store environment overrides inside `.dotenvx` and promote the file through CI/CD using dedicated keys (`bun run secrets:encrypt`).  
3. Use Dotenvx CLI wrappers for scripts (`bun run dev`, `bun run db:push`, `bun run prisma studio`) so the correct configuration loads automatically.  
4. Document every variable in `/kb/dotenvx.md` along with its purpose and the tests or agents depending on it.

## Secrets Posture
- Never commit plaintext secrets. Dotenvx allows you to encrypt `.env.production` or rely on CI/CD injection.  
- Rotate secrets with automated Forgejo Actions: update `.dotenvx`, validate in staging, and record the rotation in `/kb/secrets.md`.  
- Agents should only load the subset of variables they need; enforce this policy via Dotenvx schema validation or instructions inside the entry.

## Agent Integration
- When fogserv-ai agents run deployments, they reference Dotenvx variables injected through Forgejo Actions, never the local `.env`.  
- Ticketing instructions specify that secret names (e.g., `PRISMA_ORM`, `GIT_TOKEN`) are referenced by name rather than value.  
- Document each secret operation (creation, rotation, revocation) inside `/kb/secrets.md` and link the note to the triggering issue.

## Next Steps
- Extend this entry with CLI snippets for rotating secrets and auditing exposures.  
- Validate Dotenvx schema with Forgejo Actions before merging to avoid runtime surprises.  
- Cross-link to `dotenvx.md` from any agent that consumes sensitive data so the expectations stay visible.

## Sources & Related
- Dotenvx research log (`../research/dotenvx.md`) for documentation citations  
- Nuxt runtime config guide  
- `../sysadmin/secrets.md` for how Dotenvx keys show up in appointments  
- `../databases/prisma-connections.md` and `../agentic/ai-server-management.md` for connected workflows

## Change Log
- January 30, 2026 03:06 AM — Reframed Dotenvx guidance into the KB store template and linked agent behaviors to ticket instructions.
