import { useState } from 'react';
import type { File } from '../../types/files';
import { useSelectionStore, usePreviewStore } from '../../stores/fileStore';
import SecurityScoreBadge from './SecurityScoreBadge';
import { getFileIcon } from './FileGridView';
import { MoreVertical, Download, Share2, Edit2, Trash2, Archive, Eye, Info, Star } from 'lucide-react';

interface FileListViewProps {
  files: File[];
  onRename: (file: File) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onShare: (file: File) => void;
  onDownload: (file: File) => void;
}

export default function FileListView({
  files,
  onRename,
  onDelete,
  onArchive,
  onShare,
  onDownload
}: FileListViewProps) {
  const { selectedIds, toggleSelect } = useSelectionStore();
  const { openPreview, openDetails } = usePreviewStore();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  return (
    <div className="space-y-2">
      {files.map((file) => {
        const isSelected = selectedIds.includes(file.id);
        const isOpen = activeDropdown === file.id;

        return (
          <div
            key={file.id}
            className={`group flex items-center justify-between rounded-xl border bg-slate-900/40 px-4 py-3 transition duration-150 hover:border-slate-700/80 hover:bg-slate-900/60 ${
              isSelected ? 'border-sky-500 bg-sky-500/5 hover:border-sky-400' : 'border-slate-800/90'
            }`}
          >
            {/* Selection Checkbox & Icon & Details */}
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
              <label className="flex items-center cursor-pointer shrink-0">
                <span className="sr-only">Select {file.name}</span>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(file.id)}
                  className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-sky-500/50 h-4 w-4"
                />
              </label>

              <div className="rounded-lg bg-slate-950 p-2 border border-slate-850 shrink-0 group-hover:scale-105 transition-transform">
                {getFileIcon(file.type)}
              </div>

              <div className="min-w-0">
                <div
                  onClick={() => openDetails(file)}
                  className="cursor-pointer font-semibold text-slate-200 hover:text-sky-400 flex items-center gap-1.5 truncate text-sm leading-none"
                  title={file.name}
                >
                  {file.isFavorite && <Star className="h-3.5 w-3.5 text-amber-400 fill-current shrink-0" />}
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                  <span className="uppercase">{file.extension}</span>
                  <span>•</span>
                  <span>{file.sizeLabel}</span>
                  <span>•</span>
                  <span>Owner: {file.owner.name}</span>
                </div>
              </div>
            </div>

            {/* Tags (Desktop only) */}
            <div className="hidden lg:flex items-center gap-1.5 flex-wrap max-w-xs justify-end mr-4">
              {file.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded bg-slate-850 px-1.5 py-0.5 text-[10px] font-medium text-slate-400"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Score, Status & Actions */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden sm:block">
                <SecurityScoreBadge security={file.security} showTooltip={false} />
              </div>

              <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-medium ${
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

              {/* Actions */}
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
                      className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-850 bg-slate-950 py-1.5 shadow-2xl"
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
          </div>
        );
      })}
    </div>
  );
}
