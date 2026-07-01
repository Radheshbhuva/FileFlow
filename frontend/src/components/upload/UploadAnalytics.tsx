import { uploadService } from '../../services/uploadService';
import { useUploadStore } from '../../stores/uploadStore';
import { BarChart, FileText, Database, Layers, ArrowUpRight, TrendingUp } from 'lucide-react';

export default function UploadAnalytics() {
  const { queue } = useUploadStore();

  if (queue.length === 0) return null;

  const analytics = uploadService.getUploadAnalytics();

  const totalSizeMB = (analytics.totalUploadSizeBytes / 1048576).toFixed(1);
  const avgSizeLabel =
    analytics.averageFileSizeBytes > 1048576
      ? `${(analytics.averageFileSizeBytes / 1048576).toFixed(1)} MB`
      : `${(analytics.averageFileSizeBytes / 1024).toFixed(0)} KB`;

  const cards = [
    {
      label: 'Staged Files',
      value: `${analytics.filesSelected} items`,
      desc: 'Selected in current stage',
      icon: <Layers className="h-4.5 w-4.5 text-sky-400" />
    },
    {
      label: 'Staged Ingestion Size',
      value: `${totalSizeMB} MB`,
      desc: 'Total size footprint',
      icon: <Database className="h-4.5 w-4.5 text-teal-400" />
    },
    {
      label: 'Average Size Weight',
      value: avgSizeLabel,
      desc: 'Typical file capacity',
      icon: <TrendingUp className="h-4.5 w-4.5 text-indigo-400" />
    },
    {
      label: 'Common Category',
      value: analytics.mostCommonFileType,
      desc: 'Highest file occurrences',
      icon: <FileText className="h-4.5 w-4.5 text-amber-400" />
    }
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-soft space-y-4 h-auto">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <BarChart className="h-4.5 w-4.5 text-sky-400" />
          Ingestion Analytics
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">Stage Stats</span>
      </div>

      {/* Grid structure */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, idx) => (
          <div key={idx} className="rounded-xl border border-slate-850 bg-slate-950/20 p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {c.label}
              </span>
              <span className="shrink-0">{c.icon}</span>
            </div>
            <p className="text-base font-bold text-slate-200 block tracking-tight pt-1">
              {c.value}
            </p>
            <p className="text-[10px] text-slate-500 block leading-tight">
              {c.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Largest File Indicator */}
      {analytics.largestFile && (
        <div className="rounded-xl border border-slate-850 bg-slate-950/30 p-3.5 flex items-center justify-between text-xs gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider block">
              Largest Staged Resource
            </span>
            <span className="font-semibold text-slate-200 truncate block mt-1" title={analytics.largestFile.name}>
              {analytics.largestFile.name}
            </span>
          </div>
          <div className="shrink-0 font-mono font-semibold text-slate-400 text-right">
            <div>{analytics.largestFile.sizeLabel}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">
              {analytics.largestFile.type}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
