import { useUploadStore } from '../../stores/uploadStore';
import { useFilesStore } from '../../stores/fileStore';
import { getFileIcon } from '../files/FileGridView';
import { Loader2, CheckCircle2, ArrowUpRight, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecentUploadsWidget() {
  const { queue } = useUploadStore();
  const { files } = useFilesStore();

  // Active uploads
  const activeUploads = queue.filter((u) => u.status === 'uploading');

  // Recently completed uploads from files store - top 4 items for layout density
  const completedUploads = [...files]
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
    .slice(0, 3);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-soft flex flex-col justify-between h-auto space-y-4">
      <div className="space-y-4 w-full">
        {/* Widget Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <UploadCloud className="h-4.5 w-4.5 text-sky-400" />
            Upload Activity Hub
          </h3>
          <Link
            to="/upload"
            className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-0.5"
          >
            Upload Center
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Active Uploads list */}
        {activeUploads.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold text-slate-550 uppercase tracking-wider">
              Uploading ({activeUploads.length})
            </h4>
            <div className="space-y-2">
              {activeUploads.map((up) => (
                <div key={up.id} className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 truncate pr-3 flex items-center gap-1.5 animate-pulse">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400 shrink-0" />
                      {up.file.name}
                    </span>
                    <span className="font-mono text-slate-400 shrink-0">{up.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={up.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                    <div className="h-full bg-sky-500 rounded-full transition-all duration-200" style={{ width: `${up.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Completed List */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Completed Uploads
          </h4>

          {completedUploads.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-850 rounded-xl">
              <p className="text-xs text-slate-500">No recent uploads completed.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedUploads.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-xl border border-slate-850 bg-slate-950/20 p-2.5 hover:border-slate-750 transition text-xs gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-4 flex-1">
                    <span className="rounded-lg bg-slate-950 p-1.5 border border-slate-850 shrink-0" aria-hidden="true">
                      {getFileIcon(file.type)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-250 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {new Date(file.uploadDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })} at {new Date(file.uploadDate).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-450 shrink-0 text-[9.5px] font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Ready</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
