import React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '../hooks/useAuth'

function LoginPage() {
 const { login, auth } = useAuth()
 const [email, setEmail] = React.useState('')
 const [password, setPassword] = React.useState('')
 const [error, setError] = React.useState('')
 const [loading, setLoading] = React.useState(false)

 if (auth.user) {
 return (
 <div className="bg-background min-h-[70vh] flex items-center">
 <div className="max-w-md w-full mx-auto px-4 py-16">
 <h1 className="text-3xl font-bold text-foreground mb-8 text-center">Already signed in</h1>
 <p className="text-muted-foreground text-center mb-6">You are signed in as <span className="text-muted-foreground">{auth.user.email}</span>.</p>
 <div className="text-center">
 <Link to="/profile" className="bg-background hover:bg-background text-foreground px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors">
 View Profile
 </Link>
 </div>
 </div>
 </div>
 )
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!email.trim() || !password) return
 setLoading(true)
 setError('')
 const res = await login(email, password)
 setLoading(false)
 if (!res.ok) setError(res.error ?? 'Login failed.')
 }

 return (
 <div className="bg-background min-h-[70vh] flex items-center">
 <div className="max-w-md w-full mx-auto px-4 py-16">
 <h1 className="text-3xl font-bold text-foreground mb-8 text-center">Sign In</h1>
 <form onSubmit={handleSubmit} noValidate className="space-y-4">
 <div>
 <label className="block text-sm text-muted-foreground mb-1">Email</label>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 disabled={loading}
 className="w-full bg-secondary border border-border text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-border disabled:opacity-50"
 />
 </div>
 <div>
 <label className="block text-sm text-muted-foreground mb-1">Password</label>
 <input
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 disabled={loading}
 className="w-full bg-secondary border border-border text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-border disabled:opacity-50"
 />
 </div>
 {error && <p className="text-red-400 text-sm">{error}</p>}
 <button
 type="submit"
 disabled={loading || !email.trim() || !password}
 className="w-full bg-background hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed text-foreground font-semibold py-2.5 rounded-lg text-sm transition-colors"
 >
 {loading ? 'Signing in…' : 'Sign In'}
 </button>
 <p className="text-center text-primary text-sm">
 No account?{' '}
 <Link to="/register" className="text-muted-foreground hover:text-muted-foreground">
 Create one
 </Link>
 </p>
 </form>
 </div>
 </div>
 )
}

export const Route = createFileRoute('/login')({
 component: LoginPage,
})

export default { component: LoginPage }
