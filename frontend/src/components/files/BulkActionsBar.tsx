import { useSelectionStore } from '../../stores/fileStore';
import { X, Download, Share2, Archive, Trash2, FolderInput, Star, Tag } from 'lucide-react';

interface BulkActionsBarProps {
  onDownload: (ids: string[]) => void;
  onShare: (ids: string[]) => void;
  onArchive: (ids: string[]) => void;
  onDelete: (ids: string[]) => void;
}

export default function BulkActionsBar({
  onDownload,
  onShare,
  onArchive,
  onDelete
}: BulkActionsBarProps) {
  const { selectedIds, clearSelection } = useSelectionStore();

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-40 w-[90%] max-w-2xl -translate-x-1/2 rounded-2xl border border-slate-800 bg-slate-950/90 px-6 py-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        {/* Selected count info */}
        <div className="flex items-center justify-between sm:justify-start gap-3 border-b border-slate-800 pb-2 sm:border-0 sm:pb-0">
          <span className="font-semibold text-sky-400">
            {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'} selected
          </span>
          <button
            type="button"
            onClick={clearSelection}
            className="rounded p-1 text-slate-500 hover:bg-slate-900 hover:text-slate-300 transition"
            aria-label="Clear selections"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => onDownload(selectedIds)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2 hover:border-slate-700 hover:bg-slate-900 text-slate-300 hover:text-slate-100 transition"
            title="Download selected"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Download</span>
          </button>

          <button
            type="button"
            onClick={() => onShare(selectedIds)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2 hover:border-slate-700 hover:bg-slate-900 text-slate-300 hover:text-slate-100 transition"
            title="Share selected"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Share</span>
          </button>

          <button
            type="button"
            onClick={() => onArchive(selectedIds)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2 hover:border-slate-700 hover:bg-slate-900 text-slate-300 hover:text-slate-100 transition"
            title="Archive selected"
          >
            <Archive className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Archive</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2 text-slate-500 cursor-not-allowed opacity-50"
            disabled
            title="Move selected - coming soon"
          >
            <FolderInput className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Move</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2 text-slate-500 cursor-not-allowed opacity-50"
            disabled
            title="Tag selected - coming soon"
          >
            <Tag className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Tag</span>
          </button>

          <hr className="hidden sm:block border-slate-800 h-6 mx-1" />

          <button
            type="button"
            onClick={() => onDelete(selectedIds)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-950/35 border border-rose-900/30 px-2.5 py-2 text-rose-400 hover:bg-rose-900/30 hover:text-rose-300 hover:border-rose-800 transition ml-auto sm:ml-0"
            title="Delete selected"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
