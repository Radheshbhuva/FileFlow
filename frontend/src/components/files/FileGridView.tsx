import { useState } from 'react';
import type { File } from '../../types/files';
import { useSelectionStore, usePreviewStore } from '../../stores/fileStore';
import SecurityScoreBadge from './SecurityScoreBadge';
import { MoreVertical, Download, Share2, Edit2, Trash2, Archive, Eye, Info, FileText, Image as ImageIcon, FileSpreadsheet, FileArchive, FileCode, FileQuestion, Star } from 'lucide-react';

interface FileGridViewProps {
  files: File[];
  onRename: (file: File) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onShare: (file: File) => void;
  onDownload: (file: File) => void;
}

export const getFileIcon = (type: File['type']) => {
  switch (type) {
    case 'pdf':
      return <FileText className="h-8 w-8 text-rose-500" />;
    case 'image':
      return <ImageIcon className="h-8 w-8 text-emerald-500" />;
    case 'spreadsheet':
      return <FileSpreadsheet className="h-8 w-8 text-teal-500" />;
    case 'document':
      return <FileText className="h-8 w-8 text-blue-500" />;
    case 'archive':
      return <FileArchive className="h-8 w-8 text-amber-500" />;
    case 'text':
      return <FileCode className="h-8 w-8 text-indigo-500" />;
    default:
      return <FileQuestion className="h-8 w-8 text-slate-500" />;
  }
};

export default function FileGridView({
  files,
  onRename,
  onDelete,
  onArchive,
  onShare,
  onDownload
}: FileGridViewProps) {
  const { selectedIds, toggleSelect } = useSelectionStore();
  const { openPreview, openDetails } = usePreviewStore();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {files.map((file) => {
        const isSelected = selectedIds.includes(file.id);
        const isOpen = activeDropdown === file.id;

        return (
          <div
            key={file.id}
            className={`group relative flex flex-col justify-between rounded-2xl border bg-slate-900/40 p-4 transition-all duration-200 hover:border-slate-700/80 hover:bg-slate-900/60 shadow-soft ${
              isSelected ? 'border-sky-500 bg-sky-500/5 hover:border-sky-400' : 'border-slate-800/90'
            }`}
          >
            {/* Header / Selection & Actions */}
            <div className="flex items-start justify-between gap-2">
              <label className="flex items-center cursor-pointer">
                <span className="sr-only">Select {file.name}</span>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(file.id)}
                  className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-sky-500/50 h-4 w-4"
                />
              </label>

              {/* Actions Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown(file.id)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  aria-haspopup="menu"
                  aria-expanded={isOpen}
                  aria-label="File actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {isOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={() => setActiveDropdown(null)}
                    />
                    <div
                      role="menu"
                      className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-850 bg-slate-950 py-1.5 shadow-2xl animate-in fade-in duration-100"
                    >
                      <button
                        role="menuitem"
                        onClick={() => {
                          setActiveDropdown(null);
                          openPreview(file);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800"
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => {
                          setActiveDropdown(null);
                          openDetails(file);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800"
                      >
                        <Info className="h-3.5 w-3.5" /> View Details
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => {
                          setActiveDropdown(null);
                          // Import useFilesStore directly
                          import('../../stores/fileStore').then(({ useFilesStore }) => {
                            useFilesStore.getState().toggleFavorite(file.id);
                          });
                          import('../../stores/activityStore').then(({ useActivityStore }) => {
                            useActivityStore.getState().logActivity(
                              'favorite',
                              file.isFavorite ? `Removed "${file.name}" from favorites` : `Added "${file.name}" to favorites`
                            );
                          });
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800"
                      >
                        <Star className={`h-3.5 w-3.5 ${file.isFavorite ? 'text-amber-400 fill-current' : ''}`} />
                        {file.isFavorite ? 'Unfavorite' : 'Favorite'}
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => {
                          setActiveDropdown(null);
                          onDownload(file);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => {
                          setActiveDropdown(null);
                          onShare(file);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800"
                      >
                        <Share2 className="h-3.5 w-3.5" /> Share
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => {
                          setActiveDropdown(null);
                          onRename(file);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Rename
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => {
                          setActiveDropdown(null);
                          onArchive(file.id);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800"
                      >
                        <Archive className="h-3.5 w-3.5" /> Archive
                      </button>
                      <hr className="border-slate-850 my-1" />
                      <button
                        role="menuitem"
                        onClick={() => {
                          setActiveDropdown(null);
                          onDelete(file.id);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-400 hover:bg-slate-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Thumbnail/Icon Row */}
            <div className="my-4 flex flex-col items-center justify-center py-2">
              <div className="rounded-2xl bg-slate-950 p-4 border border-slate-850 shadow-inner group-hover:scale-105 transition-transform duration-200">
                {getFileIcon(file.type)}
              </div>
            </div>

            {/* Title / Metadata */}
            <div className="space-y-1.5 min-w-0">
              <div
                onClick={() => openDetails(file)}
                className="cursor-pointer font-semibold text-slate-200 hover:text-sky-400 flex items-center gap-1.5 leading-tight"
                title={file.name}
              >
                {file.isFavorite && <Star className="h-3.5 w-3.5 text-amber-400 fill-current shrink-0" />}
                <span className="truncate text-sm">{file.name}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span>{file.sizeLabel}</span>
                <span>
                  {new Date(file.lastModified).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Footer / Score & Status */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-850/80 pt-3">
              <SecurityScoreBadge security={file.security} showTooltip={false} />

              <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                file.status === 'ready'
                  ? 'text-emerald-500'
                  : file.status === 'processing'
                  ? 'text-amber-500 animate-pulse'
                  : 'text-rose-500'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  file.status === 'ready'
                    ? 'bg-emerald-500'
                    : file.status === 'processing'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-rose-500'
                }`} />
                {file.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
