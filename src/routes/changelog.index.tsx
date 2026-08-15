import { createFileRoute, Link } from '@tanstack/react-router'
import posts from '../data/posts.json'

function ChangelogPage() {
 return (
 <div className="bg-background py-20 min-h-screen">
 <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
 <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-12">Changelog & Updates</h1>
 
 <div className="space-y-8">
 {posts.map((post) => {
 const dateStr = new Date(post.publishedAt).toLocaleDateString('en-US', {
 year: 'numeric',
 month: 'long',
 day: 'numeric'
 });

 return (
 <article key={post.slug} className="bg-secondary/50 border border-border rounded-lg p-8 hover:border-border transition-colors">
 <Link to={`/changelog/${post.slug}`} className="block group">
 <h2 className="text-2xl font-bold text-foreground mb-4 group-hover:text-muted-foreground transition-colors">{post.title}</h2>
 <p className="text-muted-foreground mb-4 line-clamp-3">
 {post.excerpt}
 </p>
 <div className="flex gap-4 text-sm text-primary">
 <span>{dateStr}</span>
 </div>
 </Link>
 </article>
 );
 })}
 </div>
 </div>
 </div>
 )
}

export const Route = createFileRoute('/changelog/')({
 component: ChangelogPage,
})

export default { component: ChangelogPage }
