# fogserv.cloud Knowledge Base

The `/kb/` directory is the living memory of fogserv.cloud. It mirrors the TELOS pillars by storing philosophy, runbooks, tooling notes, and every lesson an agent learns while keeping GitOps, ticketing, and documentation tightly bound.

## KB Store Layout
Every KB entry in this repository follows the same layout so agents can skim content quickly and find the context they need.

### Required structure for each entry
1. **Title + metadata block** – Start with the document title, then include `Status`, `Last Updated`, `Session` or context note, and `Tags` (comma-separated).
2. **Summary** – One or two sentences capturing why the article exists.
3. **Context / Current State** – Background that explains where the idea came from or which systems it applies to.
4. **Implementation / Details** – The meat of the entry: workflows, configuration, expectations, and bullet lists of guarded behaviors.
5. **Next Steps / Ops Actions** – Clear actions, experiments, or follow-ups for the next agent.
6. **Sources & Related** – Pull in URLs, related KB entries, and references.
7. **Change Log** – Every edit adds a timestamped note describing what changed and which ticket or session triggered it.

## Essential Reading

These root-level documents form the core memory and operational framework for fogserv.cloud:

- [TELOS](TELOS) – The North Star philosophy: mission, pillars (GitOps/Ticketing/Documentation/Proactive Polish), design principles, and strategic goals
- [agent](agent) – Comprehensive agent reference covering project structure, tech stack, workflows, troubleshooting, operational rules, and current priorities
- [tasks](tasks) – Project roadmap with phased task tracking, completion criteria, and current sprint focus
- [lessons-learned](lessons-learned) – Session insights, discoveries, mistakes avoided, and tools that exceeded expectations
- [problems-solved](problems-solved) – Technical issues encountered with error messages, root causes, solutions, and prevention strategies
- [implementations](implementations) – Architecture decisions and trade-offs for technology choices, security patterns, and system design
- [workflows](workflows) – Unified operational runbook for planning, implementation, validation, and documentation loops
- [wireframes](wireframes) – MVP UX flow and component-level wireframe specifications for upcoming UI work

## Directory Map

### Categorized Knowledge Base

- **`agentic/`** – Strategy, governance, and agentic workflows (AI-managed server vision, agent orchestration, future dashboards)
  - `agentic/README.md`
  - `agentic/ai-server-management.md`
  - `agentic/agentic-workflows.md`

- **`gitops/`** – GitOps-first tooling, Forgejo Actions, drift handling, and policy-driven deployments
  - `gitops/README.md`
  - `gitops/gitops.md`

- **`sysadmin/`** – Observability, access control, secrets hygiene (Dotenvx + secrets, runbooks)
  - `sysadmin/README.md`
  - `sysadmin/system-admin-basics.md`
  - `sysadmin/dotenvx.md`
  - `sysadmin/secrets.md`

- **`databases/`** – Prisma & connection-level practices, pooling, and telemetry integration
  - `databases/README.md`
  - `databases/prisma-connections.md`

- **`frontend/`** – TanStack/Tailwind site, KB browser, and UI telemetry
  - `frontend/README.md`
  - `frontend/tanstack.md`
  - `frontend/website-rebuild.md`

- **`research/`** – Living log of external sources that influenced this work and the lessons/related topics they surfaced
  - `research/README.md`
  - `research/ai-server-management.md`
  - `research/gitops.md`
  - `research/sysadmin.md`
  - `research/dotenvx.md`
  - `research/prisma.md`
  - `research/tanstack.md`

## Maintenance Mandate
- `GitOps is Law`: every change in `/kb/` goes through a ticket, a branch, and a Forgejo Action just like any other production change.
- `Ticketing is Truth`: mention the originating ticket anywhere you discuss a fix, experiment, or policy change.
- `Documentation is Memory`: append a change-log entry for every edit so the reason, context, and ticket/capability are preserved.
- `Proactive Polish`: don't leave this KB entry worse than you found it—update related sections, follow-up items, and sources together.

## Format Governance
- When a KB entry is deprecated, append a note under `Change Log` marked `DEPRECATED` with a timestamp; do not delete the original content.
- If you create a new topic, add it to this README’s map and establish its layout before merging.
- Each entry should point to at least one related KB article so the knowledge graph stays connected.

**Last Updated:** April 21, 2026  
**Status:** Active KB store layout enforced
