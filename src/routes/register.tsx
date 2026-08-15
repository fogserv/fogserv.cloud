import React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '../hooks/useAuth'

function RegisterPage() {
 const { register: registerUser, login } = useAuth()
 const [name, setName] = React.useState('')
 const [email, setEmail] = React.useState('')
 const [password, setPassword] = React.useState('')
 const [confirm, setConfirm] = React.useState('')
 const [state, setState] = React.useState<'idle' | 'loading' | 'done' | 'error'>('idle')
 const [error, setError] = React.useState('')

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!email.trim() || !password) return
 if (password !== confirm) { setError('Passwords do not match.'); return }
 if (password.length < 8) { setError('Password must be at least 8 characters.'); return }

 setState('loading')
 setError('')

 const res = await registerUser(email, password, name.trim() || undefined)
 if (!res.ok) {
 setError(res.error ?? 'Registration failed.')
 setState('error')
 return
 }

 // Auto-login after successful registration
 const loginRes = await login(email, password)
 setState(loginRes.ok ? 'done' : 'done') // either way show success; login state handles redirect
 }

 if (state === 'done') {
 return (
 <div className="bg-background min-h-[70vh] flex items-center">
 <div className="max-w-md w-full mx-auto px-4 py-16">
 <h1 className="text-3xl font-bold text-foreground mb-8 text-center">Account Created!</h1>
 <div className="text-center">
 <div className="text-4xl mb-4">🎉</div>
 <p className="text-muted-foreground mb-2">Your account has been created.</p>
 <p className="text-primary text-sm mb-6">Check your inbox to verify your email address.</p>
 <Link to="/profile" className="bg-background hover:bg-background text-foreground px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors">
 Go to Profile
 </Link>
 </div>
 </div>
 </div>
 )
 }

 return (
 <div className="bg-background min-h-[70vh] flex items-center">
 <div className="max-w-md w-full mx-auto px-4 py-16">
 <h1 className="text-3xl font-bold text-foreground mb-8 text-center">Create Account</h1>
 <form onSubmit={handleSubmit} noValidate className="space-y-4">
 <div>
 <label className="block text-sm text-muted-foreground mb-1">Name (optional)</label>
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 disabled={state === 'loading'}
 className="w-full bg-secondary border border-border text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-border disabled:opacity-50"
 />
 </div>
 <div>
 <label className="block text-sm text-muted-foreground mb-1">Email</label>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 disabled={state === 'loading'}
 className="w-full bg-secondary border border-border text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-border disabled:opacity-50"
 />
 </div>
 <div>
 <label className="block text-sm text-muted-foreground mb-1">Password <span className="text-primary">(8+ chars)</span></label>
 <input
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 disabled={state === 'loading'}
 className="w-full bg-secondary border border-border text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-border disabled:opacity-50"
 />
 </div>
 <div>
 <label className="block text-sm text-muted-foreground mb-1">Confirm Password</label>
 <input
 type="password"
 value={confirm}
 onChange={(e) => setConfirm(e.target.value)}
 required
 disabled={state === 'loading'}
 className="w-full bg-secondary border border-border text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-border disabled:opacity-50"
 />
 </div>
 {error && <p className="text-red-400 text-sm">{error}</p>}
 <button
 type="submit"
 disabled={state === 'loading' || !email.trim() || !password || !confirm}
 className="w-full bg-background hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed text-foreground font-semibold py-2.5 rounded-lg text-sm transition-colors"
 >
 {state === 'loading' ? 'Creating account…' : 'Create Account'}
 </button>
 <p className="text-center text-primary text-sm">
 Already have an account?{' '}
 <Link to="/login" className="text-muted-foreground hover:text-muted-foreground">
 Sign in
 </Link>
 </p>
 </form>
 </div>
 </div>
 )
}

export const Route = createFileRoute('/register')({
 component: RegisterPage,
})

export default { component: RegisterPage }
