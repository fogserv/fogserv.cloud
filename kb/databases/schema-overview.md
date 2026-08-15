# Database Schema Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FOGSERV.CLOUD CRM/CMS SCHEMA                        │
│                                21 Models                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ USER MANAGEMENT & AUTHENTICATION                                          │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  User                         Session                                    │
│  ├─ id: String (cuid)         ├─ id: String (cuid)                      │
│  ├─ email: String UNIQUE      ├─ userId: String → User.id               │
│  ├─ name: String?             ├─ token: String UNIQUE                   │
│  ├─ role: UserRole            ├─ expiresAt: DateTime                    │
│  │   • OWNER                  └─ createdAt: DateTime                    │
│  │   • ADMIN                                                             │
│  │   • EDITOR                 Roles: OWNER > ADMIN > EDITOR >           │
│  │   • AUTHOR                       AUTHOR > CONTRIBUTOR > SUBSCRIBER   │
│  │   • CONTRIBUTOR                                                       │
│  │   • SUBSCRIBER                                                        │
│  ├─ status: UserStatus                                                   │
│  ├─ passwordHash: String?                                                │
│  └─ Relations:                                                            │
│      • posts[] → Post                                                    │
│      • comments[] → Comment                                              │
│      • sessions[] → Session                                              │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ CONTENT MANAGEMENT SYSTEM                                                 │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Post                         Tag                    Category            │
│  ├─ id: String (cuid)         ├─ id: String          ├─ id: String      │
│  ├─ title: String             ├─ name: String        ├─ name: String    │
│  ├─ slug: String UNIQUE       ├─ slug: String        ├─ slug: String    │
│  ├─ content: String           ├─ color: String?      ├─ parentId?       │
│  ├─ type: PostType            └─ posts[] via         ├─ children[]      │
│  │   • POST                      PostTag              └─ posts[] via     │
│  │   • PAGE                                              PostCategory    │
│  │   • SNIPPET                                                           │
│  │   • GUIDE                                                             │
│  ├─ status: PostStatus                                                   │
│  │   • DRAFT                                                             │
│  │   • PUBLISHED                                                         │
│  │   • SCHEDULED                                                         │
│  │   • ARCHIVED                                                          │
│  ├─ authorId: String → User.id                                           │
│  ├─ featureImage: String?                                                │
│  ├─ SEO fields                                                           │
│  │   • metaTitle                                                         │
│  │   • metaDescription                                                   │
│  │   • ogImage                                                           │
│  ├─ viewCount: Int                                                       │
│  └─ Relations:                                                            │
│      • author → User                                                     │
│      • tags[] via PostTag                                                │
│      • categories[] via PostCategory                                     │
│      • comments[] → Comment                                              │
│                                                                           │
│  Comment                                                                  │
│  ├─ id: String (cuid)                                                    │
│  ├─ content: String                                                      │
│  ├─ postId: String → Post.id                                             │
│  ├─ authorId?: String → User.id                                          │
│  ├─ guestName?: String    (for unauthenticated)                         │
│  ├─ guestEmail?: String   (for unauthenticated)                         │
│  ├─ approved: Boolean                                                    │
│  ├─ spam: Boolean                                                        │
│  ├─ parentId?: String → Comment.id  (threading)                         │
│  └─ replies[] → Comment                                                  │
│                                                                           │
│  Junction Tables:                                                         │
│  • PostTag: [postId, tagId] PK                                           │
│  • PostCategory: [postId, categoryId] PK                                 │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ EMAIL MARKETING & SUBSCRIBER CRM                                          │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Subscriber                   EmailList              SubscriberTag       │
│  ├─ id: String                ├─ id: String          ├─ subscriberId    │
│  ├─ email: String UNIQUE      ├─ name: String        ├─ tagName         │
│  ├─ name: String?             ├─ isPublic: Bool      └─ (composite PK)  │
│  ├─ status:                   └─ subscribers[]                           │
│  │   • PENDING                   via SubscriberList                      │
│  │   • ACTIVE                                                            │
│  │   • UNSUBSCRIBED            SubscriberList                            │
│  │   • BOUNCED                 ├─ subscriberId                           │
│  │   • COMPLAINED              ├─ listId                                 │
│  ├─ confirmToken: String?      └─ (composite PK)                         │
│  ├─ confirmedAt: DateTime?                                               │
│  ├─ Engagement:                                                           │
│  │   • emailsSent: Int                                                   │
│  │   • emailsOpened: Int                                                 │
│  │   • linksClicked: Int                                                 │
│  │   • lastOpenedAt                                                      │
│  ├─ source: String?                                                      │
│  └─ Relations:                                                            │
│      • lists[] via SubscriberList                                        │
│      • tags[] → SubscriberTag                                            │
│      • campaignLogs[] → CampaignLog                                      │
│                                                                           │
│  Campaign                     EmailTemplate          CampaignLog         │
│  ├─ id: String                ├─ id: String          ├─ id: String      │
│  ├─ name: String              ├─ name: String        ├─ campaignId      │
│  ├─ subject: String           ├─ subject: String     ├─ subscriberId    │
│  ├─ htmlContent: String       ├─ htmlContent         ├─ Events:         │
│  ├─ textContent?: String      ├─ textContent         │   • sent         │
│  ├─ status:                   ├─ variables?: JSON    │   • delivered    │
│  │   • DRAFT                  └─ campaigns[]         │   • opened       │
│  │   • SCHEDULED                                     │   • clicked      │
│  │   • SENDING                                       │   • bounced      │
│  │   • SENT                                          │   • complained   │
│  ├─ templateId?: String                              ├─ Timestamps:     │
│  ├─ mailgunId?: String                               │   • sentAt       │
│  ├─ Analytics:                                       │   • openedAt     │
│  │   • totalRecipients                               │   • clickedAt    │
│  │   • delivered                                     └─ errorMessage?   │
│  │   • opened                                                            │
│  │   • clicked                                                           │
│  │   • bounced                                                           │
│  ├─ scheduledFor?: DateTime                                              │
│  └─ Relations:                                                            │
│      • lists[] → EmailList                                               │
│      • template → EmailTemplate                                          │
│      • logs[] → CampaignLog                                              │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ ANALYTICS & TRACKING                                                      │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  PageView                     LinkClick                                  │
│  ├─ id: String                ├─ id: String                              │
│  ├─ path: String              ├─ url: String                             │
│  ├─ referrer?: String         ├─ campaignId?: String                     │
│  ├─ userAgent?: String        ├─ subscriberId?: String                   │
│  ├─ ipAddress?: String        ├─ ipAddress?: String                      │
│  ├─ country?: String          ├─ userAgent?: String                      │
│  └─ timestamp: DateTime       └─ timestamp: DateTime                     │
│                                                                           │
│  Indexes: path, timestamp     Indexes: url, campaignId, timestamp       │
└───────────────────────────────────────────────────────────────────────────┘

KEY RELATIONSHIPS:

1. User → Post (one-to-many, author relationship)
2. Post → Tag (many-to-many via PostTag junction)
3. Post → Category (many-to-many via PostCategory junction)
4. Post → Comment (one-to-many with threading via parent/replies)
5. User → Comment (one-to-many, optional for guest comments)
6. Subscriber → EmailList (many-to-many via SubscriberList junction)
7. Subscriber → Tag (one-to-many via SubscriberTag)
8. Campaign → EmailList (many-to-many, targeting)
9. Campaign → EmailTemplate (many-to-one, optional)
10. Campaign → CampaignLog (one-to-many, per-recipient tracking)
11. Subscriber → CampaignLog (one-to-many, engagement history)

CASCADE DELETE RULES:

• User deleted → Sessions cascade, Posts/Comments set author NULL
• Post deleted → Comments, PostTag, PostCategory cascade
• Campaign deleted → CampaignLog cascade
• Subscriber deleted → SubscriberList, SubscriberTag, CampaignLog cascade

DATA FLOW EXAMPLES:

Publishing Flow:
User (AUTHOR) → creates Post (DRAFT) → adds Tags/Categories
→ Editor (EDITOR+) publishes → Post (PUBLISHED) → visible to public

Email Campaign Flow:
Admin creates Campaign → targets EmailList → schedules send
→ Mailgun processes → CampaignLog records per-subscriber events
→ Webhook updates: sent → delivered → opened → clicked

Subscriber Journey:
Visitor submits form → Subscriber (PENDING) created with confirmToken
→ Email sent with verification link → Subscriber (ACTIVE)
→ Added to SubscriberList (Newsletter) → receives Campaign
→ CampaignLog tracks: sent, opened, clicked
```

**Total Storage Estimate (10k subscribers, 500 posts, 100 campaigns):**

- Users: ~50 records × 2KB = 100 KB
- Posts + Tags/Categories: ~500 records × 10KB = 5 MB
- Comments: ~2,000 records × 1KB = 2 MB
- Subscribers: ~10,000 records × 2KB = 20 MB
- Campaigns: ~100 records × 50KB = 5 MB
- CampaignLogs: ~1,000,000 records × 500B = 500 MB
- Analytics: ~100,000 pageviews × 500B = 50 MB

**Estimated Total:** ~582 MB for active production dataset

**Performance Characteristics:**

- Indexed queries: <10ms for single-entity lookups
- Complex joins (Post + Tags + Categories + Author): ~50ms
- Campaign send query (10k recipients): ~200ms with proper indexes
- Analytics aggregations: ~100ms with time-based partitioning

**Migration Path:**

1. SQLite (dev) → PostgreSQL (prod via Prisma Accelerate)
2. Indexes created automatically by Prisma on migration
3. Connection pooling via Accelerate (edge caching + global pool)
4. Query caching for published content (15s-5min TTL)

**Security Notes:**

- All `@unique` constraints enforced at DB level
- No raw SQL queries (Prisma prevents SQL injection)
- Passwords never stored (only passwordHash with bcrypt/argon2)
- Soft delete via status fields (ARCHIVED, UNSUBSCRIBED) preserves history
- Row-level security planned for PostgreSQL (future enhancement)
