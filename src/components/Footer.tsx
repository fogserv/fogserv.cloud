import { Link } from '@tanstack/react-router'
import { NewsletterSignupCard } from './NewsletterSignup'

export function Footer() {
 return (
 <footer className="bg-secondary-light/40 backdrop-blur border-t border-border py-8">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="grid md:grid-cols-3 gap-8">
 <div>
 <h3 className="text-foreground font-semibold mb-4">fogserv.cloud</h3>
 <p className="text-muted-foreground text-sm">
 The AI-Managed Server. Infrastructure that learns and evolves.
 </p>
 </div>
 <div>
 <h3 className="text-foreground font-semibold mb-4">Resources</h3>
 <ul className="space-y-2 text-sm">
 <li><Link to="/kb" className="text-muted-foreground hover:text-foreground">Knowledge Base</Link></li>
 <li><a href="https://github.com/fogserv" className="text-muted-foreground hover:text-foreground" target="_blank" rel="noopener noreferrer">GitHub</a></li>

 </ul>
 </div>
 <div>
 <h3 className="text-foreground font-semibold mb-4">&nbsp;</h3>
 <ul className="space-y-2 text-sm">
 <li><Link to="/about" className="text-muted-foreground hover:text-foreground">About</Link></li>
 </ul>
 </div>
 </div>
 <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground text-sm">
 © 2026 fogserv.cloud. Helping people help themselves.
 </div>
 </div>
 </footer>
 )
}
