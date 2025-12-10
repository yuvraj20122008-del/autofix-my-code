import { FileInfo, RepoSummary } from '@/types/analysis';

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript/React',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript/React',
  '.py': 'Python',
  '.java': 'Java',
  '.go': 'Go',
  '.rs': 'Rust',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.cs': 'C#',
  '.cpp': 'C++',
  '.c': 'C',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
  '.vue': 'Vue',
  '.svelte': 'Svelte',
  '.html': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.md': 'Markdown',
  '.sql': 'SQL',
};

const FRAMEWORK_INDICATORS: Record<string, string[]> = {
  'React': ['react', 'react-dom', 'next', 'gatsby'],
  'Vue': ['vue', 'nuxt', 'vuex'],
  'Angular': ['@angular/core'],
  'Svelte': ['svelte'],
  'Express': ['express'],
  'FastAPI': ['fastapi'],
  'Django': ['django'],
  'Flask': ['flask'],
  'Spring': ['spring-boot', 'org.springframework'],
  'Rails': ['rails'],
  'Laravel': ['laravel'],
  'NestJS': ['@nestjs/core'],
  'Tailwind': ['tailwindcss'],
  'Bootstrap': ['bootstrap'],
};

const IGNORED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '__pycache__',
  'venv',
  '.venv',
  'target',
  'vendor',
  '.idea',
  '.vscode',
];

const IGNORED_FILES = [
  '.DS_Store',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.env',
  '.env.local',
];

const MAX_FILE_SIZE = 100 * 1024; // 100KB
const MAX_FILES = 100;

export async function scanFiles(files: File[]): Promise<RepoSummary> {
  const languages = new Set<string>();
  const frameworks = new Set<string>();
  const structure: string[] = [];
  const processedFiles: FileInfo[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  let totalSize = 0;

  // Sort files by path for consistent structure
  const sortedFiles = Array.from(files).sort((a, b) => 
    (a.webkitRelativePath || a.name).localeCompare(b.webkitRelativePath || b.name)
  );

  let processedCount = 0;

  for (const file of sortedFiles) {
    const path = file.webkitRelativePath || file.name;
    
    // Skip ignored directories
    if (IGNORED_DIRS.some(dir => path.includes(`/${dir}/`) || path.startsWith(`${dir}/`))) {
      continue;
    }

    // Skip ignored files
    if (IGNORED_FILES.some(f => path.endsWith(f))) {
      continue;
    }

    // Limit number of files
    if (processedCount >= MAX_FILES) {
      warnings.push(`Reached file limit (${MAX_FILES}). Some files were skipped.`);
      break;
    }

    totalSize += file.size;
    structure.push(path);

    // Detect language
    const ext = '.' + path.split('.').pop()?.toLowerCase();
    if (LANGUAGE_EXTENSIONS[ext]) {
      languages.add(LANGUAGE_EXTENSIONS[ext]);
    }

    // Skip large files but note them
    if (file.size > MAX_FILE_SIZE) {
      warnings.push(`Skipped large file: ${path} (${(file.size / 1024).toFixed(1)}KB)`);
      continue;
    }

    try {
      const content = await readFileContent(file);
      
      // Detect frameworks from package.json or other config files
      if (path.endsWith('package.json')) {
        detectFrameworks(content, frameworks);
      }
      
      // Detect errors in content
      const fileErrors = detectErrors(path, content);
      errors.push(...fileErrors);

      processedFiles.push({
        path,
        content,
        type: ext || 'unknown',
        size: file.size,
      });

      processedCount++;
    } catch (err) {
      warnings.push(`Failed to read ${path}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return {
    languages: Array.from(languages),
    frameworks: Array.from(frameworks),
    files: processedFiles,
    errors,
    warnings,
    structure,
    totalSize,
    fileCount: processedCount,
  };
}

async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function detectFrameworks(packageJsonContent: string, frameworks: Set<string>): void {
  try {
    const pkg = JSON.parse(packageJsonContent);
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    for (const [framework, indicators] of Object.entries(FRAMEWORK_INDICATORS)) {
      if (indicators.some(ind => allDeps[ind])) {
        frameworks.add(framework);
      }
    }
  } catch {
    // Invalid JSON, skip
  }
}

function detectErrors(path: string, content: string): string[] {
  const errors: string[] = [];

  // Common error patterns
  const errorPatterns = [
    { pattern: /console\.error\s*\(/g, message: 'Console error found' },
    { pattern: /throw new Error/g, message: 'Uncaught throw statement' },
    { pattern: /TODO:|FIXME:|XXX:|HACK:/gi, message: 'TODO/FIXME comment found' },
    { pattern: /debugger;/g, message: 'Debugger statement found' },
    { pattern: /process\.env\.[A-Z_]+(?!\s*\|\||\s*\?\?)/g, message: 'Unguarded env variable access' },
  ];

  // TypeScript/JavaScript specific
  if (path.match(/\.(ts|tsx|js|jsx)$/)) {
    // Check for any type usage
    if (content.match(/:\s*any\b/g)) {
      errors.push(`${path}: 'any' type usage detected`);
    }
    // Check for var usage
    if (content.match(/\bvar\s+\w+/g)) {
      errors.push(`${path}: 'var' usage (consider let/const)`);
    }
    // Check for == instead of ===
    if (content.match(/[^=!]==[^=]/g)) {
      errors.push(`${path}: Loose equality (==) used instead of strict (===)`);
    }
  }

  // Python specific
  if (path.endsWith('.py')) {
    if (content.match(/except:\s*$/gm)) {
      errors.push(`${path}: Bare except clause (catches all exceptions)`);
    }
    if (content.match(/import \*/g)) {
      errors.push(`${path}: Wildcard import detected`);
    }
  }

  for (const { pattern, message } of errorPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      errors.push(`${path}: ${message} (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`);
    }
  }

  return errors;
}

export async function fetchGitHubRepo(url: string): Promise<RepoSummary> {
  // Parse GitHub URL
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub URL');
  }

  const [, owner, repo] = match;
  const repoName = repo.replace(/\.git$/, '');

  // Use GitHub API to get repo contents
  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/git/trees/main?recursive=1`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    // Try with 'master' branch
    const masterResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/trees/master?recursive=1`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );
    
    if (!masterResponse.ok) {
      throw new Error(`Failed to fetch repository: ${response.status}`);
    }
    
    return processGitHubTree(await masterResponse.json(), owner, repoName);
  }

  return processGitHubTree(await response.json(), owner, repoName);
}

async function processGitHubTree(
  tree: { tree: Array<{ path: string; type: string; size?: number; url?: string }> },
  owner: string,
  repo: string
): Promise<RepoSummary> {
  const languages = new Set<string>();
  const frameworks = new Set<string>();
  const structure: string[] = [];
  const processedFiles: FileInfo[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  let totalSize = 0;
  let processedCount = 0;

  // Filter to only files (blobs)
  const files = tree.tree
    .filter(item => item.type === 'blob')
    .filter(item => !IGNORED_DIRS.some(dir => item.path.includes(`${dir}/`)))
    .filter(item => !IGNORED_FILES.some(f => item.path.endsWith(f)))
    .slice(0, MAX_FILES);

  for (const file of files) {
    structure.push(file.path);
    totalSize += file.size || 0;

    const ext = '.' + file.path.split('.').pop()?.toLowerCase();
    if (LANGUAGE_EXTENSIONS[ext]) {
      languages.add(LANGUAGE_EXTENSIONS[ext]);
    }

    // Only fetch content for important files
    const importantFiles = [
      'package.json',
      'requirements.txt',
      'Cargo.toml',
      'go.mod',
      '.eslintrc',
      'tsconfig.json',
    ];

    const isImportantFile = importantFiles.some(f => file.path.endsWith(f)) ||
      file.path.match(/\.(ts|tsx|js|jsx|py|go|rs|java)$/);

    if (isImportantFile && file.size && file.size < MAX_FILE_SIZE && processedCount < 50) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${file.path}`;
        const contentResponse = await fetch(rawUrl);
        
        if (contentResponse.ok) {
          const content = await contentResponse.text();
          
          if (file.path.endsWith('package.json')) {
            detectFrameworks(content, frameworks);
          }

          const fileErrors = detectErrors(file.path, content);
          errors.push(...fileErrors);

          processedFiles.push({
            path: file.path,
            content,
            type: ext || 'unknown',
            size: file.size,
          });

          processedCount++;
        }
      } catch {
        warnings.push(`Failed to fetch ${file.path}`);
      }
    }
  }

  return {
    languages: Array.from(languages),
    frameworks: Array.from(frameworks),
    files: processedFiles,
    errors,
    warnings,
    structure,
    totalSize,
    fileCount: processedCount,
  };
}
