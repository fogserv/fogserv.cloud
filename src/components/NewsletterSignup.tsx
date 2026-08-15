import React from 'react'
import { emailService } from '../services/emailService'
type SignupState = 'idle' | 'loading' | 'sent' | 'error'
export function NewsletterSignupCard({ compact = false }: { compact?: boolean }) {
 const [email, setEmail] = React.useState('')
 const [name, setName] = React.useState('')
 const [state, setState] = React.useState<SignupState>('idle')
 const [errorMsg, setErrorMsg] = React.useState('')
 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!email.trim()) return
 setState('loading')
 setErrorMsg('')
 try {
 const res = await emailService.requestVerification({ email: email.trim(), name: name.trim() || undefined })
 if (res.ok) {
 setState('sent')
 } else {
 setErrorMsg(res.error ?? 'Something went wrong. Please try again.')
 setState('error')
 }
 } catch {
 setErrorMsg('Network error. Please try again.')
 setState('error')
 }
 }
 if (state === 'sent') {
 return (
 <div className={`${compact ? '' : 'bg-secondary/50 border border-border rounded-lg p-8'}`}>
 <div className="text-center py-4">
 <div className="text-3xl mb-3">✉️</div>
 <h3 className="text-foreground font-semibold text-lg mb-2">Check your inbox!</h3>
 <p className="text-muted-foreground text-sm">
 We sent a confirmation link to <span className="text-muted-foreground font-medium">{email}</span>.
 Click the link to complete your subscription.
 </p>
 </div>
 </div>
 )
 }
 return (
 <div className={`${compact ? '' : 'bg-secondary/50 border border-border rounded-lg p-8'}`}>
 {!compact && (
 <>
 <h2 className="text-2xl font-bold text-foreground mb-2">Stay in the Loop</h2>
 <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
 Get updates on self-hosted infrastructure, agentic workflows, and the journey of fogserv.cloud.
 No spam. Unsubscribe anytime.
 </p>
 </>
 )}
 <form onSubmit={handleSubmit} noValidate className="space-y-3">
 {!compact && (
 <input
 type="text"
 placeholder="Your name (optional)"
 value={name}
 onChange={(e) => setName(e.target.value)}
 disabled={state === 'loading'}
 className="w-full bg-background/80 border border-border text-foreground placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-border disabled:opacity-50"
 />
 )}
 <div className={`${compact ? 'flex gap-2' : ''}`}>
 <input
 type="email"
 placeholder="your@email.com"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 disabled={state === 'loading'}
 className={`${compact ? 'flex-1' : 'w-full'} bg-background/80 border border-border text-foreground placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-border disabled:opacity-50`}
 />
 <button
 type="submit"
 disabled={state === 'loading' || !email.trim()}
 className={`${compact ? '' : 'w-full mt-1'} bg-background hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed text-foreground font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors`}
 >
 {state === 'loading' ? 'Sending…' : 'Subscribe'}
 </button>
 </div>
 {state === 'error' && (
 <p className="text-red-400 text-xs mt-1">{errorMsg}</p>
 )}
 <p className="text-primary text-xs">
 By subscribing you agree to receive emails from fogserv.cloud.
 We will never share your address. One-click unsubscribe in every email.
 </p>
 </form>
 </div>
 )
}
