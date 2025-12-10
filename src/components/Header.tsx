import { Wrench, Github } from 'lucide-react';

export function Header() {
  return (
    <header className="w-full border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 glow-effect">
            <Wrench className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">AutoFix My Code</h1>
            <p className="text-xs text-muted-foreground">AI-Powered Code Analysis & Repair</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-4">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <Github className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </a>
        </nav>
      </div>
    </header>
  );
}
