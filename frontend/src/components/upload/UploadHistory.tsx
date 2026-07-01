import { useUploadStore } from '../../stores/uploadStore';
import { getFileIcon } from '../files/FileGridView';
import { Trash2, Info, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function UploadHistory() {
  const { history, clearHistory, setActiveDetailsItem } = useUploadStore();

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-soft text-center space-y-3">
        <div className="mx-auto rounded-xl bg-slate-850 p-2.5 border border-slate-800 w-11 h-11 flex items-center justify-center text-slate-500">
          <Clock className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-300">No Ingestion History</h4>
          <p className="text-[10px] text-slate-500 max-w-[240px] mx-auto leading-normal">
            Upload files in the current session to view security checks and processing status history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-soft space-y-4">
      {/* Title / Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-100">Session Ingestion History</h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-450 leading-none">
            {history.length}
          </span>
        </div>
        <button
          type="button"
          onClick={clearHistory}
          className="rounded-lg bg-slate-950 border border-slate-805 hover:bg-slate-900 px-3 py-1.5 text-[10px] font-semibold text-slate-350 hover:text-slate-100 transition flex items-center gap-1.5"
          title="Clear local session history"
        >
          <Trash2 className="h-3 w-3" />
          Clear History
        </button>
      </div>

      {/* History List */}
      <div className="max-h-[320px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
        {history.map((item) => {
          const isCompleted = item.status === 'completed';
          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-850/60 bg-slate-900/20 hover:border-slate-800 transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0">{getFileIcon(item.file.type)}</span>
                <div className="min-w-0">
                  <span
                    className="font-semibold text-slate-200 text-xs truncate block hover:text-sky-400 cursor-pointer"
                    title={item.file.name}
                    onClick={() => setActiveDetailsItem(item)}
                  >
                    {item.file.name}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[9px] text-slate-500 font-semibold">
                      {item.file.sizeLabel}
                    </span>
                    <span className="text-[9px] text-slate-650">•</span>
                    <span className="text-[9px] text-slate-500 uppercase font-semibold">
                      {item.file.extension || 'file'}
                    </span>
                    <span className="text-[9px] text-slate-650">•</span>
                    <div className="flex items-center gap-1">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-450">
                          <CheckCircle className="h-2.5 w-2.5" /> Ingested
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-rose-450">
                          <XCircle className="h-2.5 w-2.5" /> Failed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                <button
                  type="button"
                  onClick={() => setActiveDetailsItem(item)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-850 hover:text-slate-200 transition"
                  title="View detailed audit specifications"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
