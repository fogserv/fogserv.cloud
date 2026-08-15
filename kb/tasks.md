# fogserv.cloud Project Tasks

**Last Updated:** August 12, 2026  
**Status:** Active Development — Session Handoff

---

## Quick Status

- ✅ **Completed:** Phase 1 foundation, core KB documentation, auth, email abstraction, CMS core CRUD
- 🔄 **In Progress:** Stage 3 CRM features (profile editing, unsubscribe)
- 📋 **Planned:** Email integration, Ghost migration, security hardening
- 🎯 **Total:** 10 of 44 tasks complete (23%)
- ⚠️ **NOTE:** This is a handoff point — next agent should continue from Stage 3

---

## Phase 1: Foundation & Infrastructure ✅ COMPLETE

### ✅ Environment Setup
- [x] Install Bun package manager
- [x] Setup TanStack Start with React 19
- [x] Configure Prisma with PostgreSQL (Accelerate)
- [x] Install Tailwind CSS v4 with PostCSS plugin
- [x] Setup dotenvx for secrets management
- [x] Create `.env`, `.env.example`, `.env.production`
- [x] Configure Git repository (https://git.shire.one/fogserv/website)

### ✅ Core Application Structure
- [x] Fix React hydration errors (HTML structure)
- [x] Create TanStack Router setup with browser history
- [x] Build navigation header with routing
- [x] Build footer with links and resources
- [x] Setup Prisma schema with User model
- [x] Generate Prisma client

### ✅ Content & Pages
- [x] Homepage with hero, core pillars, mission
- [x] About page explaining TELOS and mission
- [x] Blog page with article previews
- [x] Knowledge Base page with KB document cards
- [x] Responsive design with Tailwind

---

## Phase 2: Knowledge Base & Documentation ✅ COMPLETE

### ✅ Knowledge Base Files Created
- [x] `TELOS.md` - North Star philosophy and mission
- [x] `README.md` - KB navigation and structure
- [x] `frontend/website-rebuild.md` - Technical session notes
- [x] `sysadmin/dotenvx.md` - Secrets management guide (already existed)
- [x] `SECRETS_MANAGEMENT.md` - Comprehensive secrets guide
- [x] `agent.md` - Agent reference and operating context
- [x] `lessons-learned.md` - Session insights and discoveries
- [x] `problems-solved.md` - Technical issues and solutions
- [x] `implementations.md` - Architecture decisions and code patterns

### ✅ Additional KB Documentation Completed
- [x] `tasks.md` (this file) - Project task tracking
- [x] `workflows.md` - Complete workflow documentation
- [x] `wireframes.md` - UI/UX design specifications
- [x] `agent.md` - Agent reference file with all context

---

## Phase 3: CRM/CMS Architecture 🔄 IN PROGRESS

### Database Schema Design ✅ COMPLETE
- [x] Design User model (extended for auth)
- [x] Design Post/Article model (Ghost-like CMS)
- [x] Design Tag/Category models
- [x] Design Subscription/Newsletter model
- [x] Design EmailCampaign model
- [x] Design Analytics/Metrics models
- [x] Create Prisma migrations

### CMS Features 🔄 IN PROGRESS
- [x] Admin dashboard layout
- [x] Rich text editor integration (TipTap)
- [x] Post list view in admin (real data from Prisma)
- [x] Create post (POST /api/posts)
- [x] Update post (PUT /api/posts/:id) — **NEW**
- [x] Delete post (DELETE /api/posts/:id) — **NEW**
- [ ] Image upload and management
- [ ] Draft/publish workflow
- [ ] SEO metadata fields (schema exists, UI missing)
- [ ] Post scheduling (schema exists, UI missing)
- [ ] Author management
- [ ] Tag/category management UI

### CRM Features 🔄 IN PROGRESS
- [x] User registration/authentication (backend + frontend complete)
- [x] Email verification (User account — verification email sent on register)
- [x] Profile management (`/profile` route — read-only profile view)
- [ ] **Edit profile** (name, bio, website, avatar) — **NEXT TASK**
- [ ] **Unsubscribe handling** — **NEXT TASK**
- [ ] Subscription preferences
- [ ] User activity tracking

---

## Phase 4: Email & Mailgun Integration 📋 PLANNED

### Mailgun Setup
- [ ] Add Mailgun API credentials to `.env` *(user action — credentials not yet configured)*
- [x] Create email service abstraction layer (`src/services/emailService.ts`)
- [x] Implement transactional email templates (verification, welcome, newsletter)
- [x] Setup email verification flow (request + confirm endpoints)
- [x] Configure webhook endpoints for delivery/bounces (`/api/email/webhooks/mailgun`)

### Newsletter System
- [x] Signup form component (`NewsletterSignupCard`)
- [x] Double opt-in confirmation (`/verify-email` route)
- [ ] Welcome email sequence
- [ ] Newsletter composition interface
- [ ] Bulk send with rate limiting
- [ ] Subscriber segmentation
- [ ] Unsubscribe link generation
- [ ] Analytics (opens, clicks, bounces)

---

## Phase 5: Content Migration from Ghost 📋 PLANNED

### Ghost Content Migration
- [ ] Crawl complete site for all articles
- [ ] Export Ghost content via API or backup
- [x] Map Ghost schema to new Prisma schema
- [x] Preserve article slugs for SEO
- [x] Write Ghost export/import script (`scripts/import-ghost.ts`)
- [ ] Run live import from Ghost JSON export
- [ ] Migrate images to new CDN/storage
- [ ] Redirect old URLs to new structure

---

## Phase 6: Workflows & Automation 📋 PLANNED

### GitOps Workflows
- [x] Setup Forgejo Actions for CI/CD
- [x] Automated testing on pull requests
- [ ] Automated deployment to staging
- [ ] Production deployment approval workflow
- [ ] Rollback procedures
- [ ] Backup automation

---

## Phase 7: Wireframes & UI/UX 📋 PLANNED

### Components to Wireframe
- [x] Homepage layout (mobile + desktop)
- [x] Blog post template
- [x] Admin dashboard
- [x] Email composer
- [x] User profile page
- [ ] Settings/preferences page

---

## Session Change Log

### August 12, 2026 - CMS Core Feature Completion & Handoff
- ✅ Implemented `PUT /api/posts/:id` with auth, permission checks, slug dedupe, tag replacement
- ✅ Implemented `DELETE /api/posts/:id` with auth, permission checks
- ✅ Wired admin dashboard to real Prisma data (replaced mock data with `PostsSection`)
- ✅ Created `PostListRow` and `PostsSection` components in `AdminComponents.tsx`
- ✅ Fixed critical bugs: emailService.ts missing brace, RichTextEditor.tsx duplicate import
- ✅ Dev server running in tmux session `fogserv-dev` on http://localhost:5173/
- ✅ Type-check passes with 0 errors
- ⚠️ **HANDOFF:** Next agent should continue from Stage 3 — profile editing and unsubscribe

### August 12, 2026 - Initial Bug Fixes & Plan Creation
- Fixed `emailService.ts` missing closing brace causing `createGateway` ReferenceError
- Fixed `RichTextEditor.tsx` duplicate import causing TS build error
- Created comprehensive completion plan with 6 stages, 44 tasks
- Updated Knowledge Base with current project state

### April 22, 2026 - Rich Text Editor (TipTap) Integrated
- Installed TipTap editor stack with extensions
- Added `PostEditorPage` at `/admin/new-post`
- Added backend CMS endpoints (`POST /api/posts`, `GET /api/posts`)

### April 22, 2026 - CRM User Registration & Authentication Complete
- Added backend auth endpoints in `vite.config.ts`
- Added `AuthProvider` React context and `useAuth()` hook
- Added `LoginPage`, `RegisterPage`, `ProfilePage`
- Auth uses native `crypto.scrypt` (no bcrypt dep)

### April 22, 2026 - Email Verification Flow Implemented
- Added `/api/email/verification/request` and `/api/email/verification/confirm`
- Wired verification token persistence to Prisma `Subscriber` records

### April 22, 2026 - Mailgun Webhook Endpoints Added
- Added `/api/email/webhooks/mailgun` endpoint with signature verification
- Wired subscriber status/engagement updates for Mailgun events

### February 25, 2026 - WIP Guardrails & Analysis
- Added "Work in Progress" banner to all pages

### January 30, 2026 - Initial Setup
- Created project structure, React + TanStack + Prisma stack
- Built multi-page site with navigation
- Created initial KB documentation

---

## 📝 Next Session Priorities (HANDOFF)

**Stage 3: CRM Features** (Start here)
1. Implement `PUT /api/users/:id` endpoint for profile editing
2. Add `/profile/edit` route with edit form (name, bio, website, avatar)
3. Implement `DELETE /api/subscribers/:id/unsubscribe` endpoint
4. Add role-based access control middleware for admin routes

**Stage 2 (Continued):**
5. Add image upload endpoint (`/api/uploads`)
6. Wire TipTap image extension to upload endpoint
7. Add post scheduling UI in admin editor

**Stage 4:**
8. Configure Mailgun credentials in `.env` (requires user action)
9. Build newsletter composer UI in admin

---

## Related Files

- `vite.config.ts` — All `/api/*` backend routes (Vite middleware pattern)
- `src/routes/admin.tsx` — Admin dashboard (now shows real post data)
- `src/components/AdminComponents.tsx` — Admin UI components (PostListRow, PostsSection)
- `src/services/emailService.ts` — Email abstraction layer
- `src/hooks/useAuth.tsx` — Auth context and hooks
- `prisma/schema.prisma` — Database schema (21 models)
- `kb/tasks.md` — This file

---

**Next Agent Action:** Continue from Stage 3 — implement profile editing and unsubscribe endpoints

</parameter>
- 🎯 **Total:** Multi-phase roadmap active — ~15 of 44 tasks complete

**Status:** Active Development

---

## Quick Status

- ✅ **Completed:** Phase 1 foundation and core KB documentation set
- 🔄 **In Progress:** CMS feature buildout, migration planning, and integrations
- 📋 **Planned:** CRM/CMS architecture, Mailgun integration, Ghost migration, and automation phases
- 🎯 **Total:** Multi-phase roadmap active

---

## Phase 1: Foundation & Infrastructure ✅ COMPLETE

### ✅ Environment Setup
- [x] Install Bun package manager
- [x] Setup TanStack Start with React 19
- [x] Configure Prisma with PostgreSQL (Accelerate)
- [x] Install Tailwind CSS v4 with PostCSS plugin
- [x] Setup dotenvx for secrets management
- [x] Create `.env`, `.env.example`, `.env.production`
- [x] Configure Git repository (https://git.shire.one/fogserv/website)

### ✅ Core Application Structure
- [x] Fix React hydration errors (HTML structure)
- [x] Create TanStack Router setup with browser history
- [x] Build navigation header with routing
- [x] Build footer with links and resources
- [x] Setup Prisma schema with User model
- [x] Generate Prisma client

### ✅ Content & Pages
- [x] Homepage with hero, core pillars, mission
- [x] About page explaining TELOS and mission
- [x] Blog page with article previews
- [x] Knowledge Base page with KB document cards
- [x] Responsive design with Tailwind

---

## Phase 2: Knowledge Base & Documentation ✅ COMPLETE

### ✅ Knowledge Base Files Created
- [x] `TELOS.md` - North Star philosophy and mission
- [x] `README.md` - KB navigation and structure
- [x] `frontend/website-rebuild.md` - Technical session notes
- [x] `sysadmin/dotenvx.md` - Secrets management guide (already existed)
- [x] `SECRETS_MANAGEMENT.md` - Comprehensive secrets guide
- [x] `agent.md` - Agent reference and operating context
- [x] `lessons-learned.md` - Session insights and discoveries
- [x] `problems-solved.md` - Technical issues and solutions
- [x] `implementations.md` - Architecture decisions and code patterns

### ✅ Additional KB Documentation Completed
- [x] `tasks.md` (this file) - Project task tracking
- [x] `lessons-learned.md` - Session insights and discoveries
- [x] `problems-solved.md` - Technical issues and solutions
- [x] `implementations.md` - Architecture decisions and code patterns
- [x] `workflows.md` - Complete workflow documentation
- [x] `wireframes.md` - UI/UX design specifications
- [x] `agent.md` - Agent reference file with all context

---

## Phase 3: CRM/CMS Architecture 🔄 IN PROGRESS

### Database Schema Design
- [x] Design User model (extended for auth)
- [x] Design Post/Article model (Ghost-like CMS)
- [x] Design Tag/Category models
- [x] Design Subscription/Newsletter model
- [x] Design EmailCampaign model
- [x] Design Analytics/Metrics models
- [x] Create Prisma migrations

### CMS Features
- [x] Admin dashboard layout
- [x] Rich text editor integration (TipTap or similar)
- [ ] Image upload and management
- [ ] Draft/publish workflow
- [ ] SEO metadata fields
- [ ] Post scheduling
- [ ] Author management

### CRM Features
- [x] User registration/authentication (backend + frontend complete)
- [x] Email verification (User account — verification email sent on register; Subscriber verification already done)
- [x] Profile management (`/profile` route — read-only profile view)
- [ ] Edit profile (name, bio, website, avatar)
- [ ] Subscription preferences
- [ ] Unsubscribe handling
- [ ] User activity tracking

---

## Phase 4: Email & Mailgun Integration � IN PROGRESS

### Mailgun Setup
- [ ] Add Mailgun API credentials to `.env` *(user action — credentials not yet configured)*
  - `MAILGUN_API_KEY`
  - `MAILGUN_DOMAIN`
  - `MAILGUN_FROM_EMAIL`
  - `MAILGUN_WEBHOOK_SIGNING_KEY`
- [x] Create email service abstraction layer (`src/services/emailService.ts`)
- [x] Implement transactional email templates (verification, welcome, newsletter)
- [x] Setup email verification flow (request + confirm endpoints)
- [x] Configure webhook endpoints for delivery/bounces (`/api/email/webhooks/mailgun`)

### Newsletter System
- [x] Signup form component (`NewsletterSignupCard` — compact + full variants)
- [x] Double opt-in confirmation (`/verify-email` route)
- [ ] Welcome email sequence
- [ ] Newsletter composition interface
- [ ] Bulk send with rate limiting
- [ ] Subscriber segmentation
- [ ] Unsubscribe link generation
- [ ] Analytics (opens, clicks, bounces)

---

## Phase 5: Content Migration from Ghost � IN PROGRESS

### Current fogserv.cloud Content Audit
- [ ] Crawl complete site for all articles
- [ ] Export Ghost content via API or backup
- [x] Map Ghost schema to new Prisma schema
- [x] Preserve article slugs for SEO
- [x] Write Ghost export/import script (`scripts/import-ghost.ts`)
- [ ] Run live import from Ghost JSON export
- [ ] Migrate images to new CDN/storage
- [ ] Redirect old URLs to new structure

### Priority Articles to Migrate
- [ ] "Breaking Free from the Cloud: Password Vault"
- [ ] "The Journey of fogserv.cloud"
- [ ] "From Bash History to Reality: self-hosted.info"
- [ ] Personal development articles (Stoicism, Time Management, etc.)
- [ ] Philosophy pieces (Strangest Secret, Art of Success, etc.)

---

## Phase 6: Workflows & Automation 📋 PLANNED

### GitOps Workflows
- [x] Setup Forgejo Actions for CI/CD
- [x] Automated testing on pull requests
- [ ] Automated deployment to staging
- [ ] Production deployment approval workflow
- [ ] Rollback procedures
- [ ] Backup automation

### Agentic Workflows
- [ ] Agent authentication/authorization
- [ ] Ticket creation automation
- [ ] Code review agent integration
- [ ] Documentation update enforcement
- [ ] KB synchronization on commits
- [ ] Deployment monitoring and alerts

---

## Phase 7: Wireframes & UI/UX 🔄 IN PROGRESS

### User Flows to Document
- [x] Homepage visitor → Newsletter signup
- [x] Reader → Create account → Subscribe
- [x] Author → Login → Create post → Publish
- [x] Admin → Manage users → Send campaign
- [x] User → Update preferences → Unsubscribe

### Components to Wireframe
- [x] Homepage layout (mobile + desktop)
- [x] Blog post template
- [x] Admin dashboard
- [x] Email composer
- [x] User profile page
- [x] Settings/preferences page

---

## Phase 8: Advanced Features 📋 FUTURE

### Agent Dashboard
- [ ] Real-time infrastructure status
- [ ] Deployment history visualization
- [ ] Active tickets display
- [ ] KB search and navigation
- [ ] Performance metrics

### Search & Discovery
- [ ] Full-text search across posts
- [ ] Tag-based filtering
- [ ] Related content recommendations
- [ ] Knowledge Base search
- [ ] Search analytics

### Community Features
- [ ] Comments system (or disable for MVP)
- [ ] User bookmarks/favorites
- [ ] Social sharing
- [ ] RSS feeds
- [ ] Email digests

---

## Technical Debt & Improvements

### Code Quality
- [ ] Add TypeScript strict mode
- [ ] Setup ESLint rules enforcement
- [ ] Add Prettier for code formatting
- [ ] Implement unit tests (Vitest)
- [ ] Add E2E tests (Playwright)
- [ ] Setup code coverage reporting

### Performance
- [ ] Implement image optimization
- [ ] Add lazy loading for routes
- [ ] Setup CDN for static assets
- [ ] Configure caching strategies
- [ ] Optimize database queries
- [ ] Add performance monitoring

### Security
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Setup Content Security Policy
- [ ] Enable security headers
- [ ] Add input validation/sanitization
- [ ] Setup security audit process

---

## Completion Criteria

### MVP Launch Ready
- [ ] All Phase 1-3 tasks complete
- [ ] Email integration functional
- [ ] At least 5 articles migrated
- [ ] Basic admin dashboard working
- [ ] Production deployment successful
- [ ] Monitoring and alerts active

### Full Launch
- [ ] All core features implemented
- [ ] Complete content migration
- [ ] Agent dashboard operational
- [ ] Documentation comprehensive
- [ ] Security audit passed
- [ ] Performance benchmarks met

---

## Session Change Log

### April 21, 2026 - Tasks List Continuation & KB Sync
- Audited task status against existing KB artifacts and updated this board to reflect reality.
- Marked completed docs that already exist (`agent.md`, `lessons-learned.md`, `problems-solved.md`, `implementations.md`).
- Corrected stale KB references to current categorized paths (`frontend/website-rebuild.md`, `sysadmin/dotenvx.md`).
- Created `workflows.md` and `wireframes.md` to complete remaining Phase 2 KB documentation tasks.

### April 21, 2026 - CRM/CMS Schema Progress Sync
- Reviewed `prisma/schema.prisma` and confirmed data-model coverage for User/Auth, Posts, Tags/Categories, Subscribers, Campaigns, and analytics entities.
- Marked Phase 3 database design checklist items complete.
- Created baseline Prisma migration `20260422064615_phase3_cms_crm_foundation` and migration lock file under `prisma/migrations/`.
- Moved focus to CMS and CRM feature implementation tasks.

### April 21, 2026 - CI Baseline Workflow Added
- Added Forgejo Actions workflow at `.forgejo/workflows/ci.yml`.
- Configured push and pull request checks for dependency install, Prisma client generation, lint, and type-check.
- Added conditional test step so CI will run tests automatically once a `test` script exists.

### April 22, 2026 - Admin Dashboard Foundation
- Implemented `/admin` route foundation in `src/main.tsx` with dashboard scaffold sections (KPI cards, content queue, quick actions, implementation status).
- Added Admin navigation link so the dashboard is reachable from the primary header.
- Marked Phase 3 "Admin dashboard layout" task complete.

### April 22, 2026 - Mailgun Service Abstraction Layer
- Added typed email service foundation at `src/services/emailService.ts` with provider modes (`console` and `api`).
- Added template rendering pipeline for verification, welcome, and newsletter email payload generation.
- Added frontend environment typing and placeholders for email provider configuration.
- Marked Phase 4 "Create email service abstraction layer" task complete.

### April 22, 2026 - Transactional Email End-to-End Wiring
- Added backend API wiring for `/api/email/send` in `vite.config.ts` middleware (dev/preview) with Mailgun delivery when credentials are present.
- Added admin dashboard email sandbox in `src/main.tsx` to send verification template payloads through the email service.
- Fixed TypeScript deprecation blocking `type-check` by adding `ignoreDeprecations` in `tsconfig.json`.
- Marked Phase 4 "Implement transactional email templates" task complete.

### April 22, 2026 - Ghost Migration Map and Slug Plan
- Added `kb/migrations/ghost-content-migration-map.md` with Ghost-to-Prisma field mapping rules.
- Documented deterministic slug preservation and conflict handling policy.
- Added redirect-manifest strategy for preserving legacy URL behavior.
- Marked Phase 5 mapping and slug-preservation planning tasks complete.

### April 22, 2026 - Email Verification Flow Implemented
- Added `/api/email/verification/request` and `/api/email/verification/confirm` endpoint handling in `vite.config.ts` middleware.
- Wired verification token persistence to Prisma `Subscriber` records (`confirmToken`, `status`, `confirmedAt`).
### August 12, 2026 - Bug Fixes, Plan Creation & Dev Server Setup
- Fixed `src/services/emailService.ts` missing closing brace causing `createGateway` ReferenceError (browser console.log)
- Fixed `src/components/RichTextEditor.tsx` duplicate import causing TypeScript build error
- Verified `bun run type-check` passes with zero errors
- Started dev server in tmux session `fogserv-dev` on http://localhost:5173/
- Created comprehensive completion plan with 6 stages, 44 tasks mapped
- Updated Knowledge Base with current project state assessment
- Identified immediate priorities: CMS post CRUD, image upload, admin dashboard real data

---

## Next Session Priorities:
1. Implement `/api/posts/:id` PUT/DELETE endpoints for post editing
2. Wire admin dashboard post list to real Prisma data (replace mock)
3. Add image upload endpoint and wire TipTap image extension
4. Implement `/api/users/:id` PUT endpoint for profile editing
5. Add input validation and rate limiting to API endpoints
- Added `NewsletterSignupCard` component in `src/main.tsx` with full and compact (`compact` prop) variants.
- Compact variant wired into the footer "Connect" section.
- Full variant added as a dedicated homepage section between Core Pillars and Latest Updates.
- Added `/verify-email` route + `VerifyEmailPage` that reads `?token=` and `?email=` query params and auto-confirms on load via `emailService.confirmVerification`.
- Updated backend `/api/email/verification/request` to include `email` param in the verification URL.
- Updated `emailService.confirmVerification` signature to accept `{ token, email }` for full round-trip support.
- Marked Phase 4 "Signup form component" and "Double opt-in confirmation" tasks complete.

### April 22, 2026 - Ghost Import Script Implemented
- Created `scripts/import-ghost.ts` — Bun/TypeScript script that reads a Ghost JSON export and seeds Prisma records.
- Supports `--dry-run` (validate only) and `--verbose` flags.
- Maps Ghost posts → `Post`, users → `User`, tags → `Tag`/`Category`, junction rows → `PostTag`/`PostCategory`.
- Implements slug-uniqueness conflict handling (append -2, -3) and writes `kb/migrations/ghost-redirect-manifest.json`.
- Added `import:ghost` npm script to `package.json`.
- Marked Phase 5 import script task complete.

### April 22, 2026 - CRM User Registration & Authentication Complete
- Added backend auth endpoints in `vite.config.ts`: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- Auth uses native `crypto.scrypt` (no bcrypt dep); passwords stored as `salt:hexKey`; sessions as 30-day `Session` table rows.
- Added `AuthProvider` React context to `src/main.tsx` wrapping the entire app.
- Added `useAuth()` hook for consuming auth state throughout the component tree.
- Added `LoginPage` at `/login` with email/password form and error handling.
- Added `RegisterPage` at `/register` with name/email/password/confirm form; auto-login on success.
- Added `ProfilePage` at `/profile` showing user details (role, status, email verified date, bio, website, member since).
- Updated `Navigation` component to show Sign In + Register links when logged out, or username chip + Sign Out when authenticated.
- Registered `loginRoute`, `registerRoute`, `profileRoute` in TanStack Router route tree.
- Marked Phase 3 CRM user registration/authentication, email verification (user), and profile management tasks complete.

### April 22, 2026 - Rich Text Editor (TipTap) Integrated
- Installed TipTap editor stack: `@tiptap/react`, `@tiptap/starter-kit`, placeholder/link/image/character-count extensions.
- Added reusable `RichTextEditor` component to `src/main.tsx` with toolbar controls (bold/italic/headings/lists/blockquote/code/horizontal-rule/undo/redo).
- Added `PostEditorPage` at `/admin/new-post` with title, slug, excerpt, rich body, tags, and draft/publish actions.
- Added backend CMS endpoints in `vite.config.ts`: `POST /api/posts` and `GET /api/posts`.
- Wired authenticated post creation with slug dedupe, optional tag creation/upsert, and post-tag relations.
- Added TipTap-specific editor styles in `src/index.css` for placeholder and content formatting.
- Updated admin quick actions to open the new editor route.
- Marked Phase 3 "Rich text editor integration" task complete.

### April 22, 2026 - Agentic Workflow Logging Refresh
- Updated `kb/agentic/agentic-workflows.md` with active-session patterns:
  - Sequential `continue` workflow
  - Single-file safety checks (`grep_search` before insert)
  - Mandatory post-change `get_errors` validation
  - KB-first session discipline (`tasks`, `lessons-learned`, `implementations`)
- Added new lessons to `kb/lessons-learned.md` (Lessons 16-20) for auth, single-file duplication risks, Vite middleware backend pattern, and Ghost import strategy.
- Added architecture notes in `kb/implementations.md` for auth system, newsletter verification flow, and single-file ordering conventions.

### April 22, 2026 - Mailgun Webhook Endpoints Added
- Added `/api/email/webhooks/mailgun` endpoint handling in `vite.config.ts` for Mailgun event ingestion.
- Added optional webhook signature verification using `MAILGUN_WEBHOOK_SIGNING_KEY`.
- Wired subscriber status/engagement updates for accepted, opened, clicked, failed/bounced, complained, and unsubscribed events.
- Marked Phase 4 "Configure webhook endpoints for delivery/bounces" task complete.

### February 25, 2026 - 01:51 PM - WIP Guardrails & Analysis
- Analyzed project structure and confirmed `main.tsx` as the current routing source.
- Added "Work in Progress" banner to all pages to prevent premature deployment.
- Updated Knowledge Base documentation with latest discoveries.
- Prepared for local development environment session.

### January 30, 2026 - 03:00 AM - Initial Setup
- Created project structure
- Setup React + TanStack + Prisma stack
- Fixed hydration errors
- Built multi-page site with navigation
- Created initial KB documentation
- **Issues Resolved:** PostCSS ES module, React HTML nesting

---

## Related Files

- `/kb/TELOS.md` - Mission and philosophy
- `/kb/README.md` - KB navigation and structure
- `/kb/agent.md` - Agent reference
- `/kb/frontend/website-rebuild.md` - Technical session notes
- `/kb/sysadmin/dotenvx.md` - Secrets management
- `/kb/lessons-learned.md` - Session insights
- `/kb/problems-solved.md` - Troubleshooting and solutions
- `/kb/implementations.md` - Architecture and implementation decisions
- `/kb/agentic/agentic-workflows.md` - Existing workflow foundation to consolidate
- `/kb/workflows.md` - Unified workflow runbook
- `/kb/wireframes.md` - MVP UX and wireframe specifications
- `/SECRETS_MANAGEMENT.md` - Root-level secrets guide
- `package.json` - Dependencies and scripts
- `prisma/schema.prisma` - Database models
- `prisma/migrations/20260422064615_phase3_cms_crm_foundation/migration.sql` - Baseline CRM/CMS migration
- `prisma/migrations/migration_lock.toml` - Prisma migration state tracking
- `.forgejo/workflows/ci.yml` - Baseline CI workflow for lint/type-check/test gating
- `src/main.tsx` - Admin dashboard route and UI foundation
- `src/services/emailService.ts` - Mailgun-ready email service abstraction and template rendering
- `src/vite-env.d.ts` - Typed email service environment variables
- `.env.example` - Mailgun and email-provider configuration placeholders
- `vite.config.ts` - Backend `/api/email/send` middleware and Mailgun API wiring
- `src/main.tsx` - Admin email sandbox for transactional template testing
- `tsconfig.json` - TypeScript deprecation compatibility setting
- `kb/migrations/ghost-content-migration-map.md` - Ghost schema mapping and slug preservation plan
- `vite.config.ts` - Verification request/confirm API endpoints and Mailgun route handling
- `src/services/emailService.ts` - Verification request/confirm client methods
- `src/main.tsx` - Admin verification request/confirm UI controls
- `.env.example` - Added `APP_BASE_URL` and API-provider defaults for email flow
- `vite.config.ts` - Mailgun webhook endpoint and signature verification
- `.env.example` - Added `MAILGUN_WEBHOOK_SIGNING_KEY`

---

**Next Session Priorities:**
1. Newsletter signup form + double opt-in UI flow
2. User registration/authentication endpoints (CRM)
3. Rich text editor integration (TipTap) in admin
4. Run live Ghost import once export is available
5. Campaign analytics dashboard cards from webhook metrics
