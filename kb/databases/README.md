# Databases Folder

Prisma, Neon, and connection-pooling guidance live in this directory so data agents can keep their actions consistent with secrets and telemetry.

## Contents
- **`crm-cms-architecture.md`** — Comprehensive database schema design: 21 models covering user management, Ghost-like CMS, email marketing (Mailgun), subscriber CRM, and analytics. Complete with relationships, indexes, migration strategy, query patterns, and security considerations.
- **`schema-overview.md`** — Visual ASCII diagram of all database entities, relationships, cascade rules, data flows, and performance characteristics. Quick reference for understanding the schema at a glance.
- **`prisma-connections.md`** — Credential hygiene, pooling, and Prisma Data Proxy recommendations.

## Update Rules
- Link every connection change or rotation to a Forgejo ticket and log metrics in `Next Steps`.  
- Reference `../research/prisma.md` for the latest primitives (Data Proxy, query caching, etc.).
