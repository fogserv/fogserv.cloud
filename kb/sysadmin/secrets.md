# Secrets Management Reference

**Status:** Active  
**Last Updated:** January 30, 2026 03:07 AM  
**Session:** Documenting secrets posture for KB stores  
**Tags:** secrets, dotenvx, Prisma

---

## Summary
This entry mirrors `SECRETS_MANAGEMENT.md` but is formatted for the KB store. It describes how fogserv.cloud manages secrets across environments, how agents interact with Dotenvx, and how ticketing records every rotation.

## Context
Secrets span local development (`.env`), templated files (`.env.example`), production (`.env.production`), and encrypted keys (`.env.keys`). Dotenvx orchestrates the loading and optional encryption while Forgejo Actions inject secrets during deployments.

## Key Files
- `.env` – Local development use only and excluded from Git via `.gitignore`.  
- `.env.example` – Template that lists required variables along with descriptions; commit this file.  
- `.env.production` – Production config (keep encrypted or injected via CI/CD).  
- `.env.keys` – Encryption keys for Dotenvx; store them in your CI/CD secrets manager and never commit.  
- `.dotenvx` – Dotenvx config that describes schema, overrides, and how secrets merge across layers.

## Operational Steps
1. Install Dotenvx (`bun install @dotenvx/dotenvx --save-dev`).  
2. Copy `.env.example` to `.env` and populate with actual values.  
3. Use `bun run secrets:get <VAR>` to inspect values safely and `bun run secrets:encrypt`/`decrypt` when moving between local and production.  
4. Wrap agent scripts (`bun run dev`, `bun run db:push`, `bun run db:studio`) with `dotenvx run --` so they load the same secrets chain.

## Secret Rotation & Ticketing
- Inject secrets through CI/CD pipelines rather than storing plaintext in the repo (use pipeline env variables or encrypted `.env.production`).  
- Rotate secrets with automated Forgejo Actions: update Dotenvx files, test against staging, and record the rotation in a Forgejo Issue.  
- Reference secrets only by their variable names (e.g., `PRISMA_ORM`, `GIT_TOKEN`) in tickets; never paste values.  
- After every rotation, extend this entry’s change log with the ticket ID and a brief summary.

## Agent Integration & Troubleshooting
- fogserv-ai agents receive credentials via Forgejo Actions or Dotenvx wrappers; they must never log secrets.  
- Use `bun run secrets:get` to debug missing/env issues, and ensure permissions (e.g., `chmod 600 .env`) allow secure access.  
- For Prisma connection errors, verify `PRISMA_ORM` or `PRISMA_ANY` through the `bun run db:studio` command before escalating.

## Next Steps
- Add a subsection that documents new secrets as they appear, including descriptions of what systems need them.  
- Link this KB entry to `dotenvx.md` and `prisma-connections.md` so agent onboarding sees the full flow.  
- Create a Forgejo Action sample that triggers a validation run whenever secrets change.

## Sources & Related
- `../research/dotenvx.md` for encryption + layering citations  
- `../research/sysadmin.md` for logging/rotation checklist requirements  
- `../sysadmin/dotenvx.md` for operational context  
- `../databases/prisma-connections.md` for Prisma connection secrets  
- `../TELOS.md` and the ticketing pillar

## Change Log
- January 30, 2026 03:07 AM — Created the KB-formatted secrets reference and linked it to the Dotenvx playbook.
