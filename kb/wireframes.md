# fogserv.cloud Wireframes and UX Specifications

**Status:** Draft
**Last Updated:** April 21, 2026
**Session:** Task board continuation and Phase 7 kickoff
**Tags:** wireframes, ux, mvp, cms, crm

## Summary
This document defines MVP wireframe specifications for primary user flows and key interfaces. It translates the roadmap into concrete layout and interaction guidance so implementation can proceed with consistent UX decisions.

## Context / Current State
The project has core public pages and a KB section, but Phase 7 wireframe artifacts were missing. These specs provide a practical blueprint for the homepage journey, content reading flow, and admin-oriented authoring paths.

## Implementation / Details

### Design constraints
- Mobile-first layout with clear desktop expansion.
- Strong content hierarchy and clear calls to action.
- Consistent navigation, footer, and feedback states.
- Fast-loading structure with progressive enhancement.

### Flow 1: Homepage visitor -> Newsletter signup

#### Mobile wireframe
1. Header: logo, compact nav, primary CTA.
2. Hero: mission statement + signup prompt.
3. Pillars section: GitOps, Ticketing, Documentation, Proactive Polish.
4. Social proof / recent updates strip.
5. Newsletter block: email field, consent text, submit.
6. Footer with resources and KB links.

#### Desktop wireframe
1. Same sections with two-column hero layout.
2. Newsletter form inline beside value proposition.
3. Expanded footer with grouped links.

### Flow 2: Reader -> Create account -> Subscribe
1. Reader enters article from blog listing.
2. Sticky side rail (desktop) or bottom CTA (mobile) prompts account creation.
3. Account form includes email verification step.
4. Post-verification preferences screen captures topic interests and frequency.

### Flow 3: Author -> Login -> Create post -> Publish
1. Login screen with minimal friction.
2. Dashboard landing with post status counters.
3. Editor screen:
   - title, slug, excerpt, body
   - tags/categories
   - SEO metadata
   - draft/publish controls
4. Publish confirmation with preview URL.

### Flow 4: Admin -> Manage users -> Send campaign
1. Admin dashboard with key metrics cards.
2. User management table with filters.
3. Campaign composer with audience segment selector.
4. Review step with send limits and safety checks.

### Flow 5: User -> Update preferences -> Unsubscribe
1. Account settings page with topic and frequency toggles.
2. Save confirmation with timestamp.
3. One-click unsubscribe route with optional reason capture.
4. Final state confirms unsubscribe and offers resubscribe path.

## Component Specifications

### Homepage layout
- Blocks: hero, pillars, featured content, newsletter, footer.
- Required states: loading placeholders for async content modules.

### Blog post template
- Blocks: title/meta, feature image, body, related posts, CTA.
- Required states: missing image fallback and read-time estimate.

### Admin dashboard
- Blocks: KPI cards, activity stream, pending actions, quick links.
- Required states: empty dashboard and permission-denied fallback.

### Email composer
- Blocks: subject, preview text, body editor, segment selector, schedule.
- Required states: validation errors and send confirmation.

### User profile page
- Blocks: identity, verification status, subscription settings, security section.
- Required states: unverified warning and save-success feedback.

### Settings/preferences page
- Blocks: notification frequency, categories, privacy controls, danger zone.
- Required states: reset-to-default and unsubscribe confirmation.

## Acceptance Criteria
- Every flow has mobile and desktop layout guidance.
- Every target component has required blocks and key states.
- Specs are implementation-ready for Phase 7 tasks.

## Next Steps / Ops Actions
1. Convert these wireframe specs into visual drafts (low fidelity first).
2. Validate with current `src/main.tsx` routing and identify gaps.
3. Add route-by-route implementation checklist tied to this document.

## Sources & Related
- `tasks`
- `implementations`
- `TELOS`
- `agent`
- `frontend/website-rebuild`

## Change Log
- April 21, 2026 - Created initial wireframe and UX specification document covering all planned Phase 7 user flows and core components.
