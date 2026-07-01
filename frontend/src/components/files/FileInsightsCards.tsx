import type { FileInsights } from '../../types/files';
import { Download, Share2, FileArchive, Trash2, Database, Upload } from 'lucide-react';

interface FileInsightsCardsProps {
  insights: FileInsights;
  loading?: boolean;
}

export default function FileInsightsCards({ insights, loading = false }: FileInsightsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-slate-800/80 bg-slate-900/40 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Storage Consumed',
      value: `${(insights.storageConsumedBytes / 1_073_741_824).toFixed(1)} GB / ${(
        insights.storageMaxBytes / 1_073_741_824
      ).toFixed(0)} GB`,
      subText: `${((insights.storageConsumedBytes / insights.storageMaxBytes) * 100).toFixed(0)}% used`,
      icon: <Database className="h-4 w-4 text-sky-400" />,
      bg: 'bg-sky-500/10'
    },
    {
      label: 'Most Downloaded',
      value: insights.mostDownloaded ? insights.mostDownloaded.name : 'None',
      subText: insights.mostDownloaded ? `${insights.mostDownloaded.downloadCount} downloads` : '0 downloads',
      icon: <Download className="h-4 w-4 text-emerald-400" />,
      bg: 'bg-emerald-500/10'
    },
    {
      label: 'Recently Shared',
      value: insights.recentlyShared ? insights.recentlyShared.name : 'None',
      subText: insights.recentlyShared ? `${insights.recentlyShared.shareCount} active shares` : '0 shares',
      icon: <Share2 className="h-4 w-4 text-indigo-400" />,
      bg: 'bg-indigo-500/10'
    },
    {
      label: 'Largest File',
      value: insights.largestFile ? insights.largestFile.name : 'None',
      subText: insights.largestFile ? insights.largestFile.sizeLabel : '0 KB',
      icon: <FileArchive className="h-4 w-4 text-purple-400" />,
      bg: 'bg-purple-500/10'
    },
    {
      label: 'Unused Files',
      value: `${insights.unusedFilesCount} ${insights.unusedFilesCount === 1 ? 'File' : 'Files'}`,
      subText: 'No downloads in 14d',
      icon: <Trash2 className="h-4 w-4 text-rose-400" />,
      bg: 'bg-rose-500/10'
    },
    {
      label: 'Recent Uploads',
      value: `${insights.recentUploadCount} ${insights.recentUploadCount === 1 ? 'Upload' : 'Uploads'}`,
      subText: 'Last 7 days',
      icon: <Upload className="h-4 w-4 text-amber-400" />,
      bg: 'bg-amber-500/10'
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-4 shadow-soft hover:border-slate-700/80 transition duration-200 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
              {card.label}
            </span>
            <div className={`rounded-lg p-1.5 shrink-0 ${card.bg}`} aria-hidden="true">
              {card.icon}
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate" title={card.value}>
              {card.value}
            </p>
            <p className="mt-1 text-[10px] text-slate-500 truncate">{card.subText}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
