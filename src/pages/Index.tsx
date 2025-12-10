import { useState } from 'react';
import { Sparkles, Zap, Shield, FileCode, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { FileUploader } from '@/components/FileUploader';
import { TerminalLog } from '@/components/TerminalLog';
import { ProgressBar } from '@/components/ProgressBar';
import { RepoStats } from '@/components/RepoStats';
import { AnalysisResults } from '@/components/AnalysisResults';
import { useAnalysis } from '@/hooks/useAnalysis';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Powered Analysis',
    description: 'Deep code analysis using advanced AI to detect bugs, vulnerabilities, and code smells',
  },
  {
    icon: Zap,
    title: 'Automated Fixes',
    description: 'Generate safe, minimal patches that fix issues without breaking your codebase',
  },
  {
    icon: Shield,
    title: 'Security Scanning',
    description: 'Identify potential security vulnerabilities and get actionable remediation steps',
  },
  {
    icon: FileCode,
    title: 'Auto Documentation',
    description: 'Generate comprehensive README, summaries, and change documentation',
  },
];

export default function Index() {
  const {
    status,
    logs,
    repoSummary,
    analysisResult,
    patchResult,
    docsResult,
    progress,
    runFullAnalysis,
    reset,
  } = useAnalysis();

  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    setShowAnalysis(true);
    await runFullAnalysis(files);
  };

  const handleGitHubUrl = async (url: string) => {
    setShowAnalysis(true);
    await runFullAnalysis(url);
  };

  const handleReset = () => {
    reset();
    setShowAnalysis(false);
  };

  const isProcessing = status !== 'idle' && status !== 'complete' && status !== 'error';
  const isComplete = status === 'complete';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects - Hidden on mobile for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        {!showAnalysis ? (
          /* Landing View */
          <div className="animate-slide-up">
            {/* Hero Section */}
            <section className="text-center py-8 sm:py-16 md:py-20">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 mb-4 sm:mb-6 hover:border-primary/50 transition-all duration-300 text-xs sm:text-sm">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary animate-pulse flex-shrink-0" />
                <span className="text-primary font-semibold">AI-Powered Code Repair</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 sm:mb-6 leading-tight tracking-tight">
                Fix Your Code <br />
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">Automatically</span>
              </h1>
              
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-12 px-2">
                Upload your codebase or paste a GitHub URL. Our AI will scan, analyze, 
                and generate fixes for bugs, security issues, and code quality problems.
              </p>

              <FileUploader 
                onFilesSelected={handleFilesSelected}
                onGitHubUrl={handleGitHubUrl}
                isLoading={isProcessing}
              />
            </section>

            {/* Features Grid */}
            <section className="py-8 sm:py-16 md:py-20">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-2 sm:mb-4">Powerful Features</h2>
              <p className="text-center text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base px-2">Everything you need to analyze and fix your code automatically</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {FEATURES.map((feature, index) => (
                  <div 
                    key={feature.title}
                    className="group glass-effect rounded-xl p-6 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 animate-slide-up hover:-translate-y-1 cursor-pointer"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 w-fit mb-4 group-hover:from-primary/30 group-hover:to-accent/20 transition-all duration-300 group-hover:scale-110">
                      <feature.icon className="w-6 h-6 text-primary group-hover:text-accent transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors">{feature.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* How It Works */}
            <section className="py-8 sm:py-16 md:py-20">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground text-center mb-2 sm:mb-4">How It Works</h2>
              <p className="text-center text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base px-2">Simple three-step process to fix your code</p>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8">
                {[
                  { step: '1', title: 'Upload', desc: 'Drop your folder or paste GitHub URL', icon: '📂' },
                  { step: '2', title: 'Scan', desc: 'AI analyzes your entire codebase', icon: '🔍' },
                  { step: '3', title: 'Fix', desc: 'Get patches and documentation', icon: '✨' },
                ].map((item, index) => (
                  <div key={item.step} className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 w-full md:w-auto">
                    <div className="text-center group cursor-pointer w-full md:w-auto">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:from-primary/50 group-hover:to-accent/30 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/30 text-xl sm:text-2xl">
                        {item.icon}
                      </div>
                      <h4 className="font-bold text-foreground text-base sm:text-lg group-hover:text-primary transition-colors">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors mt-1">{item.desc}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden md:block">
                        <ArrowRight className="w-6 sm:w-8 h-6 sm:h-8 text-primary/40 group-hover:text-primary/60" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          /* Analysis View */
          <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
            {/* Progress Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Code Analysis</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {isProcessing ? 'Processing your code...' : isComplete ? 'Analysis complete!' : 'Ready to analyze'}
                </p>
              </div>
              <Button onClick={handleReset} variant="outline" size="sm" className="w-full sm:w-auto">
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            </div>

            {/* Progress Bar */}
            {(isProcessing || isComplete) && (
              <ProgressBar progress={progress} status={status} />
            )}

            {/* Repo Stats */}
            {repoSummary && (
              <RepoStats summary={repoSummary} />
            )}

            {/* Terminal Log */}
            <TerminalLog logs={logs} className="h-48 sm:h-56 md:h-64" />

            {/* Results */}
            {isComplete && (
              <AnalysisResults 
                analysis={analysisResult}
                patches={patchResult}
                docs={docsResult}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 sm:py-12 md:py-16 mt-12 sm:mt-16 md:mt-20 bg-gradient-to-b from-transparent to-primary/5">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-foreground mb-2 sm:mb-4 text-sm sm:text-base">AutoFix My Code</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">AI-powered code analysis and automated fixes for your projects.</p>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-semibold text-foreground mb-2 sm:mb-4 text-sm sm:text-base">Quick Links</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-semibold text-foreground mb-2 sm:mb-4 text-sm sm:text-base">Resources</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/30 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">© 2025 AutoFix My Code. All rights reserved.</p>
            <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Status</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
