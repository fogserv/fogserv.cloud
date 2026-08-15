#!/usr/bin/env bun
/**
 * Ghost → Prisma Import Script
 *
 * Usage:
 *   bun run scripts/import-ghost.ts <path-to-ghost-export.json> [--dry-run]
 *
 * The Ghost export JSON is the file produced by Ghost Admin → Settings → Labs → Export.
 * It contains a single `db` array with one object whose `data` key holds all entity arrays.
 *
 * Options:
 *   --dry-run   Parse and validate without writing to the database
 *   --verbose   Print every record processed
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { PrismaClient, PostStatus, PostType, UserRole, UserStatus } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// ────────────────────────────────────────────────────────────────────────────
// CLI argument parsing
// ────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const exportFilePath = args.find((a) => !a.startsWith("--"));
const isDryRun = args.includes("--dry-run");
const isVerbose = args.includes("--verbose");

if (!exportFilePath) {
  console.error("Usage: bun run scripts/import-ghost.ts <ghost-export.json> [--dry-run] [--verbose]");
  process.exit(1);
}

// ────────────────────────────────────────────────────────────────────────────
// Ghost export type definitions (subset of fields we use)
// ────────────────────────────────────────────────────────────────────────────

interface GhostPost {
  id: string;
  title: string;
  slug: string;
  html?: string;
  mobiledoc?: string;
  lexical?: string;
  plaintext?: string;
  excerpt?: string;
  feature_image?: string;
  status: "published" | "draft" | "scheduled" | "archived" | string;
  type?: "post" | "page" | string;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: string | null;
  canonical_url?: string | null;
  authors?: GhostAuthor[];
  primary_author?: GhostAuthor | null;
}

interface GhostAuthor {
  id: string;
  email?: string;
  name?: string;
  bio?: string;
  website?: string;
  profile_image?: string;
  slug?: string;
}

interface GhostUser {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  website?: string;
  profile_image?: string;
  slug?: string;
  roles?: Array<{ name: string }>;
}

interface GhostTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  accent_color?: string;
  visibility?: "public" | "internal" | string;
}

interface GhostPostsTag {
  post_id: string;
  tag_id: string;
  sort_order?: number;
}

interface GhostPostsAuthor {
  post_id: string;
  author_id: string;
  sort_order?: number;
}

interface GhostExportData {
  posts?: GhostPost[];
  users?: GhostUser[];
  tags?: GhostTag[];
  posts_tags?: GhostPostsTag[];
  posts_authors?: GhostPostsAuthor[];
  roles_users?: Array<{ user_id: string; role_id: string }>;
  roles?: Array<{ id: string; name: string }>;
}

interface GhostExport {
  db: Array<{
    meta?: { version?: string; exported_on?: string };
    data: GhostExportData;
  }>;
}

// ────────────────────────────────────────────────────────────────────────────
// Utilities
// ────────────────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(msg);
}

function verbose(msg: string) {
  if (isVerbose) console.log(`  [verbose] ${msg}`);
}

function warn(msg: string) {
  console.warn(`  [warn] ${msg}`);
}

/** Build a unique slug by appending -2, -3, etc. when conflicts exist. */
function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  const resolved = `${base}-${n}`;
  taken.add(resolved);
  return resolved;
}

/** Map Ghost post status string to Prisma PostStatus enum. */
function mapPostStatus(ghostStatus: string): PostStatus {
  switch (ghostStatus) {
    case "published": return PostStatus.PUBLISHED;
    case "scheduled": return PostStatus.SCHEDULED;
    case "archived":  return PostStatus.ARCHIVED;
    default:          return PostStatus.DRAFT;
  }
}

/** Map Ghost post type to Prisma PostType enum. */
function mapPostType(ghostType?: string): PostType {
  switch (ghostType) {
    case "page": return PostType.PAGE;
    default:     return PostType.POST;
  }
}

/** Map Ghost user role name to Prisma UserRole enum. */
function mapUserRole(roleName?: string): UserRole {
  const n = (roleName ?? "").toLowerCase();
  if (n.includes("owner") || n.includes("admin")) return UserRole.ADMIN;
  if (n.includes("editor")) return UserRole.EDITOR;
  return UserRole.AUTHOR;
}

/** Extract plain content from Ghost post. Prefer html, then fall back to plaintext. */
function extractContent(post: GhostPost): string {
  if (post.html && post.html.trim()) return post.html.trim();
  if (post.plaintext && post.plaintext.trim()) return post.plaintext.trim();
  // mobiledoc/lexical are opaque JSON – store as-is with a wrapper comment
  if (post.mobiledoc) return `<!-- mobiledoc -->\n${post.mobiledoc}`;
  if (post.lexical) return `<!-- lexical -->\n${post.lexical}`;
  return "";
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  log(`\n🚀  Ghost → Prisma Import`);
  log(`   export file : ${exportFilePath}`);
  log(`   dry run     : ${isDryRun}`);
  log(``);

  // ── Load and parse export ────────────────────────────────────────────────
  let raw: string;
  try {
    raw = readFileSync(exportFilePath!, "utf8");
  } catch (err) {
    console.error(`Failed to read export file: ${(err as Error).message}`);
    process.exit(1);
  }

  let ghostExport: GhostExport;
  try {
    ghostExport = JSON.parse(raw) as GhostExport;
  } catch (err) {
    console.error(`Failed to parse JSON: ${(err as Error).message}`);
    process.exit(1);
  }

  if (!ghostExport.db || !Array.isArray(ghostExport.db) || ghostExport.db.length === 0) {
    console.error("Invalid Ghost export: missing `db` array.");
    process.exit(1);
  }

  const data: GhostExportData = ghostExport.db[0].data ?? {};
  const meta = ghostExport.db[0].meta ?? {};
  log(`   Ghost version : ${meta.version ?? "unknown"}`);
  log(`   exported on   : ${meta.exported_on ?? "unknown"}\n`);

  const ghostPosts   = data.posts ?? [];
  const ghostUsers   = data.users ?? [];
  const ghostTags    = data.tags ?? [];
  const postsTagsRaw = data.posts_tags ?? [];
  const postsAuthors = data.posts_authors ?? [];
  const rolesRaw     = data.roles ?? [];
  const rolesUsers   = data.roles_users ?? [];

  log(`   posts: ${ghostPosts.length} | users: ${ghostUsers.length} | tags: ${ghostTags.length}`);
  log(`   posts_tags: ${postsTagsRaw.length} | posts_authors: ${postsAuthors.length}\n`);

  // ── Build role lookup (ghost role id → role name) ────────────────────────
  const roleNameById = new Map<string, string>(
    rolesRaw.map((r) => [r.id, r.name])
  );
  // user id → primary role name
  const userRoleMap = new Map<string, string>();
  for (const ru of rolesUsers) {
    if (!userRoleMap.has(ru.user_id)) {
      userRoleMap.set(ru.user_id, roleNameById.get(ru.role_id) ?? "Author");
    }
  }

  // ── Build posts_authors lookup ───────────────────────────────────────────
  const postAuthorMap = new Map<string, string>(); // ghost post id → ghost author id
  for (const pa of postsAuthors.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))) {
    if (!postAuthorMap.has(pa.post_id)) {
      postAuthorMap.set(pa.post_id, pa.author_id);
    }
  }

  // ── Validate required fields ─────────────────────────────────────────────
  log("📋  Validation");
  let validationErrors = 0;

  for (const p of ghostPosts) {
    if (!p.title?.trim())   { warn(`Post id=${p.id} has no title`); validationErrors++; }
    if (!p.slug?.trim())    { warn(`Post id=${p.id} title="${p.title}" has no slug`); validationErrors++; }
  }
  for (const u of ghostUsers) {
    if (!u.email?.trim())   { warn(`User id=${u.id} has no email`); validationErrors++; }
  }
  for (const t of ghostTags) {
    if (!t.name?.trim())    { warn(`Tag id=${t.id} has no name`); validationErrors++; }
    if (!t.slug?.trim())    { warn(`Tag id=${t.id} name="${t.name}" has no slug`); validationErrors++; }
  }

  if (validationErrors > 0) {
    warn(`${validationErrors} validation warning(s) found — records will still be imported where possible.\n`);
  } else {
    log("   ✅  No validation issues\n");
  }

  // ── Build slug deduplication sets ────────────────────────────────────────
  const takenPostSlugs = new Set<string>();
  const takenTagSlugs  = new Set<string>();
  const takenUserEmails = new Set<string>();

  // ── Redirect manifest accumulator ────────────────────────────────────────
  const redirects: Array<{ from: string; to: string; reason: string }> = [];

  // ────────────────────────────────────────────────────────────────────────
  // Build import payloads
  // ────────────────────────────────────────────────────────────────────────

  // Ghost id → Prisma id maps (needed for relation wiring)
  const userIdMap = new Map<string, string>();  // ghost user id → prisma user id
  const tagIdMap  = new Map<string, string>();  // ghost tag id  → prisma tag id / slug

  // ── Users ────────────────────────────────────────────────────────────────
  interface UserPayload {
    prismaId: string;
    data: {
      email: string;
      name: string | null;
      bio: string | null;
      website: string | null;
      avatar: string | null;
      role: UserRole;
      status: UserStatus;
    };
  }

  const userPayloads: UserPayload[] = [];
  for (const u of ghostUsers) {
    if (!u.email?.trim()) continue;
    if (takenUserEmails.has(u.email.toLowerCase())) {
      warn(`Duplicate email ${u.email} — skipping`);
      continue;
    }
    takenUserEmails.add(u.email.toLowerCase());

    const prismaId = `ghost_${u.id}`;
    userIdMap.set(u.id, prismaId);

    const roleName = userRoleMap.get(u.id);
    userPayloads.push({
      prismaId,
      data: {
        email:   u.email.trim(),
        name:    u.name?.trim() ?? null,
        bio:     u.bio?.trim() ?? null,
        website: u.website?.trim() ?? null,
        avatar:  u.profile_image?.trim() ?? null,
        role:    mapUserRole(roleName),
        status:  UserStatus.ACTIVE,
      },
    });
    verbose(`user ${u.email}`);
  }

  // ── Tags ─────────────────────────────────────────────────────────────────
  interface TagPayload {
    prismaId: string;
    isCategory: boolean;
    data: {
      name: string;
      slug: string;
      description: string | null;
      color: string | null;
    };
  }

  const tagPayloads: TagPayload[] = [];
  for (const t of ghostTags) {
    if (!t.name?.trim() || !t.slug?.trim()) continue;

    const isCategory = t.name.toLowerCase().startsWith("category:");
    const cleanName  = isCategory ? t.name.slice("category:".length).trim() : t.name.trim();
    const baseSlug   = t.slug.replace(/^category-/, "").replace(/^category:/, "").trim();
    const slug       = uniqueSlug(baseSlug, takenTagSlugs);

    const prismaId   = `ghost_${t.id}`;
    tagIdMap.set(t.id, prismaId);

    tagPayloads.push({
      prismaId,
      isCategory,
      data: {
        name:        cleanName,
        slug,
        description: t.description?.trim() ?? null,
        color:       t.accent_color?.trim() ?? null,
      },
    });
    verbose(`tag ${cleanName} (category=${isCategory})`);
  }

  // ── Posts ────────────────────────────────────────────────────────────────
  interface PostPayload {
    prismaId: string;
    ghostId: string;
    originalSlug: string;
    resolvedSlug: string;
    authorGhostId: string | null;
    tagGhostIds: string[];
    categoryGhostIds: string[];
    data: {
      title: string;
      slug: string;
      excerpt: string | null;
      content: string;
      featureImage: string | null;
      type: PostType;
      status: PostStatus;
      publishedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      metaTitle: string | null;
      metaDescription: string | null;
      ogImage: string | null;
      canonicalUrl: string | null;
    };
  }

  // Build tag→post lookup from posts_tags
  const postTagsMap = new Map<string, string[]>();   // ghost post id → ghost tag ids
  for (const pt of postsTagsRaw) {
    const existing = postTagsMap.get(pt.post_id) ?? [];
    existing.push(pt.tag_id);
    postTagsMap.set(pt.post_id, existing);
  }

  // Tag payloads segregated by isCategory
  const categoryTagIds = new Set(tagPayloads.filter((t) => t.isCategory).map((t) => `ghost_${ghostTags.find(gt => `ghost_${gt.id}` === t.prismaId)?.id ?? ""}`));

  const postPayloads: PostPayload[] = [];

  for (const p of ghostPosts) {
    if (!p.title?.trim() || !p.slug?.trim()) continue;

    const originalSlug = p.slug.trim();
    const resolvedSlug = uniqueSlug(originalSlug, takenPostSlugs);

    if (resolvedSlug !== originalSlug) {
      redirects.push({
        from:   `/blog/${originalSlug}`,
        to:     `/blog/${resolvedSlug}`,
        reason: "slug collision during import",
      });
      warn(`Slug collision: "${originalSlug}" → "${resolvedSlug}"`);
    }

    const authorGhostId = postAuthorMap.get(p.id) ?? (ghostUsers[0]?.id ?? null);
    const allTagIds     = postTagsMap.get(p.id) ?? [];

    const tagGhostIds      = allTagIds.filter((id) => !categoryTagIds.has(`ghost_${id}`));
    const categoryGhostIds = allTagIds.filter((id) =>  categoryTagIds.has(`ghost_${id}`));

    postPayloads.push({
      prismaId:         `ghost_${p.id}`,
      ghostId:          p.id,
      originalSlug,
      resolvedSlug,
      authorGhostId,
      tagGhostIds,
      categoryGhostIds,
      data: {
        title:           p.title.trim(),
        slug:            resolvedSlug,
        excerpt:         p.excerpt?.trim() ?? null,
        content:         extractContent(p),
        featureImage:    p.feature_image?.trim() ?? null,
        type:            mapPostType(p.type),
        status:          mapPostStatus(p.status),
        publishedAt:     p.published_at ? new Date(p.published_at) : null,
        createdAt:       new Date(p.created_at),
        updatedAt:       new Date(p.updated_at),
        metaTitle:       p.meta_title?.trim() ?? null,
        metaDescription: p.meta_description?.trim() ?? null,
        ogImage:         p.og_image?.trim() ?? null,
        canonicalUrl:    p.canonical_url?.trim() ?? null,
      },
    });
    verbose(`post "${p.title}" [${resolvedSlug}]`);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Summary before writing
  // ────────────────────────────────────────────────────────────────────────
  log("📊  Import Summary");
  log(`   users      : ${userPayloads.length}`);
  log(`   tags       : ${tagPayloads.filter((t) => !t.isCategory).length}`);
  log(`   categories : ${tagPayloads.filter((t) =>  t.isCategory).length}`);
  log(`   posts      : ${postPayloads.length}`);
  log(`   redirects  : ${redirects.length}\n`);

  // ── Dry run exits here ───────────────────────────────────────────────────
  if (isDryRun) {
    log("⏭   Dry run complete — no database writes performed.");

    // Still write redirect manifest so we can inspect it
    writeRedirectManifest(redirects);
    process.exit(0);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Write to database
  // ────────────────────────────────────────────────────────────────────────
  const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL || 'file:./dev.db' });
  const prisma = new PrismaClient({ adapter });

  try {
    log("💾  Writing to database…\n");

    // ── 1. Users ─────────────────────────────────────────────────────────
    log("   → Users");
    let usersCreated = 0;
    let usersSkipped = 0;

    for (const u of userPayloads) {
      const existing = await prisma.user.findUnique({ where: { email: u.data.email } });
      if (existing) {
        userIdMap.set(
          ghostUsers.find((g) => `ghost_${g.id}` === u.prismaId)?.id ?? "",
          existing.id
        );
        verbose(`  skip user ${u.data.email} (already exists id=${existing.id})`);
        usersSkipped++;
        continue;
      }
      const created = await prisma.user.create({ data: { id: u.prismaId, ...u.data } });
      verbose(`  created user ${created.email} id=${created.id}`);
      usersCreated++;
    }
    log(`      created=${usersCreated} skipped=${usersSkipped}`);

    // Ensure there's a fallback author (owner/system user) for orphaned posts
    let fallbackAuthorId: string | null = null;
    if (userPayloads.length > 0) {
      fallbackAuthorId = userIdMap.get(
        ghostUsers.find((u) => u.email) ?.id ?? ""
      ) ?? userPayloads[0].prismaId;
    }

    // ── 2. Tags ───────────────────────────────────────────────────────────
    log("   → Tags");
    let tagsCreated = 0;
    let tagsSkipped = 0;

    for (const t of tagPayloads.filter((t) => !t.isCategory)) {
      const existing = await prisma.tag.findUnique({ where: { slug: t.data.slug } });
      if (existing) {
        tagIdMap.set(
          ghostTags.find((g) => `ghost_${g.id}` === t.prismaId)?.id ?? "",
          existing.id
        );
        verbose(`  skip tag "${t.data.name}" (already exists)`);
        tagsSkipped++;
        continue;
      }
      const created = await prisma.tag.create({ data: { id: t.prismaId, ...t.data } });
      verbose(`  created tag "${created.name}"`);
      tagsCreated++;
    }
    log(`      created=${tagsCreated} skipped=${tagsSkipped}`);

    // ── 3. Categories ─────────────────────────────────────────────────────
    log("   → Categories");
    let catsCreated = 0;
    let catsSkipped = 0;

    for (const t of tagPayloads.filter((t) => t.isCategory)) {
      const existing = await prisma.category.findUnique({ where: { slug: t.data.slug } });
      if (existing) {
        tagIdMap.set(
          ghostTags.find((g) => `ghost_${g.id}` === t.prismaId)?.id ?? "",
          existing.id
        );
        verbose(`  skip category "${t.data.name}" (already exists)`);
        catsSkipped++;
        continue;
      }
      const created = await prisma.category.create({ data: { id: t.prismaId, name: t.data.name, slug: t.data.slug, description: t.data.description } });
      verbose(`  created category "${created.name}"`);
      catsCreated++;
    }
    log(`      created=${catsCreated} skipped=${catsSkipped}`);

    // ── 4. Posts + relations ──────────────────────────────────────────────
    log("   → Posts");
    let postsCreated = 0;
    let postsSkipped = 0;

    for (const p of postPayloads) {
      const existing = await prisma.post.findUnique({ where: { slug: p.data.slug } });
      if (existing) {
        verbose(`  skip post "${p.data.title}" (slug "${p.data.slug}" already exists)`);
        postsSkipped++;
        continue;
      }

      // Resolve author id
      const authorPrismaId =
        (p.authorGhostId ? userIdMap.get(p.authorGhostId) : undefined) ??
        fallbackAuthorId;

      if (!authorPrismaId) {
        warn(`No author found for post "${p.data.title}" — skipping`);
        continue;
      }

      // Resolve actual Prisma ids from map (handles the case where records already existed)
      const resolvedTagIds = p.tagGhostIds
        .map((gid) => tagIdMap.get(gid) ?? `ghost_${gid}`)
        .filter(Boolean);

      const resolvedCatIds = p.categoryGhostIds
        .map((gid) => tagIdMap.get(gid) ?? `ghost_${gid}`)
        .filter(Boolean);

      await prisma.post.create({
        data: {
          id:       p.prismaId,
          authorId: authorPrismaId,
          ...p.data,
          tags: {
            create: resolvedTagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          },
          categories: {
            create: resolvedCatIds.map((catId) => ({
              category: { connect: { id: catId } },
            })),
          },
        },
      });
      verbose(`  created post "${p.data.title}" [${p.data.slug}]`);
      postsCreated++;
    }
    log(`      created=${postsCreated} skipped=${postsSkipped}\n`);

    log("✅  Import complete!\n");

  } finally {
    await prisma.$disconnect();
  }

  // ── Write redirect manifest ────────────────────────────────────────────
  writeRedirectManifest(redirects);

  log("🎉  Done.\n");
}

// ────────────────────────────────────────────────────────────────────────────
// Redirect manifest writer
// ────────────────────────────────────────────────────────────────────────────

function writeRedirectManifest(redirects: Array<{ from: string; to: string; reason: string }>) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outDir    = join(__dirname, "..", "kb", "migrations");
  const outPath   = join(outDir, "ghost-redirect-manifest.json");

  try {
    mkdirSync(outDir, { recursive: true });
    const manifest = {
      generated: new Date().toISOString(),
      count: redirects.length,
      redirects,
    };
    writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
    if (redirects.length > 0) {
      log(`📄  Redirect manifest written → ${outPath} (${redirects.length} entries)`);
    } else {
      log(`📄  Redirect manifest written → ${outPath} (no slug collisions)`);
    }
  } catch (err) {
    warn(`Failed to write redirect manifest: ${(err as Error).message}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Run
// ────────────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
