# fogserv.cloud

**The AI-Managed Server**  
A state-of-the-art implementation treating infrastructure not as a static resource, but as a living entity that learns and evolves alongside its operator.

[![Status](https://img.shields.io/badge/status-active%20development-brightgreen)](https://git.shire.one/fogserv/website)
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![React](https://img.shields.io/badge/react-19-61dafb)]()
[![TypeScript](https://img.shields.io/badge/typescript-5.7-blue)]()

---

## 🌟 Mission

**"Helping People Help Themselves"**

fogserv.cloud demonstrates how small-scale decentralization and agentic workflows can match the reliability and scale of much larger organizations. We believe that essential infrastructure, knowledge, and computational resources should not be gatekept or restricted.

**Read the full philosophy:** [TELOS.md](./kb/TELOS.md)

---

## 🏛️ Core Pillars

### GitOps is Law
Every change flows through Git. The repository is the source of truth. Automated Forgejo Actions trigger deployments, ensuring production always matches the codebase.

### Ticketing is Truth
No work happens without a record. Custom ticketing synced with Forgejo Issues ensures every line of code has a "Why" attached to it.

### Documentation is Memory
The `/KB/` Knowledge Base is the project's brain, containing everything from server inventories to philosophical manifestos. Agents update it after every session, preventing context rot.

### Proactive Polish
Agents follow the "campsite rule"—they don't just fix bugs, they refactor surrounding code and update relevant documentation in the same pass.

---

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) v1.0+ (recommended) or Node.js 20+
- PostgreSQL database (or use SQLite for local development)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://git.shire.one/fogserv/website.git
   cd website
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Initialize database**
   ```bash
   bun run db:generate
   bun run db:push
   ```

5. **Start development server**
   ```bash
   bun run dev
   ```

   Open http://localhost:5173 in your browser.

---

## 📁 Project Structure

```
fogserv.cloud/
├── src/
│   ├── main.tsx          # Entry point, router config, page components
│   ├── index.css         # Global Tailwind styles
│   └── routes/           # Route components (legacy, being refactored)
├── kb/                    # Knowledge Base - CRITICAL DOCUMENTATION
│   ├── TELOS.md          # Mission & philosophy (READ FIRST)
│   ├── agent.md          # Agent reference file
│   ├── tasks.md          # Project task tracking
│   ├── lessons-learned.md      # Session insights
│   ├── problems-solved.md      # Technical solutions
│   ├── implementations.md      # Architecture decisions
│   └── [guides]          # Domain-specific documentation
├── prisma/
│   └── schema.prisma     # Database models
├── .env.example          # Environment template
├── package.json          # Dependencies & scripts
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind configuration
└── tsconfig.json         # TypeScript configuration
```

---

## 🛠️ Technology Stack

### Core
- **React 19** - UI framework with modern hooks and performance
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Bun** - Package manager and runtime (10x faster than npm)

### Routing & State
- **TanStack Router** - Type-safe routing with file-based structure
- **TanStack Query** - Server state management (planned)

### Styling
- **Tailwind CSS v4** - Utility-first CSS with new architecture
- **PostCSS** - CSS transformations

### Database
- **PostgreSQL** - Production database
- **Prisma ORM** - Type-safe database client
- **Prisma Accelerate** - Connection pooling + edge caching

### DevOps
- **dotenvx** - Secure environment variable management
- **Forgejo Actions** - CI baseline for lint/type-check/test gating
- **Git** - Version control and GitOps workflows

---

## 📜 Available Scripts

### Development
```bash
bun run dev          # Start dev server with hot reload
bun run build        # Build for production
bun run preview      # Preview production build
```

### Database
```bash
bun run db:generate  # Generate Prisma client
bun run db:push      # Sync schema to database (dev)
bun run db:migrate   # Create migration file
bun run db:studio    # Open Prisma Studio (database GUI)
```

### Secrets Management
```bash
bun run secrets:get KEY      # Get secret value
bun run secrets:encrypt      # Encrypt production secrets
bun run secrets:decrypt      # Decrypt secrets
```

### Code Quality
```bash
bun run lint         # Run ESLint
bun run type-check   # Run TypeScript type checking
```

---

## 🌐 Environment Variables

### Required for Development

```bash
# Database (SQLite for local dev)
DATABASE_URL="file:./dev.db"

# Production Database (PostgreSQL via Prisma Accelerate)
PRISMA_ORM="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_KEY"
PRISMA_ANY="postgres://user:pass@host:port/database?sslmode=require"
```

### Planned Additions

```bash
# Email (Mailgun)
MAILGUN_API_KEY="your_mailgun_api_key"
MAILGUN_DOMAIN="mg.fogserv.cloud"
MAILGUN_FROM_EMAIL="noreply@fogserv.cloud"

# Authentication
JWT_SECRET="your_jwt_secret"

# Public API
VITE_PUBLIC_API_URL="https://api.fogserv.cloud"
```

**See:** [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md) for comprehensive guide

---

## 📚 Knowledge Base

The `/kb/` directory contains the project's institutional memory. Start here:

1. **[TELOS.md](./kb/TELOS.md)** - Mission, philosophy, guiding principles
2. **[agent.md](./kb/agent.md)** - Comprehensive reference for AI agents
3. **[tasks.md](./kb/tasks.md)** - Project roadmap and task tracking
4. **[implementations.md](./kb/implementations.md)** - Architecture decisions
5. **[lessons-learned.md](./kb/lessons-learned.md)** - What we've learned
6. **[problems-solved.md](./kb/problems-solved.md)** - Technical solutions

---

## 🤖 For AI Agents

**Start here:** [kb/agent.md](./kb/agent.md)

This file contains:
- Complete project context and mission
- Technology stack details
- File structure and key locations
- Common workflows and operations
- Troubleshooting guides
- TELOS principles and operational rules
- Session checklist

**Critical Rules:**
- ✅ Update `/kb/` after every session
- ✅ Reference ticket numbers in commits
- ✅ Test changes before committing
- ✅ Follow TELOS principles
- ✅ Document architectural decisions

---

## 🗺️ Roadmap

### ✅ Phase 1: Foundation (Complete)
- [x] React 19 + TanStack + Vite setup
- [x] Prisma ORM + PostgreSQL
- [x] Tailwind CSS v4
- [x] dotenvx secrets management
- [x] Multi-page website with navigation
- [x] Knowledge Base structure

### 🔄 Phase 2: Knowledge Base (90% Complete)
- [x] TELOS documentation
- [x] Task tracking system
- [x] Session learnings capture
- [x] Agent reference file
- [ ] Workflow documentation
- [ ] UI/UX wireframes

### � Phase 3: CRM/CMS (In Progress)
- [x] **Database schema design** — 21 models covering User management (6 roles), Posts/Pages/Comments, Tags/Categories, Email subscribers, Campaigns, Analytics ([kb/databases/crm-cms-architecture.md](./kb/databases/crm-cms-architecture.md))
- [x] **Prisma client generated** — Full type-safe database access with relationships
- [ ] Database migration and seed data
- [ ] User authentication system
- [ ] Changelog entry creation and editing
- [ ] Admin dashboard
- [ ] Rich text editor integration

### 📋 Phase 4: Email Integration
- [ ] Mailgun setup and configuration
- [ ] Newsletter signup flow
- [ ] Email templates
- [ ] Campaign composer
- [ ] Analytics and tracking

### 📋 Phase 5: Content Migration
- [ ] Export from Ghost CMS
- [ ] Map Ghost schema to Prisma models
- [ ] Migrate existing articles
- [ ] SEO preservation
- [ ] Image migration and optimization

### 📋 Phase 6: Automation & Agents
- [ ] Forgejo Actions CI/CD
- [ ] Agent dashboard
- [ ] Deployment automation
- [ ] Monitoring and alerts
- [ ] Self-healing capabilities

**Full roadmap:** [kb/tasks.md](./kb/tasks.md)

---

## 🤝 Contributing

fogserv.cloud follows the TELOS principles for contributions:

1. **GitOps is Law** - All changes via Git, no direct edits
2. **Ticketing is Truth** - Create issue before significant work
3. **Documentation is Memory** - Update `/kb/` with your learnings
4. **Proactive Polish** - Leave code better than you found it

### Contribution Workflow

1. Create or find an issue describing the work
2. Fork/branch from `main`
3. Make changes following existing patterns
4. Update relevant `/kb/` files with learnings
5. Write descriptive commit messages
6. Reference issue in commits: `Fixes #123`
7. Submit pull request linking to issue

**See:** [kb/agent.md](./kb/agent.md) for detailed workflow

---

## 📊 Current Status

**Version:** 0.1.0 (Initial Development)  
**Status:** ✅ Active Development  
**Last Updated:** January 30, 2026

### Completed
- ✅ Core infrastructure and tooling
- ✅ Multi-page website with navigation
- ✅ Responsive design
- ✅ Knowledge Base documentation
- ✅ Database foundation

### In Progress
- 🔄 CRM/CMS architecture design
- 🔄 Email integration planning
- 🔄 Workflow documentation

### Planned
- 📋 Admin dashboard
- 📋 Content migration from Ghost
- 📋 User authentication
- 📋 Newsletter system
- 📋 CI/CD automation

**Detailed status:** [kb/tasks.md](./kb/tasks.md)

---

## 🔒 Security

- **Secrets:** Never commit `.env` files. Use dotenvx encryption for production.
- **Database:** Use Prisma's parameterized queries to prevent SQL injection.
- **Auth:** JWT tokens with httpOnly cookies (when implemented).
- **API:** Rate limiting and input validation (when implemented).

**Full guide:** [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md)

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🔗 Links

- **Website:** https://fogserv.cloud
- **Repository:** https://git.shire.one/fogserv/website
- **Knowledge Base:** [/kb/](./kb/)
- **Mission:** [TELOS.md](./kb/TELOS.md)
- **Changelog:** [CHANGELOG.md](./CHANGELOG.md)

---

## 📞 Support

For questions or issues:
1. Check the [Knowledge Base](./kb/) first
2. Search existing issues
3. Create new issue with details
4. Reference TELOS principles in discussions

---

**Built with ❤️ by the fogserv.cloud community and AI agents**

*"Helping people help themselves through democratic, self-healing infrastructure."*
