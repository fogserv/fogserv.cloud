import { createFileRoute, Link } from '@tanstack/react-router'
import posts from '../data/posts.json'

export const Route = createFileRoute('/changelog_/$slug')({
 component: PostPage,
 loader: ({ params }) => {
 const post = posts.find((p) => p.slug === params.slug)
 if (!post) throw new Error('Post not found')
 return post
 },
})

function PostPage() {
 const post = Route.useLoaderData()
 
 const dateStr = new Date(post.publishedAt).toLocaleDateString('en-US', {
 year: 'numeric',
 month: 'long',
 day: 'numeric'
 });

 return (
 <div className="bg-background py-20 min-h-screen">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
 <Link to="/changelog" className="text-muted-foreground hover:text-muted-foreground mb-8 inline-flex items-center gap-2">
 ← Back to Updates
 </Link>
 
 <article className="bg-secondary/50 border border-border rounded-xl p-8 md:p-12">
 <header className="mb-10 border-b border-border/50 pb-8">
 <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">{post.title}</h1>
 <div className="flex items-center gap-4 text-muted-foreground">
 <time dateTime={post.publishedAt}>{dateStr}</time>
 </div>
 </header>
 
 <div 
 className="prose prose-invert prose-purple max-w-none prose-img:rounded-xl prose-a:text-muted-foreground hover:prose-a:text-muted-foreground"
 dangerouslySetInnerHTML={{ __html: post.content }}
 />
 </article>
 </div>
 </div>
 )
}

export default { component: PostPage }
