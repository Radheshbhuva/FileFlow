import { useUploadStore } from '../../stores/uploadStore';
import { CloudLightning, Loader2, Play, Ban } from 'lucide-react';
import { uploadService } from '../../services/uploadService';

export default function UploadProgressTracker() {
  const { queue } = useUploadStore();

  const activeUploads = queue.filter((x) => x.status === 'uploading');
  const completedUploads = queue.filter((x) => x.status === 'completed');
  const totalProcessed = queue.filter((x) => x.status === 'completed' || x.status === 'failed' || x.status === 'cancelled');

  if (activeUploads.length === 0) return null;

  // Calculate overall progress weight
  const totalBytes = queue.reduce((sum, x) => sum + x.file.sizeBytes, 0);
  const uploadedBytes = queue.reduce((sum, x) => {
    if (x.status === 'completed') return sum + x.file.sizeBytes;
    if (x.status === 'uploading') return sum + x.file.sizeBytes * (x.progress / 100);
    return sum;
  }, 0);

  const overallProgress = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;

  // Average speed
  const totalSpeed = activeUploads.reduce((sum, x) => sum + (x.speedBytesPerSecond || 0), 0);
  const avgSpeedLabel =
    totalSpeed > 1048576
      ? `${(totalSpeed / 1048576).toFixed(1)} MB/s`
      : totalSpeed > 1024
      ? `${(totalSpeed / 1024).toFixed(0)} KB/s`
      : 'Calculating speed...';

  // Time remaining
  const maxTimeRemaining = Math.max(0, ...activeUploads.map((x) => x.estimatedSecondsRemaining || 0));
  const timeRemainingLabel =
    maxTimeRemaining > 0 ? `Est. time remaining: ${maxTimeRemaining}s` : 'Syncing chunks...';

  return (
    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5 shadow-soft space-y-4 h-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-sky-500/15 pb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4.5 w-4.5 text-sky-400 animate-spin" />
          <div className="text-xs">
            <h4 className="font-bold text-slate-100 leading-tight">Global Ingestion Progress</h4>
            <p className="text-[10px] text-sky-400/80 mt-0.5">
              Syncing {activeUploads.length} active {activeUploads.length === 1 ? 'file' : 'files'} ({completedUploads.length}/{queue.length} completed)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={uploadService.cancelAllUploads}
            className="rounded-lg bg-rose-500 hover:bg-rose-400 px-3 py-1.5 text-[10px] font-semibold text-white transition flex items-center gap-1"
          >
            <Ban className="h-3 w-3" /> Cancel All
          </button>
        </div>
      </div>

      {/* Progress metrics and details */}
      <div className="grid gap-4 sm:grid-cols-3 text-xs">
        <div className="space-y-1">
          <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Estimated Speed</span>
          <span className="text-sm font-bold text-slate-200 block font-mono">{avgSpeedLabel}</span>
        </div>

        <div className="space-y-1">
          <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">ETA Window</span>
          <span className="text-sm font-bold text-slate-200 block font-mono">{timeRemainingLabel}</span>
        </div>

        <div className="space-y-1">
          <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Footprint Ingested</span>
          <span className="text-sm font-bold text-slate-200 block font-mono">
            {(uploadedBytes / 1024 / 1024).toFixed(1)} MB / {(totalBytes / 1024 / 1024).toFixed(1)} MB
          </span>
        </div>
      </div>

      {/* Global Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between font-mono text-[10px] text-slate-400">
          <span>Overall Sync Ingestion</span>
          <span>{overallProgress}%</span>
        </div>
        <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden" role="progressbar" aria-valuenow={overallProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Global upload progress">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-200"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
