import { useQuery } from '@tanstack/react-query';
import { usePreviewStore } from '../../stores/fileStore';
import { fileService } from '../../services/fileService';
import SecurityScoreBadge from './SecurityScoreBadge';
import FileActivityFeed from './FileActivityFeed';
import { X, Calendar, Database, Download, Share2, Shield, Info, FileText } from 'lucide-react';

export default function FileDetailsDrawer() {
  const { activeDetailsFile, closeDetails } = usePreviewStore();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['fileActivities', activeDetailsFile?.id],
    queryFn: () => fileService.getFileActivities(activeDetailsFile?.id),
    enabled: !!activeDetailsFile?.id
  });

  if (!activeDetailsFile) return null;

  const file = activeDetailsFile;

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-250 ease-out"
      role="dialog"
      aria-modal="true"
      aria-label="File details drawer"
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <FileText className="h-5 w-5 text-sky-400" />
          File Details
        </h2>
        <button
          type="button"
          onClick={closeDetails}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
          aria-label="Close details panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-3">
          <h3 className="break-words text-lg font-semibold text-slate-100 leading-snug">{file.name}</h3>
          <div className="flex flex-wrap gap-2">
            <SecurityScoreBadge security={file.security} />
            <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium ${
              file.sharedStatus === 'public'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : file.sharedStatus === 'team'
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {file.sharedStatus.toUpperCase()}
            </span>
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* Metadata Details Grid */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Properties</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500">File Type</span>
              <p className="font-medium text-slate-300 capitalize">{file.type}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Extension</span>
              <p className="font-medium text-slate-300 uppercase">{file.extension}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">File Size</span>
              <p className="font-medium text-slate-300">{file.sizeLabel}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">File Status</span>
              <p className="font-medium text-slate-300 capitalize flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${
                  file.status === 'ready'
                    ? 'bg-emerald-500'
                    : file.status === 'processing'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-rose-500'
                }`} />
                {file.status}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Owner</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-sky-500/15 text-[10px] font-semibold text-sky-400">
                  {file.owner.initials}
                </span>
                <span className="font-medium text-slate-300">{file.owner.name}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Created Date</span>
              <p className="font-medium text-slate-300 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                {new Date(file.uploadDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* Access Metrics */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Metrics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/30 p-3">
              <div className="rounded-lg bg-sky-500/10 p-2 text-sky-400">
                <Download className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Downloads</span>
                <span className="text-sm font-semibold text-slate-200">{file.downloadCount}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/30 p-3">
              <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                <Share2 className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Shares</span>
                <span className="text-sm font-semibold text-slate-200">{file.shareCount}</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* Security Assessment */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Security Factors</h4>
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-sky-400" />
                Security Level
              </span>
              <span className={`font-semibold ${
                file.security.score >= 90
                  ? 'text-emerald-400'
                  : file.security.score >= 75
                  ? 'text-sky-400'
                  : file.security.score >= 50
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}>
                {file.security.label}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  file.security.score >= 90
                    ? 'bg-emerald-500'
                    : file.security.score >= 75
                    ? 'bg-sky-500'
                    : file.security.score >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${file.security.score}%` }}
              />
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-400 list-none pl-0 pt-1">
              {file.security.factors.map((factor, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <Info className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* Activity Timeline */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">File Activity</h4>
          <FileActivityFeed activities={activities} loading={isLoading} />
        </div>
      </div>
    </div>
  );
}
