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
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

      <main className="container mx-auto px-4 py-8 relative z-10">
        {!showAnalysis ? (
          /* Landing View */
          <div className="animate-slide-up">
            {/* Hero Section */}
            <section className="text-center py-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">AI-Powered Code Repair</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Fix Your Code <br />
                <span className="gradient-text">Automatically</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
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
            <section className="py-16">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {FEATURES.map((feature, index) => (
                  <div 
                    key={feature.title}
                    className="glass-effect rounded-xl p-6 hover:border-primary/30 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* How It Works */}
            <section className="py-16">
              <h2 className="text-2xl font-bold text-foreground text-center mb-12">How It Works</h2>
              <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                {[
                  { step: '1', title: 'Upload', desc: 'Drop your folder or paste GitHub URL' },
                  { step: '2', title: 'Scan', desc: 'AI analyzes your entire codebase' },
                  { step: '3', title: 'Fix', desc: 'Get patches and documentation' },
                ].map((item, index) => (
                  <div key={item.step} className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl font-bold text-primary">{item.step}</span>
                      </div>
                      <h4 className="font-semibold text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    {index < 2 && (
                      <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          /* Analysis View */
          <div className="space-y-8 animate-fade-in">
            {/* Progress Section */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Code Analysis</h2>
                <p className="text-sm text-muted-foreground">
                  {isProcessing ? 'Processing your code...' : isComplete ? 'Analysis complete!' : 'Ready to analyze'}
                </p>
              </div>
              <Button onClick={handleReset} variant="outline" size="sm">
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
            <TerminalLog logs={logs} className="h-64" />

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
      <footer className="border-t border-border/50 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            AutoFix My Code • AI-Powered Code Analysis & Repair
          </p>
        </div>
      </footer>
    </div>
  );
}
