import React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '../hooks/useAuth'
import { slugify } from '../types'
import { RichTextEditor } from '../components/RichTextEditor'

type PostDraft = {
 title: string
 slug: string
 excerpt: string
 content: string
 status: 'DRAFT' | 'PUBLISHED'
 tags: string
}

function PostEditorPage() {
 const { auth } = useAuth()
 const [draft, setDraft] = React.useState<PostDraft>({
 title: '',
 slug: '',
 excerpt: '',
 content: '',
 status: 'DRAFT',
 tags: '',
 })
 const [slugManual, setSlugManual] = React.useState(false)
 const [saving, setSaving] = React.useState(false)
 const [saveState, setSaveState] = React.useState<'idle' | 'saved' | 'error'>('idle')
 const [saveError, setSaveError] = React.useState('')

 // Auto-generate slug from title unless manually edited
 const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const title = e.target.value
 setDraft((d) => ({
 ...d,
 title,
 slug: slugManual ? d.slug : slugify(title),
 }))
 }

 const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 setSlugManual(true)
 setDraft((d) => ({ ...d, slug: e.target.value }))
 }

 const handleSave = async (statusOverride?: 'DRAFT' | 'PUBLISHED') => {
 if (!draft.title.trim()) {
 setSaveError('Title is required.')
 setSaveState('error')
 return
 }
 if (!auth.token) {
 setSaveError('You must be signed in to save posts.')
 setSaveState('error')
 return
 }

 setSaving(true)
 setSaveState('idle')
 setSaveError('')

 try {
 const res = await fetch('/api/posts', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${auth.token}`,
 },
 body: JSON.stringify({
 ...draft,
 status: statusOverride ?? draft.status,
 tags: draft.tags
 .split(',')
 .map((t) => t.trim())
 .filter(Boolean),
 }),
 })
 const data = await res.json() as { ok: boolean; post?: { id: string; slug: string }; error?: string }
 if (data.ok) {
 setSaveState('saved')
 if (statusOverride) setDraft((d) => ({ ...d, status: statusOverride }))
 } else {
 setSaveError(data.error ?? 'Save failed.')
 setSaveState('error')
 }
 } catch {
 setSaveError('Network error. Please try again.')
 setSaveState('error')
 } finally {
 setSaving(false)
 }
 }

 if (!auth.user) {
 return (
 <div className="bg-background min-h-[60vh] flex items-center justify-center">
 <p className="text-muted-foreground">Sign in to create posts.</p>
 </div>
 )
 }

 return (
 <div className="bg-background py-12">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
 {/* Header */}
 <div className="flex items-center justify-between mb-8">
 <div>
 <Link to="/admin" className="text-primary hover:text-muted-foreground text-sm mb-2 block">
 ← Back to Admin
 </Link>
 <h1 className="text-3xl font-bold text-foreground">New Post</h1>
 </div>
 <div className="flex gap-3">
 <button
 type="button"
 onClick={() => handleSave('DRAFT')}
 disabled={saving}
 className="bg-secondary hover:bg-background disabled:opacity-50 text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
 >
 {saving ? 'Saving…' : 'Save Draft'}
 </button>
 <button
 type="button"
 onClick={() => handleSave('PUBLISHED')}
 disabled={saving}
 className="bg-background hover:bg-background disabled:opacity-50 text-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
 >
 Publish
 </button>
 </div>
 </div>

 {/* Status feedback */}
 {saveState === 'saved' && (
 <div className="mb-4 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
 ✓ Post saved successfully.
 </div>
 )}
 {saveState === 'error' && (
 <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
 {saveError}
 </div>
 )}

 <div className="space-y-6">
 {/* Title */}
 <div>
 <label className="block text-sm text-muted-foreground mb-1">Title <span className="text-red-400">*</span></label>
 <input
 type="text"
 value={draft.title}
 onChange={handleTitleChange}
 placeholder="Post title"
 className="w-full bg-secondary border border-border text-foreground text-xl font-semibold rounded-lg px-4 py-3 focus:outline-none focus:border-border placeholder:text-primary"
 />
 </div>

 {/* Slug */}
 <div>
 <label className="block text-sm text-muted-foreground mb-1">
 Slug
 {slugManual && (
 <button
 type="button"
 onClick={() => { setSlugManual(false); setDraft((d) => ({ ...d, slug: slugify(d.title) })) }}
 className="ml-2 text-muted-foreground text-xs hover:text-muted-foreground"
 >
 reset to auto
 </button>
 )}
 </label>
 <div className="flex items-center bg-secondary border border-border rounded-lg overflow-hidden focus-within:border-border">
 <span className="px-3 py-2.5 text-primary text-sm border-r border-border select-none">/</span>
 <input
 type="text"
 value={draft.slug}
 onChange={handleSlugChange}
 placeholder="my-post-slug"
 className="flex-1 bg-transparent text-foreground px-3 py-2.5 text-sm focus:outline-none placeholder:text-primary"
 />
 </div>
 </div>

 {/* Excerpt */}
 <div>
 <label className="block text-sm text-muted-foreground mb-1">Excerpt</label>
 <textarea
 value={draft.excerpt}
 onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
 placeholder="Short description shown in post cards and SEO…"
 rows={2}
 className="w-full bg-secondary border border-border text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-border resize-none placeholder:text-primary"
 />
 </div>

 {/* Body */}
 <div>
 <label className="block text-sm text-muted-foreground mb-1">Body</label>
 <RichTextEditor
 content={draft.content}
 onChange={(html) => setDraft((d) => ({ ...d, content: html }))}
 placeholder="Start writing your post…"
 />
 </div>

 {/* Tags */}
 <div>
 <label className="block text-sm text-muted-foreground mb-1">Tags <span className="text-primary">(comma-separated)</span></label>
 <input
 type="text"
 value={draft.tags}
 onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
 placeholder="self-hosting, infrastructure, ai"
 className="w-full bg-secondary border border-border text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-border placeholder:text-primary"
 />
 </div>

 {/* Status toggle */}
 <div className="flex items-center gap-3">
 <label className="text-sm text-muted-foreground">Status:</label>
 <button
 type="button"
 onClick={() => setDraft((d) => ({ ...d, status: d.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT' }))}
 className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
 draft.status === 'PUBLISHED'
 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
 : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
 }`}
 >
 {draft.status}
 </button>
 </div>
 </div>
 </div>
 </div>
 )
}

export const Route = createFileRoute('/admin/new-post')({
 component: PostEditorPage,
})

export default { component: PostEditorPage }
