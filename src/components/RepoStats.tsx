import { Files, Code, Package, AlertTriangle } from 'lucide-react';
import { RepoSummary } from '@/types/analysis';
import { cn } from '@/lib/utils';

interface RepoStatsProps {
  summary: RepoSummary;
}

export function RepoStats({ summary }: RepoStatsProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const stats = [
    {
      icon: Files,
      label: 'Files',
      value: summary.fileCount,
      color: 'text-primary',
    },
    {
      icon: Code,
      label: 'Languages',
      value: summary.languages.length,
      color: 'text-success',
    },
    {
      icon: Package,
      label: 'Frameworks',
      value: summary.frameworks.length,
      color: 'text-accent',
    },
    {
      icon: AlertTriangle,
      label: 'Issues Found',
      value: summary.errors.length,
      color: 'text-warning',
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-effect rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
            <stat.icon className={cn("w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2", stat.color)} />
            <p className="text-lg sm:text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 justify-center">
        {summary.languages.map((lang) => (
          <span 
            key={lang}
            className="px-2 sm:px-3 py-1 rounded-full bg-secondary text-xs text-secondary-foreground"
          >
            {lang}
          </span>
        ))}
        {summary.frameworks.map((fw) => (
          <span 
            key={fw}
            className="px-2 sm:px-3 py-1 rounded-full bg-primary/20 text-xs text-primary"
          >
            {fw}
          </span>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-2 sm:mt-3">
        Total size: {formatSize(summary.totalSize)}
      </p>
    </div>
  );
}
