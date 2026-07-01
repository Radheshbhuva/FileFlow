import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboardService';
import { Upload, Share2, Download, Trash2, Star, User, Settings, Clock, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const actionIcons: Record<string, JSX.Element> = {
  upload: <Upload className="h-3.5 w-3.5 text-emerald-400" />,
  share: <Share2 className="h-3.5 w-3.5 text-indigo-400" />,
  download: <Download className="h-3.5 w-3.5 text-sky-400" />,
  delete: <Trash2 className="h-3.5 w-3.5 text-rose-400" />,
  favorite: <Star className="h-3.5 w-3.5 text-amber-400" />,
  profile: <User className="h-3.5 w-3.5 text-teal-400" />,
  settings: <Settings className="h-3.5 w-3.5 text-slate-400" />
};

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs) || diffMs < 0) return 'Just now';
  
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function mapActivityType(type: string): string {
  const t = type.toUpperCase();
  if (t.includes('UPLOAD')) return 'upload';
  if (t.includes('SHARE')) return 'share';
  if (t.includes('DOWNLOAD')) return 'download';
  if (t.includes('DELETE') || t.includes('ARCHIVE')) return 'delete';
  if (t.includes('FAVORITE')) return 'favorite';
  if (t.includes('PROFILE') || t.includes('LOGIN') || t.includes('LOGOUT') || t.includes('REGISTER')) return 'profile';
  return 'settings';
}

export default function WorkspaceActivityFeed() {
  const [limit, setLimit] = useState(4);
  const [loadingMore, setLoadingMore] = useState(false);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['dashboardActivity'],
    queryFn: dashboardService.getRecentActivity,
    staleTime: 30_000,
    refetchInterval: 60_000
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-soft flex flex-col justify-between h-auto space-y-4 animate-pulse">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="h-5 w-40 bg-slate-800 rounded"></div>
          <div className="h-4 w-12 bg-slate-800 rounded"></div>
        </div>
        <div className="space-y-4 pl-6 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-3/4 bg-slate-800 rounded"></div>
              <div className="h-2 w-1/4 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayed = activities.slice(0, limit);
  const hasMore = activities.length > limit;

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setLimit((prev) => prev + 4);
      setLoadingMore(false);
    }, 400);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-soft flex flex-col justify-between h-auto space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Clock className="h-4.5 w-4.5 text-sky-400" />
          Workspace Activity Feed
        </h3>
        <span className="text-[10px] font-mono text-slate-500">Live Updates</span>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-850 rounded-xl">
          <p className="text-xs text-slate-500">No activities logged yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative border-l border-slate-800 pl-4 ml-2.5 space-y-4">
            {displayed.map((act) => {
              const mappedType = mapActivityType(act.activityType);
              const icon = actionIcons[mappedType] || <Clock className="h-3.5 w-3.5 text-slate-400" />;
              return (
                <div key={act.id} className="relative">
                  {/* Timeline Dot Icon */}
                  <span className="absolute -left-[27px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 border border-slate-855 shrink-0" aria-hidden="true">
                    {icon}
                  </span>
                  <div className="text-xs space-y-0.5">
                    <p className="text-slate-300 leading-normal font-normal">
                      {act.description}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono">
                      {new Date(act.createdAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {' • '}
                      {getRelativeTime(act.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action triggers for infinite scroll or expansions */}
          <div className="flex items-center justify-center pt-2">
            {hasMore ? (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-750 px-3.5 py-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition"
              >
                {loadingMore ? (
                  <RefreshCw className="h-3 w-3 animate-spin text-sky-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                )}
                <span>{loadingMore ? 'Loading Activities...' : 'View Older Activities'}</span>
              </button>
            ) : limit > 4 ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-[9.5px] text-slate-600 font-mono">End of chronological feed</span>
                <button
                  type="button"
                  onClick={() => setLimit(4)}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 px-3 py-1 text-[9.5px] font-semibold text-slate-400 hover:text-slate-200 transition"
                >
                  <ChevronUp className="h-3 w-3 text-slate-400" />
                  <span>Show Less</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

