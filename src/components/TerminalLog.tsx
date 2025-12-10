import { useEffect, useRef } from 'react';
import { LogEntry } from '@/types/analysis';
import { cn } from '@/lib/utils';

interface TerminalLogProps {
  logs: LogEntry[];
  className?: string;
}

export function TerminalLog({ logs, className }: TerminalLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getTypeStyles = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'terminal-success';
      case 'error':
        return 'terminal-error';
      case 'warning':
        return 'terminal-warning';
      default:
        return 'terminal-info';
    }
  };

  const getPrefix = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return '[✓]';
      case 'error':
        return '[✗]';
      case 'warning':
        return '[!]';
      default:
        return '[i]';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "bg-terminal-bg rounded-lg border border-border p-3 sm:p-4 font-mono text-xs sm:text-sm overflow-auto",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-border/50">
        <div className="flex gap-1.5 flex-shrink-0">
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-destructive/80" />
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-warning/80" />
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-success/80" />
        </div>
        <span className="text-muted-foreground text-xs">autofix-terminal</span>
      </div>

      <div className="space-y-1">
        {logs.length === 0 ? (
          <div className="text-muted-foreground flex items-center gap-2">
            <span>$</span>
            <span className="animate-terminal-cursor">_</span>
            <span className="opacity-50 text-xs">Waiting for input...</span>
          </div>
        ) : (
          logs.map((log, index) => (
            <div 
              key={log.id} 
              className={cn(
                "terminal-line animate-fade-in break-words",
                getTypeStyles(log.type)
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <span className="text-muted-foreground mr-1 sm:mr-2 hidden sm:inline">{formatTime(log.timestamp)}</span>
              <span className="mr-1 sm:mr-2">{getPrefix(log.type)}</span>
              <span>{log.message}</span>
              {log.details && (
                <div className="ml-4 sm:ml-16 mt-1 text-muted-foreground text-xs break-words">
                  {log.details}
                </div>
              )}
            </div>
          ))
        )}
        {logs.length > 0 && (
          <div className="text-muted-foreground flex items-center gap-2 mt-2">
            <span>$</span>
            <span className="animate-terminal-cursor">_</span>
          </div>
        )}
      </div>
    </div>
  );
}
