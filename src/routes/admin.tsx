import { createFileRoute, Link } from '@tanstack/react-router'
import { AdminMetricCard, PostsSection, EmailSandboxCard, ActionButton, StatusPill } from '../components/AdminComponents'

function AdminDashboardPage() {
 return (
 <div className="bg-background py-16">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="mb-10">
 <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-3">Admin Workspace</p>
 <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Dashboard Foundation</h1>
 <p className="text-foreground max-w-3xl">
 Central control surface for CRM and CMS operations. This foundation provides role-friendly visibility,
 publishing controls, and campaign workflows while Phase 3 and 4 features are being implemented.
 </p>
 </div>

 <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-10">
 <AdminMetricCard label="Draft Posts" value="0" note="Check posts list below" tone="indigo" />
 <AdminMetricCard label="Published Posts" value="0" note="Live content" tone="emerald" />
 <AdminMetricCard label="Active Subscribers" value="—" note="Pending import" tone="cyan" />
 <AdminMetricCard label="Campaign Open Rate" value="—" note="No campaigns yet" tone="amber" />
 </div>

 <div className="grid gap-8 xl:grid-cols-3">
 <section className="xl:col-span-2 bg-secondary/50 border border-primary/20 rounded-xl p-6">
 <h2 className="text-2xl font-semibold text-foreground mb-2">All Posts</h2>
 <p className="text-muted-foreground mb-6">Real-time post data from the database.</p>

 <PostsSection showDrafts={true} />
 </section>

 <section className="bg-secondary/50 border border-primary/20 rounded-xl p-6">
 <h2 className="text-2xl font-semibold text-foreground mb-2">Quick Actions</h2>
 <p className="text-muted-foreground mb-6">Starter controls for upcoming CRM/CMS features.</p>

 <div className="space-y-3">
 <Link to="/admin/new-post" className="block w-full text-left rounded-lg border border-border bg-background/70 px-4 py-3 hover:border-border hover:bg-background transition-colors">
 <p className="text-foreground font-medium">Create New Post</p>
 <p className="text-muted-foreground text-sm">Open rich text editor</p>
 </Link>
 <ActionButton label="Import Ghost Content" detail="Run migration assistant" />
 <ActionButton label="New Campaign" detail="Compose newsletter" />
 <ActionButton label="Manage Subscribers" detail="Review preferences and churn" />
 </div>

 <EmailSandboxCard />
 </section>
 </div>

 <section className="mt-8 bg-secondary/40 border border-primary/20 rounded-xl p-6">
 <h2 className="text-xl font-semibold text-foreground mb-3">Implementation Status</h2>
 <div className="grid gap-3 md:grid-cols-3 text-sm">
 <StatusPill title="Admin Layout" value="Active" tone="emerald" />
 <StatusPill title="Post CRUD API" value="Active" tone="emerald" />
 <StatusPill title="Role-Based Access" value="Planned" tone="amber" />
 </div>
 </section>
 </div>
 </div>
 )
}

export const Route = createFileRoute('/admin')({
 component: AdminDashboardPage,
})

export default { component: AdminDashboardPage }
