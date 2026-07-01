import { useNavigate } from 'react-router-dom';
import { useFilesStore } from '../../stores/fileStore';
import { useFilterStore } from '../../stores/fileStore';
import { Star, Clock, ShieldAlert, FileWarning, Share2, ArrowRight } from 'lucide-react';

interface SmartCollectionsProps {
  overviewData?: {
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

export default function SmartCollectionsWidget({ overviewData }: SmartCollectionsProps) {
  const navigate = useNavigate();
  const { files } = useFilesStore();
  const { resetFilters, setFilters } = useFilterStore();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Compute counts dynamically
  const favoritesCount = overviewData ? overviewData.favoritesCount : files.filter((f) => f.isFavorite).length;
  const needsAttentionCount = overviewData ? overviewData.needsAttentionCount : files.filter((f) => f.security.score < 70).length;
  const sharedRecentlyCount = overviewData ? overviewData.totalShares : files.filter((f) => f.shareCount > 0).length;
  const largeFilesCount = files.filter((f) => f.sizeBytes > 5 * 1024 * 1024).length; // > 5 MB
  const recentlyModifiedCount = overviewData ? overviewData.recentlyModifiedCount : files.filter((f) => new Date(f.lastModified) >= sevenDaysAgo).length;

  const collections = [
    {
      id: 'recently_modified',
      name: 'Recently Modified',
      count: recentlyModifiedCount,
      description: 'Modified in the last 7 days',
      icon: <Clock className="h-4.5 w-4.5 text-emerald-400" />,
      bg: 'bg-emerald-500/10',
      action: () => {
        resetFilters();
        setFilters({ recentlyModified: true });
      }
    },
    {
      id: 'shared_recently',
      name: 'Shared Recently',
      count: sharedRecentlyCount,
      description: 'Active sharing settings',
      icon: <Share2 className="h-4.5 w-4.5 text-indigo-400" />,
      bg: 'bg-indigo-500/10',
      action: () => {
        resetFilters();
        setFilters({ sharedStatus: ['public', 'team'] });
      }
    },
    {
      id: 'needs_attention',
      name: 'Needs Attention',
      count: needsAttentionCount,
      description: 'Security score < 70',
      icon: <ShieldAlert className="h-4.5 w-4.5 text-rose-400" />,
      bg: 'bg-rose-500/10',
      highlight: needsAttentionCount > 0,
      action: () => {
        resetFilters();
        setFilters({ maxSecurityScore: 69 });
      }
    },
    {
      id: 'large_files',
      name: 'Large Files',
      count: largeFilesCount,
      description: 'Files larger than 5 MB',
      icon: <FileWarning className="h-4.5 w-4.5 text-purple-400" />,
      bg: 'bg-purple-500/10',
      action: () => {
        resetFilters();
        setFilters({ minSize: 5 * 1024 * 1024 });
      }
    },
    {
      id: 'favorites',
      name: 'Favorites',
      count: favoritesCount,
      description: 'Pinned files for easy access',
      icon: <Star className="h-4.5 w-4.5 text-amber-400" />,
      bg: 'bg-amber-500/10',
      action: () => {
        resetFilters();
        setFilters({ isFavorite: true });
      }
    }
  ];

  const handleNavigate = (action: () => void) => {
    action();
    navigate('/my-files');
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-soft space-y-4">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-slate-100">Smart Collections</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {collections.map((col) => (
          <button
            key={col.id}
            type="button"
            onClick={() => handleNavigate(col.action)}
            className={`group rounded-xl border bg-slate-900/30 p-3.5 text-left transition hover:border-slate-700 hover:bg-slate-900 flex flex-col justify-between ${
              col.highlight ? 'border-rose-900/35 bg-rose-950/5 hover:border-rose-800' : 'border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`rounded-lg p-1.5 ${col.bg}`} aria-hidden="true">
                {col.icon}
              </div>
              <span className="text-sm font-bold text-slate-300 group-hover:text-sky-400 transition">
                {col.count}
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-semibold text-slate-200 group-hover:text-slate-100 flex items-center gap-1">
                {col.name}
                <ArrowRight className="h-3 w-3 text-slate-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
              </h4>
              <p className="mt-0.5 text-[10px] text-slate-500 leading-normal">{col.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
