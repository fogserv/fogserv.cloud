# CRM/CMS Database Architecture

**Status:** Active  
**Last Updated:** January 30, 2026 03:35 AM  
**Session:** Website rebuild - Phase 3 CRM/CMS Design  
**Tags:** database, prisma, cms, crm, email-marketing, schema-design

## Summary

Comprehensive database schema for fogserv.cloud combining Ghost-like content management, email marketing platform (Mailgun integration), and subscriber relationship management. Designed for SQLite development with PostgreSQL production via Prisma Accelerate.

## Architecture Overview

The schema is organized into four major domains:

1. **User Management & Authentication** - Role-based access control (RBAC) with 6 user roles
2. **Content Management System** - Ghost-like publishing platform with posts, pages, tags, categories, comments
3. **Email Marketing & Subscribers** - Newsletter management with double opt-in, segmentation, engagement tracking
4. **Analytics & Tracking** - Page views, link clicks, campaign performance

### Total Models: 21

## User Management Domain

### User Model
Core user table supporting both content creators and admin users.

**Roles:** OWNER > ADMIN > EDITOR > AUTHOR > CONTRIBUTOR > SUBSCRIBER

```typescript
// Role hierarchy and permissions
OWNER       // Full system access, billing, user management
ADMIN       // Content & user management, no billing
EDITOR      // Full content creation & editing, scheduling
AUTHOR      // Create & edit own content only
CONTRIBUTOR // Submit drafts for review, no publishing
SUBSCRIBER  // Read-only, comment permissions
```

**Status States:** ACTIVE | INACTIVE | SUSPENDED | PENDING_VERIFICATION

**Key Fields:**
- Authentication: `passwordHash`, `emailVerified`, `lastLoginAt`
- Profile: `name`, `bio`, `avatar`, `website`, `location`
- Relations: Posts (author), Comments, Sessions

**Indexes:** email, role, status

### Session Model
JWT-like session management for authentication persistence.

**Features:**
- Token-based authentication
- Automatic expiration handling
- User cascade delete (cleans up sessions)

## Content Management Domain

### Post Model
Core content entity supporting multiple content types with full publishing workflow.

**Content Types:** POST | PAGE | SNIPPET | GUIDE

**Publishing States:** DRAFT > SCHEDULED > PUBLISHED | ARCHIVED

**Key Features:**
- SEO optimization: `metaTitle`, `metaDescription`, `ogImage`, `canonicalUrl`
- Reading metrics: `viewCount`, `readingTime`
- Feature images and excerpts
- Scheduled publishing support
- Author attribution with cascade delete protection

**Relations:**
- Many-to-many: Tags (via PostTag), Categories (via PostCategory)
- One-to-many: Comments
- Many-to-one: Author (User)

**Indexes:** slug (unique), status, type, authorId, publishedAt

### Tag & Category Models
Flexible content organization with flat tags and hierarchical categories.

**Tags:**
- Flat structure for cross-cutting themes
- Visual customization: `color` hex codes
- URL-friendly slugs

**Categories:**
- Hierarchical structure with `parent`/`children` relations
- Icon support for UI representation
- Self-referential relationship for unlimited depth

**Junction Tables:** PostTag, PostCategory (many-to-many with timestamps)

### Comment Model
Threaded comment system with moderation and guest support.

**Features:**
- Authenticated user comments (optional author)
- Guest comments: `guestName`, `guestEmail` fields
- Threading: `parent`/`replies` for nested discussions
- Moderation flags: `approved`, `spam`
- Cascade delete on post removal

**Indexes:** postId, authorId, parentId, approved

## Email Marketing Domain

### Subscriber Model
Central table for newsletter/email list management with double opt-in.

**Status Flow:** PENDING → ACTIVE → [UNSUBSCRIBED | BOUNCED | COMPLAINED]

**Verification:**
- `confirmToken` for double opt-in
- `confirmedAt` timestamp on successful verification

**Engagement Tracking:**
- Email metrics: `emailsSent`, `emailsOpened`, `linksClicked`
- Last activity: `lastOpenedAt`, `lastClickedAt`
- Source attribution: where they signed up

**Privacy & Compliance:**
- Stores `ipAddress` and `userAgent` for verification
- Unsubscribe tracking with `unsubscribedAt`
- Spam complaint handling

**Relations:**
- Many-to-many: EmailList (via SubscriberList)
- One-to-many: Tags (SubscriberTag), Campaign logs

**Indexes:** email (unique), status, subscribedAt

### EmailList Model
Segmented mailing lists for targeted campaigns.

**Features:**
- Public vs private lists: `isPublic` flag
- Description for user-facing signup forms
- Many-to-many with Subscribers

**Use Cases:**
- "Newsletter" (public, footer signup)
- "Product Updates" (public, opt-in)
- "Beta Testers" (private, admin-managed)

### SubscriberTag Model
Flexible tagging system for segmentation without formal lists.

**Examples:**
- Interest tags: "GitOps", "AI", "DevOps"
- Behavior tags: "engaged", "inactive-90d"
- Source tags: "hackernews", "reddit", "organic"

**Composite Key:** `[subscriberId, tagName]`

### Campaign Model
Email campaign management with Mailgun integration.

**States:** DRAFT → SCHEDULED → SENDING → SENT | [PAUSED | CANCELLED]

**Content:**
- Dual format: `htmlContent` + `textContent` (plain text fallback)
- Email headers: `subject`, `preheader`
- Template support: optional `templateId` relation

**Targeting:**
- List-based: many-to-many with EmailList
- Query-based: `segmentQuery` JSON for dynamic segments

**Mailgun Integration:**
- `mailgunId` for webhook correlation
- Sender configuration: `fromName`, `fromEmail`, `replyTo`

**Analytics:**
- Aggregate metrics: delivered, opened, clicked, bounced, complained, unsubscribed
- Per-recipient tracking via CampaignLog

**Indexes:** status, scheduledFor, mailgunId (unique)

### CampaignLog Model
Per-recipient event log for detailed campaign tracking.

**Event Types:**
- Delivery: `sent`, `delivered`, `bounced`
- Engagement: `opened`, `clicked`
- Compliance: `complained`, `unsubscribed`

**Event Timestamps:**
- Each event has corresponding `{event}At` field
- Supports Mailgun webhook ingestion

**Error Tracking:**
- `errorMessage` for failed sends
- `bounceType` classification (hard, soft, etc)

**Indexes:** campaignId, subscriberId, sent, opened

### EmailTemplate Model
Reusable email templates with variable substitution.

**Features:**
- Subject line templates
- HTML + plain text versions
- Variable tracking: JSON array of `{{placeholder}}` names
- Default template support: `isDefault` flag

**Variables Example:**
```json
["subscriberName", "unsubscribeUrl", "companyName", "currentYear"]
```

**Usage:** Campaigns reference templates, variables interpolated at send time

## Analytics Domain

### PageView Model
Simple analytics for content performance tracking.

**Captured Data:**
- `path` - URL path visited
- `referrer` - Traffic source
- `userAgent`, `ipAddress` - Client info
- `country` - GeoIP lookup (optional)

**Indexes:** path, timestamp

**Use Cases:**
- Popular content identification
- Traffic source analysis
- Geographic distribution

### LinkClick Model
Click tracking for email campaigns and external links.

**Captured Data:**
- `url` - Destination URL
- `campaignId` - Email campaign attribution (optional)
- `subscriberId` - User attribution (optional)
- `ipAddress`, `userAgent` - Client info

**Indexes:** url, campaignId, timestamp

**Use Cases:**
- Email engagement metrics
- CTR calculation for campaigns
- Popular external resources

## Relationships & Cascade Rules

### Cascade Delete
Ensures referential integrity when entities are removed:

- **User deleted** → Sessions cascade delete, Posts/Comments set author to NULL
- **Post deleted** → Comments, PostTag, PostCategory cascade delete
- **Campaign deleted** → CampaignLog cascade delete
- **Subscriber deleted** → SubscriberList, SubscriberTag, CampaignLog cascade delete

### Set Null
Preserves historical data when non-critical relations are deleted:

- Comment author deleted → Comment remains with `authorId = NULL` (preserves comment history)
- Parent category deleted → Children become root categories (`parentId = NULL`)
- Template deleted → Campaigns preserve content but lose template reference

## Indexes Strategy

**Purpose-Driven Indexing:**
- **Uniqueness:** email, slug, token fields
- **Foreign Keys:** All relation columns auto-indexed by Prisma
- **Query Performance:** status enums, timestamp fields, common filters

**Compound Indexes:** Junction tables use composite primary keys (`[id1, id2]`)

## Data Integrity Patterns

### Email Uniqueness
- `User.email` - UNIQUE, primary authentication identifier
- `Subscriber.email` - UNIQUE, newsletter/marketing identifier
- A user can also be a subscriber (separate contexts)

### Slug Uniqueness
- `Post.slug` - UNIQUE, URL-friendly content identifier
- `Tag.slug`, `Category.slug` - UNIQUE for clean URLs

### Token Security
- `Session.token` - UNIQUE, secure session tracking
- `Subscriber.confirmToken` - UNIQUE, double opt-in verification

## Migration Strategy

### Phase 1: Foundation (Current)
✅ Schema defined in `prisma/schema.prisma`  
✅ Prisma client generated  
⏳ Initial migration pending

### Phase 2: Seed Data
- [ ] Create default admin user (OWNER role)
- [ ] Seed initial categories (Knowledge Base, Blog, Guides)
- [ ] Create default email template
- [ ] Set up "Newsletter" email list

### Phase 3: Production Migration
- [ ] Switch datasource from SQLite to PostgreSQL
- [ ] Update `DATABASE_URL` to use Prisma Accelerate
- [ ] Run migration against production
- [ ] Verify indexes created correctly

### Phase 4: Data Import
- [ ] Migrate Ghost blog content (see kb/frontend/website-rebuild.md)
- [ ] Import existing subscribers (if any)
- [ ] Create initial tags/categories from Ghost

## Query Patterns

### Common Queries

**Published Posts with Tags:**
```typescript
const posts = await prisma.post.findMany({
  where: { status: 'PUBLISHED', type: 'POST' },
  include: {
    author: { select: { name: true, avatar: true } },
    tags: { include: { tag: true } },
    categories: { include: { category: true } }
  },
  orderBy: { publishedAt: 'desc' }
})
```

**Active Subscribers for Campaign:**
```typescript
const subscribers = await prisma.subscriber.findMany({
  where: {
    status: 'ACTIVE',
    lists: { some: { listId: 'newsletter-id' } }
  },
  select: { email: true, name: true }
})
```

**Campaign Performance:**
```typescript
const campaign = await prisma.campaign.findUnique({
  where: { id: campaignId },
  include: {
    logs: {
      where: { opened: true },
      select: { subscriber: { select: { email: true } } }
    },
    _count: {
      select: {
        logs: { where: { delivered: true } }
      }
    }
  }
})
```

### Performance Considerations

**N+1 Query Prevention:**
- Always use `include` for relations instead of separate queries
- Use `select` to limit fields when full objects not needed

**Pagination:**
```typescript
const posts = await prisma.post.findMany({
  take: 20,
  skip: page * 20,
  where: { status: 'PUBLISHED' },
  orderBy: { publishedAt: 'desc' }
})
```

**Aggregations:**
```typescript
const stats = await prisma.campaign.aggregate({
  where: { status: 'SENT' },
  _sum: { opened: true, clicked: true },
  _avg: { opened: true }
})
```

## Security Considerations

### Authentication
- Passwords hashed with bcrypt/argon2 before storing in `passwordHash`
- Session tokens should be cryptographically random (cuid2)
- Email verification required before account activation

### Authorization
- Role checks on all content mutations
- Author can only edit own posts (unless EDITOR+ role)
- Comments require approval unless user is authenticated

### Privacy
- IP addresses stored for fraud detection only
- User agents help identify bot traffic
- Unsubscribe must be one-click (no login required)

### Rate Limiting
- Email sends: max per hour per campaign
- Signup forms: IP-based rate limiting
- API endpoints: token bucket algorithm

## Next Steps

### Immediate Actions
1. **Create initial migration:** `bun run db:push` (dev) or `bun run db:migrate` (prod)
2. **Generate seed script:** Create `prisma/seed.ts` with default data
3. **Build repository layer:** Create `src/lib/repositories/` with Prisma wrappers
4. **Document API endpoints:** Map routes to database operations

### Development Priorities
1. **User Authentication:** Login/register flows with session management
2. **Admin Dashboard:** Content management UI for posts/categories/tags
3. **Email Service:** Mailgun integration layer (see Phase 4 tasks)
4. **Subscriber Forms:** Double opt-in signup with confirmation emails
5. **Campaign Builder:** UI for composing and scheduling email campaigns

### Future Enhancements
- Full-text search on Post.content (PostgreSQL `tsvector`)
- Soft deletes with `deletedAt` timestamp pattern
- Audit log table for admin actions
- Webhook endpoint registry for Mailgun events
- Advanced segmentation with JSON query builder
- A/B testing support for campaigns (variant tracking)

## Sources & Related

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Ghost Database Schema](https://github.com/TryGhost/Ghost/tree/main/ghost/core/core/server/data/schema) - Inspiration for content models
- [Mailgun Webhooks](https://documentation.mailgun.com/en/latest/api-webhooks.html) - Event structure for CampaignLog
- **Related KB:** 
  - [prisma-connections](./prisma-connections) - Connection pooling with Accelerate
  - [website-rebuild](../frontend/website-rebuild) - Ghost content migration plan
  - [tasks](../tasks) - Implementation roadmap

## Change Log

**2026-01-30 03:35 AM** - Initial CRM/CMS schema design  
Created comprehensive database architecture with 21 models covering user management, content publishing, email marketing, and analytics. Designed for Ghost-like CMS experience with integrated Mailgun email platform. Schema supports role-based access, threaded comments, hierarchical categories, double opt-in subscribers, campaign tracking, and engagement analytics. Generated Prisma client successfully.

**Session Context:** Website rebuild Phase 3 - Database architecture foundation
