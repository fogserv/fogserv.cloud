import React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { emailService } from '../services/emailService'

function VerifyEmailPage() {
 const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading')
 const [message, setMessage] = React.useState('')

 React.useEffect(() => {
 const params = new URLSearchParams(window.location.search)
 const token = params.get('token')
 const email = params.get('email')

 if (!token || !email) {
 setStatus('error')
 setMessage('Invalid confirmation link. Please try subscribing again.')
 return
 }

 emailService
 .confirmVerification({ token, email })
 .then((res) => {
 if (res.ok) {
 setStatus('success')
 setMessage('You are now subscribed. Welcome aboard!')
 } else {
 setStatus('error')
 setMessage(res.error ?? 'Confirmation failed. The link may have expired.')
 }
 })
 .catch(() => {
 setStatus('error')
 setMessage('Network error. Please try again or contact support.')
 })
 }, [])

 return (
 <div className="bg-background min-h-[60vh] flex items-center">
 <div className="max-w-lg mx-auto px-4 py-20 text-center">
 {status === 'loading' && (
 <>
 <div className="text-4xl mb-4 animate-pulse">📬</div>
 <h1 className="text-2xl font-bold text-foreground mb-3">Confirming your subscription…</h1>
 <p className="text-muted-foreground">Just a moment.</p>
 </>
 )}
 {status === 'success' && (
 <>
 <div className="text-4xl mb-4">🎉</div>
 <h1 className="text-2xl font-bold text-foreground mb-3">You're subscribed!</h1>
 <p className="text-muted-foreground mb-6">{message}</p>
 <Link to="/" className="bg-background hover:bg-background text-foreground px-6 py-3 rounded-lg font-semibold transition-colors text-sm">
 Back to Home
 </Link>
 </>
 )}
 {status === 'error' && (
 <>
 <div className="text-4xl mb-4">⚠️</div>
 <h1 className="text-2xl font-bold text-foreground mb-3">Something went wrong</h1>
 <p className="text-muted-foreground mb-6">{message}</p>
 <Link to="/" className="bg-secondary hover:bg-background text-foreground px-6 py-3 rounded-lg font-semibold transition-colors text-sm">
 Back to Home
 </Link>
 </>
 )}
 </div>
 </div>
 )
}

export const Route = createFileRoute('/verify-email')({
 component: VerifyEmailPage,
})

export default { component: VerifyEmailPage }
