import { cn } from '@/lib/utils';
import { AnalysisStatus } from '@/types/analysis';

interface ProgressBarProps {
  progress: number;
  status: AnalysisStatus;
}

const STATUS_LABELS: Record<AnalysisStatus, string> = {
  idle: 'Ready',
  uploading: 'Processing files...',
  scanning: 'Scanning repository...',
  analyzing: 'AI analyzing code...',
  fixing: 'Generating fixes...',
  verifying: 'Verifying patches...',
  'generating-docs': 'Generating documentation...',
  complete: 'Complete!',
  error: 'Error occurred',
};

const STEPS = [
  { label: 'Upload', threshold: 10 },
  { label: 'Scan', threshold: 30 },
  { label: 'Analyze', threshold: 50 },
  { label: 'Fix', threshold: 75 },
  { label: 'Docs', threshold: 100 },
];

export function ProgressBar({ progress, status }: ProgressBarProps) {
  const isError = status === 'error';
  const isComplete = status === 'complete';

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      {/* Progress Steps */}
      <div className="flex justify-between mb-2 sm:mb-3 gap-1 sm:gap-2">
        {STEPS.map((step, index) => {
          const isActive = progress >= step.threshold;
          const isCurrent = progress >= (STEPS[index - 1]?.threshold || 0) && progress < step.threshold;
          
          return (
            <div key={step.label} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={cn(
                  "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 flex-shrink-0",
                  isActive && !isError && "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
                  isCurrent && !isError && "bg-primary/20 text-primary border-2 border-primary",
                  !isActive && !isCurrent && "bg-secondary text-muted-foreground",
                  isError && isCurrent && "bg-destructive/20 text-destructive border-2 border-destructive"
                )}
              >
                {index + 1}
              </div>
              <span className={cn(
                "text-xs hidden sm:block",
                isActive || isCurrent ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            isError && "bg-destructive",
            isComplete && "bg-success",
            !isError && !isComplete && "bg-gradient-to-r from-primary to-accent"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status Label */}
      <div className="flex justify-between items-center mt-2 sm:mt-3 gap-2">
        <span className={cn(
          "text-xs sm:text-sm font-medium truncate",
          isError && "text-destructive",
          isComplete && "text-success",
          !isError && !isComplete && "text-primary"
        )}>
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
          {progress}%
        </span>
      </div>
    </div>
  );
}
