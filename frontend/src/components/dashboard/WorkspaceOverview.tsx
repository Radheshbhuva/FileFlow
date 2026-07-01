import { FileText, Database, Share2, Star, ShieldAlert, Calendar } from 'lucide-react';

interface WorkspaceOverviewProps {
  data: {
    totalFiles: number;
    totalShares: number;
    favoritesCount: number;
    storageUsed: number;
    storageLimit: number;
    storageRemaining: number;
    needsAttentionCount: number;
    recentlyModifiedCount: number;
  };
}

export default function WorkspaceOverview({ data }: WorkspaceOverviewProps) {
  const storageUsed = data.storageUsed >= 1_073_741_824
    ? `${(data.storageUsed / 1_073_741_824).toFixed(1)} GB`
    : `${(data.storageUsed / 1_048_576).toFixed(0)} MB`;

  const storageMax = data.storageLimit >= 1_073_741_824
    ? `${(data.storageLimit / 1_073_741_824).toFixed(0)} GB`
    : `${(data.storageLimit / 1_048_576).toFixed(0)} MB`;

  const storagePercentage = data.storageLimit > 0 ? Math.round((data.storageUsed / data.storageLimit) * 100) : 0;

  const stats = [
    {
      label: 'Files',
      value: `${data.totalFiles}`,
      subText: `+${Math.min(2, data.totalFiles)} this week`,
      icon: <FileText className="h-4 w-4 text-sky-400" />,
      trendColor: 'text-emerald-400',
      bg: 'bg-sky-500/5'
    },
    {
      label: 'Storage Used',
      value: `${storageUsed} / ${storageMax}`,
      subText: `${storagePercentage}% capacity`,
      icon: <Database className="h-4 w-4 text-teal-400" />,
      trendColor: 'text-slate-400',
      bg: 'bg-teal-500/5'
    },
    {
      label: 'Active Shares',
      value: `${data.totalShares}`,
      subText: data.needsAttentionCount > 0 ? '1 expiring soon' : 'All links secure',
      icon: <Share2 className="h-4 w-4 text-indigo-400" />,
      trendColor: data.needsAttentionCount > 0 ? 'text-amber-400' : 'text-slate-400',
      bg: 'bg-indigo-500/5'
    },
    {
      label: 'Favorites',
      value: `${data.favoritesCount}`,
      subText: 'Recently accessed',
      icon: <Star className="h-4 w-4 text-amber-400" />,
      trendColor: 'text-slate-400',
      bg: 'bg-amber-500/5'
    },
    {
      label: 'Attention',
      value: `${data.needsAttentionCount}`,
      subText: data.needsAttentionCount > 0 ? 'Needs review' : 'No alerts active',
      icon: <ShieldAlert className="h-4 w-4 text-rose-400" />,
      trendColor: data.needsAttentionCount > 0 ? 'text-rose-400 font-semibold' : 'text-slate-400',
      bg: data.needsAttentionCount > 0 ? 'bg-rose-500/5 border-rose-900/30' : 'bg-slate-500/5'
    },
    {
      label: 'Modified',
      value: `${data.recentlyModifiedCount}`,
      subText: 'Last 24h activity',
      icon: <Calendar className="h-4 w-4 text-emerald-400" />,
      trendColor: 'text-slate-400',
      bg: 'bg-emerald-500/5'
    }
  ];

  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-slate-800/80 bg-slate-900/25 p-4 hover:border-slate-700 transition flex flex-col justify-between h-auto"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {stat.label}
            </span>
            <div className={`rounded-lg p-1 shrink-0 ${stat.bg}`} aria-hidden="true">
              {stat.icon}
            </div>
          </div>

          <div className="mt-3.5">
            <span className="text-xl font-bold text-slate-100 tracking-tight block">
              {stat.value}
            </span>
            <span className={`text-[10px] ${stat.trendColor} block mt-0.5`}>
              {stat.subText}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
