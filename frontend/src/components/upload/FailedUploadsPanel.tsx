import { useUploadStore } from '../../stores/uploadStore';
import { useFilesStore } from '../../stores/fileStore';
import { uploadService } from '../../services/uploadService';
import { AlertTriangle, Trash2, RefreshCw, Layers, CheckCircle } from 'lucide-react';

export default function FailedUploadsPanel() {
  const { validationErrors, removeValidationError, clearValidationErrors } = useUploadStore();
  const { files, deleteFiles } = useFilesStore();

  if (validationErrors.length === 0) return null;

  const handleResolveDuplicate = (id: string, fileName: string) => {
    // Overwrite/Replace resolution: Remove the existing duplicate file, then remove error so user can re-stage.
    const duplicate = files.find((f) => f.name.toLowerCase() === fileName.toLowerCase());
    if (duplicate) {
      deleteFiles([duplicate.id]);
    }
    removeValidationError(id);
    // Alert info
    alert(`Existing document "${fileName}" removed. You can now re-add the file to the ingestion zone.`);
  };

  return (
    <div className="rounded-2xl border border-rose-900/35 bg-rose-950/5 p-5 shadow-soft space-y-4 h-auto">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-rose-950/20 pb-3">
        <h3 className="text-sm font-semibold text-rose-450 flex items-center gap-2">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-400" />
          Ingestion Compliance Warnings ({validationErrors.length})
        </h3>
        <button
          type="button"
          onClick={clearValidationErrors}
          className="rounded-lg bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 px-2.5 py-1 text-[10px] font-semibold text-rose-400 transition"
        >
          Dismiss All
        </button>
      </div>

      {/* Errors list */}
      <div className="space-y-3">
        {validationErrors.map((err) => (
          <div
            key={err.id}
            className="rounded-xl border border-rose-900/25 bg-slate-950/20 p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3.5 text-xs"
          >
            <div className="space-y-1.5 min-w-0 flex-1">
              <span className="font-bold text-slate-200 block truncate" title={err.fileName}>
                {err.fileName}
              </span>
              <p className="text-slate-400 leading-normal font-normal">
                {err.message}
              </p>
              <p className="text-[10px] text-rose-400/80 font-semibold bg-rose-500/5 px-2 py-1 rounded inline-block">
                Fix: {err.suggestedFix}
              </p>
            </div>

            {/* Resolution buttons */}
            <div className="flex sm:flex-col gap-2 justify-end shrink-0 self-end sm:self-auto">
              {err.code === 'duplicate' && (
                <button
                  type="button"
                  onClick={() => handleResolveDuplicate(err.id, err.fileName)}
                  className="rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 px-3 py-1.5 text-[10px] font-semibold text-emerald-400 transition flex items-center gap-1"
                >
                  <Layers className="h-3.5 w-3.5" />
                  Overwrite
                </button>
              )}
              <button
                type="button"
                onClick={() => removeValidationError(err.id)}
                className="rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 px-3 py-1.5 text-[10px] font-semibold text-slate-400 hover:text-rose-400 transition flex items-center justify-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
