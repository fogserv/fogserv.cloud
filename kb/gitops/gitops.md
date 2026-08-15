# GitOps (Law of Variation)

**Status:** Active  
**Last Updated:** January 30, 2026 03:06 AM  
**Session:** GitOps playbook alignment for KB stores  
**Tags:** GitOps, deployment, drift

---

## Summary
GitOps is the operational law that keeps fogserv.cloud consistent, auditable, and reversible. This entry codifies the workflow agents must follow, including documentation updates and drift remediation.

## Context
Every infrastructure change is tied to a ticket, a branch, and a Forgejo Action. The KB plays its part by capturing the “why” for each change, linking deployments to telemetry, and enforcing the campsite rule.

## Workflow Steps
1. Branch for the ticket, include config changes, documentation updates (always update `/kb/`), and any new agent code or tests.  
2. Submit a merge request to Forgejo so Actions can lint, type-check, and apply declarative manifests.  
3. When automation applies the change, every stage is logged in the corresponding Forgejo Issue.  
4. If drift is detected, pull-based reconcilers revert to the last known-good commit and an incident retrospective is recorded in `/kb/`.  
5. Apply the campsite rule by cleaning up surrounding code and docs before closing the ticket.

## Tooling & Policies
- Forgejo + Actions form the GitOps pipeline and must never skip ticket validation.  
- Policy enforcement (Gatekeeper/OPA style) lives in PR checks; manifests describing timeouts, access, and other guardrails are reviewed before merging.  
- Secrets live in Dotenvx or vault-managed artifacts; no plaintext secrets are checked into Git.  
- Deployment telemetry ties each Git hash to observability dashboards so agents can identify which commit caused drift or incidents.

## Documentation Hygiene
- Every GitOps change updates `/kb/` with motivations, outcomes, and follow-up questions.  
- Variant environments (`.env`, `.env.production`, `.dotenvx`) are described in `dotenvx.md` so operators always know which variables matter.  
- Summarize GitOps metrics (deployment rate, drift incidents, policy violations) inside this entry so trends are visible at a glance.

## Next Steps
- Define a Forgejo Action that fails PRs missing KB updates.  
- Create dashboards that track drift incidents and link directly to this entry.  
- Expand the GitOps metrics summary with charts pulled from the telemetry stack.

## Sources & Related
- Weaveworks GitOps Field Guide 2024  
- CNCF GitOps Working Group guidance  
- Argo CD and Flux pull-based delivery docs  
- `../research/gitops.md` for citation-ready summaries  
- `../sysadmin/dotenvx.md` and `../sysadmin/secrets.md` for secrets guardrails  
- `../agentic/ai-server-management.md` for how GitOps supports agentic governance

## Change Log
- January 30, 2026 03:06 AM — Reworked the GitOps playbook to match the defined KB store layout and added the documentation hygiene section.
