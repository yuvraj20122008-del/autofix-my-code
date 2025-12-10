import { Wrench, Github } from 'lucide-react';

export function Header() {
  return (
    <header className="w-full border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 glow-effect flex-shrink-0">
            <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-foreground truncate">AutoFix My Code</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">AI-Powered Code Analysis & Repair</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-2 sm:gap-4">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-secondary transition-colors flex-shrink-0"
          >
            <Github className="w-5 h-5 sm:w-5 sm:h-5 text-muted-foreground hover:text-foreground" />
          </a>
        </nav>
      </div>
    </header>
  );
}
