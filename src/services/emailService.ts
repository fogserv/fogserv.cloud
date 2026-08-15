type EmailTemplateKey = 'verification' | 'welcome' | 'newsletter'

type TemplateVariables = Record<string, string>

type EmailRecipient = {
  email: string
  name?: string
}

type TransactionalEmailInput = {
  to: EmailRecipient
  template: EmailTemplateKey
  variables: TemplateVariables
}

type CustomEmailInput = {
  to: EmailRecipient
  subject: string
  html: string
  text?: string
}

type OutboundEmailPayload = {
  to: EmailRecipient
  subject: string
  html: string
  text: string
  template?: EmailTemplateKey
}

type EmailSendResult = {
  ok: boolean
  messageId?: string
  provider: 'api' | 'console'
  error?: string
}

type EmailProviderMode = 'api' | 'console'

type EmailServiceConfig = {
  provider?: EmailProviderMode
  apiBaseUrl?: string
}

type VerificationRequestInput = {
  email: string
  name?: string
}

type VerificationRequestResult = {
  ok: boolean
  messageId?: string
  verificationToken?: string
  error?: string
}

type VerificationConfirmResult = {
  ok: boolean
  subscriberId?: string
  email?: string
  error?: string
}

type EmailGateway = {
  send(payload: OutboundEmailPayload): Promise<EmailSendResult>
}

class EmailServiceError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'EmailServiceError'
    this.status = status
  }
}

const templateCatalog: Record<
  EmailTemplateKey,
  {
    subject: string
    html: string
    text: string
  }
> = {
  verification: {
    subject: 'Verify your email for fogserv.cloud',
    html: '<p>Hi {{name}},</p><p>Use this link to verify your account:</p><p><a href="{{verifyUrl}}">{{verifyUrl}}</a></p>',
    text: 'Hi {{name}},\n\nUse this link to verify your account:\n{{verifyUrl}}',
  },
  welcome: {
    subject: 'Welcome to fogserv.cloud',
    html: '<p>Hi {{name}},</p><p>Welcome aboard. You are now subscribed to updates from fogserv.cloud.</p>',
    text: 'Hi {{name}},\n\nWelcome aboard. You are now subscribed to updates from fogserv.cloud.',
  },
  newsletter: {
    subject: 'Your latest update from fogserv.cloud',
    html: '<p>Hi {{name}},</p><p>{{body}}</p>',
    text: 'Hi {{name}},\n\n{{body}}',
  },
}

function applyVariables(template: string, variables: TemplateVariables): string {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key: string) => {
    return variables[key] ?? ''
  })
}

function renderTemplate(input: TransactionalEmailInput): OutboundEmailPayload {
  const base = templateCatalog[input.template]
  const mergedVariables = {
    name: input.to.name ?? 'there',
    ...input.variables,
  }

  return {
    to: input.to,
    template: input.template,
    subject: applyVariables(base.subject, mergedVariables),
    html: applyVariables(base.html, mergedVariables),
    text: applyVariables(base.text, mergedVariables),
  }
}

function normalizeApiBaseUrl(value: string | undefined): string {
  if (!value) return '/api'
  if (value.endsWith('/')) return value.slice(0, -1)
  return value
}

async function postJson<TResponse>(url: string, payload: unknown): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new EmailServiceError(body || 'Email API request failed', response.status)
  }

  return (await response.json()) as TResponse
}

class ApiEmailGateway implements EmailGateway {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = normalizeApiBaseUrl(baseUrl)
  }

  async send(payload: OutboundEmailPayload): Promise<EmailSendResult> {
    const response = await fetch(`${this.baseUrl}/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new EmailServiceError(body || 'Email API request failed', response.status)
    }

    const data = (await response.json()) as { messageId?: string }

    return {
      ok: true,
      messageId: data.messageId,
      provider: 'api',
    }
  }
}

class ConsoleEmailGateway implements EmailGateway {
  async send(payload: OutboundEmailPayload): Promise<EmailSendResult> {
    // Console provider keeps local development safe before Mailgun credentials are configured.
    console.info('[email:console-provider] queued', payload)

    return {
      ok: true,
      messageId: `local-${Date.now()}`,
      provider: 'console',
    }
  }
}

function resolveProviderMode(value: string | undefined): EmailProviderMode {
  if (value === 'api') return 'api'
  return 'console'
}

function createGateway(config?: EmailServiceConfig): EmailGateway {
  const provider = config?.provider ?? resolveProviderMode(import.meta.env.VITE_EMAIL_PROVIDER)

  if (provider === 'api') {
    const baseUrl = config?.apiBaseUrl || import.meta.env.VITE_EMAIL_API_BASE_URL || '/api'
    return new ApiEmailGateway(baseUrl)
  }

  return new ConsoleEmailGateway()
}

export type EmailService = {
  sendTransactional(input: TransactionalEmailInput): Promise<EmailSendResult>
  sendCustom(input: CustomEmailInput): Promise<EmailSendResult>
  requestVerification(input: VerificationRequestInput): Promise<VerificationRequestResult>
  confirmVerification(input: { token: string; email: string }): Promise<VerificationConfirmResult>
}

export function createEmailService(config?: EmailServiceConfig): EmailService {
  const gateway = createGateway(config)
  const apiBaseUrl = normalizeApiBaseUrl(config?.apiBaseUrl ?? import.meta.env.VITE_EMAIL_API_BASE_URL)

  return {
    async sendTransactional(input: TransactionalEmailInput) {
      const payload = renderTemplate(input)
      return gateway.send(payload)
    },

    async sendCustom(input: CustomEmailInput) {
      return gateway.send({
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text ?? input.subject,
      })
    },

    async requestVerification(input: VerificationRequestInput) {
      return postJson<VerificationRequestResult>(`${apiBaseUrl}/email/verification/request`, {
        email: input.email,
        name: input.name,
      })
    },

    async confirmVerification(input: { token: string; email: string }) {
      return postJson<VerificationConfirmResult>(`${apiBaseUrl}/email/verification/confirm`, {
        token: input.token,
        email: input.email,
      })
    },
  }
}

export const emailService = createEmailService()
