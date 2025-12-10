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
  ChevronRight,
  ArrowDown,
  Minus,
  Plus,
  Code2,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnalysisResult, PatchResult, DocsResult } from '@/types/analysis';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

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
    toast({
      title: "Copied to clipboard",
      description: "The code has been copied and is ready to paste.",
    });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Add line numbers to code
  const addLineNumbers = (code: string) => {
    return code.split('\n').map((line, i) => ({
      number: i + 1,
      content: line
    }));
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
        <div className="space-y-5 animate-fade-in">
          {/* Summary Card */}
          <div className="glass-effect rounded-xl p-6 mb-6 border border-border/50">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Wrench className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">Fix Summary</h3>
                <p className="text-foreground/80">{patches.summary}</p>
                <div className="flex gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-sm text-foreground">{patches.fixedCount} Fixed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted" />
                    <span className="text-sm text-muted-foreground">{patches.skippedCount} Skipped</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Patches List */}
          {patches.patches?.map((patch, i) => (
            <div key={i} className="glass-effect rounded-xl overflow-hidden border border-border/50 transition-all duration-200 hover:border-primary/30">
              {/* Patch Header */}
              <button
                onClick={() => togglePatch(i)}
                className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-1.5 rounded-md transition-colors",
                    expandedPatches.has(i) ? "bg-primary/20" : "bg-secondary"
                  )}>
                    {expandedPatches.has(i) ? (
                      <ChevronDown className="w-4 h-4 text-primary" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <Code2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-sm text-primary font-medium">{patch.file}</span>
                </div>
                <span className={cn(
                  "text-xs px-3 py-1 rounded-full font-medium",
                  patch.risk === 'low' && "bg-success/20 text-success border border-success/30",
                  patch.risk === 'medium' && "bg-warning/20 text-warning border border-warning/30",
                  patch.risk === 'high' && "bg-destructive/20 text-destructive border border-destructive/30"
                )}>
                  {patch.risk} risk
                </span>
              </button>
              
              {/* Expanded Content */}
              {expandedPatches.has(i) && (
                <div className="border-t border-border animate-fade-in">
                  {/* Explanation */}
                  <div className="p-4 bg-secondary/20 border-b border-border">
                    <p className="text-sm text-foreground leading-relaxed">{patch.explanation}</p>
                    {patch.testCommand && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">Test command:</span>
                        <code className="px-2 py-1 bg-terminal-bg rounded font-mono">{patch.testCommand}</code>
                      </div>
                    )}
                  </div>
                  
                  {/* Original Code - What to Change (Red) */}
                  {patch.original && (
                    <div className="border-b border-border">
                      <div className="flex items-center justify-between px-4 py-3 bg-destructive/10">
                        <span className="text-sm font-semibold text-destructive flex items-center gap-2">
                          <Minus className="w-4 h-4" />
                          REMOVE
                        </span>
                        <span className="text-xs text-destructive/70">Original code to delete</span>
                      </div>
                      <div className="bg-destructive/5 overflow-x-auto">
                        <table className="w-full">
                          <tbody>
                            {addLineNumbers(patch.original).map((line) => (
                              <tr key={line.number} className="hover:bg-destructive/10">
                                <td className="px-3 py-0.5 text-right text-xs text-destructive/50 select-none border-r border-destructive/20 w-12 font-mono">
                                  {line.number}
                                </td>
                                <td className="px-4 py-0.5">
                                  <code className="text-sm font-mono text-destructive whitespace-pre">
                                    {line.content || ' '}
                                  </code>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Arrow Indicator */}
                  {patch.original && patch.fixed && (
                    <div className="flex items-center justify-center py-2 bg-secondary/30">
                      <ArrowDown className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Fixed Code - Change To (Green) */}
                  {patch.fixed && (
                    <div>
                      <div className="flex items-center justify-between px-4 py-3 bg-success/10">
                        <span className="text-sm font-semibold text-success flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          ADD
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-success border-success/30 hover:text-success hover:bg-success/20 hover:border-success/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(patch.fixed, i);
                          }}
                        >
                          {copiedIndex === i ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1.5" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 mr-1.5" />
                              Copy Code
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="bg-success/5 overflow-x-auto">
                        <table className="w-full">
                          <tbody>
                            {addLineNumbers(patch.fixed).map((line) => (
                              <tr key={line.number} className="hover:bg-success/10">
                                <td className="px-3 py-0.5 text-right text-xs text-success/50 select-none border-r border-success/20 w-12 font-mono">
                                  {line.number}
                                </td>
                                <td className="px-4 py-0.5">
                                  <code className="text-sm font-mono text-success whitespace-pre">
                                    {line.content || ' '}
                                  </code>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Full Diff fallback */}
                  {patch.diff && (!patch.original || !patch.fixed) && (
                    <div>
                      <div className="flex items-center justify-between px-4 py-3 bg-secondary/30">
                        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Code2 className="w-4 h-4" />
                          Diff
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(patch.diff, i);
                          }}
                        >
                          {copiedIndex === i ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1.5" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 mr-1.5" />
                              Copy Diff
                            </>
                          )}
                        </Button>
                      </div>
                      <pre className="p-4 bg-terminal-bg overflow-x-auto">
                        <code className="text-sm font-mono text-terminal-text whitespace-pre">
                          {patch.diff}
                        </code>
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Empty State */}
          {(!patches.patches || patches.patches.length === 0) && (
            <div className="text-center py-12">
              <Check className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">No patches needed</h3>
              <p className="text-muted-foreground mt-1">Your code looks good!</p>
            </div>
          )}
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
