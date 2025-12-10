import { useState, useCallback, useRef } from 'react';
import { Upload, FolderOpen, Github, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  onGitHubUrl: (url: string) => void;
  isLoading?: boolean;
}

export function FileUploader({ onFilesSelected, onGitHubUrl, isLoading }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [gitHubUrl, setGitHubUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'github'>('upload');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const items = Array.from(e.dataTransfer.items);
    const files: File[] = [];

    const processEntry = async (entry: FileSystemEntry): Promise<void> => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        return new Promise((resolve) => {
          fileEntry.file((file) => {
            // Create a new file with the full path
            const fullPath = entry.fullPath.startsWith('/') 
              ? entry.fullPath.slice(1) 
              : entry.fullPath;
            Object.defineProperty(file, 'webkitRelativePath', {
              value: fullPath,
              writable: false,
            });
            files.push(file);
            resolve();
          });
        });
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const dirReader = dirEntry.createReader();
        return new Promise((resolve) => {
          const readEntries = () => {
            dirReader.readEntries(async (entries) => {
              if (entries.length === 0) {
                resolve();
              } else {
                for (const entry of entries) {
                  await processEntry(entry);
                }
                readEntries();
              }
            });
          };
          readEntries();
        });
      }
    };

    Promise.all(
      items
        .filter(item => item.kind === 'file')
        .map(item => {
          const entry = item.webkitGetAsEntry();
          return entry ? processEntry(entry) : Promise.resolve();
        })
    ).then(() => {
      if (files.length > 0) {
        onFilesSelected(files);
      }
    });
  }, [onFilesSelected]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files));
    }
  }, [onFilesSelected]);

  const handleGitHubSubmit = useCallback(() => {
    if (gitHubUrl.trim()) {
      onGitHubUrl(gitHubUrl.trim());
    }
  }, [gitHubUrl, onGitHubUrl]);

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6 sm:mb-8 bg-secondary/30 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('upload')}
          className={cn(
            "flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm",
            activeTab === 'upload'
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Upload Folder</span>
          <span className="sm:hidden">Upload</span>
        </button>
        <button
          onClick={() => setActiveTab('github')}
          className={cn(
            "flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm",
            activeTab === 'github'
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">GitHub URL</span>
          <span className="sm:hidden">GitHub</span>
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-lg sm:rounded-xl p-6 sm:p-12 text-center cursor-pointer transition-all duration-300 glass-effect hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10",
            isDragOver 
              ? "border-primary bg-primary/10 scale-[1.02]" 
              : "border-border/60",
            isLoading && "pointer-events-none opacity-50"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            // @ts-ignore - webkitdirectory is a valid attribute
            webkitdirectory="true"
            directory=""
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3 sm:gap-4">
            {isLoading ? (
              <div className="p-3 sm:p-4 rounded-full bg-primary/20">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 group-hover:from-primary/40 group-hover:to-accent/30 transition-all duration-300">
                <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
            )}
            
            <div className="px-2">
              <p className="text-base sm:text-lg font-semibold text-foreground">
                {isDragOver ? 'Drop folder here' : 'Drag & drop your folder'}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                or tap to browse your device
              </p>
            </div>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground px-3 sm:px-4 py-2 rounded-full bg-secondary/30">
                🎯 All major languages supported
              </p>
            </div>
          </div>

          {isDragOver && (
            <div className="absolute inset-0 bg-primary/5 rounded-lg sm:rounded-xl pointer-events-none" />
          )}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="relative">
            <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2">
              <Github className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            </div>
            <Input
              value={gitHubUrl}
              onChange={(e) => setGitHubUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              className="pl-9 sm:pl-12 h-11 sm:h-14 text-sm sm:text-base border-border/60 hover:border-primary/40 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleGitHubSubmit()}
              disabled={isLoading}
            />
          </div>
          
          <Button
            onClick={handleGitHubSubmit}
            disabled={!gitHubUrl.trim() || isLoading}
            className="w-full h-11 sm:h-12 font-semibold text-sm sm:text-base"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="hidden sm:inline">Fetching Repository...</span>
                <span className="sm:hidden">Fetching...</span>
              </>
            ) : (
              <>
                <Github className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Fetch Repository</span>
                <span className="sm:hidden">Fetch</span>
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center bg-secondary/20 p-2 sm:p-3 rounded-lg">
            📝 Public repos only. Use upload for private repos.
          </p>
        </div>
      )}
    </div>
  );
}
