import React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '../hooks/useAuth'

function ProfilePage() {
 const { auth, logout } = useAuth()
 const [loggingOut, setLoggingOut] = React.useState(false)

 if (auth.loading) {
 return (
 <div className="bg-background min-h-[60vh] flex items-center justify-center">
 <p className="text-muted-foreground">Loading…</p>
 </div>
 )
 }

 if (!auth.user) {
 return (
 <div className="bg-background min-h-[70vh] flex items-center">
 <div className="max-w-md w-full mx-auto px-4 py-16">
 <h1 className="text-3xl font-bold text-foreground mb-8 text-center">Sign in required</h1>
 <p className="text-muted-foreground text-center mb-6">You need to be signed in to view your profile.</p>
 <div className="text-center">
 <Link to="/login" className="bg-background hover:bg-background text-foreground px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors">
 Sign In
 </Link>
 </div>
 </div>
 </div>
 )
 }

 const u = auth.user

 const handleLogout = async () => {
 setLoggingOut(true)
 await logout()
 }

 return (
 <div className="bg-background py-16">
 <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-start justify-between mb-8">
 <div>
 <h1 className="text-3xl font-bold text-foreground mb-1">{u.name ?? u.email}</h1>
 <p className="text-muted-foreground text-sm">{u.email}</p>
 </div>
 {u.avatar && (
 <img src={u.avatar} alt="Avatar" className="w-16 h-16 rounded-full border border-border object-cover" />
 )}
 </div>

 <div className="bg-secondary/50 border border-border rounded-lg divide-y divide-slate-700">
 <div className="flex justify-between px-6 py-4">
 <span className="text-muted-foreground text-sm">Role</span>
 <span className="text-foreground text-sm font-medium capitalize">{u.role.toLowerCase()}</span>
 </div>
 <div className="flex justify-between px-6 py-4">
 <span className="text-muted-foreground text-sm">Status</span>
 <span className={`text-sm font-medium ${u.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}`}>
 {u.status.replace(/_/g, ' ')}
 </span>
 </div>
 <div className="flex justify-between px-6 py-4">
 <span className="text-muted-foreground text-sm">Email verified</span>
 <span className={`text-sm font-medium ${u.emailVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
 {u.emailVerified ? new Date(u.emailVerified).toLocaleDateString() : 'Not yet verified'}
 </span>
 </div>
 {u.bio && (
 <div className="px-6 py-4">
 <span className="text-muted-foreground text-sm block mb-1">Bio</span>
 <p className="text-foreground text-sm">{u.bio}</p>
 </div>
 )}
 {u.website && (
 <div className="flex justify-between px-6 py-4">
 <span className="text-muted-foreground text-sm">Website</span>
 <a href={u.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground text-sm hover:text-muted-foreground">
 {u.website}
 </a>
 </div>
 )}
 {u.createdAt && (
 <div className="flex justify-between px-6 py-4">
 <span className="text-muted-foreground text-sm">Member since</span>
 <span className="text-foreground text-sm">{new Date(u.createdAt).toLocaleDateString()}</span>
 </div>
 )}
 </div>

 <div className="mt-6">
 <button
 onClick={handleLogout}
 disabled={loggingOut}
 className="bg-secondary hover:bg-background disabled:opacity-50 text-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
 >
 {loggingOut ? 'Signing out…' : 'Sign Out'}
 </button>
 </div>
 </div>
 </div>
 )
}

export const Route = createFileRoute('/profile')({
 component: ProfilePage,
})

export default { component: ProfilePage }
