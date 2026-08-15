# Agentic Workflows (operational patterns)

**Status:** Active  
**Last Updated:** April 22, 2026  
**Tags:** agentic, orchestration, governance

---

## Summary
This entry describes how agents collaborate, who makes decisions, and which guardrails keep them aligned with GitOps, Ticketing, and Documentation pillars.

## Context
Agents operate under TELOS and must learn from every session. These patterns become playbooks that future agents reference when coordinating multi-step infrastructure changes.

---

## Observed Workflow Patterns (Active Sessions)

### 1. "Sequential Continue" Pattern
The user issues a single `continue` prompt repeatedly. The agent:
1. Reads `kb/tasks.md` to determine the next unchecked task.
2. Implements it end-to-end (backend + frontend + KB update).
3. Runs `get_errors` to validate before marking complete.
4. Updates `kb/tasks.md` session log and task checkboxes.
5. Signals readiness for the next `continue`.

**Key rule:** Each `continue` must result in a shippable, error-free unit of work. Never leave the codebase in a broken state between turns.

---

### 2. Single-File Project Safety (`src/main.tsx` > 1000 lines)
- **Before inserting** any type, function, or component: `grep_search` for the symbol name to confirm it doesn't already exist.
- **Ordering:** imports → context/auth → shared types → utilities → page components → auth pages → route definitions → router bootstrap.
- **Duplicate risk:** After context summarization the agent loses memory of what was written. Duplicate declarations surface as TypeScript errors. Fix by removing the duplicate block, not both.

---

### 3. Backend-in-Vite-Config Pattern
All API routes registered as Vite middleware in `vite.config.ts`. Viable in dev/preview; migrate to standalone server before production load.
- Route handler naming: `handle<Domain><Action>` (e.g., `handleAuthLogin`)
- Single `prisma` client at module scope
- Secrets from `process.env` only — never hardcoded

---

### 4. KB-First Session Discipline
Every session that adds a feature must:
1. Mark `kb/tasks.md` checkboxes and add a dated `## Session Change Log` entry.
2. Update `kb/lessons-learned.md` with new patterns or gotchas.
3. Update `kb/implementations.md` if an architectural decision was made.
4. Update `kb/agent.md` if environment/routes changed significantly.

---

## Core Orchestration Patterns
1. **Orchestrator–worker separation** – A single coordinator agent breaks tickets into tasks, dispatches specialist workers (network, infra, docs), and merges results so ownership stays clear.  
2. **Evaluator–optimizer loop** – Evaluation agents watch GitOps pipelines to catch regressions before commits land in the main branch.  
3. **Routing/classifier agents** – Input classification routes work to domain experts, reducing context switching and ensuring the right skills respond to each issue.  
4. **Autopilot-assisted design** – Borrowing UiPath Maestro, combine rapid iteration with human review so even experimental flows stay explainable.  
5. **Scaling with Agent 365 principles** – Prepare for thousands of agents by enforcing lifecycle states, audit logs, and explainability requirements.

---

## Guardrails & Governance
- Transparency gaps, indeterminism, and blurred data-action boundaries are top risks; use low-code workflow definitions to keep the intent + data separation visible.  
- Log every agent’s reasoning, input, and output sequence inside Forgejo Issues so “Ticketing is Truth” stays intact.  
- Keep Dotenvx-managed secrets scoped and serve them through read-only boundaries; document each boundary inside the KB.

## Operational Checklist
- [ ] Align every agent with GitOps manifests and validate in staging before promotion.  
- [ ] Document the agent’s “why” in `/kb/` and associate it with the closing ticket.  
- [ ] Run periodic reviews to spot drift and retire or refactor underperforming agents.
- [ ] Before inserting into a large single-file project, `grep_search` the target symbol name first.
- [ ] After every feature implementation, run `get_errors` before declaring done.
- [ ] Every session: update `kb/tasks.md` + `kb/lessons-learned.md` + `kb/implementations.md`.

## Next Steps
- Author a diagram that maps these patterns to the actual services (Forgejo, Prisma, TanStack dashboards).  
- Link the patterns to the agent dashboard when it ships so each feature reflects a documented workflow.  
- Expand the checklist with incident-response drills once the ticketing system is online.

## Sources & Related
- Agentic AI Foundation playbooks (AAIF, Agents.md, MCP)  
- ServiceNow + PwC orchestration platforms (Agent Studio, Agent OS)  
- TechRadar insights on enterprise agentic AI risks  
- TELOS doctrine (`../TELOS.md`)  
- Route readers to `../research/ai-server-management.md` for the latest citations
- `../implementations.md` — Auth, newsletter, single-file architecture decisions (April 2026)
- `../lessons-learned.md` — Lessons 16–20 (April 2026 session)

## Change Log
- April 22, 2026 — Added "Sequential Continue" workflow pattern and single-file project workflow from active CRM/auth build session.
- January 30, 2026 03:05 AM — Restructured to the KB store format and captured governance-focused workflow patterns.
