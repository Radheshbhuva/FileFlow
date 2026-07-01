import { Link } from 'react-router-dom';
import { Upload, FolderPlus, Database } from 'lucide-react';

interface FileWorkspaceHeaderProps {
  fileCount: number;
  storageUsedLabel: string;
  storageMaxLabel: string;
  storagePercentage: number;
}

export default function FileWorkspaceHeader({
  fileCount,
  storageUsedLabel,
  storageMaxLabel,
  storagePercentage
}: FileWorkspaceHeaderProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-slate-800/80 pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">My Files</h1>
        <p className="text-sm text-slate-400">Manage, organize, secure, and share your files.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full md:w-auto">
        {/* Storage status summary */}
        <div className="flex flex-col gap-1.5 bg-slate-900/40 border border-slate-800/80 rounded-xl px-4 py-2.5 sm:w-52">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-sky-400" />
              Storage ({fileCount} files)
            </span>
            <span className="font-semibold text-slate-200">
              {storageUsedLabel} / {storageMaxLabel}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden" role="presentation">
            <div className="h-full bg-sky-500 rounded-full" style={{ width: `${storagePercentage}%` }} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-sm font-semibold text-slate-400 cursor-not-allowed"
            disabled
            aria-label="Create folder - coming soon"
          >
            <FolderPlus className="h-4 w-4" />
            <span>New Folder</span>
            <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-slate-500">
              Soon
            </span>
          </button>

          <Link
            to="/upload"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 shadow-lg shadow-sky-600/10"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Files</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
