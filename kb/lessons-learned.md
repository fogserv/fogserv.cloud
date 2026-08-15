# Session Learnings & Discoveries

**Last Updated:** April 22, 2026

---

**Session Date:** April 22, 2026  
**Duration:** Multi-turn agentic session  
**Objective:** CRM auth backend + frontend, newsletter UI, Ghost import script, KB audit

---

## Key Learnings

### 16. Auth Without Third-Party Libraries (native crypto.scrypt)

**Problem:** Adding `bcrypt` introduces a native binary dependency that complicates Bun/edge deployments.  
**Solution:** Node.js `crypto.scrypt` (promisified) is sufficient for production password hashing:
```ts
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
const scryptAsync = promisify(scrypt)

async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const key = (await scryptAsync(plain, salt, 64)) as Buffer
  return `${salt}:${key.toString('hex')}`
}
```
**Lesson:** Always use `timingSafeEqual` for both HMAC (webhooks) and password verification. If you import it twice under different names, alias one: `import { timingSafeEqual as tse } from 'node:crypto'`.

---

### 17. React Context for Auth in Single-File Apps

**Problem:** `useAuth()` called inside `Navigation` but `AuthProvider` wraps the whole app — works fine when wired correctly, but easy to forget the provider wraps `<RouterProvider>`.  
**Solution Pattern:**
```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
)
```
**Lesson:** Auth context must wrap the router, not sit inside a route component, or `useAuth()` will throw/return defaults on the initial render for protected pages.

---

### 18. Duplicate Symbol Insertion Pitfall in Long Single-File Projects

**Problem:** When conversation context summarizes, the agent may not know which blocks already exist in a file. Inserting auth helpers that were already written creates duplicate `const`/`function` declarations → TypeScript compile errors.  
**Detection:** `get_errors` immediately shows `Duplicate identifier` / `Cannot redeclare block-scoped variable`.  
**Fix:** Search the file for the symbol name before inserting; remove the duplicate block rather than rewriting both.  
**Lesson:** For projects with a large single-file pattern (`main.tsx` > 1000 lines), run `grep_search` for key symbol names before any insertion to confirm they don't already exist.

---

### 19. Vite Config as Full-Stack API Server (Middleware Pattern)

**Pattern:** All backend API routes live in `vite.config.ts` as a Vite dev/preview middleware. This works in dev and preview mode; in production you'd need a separate server or an adapter.  
**Benefit:** Zero extra processes — one `bun run dev` starts both the frontend and the API.  
**Limitation:** Not production-grade for high traffic; plan a migration to a real server (e.g., Hono, Elysia, or Bun's native HTTP) before launch.  
**Session pattern:**
```ts
server: {
  middlewareMode: false, // runs as normal dev server
},
plugins: [react(), {
  name: 'api-middleware',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url?.startsWith('/api/')) { /* handle */ return }
      next()
    })
  }
}]
```

---

### 20. Ghost JSON Export → Prisma Seed Script (Bun)

**Key decisions:**
- Read `ghost-export.json` (the `.json` inside the `.zip`) from CLI arg.
- Use `--dry-run` to validate without writing; `--verbose` for row-by-row logging.
- Slug conflicts: append `-2`, `-3` rather than erroring; write a redirect manifest so old URLs still resolve.
- Tag prefix `category:` → `Category` model; all others → `Tag`.
- Run with `bun run import:ghost path/to/export.json`.

---

### 11. Proactive WIP Guardrails

**Problem:** User wants to prevent accidental deployment of a work-in-progress site.  
**Discovery:** Adding a persistent, aesthetic banner to the `RootLayout` ensures the development status is clear on every single page.  
**Solution:** 
- Modified `src/main.tsx` (current router source) and `src/routes/__root.tsx` (legacy/planned source).
- Used a subtle `amber-500/10` background with a wide-tracking uppercase "WORK IN PROGRESS" label.

**Lesson:** Always implement visual state indicators when working on live-adjacent environments to prevent user confusion or premature deployment.

---

**Session Date:** January 30, 2026  
**Duration:** ~3 hours  
**Objective:** Setup React/TanStack/Prisma stack for fogserv.cloud rebuild

---

## Key Learnings

### 1. React 19 + TanStack Router Hydration

**Problem:** Cannot render `<html>` elements inside React root div  
**Discovery:** React expects to mount inside an existing HTML structure, not replace it  
**Solution:** 
- Keep `<html>`, `<head>`, `<body>` in `index.html`
- React components mount inside `<div id="root">`
- Root route component is just a wrapper div with `<Outlet />`

**Lesson:** When using SSR/SSG frameworks, understand where the boundary is between static HTML and React hydration.

---

### 2. Tailwind CSS v4 Architecture Change

**Problem:** `tailwindcss` package cannot be used directly as PostCSS plugin  
**Discovery:** Tailwind v4 separated the PostCSS plugin into `@tailwindcss/postcss`  
**Solution:**
```bash
bun add -d @tailwindcss/postcss
```

Update `postcss.config.js`:
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

Update CSS import:
```css
@import "tailwindcss";  /* Not @tailwind directives */
```

**Lesson:** Major version upgrades may restructure packages. Always check migration guides.

---

### 3. ES Modules in Node.js Ecosystem

**Problem:** PostCSS config threw "module is not defined" error  
**Discovery:** `package.json` has `"type": "module"`, making all `.js` files ES modules by default  
**Solution:** Use `export default` instead of `module.exports` in config files

**Lesson:** When `"type": "module"` is set, all config files need ES module syntax or `.cjs` extension.

---

### 4. dotenvx Integration Pattern

**Discovery:** dotenvx provides a cleaner approach than traditional dotenv libraries  
**Benefits:**
- Wraps commands with environment injection
- Supports multiple .env files with precedence
- Built-in encryption for production secrets
- No code changes needed—works at npm script level

**Implementation Pattern:**
```json
{
  "scripts": {
    "dev": "dotenvx run -- vite",
    "db:push": "dotenvx run -- prisma db push"
  }
}
```

**Lesson:** Environment injection at the script level is more maintainable than in-code loading.

---

### 5. Prisma Accelerate Connection Architecture

**Discovery:** Prisma offers two connection methods:
1. **PRISMA_ORM** (Accelerate): Connection pooling + edge caching
2. **PRISMA_ANY** (Direct): Standard PostgreSQL connection

**Best Practice:**
- Use Accelerate for production queries (performance)
- Use direct connection for migrations and Prisma Studio (management)

**Lesson:** Separate read/write optimizations from admin operations for better performance.

---

### 6. Current fogserv.cloud Content Strategy

**Discovery:** Production site is Ghost-based blog with rich philosophical content  
**Content Themes:**
- Personal development (time management, stoicism, Buddhist philosophy)
- Self-hosting advocacy (password vault, self-hosted.info)
- Classic wisdom (Sounds of Silence, Wear Sunscreen, etc.)

**Strategic Insight:** The mission "helping people help themselves" is already manifest in content—rebuild should preserve this.

**Lesson:** Don't reinvent what already works. Migrate valuable content; enhance infrastructure.

---

### 7. TanStack Router Simplification

**Problem:** Initially tried to use file-based routing with separate route files  
**Discovery:** For MVP, inline route definitions are simpler and more maintainable  
**Solution:**
```tsx
const rootRoute = createRootRoute({ component: RootLayout })
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})
const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, ...])
```

**Lesson:** Start simple. File-based routing can be added later with `@tanstack/router-plugin`.

---

### 8. Knowledge Base as Living Memory

**Insight:** The `/kb/` directory isn't just documentation—it's the system's memory  
**Pattern Observed:**
- Each document has status, last updated, session notes
- Change logs track what was learned and why
- Cross-references create a knowledge graph
- Agents are mandated to update after each session

**Implementation:**
- TELOS.md as north star
- Topical guides (GitOps, Prisma, TanStack, etc.)
- Session notes (website-rebuild.md)
- Task tracking (tasks.md)
- Learning logs (this file)

**Lesson:** Documentation-first development prevents context loss and enables autonomous agents.

---

### 9. GitOps + Ticketing + Documentation Trinity

**Discovery:** The three pillars aren't independent—they form a closed loop:

```
Issue Created → Code Written → Commit Referenced → Docs Updated → Issue Closed
     ↑                                                                    ↓
     └─────────────── KB Entry Created With Learnings ←─────────────────┘
```

**Lesson:** Every change must flow through all three systems to maintain auditability and memory.

---

### 10. Bun as Drop-in Node Replacement

**Experience:** Bun worked flawlessly as package manager and runtime  
**Benefits:**
- Faster installs than npm/yarn
- Native TypeScript support
- Compatible with existing tools (Vite, Prisma, etc.)
- Drop-in replacement for npm scripts

**No Issues Encountered:** Everything "just worked"

**Lesson:** Bun is production-ready for modern JavaScript stacks.

---

## Anti-Patterns Avoided

### ❌ Hardcoding Secrets
Could have put database URLs directly in code. Instead, used dotenvx from day one.

### ❌ Skipping Documentation
Could have rushed to build features. Instead, documented architecture and decisions immediately.

### ❌ Monolithic Components
Could have put everything in one file. Instead, structured with separate pages and components.

### ❌ Ignoring TypeScript
Could have used plain JavaScript. Instead, set up TypeScript from the start for type safety.

### ❌ Manual Environment Management
Could have used `process.env` directly. Instead, centralized via dotenvx for consistency.

---

## Tools That Exceeded Expectations

1. **TanStack Router** - More flexible than expected, great DX
2. **Prisma Accelerate** - Connection pooling + edge caching built-in
3. **Tailwind CSS v4** - Faster, better DX with new @import syntax
4. **dotenvx** - Superior to traditional dotenv libraries
5. **Bun** - Zero friction switching from Node/npm

---

## Areas for Future Exploration

1. **TanStack Query Integration** - For server state management
2. **TanStack Router Plugin** - For file-based routing at scale
3. **Prisma Pulse** - For real-time database subscriptions
4. **Vite SSR/SSG** - For better SEO and performance
5. **Forgejo Actions** - For CI/CD automation

---

## Mistakes Made (and Fixed)

### Mistake #1: HTML in React Component
Rendered `<html>` inside React root component, causing hydration errors.  
**Fix:** Moved to index.html where it belongs.

### Mistake #2: Wrong Tailwind Plugin
Used old `tailwindcss` directly instead of `@tailwindcss/postcss`.  
**Fix:** Installed correct plugin and updated config.

### Mistake #3: CommonJS in ES Module Project
Used `module.exports` in postcss.config.js.  
**Fix:** Changed to `export default`.

---

## Session Metrics

- **Files Created:** 15+
- **Lines of Code:** ~1,200
- **Documentation Pages:** 8
- **Issues Resolved:** 3 (hydration, PostCSS, Tailwind)
- **Time to Working Site:** ~2 hours
- **Knowledge Base Entries:** 5

---

## Quotes to Remember

> "The system treats infrastructure not as a static resource, but as a living entity that learns and evolves alongside its operator."

> "Documentation is Memory. Without it, each agent starts from scratch."

> "GitOps + Ticketing + Documentation = Auditability + Reversibility + Institutional Memory"

---

## Next Session Preparation

**What Worked:**
- Documenting as we go
- Fixing issues immediately
- Using modern tools (Bun, Tailwind v4)
- Following TELOS principles from day one

**What to Improve:**
- Need CRM/CMS schema design
- Need Mailgun integration
- Need workflow wireframes
- Need agent.md reference file

**Carry Forward:**
- Continue documenting in /kb/
- Reference every decision back to TELOS
- Update task list before ending sessions
- Cross-reference related documents

---

**Last Updated:** January 30, 2026 03:15 AM  
**Related Files:**
- `/kb/tasks.md` - Project task tracking
- `/kb/problems-solved.md` - Technical issue resolution
- `/kb/implementations.md` - Architecture decisions
- `/kb/website-rebuild.md` - Session notes
