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
    <div className="w-full max-w-2xl mx-auto">
      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('upload')}
          className={cn(
            "flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2",
            activeTab === 'upload'
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          <FolderOpen className="w-4 h-4" />
          Upload Folder
        </button>
        <button
          onClick={() => setActiveTab('github')}
          className={cn(
            "flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2",
            activeTab === 'github'
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          <Github className="w-4 h-4" />
          GitHub URL
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300",
            isDragOver 
              ? "border-primary bg-primary/10 scale-[1.02]" 
              : "border-border hover:border-primary/50 hover:bg-secondary/30",
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

          <div className="flex flex-col items-center gap-4">
            {isLoading ? (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            ) : (
              <div className="p-4 rounded-full bg-primary/10">
                <Upload className="w-8 h-8 text-primary" />
              </div>
            )}
            
            <div>
              <p className="text-lg font-medium text-foreground">
                {isDragOver ? 'Drop folder here' : 'Drag & drop a folder'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Supports all major programming languages and frameworks
            </p>
          </div>

          {isDragOver && (
            <div className="absolute inset-0 bg-primary/5 rounded-xl pointer-events-none" />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Github className="w-5 h-5 text-muted-foreground" />
            </div>
            <Input
              value={gitHubUrl}
              onChange={(e) => setGitHubUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="pl-12 h-14 text-base"
              onKeyDown={(e) => e.key === 'Enter' && handleGitHubSubmit()}
              disabled={isLoading}
            />
          </div>
          
          <Button
            onClick={handleGitHubSubmit}
            disabled={!gitHubUrl.trim() || isLoading}
            className="w-full h-12"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching Repository...
              </>
            ) : (
              <>
                <Github className="w-4 h-4" />
                Fetch Repository
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Public repositories only. For private repos, upload the folder directly.
          </p>
        </div>
      )}
    </div>
  );
}
