import React from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Auth service (thin wrapper around /api/auth/* endpoints)
// ─────────────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  avatar: string | null
  bio?: string | null
  website?: string | null
  emailVerified?: string | null
  createdAt?: string
}

type AuthState = {
  user: AuthUser | null
  token: string | null
  loading: boolean
}

type LoginResult = { ok: boolean; error?: string }
type RegisterResult = { ok: boolean; error?: string }

const SESSION_KEY = 'fogserv_session_token'

async function apiPost<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) })
  return (await res.json()) as T
}

async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(path, { headers })
  return (await res.json()) as T
}

const authService = {
  async register(email: string, password: string, name?: string) {
    return apiPost<{ ok: boolean; userId?: string; email?: string; error?: string }>(
      '/api/auth/register', { email, password, name }
    )
  },
  async login(email: string, password: string) {
    return apiPost<{ ok: boolean; token?: string; user?: AuthUser; error?: string }>(
      '/api/auth/login', { email, password }
    )
  },
  async logout(token: string) {
    return apiPost<{ ok: boolean }>('/api/auth/logout', {}, token)
  },
  async me(token: string) {
    return apiGet<{ ok: boolean; user?: AuthUser; error?: string }>('/api/auth/me', token)
  },
}

// Auth context
export const AuthContext = React.createContext<{
  auth: AuthState
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<RegisterResult>
}>({
  auth: { user: null, token: null, loading: true },
  login: async () => ({ ok: false }),
  logout: async () => {},
  register: async () => ({ ok: false }),
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = React.useState<AuthState>({ user: null, token: null, loading: true })

  React.useEffect(() => {
    const token = localStorage.getItem(SESSION_KEY)
    if (!token) { setAuth({ user: null, token: null, loading: false }); return }

    authService.me(token).then((res) => {
      if (res.ok && res.user) {
        setAuth({ user: res.user, token, loading: false })
      } else {
        localStorage.removeItem(SESSION_KEY)
        setAuth({ user: null, token: null, loading: false })
      }
    }).catch(() => {
      setAuth({ user: null, token: null, loading: false })
    })
  }, [])

  const login = React.useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password)
    if (res.ok && res.token && res.user) {
      localStorage.setItem(SESSION_KEY, res.token)
      setAuth({ user: res.user, token: res.token, loading: false })
      return { ok: true }
    }
    return { ok: false, error: res.error ?? 'Login failed.' }
  }, [])

  const logout = React.useCallback(async () => {
    const token = auth.token
    setAuth({ user: null, token: null, loading: false })
    localStorage.removeItem(SESSION_KEY)
    if (token) await authService.logout(token).catch(() => {})
  }, [auth.token])

  const register = React.useCallback(async (email: string, password: string, name?: string) => {
    const res = await authService.register(email, password, name)
    if (res.ok) return { ok: true }
    return { ok: false, error: res.error ?? 'Registration failed.' }
  }, [])

  return (
    <AuthContext.Provider value={{ auth, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return React.useContext(AuthContext)
}
