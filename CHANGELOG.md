# Changelog

All notable changes to fogserv.cloud will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Work in Progress (WIP) banner added to all pages via `RootLayout` in `main.tsx` and `src/routes/__root.tsx`.
- Ensures development status is immediately visible to prevent premature deployment confusion.

### Planned

- CRM/CMS database schema and admin dashboard
- Mailgun integration for newsletter signups
- Content migration from Ghost CMS
- User authentication and authorization
- Changelog entry creation and management
- Email campaign composer
- Forgejo Actions CI/CD pipeline
- Agent dashboard for infrastructure monitoring

---

## [0.1.0] - 2026-01-30

### Added - Initial Setup & Foundation

#### Core Infrastructure

- React 19 application with Vite build system
- TanStack Router for type-safe routing
- Tailwind CSS v4 for utility-first styling
- Prisma ORM with PostgreSQL database
- Prisma Accelerate for connection pooling and edge caching
- Bun as package manager and runtime
- TypeScript configuration with strict mode
- dotenvx for secure environment variable management

#### Application Structure

- Multi-page website with navigation and footer
- Homepage with hero section, core pillars, and mission statement
- About page explaining TELOS philosophy and mission
- Changelog page with update previews
- Knowledge Base page with document browser
- Responsive design with mobile-first approach

#### Knowledge Base Documentation

- `TELOS.md` - North Star philosophy and guiding principles
- `tasks.md` - Comprehensive project task tracking
- `lessons-learned.md` - Session insights and discoveries
- `problems-solved.md` - Technical issues and solutions
- `implementations.md` - Architecture decisions and patterns
- `website-rebuild.md` - Session notes and migration strategy
- `dotenvx.md` - Secrets management guide
- `agent.md` - Comprehensive agent reference file
- `README.md` - KB navigation and structure

#### Database Schema

- User model with email, name, and timestamps
- Prisma client generation and configuration
- SQLite for local development
- PostgreSQL with Accelerate for production

#### Developer Experience

- Hot module replacement (HMR) with Vite
- Fast dependency installation with Bun
- Type-safe database queries with Prisma
- Environment-aware configuration with dotenvx
- Comprehensive error handling and debugging

### Fixed

#### React Hydration Error

- **Problem:** HTML elements rendered inside React root caused hydration mismatch
- **Solution:** Moved HTML structure to `index.html`, React components mount inside `#root`
- **Reference:** `/kb/problems-solved.md#problem-1`

#### PostCSS Configuration Error

- **Problem:** ES module syntax error in `postcss.config.js`
- **Solution:** Changed from `module.exports` to `export default`
- **Reference:** `/kb/problems-solved.md#problem-2`

#### Tailwind CSS v4 Plugin Error

- **Problem:** Tailwind v4 requires separate `@tailwindcss/postcss` package
- **Solution:** Installed plugin and updated configuration
- **Reference:** `/kb/problems-solved.md#problem-3`

### Changed

#### Routing Strategy

- Simplified from file-based routing to inline component definitions
- Easier to maintain during MVP phase
- Future migration to file-based routing planned

#### CSS Architecture

- Updated from Tailwind v3 directives to v4 `@import` syntax
- Switched to new `@tailwindcss/postcss` plugin
- Improved performance and developer experience

### Security

#### Secrets Management

- Setup dotenvx for environment variable encryption
- Created `.env.example` template (safe to commit)
- Added `.env` to `.gitignore` (never commit)
- Documented secrets in `SECRETS_MANAGEMENT.md`
- Configured all npm scripts with `dotenvx run --` wrapper

---

## Project Conventions

### Commit Message Format

```
type: Short description

Longer description explaining the change and why it was made.

Fixes #123
Related to #456
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Version Numbering

- **Major (X.0.0):** Breaking changes, major feature releases
- **Minor (0.X.0):** New features, backward compatible
- **Patch (0.0.X):** Bug fixes, minor improvements

### Release Process

1. Update `CHANGELOG.md` with changes
2. Update version in `package.json`
3. Create git tag: `git tag v0.1.0`
4. Push tag: `git push origin v0.1.0`
5. Deploy to production via Forgejo Actions

---

## Session Notes

### January 30, 2026 - 03:00 AM - Initial Development Session

**Duration:** ~3 hours  
**Developer:** AI Agent (Claude Sonnet 4.5)  
**Objective:** Setup foundational stack and multi-page website

**Accomplishments:**

- Installed and configured entire technology stack
- Built 4 complete pages with navigation
- Created comprehensive Knowledge Base structure
- Documented all architectural decisions
- Fixed 3 technical issues (hydration, PostCSS, Tailwind)
- Established project conventions and workflows

**Metrics:**

- Files Created: 25+
- Lines of Code: ~1,500
- Documentation Pages: 10
- KB Entries: 8
- Issues Resolved: 3
- Time to Working Site: ~2 hours

**Key Learnings:**

- React 19 hydration requirements
- Tailwind v4 architecture changes
- dotenvx superiority over traditional dotenv
- TanStack Router simplification strategies
- Importance of documentation-first development

**Next Priorities:**

1. Design CRM/CMS database schema
2. Setup Mailgun integration
3. Create workflow documentation and wireframes
4. Build admin dashboard foundation
5. Migrate content from Ghost CMS

---

## Links & Resources

- **Repository:** https://git.shire.one/fogserv/website
- **Production Site:** https://fogserv.cloud (Ghost CMS - to be replaced)
- **Knowledge Base:** `/kb/` directory
- **Mission Statement:** `/kb/TELOS.md`
- **Task Tracking:** `/kb/tasks.md`

---

**Maintained by:** fogserv.cloud team & fogserv-ai agents  
**Last Updated:** January 30, 2026  
**Status:** Active Development
