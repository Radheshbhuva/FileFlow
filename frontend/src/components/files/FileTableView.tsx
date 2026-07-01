import { useState } from 'react';
import type { File } from '../../types/files';
import { useSelectionStore, useSortStore, usePreviewStore } from '../../stores/fileStore';
import { getFileIcon } from './FileGridView';
import SecurityScoreBadge from './SecurityScoreBadge';
import { MoreVertical, Download, Share2, Edit2, Trash2, Archive, Eye, Info, ChevronUp, ChevronDown, ChevronsUpDown, Star } from 'lucide-react';

interface FileTableViewProps {
  files: File[];
  onRename: (file: File) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onShare: (file: File) => void;
  onDownload: (file: File) => void;
}

export default function FileTableView({
  files,
  onRename,
  onDelete,
  onArchive,
  onShare,
  onDownload
}: FileTableViewProps) {
  const { selectedIds, toggleSelect, selectAll, clearSelection } = useSelectionStore();
  const { sortBy, sortOrder, setSorting } = useSortStore();
  const { openPreview, openDetails } = usePreviewStore();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const isAllSelected = files.length > 0 && files.every((f) => selectedIds.includes(f.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAll(files.map((f) => f.id));
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSorting(column, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSorting(column, 'desc');
    }
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <ChevronsUpDown className="h-3 w-3 opacity-30 group-hover:opacity-60 transition" />;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-3 w-3 text-sky-400" />
    ) : (
      <ChevronDown className="h-3 w-3 text-sky-400" />
    );
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20 shadow-soft">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 select-none">
          <tr>
            <th className="px-4 py-3.5 w-10">
              <label className="flex items-center cursor-pointer">
                <span className="sr-only">Select all files</span>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-sky-500/50 h-4 w-4"
                />
              </label>
            </th>
            <th className="px-4 py-3.5 font-semibold">
              <button
                type="button"
                onClick={() => handleSort('name')}
                className="group inline-flex items-center gap-1.5 hover:text-slate-200 focus:outline-none"
              >
                File Name
                {renderSortIcon('name')}
              </button>
            </th>
            <th className="px-4 py-3.5 font-semibold">
              <button
                type="button"
                onClick={() => handleSort('type')}
                className="group inline-flex items-center gap-1.5 hover:text-slate-200 focus:outline-none"
              >
                Type
                {renderSortIcon('type')}
              </button>
            </th>
            <th className="px-4 py-3.5 font-semibold">Owner</th>
            <th className="px-4 py-3.5 font-semibold">
              <button
                type="button"
                onClick={() => handleSort('size')}
                className="group inline-flex items-center gap-1.5 hover:text-slate-200 focus:outline-none"
              >
                Size
                {renderSortIcon('size')}
              </button>
            </th>
            <th className="px-4 py-3.5 font-semibold hidden md:table-cell">
              <button
                type="button"
                onClick={() => handleSort('uploadDate')}
                className="group inline-flex items-center gap-1.5 hover:text-slate-200 focus:outline-none"
              >
                Uploaded
                {renderSortIcon('uploadDate')}
              </button>
            </th>
            <th className="px-4 py-3.5 font-semibold hidden lg:table-cell">
              <button
                type="button"
                onClick={() => handleSort('lastModified')}
                className="group inline-flex items-center gap-1.5 hover:text-slate-200 focus:outline-none"
              >
                Last Modified
                {renderSortIcon('lastModified')}
              </button>
            </th>
            <th className="px-4 py-3.5 font-semibold">
              <button
                type="button"
                onClick={() => handleSort('securityScore')}
                className="group inline-flex items-center gap-1.5 hover:text-slate-200 focus:outline-none"
              >
                Security Score
                {renderSortIcon('securityScore')}
              </button>
            </th>
            <th className="px-4 py-3.5 font-semibold">Status</th>
            <th className="px-4 py-3.5 text-right w-10">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/10">
          {files.map((file) => {
            const isSelected = selectedIds.includes(file.id);
            const isOpen = activeDropdown === file.id;

            return (
              <tr
                key={file.id}
                className={`transition duration-150 hover:bg-slate-800/30 ${
                  isSelected ? 'bg-sky-500/5 hover:bg-sky-500/10' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <label className="flex items-center cursor-pointer">
                    <span className="sr-only">Select {file.name}</span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(file.id)}
                      className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-sky-500/50 h-4 w-4"
                    />
                  </label>
                </td>
                <td className="px-4 py-3 font-medium text-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="rounded-lg bg-slate-950 p-1.5 border border-slate-850 shrink-0">
                      {getFileIcon(file.type)}
                    </span>
                    <div
                      onClick={() => openDetails(file)}
                      className="cursor-pointer text-slate-200 hover:text-sky-400 font-semibold flex items-center gap-1.5 truncate text-left focus:outline-none max-w-[160px] sm:max-w-[240px]"
                      title={file.name}
                    >
                      {file.isFavorite && <Star className="h-3.5 w-3.5 text-amber-400 fill-current shrink-0" />}
                      <span className="truncate">{file.name}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400 uppercase">{file.extension}</td>
                <td className="px-4 py-3 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-sky-500/15 text-[10px] font-semibold text-sky-400 shrink-0">
                      {file.owner.initials}
                    </span>
                    <span className="truncate max-w-[100px]" title={file.owner.name}>
                      {file.owner.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300">{file.sizeLabel}</td>
                <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                  {new Date(file.uploadDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </td>
                <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                  {new Date(file.lastModified).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </td>
                <td className="px-4 py-3">
                  <SecurityScoreBadge security={file.security} showTooltip={false} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                      file.status === 'ready'
                        ? 'text-emerald-500'
                        : file.status === 'processing'
                        ? 'text-amber-500 animate-pulse'
                        : 'text-rose-500'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        file.status === 'ready'
                          ? 'bg-emerald-500'
                          : file.status === 'processing'
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-rose-500'
                      }`}
                    />
                    {file.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="relative inline-block text-left">
                    <button
                      type="button"
                      onClick={() => toggleDropdown(file.id)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus:outline-none"
                      aria-haspopup="menu"
                      aria-expanded={isOpen}
                      aria-label="Actions dropdown menu"
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
