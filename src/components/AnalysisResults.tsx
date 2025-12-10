import { useState } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  Shield, 
  Lightbulb, 
  FileText,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnalysisResult, PatchResult, DocsResult } from '@/types/analysis';
import { cn } from '@/lib/utils';

interface AnalysisResultsProps {
  analysis: AnalysisResult | null;
  patches: PatchResult | null;
  docs: DocsResult | null;
}

export function AnalysisResults({ analysis, patches, docs }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'patches' | 'docs'>('analysis');
  const [expandedPatches, setExpandedPatches] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const togglePatch = (index: number) => {
    setExpandedPatches(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadDocs = () => {
    if (!docs) return;

    const content = `# README.md\n\n${docs.readme}\n\n---\n\n# Repository Summary\n\n${docs.summary}\n\n---\n\n# Problems Solved\n\n${docs.problemsSolved}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'autofix-documentation.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!analysis && !patches && !docs) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4">
        <button
          onClick={() => setActiveTab('analysis')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2",
            activeTab === 'analysis'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <AlertCircle className="w-4 h-4" />
          Analysis
          {analysis && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-background/20 text-xs">
              {analysis.overallScore}/100
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('patches')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2",
            activeTab === 'patches'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <FileText className="w-4 h-4" />
          Patches
          {patches && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-background/20 text-xs">
              {patches.patches?.length || 0}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2",
            activeTab === 'docs'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <FileText className="w-4 h-4" />
          Documentation
        </button>
      </div>

      {/* Analysis Tab */}
      {activeTab === 'analysis' && analysis && (
        <div className="space-y-6 animate-fade-in">
          {/* Score Card */}
          <div className="glass-effect rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Overall Score</h3>
                <p className="text-sm text-muted-foreground mt-1">{analysis.summary}</p>
              </div>
              <div className={cn(
                "text-5xl font-bold",
                analysis.overallScore >= 80 && "text-success",
                analysis.overallScore >= 50 && analysis.overallScore < 80 && "text-warning",
                analysis.overallScore < 50 && "text-destructive"
              )}>
                {analysis.overallScore}
              </div>
            </div>
          </div>

          {/* Critical Errors */}
          {analysis.criticalErrors?.length > 0 && (
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Critical Errors ({analysis.criticalErrors.length})
              </h3>
              <div className="space-y-3">
                {analysis.criticalErrors.map((error, i) => (
                  <div key={i} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-sm text-destructive">{error.file}</span>
                        {error.line && <span className="text-muted-foreground ml-2">Line {error.line}</span>}
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        error.severity === 'critical' && "bg-destructive text-destructive-foreground",
                        error.severity === 'high' && "bg-warning text-warning-foreground",
                        error.severity === 'medium' && "bg-secondary text-secondary-foreground"
                      )}>
                        {error.severity}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-2">{error.issue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Issues */}
          {analysis.securityIssues?.length > 0 && (
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-warning" />
                Security Issues ({analysis.securityIssues.length})
              </h3>
              <div className="space-y-3">
                {analysis.securityIssues.map((issue, i) => (
                  <div key={i} className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <span className="font-mono text-sm text-warning">{issue.file}</span>
                    <p className="text-sm text-foreground mt-1">{issue.issue}</p>
                    {issue.cve && (
                      <span className="text-xs text-muted-foreground">CVE: {issue.cve}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {analysis.warnings?.length > 0 && (
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                Warnings ({analysis.warnings.length})
              </h3>
              <div className="space-y-2">
                {analysis.warnings.slice(0, 10).map((warning, i) => (
                  <div key={i} className="p-3 rounded-lg bg-secondary/50">
                    <span className="font-mono text-sm text-muted-foreground">{warning.file}</span>
                    <p className="text-sm text-foreground">{warning.issue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions?.length > 0 && (
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-primary" />
                Suggestions
              </h3>
              <ul className="space-y-2">
                {analysis.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="text-primary mt-1">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Patches Tab */}
      {activeTab === 'patches' && patches && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-effect rounded-xl p-6 mb-6">
            <p className="text-foreground">{patches.summary}</p>
            <div className="flex gap-4 mt-3 text-sm">
              <span className="text-success">Fixed: {patches.fixedCount}</span>
              <span className="text-muted-foreground">Skipped: {patches.skippedCount}</span>
            </div>
          </div>

          {patches.patches?.map((patch, i) => (
            <div key={i} className="glass-effect rounded-xl overflow-hidden">
              <button
                onClick={() => togglePatch(i)}
                className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedPatches.has(i) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="font-mono text-sm text-primary">{patch.file}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    patch.risk === 'low' && "bg-success/20 text-success",
                    patch.risk === 'medium' && "bg-warning/20 text-warning",
                    patch.risk === 'high' && "bg-destructive/20 text-destructive"
                  )}>
                    {patch.risk} risk
                  </span>
                </div>
              </button>
              
              {expandedPatches.has(i) && (
                <div className="border-t border-border">
                  <div className="p-4 bg-secondary/20">
                    <p className="text-sm text-foreground mb-3">{patch.explanation}</p>
                    {patch.testCommand && (
                      <p className="text-xs text-muted-foreground font-mono">
                        Test: {patch.testCommand}
                      </p>
                    )}
                  </div>
                  
                  {/* Original Code - What to Change (Red) */}
                  {patch.original && (
                    <div className="border-t border-border">
                      <div className="flex items-center justify-between px-4 py-2 bg-destructive/10 border-b border-destructive/20">
                        <span className="text-sm font-medium text-destructive flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Remove this code
                        </span>
                      </div>
                      <pre className="p-4 bg-destructive/5 overflow-x-auto border-l-4 border-destructive">
                        <code className="text-sm font-mono text-destructive/90 whitespace-pre">
                          {patch.original}
                        </code>
                      </pre>
                    </div>
                  )}
                  
                  {/* Fixed Code - Change To (Green) */}
                  {patch.fixed && (
                    <div className="border-t border-border">
                      <div className="flex items-center justify-between px-4 py-2 bg-success/10 border-b border-success/20">
                        <span className="text-sm font-medium text-success flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Replace with this code
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-success hover:text-success hover:bg-success/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(patch.fixed, i);
                          }}
                        >
                          {copiedIndex === i ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <pre className="p-4 bg-success/5 overflow-x-auto border-l-4 border-success">
                        <code className="text-sm font-mono text-success/90 whitespace-pre">
                          {patch.fixed}
                        </code>
                      </pre>
                    </div>
                  )}
                  
                  {/* Full Diff (collapsed by default if original/fixed are present) */}
                  {patch.diff && (!patch.original || !patch.fixed) && (
                    <pre className="p-4 bg-terminal-bg overflow-x-auto">
                      <code className="text-sm font-mono text-terminal-text whitespace-pre">
                        {patch.diff}
                      </code>
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Documentation Tab */}
      {activeTab === 'docs' && docs && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-end">
            <Button onClick={downloadDocs} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download All Docs
            </Button>
          </div>

          <div className="glass-effect rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">README.md</h3>
            <div className="prose prose-invert max-w-none">
              <pre className="p-4 bg-terminal-bg rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
                {docs.readme}
              </pre>
            </div>
          </div>

          <div className="glass-effect rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Repository Summary</h3>
            <pre className="p-4 bg-terminal-bg rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
              {docs.summary}
            </pre>
          </div>

          <div className="glass-effect rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Problems Solved</h3>
            <pre className="p-4 bg-terminal-bg rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
              {docs.problemsSolved}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
