# fogserv.cloud Website Integration Notes

**Status:** Active  
**Last Updated:** January 30, 2026 03:05 AM  
**Session:** Initial website rebuild with React/TanStack/Prisma stack  
**Tags:** website, TanStack, KB

# Summary
The knowledge in this document captures where the existing Ghost-based fogserv.cloud is today, how the new React/TanStack/Prisma stack replaces it, and how the KB will expose the TELOS philosophy publicly.

## Context
This session aligned the public-facing rebuild with the KB store mandate—documenting site analysis, integration phases, and the content migration strategy so future agents can continue the work without context drift.

---

## Current Production Site Analysis

The current fogserv.cloud (as of January 2026) is a **Ghost-based blog** focused on personal development, philosophy, and self-hosted technology content.

### Key Findings from Production Site

**Content Categories:**
1. **Personal Development**
   - Time Management systems
   - Stoicism and Buddhist philosophy
   - Shadow work and psychological growth
   - "7 Habits" and GTD methodologies

2. **Self-Hosting & Technology**
   - Local-only password vault (breaking free from cloud dependence)
   - Self-hosted infrastructure advocacy
   - Introduction to self-hosted.info initiative

3. **Philosophy & Reflection**
   - Classic texts (Sounds of Silence, Wear Sunscreen, All The Good Things)
   - The Strangest Secret, The Art of Success
   - Puer Aeternus archetype analysis

**Navigation Structure:**
- Home
- Password Vault (`/pass/`)
- About page
- Portal/Sign-up for newsletter

**Mission Alignment:**
The current site demonstrates "helping people help themselves" through educational content about:
- Breaking free from corporate cloud dependencies
- Self-hosting as empowerment
- Personal growth and critical thinking
- Time management and effectiveness systems

---

## Integration Strategy for New React Site

### Phase 1: Core Infrastructure (Completed)
- ✅ React 19 + TanStack Router + Vite
- ✅ Prisma with PostgreSQL (Accelerate)
- ✅ Tailwind v4 for styling
- ✅ dotenvx for secrets management
- ✅ Landing page with three core pillars

### Phase 2: Content Migration (Planned)
1. **Blog Engine**
   - Integrate Ghost API or migrate to custom CMS
   - Preserve existing articles and SEO
   - Maintain `/pass/` password vault integration

2. **Knowledge Base Public Interface**
   - Expose `/kb/` as public documentation
   - Link TELOS philosophy to public-facing content
   - Create developer documentation section

3. **About & Mission Pages**
   - Expand on TELOS principles
   - Profile the "AI-Managed Server" concept
   - Case studies and demonstrations

### Phase 3: Agentic Features (Future)
1. **Agent Dashboard**
   - Real-time infrastructure status
   - Deployment history and audit logs
   - Ticketing system integration

2. **Interactive Demos**
   - Live server metrics
   - GitOps workflow visualization
   - Knowledge Base search and navigation

3. **Community Features**
   - Issue tracker (Forgejo integration)
   - Documentation contributions
   - Newsletter signup and management

---

## Technical Notes

### React Hydration Fix (Completed)
**Problem:** `<html>` element cannot be rendered inside React root div  
**Solution:** Moved HTML structure to `index.html`, React components render inside `#root` div only

**Files Modified:**
- `src/routes/__root.tsx` - Simplified to wrapper div
- `index.html` - Contains proper HTML structure
- `src/main.tsx` - Consolidated router setup, removed separate route files

### Router Configuration
- Using `createBrowserHistory()` for proper browser routing
- Route structure simplified to single-file approach for initial setup
- File-based routing can be introduced later via TanStack Router plugin

---

## Content Preservation Strategy

### Existing Ghost Content
The current site has valuable content that should be preserved:

**High Priority for Migration:**
1. "Breaking Free from the Cloud" - aligns with TELOS mission
2. "From Bash History to Reality" - self-hosted.info announcement
3. "The Journey of fogserv.cloud" - historical context
4. Password Vault tool - practical self-hosting demo

**Content Strategy:**
- Keep Ghost as CMS backend initially
- Use Ghost Content API to pull articles into React frontend
- Gradually migrate to custom solution if needed
- Preserve SEO and existing URLs

### New Content Needs
Based on TELOS and the "AI-Managed Server" vision:

1. **Technical Guides**
   - GitOps workflow setup
   - Forgejo Actions configuration
   - Prisma + Accelerate integration
   - dotenvx secrets management

2. **Case Studies**
   - How fogserv-ai agents operate
   - Real-world infrastructure improvements
   - Incident response examples
   - Autonomous optimization wins

3. **Philosophy Deep-Dives**
   - TELOS principles in practice
   - Democratic technology explained
   - Knowledge as Freedom manifesto
   - Agentic autonomy guardrails

---

## Next Steps

### Immediate (Current Session)
- ✅ Fix React hydration errors
- ✅ Establish proper component structure
- ✅ Document findings from current site

### Short Term (Next Sessions)
1. Create additional routes (About, Blog, KB)
2. Integrate Ghost API for content
3. Build navigation header/footer
4. Add responsive design polish

### Medium Term
1. Set up Forgejo Actions for deployment
2. Create ticketing system integration
3. Build public KB browser
4. Implement search functionality

### Long Term
1. Agent dashboard and monitoring
2. Real-time infrastructure visualization
3. Interactive demos and tutorials
4. Community contribution features

---

## Change Log
- January 30, 2026 03:05 AM — Added KB store metadata, summary/context sections, and change log to match the required format.

## Lessons Learned

1. **React Structure:** Don't render `<html>` from within React components
2. **TanStack Router:** Simplified inline route definition works better than file-based for MVP
3. **Tailwind v4:** Requires `@tailwindcss/postcss` package, not the old plugin approach
4. **Content Migration:** Preserve existing valuable content; don't start from scratch
5. **Mission Alignment:** Current site already embodies "helping people help themselves"

---

## Sources & Related
- `../TELOS.md` — mission, pillars, and agent contract
- `../agentic/agentic-workflows.md` — orchestration patterns that drive the new UI
- `../agentic/ai-server-management.md` — AI-managed infrastructure vision
- `../research/ai-server-management.md` — research citations on agentic governance
- `../research/tanstack.md` — TanStack/KB browser research
- `../gitops/gitops.md` — aligning the rebuild with GitOps processes
- `../README.md` — layout expectations for KB stores

**Status:** React app running, hydration errors resolved, ready for feature development  
