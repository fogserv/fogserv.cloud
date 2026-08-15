import { createFileRoute } from '@tanstack/react-router'

function Home() {
 return (
 <div className="min-h-screen bg-gradient-to-b from-muted to-background">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
 <div className="text-center">
 <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
 fogserv.cloud
 </h1>
 <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
 An AI-Managed Project
 </p>
 <p className="text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
 A masterclass in agentic autonomy and decentralized infrastructure. 
 Self-healing, self-improving, and guided by the north star: 
 <strong> helping people help themselves.</strong>
 </p>
 
 <div className="grid md:grid-cols-3 gap-8 mt-16">
 <Card
 title="🏛️ GitOps is Law"
 description="Every change is managed via Git. The repository is the source of truth."
 />
 <Card
 title="📋 Ticketing is Truth"
 description="No work happens without a record. Every line of code has a 'Why'."
 />
 <Card
 title="🧠 Documentation is Memory"
 description="The Knowledge Base prevents context rot. Agents update it after every session."
 />
 </div>
 </div>
 </div>
 </div>
 )
}

function Card({ title, description }: { title: string; description: string }) {
 return (
 <div className="bg-secondary/90 backdrop-blur border border-border rounded-lg p-6 hover:border-border transition-colors">
 <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
 <p className="text-muted-foreground">{description}</p>
 </div>
 )
}

export const Route = createFileRoute('/')({
 component: Home,
})

export default { component: Home }
