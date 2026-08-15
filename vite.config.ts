import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { PrismaClient, PostStatus, SubscriberStatus, UserStatus } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createLibSQL } from '@libsql/client'
import { createHmac, timingSafeEqual, scrypt, randomBytes, timingSafeEqual as tse } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

type EmailApiPayload = {
  to: {
    email: string
    name?: string
  }
  subject: string
  html: string
  text?: string
}

type VerificationRequestPayload = {
  email: string
  name?: string
}

type VerificationConfirmPayload = {
  token: string
}

type MailgunWebhookPayload = {
  signature?: {
    timestamp?: string
    token?: string
    signature?: string
  }
  'event-data'?: {
    event?: string
    recipient?: string
    timestamp?: number
    severity?: string
    message?: {
      headers?: {
        'message-id'?: string
      }
    }
  }
  event?: string
  recipient?: string
  timestamp?: number
  token?: string
}

type MiddlewareRequest = {
  url?: string
  method?: string
  headers?: Record<string, string | string[] | undefined>
  [Symbol.asyncIterator]?: () => AsyncIterableIterator<Uint8Array | string>
}

type MiddlewareResponse = {
  statusCode: number
  setHeader: (name: string, value: string) => void
}

type MiddlewareNext = () => void | Promise<void>
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL || 'file:./dev.db' })
const prisma = new PrismaClient({ adapter })

async function parseJsonBody<T>(req: NodeJS.ReadableStream): Promise<T> {
  const raw = await readRawBody(req)
  if (!raw) {
    throw new Error('Request body is required')
  }

  return JSON.parse(raw) as T
}

async function readRawBody(req: NodeJS.ReadableStream): Promise<string> {
  const chunks: Uint8Array[] = []

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  const raw = Buffer.concat(chunks).toString('utf8')
  return raw
}

function getHeader(req: MiddlewareRequest, headerName: string): string | undefined {
  const raw = req.headers?.[headerName.toLowerCase()] ?? req.headers?.[headerName]
  if (Array.isArray(raw)) return raw[0]
  return raw
}

async function parseWebhookBody(req: MiddlewareRequest): Promise<MailgunWebhookPayload> {
  const raw = await readRawBody(req as NodeJS.ReadableStream)
  if (!raw) {
    throw new Error('Request body is required')
  }

  const contentType = (getHeader(req, 'content-type') || '').toLowerCase()

  if (contentType.includes('application/json')) {
    return JSON.parse(raw) as MailgunWebhookPayload
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = new URLSearchParams(raw)
    const asObject = Object.fromEntries(form.entries()) as Record<string, string>

    const eventDataRaw = asObject['event-data']
    const eventData = eventDataRaw ? (JSON.parse(eventDataRaw) as MailgunWebhookPayload['event-data']) : undefined

    return {
      signature: {
        timestamp: asObject.timestamp,
        token: asObject.token,
        signature: asObject.signature,
      },
      'event-data': eventData,
      event: asObject.event,
      recipient: asObject.recipient,
      timestamp: asObject.timestamp ? Number(asObject.timestamp) : undefined,
      token: asObject.token,
    }
  }

  return JSON.parse(raw) as MailgunWebhookPayload
}

async function sendViaMailgun(payload: EmailApiPayload): Promise<{ messageId?: string }> {
  const apiKey = process.env.MAILGUN_API_KEY
  const domain = process.env.MAILGUN_DOMAIN
  const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'noreply@fogserv.cloud'

  if (!apiKey || !domain) {
    return {
      messageId: `local-${Date.now()}`,
    }
  }

  const toHeader = payload.to.name ? `${payload.to.name} <${payload.to.email}>` : payload.to.email
  const formBody = new URLSearchParams({
    from: fromEmail,
    to: toHeader,
    subject: payload.subject,
    html: payload.html,
    text: payload.text || payload.subject,
  })

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  })

  const bodyText = await response.text()

  if (!response.ok) {
    throw new Error(bodyText || 'Mailgun request failed')
  }

  let parsed: { id?: string } | undefined
  try {
    parsed = JSON.parse(bodyText) as { id?: string }
  } catch {
    parsed = undefined
  }

  return {
    messageId: parsed?.id,
  }
}

function json(res: MiddlewareResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function resolveAppBaseUrl(req: MiddlewareRequest): string {
  const fromEnv = process.env.APP_BASE_URL
  if (fromEnv) return fromEnv

  const host = req.headers?.host
  const normalizedHost = Array.isArray(host) ? host[0] : host

  if (normalizedHost) {
    return `http://${normalizedHost}`
  }

  return 'http://localhost:5173'
}

function generateVerificationToken(): string {
  return `${crypto.randomUUID().replace(/-/g, '')}${Date.now().toString(36)}`
}

function verifyMailgunSignature(payload: MailgunWebhookPayload): boolean {
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY
  if (!signingKey) return true

  const timestamp = payload.signature?.timestamp
  const token = payload.signature?.token
  const providedSignature = payload.signature?.signature

  if (!timestamp || !token || !providedSignature) {
    return false
  }

  const expected = createHmac('sha256', signingKey).update(`${timestamp}${token}`).digest('hex')

  const expectedBuffer = Buffer.from(expected, 'utf8')
  const providedBuffer = Buffer.from(providedSignature, 'utf8')

  if (expectedBuffer.length !== providedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, providedBuffer)
}

async function handleSendEmail(req: MiddlewareRequest, res: MiddlewareResponse) {
  const payload = await parseJsonBody<EmailApiPayload>(req as NodeJS.ReadableStream)

  if (!payload.to?.email || !payload.subject || !payload.html) {
    json(res, 400, { error: 'Missing required fields: to.email, subject, html' })
    return
  }

  const result = await sendViaMailgun(payload)
  json(res, 200, { ok: true, messageId: result.messageId })
}

async function handleVerificationRequest(req: MiddlewareRequest, res: MiddlewareResponse) {
  const payload = await parseJsonBody<VerificationRequestPayload>(req as NodeJS.ReadableStream)
  const normalizedEmail = payload.email?.trim().toLowerCase()

  if (!normalizedEmail) {
    json(res, 400, { ok: false, error: 'Email is required.' })
    return
  }

  const token = generateVerificationToken()

  await prisma.subscriber.upsert({
    where: { email: normalizedEmail },
    update: {
      name: payload.name?.trim() || undefined,
      status: SubscriberStatus.PENDING,
      confirmToken: token,
      confirmedAt: null,
      unsubscribedAt: null,
    },
    create: {
      email: normalizedEmail,
      name: payload.name?.trim() || undefined,
      status: SubscriberStatus.PENDING,
      confirmToken: token,
      source: 'admin-email-sandbox',
    },
  })

  const baseUrl = resolveAppBaseUrl(req)
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(normalizedEmail)}`

  const result = await sendViaMailgun({
    to: {
      email: normalizedEmail,
      name: payload.name,
    },
    subject: 'Verify your email for fogserv.cloud',
    html: `<p>Hi ${payload.name?.trim() || 'there'},</p><p>Use this link to verify your account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    text: `Hi ${payload.name?.trim() || 'there'},\n\nUse this link to verify your account:\n${verifyUrl}`,
  })

  json(res, 200, {
    ok: true,
    messageId: result.messageId,
    verificationToken: process.env.NODE_ENV === 'production' ? undefined : token,
  })
}

async function handleVerificationConfirm(req: MiddlewareRequest, res: MiddlewareResponse) {
  const payload = await parseJsonBody<VerificationConfirmPayload>(req as NodeJS.ReadableStream)
  const token = payload.token?.trim()

  if (!token) {
    json(res, 400, { ok: false, error: 'Token is required.' })
    return
  }

  const subscriber = await prisma.subscriber.findFirst({
    where: { confirmToken: token },
  })

  if (!subscriber) {
    json(res, 404, { ok: false, error: 'Verification token not found.' })
    return
  }

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      status: SubscriberStatus.ACTIVE,
      confirmedAt: new Date(),
      confirmToken: null,
    },
  })

  json(res, 200, {
    ok: true,
    subscriberId: subscriber.id,
    email: subscriber.email,
  })
}

async function handleMailgunWebhook(req: MiddlewareRequest, res: MiddlewareResponse) {
  const payload = await parseWebhookBody(req)

  if (!verifyMailgunSignature(payload)) {
    json(res, 401, {
      ok: false,
      error: 'Invalid webhook signature.',
    })
    return
  }

  const eventData = payload['event-data']
  const eventType = eventData?.event || payload.event || 'unknown'
  const recipient = (eventData?.recipient || payload.recipient || '').trim().toLowerCase()

  if (!recipient) {
    json(res, 200, {
      ok: true,
      message: 'Webhook received without recipient; no subscriber mutation applied.',
      eventType,
    })
    return
  }

  const updateData: {
    status?: SubscriberStatus
    unsubscribedAt?: Date
    emailsSent?: { increment: number }
    emailsOpened?: { increment: number }
    linksClicked?: { increment: number }
    lastOpenedAt?: Date
    lastClickedAt?: Date
  } = {}

  if (eventType === 'accepted') {
    updateData.emailsSent = { increment: 1 }
  }

  if (eventType === 'opened') {
    updateData.emailsOpened = { increment: 1 }
    updateData.lastOpenedAt = new Date()
  }

  if (eventType === 'clicked') {
    updateData.linksClicked = { increment: 1 }
    updateData.lastClickedAt = new Date()
  }

  if (eventType === 'failed' || eventType === 'bounced') {
    updateData.status = SubscriberStatus.BOUNCED
  }

  if (eventType === 'complained') {
    updateData.status = SubscriberStatus.COMPLAINED
  }

  if (eventType === 'unsubscribed') {
    updateData.status = SubscriberStatus.UNSUBSCRIBED
    updateData.unsubscribedAt = new Date()
  }

  await prisma.subscriber.updateMany({
    where: { email: recipient },
    data: updateData,
  })

  json(res, 200, {
    ok: true,
    eventType,
    recipient,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────────────────────────────────────

const SCRYPT_KEYLEN = 64

async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scryptAsync(plain, salt, SCRYPT_KEYLEN)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const derivedKey = (await scryptAsync(plain, salt, SCRYPT_KEYLEN)) as Buffer
  const storedBuffer = Buffer.from(hash, 'hex')
  if (derivedKey.length !== storedBuffer.length) return false
  return tse(derivedKey, storedBuffer)
}

function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

function sessionExpiresAt(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 30) // 30-day sessions
  return d
}

async function getSessionUser(req: MiddlewareRequest) {
  const authHeader = getHeader(req, 'authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session) return null
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token } })
    return null
  }

  return session.user
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth route handlers
// ─────────────────────────────────────────────────────────────────────────────

type RegisterPayload = { email: string; name?: string; password: string }
type LoginPayload    = { email: string; password: string }

async function handleAuthRegister(req: MiddlewareRequest, res: MiddlewareResponse) {
  const payload = await parseJsonBody<RegisterPayload>(req as NodeJS.ReadableStream)
  const email   = payload.email?.trim().toLowerCase()
  const name    = payload.name?.trim() || undefined
  const password = payload.password

  if (!email || !password) {
    json(res, 400, { ok: false, error: 'Email and password are required.' })
    return
  }

  if (password.length < 8) {
    json(res, 400, { ok: false, error: 'Password must be at least 8 characters.' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    json(res, 409, { ok: false, error: 'An account with that email already exists.' })
    return
  }

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      status: UserStatus.PENDING_VERIFICATION,
    },
  })

  // Send verification email
  const token = generateVerificationToken()
  const baseUrl = resolveAppBaseUrl(req)
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}&type=account`

  // Store token on User record by reusing the subscriber verification mechanism –
  // store as a Subscriber row keyed to the same email so the existing confirm endpoint works.
  await prisma.subscriber.upsert({
    where: { email },
    update: {
      name,
      status: SubscriberStatus.PENDING,
      confirmToken: token,
      confirmedAt: null,
    },
    create: {
      email,
      name,
      status: SubscriberStatus.PENDING,
      confirmToken: token,
      source: 'registration',
    },
  })

  await sendViaMailgun({
    to: { email, name },
    subject: 'Verify your account – fogserv.cloud',
    html: `<p>Hi ${name ?? 'there'},</p><p>Please verify your account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    text:  `Hi ${name ?? 'there'},\n\nVerify your account:\n${verifyUrl}`,
  })

  json(res, 201, { ok: true, userId: user.id, email: user.email })
}

async function handleAuthLogin(req: MiddlewareRequest, res: MiddlewareResponse) {
  const payload = await parseJsonBody<LoginPayload>(req as NodeJS.ReadableStream)
  const email    = payload.email?.trim().toLowerCase()
  const password = payload.password

  if (!email || !password) {
    json(res, 400, { ok: false, error: 'Email and password are required.' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email } })

  // Use constant-time rejection to avoid user enumeration
  const dummyHash = 'aabbcc:' + 'a'.repeat(128)
  const storedHash = user?.passwordHash ?? dummyHash
  const passwordOk = await verifyPassword(password, storedHash)

  if (!user || !passwordOk) {
    json(res, 401, { ok: false, error: 'Invalid email or password.' })
    return
  }

  if (user.status === UserStatus.SUSPENDED) {
    json(res, 403, { ok: false, error: 'Your account has been suspended.' })
    return
  }

  const token = generateSessionToken()
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: sessionExpiresAt(),
    },
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  json(res, 200, {
    ok: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
    },
  })
}

async function handleAuthLogout(req: MiddlewareRequest, res: MiddlewareResponse) {
  const authHeader = getHeader(req, 'authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null

  if (!token) {
    json(res, 400, { ok: false, error: 'No session token provided.' })
    return
  }

  await prisma.session.deleteMany({ where: { token } })
  json(res, 200, { ok: true })
}

async function handleAuthMe(req: MiddlewareRequest, res: MiddlewareResponse) {
  const user = await getSessionUser(req)

  if (!user) {
    json(res, 401, { ok: false, error: 'Not authenticated.' })
    return
  }

  json(res, 200, {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      bio: user.bio,
      website: user.website,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// CMS route handlers
// ─────────────────────────────────────────────────────────────────────────────

type CreatePostPayload = {
  title: string
  slug?: string
  excerpt?: string
  content?: string
  status?: PostStatus
  tags?: string[]
}

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

async function ensureUniquePostSlug(baseSlug: string): Promise<string> {
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const exists = await prisma.post.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!exists) return candidate
    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

async function handleCreatePost(req: MiddlewareRequest, res: MiddlewareResponse) {
  const user = await getSessionUser(req)

  if (!user) {
    json(res, 401, { ok: false, error: 'Not authenticated.' })
    return
  }

  if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.INACTIVE) {
    json(res, 403, { ok: false, error: 'Your account cannot create posts.' })
    return
  }

  const payload = await parseJsonBody<CreatePostPayload>(req as NodeJS.ReadableStream)
  const title = payload.title?.trim()
  const excerpt = payload.excerpt?.trim() || null
  const content = payload.content?.trim() || '<p></p>'
  const requestedStatus = payload.status ?? PostStatus.DRAFT

  if (!title) {
    json(res, 400, { ok: false, error: 'Title is required.' })
    return
  }

  const normalizedBaseSlug = toSlug(payload.slug?.trim() || title)
  if (!normalizedBaseSlug) {
    json(res, 400, { ok: false, error: 'Invalid slug.' })
    return
  }

  const slug = await ensureUniquePostSlug(normalizedBaseSlug)
  const safeTagNames = (payload.tags ?? [])
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 20)

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      excerpt,
      content,
      status: requestedStatus,
      publishedAt: requestedStatus === PostStatus.PUBLISHED ? new Date() : null,
      authorId: user.id,
    },
  })

  if (safeTagNames.length > 0) {
    const tags = await Promise.all(
      safeTagNames.map(async (name) => {
        const tagSlug = toSlug(name)
        const found = await prisma.tag.findUnique({ where: { slug: tagSlug } })
        if (found) return found
        return prisma.tag.create({
          data: {
            name,
            slug: tagSlug,
          },
        })
      })
    )

    await prisma.postTag.createMany({
      data: tags.map((tag) => ({ postId: post.id, tagId: tag.id })),
      skipDuplicates: true,
    })
  }

  json(res, 201, {
    ok: true,
    post: {
      id: post.id,
      slug: post.slug,
      status: post.status,
      title: post.title,
    },
  })
}

async function handleListPosts(req: MiddlewareRequest, res: MiddlewareResponse) {
  const includeDrafts = (new URL(req.url || '/', 'http://localhost')).searchParams.get('all') === '1'

  const where = includeDrafts ? {} : { status: PostStatus.PUBLISHED }
  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      author: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
    },
  })

  json(res, 200, {
    ok: true,
    posts: posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      status: post.status,
      createdAt: post.createdAt,
      publishedAt: post.publishedAt,
      author: post.author,
      tags: post.tags.map((pt) => ({ id: pt.tag.id, name: pt.tag.name, slug: pt.tag.slug })),
    })),
  })
}
type UpdatePostPayload = {
  title?: string
  slug?: string
  excerpt?: string
  content?: string
  status?: PostStatus
  tags?: string[]
}

async function handleUpdatePost(req: MiddlewareRequest, res: MiddlewareResponse) {
  const user = await getSessionUser(req)

  if (!user) {
    json(res, 401, { ok: false, error: 'Not authenticated.' })
    return
  }

  // Parse :id from path
  const pathParts = (req.url || '').split('?')[0].split('/')
  const postId = pathParts[pathParts.length - 1]

  if (!postId || postId === 'posts') {
    json(res, 400, { ok: false, error: 'Post ID is required.' })
    return
  }

  const existing = await prisma.post.findUnique({ where: { id: postId } })
  if (!existing) {
    json(res, 404, { ok: false, error: 'Post not found.' })
    return
  }

  // Only author or ADMIN/OWNER can edit
  if (existing.authorId !== user.id && !['ADMIN', 'OWNER'].includes(user.role)) {
    json(res, 403, { ok: false, error: 'You do not have permission to edit this post.' })
    return
  }

  const payload = await parseJsonBody<UpdatePostPayload>(req as NodeJS.ReadableStream)
  const title = payload.title !== undefined ? payload.title.trim() : undefined
  const excerpt = payload.excerpt !== undefined ? payload.excerpt.trim() || null : undefined
  const content = payload.content !== undefined ? payload.content.trim() : undefined

  if (title !== undefined && !title) {
    json(res, 400, { ok: false, error: 'Title cannot be empty.' })
    return
  }

  // Handle slug change
  let slug = existing.slug
  if (payload.slug !== undefined) {
    const newSlug = toSlug(payload.slug.trim())
    if (!newSlug) {
      json(res, 400, { ok: false, error: 'Invalid slug.' })
      return
    }
    slug = await ensureUniquePostSlug(newSlug)
  }

  const updateData: {
    title?: string
    slug?: string
    excerpt?: string | null
    content?: string
    status?: PostStatus
    publishedAt?: Date | null
    tags?: { deleteMany: {}; createMany: { data: { postId: string; tagId: string }[]; skipDuplicates: true } }
  } = { slug }

  if (title !== undefined) updateData.title = title
  if (excerpt !== undefined) updateData.excerpt = excerpt
  if (content !== undefined) updateData.content = content

  if (payload.status) {
    updateData.status = payload.status
    if (payload.status === PostStatus.PUBLISHED && existing.status !== PostStatus.PUBLISHED) {
      updateData.publishedAt = new Date()
    }
  }

  // Handle tags replacement
  if (payload.tags !== undefined) {
    const safeTagNames = payload.tags.map((name) => name.trim()).filter(Boolean).slice(0, 20)
    const tags = await Promise.all(
      safeTagNames.map(async (name) => {
        const tagSlug = toSlug(name)
        const found = await prisma.tag.findUnique({ where: { slug: tagSlug } })
        if (found) return found
        return prisma.tag.create({ data: { name, slug: tagSlug } })
      })
    )

    updateData.tags = {
      deleteMany: { postId },
      createMany: { data: tags.map((tag) => ({ postId, tagId: tag.id })), skipDuplicates: true },
    }
  }

  const post = await prisma.post.update({ where: { id: postId }, data: updateData, include: { tags: { include: { tag: true } } } })

  json(res, 200, {
    ok: true,
    post: { id: post.id, slug: post.slug, status: post.status, title: post.title },
  })
}

async function handleDeletePost(req: MiddlewareRequest, res: MiddlewareResponse) {
  const user = await getSessionUser(req)

  if (!user) {
    json(res, 401, { ok: false, error: 'Not authenticated.' })
    return
  }

  const pathParts = (req.url || '').split('?')[0].split('/')
  const postId = pathParts[pathParts.length - 1]

  if (!postId || postId === 'posts') {
    json(res, 400, { ok: false, error: 'Post ID is required.' })
    return
  }

  const existing = await prisma.post.findUnique({ where: { id: postId } })
  if (!existing) {
    json(res, 404, { ok: false, error: 'Post not found.' })
    return
  }

  // Only author or ADMIN/OWNER can delete
  if (existing.authorId !== user.id && !['ADMIN', 'OWNER'].includes(user.role)) {
    json(res, 403, { ok: false, error: 'You do not have permission to delete this post.' })
    return
  }

  await prisma.post.delete({ where: { id: postId } })
  json(res, 200, { ok: true })
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined route handler (email + auth)
// ─────────────────────────────────────────────────────────────────────────────

async function emailRouteHandler(req: MiddlewareRequest, res: MiddlewareResponse, next: MiddlewareNext) {
  const path = (req.url || '').split('?')[0]

  try {
    if (path === '/api/email/send' && req.method === 'POST') {
      await handleSendEmail(req, res)
      return
    }

    if (path === '/api/email/verification/request' && req.method === 'POST') {
      await handleVerificationRequest(req, res)
      return
    }

    if (path === '/api/email/verification/confirm' && req.method === 'POST') {
      await handleVerificationConfirm(req, res)
      return
    }

    if (path === '/api/email/webhooks/mailgun' && req.method === 'POST') {
      await handleMailgunWebhook(req, res)
      return
    }

    if (path === '/api/auth/register' && req.method === 'POST') {
      await handleAuthRegister(req, res)
      return
    }

    if (path === '/api/auth/login' && req.method === 'POST') {
      await handleAuthLogin(req, res)
      return
    }

    if (path === '/api/auth/logout' && req.method === 'POST') {
      await handleAuthLogout(req, res)
      return
    }

    if (path === '/api/auth/me' && req.method === 'GET') {
      await handleAuthMe(req, res)
      return
    }

    if (path === '/api/posts' && req.method === 'POST') {
      await handleCreatePost(req, res)
      return
    }

    if (path === '/api/posts' && req.method === 'GET') {
      await handleListPosts(req, res)
      return
    }

    // Handle /api/posts/:id for PUT and DELETE
    if (path.startsWith('/api/posts/') && req.method === 'PUT') {
      await handleUpdatePost(req, res)
      return
    }

    if (path.startsWith('/api/posts/') && req.method === 'DELETE') {
      await handleDeletePost(req, res)
      return
    }

    next()
  } catch (error) {
    json(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Email endpoint failed',
    })
  }
}

function emailApiMiddleware() {
  return {
    name: 'email-api-middleware',
    configureServer(server: {
      middlewares: {
        use: (handler: (req: MiddlewareRequest, res: MiddlewareResponse, next: MiddlewareNext) => void | Promise<void>) => void
      }
    }) {
      server.middlewares.use(emailRouteHandler)
    },
    configurePreviewServer(server: {
      middlewares: {
        use: (handler: (req: MiddlewareRequest, res: MiddlewareResponse, next: MiddlewareNext) => void | Promise<void>) => void
      }
    }) {
      server.middlewares.use(emailRouteHandler)
    },
  }
}

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), emailApiMiddleware()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
