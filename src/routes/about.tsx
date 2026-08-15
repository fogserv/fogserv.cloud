import { createFileRoute, Link } from '@tanstack/react-router'

function AboutPage() {
 return (
 <div className="bg-background py-20">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
 <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">About fogserv.cloud</h1>
 
 <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
 <p className="text-xl text-muted-foreground">
 fogserv.cloud is a state-of-the-art implementation of "The AI-Managed Server."
 </p>
 
 <p>
 We treat infrastructure not as a static resource, but as a <strong>living entity that learns 
 and evolves</strong> alongside its operator. This project demonstrates how small-scale 
 decentralization and agentic workflows can match the reliability and scale of much larger organizations.
 </p>

 <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">The TELOS Mission</h2>
 <p>
 At its core, fogserv.cloud is driven by TELOS (the North Star)—a mission to build tools that 
 unlock the full potential of technology people already possess, enabling critical thinking and 
 making "execution inevitable for everyone."
 </p>

 <div className="bg-secondary/50 border border-border rounded-lg p-6 my-8">
 <h3 className="text-xl font-semibold text-foreground mb-4">Three Strategic Goals</h3>
 <ul className="space-y-4">
 <li>
 <strong className="text-muted-foreground">Democratic Technology:</strong> Breaking the perception 
 that essential resources or knowledge are restricted.
 </li>
 <li>
 <strong className="text-muted-foreground">Knowledge as Freedom:</strong> Maintaining a massive, 
 searchable Documentation Hub that serves as long-term memory for both humans and AI agents.
 </li>
 <li>
 <strong className="text-muted-foreground">Agentic Autonomy:</strong> Utilizing AI agents (fogserv-ai) 
 to manage the entire lifecycle of infrastructure—from bug tracking to deployment.
 </li>
 </ul>
 </div>

 <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">How It Works</h2>
 <p>
 fogserv.cloud operates on four core pillars that ensure reliability, transparency, and continuous improvement:
 </p>
 
 <ol className="space-y-4 list-decimal list-inside">
 <li>
 <strong className="text-foreground">GitOps is Law:</strong> Every change flows through Git, 
 triggering automated Forgejo Actions. Production always matches the repository.
 </li>
 <li>
 <strong className="text-foreground">Ticketing is Truth:</strong> A custom ticketing system 
 synced with Forgejo Issues ensures every line of code has a "Why."
 </li>
 <li>
 <strong className="text-foreground">Documentation is Memory:</strong> Our comprehensive Knowledge Base at
 <Link to="/kb" className="text-muted-foreground hover:text-muted-foreground ml-1 underline">/kb</Link> contains everything from server inventories to philosophical manifestos.
 </li>
 <li>
 <strong className="text-foreground">Proactive Polish:</strong> Agents follow the "campsite rule"—
 they refactor surrounding code and update docs in the same pass.
 </li>
 </ol>

 <div className="mt-12 flex gap-4">
 <Link to="/kb" className="bg-background hover:bg-background text-foreground px-6 py-3 rounded-lg font-semibold transition-colors">Explore Knowledge Base</Link>

 <Link to="/changelog" className="bg-secondary hover:bg-background text-foreground px-6 py-3 rounded-lg font-semibold transition-colors">
 Read the Changelog
 </Link>
 </div>
 </div>
 </div>
 </div>
 )
}

export const Route = createFileRoute('/about')({
 component: AboutPage,
})

export default { component: AboutPage }
