# System Administration Basics

**Status:** Active  
**Last Updated:** January 30, 2026 03:06 AM  
**Session:** Laying out the fundamentals for fogserv.cloud agents  
**Tags:** infrastructure, monitoring, security

---

## Summary
This entry captures the recurring responsibilities every agent must fulfill when stewarding the fogserv.cloud infrastructure—inventory, observability, patch management, and documentation.

## Context
Agents are expected to run routine audits automatically via Forgejo Actions, surface findings as tickets, and document everything inside the KB so future operators can pick up where they left off.

## Core Responsibilities
- Maintain an accurate inventory of hardware, VMs, containers, and services alongside owners and purposes; store this data in Forgejo tickets or spreadsheets referenced from this entry.  
- Automate audits (patch levels, disk usage, certificates) via scheduled tasks so findings feed back into `/kb/system-admin-basics.md` for traceability.

## Observability & Monitoring
- Follow CISA logging guidance: collect security logs, system metrics (CPU, memory, disk), and network flows, then align them with tickets so incident histories stay fresh.  
- Pair metrics with alert thresholds, runbooks, and dashboards; document those runbooks inside the KB for quick diagnosis.

## Patch & Change Management
- Run a continuous patch cadence—weekly security updates, monthly feature updates—always applying changes to staging first and documenting results in Forgejo Issues.  
- Store configuration management code (Ansible, Salt, shell scripts) inside Git so agentic workflows apply them consistently and roll back when needed.

## Security & Access Control
- Use least privilege for service accounts, rotate credentials via Dotenvx or a vault, and log each rotation in this KB entry.  
- Segment networks and enforce zero-trust principles (mutual TLS, identity tokens, scoped roles) for agent communications.

## Documentation & Training
- Document every checklist (observability, patching, incident response) here so new agents can onboard quickly.  
- When tooling or process changes happen, add a “what changed” entry describing motivation, testing, and ticket reference.

## Next Steps
- Publish the inventory tracker referenced here as a dataset inside `/kb/`.  
- Attach automation results (audits, patches) to this doc with a short note about the findings.  
- Expand the security checklist with new zero-trust experiments.

## Sources & Related
- Red Hat overview of modern system administration responsibilities  
- CISA logging and monitoring guidance 2024  
- CISA incident response fundamentals  
- Linux Foundation training on system administration workflows  
- `../research/sysadmin.md` for the primary citations  
- `../agentic/ai-server-management.md` and `../gitops/gitops.md` for agentic/GitOps context

## Change Log
- January 30, 2026 03:06 AM — Shifted into KB store format and clarified documentation/training expectations.
