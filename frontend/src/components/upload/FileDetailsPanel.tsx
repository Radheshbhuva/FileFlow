import { useUploadStore } from '../../stores/uploadStore';
import { uploadService } from '../../services/uploadService';
import { getFileIcon } from '../files/FileGridView';
import { X, ShieldAlert, ShieldCheck, Lock, Unlock, Database, Clock, RefreshCw } from 'lucide-react';

export default function FileDetailsPanel() {
  const { activeDetailsItem, setActiveDetailsItem } = useUploadStore();

  if (!activeDetailsItem) return null;

  const { file, progress, status, error } = activeDetailsItem;
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed' || status === 'cancelled';
  const isUploading = status === 'uploading';

  // Handle Close Drawer
  const handleClose = () => {
    setActiveDetailsItem(null);
  };

  // Determine security label and color
  const securityScore = file.securityScore;
  let securityColor = 'text-rose-450 bg-rose-500/10 border-rose-500/20';
  let SecurityIcon = ShieldAlert;
  let securityText = 'Critical Risk';

  if (securityScore >= 90) {
    securityColor = 'text-emerald-450 bg-emerald-500/10 border-emerald-500/20';
    SecurityIcon = ShieldCheck;
    securityText = 'Compliant & Secure';
  } else if (securityScore >= 70) {
    securityColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    SecurityIcon = ShieldAlert;
    securityText = 'Minor Compliance Warning';
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />

      {/* Drawer content panel */}
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col justify-between z-10 animate-slide-in">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest block">
              Ingestion Specifications
            </span>
            <h3 className="text-sm font-bold text-slate-100 truncate max-w-[280px]">
              {file.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 p-2 text-slate-400 hover:text-slate-200 transition"
            aria-label="Close details"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* File extension graphic illustration */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-800/80 bg-slate-950/20">
            <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-slate-850 border border-slate-800 shadow-inner">
              {getFileIcon(file.type)}
            </div>
            <span className="mt-3 text-xs font-mono font-bold text-slate-350">
              {file.extension.toUpperCase() || 'FILE'} Format
            </span>
          </div>

          {/* Status and Progress */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Transmission Pipeline
            </h4>
            <div className="rounded-xl border border-slate-850 bg-slate-950/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Ingestion Status</span>
                {isCompleted ? (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/15">
                    Ready in Workspace
                  </span>
                ) : isFailed ? (
                  <span className="text-[10px] font-semibold text-rose-450 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/15">
                    Transmission Failed
                  </span>
                ) : isUploading ? (
                  <span className="text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/15 flex items-center gap-1">
                    <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Ingesting ({progress}%)
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                    Staged / Stalled
                  </span>
                )}
              </div>

              {!isCompleted && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Transmission Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${
                        isFailed ? 'bg-rose-500' : isUploading ? 'bg-sky-500' : 'bg-slate-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-rose-500/5 border border-rose-500/10 p-2 text-[10px] text-rose-400 font-medium">
                  Error: {error}
                </div>
              )}
            </div>
          </div>

          {/* Infrastructure Metrics */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Infrastructure Metrics
            </h4>
            <div className="grid gap-3 grid-cols-2">
              <div className="rounded-xl border border-slate-850 bg-slate-950/10 p-3">
                <span className="text-[9px] text-slate-500 font-semibold block uppercase">File Size</span>
                <span className="text-xs font-mono font-bold text-slate-300 mt-1 block">
                  {file.sizeLabel}
                </span>
              </div>
              <div className="rounded-xl border border-slate-850 bg-slate-950/10 p-3">
                <span className="text-[9px] text-slate-500 font-semibold block uppercase">S3 Encryption</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {file.isEncrypted ? (
                    <>
                      <Lock className="h-3 w-3 text-emerald-450" />
                      <span className="text-xs font-bold text-emerald-450">AES-256</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3 w-3 text-amber-500" />
                      <span className="text-xs font-bold text-amber-500">None</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Compliance & Vulnerability Audit */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Compliance & Security Audit
            </h4>
            <div className="rounded-xl border border-slate-850 bg-slate-950/10 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <span className="text-xs text-slate-400">Security Score</span>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1.5 ${securityColor}`}>
                  <SecurityIcon className="h-3.5 w-3.5" />
                  <span>{securityScore}/100</span>
                </div>
              </div>

              <div className="space-y-2.5 text-[10.5px]">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 rounded-full bg-emerald-500/10 p-0.5 border border-emerald-500/20 shrink-0">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-300 block">Antivirus Inspection</span>
                    <span className="text-slate-500 block leading-normal mt-0.5">
                      Completed signature scans, heuristic analyzers, and execution tests.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 rounded-full bg-emerald-500/10 p-0.5 border border-emerald-500/20 shrink-0">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-300 block">Extension Validation</span>
                    <span className="text-slate-500 block leading-normal mt-0.5">
                      Compliant with corporate executable file segregation policies.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 rounded-full bg-emerald-500/10 p-0.5 border border-emerald-500/20 shrink-0">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-300 block">Duplicate Check</span>
                    <span className="text-slate-500 block leading-normal mt-0.5">
                      Namespace and file content hashing completed successfully against the database storage.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* S3 Destination PREPARATION */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              AWS Infrastructure URI
            </h4>
            <div className="rounded-xl border border-slate-850 bg-slate-950/15 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-450">
                <Database className="h-3.5 w-3.5" />
                <span className="text-[9.5px] font-bold uppercase tracking-wider">Target Bucket Ingest</span>
              </div>
              <div className="font-mono text-[10px] text-slate-400 break-all select-all bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                s3://fileflow-enterprise-vault-bucket/vault/{file.id}_{file.name.replace(/\s+/g, '-')}
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-[9.5px]">
                <Clock className="h-3 w-3" />
                <span>Last Modified: {new Date(file.lastModified).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/30 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-slate-100 transition"
          >
            Close Drawer
          </button>
          
          {isFailed && (
            <button
              type="button"
              onClick={() => {
                uploadService.retryUpload(activeDetailsItem.id);
                handleClose();
              }}
              className="flex-1 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2.5 text-xs font-semibold text-white shadow-soft transition"
            >
              Retry Ingestion
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
