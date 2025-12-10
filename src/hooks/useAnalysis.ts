import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  RepoSummary, 
  AnalysisResult, 
  PatchResult, 
  DocsResult, 
  LogEntry, 
  AnalysisStatus 
} from '@/types/analysis';
import { scanFiles, fetchGitHubRepo } from '@/utils/fileScanner';

const generateId = () => Math.random().toString(36).substring(2, 9);

export function useAnalysis() {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [repoSummary, setRepoSummary] = useState<RepoSummary | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [patchResult, setPatchResult] = useState<PatchResult | null>(null);
  const [docsResult, setDocsResult] = useState<DocsResult | null>(null);
  const [progress, setProgress] = useState(0);

  const addLog = useCallback((type: LogEntry['type'], message: string, details?: string) => {
    const entry: LogEntry = {
      id: generateId(),
      timestamp: new Date(),
      type,
      message,
      details,
    };
    setLogs(prev => [...prev, entry]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setRepoSummary(null);
    setAnalysisResult(null);
    setPatchResult(null);
    setDocsResult(null);
    setProgress(0);
  }, []);

  const processFiles = useCallback(async (files: File[]) => {
    clearLogs();
    setStatus('uploading');
    setProgress(5);
    addLog('info', 'Processing uploaded files...');

    try {
      setStatus('scanning');
      setProgress(15);
      addLog('info', `Scanning ${files.length} files...`);

      const summary = await scanFiles(files);
      setRepoSummary(summary);

      addLog('success', `Found ${summary.fileCount} processable files`);
      addLog('info', `Languages detected: ${summary.languages.join(', ') || 'None'}`);
      addLog('info', `Frameworks detected: ${summary.frameworks.join(', ') || 'None'}`);
      
      if (summary.warnings.length > 0) {
        summary.warnings.forEach(w => addLog('warning', w));
      }

      if (summary.errors.length > 0) {
        addLog('warning', `Found ${summary.errors.length} potential issues in code`);
      }

      setProgress(30);
      return summary;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addLog('error', `Failed to process files: ${message}`);
      setStatus('error');
      throw error;
    }
  }, [addLog, clearLogs]);

  const processGitHubUrl = useCallback(async (url: string) => {
    clearLogs();
    setStatus('uploading');
    setProgress(5);
    addLog('info', `Fetching repository from GitHub...`);
    addLog('info', url);

    try {
      setStatus('scanning');
      setProgress(15);
      
      const summary = await fetchGitHubRepo(url);
      setRepoSummary(summary);

      addLog('success', `Fetched ${summary.fileCount} files from repository`);
      addLog('info', `Languages: ${summary.languages.join(', ') || 'None detected'}`);
      addLog('info', `Frameworks: ${summary.frameworks.join(', ') || 'None detected'}`);
      
      if (summary.warnings.length > 0) {
        summary.warnings.forEach(w => addLog('warning', w));
      }

      if (summary.errors.length > 0) {
        addLog('warning', `Found ${summary.errors.length} potential issues`);
      }

      setProgress(30);
      return summary;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addLog('error', `Failed to fetch repository: ${message}`);
      setStatus('error');
      throw error;
    }
  }, [addLog, clearLogs]);

  const analyzeCode = useCallback(async (summary: RepoSummary) => {
    setStatus('analyzing');
    setProgress(40);
    addLog('info', 'Sending code to AI for analysis...');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-code', {
        body: { repoSummary: summary, action: 'analyze' },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Analysis failed');

      const result = data.result as AnalysisResult;
      setAnalysisResult(result);

      addLog('success', `Analysis complete. Score: ${result.overallScore}/100`);
      addLog('info', `Found ${result.criticalErrors?.length || 0} critical errors`);
      addLog('info', `Found ${result.warnings?.length || 0} warnings`);
      addLog('info', `Found ${result.securityIssues?.length || 0} security issues`);

      setProgress(50);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addLog('error', `Analysis failed: ${message}`);
      setStatus('error');
      throw error;
    }
  }, [addLog]);

  const generateFixes = useCallback(async (summary: RepoSummary) => {
    setStatus('fixing');
    setProgress(60);
    addLog('info', 'Generating code fixes...');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-code', {
        body: { repoSummary: summary, action: 'fix' },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Fix generation failed');

      const result = data.result as PatchResult;
      setPatchResult(result);

      addLog('success', `Generated ${result.patches?.length || 0} patches`);
      addLog('info', `Fixed: ${result.fixedCount || 0}, Skipped: ${result.skippedCount || 0}`);
      
      if (result.skippedReasons?.length > 0) {
        result.skippedReasons.forEach(r => addLog('warning', `Skipped: ${r}`));
      }

      setProgress(75);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addLog('error', `Fix generation failed: ${message}`);
      setStatus('error');
      throw error;
    }
  }, [addLog]);

  const generateDocs = useCallback(async (summary: RepoSummary) => {
    setStatus('generating-docs');
    setProgress(85);
    addLog('info', 'Generating documentation...');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-code', {
        body: { repoSummary: summary, action: 'generate-docs' },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Documentation generation failed');

      const result = data.result as DocsResult;
      setDocsResult(result);

      addLog('success', 'Documentation generated successfully');
      addLog('info', 'Generated: README.md, repo-summary.md, problems-solved.md');

      setProgress(100);
      setStatus('complete');
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addLog('error', `Documentation generation failed: ${message}`);
      setStatus('error');
      throw error;
    }
  }, [addLog]);

  const runFullAnalysis = useCallback(async (source: File[] | string) => {
    try {
      let summary: RepoSummary;

      if (typeof source === 'string') {
        summary = await processGitHubUrl(source);
      } else {
        summary = await processFiles(source);
      }

      await analyzeCode(summary);
      await generateFixes(summary);
      await generateDocs(summary);

      addLog('success', '✓ All operations completed successfully!');
    } catch (error) {
      // Error already logged in individual functions
      console.error('Full analysis failed:', error);
    }
  }, [processFiles, processGitHubUrl, analyzeCode, generateFixes, generateDocs, addLog]);

  const reset = useCallback(() => {
    setStatus('idle');
    clearLogs();
  }, [clearLogs]);

  return {
    status,
    logs,
    repoSummary,
    analysisResult,
    patchResult,
    docsResult,
    progress,
    processFiles,
    processGitHubUrl,
    analyzeCode,
    generateFixes,
    generateDocs,
    runFullAnalysis,
    reset,
    addLog,
  };
}
