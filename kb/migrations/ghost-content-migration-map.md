# Ghost Content Migration Map

**Status:** Active
**Last Updated:** April 22, 2026
**Session:** Phase 5 migration planning continuation
**Tags:** ghost, migration, cms, seo, slugs

## Summary
This document defines how Ghost content maps into the current Prisma CMS schema and how URL slugs are preserved for SEO continuity during migration to fogserv.cloud.

## Context / Current State
Phase 5 migration tasks require concrete mapping rules before import scripts are written. The Prisma schema now includes the required content, taxonomy, and metadata fields, so this plan establishes deterministic field transforms and slug/redirect rules.

## Implementation / Details

### Source to Target Mapping

#### Ghost Post -> Prisma Post
- `posts.id` -> `Post.id`:
  - Generate new `cuid()` ids during import.
  - Keep original Ghost id in import metadata log.
- `posts.title` -> `Post.title`
- `posts.slug` -> `Post.slug`
- `posts.html` or `posts.mobiledoc/lexical` -> `Post.content`:
  - Prefer canonical HTML export when available.
  - Normalize embedded asset links during transform.
- `posts.excerpt` -> `Post.excerpt`
- `posts.feature_image` -> `Post.featureImage`
- `posts.status` -> `Post.status`:
  - `published` -> `PUBLISHED`
  - `draft` -> `DRAFT`
  - `scheduled` -> `SCHEDULED`
- `posts.type` -> `Post.type`:
  - `post` -> `POST`
  - `page` -> `PAGE`
- `posts.published_at` -> `Post.publishedAt`
- `posts.created_at`/`updated_at` -> `Post.createdAt`/`Post.updatedAt`
- `posts.meta_title` -> `Post.metaTitle`
- `posts.meta_description` -> `Post.metaDescription`
- `posts.canonical_url` -> `Post.canonicalUrl`

#### Ghost Author -> Prisma User
- `users.email` -> `User.email`
- `users.name` -> `User.name`
- `users.bio` -> `User.bio`
- `users.website` -> `User.website`
- `users.profile_image` -> `User.avatar`
- Role mapping:
  - Ghost admin/editor -> `ADMIN` or `EDITOR`
  - Ghost author -> `AUTHOR`

#### Ghost Tag -> Prisma Tag / Category
- Ghost tags with visibility `public` -> `Tag`
- Ghost tags prefixed with `category:` -> `Category`
- Join tables:
  - Ghost posts_tags -> `PostTag` and `PostCategory`

### Slug Preservation Strategy

#### Primary rule
- Preserve Ghost `slug` exactly when importing to `Post.slug`.

#### Conflict handling
- If duplicate slug exists:
  - Keep earliest published entry unchanged.
  - Append stable suffix for later entries: `-2`, `-3`, etc.
  - Record remap in redirect table file.

#### Redirect plan
- Generate redirect manifest for historical URLs:
  - `/old-slug/` -> `/blog/old-slug`
  - Legacy Ghost route variants mapped to canonical route.
- Keep one redirect manifest in version control for deterministic deploy behavior.

### Asset Migration Rules
- Copy Ghost image assets into new media path with stable filenames.
- Rewrite `Post.content` URLs from Ghost host to new media host.
- Keep an asset map for rollback and broken-link auditing.

### Validation Checklist
- Every imported post has non-empty `title`, `slug`, and `content`.
- Slug uniqueness enforced and remaps logged.
- Meta title/description preserved where available.
- Author relation assigned for all imported posts.
- Tag/category associations match source exports.

## Next Steps / Ops Actions
1. Implement import script for Ghost export JSON -> Prisma seed format.
2. Generate redirect manifest from slug map and test against sample URLs.
3. Run a dry-run import in local SQLite and compare row counts by entity.
4. Add migration audit summary to `kb/problems-solved.md` after first run.

## Sources & Related
- `../tasks`
- `../implementations`
- `../frontend/website-rebuild`
- `../../prisma/schema.prisma`

## Change Log
- April 22, 2026 - Added Ghost-to-Prisma field mapping, slug-preservation policy, and redirect strategy for Phase 5 migration planning.
