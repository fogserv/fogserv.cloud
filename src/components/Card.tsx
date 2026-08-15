export function Card({ title, description }: { title: string; description: string }) {
 return (
 <div className="bg-secondary/90 backdrop-blur border border-border rounded-lg p-6 hover:border-border transition-colors">
 <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
 <p className="text-muted-foreground">{description}</p>
 </div>
 )
}

export function UpdatePreview({ title, excerpt, link }: { title: string; excerpt: string; link: string }) {
 return (
 <a href={link} className="block bg-secondary/90 border border-border rounded-lg p-6 hover:border-border transition-colors">
 <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
 <p className="text-muted-foreground mb-4">{excerpt}</p>
 <span className="text-muted-foreground text-sm font-medium">Read more →</span>
 </a>
 )
}
