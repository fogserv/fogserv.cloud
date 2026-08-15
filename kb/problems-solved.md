# Problems Solved

**Session:** January 30, 2026  
**Project:** fogserv.cloud Website Rebuild

This document tracks technical issues encountered during development and their solutions, serving as a troubleshooting guide for future sessions.

---

## Problem #1: React Hydration Error - HTML in JSX

**Timestamp:** January 30, 2026 03:02 AM

### Error Message
```
In HTML, <html> cannot be a child of <div>.
This will cause a hydration error.
validateDOMNesting @ react-dom_client.js:2148
```

### Root Cause
React root component (`__root.tsx`) was rendering full HTML structure:
```tsx
function Root() {
  return (
    <html lang="en">
      <head>...</head>
      <body>...</body>
    </html>
  )
}
```

But React mounts inside `<div id="root">` in index.html, causing invalid nesting.

### Solution
**Changed:** `src/routes/__root.tsx`
```tsx
function Root() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  )
}
```

**Changed:** `index.html` (proper HTML structure)
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>fogserv.cloud</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Key Insight
React hydration expects to find existing DOM nodes, not create the entire HTML document. The HTML shell must exist before React mounts.

### Prevention
- Understand SSR/CSR boundaries
- Keep static HTML in index.html
- React components manage content within #root only

---

## Problem #2: PostCSS Configuration Error

**Timestamp:** January 30, 2026 03:03 AM

### Error Message
```
[plugin:vite:css] Failed to load PostCSS config
ReferenceError: module is not defined in ES module scope
This file is being treated as an ES module because it has a '.js' file extension 
and package.json contains "type": "module"
```

### Root Cause
`postcss.config.js` used CommonJS syntax:
```js
module.exports = {
  plugins: { ... }
}
```

But `package.json` has `"type": "module"`, making all `.js` files ES modules by default.

### Solution
**Changed:** `postcss.config.js`
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Key Insight
When `"type": "module"` is set in package.json, use:
- ES modules: `export default` (for `.js` files)
- CommonJS: `module.exports` (for `.cjs` files only)

### Prevention
- Check package.json type field
- Use consistent module syntax across config files
- Or explicitly use `.cjs` extension for CommonJS

---

## Problem #3: Tailwind CSS Plugin Error

**Timestamp:** January 30, 2026 03:03 AM

### Error Message
```
[postcss] It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin. 
The PostCSS plugin has moved to a separate package, so to continue using Tailwind CSS 
with PostCSS you'll need to install `@tailwindcss/postcss`
```

### Root Cause
Tailwind v4 architecture changed. The PostCSS plugin is now a separate package.

Old config (doesn't work in v4):
```js
export default {
  plugins: {
    tailwindcss: {},  // ❌ Wrong in v4
  },
}
```

### Solution
**Installed:**
```bash
bun add -d @tailwindcss/postcss
```

**Changed:** `postcss.config.js`
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},  // ✅ Correct for v4
  },
}
```

**Changed:** `src/index.css`
```css
/* Old v3 syntax */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* New v4 syntax */
@import "tailwindcss";
```

### Key Insight
Tailwind v4 is a major architectural shift. Check migration guide when upgrading.

### Prevention
- Read changelog for major version bumps
- Test in dev environment first
- Update all related config files together

---

## Problem #4: TanStack Router Type Errors

**Timestamp:** January 30, 2026 03:04 AM (Minor issue)

### Error Message
```
Argument of type '"/"' is not assignable to parameter of type 'undefined'
```

### Root Cause
Importing route components incorrectly from separate files caused type mismatches.

### Solution
Consolidated router setup into `src/main.tsx` with inline component definitions:
```tsx
const rootRoute = createRootRoute({ component: RootLayout })
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})
```

### Key Insight
For MVP, inline route definitions are simpler than file-based routing. Can refactor later with `@tanstack/router-plugin`.

### Prevention
- Start with simplest architecture
- Add complexity only when needed
- File-based routing can come later

---

## Problem #5: Empty Site Complaint

**Timestamp:** January 30, 2026 03:08 AM

### Issue
User feedback: "it's a very empty site"

### Root Cause
Initial implementation only had homepage with three cards. No navigation, footer, or additional pages.

### Solution
Built comprehensive multi-page site:
- Navigation header with routing
- Footer with resources and links
- Enhanced homepage (hero, mission, blog previews)
- Full About page
- Blog page with article previews
- Knowledge Base page with KB document cards

Added:
- ~400 lines of UI code
- 4 complete pages
- Responsive design
- Proper information architecture

### Key Insight
"MVP" doesn't mean "minimal content." A credible site needs:
- Clear navigation
- Multiple pages with substance
- Calls to action
- Footer with context

### Prevention
- Define "complete page" criteria upfront
- Show wireframes before coding
- Get feedback early on content depth

---

## Near-Misses (Avoided Problems)

### ❌ Almost: Hardcoded Secrets
**Risk:** Could have put database URLs directly in code  
**Avoided:** Setup dotenvx from day one  
**Prevention:** Never commit secrets; use environment variables

### ❌ Almost: No Documentation
**Risk:** Could have rushed features without docs  
**Avoided:** Created KB structure immediately  
**Prevention:** Document decisions as they're made

### ❌ Almost: Monolithic Files
**Risk:** Could have put entire site in one component  
**Avoided:** Structured with clear component boundaries  
**Prevention:** Plan component hierarchy before coding

---

## Troubleshooting Checklist

When encountering errors, check:

### For Module/Import Errors:
1. ✅ Is `"type": "module"` in package.json?
2. ✅ Using correct syntax (ES or CommonJS)?
3. ✅ Are dependencies installed?
4. ✅ Is TypeScript config correct?

### For React Hydration Errors:
1. ✅ Is HTML structure only in index.html?
2. ✅ Are React components only inside #root?
3. ✅ No `<html>`, `<head>`, `<body>` in JSX?
4. ✅ Server and client rendering same output?

### For PostCSS/Tailwind Errors:
1. ✅ Is `@tailwindcss/postcss` installed (not just `tailwindcss`)?
2. ✅ Is config using ES module syntax?
3. ✅ Is CSS using `@import "tailwindcss"` (not directives)?
4. ✅ Are content paths configured correctly?

### For Environment Variable Issues:
1. ✅ Does `.env` file exist?
2. ✅ Are scripts wrapped with `dotenvx run --`?
3. ✅ Are variable names spelled correctly?
4. ✅ Is dotenvx outputting injection message?

---

## Performance Notes

### Build Times
- Initial Vite startup: ~1.7 seconds
- Prisma client generation: ~73ms
- Bun package install: ~80 seconds (825 packages)
- Hot module reload: < 100ms

### No Issues Encountered:
- ✅ Bun compatibility
- ✅ TypeScript compilation
- ✅ TanStack Router performance
- ✅ Tailwind CSS compilation
- ✅ Vite HMR speed

---

## Resources Used

### Documentation:
- React 19 docs: https://react.dev
- TanStack Router: https://tanstack.com/router
- Tailwind v4 migration: https://tailwindcss.com/docs/upgrade-guide
- Prisma docs: https://prisma.io/docs
- dotenvx: https://dotenvx.com

### Stack Overflow:
- React hydration errors
- ES module vs CommonJS

### GitHub Issues:
- Tailwind v4 PostCSS plugin migration
- TanStack Router type definitions

---

## Future Gotchas to Watch

1. **Prisma Migrations:** Ensure DATABASE_URL points to correct DB for migrations
2. **Tailwind Purging:** Configure content paths carefully for production builds
3. **Environment Variables:** Prefix with VITE_ for client-side access
4. **React Router:** File-based routing will need @tanstack/router-plugin
5. **TypeScript Strict Mode:** May reveal type issues when enabled

---

**Last Updated:** January 30, 2026 03:18 AM  
**Total Problems Solved:** 5  
**Average Resolution Time:** < 5 minutes per issue  

**Related Files:**
- `/kb/lessons-learned.md` - Session insights
- `/kb/implementations.md` - Architecture decisions
- `/kb/tasks.md` - Project tracking
