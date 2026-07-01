import { useState } from 'react';
import { usePreviewStore } from '../../stores/fileStore';
import { getFileIcon } from '../files/FileGridView';
import { Zap, Eye, Download, Info, Share2, Star } from 'lucide-react';
import type { FileType } from '../../types/files';

interface ProductivityInsightsProps {
  data: {
    mostAccessedFiles: Array<{ id: string; fileName: string; downloadCount: number }>;
    mostSharedFiles: Array<{ id: string; fileName: string; shareCount: number }>;
    favoriteFiles: Array<{ id: string; fileName: string }>;
  };
}

function mapExtensionToType(ext: string): FileType {
  const e = ext.toLowerCase().replace('.', '');
  if (['pdf'].includes(e)) return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(e)) return 'image';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(e)) return 'spreadsheet';
  if (['doc', 'docx', 'odt', 'rtf'].includes(e)) return 'document';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) return 'archive';
  if (['txt', 'md', 'html', 'css', 'js', 'ts', 'json', 'yaml', 'yml'].includes(e)) return 'text';
  return 'other';
}

export default function ProductivityInsightsWidget({ data }: ProductivityInsightsProps) {
  const { openDetails } = usePreviewStore();
  const [activeTab, setActiveTab] = useState<'accessed' | 'shared' | 'favorites'>('accessed');

  const filesToRender =
    activeTab === 'accessed'
      ? data.mostAccessedFiles.slice(0, 4)
      : activeTab === 'shared'
      ? data.mostSharedFiles.slice(0, 4)
      : data.favoriteFiles.slice(0, 4);

  const handleAudit = (file: { id: string; fileName: string; downloadCount?: number; shareCount?: number }) => {
    const ext = file.fileName.split('.').pop() || 'bin';
    const fallbackFile: any = {
      id: file.id,
      name: file.fileName,
      sizeBytes: 0,
      sizeLabel: 'Unknown size',
      type: mapExtensionToType(ext),
      uploadDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isFavorite: activeTab === 'favorites',
      downloadCount: file.downloadCount || 0,
      shareCount: file.shareCount || 0,
      sharedStatus: 'private',
      security: {
        score: 100,
        grade: 'A',
        factors: []
      }
    };
    openDetails(fallbackFile);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-soft flex flex-col justify-between h-auto space-y-4">
      {/* Widget Header & Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Zap className="h-4.5 w-4.5 text-sky-400" />
          Productivity Insights
        </h3>

        {/* Tabs Switcher */}
        <div className="flex rounded-lg border border-slate-855 bg-slate-950 p-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => setActiveTab('accessed')}
            className={`rounded-md px-2.5 py-1 font-semibold transition ${
              activeTab === 'accessed' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            Popular
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shared')}
            className={`rounded-md px-2.5 py-1 font-semibold transition ${
              activeTab === 'shared' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            Shared
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`rounded-md px-2.5 py-1 font-semibold transition ${
              activeTab === 'favorites' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            Favorites
          </button>
        </div>
      </div>

      {/* Lists View */}
      <div className="space-y-2">
        {filesToRender.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-850 rounded-xl">
            <p className="text-xs text-slate-500">No items found.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filesToRender.map((file) => {
              const ext = file.fileName.split('.').pop() || 'bin';
              const downloadCount = (file as any).downloadCount || 0;
              const shareCount = (file as any).shareCount || 0;

              return (
                <div
                  key={file.id}
                  onClick={() => handleAudit(file)}
                  className="flex items-center justify-between p-2 rounded-xl border border-slate-850 bg-slate-950/20 hover:border-slate-750 hover:bg-slate-900/30 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-4">
                    <span className="shrink-0">{getFileIcon(mapExtensionToType(ext))}</span>
                    <span className="text-xs font-semibold text-slate-300 truncate" title={file.fileName}>
                      {file.fileName}
                    </span>
                  </div>
                  
                  <div className="shrink-0 text-[10px] text-slate-500 font-mono font-semibold flex items-center gap-1">
                    {activeTab === 'accessed' ? (
                      <>
                        <Download className="h-3 w-3 text-sky-400" />
                        <span>{downloadCount} dl</span>
                      </>
                    ) : activeTab === 'shared' ? (
                      <>
                        <Share2 className="h-3 w-3 text-indigo-400" />
                        <span>{shareCount} links</span>
                      </>
                    ) : (
                      <>
                        <Star className="h-3 w-3 text-amber-400 fill-current" />
                        <span>Pinned</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

