export interface FileInfo {
  path: string;
  content: string;
  type: string;
  size: number;
}

export interface RepoSummary {
  languages: string[];
  frameworks: string[];
  files: FileInfo[];
  errors: string[];
  warnings: string[];
  structure: string[];
  totalSize: number;
  fileCount: number;
}

export interface AnalysisResult {
  criticalErrors: Array<{
    file: string;
    line?: number;
    issue: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }>;
  warnings: Array<{
    file: string;
    issue: string;
  }>;
  securityIssues: Array<{
    file: string;
    issue: string;
    cve?: string;
  }>;
  suggestions: string[];
  overallScore: number;
  summary: string;
}

export interface PatchResult {
  patches: Array<{
    file: string;
    original: string;
    fixed: string;
    diff: string;
    explanation: string;
    risk: 'low' | 'medium' | 'high';
    testCommand?: string;
    applied?: boolean;
  }>;
  summary: string;
  fixedCount: number;
  skippedCount: number;
  skippedReasons: string[];
}

export interface DocsResult {
  readme: string;
  summary: string;
  problemsSolved: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

export type AnalysisStatus = 
  | 'idle' 
  | 'uploading' 
  | 'scanning' 
  | 'analyzing' 
  | 'fixing' 
  | 'verifying' 
  | 'generating-docs' 
  | 'complete' 
  | 'error';
