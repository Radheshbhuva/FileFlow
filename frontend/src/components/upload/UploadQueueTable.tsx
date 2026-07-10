import { useUploadStore } from '../../stores/uploadStore';
import { uploadService } from '../../services/uploadService';
import { getFileIcon } from '../files/FileGridView';
import { Play, Ban, Trash2, Info, CheckCircle, AlertCircle, RefreshCw, XCircle } from 'lucide-react';

export default function UploadQueueTable() {
  const { queue, removeFromQueue, setActiveDetailsItem, clearQueue } = useUploadStore();

  const handleStartIndividual = (id: string) => {
    const item = queue.find((x) => x.id === id);
    if (item) uploadService.startUpload(item);
  };

  const handleCancelIndividual = (id: string) => {
    uploadService.cancelUpload(id);
  };

  const handleClearAll = () => {
    uploadService.cancelAllUploads();
    clearQueue();
  };

  if (queue.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-soft space-y-4 h-auto">
      {/* Table Toolbar Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-100">Upload Ingestion Queue</h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-450 leading-none">
            {queue.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={uploadService.startAllUploads}
            className="rounded-lg bg-sky-500 hover:bg-sky-400 px-3 py-1.5 text-[10px] font-semibold text-white transition"
          >
            Upload All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-lg bg-slate-950 border border-slate-805 hover:bg-slate-900 px-3 py-1.5 text-[10px] font-semibold text-slate-300 hover:text-slate-100 transition"
          >
            Clear Queue
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs" role="table">
          <thead>
            <tr className="border-b border-slate-850/60 text-slate-500 text-[9.5px] font-semibold uppercase tracking-wider">
              <th className="py-2.5 pr-4">File Name</th>
              <th className="py-2.5 pr-4">Size / Type</th>
              <th className="py-2.5 pr-4">Ingestion Status</th>
              <th className="py-2.5 pr-4">Progress Tracker</th>
              <th className="py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/40">
            {queue.map((item) => {
              let statusBadge = null;
              if (item.status === 'completed') {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-450 bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded-lg">
                    <CheckCircle className="h-3 w-3" /> Ingested
                  </span>
                );
              } else if (item.status === 'failed') {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/15 px-2 py-0.5 rounded-lg">
                    <AlertCircle className="h-3 w-3" /> Failed
                  </span>
                );
              } else if (item.status === 'cancelled') {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-slate-500 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-lg">
                    <XCircle className="h-3 w-3" /> Cancelled
                  </span>
                );
              } else if (item.status === 'uploading') {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/15 px-2 py-0.5 rounded-lg">
                    <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Ingesting
                  </span>
                );
              } else {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">
                    Pending
                  </span>
                );
              }

              return (
                <tr key={item.id} className="hover:bg-slate-900/10 transition duration-150">
                  {/* File Name */}
                  <td className="py-3 pr-4 max-w-[200px]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="shrink-0">{getFileIcon(item.file.type)}</span>
                      <span className="font-semibold text-slate-200 truncate" title={item.file.name}>
                        {item.file.name}
                      </span>
                    </div>
                  </td>

                  {/* Size & Type */}
                  <td className="py-3 pr-4 font-mono text-[10px] text-slate-400">
                    <span className="block font-semibold">{item.file.sizeLabel}</span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block mt-0.5">
                      {item.file.extension || 'file'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 pr-4">{statusBadge}</td>

                  {/* Progress Bar & speeds */}
                  <td className="py-3 pr-4 min-w-[150px]">
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-slate-500">
                        <span>{item.progress}%</span>
                        {item.status === 'uploading' && item.speedBytesPerSecond !== undefined && (
                          <span>
                            {(item.speedBytesPerSecond / 1024 / 1024).toFixed(1)} MB/s •{' '}
                            {item.estimatedSecondsRemaining}s left
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 w-full bg-slate-850 rounded-full overflow-hidden" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${
                            item.status === 'completed'
                              ? 'bg-emerald-500'
                              : item.status === 'failed'
                              ? 'bg-rose-500'
                              : item.status === 'cancelled'
                              ? 'bg-slate-500'
                              : 'bg-sky-500'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveDetailsItem(item)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                        title="View detailed audit specifications"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>

                      {item.status === 'uploading' ? (
                        <button
                          type="button"
                          onClick={() => handleCancelIndividual(item.id)}
                          className="rounded p-1 text-rose-400 hover:bg-rose-500/10 transition"
                          title="Cancel ingestion"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      ) : (item.status === 'pending' || item.status === 'cancelled' || item.status === 'failed') ? (
                        <button
                          type="button"
                          onClick={() => handleStartIndividual(item.id)}
                          className="rounded p-1 text-sky-400 hover:bg-sky-500/10 transition"
                          title="Start ingestion"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => removeFromQueue(item.id)}
                        className="rounded p-1 text-slate-550 hover:bg-rose-500/10 hover:text-rose-450 transition"
                        title="Remove from workspace"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
