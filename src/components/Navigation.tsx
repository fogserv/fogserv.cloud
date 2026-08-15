import React from 'react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '../hooks/useAuth'

export function Navigation() {
 const { auth, logout } = useAuth()
 const [loggingOut, setLoggingOut] = React.useState(false)
 const [appsOpen, setAppsOpen] = React.useState(false)

 const handleLogout = async (e: React.MouseEvent) => {
 e.preventDefault()
 setLoggingOut(true)
 await logout()
 setLoggingOut(false)
 }

 const isLoggedIn = !auth.loading && auth.user !== null

 return (
 <nav className="bg-secondary/90 backdrop-blur border-b border-border">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16">
 <Link to="/" className="text-xl font-bold text-foreground hover:text-muted-foreground transition-colors">
 fogserv.cloud
 </Link>
 <div className="flex items-center gap-6">
 <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>

 {/* Apps Section */}
 <div className="relative">
 <button
 onClick={() => setAppsOpen(!appsOpen)}
 onMouseEnter={() => setAppsOpen(true)}
 className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
 >
 Apps
 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200" style={{ transform: appsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
 <polyline points="6 9 12 15 18 9"></polyline>
 </svg>
 </button>
 {appsOpen && (
 <div
 className="absolute top-full left-0 mt-1 w-48 bg-secondary border border-border rounded-lg shadow-xl z-50"
 onMouseLeave={() => setAppsOpen(false)}
 >
 <a
 href="/apps/vault.html"
 target="_blank"
 rel="noopener noreferrer"
 className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
 >
 <div className="flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
 <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
 </svg>
 Vault
 </div>
 </a>
 <a
 href="https://dia.ai-prompts.help/"
 target="_blank"
 rel="noopener noreferrer"
 className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
 >
 <div className="flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
 </svg>
 Dia
 </div>
 </a>
 <a
 href="https://ai-prompts.help/"
 target="_blank"
 rel="noopener noreferrer"
 className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
 >
 <div className="flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
 </svg>
 Prompts
 </div>
 </a>
 <a
 href="https://self-help.dev/"
 target="_blank"
 rel="noopener noreferrer"
 className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
 >
 <div className="flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
 </svg>
 Self-Help
 </div>
 </a>
 <a
 href="https://self-hosted.info/"
 target="_blank"
 rel="noopener noreferrer"
 className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
 >
 <div className="flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
 <line x1="8" y1="21" x2="16" y2="21"></line>
 <line x1="12" y1="17" x2="12" y2="21"></line>
 </svg>
 Homelab
 </div>
 </a>
 <a
 href="https://qr.self-hosted.info/"
 target="_blank"
 rel="noopener noreferrer"
 className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
 >
 <div className="flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <rect x="3" y="3" width="7" height="7"></rect>
 <rect x="14" y="3" width="7" height="7"></rect>
 <rect x="14" y="14" width="7" height="7"></rect>
 <rect x="3" y="14" width="7" height="7"></rect>
 </svg>
 QR Generator
 </div>
 </a>
 <a
 href="https://learnwithme.app/"
 target="_blank"
 rel="noopener noreferrer"
 className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
 >
 <div className="flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
 <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
 </svg>
 Kids Learning
 </div>
 </a>
 </div>
 )}
 </div>
 <Link to="/changelog" className="text-muted-foreground hover:text-foreground transition-colors">Updates</Link>
 <Link to="/kb" className="text-muted-foreground hover:text-foreground transition-colors">KB</Link>
 </div>
 </div>
 </div>
 </nav>
 )
}
