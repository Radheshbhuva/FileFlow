import { usePreviewStore } from '../../stores/fileStore';
import { X, Download, Share2, FileText, Shield } from 'lucide-react';
import SecurityScoreBadge from './SecurityScoreBadge';

export default function FilePreviewModal() {
  const { activePreviewFile, closePreview } = usePreviewStore();

  if (!activePreviewFile) return null;

  const file = activePreviewFile;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
    >
      <div className="flex flex-col w-full max-w-4xl h-[80vh] border border-slate-800 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 id="preview-title" className="text-sm font-semibold text-slate-100 truncate">
                {file.name}
              </h2>
              <p className="text-xs text-slate-500">
                {file.sizeLabel} • {file.type.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SecurityScoreBadge security={file.security} showTooltip={false} />
            <button
              type="button"
              onClick={closePreview}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 bg-slate-950/40 overflow-auto flex items-center justify-center p-6">
          {file.type === 'image' && file.previewUrl ? (
            <div className="relative max-h-full max-w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-md">
              <img src={file.previewUrl} alt={file.name} className="max-h-[50vh] object-contain mx-auto" />
            </div>
          ) : (file.type === 'text') && file.previewUrl ? (
            <pre className="w-full max-w-2xl text-left bg-slate-950 border border-slate-850 p-6 rounded-xl overflow-x-auto text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap select-text max-h-[50vh]">
              {file.previewUrl}
            </pre>
          ) : file.type === 'pdf' ? (
            <div className="w-full max-w-2xl border border-slate-800 bg-slate-900 rounded-xl p-8 text-center space-y-4 shadow-soft">
              <div className="w-16 h-16 bg-sky-500/10 text-sky-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">PDF Reader Preview</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                FileFlow Secure PDF Viewer is restricted for this plan. You can download the document locally or upgrade to view it in-app.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md border border-slate-800 bg-slate-900 p-8 rounded-xl text-center space-y-4">
              <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">No Preview Available</h3>
              <p className="text-xs text-slate-400">
                Preview is not supported for {file.extension.toUpperCase()} files. You can download this file to view
                it.
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold hover:bg-slate-900"
              >
                <Download className="h-3.5 w-3.5" /> Download File
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>FileFlow Security Scan Passed</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-xs font-semibold hover:bg-slate-800 hover:text-slate-100"
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-500"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
