export type { AuthUser } from '../hooks/useAuth'

export type PostDraft = {
  title: string
  slug: string
  excerpt: string
  content: string
  status: 'DRAFT' | 'PUBLISHED'
  tags: string
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
