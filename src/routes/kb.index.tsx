import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { useLocation } from '@tanstack/react-router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface CategoryArticle {
 title: string
 slug: string
 description?: string
}

interface KBCategory {
 name: string
 icon: string
 articles: CategoryArticle[]
}

// Vite glob import helper — safely unwraps raw strings regardless of whether 
// Vite returns them directly or wrapped in an object (e.g., { default: '...' })
function getRawContent(mod: unknown): string {
 if (typeof mod === 'string') return mod;
 if (mod && typeof mod === 'object' && 'default' in mod) return ((mod as any).default ?? '') as string;
 return '';
}

// Build KB index from the actual file structure using import.meta.glob at build time
const mdFiles = import.meta.glob('/kb/**/*.md', { eager: true, query: '?raw' })

function parseTitle(slug: string): string {
 return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Extract root README markdown for the overview/index section (safe from Vite glob quirks)
const rootReadmeContent = (() => {
 const raw = getRawContent(mdFiles['/kb/README.md']);
 return raw.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
})();

function cleanBody(raw: string): string {
 return raw.replace(/^\n+|\n+$/g, '')
}

// Categories and their articles (auto-generated from file tree)
const categories: KBCategory[] = []

for (const [path] of Object.entries(mdFiles)) {
 // Skip the root README since we render it separately as the index
 if (path === '/kb/README.md') continue
 
 const relativePath = path.replace('/kb/', '').replace('.md', '')
 const content = getRawContent(mdFiles[path])
 
 // Fallback safety: skip malformed paths or empty content
 if (!relativePath || !content) continue

 const parts = relativePath.split('/')
 
 if (parts.length === 1) {
 // Root-level article — add to an "Overview" category
 let overviewCat = categories.find(c => c.name === 'Overview')
 if (!overviewCat) {
 overviewCat = { name: 'Overview', icon: '📋', articles: [] }
 categories.unshift(overviewCat)
 }
 // Use parsed filename as title (e.g. "TELOS" → "Telos", "lessons-learned" → "Lessons Learned")
 overviewCat.articles.push({
 slug: relativePath,
 title: parseTitle(parts[0]),
 })
 } else {
 // Category subdirectory — group by first segment
 const categoryName = parseTitle(parts[0])
 let cat = categories.find(c => c.name.toLowerCase() === parts[0].toLowerCase())
 
 if (!cat) {
 cat = { name: categoryName, icon: '📁', articles: [] }
 
 // Assign icons based on category name (expanded for all current directories)
 const iconMap: Record<string, string> = {
 'Basics': '⚡', 'Containers': '🐳', 'Security': '🔒',
 'Infrastructure': '🏗️', 'Databases': '🗄️', 'Frontend': '🎨',
 'Gitops': '⚙️', 'Sysadmin': '🛠️', 'Research': '🔬',
 'Migrations': '🔄', 'Networking': '🌐', 'Observability': '📊',
 'Agentic': '🤖', 'Aiml': '🧠', 'Cicd': '🚀',
 'Cloud': '☁️', 'Overview': '📋'
 }
 cat.icon = iconMap[categoryName] || '📄'
 
 // Insert in logical order (Overview first, then rest)
 const idx = categories.findIndex(c => c.name === 'Overview') + 1
 if (idx > 0) {
 categories.splice(idx, 0, cat)
 } else {
 categories.push(cat)
 }
 }
 
 let title = parseTitle(parts[1])
 if (parts[1].toLowerCase() === 'readme') {
 // Skip README files in subdirectories — they're just category headers
 continue
 }
 cat.articles.push({ slug: relativePath, title })
 }
}

// Sort articles within each category alphabetically
for (const cat of categories) {
 cat.articles.sort((a, b) => a.title.localeCompare(b.title))
}

export const Route = createFileRoute('/kb/')({
 component: KBIndex,
})

function KBIndex() {
 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
 {/* Root README rendered as index/overview */}
 {rootReadmeContent && (
 <section className="mb-12 bg-secondary/30 border border-border rounded-xl p-6 md:p-8">
  <div className="prose prose-invert max-w-none">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
  {cleanBody(rootReadmeContent)}
  </ReactMarkdown>
  </div>
 </section>
 )}

 {/* Category Grid */}
 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
 {categories.map(cat => (
 <KBCategoryCard key={cat.name} category={cat} />
 ))}
 </div>

 {/* Stats footer */}
 <footer className="mt-16 text-center border-t border-border/50 pt-8">
 <p className="text-primary text-sm">
 {categories.reduce((sum, c) => sum + c.articles.length, 0)} articles across {categories.length} categories
 </p>
 </footer>
 </div>
 )
}

function KBCategoryCard({ category }: { category: KBCategory }) {
 return (
 <div className="bg-secondary/50 backdrop-blur border border-border rounded-xl p-6 hover:border-border transition-all duration-300">
 <div className="flex items-center gap-3 mb-4">
 <span className="text-2xl">{category.icon}</span>
 <h2 className="text-lg font-semibold text-foreground">{category.name}</h2>
 <span className="ml-auto text-xs px-2 py-1 bg-background/40 text-muted-foreground rounded-full">
 {category.articles.length}
 </span>
 </div>

 <ul className="space-y-2">
 {category.articles.map(article => (
 <li key={article.slug}>
 <Link 
 to={`/kb/${article.slug}`} 
 className="text-muted-foreground hover:text-muted-foreground transition-colors text-sm flex items-center gap-2 group"
 >
 <span className="w-1 h-1 bg-background rounded-full group-hover:bg-background"></span>
 {article.title}
 </Link>
 </li>
 ))}
 </ul>
 </div>
 )
}
