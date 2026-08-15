import React from 'react'
// ─────────────────────────────────────────────────────────────────────────────
// Admin Metric Card
// ─────────────────────────────────────────────────────────────────────────────
export function AdminMetricCard({
 label,
 value,
 note,
 tone,
}: {
 label: string
 value: string
 note: string
 tone: 'indigo' | 'emerald' | 'cyan' | 'amber'
}) {
 const toneStyles: Record<typeof tone, string> = {
 indigo: 'border-border bg-background/10 text-foreground',
 emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
 cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
 amber: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
 }
 return (
 <article className={`rounded-xl border p-5 ${toneStyles[tone]}`}>
 <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-2">{label}</p>
 <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
 <p className="text-xs text-foreground">{note}</p>
 </article>
 )
}
// ─────────────────────────────────────────────────────────────────────────────
// Admin Queue Row
// ─────────────────────────────────────────────────────────────────────────────
export function QueueRow({
 title,
 status,
 owner,
 due,
}: {
 title: string
 status: string
 owner: string
 due: string
}) {
 return (
 <div className="rounded-lg border border-border bg-background/60 px-4 py-3">
 <p className="text-foreground font-medium mb-2">{title}</p>
 <div className="flex flex-wrap gap-2 text-xs text-foreground">
 <span className="rounded-full bg-secondary/80 px-2 py-1">{status}</span>
 <span className="rounded-full bg-secondary/80 px-2 py-1">Owner: {owner}</span>
 <span className="rounded-full bg-secondary/80 px-2 py-1">Due: {due}</span>
 </div>
 </div>
 )
}
// ─────────────────────────────────────────────────────────────────────────────
// Admin Action Button
// ─────────────────────────────────────────────────────────────────────────────
export function ActionButton({ label, detail }: { label: string; detail: string }) {
 return (
 <button
 type="button"
 className="w-full text-left rounded-lg border border-border bg-background/70 px-4 py-3 hover:border-border hover:bg-background"
 >
 <p className="text-foreground font-medium">{label}</p>
 <p className="text-muted-foreground text-sm">{detail}</p>
 </button>
 )
}
// ─────────────────────────────────────────────────────────────────────────────
// Status Pill
// ─────────────────────────────────────────────────────────────────────────────
export function StatusPill({ title, value, tone }: { title: string; value: string; tone: 'emerald' | 'amber' }) {
 const toneStyles: Record<typeof tone, string> = {
 emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
 amber: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
 }
 return (
 <div className={`rounded-lg border px-4 py-3 ${toneStyles[tone]}`}>
 <p className="text-xs uppercase tracking-[0.18em] font-semibold mb-1">{title}</p>
 <p className="text-foreground font-medium">{value}</p>
 </div>
 )
}
// ─────────────────────────────────────────────────────────────────────────────
// Email Sandbox
// ─────────────────────────────────────────────────────────────────────────────
import { emailService } from '../services/emailService'
export function EmailSandboxCard() {
 const [recipientEmail, setRecipientEmail] = React.useState('')
 const [recipientName, setRecipientName] = React.useState('')
 const [requesting, setRequesting] = React.useState(false)
 const [confirming, setConfirming] = React.useState(false)
 const [verificationToken, setVerificationToken] = React.useState('')
 const [statusMessage, setStatusMessage] = React.useState<string | null>(null)
 const [statusTone, setStatusTone] = React.useState<'success' | 'error' | 'idle'>('idle')
 const handleRequestVerification = async () => {
 if (!recipientEmail.trim()) {
 setStatusTone('error')
 setStatusMessage('Recipient email is required.')
 return
 }
 setRequesting(true)
 setStatusTone('idle')
 setStatusMessage('Requesting verification email...')
 try {
 const result = await emailService.requestVerification({
 email: recipientEmail.trim(),
 name: recipientName.trim() || undefined,
 })
 if (result.verificationToken) {
 setVerificationToken(result.verificationToken)
 }
 setStatusTone('success')
 setStatusMessage(`Verification requested${result.messageId ? ` (${result.messageId})` : ''}.`)
 } catch (error) {
 setStatusTone('error')
 setStatusMessage(error instanceof Error ? error.message : 'Failed to request verification email.')
 } finally {
 setRequesting(false)
 }
 }
 const handleConfirmVerification = async () => {
 if (!verificationToken.trim()) {
 setStatusTone('error')
 setStatusMessage('Verification token is required to confirm.')
 return
 }
 setConfirming(true)
 setStatusTone('idle')
 setStatusMessage('Confirming verification token...')
 try {
 const result = await emailService.confirmVerification({ token: verificationToken.trim(), email: recipientEmail.trim() })
 setStatusTone('success')
 setStatusMessage(
 `Verification confirmed${result.email ? ` for ${result.email}` : ''}${result.subscriberId ? ` (${result.subscriberId})` : ''}.`,
 )
 setVerificationToken('')
 } catch (error) {
 setStatusTone('error')
 setStatusMessage(error instanceof Error ? error.message : 'Failed to confirm verification token.')
 } finally {
 setConfirming(false)
 }
 }
 return (
 <div className="mt-6 rounded-lg border border-border bg-background/70 p-4">
 <h3 className="text-foreground font-semibold mb-3">Email Sandbox</h3>
 <p className="text-xs text-muted-foreground mb-4">Sends verification template using configured provider mode.</p>
 <div className="space-y-3">
 <input
 type="email"
 placeholder="recipient@example.com"
 value={recipientEmail}
 onChange={(event) => setRecipientEmail(event.target.value)}
 className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-primary"
 />
 <input
 type="text"
 placeholder="Recipient name (optional)"
 value={recipientName}
 onChange={(event) => setRecipientName(event.target.value)}
 className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-primary"
 />
 <button
 type="button"
 disabled={requesting}
 onClick={handleRequestVerification}
 className="w-full rounded-md border border-border bg-background/20 px-3 py-2 text-sm font-medium text-foreground hover:bg-primary-hover/30 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {requesting ? 'Requesting...' : 'Request Verification Email'}
 </button>
 <input
 type="text"
 placeholder="Verification token"
 value={verificationToken}
 onChange={(event) => setVerificationToken(event.target.value)}
 className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-primary"
 />
 <button
 type="button"
 disabled={confirming}
 onClick={handleConfirmVerification}
 className="w-full rounded-md border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {confirming ? 'Confirming...' : 'Confirm Verification Token'}
 </button>
 </div>
 {statusMessage ? (
 <p
 className={`mt-3 text-xs ${
 statusTone === 'success'
 ? 'text-emerald-300'
 : statusTone === 'error'
 ? 'text-rose-300'
 : 'text-foreground'
 }`}
 >
 {statusMessage}
 </p>
 ) : null}
 </div>
 )
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Post List Row
// ─────────────────────────────────────────────────────────────────────────────
export function PostListRow({ post, onDelete }: { post: { id: string; title: string; slug: string; excerpt: string | null; status: string; createdAt: string; author?: { name: string | null; email: string } | null; tags: { name: string; slug: string }[] } | null; onDelete?: (id: string) => void }) {
 if (!post) return null

 const statusColor: Record<string, string> = {
 DRAFT: 'bg-background/80 text-foreground',
 PUBLISHED: 'bg-emerald-600/80 text-emerald-200',
 SCHEDULED: 'bg-amber-600/80 text-amber-200',
 ARCHIVED: 'bg-rose-600/80 text-rose-200',
 }

 return (
 <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-4 py-3">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-3 mb-1">
 <p className="text-foreground font-medium truncate">{post.title}</p>
 <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor[post.status] || 'bg-background'}`}>{post.status}</span>
 </div>
 <p className="text-muted-foreground text-sm truncate">{post.excerpt || 'No excerpt'}</p>
 <div className="flex flex-wrap gap-2 text-xs text-primary mt-1">
 <span>by {post.author?.name || post.author?.email || 'Unknown'}</span>
 <span>•</span>
 <span>{new Date(post.createdAt).toLocaleDateString()}</span>
 {post.tags.length > 0 && (
 <>
 <span>•</span>
 <div className="flex gap-1">
 {post.tags.slice(0, 3).map((tag) => (
 <span key={tag.slug} className="rounded-full bg-secondary/50 text-muted-foreground px-2 py-0.5">{tag.name}</span>
 ))}
 {post.tags.length > 3 && <span className="text-primary">+{post.tags.length - 3} more</span>}
 </div>
 </>
 )}
 </div>
 </div>
 <div className="flex items-center gap-2 ml-4">
 <a href="/admin/new-post" className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-foreground hover:text-foreground hover:border-border">Edit</a>
 {onDelete && (
 <button onClick={() => onDelete(post.id)} className="rounded-md border border-rose-800/50 bg-rose-900/30 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-900/50">Delete</button>
 )}
 </div>
 </div>
 )
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Posts Section (real data)
// ─────────────────────────────────────────────────────────────────────────────
export function PostsSection({ showDrafts = false }: { showDrafts?: boolean }) {
 const [posts, setPosts] = React.useState<{ id: string; title: string; slug: string; excerpt: string | null; status: string; createdAt: string; author?: { name: string | null; email: string } | null; tags: { name: string; slug: string }[] }[]>([])
 const [loading, setLoading] = React.useState(true)
 const [error, setError] = React.useState<string | null>(null)

 const fetchPosts = React.useCallback(async () => {
 setLoading(true)
 setError(null)
 try {
 const params = showDrafts ? '?all=1' : ''
 const res = await fetch(`/api/posts${params}`)
 if (!res.ok) throw new Error(`Failed to fetch posts: ${res.statusText}`)
 const data = await res.json()
 if (data.ok) setPosts(data.posts || [])
 else throw new Error(data.error || 'Failed to fetch posts')
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Unknown error')
 } finally {
 setLoading(false)
 }
 }, [showDrafts])

 const handleDelete = React.useCallback(async (id: string) => {
 if (!confirm('Are you sure you want to delete this post?')) return
 try {
 const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
 if (res.ok) {
 setPosts((prev) => prev.filter((p) => p.id !== id))
 } else {
 const data = await res.json()
 alert(data.error || 'Failed to delete post')
 }
 } catch {
 alert('Failed to delete post')
 }
 }, [])

 React.useEffect(() => {
 fetchPosts()
 }, [fetchPosts])

 if (loading) return (
 <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
 )

 if (error) return (
 <div className="text-center py-8 text-rose-400">Error: {error}</div>
 )

 return (
 <div className="space-y-3">
 {posts.length === 0 ? (
 <p className="text-muted-foreground text-center py-4">No posts found. {showDrafts ? 'Try creating a post.' : 'Create your first post!'}</p>
 ) : (
 posts.map((post) => (
 <PostListRow key={post.id} post={post} onDelete={handleDelete} />
 ))
 )}
 </div>
 )
}
