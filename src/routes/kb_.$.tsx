import { createFileRoute } from '@tanstack/react-router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Glob import all markdown files from kb/ — Vite loads them as raw strings at build time
const mdFiles = import.meta.glob('/kb/**/*.md', { eager: true, query: '?raw' }) as Record<string, string>

function extractFrontmatter(raw: string): { title?: string; description?: string; [key: string]: unknown } | null {
 const match = raw.match(/^---\n([\s\S]*?)\n---/)
 if (!match) return null
 const fm: Record<string, string> = {}
 for (const line of match[1].split('\n')) {
 const [k, ...rest] = line.split(':')
 if (k && rest.length) fm[k.trim()] = rest.join(':').trim()
 }
 return fm as any
}

function cleanBody(raw: string): string {
 // Strip frontmatter and leading/trailing blank lines
 const cleaned = raw.replace(/^---\n[\s\S]*?\n---\n?/, '').replace(/^\n+|\n+$/g, '')
 return cleaned
}

// Build a static lookup map at module scope so article resolution is synchronous & fully static-friendly.
// This replaces the runtime useEffect loop and ensures `bun run build` prerenders everything cleanly.
const slugToContent: Record<string, string> = {}
for (const [path, mod] of Object.entries(mdFiles)) {
 const content = typeof mod === 'object' && 'default' in mod ? (mod as any).default : mod
 if (typeof content !== 'string') continue

 // rawPath examples: "networking/README", "infrastructure/cloud-init-basics"
 const rawPath = path.replace('/kb/', '').replace(/\.md$/, '')
 slugToContent[rawPath] = content

 // Map directory slugs to their README files (e.g., "/kb/networking/" -> networking/README)
 const parts = rawPath.split('/')
 if (parts.length > 1 && parts[parts.length - 1].toLowerCase() === 'readme') {
 slugToContent[parts.slice(0, -1).join('/')] = content
 }
}

export const Route = createFileRoute('/kb_/$')({
 component: KBArticle,
})

function KBArticle() {
 const params = Route.useParams()
 const slug = params._splat || ''

 // Synchronous lookup — no useEffect needed since it's pre-built statically at build time
 const raw = slugToContent[slug] ?? null

 if (!raw) {
 return (
 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
 <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
 <p className="text-red-400 text-lg font-semibold mb-2">Article Not Found</p>
 <p className="text-muted-foreground">{`Article "${slug}" not found in the knowledge base.`}</p>
 <a href="/kb" className="inline-block mt-4 text-muted-foreground hover:text-muted-foreground transition-colors">← Back to Knowledge Base</a>
 </div>
 </div>
 )
 }

 const fm = extractFrontmatter(raw)
 const body = cleanBody(raw)
 
 // Calculate title & category from slug structure
 const slugParts = slug.split('/')
 const fileName = slugParts.pop() || ''
 const isReadmeDir = fileName.toLowerCase() === 'readme' && slugParts.length > 0
 
 let pageTitle: string
 if (isReadmeDir) {
 // e.g., "networking" -> "Networking Knowledge Base"
 pageTitle = slugParts.join(' ').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' Knowledge Base'
 } else {
 const defaultTitle = fileName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Knowledge Base'
 pageTitle = (fm?.title as string | undefined) || defaultTitle
 }

 const category = isReadmeDir 
 ? slugParts[0].charAt(0).toUpperCase() + slugParts[0].slice(1) 
 : (slugParts.length > 1 ? slugParts[0].charAt(0).toUpperCase() + slugParts[0].slice(1) : 'Overview')

 return (
 <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
 {/* Breadcrumb */}
 <nav className="mb-8">
 <a href="/kb" className="text-primary hover:text-muted-foreground transition-colors text-sm">&larr; Knowledge Base</a>
 </nav>

 {/* Title & metadata */}
 <header className="mb-10 border-b border-border/50 pb-6">
 <span className="inline-block px-3 py-1 bg-background/40 text-muted-foreground rounded-full text-xs font-medium tracking-wide uppercase mb-3">{category}</span>
 <h1 className="text-4xl font-bold text-foreground mb-3 leading-tight">{pageTitle}</h1>
 {fm?.description && (
 <p className="text-muted-foreground text-lg max-w-2xl">{fm.description}</p>
 )}
 </header>

 {/* Markdown content */}
 <div className="prose prose-invert prose-lg max-w-none">
 <ReactMarkdown remarkPlugins={[remarkGfm]}>
 {body}
 </ReactMarkdown>
 </div>
 </article>
 )
}
