# Architecture & Implementation Decisions

**Session:** January 30, 2026  
**Project:** fogserv.cloud Website Rebuild

This document captures architectural decisions, technology choices, and implementation patterns used throughout the project, serving as institutional knowledge for future development and agent operations.

---

## Technology Stack

### Core Framework: React 19 + TanStack + Vite

**Decision:** Use modern React with TanStack ecosystem  
**Rationale:**
- React 19 offers improved performance and DX
- TanStack Router provides type-safe routing
- TanStack Query (future) for server state
- Vite for instant HMR and fast builds
- Mature ecosystem with excellent docs

**Alternatives Considered:**
- Next.js: Too opinionated, vendor lock-in concerns
- Remix: Steep learning curve, less flexible routing
- SvelteKit: Smaller ecosystem, less TypeScript support
- Astro: Better for static, we need full-stack

**Trade-offs:**
- ✅ Maximum flexibility and control
- ✅ Best-in-class DX and performance
- ❌ More setup than meta-frameworks
- ❌ Need to configure SSR/SSG manually

---

### Package Manager: Bun

**Decision:** Use Bun for all package management and runtime  
**Rationale:**
- 10x faster than npm/yarn
- Built-in TypeScript support
- Drop-in Node.js replacement
- Native test runner included
- Compatible with existing ecosystem

**Alternatives Considered:**
- npm: Slow, standard but dated
- yarn: Better than npm, still slower than Bun
- pnpm: Fast, but Bun is faster and has runtime

**Trade-offs:**
- ✅ Incredible speed improvements
- ✅ Single tool for everything
- ❌ Relatively new (but stable)
- ❌ Some edge cases with native modules

---

### Database: PostgreSQL + Prisma + Accelerate

**Decision:** Use Prisma ORM with Accelerate connection pooling  
**Rationale:**
- Type-safe database queries
- Automatic migrations generation
- Excellent TypeScript integration
- Accelerate provides edge caching and pooling
- Superior DX with Prisma Studio

**Architecture:**
```
Application → Prisma Client → Prisma Accelerate → PostgreSQL
                                    ↓
                              Connection Pool
                              Edge Caching
                              Query Optimization
```

**Environment Variables:**
- `DATABASE_URL`: SQLite for local dev
- `PRISMA_ORM`: Accelerate URL for production
- `PRISMA_ANY`: Direct PostgreSQL for migrations

**Alternatives Considered:**
- Drizzle: Less mature, fewer features
- TypeORM: Clunky API, poor TypeScript support
- Kysely: Too low-level, no migration tooling
- Raw SQL: No type safety, more boilerplate

**Trade-offs:**
- ✅ Best DX in the ecosystem
- ✅ Type safety end-to-end
- ✅ Built-in caching with Accelerate
- ❌ Vendor lock-in to Prisma
- ❌ Some advanced SQL queries need raw syntax

---

### Styling: Tailwind CSS v4

**Decision:** Use Tailwind v4 with new PostCSS architecture  
**Rationale:**
- Utility-first approach fits component model
- New v4 is faster and simpler
- Excellent dark mode support
- Great responsive design utilities
- Zero runtime overhead

**Configuration:**
```js
// tailwind.config.ts
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: { ... } },
}

// src/index.css
@import "tailwindcss";
```

**Alternatives Considered:**
- CSS Modules: Too verbose, harder to maintain
- Styled Components: Runtime overhead, slow SSR
- Vanilla CSS: No design system, inconsistent
- Chakra UI: Too opinionated, heavier bundle

**Trade-offs:**
- ✅ Rapid prototyping and iteration
- ✅ Consistent design system
- ✅ Excellent performance
- ❌ Learning curve for class names
- ❌ Large HTML class attributes

---

### Secrets Management: dotenvx

**Decision:** Use dotenvx for all environment variable handling  
**Rationale:**
- Superior to traditional dotenv libraries
- Built-in encryption for production secrets
- Multiple environment support
- CLI-based injection (no code changes)
- Works seamlessly with CI/CD

**Pattern:**
```json
{
  "scripts": {
    "dev": "dotenvx run -- vite",
    "build": "dotenvx run -- vite build"
  }
}
```

**Alternatives Considered:**
- dotenv: No encryption, less flexible
- dotenv-expand: Still lacks encryption
- Manual process.env: Error-prone, insecure
- Vault/Secrets Manager: Over-engineered for our scale

**Trade-offs:**
- ✅ Security by default
- ✅ Clean separation of concerns
- ✅ Easy CI/CD integration
- ❌ Additional dependency
- ❌ Need to document for team

---

## Application Architecture

### Routing Strategy

**Decision:** Single-file router configuration with inline components (MVP)  
**Future:** Migrate to file-based routing with `@tanstack/router-plugin`

**Current Structure:**
```
src/
  main.tsx          # Router config + all page components
  index.css         # Global styles
  routes/
    __root.tsx      # Legacy, kept for reference
    index.tsx       # Legacy, kept for reference
```

**Rationale:**
- Faster initial development
- Easier to understand for single developer
- Can refactor to file-based routing later
- Reduces cognitive overhead during MVP phase

**Future Migration Path:**
```
src/
  routes/
    __root.tsx      # Layout with <Outlet />
    index.tsx       # HomePage
    about.tsx       # AboutPage
    blog/
      index.tsx     # BlogPage
      $slug.tsx     # Individual post
    kb/
      index.tsx     # KnowledgeBasePage
      $doc.tsx      # Individual KB document
```

---

### Component Patterns

**Navigation Component:**
- Sticky header with `position: fixed`
- Consistent across all pages
- Active link styling via TanStack Router
- Responsive mobile menu (future)

**Footer Component:**
- Grid layout for link sections
- Social/community links
- Copyright and mission statement

**Page Components:**
- Full-height layouts
- Consistent spacing (py-20)
- Max-width container (max-w-7xl)
- Responsive padding (px-4 sm:px-6 lg:px-8)

**Card Components:**
- Reusable for content previews
- Hover effects for interactivity
- Border + backdrop-blur for depth
- Consistent styling system

---

### State Management

**Current:** React component state only  
**Future:** TanStack Query for server state

**Rationale:**
- No global state needed yet
- Server state via TanStack Query when needed
- Form state with React Hook Form
- URL state via TanStack Router

**Pattern:**
```tsx
// Server state (future)
const { data, isLoading } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})

// Form state (future)
const { register, handleSubmit } = useForm()

// URL state
const { slug } = useParams({ from: '/blog/$slug' })
```

---

## Database Schema Design

### Current Schema (Prisma)

The schema is now expanded and active across CMS, CRM, and analytics domains.

**Auth and users:**
- `User` with role, status, profile fields, and authentication metadata
- `Session` for token-based session tracking

**CMS models:**
- `Post` with status, type, scheduling, SEO metadata, and analytics counters
- `Tag`, `Category`, `PostTag`, and `PostCategory` for taxonomy and many-to-many mapping
- `Comment` with moderation and threaded reply support

**CRM and email models:**
- `Subscriber`, `EmailList`, `SubscriberList`, and `SubscriberTag`
- `Campaign`, `CampaignLog`, and `EmailTemplate`

**Analytics models:**
- `PageView` and `LinkClick`

### Migration Baseline

The first migration has been created and applied for the current schema foundation:

- `prisma/migrations/20260422064615_phase3_cms_crm_foundation/migration.sql`
- `prisma/migrations/migration_lock.toml`

This establishes the baseline for future incremental migrations tied to feature delivery.

---

## API Design (Future)

### Email Service Abstraction (Implemented Foundation)

An email service layer now exists at `src/services/emailService.ts` with two execution modes:

- `console` provider for safe local development and preview environments
- `api` provider for backend-integrated sending (intended Mailgun path)

The service exposes:

- `sendTransactional(...)` for template-driven delivery
- `sendCustom(...)` for direct subject/body payloads

Current transactional templates in the foundation:

- verification
- welcome
- newsletter

Runtime behavior is controlled by typed Vite env vars:

- `VITE_EMAIL_PROVIDER=console|api`
- `VITE_EMAIL_API_BASE_URL=/api`

This keeps Mailgun secrets out of frontend code while allowing integration to be wired through server routes.

### Transactional Email Backend Wiring (Implemented)

Backend API wiring for transactional send is implemented at:

- `POST /api/email/send`

Current implementation details:

- Implemented as Vite middleware in `vite.config.ts` for dev and preview runtime.
- Uses server-side env credentials (`MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM_EMAIL`).
- Falls back to local-success response when Mailgun credentials are not present to keep development workflows unblocked.

Admin-level end-to-end test path:

- `src/main.tsx` includes an Email Sandbox panel under `/admin`.
- The sandbox calls `emailService.sendTransactional(...)` using the verification template.
- Requests route through `/api/email/send`, validating the full frontend-to-backend payload path.

### Email Verification Flow (Implemented)

Verification endpoints are now implemented and connected to subscriber state:

- `POST /api/email/verification/request`
- `POST /api/email/verification/confirm`

Verification request behavior:

- Normalizes subscriber email and upserts into `Subscriber`.
- Writes `confirmToken` and sets status to `PENDING`.
- Sends verification email containing tokenized verify URL.

Verification confirm behavior:

- Resolves subscriber by `confirmToken`.
- Sets status to `ACTIVE` and populates `confirmedAt`.
- Clears `confirmToken` after successful confirmation.

Client integration:

- `src/services/emailService.ts` exposes `requestVerification(...)` and `confirmVerification(...)` helpers.
- Admin sandbox UI can request and confirm verification end-to-end for validation.

### Mailgun Webhook Ingestion (Implemented)

Webhook endpoint:

- `POST /api/email/webhooks/mailgun`

Implementation details:

- Implemented in `vite.config.ts` middleware for dev/preview runtime.
- Supports JSON and form-urlencoded webhook bodies.
- Optional signature verification using `MAILGUN_WEBHOOK_SIGNING_KEY`.

Subscriber-state mapping currently applied:

- `accepted` -> increments `emailsSent`
- `opened` -> increments `emailsOpened`, sets `lastOpenedAt`
- `clicked` -> increments `linksClicked`, sets `lastClickedAt`
- `failed` / `bounced` -> sets `status=BOUNCED`
- `complained` -> sets `status=COMPLAINED`
- `unsubscribed` -> sets `status=UNSUBSCRIBED`, sets `unsubscribedAt`

This provides immediate lifecycle tracking for subscriber health while campaign-level correlation remains a follow-up task.

### RESTful Endpoints

```
GET    /api/posts              # List all posts
GET    /api/posts/:slug        # Get single post
POST   /api/posts              # Create post (auth)
PATCH  /api/posts/:id          # Update post (auth)
DELETE /api/posts/:id          # Delete post (auth)

POST   /api/subscribe          # Newsletter signup
POST   /api/unsubscribe        # Unsubscribe
POST   /api/contact            # Contact form

GET    /api/kb                 # List KB documents
GET    /api/kb/:slug           # Get KB document
```

### API Route Structure (Vite/TanStack)
```
src/
  api/
    posts.ts
    subscribe.ts
    kb.ts
```

---

## Security Patterns

### Environment Variables
- Never commit `.env`
- Use dotenvx encryption for production
- Prefix client vars with `VITE_`
- Validate all env vars at startup

### Database Security
- Use Prisma parameterized queries (prevents SQL injection)
- Enable row-level security in PostgreSQL
- Limit connection pool size
- Use read-only replicas for public queries

### Authentication (Future)
- JWT tokens with httpOnly cookies
- Refresh token rotation
- Rate limiting on auth endpoints
- Password hashing with bcrypt/argon2

### API Security (Future)
- CORS configured for specific origins
- Rate limiting with Redis
- Input validation with Zod
- CSRF tokens for mutations
- Security headers (CSP, X-Frame-Options, etc.)

---

## Performance Patterns

### Code Splitting
```tsx
const AdminDashboard = lazy(() => import('./pages/Admin'))
```

### Image Optimization
- Use `<img loading="lazy">` for below-fold images
- Serve WebP with fallbacks
- CDN for static assets
- Responsive images with srcset

### Database Optimization
- Index frequently queried fields
- Use Prisma Accelerate for edge caching
- Connection pooling via Accelerate
- Batch queries with dataloader pattern

### Bundle Optimization
- Tree shaking enabled by default (Vite)
- Code splitting by route
- Dynamic imports for heavy libraries
- Remove unused CSS with Tailwind purge

---

## Testing Strategy (Future)

### Unit Tests
- Vitest for unit testing
- React Testing Library for components
- Coverage target: 80%+

### Integration Tests
- API endpoint testing
- Database integration tests
- Email sending tests (with mock SMTP)

### E2E Tests
- Playwright for user flows
- Critical paths: signup, post creation, email campaigns
- Run on every PR

---

## Deployment Strategy (Future)

### CI/CD Pipeline (Forgejo Actions)
```yaml
name: Deploy
on:
  push:
    branches: [main]
steps:
  - Checkout code
  - Install dependencies (bun install)
  - Run tests
  - Run database migrations
  - Build production bundle
  - Deploy to server
  - Health check
```

### Deployment Targets
- **Staging:** Auto-deploy on push to `develop`
- **Production:** Manual approval on push to `main`
- **Rollback:** Git revert + redeploy

### Monitoring
- Uptime monitoring (UptimeRobot or similar)
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics or similar)
- Log aggregation (self-hosted Loki or similar)

---

## File Organization

### Project Structure
```
fogserv.cloud/
├── src/
│   ├── main.tsx           # Entry point + router
│   ├── index.css          # Global styles
│   └── routes/            # Legacy route files
├── kb/                     # Knowledge Base
│   ├── TELOS.md           # Mission & philosophy
│   ├── tasks.md           # Task tracking
│   ├── lessons-learned.md # Session insights
│   ├── problems-solved.md # Technical issues
│   └── implementations.md # This file
├── prisma/
│   └── schema.prisma      # Database models
├── .env                   # Local secrets (not committed)
├── .env.example           # Template (committed)
├── package.json           # Dependencies + scripts
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind configuration
└── tsconfig.json          # TypeScript configuration
```

---

## Naming Conventions

### Files
- Components: PascalCase (`BlogCard.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Pages: PascalCase (`HomePage.tsx`)
- Config: kebab-case (`vite.config.ts`)

### Code
- Components: PascalCase (`function BlogCard()`)
- Functions: camelCase (`function fetchPosts()`)
- Constants: UPPER_SNAKE_CASE (`const API_URL`)
- Types: PascalCase (`type User`, `interface PostProps`)

### Database
- Tables: PascalCase (`model User`)
- Fields: camelCase (`createdAt`, `firstName`)
- Relations: camelCase (`author`, `posts`)

---

## Future Considerations

### Internationalization
- Use `react-i18next` when needed
- Store translations in JSON files
- Detect locale from browser

### Analytics
- Self-hosted Plausible or Umami
- Privacy-focused, no cookies
- Track page views and user flows

### Content Versioning
- Store post revisions in database
- Enable restore to previous version
- Show diff between versions

### Multi-tenancy (Far Future)
- Support multiple blogs on one instance
- Separate databases or RLS
- Custom domains per tenant

---

**Last Updated:** April 22, 2026  
**Decisions Made:** 20+  
**Related Files:**
- `/kb/lessons-learned.md` - What we learned
- `/kb/problems-solved.md` - Issues resolved
- `/kb/tasks.md` - Project tracking
- `/kb/TELOS.md` - Guiding principles

---

## Auth System (April 2026)

### Session-Based Auth with Native Crypto

**Decision:** Implement auth using Node.js `crypto.scrypt`, Prisma `Session` table, and Bearer tokens. No third-party auth library.

**Password storage:** `salt:derivedKey` — 16-byte random salt, 64-byte scrypt key, both hex-encoded.

**Session lifecycle:** 30-day expiry stored in DB. `getSessionUser(req)` reads `Authorization: Bearer <token>`, validates, auto-deletes expired rows.

**User enumeration protection:** When no user is found, run a dummy `verifyPassword` call so the response time is constant.

**Registration flow:**
1. Validate email + password (≥8 chars)
2. Check for existing user
3. Hash password, create `User` (status `PENDING_VERIFICATION`)
4. Create `Subscriber` record with confirm token, send verification email
5. Return `{ ok, userId, email }` — no token yet (user must verify email first, then login)

**Login flow:**
1. Fetch user by email (or run dummy hash if not found)
2. `timingSafeEqual` comparison
3. Check `SUSPENDED` status
4. Create `Session`, update `lastLoginAt`
5. Return `{ ok, token, user: { id, email, name, role, status, avatar } }`

**Frontend `AuthContext` pattern:**
```tsx
// Provider wraps RouterProvider — NOT inside a route component
<AuthProvider>
  <RouterProvider router={router} />
</AuthProvider>
```
`useAuth()` exposes: `{ auth: AuthState, login, logout, register }`. Token stored in `localStorage` under key `fogserv_session_token`.

---

## Newsletter Double Opt-In (April 2026)

**`NewsletterSignupCard` component:** Two variants — `compact` (footer) and full (homepage section). State machine: `idle → loading → success | error`.

**Verification URL:** `/verify-email?token=<token>&email=<email>` — both params required because the backend `confirmVerification` needs the email to look up the subscriber when the token alone is ambiguous.

**`VerifyEmailPage`:** Reads URL params on mount, auto-calls `emailService.confirmVerification({ token, email })`, shows loading/success/error states.

---

## Single-File Architecture Notes (`src/main.tsx`)

The entire frontend (components, routes, services, context) lives in one file (`src/main.tsx`). This is intentional for this phase of development — avoids premature abstraction.

**Ordering convention:**
1. Imports
2. Auth types + `AuthContext` + `AuthProvider` + `useAuth`
3. KB data types + glob imports
4. Utility components (Card, etc.)
5. Page components (alphabetical within phase groupings)
6. Auth page components (LoginPage, RegisterPage, ProfilePage)
7. Route definitions
8. Router construction + `ReactDOM.createRoot`

**Duplication risk:** When summarized context is resumed, the agent may not know a block was already written. Always `grep_search` for the symbol before inserting.

