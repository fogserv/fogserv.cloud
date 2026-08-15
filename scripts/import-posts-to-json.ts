import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const exportFilePath = args[0];

if (!exportFilePath) {
  console.error("Usage: bun run scripts/import-posts-to-json.ts <ghost-export.json>");
  process.exit(1);
}

let raw;
try {
  raw = readFileSync(exportFilePath, "utf8");
} catch (err) {
  console.error(`Failed to read export file: ${err.message}`);
  process.exit(1);
}

const ghostExport = JSON.parse(raw);
const data = ghostExport.db[0].data;

const ghostPosts = data.posts ?? [];

const outputPosts = [];

for (const p of ghostPosts) {
  if (p.status !== 'published') continue;
  if (!p.title || !p.slug) continue;
  
  // Skip pages like 'about' since they are not journal/blog posts
  if (p.type === 'page') continue;

  outputPosts.push({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt || p.custom_excerpt || (p.plaintext ? p.plaintext.substring(0, 150) + '...' : ''),
    content: p.html || '',
    publishedAt: p.published_at || p.created_at,
    tags: [] // We could extract tags if needed, but keeping it simple
  });
}

// Sort by published date descending
outputPosts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

const outDir = join(process.cwd(), 'src', 'data');
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

const outPath = join(outDir, 'posts.json');
writeFileSync(outPath, JSON.stringify(outputPosts, null, 2));

console.log(`Successfully exported ${outputPosts.length} posts to ${outPath}`);
