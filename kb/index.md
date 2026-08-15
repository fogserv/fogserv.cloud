---
title: FogServ Knowledge Base
description: The living memory of the FogServ ecosystem — philosophy, runbooks, tooling notes, and operational lessons.
tags: [knowledge-base, fogserv, internal, ops]
---

# FogServ Knowledge Base

The Knowledge Base is the living memory of the FogServ ecosystem. It stores philosophy, runbooks, tooling notes, and every lesson learned while keeping GitOps, ticketing, and documentation tightly bound.

## Quick Navigation

| Section | Description |
|---------|-------------|
| [TELOS](./TELOS) | North Star philosophy — mission, pillars, design principles, strategic goals |
| [agent](./agent) | Comprehensive agent reference — project structure, tech stack, workflows |
| [tasks](./tasks) | Project roadmap with phased task tracking |
| [implementations](./implementations) | Architecture decisions and trade-offs |
| [lessons-learned](./lessons-learned) | Session insights, discoveries, and tools |
| [problems-solved](./problems-solved) | Technical issues with root causes and solutions |
| [wireframes](./wireframes) | MVP UX flow and component specifications |
| [Basics](./basics/) | Developer onboarding essentials (bash, git, Linux, SSH) |
| [Containers](./containers/) | Docker and k0s documentation (22 files) |
| [Infrastructure](./infrastructure/) | IaC, networking, server management (23 files) |
| [Security](./security/) | AppSec, secrets management, encryption (14 files) |
| [Agentic](./agentic/) | AI-server management and workflows |
| [Frontend](./frontend/) | TanStack Router, Tailwind, site rebuild |
| [GitOps](./gitops/) | Forgejo Actions, drift handling, deployments |
| [Databases](./databases/) | Prisma, CRM/CMS architecture |
| [Sysadmin](./sysadmin/) | System administration, runbooks |
| [Observability](./observability/) | Monitoring, alerting, metrics |
| [Research](./research/) | External sources and influences |
| [Migrations](./migrations/) | Ghost CMS migration, data transfers |
| [AImL](./aiml/) | ML/AI prerequisites and topics |
| [CI/CD](./cicd/) | CI/CD practices and workflows |
| [Cloud](./cloud/) | Cloud strategy and multi-provider architecture |
| [Networking](./networking/) | Network configuration and architecture |

## About This KB

Every KB entry follows a consistent layout:

1. **Title + metadata** — Status, Last Updated, Session context, Tags
2. **Summary** — One or two sentences capturing purpose
3. **Context / Current State** — Background and applicability
4. **Implementation / Details** — Workflows, configuration, expectations
5. **Next Steps / Ops Actions** — Clear actions and follow-ups
6. **Sources & Related** — URLs, related KB entries, references
7. **Change Log** — Timestamped edit history

### Maintenance Mandate

- **GitOps is Law**: every change goes through a ticket, branch, and automated action
- **Ticketing is Truth**: reference the originating ticket in any discussion
- **Documentation is Memory**: append a change-log entry for every edit
- **Proactive Polish**: leave related sections, follow-ups, and sources updated together
