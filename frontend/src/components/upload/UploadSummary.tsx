import { useUploadStore } from '../../stores/uploadStore';
import { useFilterStore } from '../../stores/fileStore';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, RefreshCw, Folder, FileCheck } from 'lucide-react';

export default function UploadSummary() {
  const { summary, clearQueue } = useUploadStore();
  const { resetFilters, setFilters } = useFilterStore();
  const navigate = useNavigate();

  if (!summary) return null;

  const handleGoToMyFiles = () => {
    resetFilters();
    navigate('/my-files');
  };

  const handleViewStagedFiles = () => {
    resetFilters();
    setFilters({ recentlyModified: true }); // filters newly modified files
    navigate('/my-files');
  };

  const totalSizeMB = (summary.totalSizeUploadedBytes / 1048576).toFixed(1);

  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6 shadow-soft space-y-6 h-auto">
      {/* Banner Title */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-emerald-500/10 p-2.5 border border-emerald-500/25 shrink-0">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        </div>
        <div className="text-xs">
          <h4 className="text-sm font-bold text-slate-100 leading-tight">Ingestion Ingest Completed</h4>
          <p className="text-slate-400 mt-1 leading-normal">
            Staged queue files have successfully passed security compliance and have been registered in the workspace registry.
          </p>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-850 bg-slate-950/20 p-4">
          <span className="block text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">Ingested</span>
          <span className="text-base font-bold text-slate-200 mt-1.5 block font-mono">{summary.filesUploaded} Files</span>
        </div>

        <div className="rounded-xl border border-slate-850 bg-slate-950/20 p-4">
          <span className="block text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">Failed / Cancelled</span>
          <span className="text-base font-bold text-slate-200 mt-1.5 block font-mono">{summary.filesFailed} Items</span>
        </div>

        <div className="rounded-xl border border-slate-850 bg-slate-950/20 p-4">
          <span className="block text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">Total Footprint</span>
          <span className="text-base font-bold text-slate-200 mt-1.5 block font-mono">{totalSizeMB} MB</span>
        </div>

        <div className="rounded-xl border border-slate-850 bg-slate-950/20 p-4">
          <span className="block text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">Duration Ingest</span>
          <span className="text-base font-bold text-slate-200 mt-1.5 block font-mono">{summary.totalDurationSeconds.toFixed(1)}s</span>
        </div>

        <div className="rounded-xl border border-slate-850 bg-slate-950/20 p-4">
          <span className="block text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">Success Rate</span>
          <span className="text-base font-bold text-slate-200 mt-1.5 block font-mono">{summary.successRate}%</span>
        </div>
      </div>

      {/* Success Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={clearQueue}
          className="rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-slate-100 transition flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="h-4 w-4" />
          Ingest More Files
        </button>

        <button
          type="button"
          onClick={handleViewStagedFiles}
          className="rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-350 hover:text-slate-100 transition flex items-center justify-center gap-1.5"
        >
          <FileCheck className="h-4 w-4 text-sky-400" />
          View Ingested Files
        </button>

        <button
          type="button"
          onClick={handleGoToMyFiles}
          className="rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2.5 text-xs font-semibold text-white shadow-soft transition flex items-center justify-center gap-1.5"
        >
          <Folder className="h-4 w-4" />
          Go to My Files
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
