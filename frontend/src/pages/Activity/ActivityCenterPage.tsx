import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useActivityStore } from '../../stores/activityStore';
import { activityService, type Activity } from '../../services/activityService';
import {
  Activity as ActivityIcon,
  Search,
  SlidersHorizontal,
  Table,
  Calendar,
  User as UserIcon,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Eye,
  Download,
  Share2,
  Trash2,
  FileText,
  Lock,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  RefreshCcw,
  Sparkles
} from 'lucide-react';

export default function ActivityCenterPage() {
  const queryClient = useQueryClient();

  // Zustand State hooks
  const {
    filters,
    setFilters,
    resetFilters,
    viewMode,
    setViewMode,
    page,
    setPage,
    limit
  } = useActivityStore();

  const [searchText, setSearchText] = useState(filters.search);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters({ search: searchText });
    }, 400);
    return () => clearTimeout(handler);
  }, [searchText, setFilters]);

  // Fetch Activity Summary
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['activitySummary'],
    queryFn: () => activityService.getActivitySummary(),
    staleTime: 20000
  });

  // Fetch Paginated Activities list from backend
  const { data: listResponse, isLoading: isListLoading, refetch: refetchActivities } = useQuery({
    queryKey: ['activitiesList', { filters, page, limit }],
    queryFn: () =>
      activityService.listActivities({
        activityType: filters.activityType || undefined,
        severity: filters.severity || undefined,
        resourceType: filters.resourceType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        search: filters.search || undefined,
        page,
        limit
      }),
    staleTime: 15000
  });

  const activities = listResponse?.activities || [];
  const totalActivities = listResponse?.total || 0;
  const totalPages = Math.ceil(totalActivities / limit) || 1;

  // Real-time Event Receiver sync triggers (prepare SSE hook mock notifications update check)
  useEffect(() => {
    // Sync invalidation handlers to catch real-time dashboard events
    queryClient.invalidateQueries({ queryKey: ['activitySummary'] });
  }, [activities, queryClient]);

  // Collapsible date grouping logic
  const getGroupKey = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const groupActivitiesByDate = (items: Activity[]) => {
    const map: Record<string, Activity[]> = {};
    items.forEach((item) => {
      const key = getGroupKey(item.createdAt);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  };

  const groupedActivities = groupActivitiesByDate(activities);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getActivityTheme = (type: string, severity: string) => {
    let icon = <Info className="h-4 w-4" />;
    let style = 'bg-slate-900 border-slate-800 text-slate-400';

    if (severity === 'CRITICAL') {
      icon = <AlertTriangle className="h-4 w-4" />;
      style = 'bg-rose-500/10 border-rose-500/25 text-rose-455';
    } else if (severity === 'WARNING') {
      icon = <AlertTriangle className="h-4 w-4" />;
      style = 'bg-amber-500/10 border-amber-500/25 text-amber-450';
    } else if (type.includes('UPLOADED') || type.includes('RESTORED') || type.includes('UPDATED')) {
      icon = <CheckCircle className="h-4 w-4" />;
      style = 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
    } else if (type.includes('SHARED') || type.includes('INVITED')) {
      icon = <Share2 className="h-4 w-4" />;
      style = 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400';
    }

    return { icon, style };
  };

  const formatActivityName = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <DashboardLayout pageTitle="Activity Center">
      <div className="mx-auto max-w-7xl space-y-6 pb-12">
        {/* Header Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ActivityIcon className="h-5 w-5 text-sky-400" />
              Operational Workspace Audit Logs
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-normal">
              Chronological history tracking of uploads, link shares, download access hits, deletions, and security alerts.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setViewMode(viewMode === 'timeline' ? 'table' : 'timeline')}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-350 transition"
            >
              {viewMode === 'timeline' ? (
                <>
                  <Table className="h-4 w-4" />
                  Audit Table
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Timeline view
                </>
              )}
            </button>
            <button
              onClick={() => refetchActivities()}
              className="inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-850 bg-slate-900/30 text-slate-400 hover:text-slate-200 transition"
              title="Refresh timeline feeds"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* METRICS SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {isSummaryLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/10 p-5 space-y-2">
                <div className="h-3 w-16 bg-slate-800 rounded" />
                <div className="h-6 w-10 bg-slate-800 rounded" />
              </div>
            ))
          ) : (
            <>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gross Actions</span>
                <span className="text-xl font-extrabold text-slate-200">{summary?.totalActivities || 0}</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Uploaded Files</span>
                <span className="text-xl font-extrabold text-emerald-400">{summary?.uploads || 0}</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Shared Links</span>
                <span className="text-xl font-extrabold text-indigo-400">{summary?.shares || 0}</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">File Downloads</span>
                <span className="text-xl font-extrabold text-sky-400">{summary?.downloads || 0}</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recent Activity</span>
                <span className="text-xl font-extrabold text-purple-400">{summary?.recentActivityCount || 0}</span>
              </div>
            </>
          )}
        </div>

        {/* SEARCH AND FILTERS TOOLBAR */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-550" />
              <input
                type="text"
                placeholder="Search audit parameters by username, keyword tags, or file name..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/25"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 px-2 py-1 cursor-pointer">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                <select
                  value={filters.activityType}
                  onChange={(e) => setFilters({ activityType: e.target.value })}
                  className="bg-transparent border-none text-slate-350 text-xs focus:ring-0 cursor-pointer pr-6 py-1.5"
                >
                  <option value="">All Action Types</option>
                  <option value="FILE_UPLOADED">File Uploaded</option>
                  <option value="FILE_DOWNLOADED">File Downloaded</option>
                  <option value="FILE_SHARED">File Shared</option>
                  <option value="FILE_DELETED">File Deleted</option>
                  <option value="SHARE_CREATED">Share Created</option>
                  <option value="SHARE_REVOKED">Share Revoked</option>
                  <option value="PROFILE_UPDATED">Profile Updated</option>
                </select>
              </div>

              <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 px-2 py-1 cursor-pointer">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters({ severity: e.target.value })}
                  className="bg-transparent border-none text-slate-350 text-xs focus:ring-0 cursor-pointer pr-6 py-1.5"
                >
                  <option value="">All Severity</option>
                  <option value="INFO">Info Logs</option>
                  <option value="SUCCESS">Success Actions</option>
                  <option value="WARNING">Warnings</option>
                  <option value="CRITICAL">Critical Alarms</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchText('');
                  resetFilters();
                }}
                className="rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/30 px-3.5 py-2 text-xs font-semibold text-slate-450 hover:text-slate-200 transition"
              >
                Reset filters
              </button>
            </div>
          </div>
        </div>

        {/* MAIN FEED CONTENT */}
        {isListLoading ? (
          <div className="space-y-3 py-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-850 p-5 flex items-center justify-between bg-slate-900/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-800 shrink-0" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-slate-800" />
                    <div className="h-3 w-48 rounded bg-slate-800" />
                  </div>
                </div>
                <div className="h-8 w-16 rounded-xl bg-slate-800" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 border border-slate-800 rounded-2xl bg-slate-900/5 space-y-3">
            <ActivityIcon className="h-10 w-10 text-slate-650 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-350">No Activity Logs Found</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              We couldn't locate any audit entries matching your search query parameter filters.
            </p>
          </div>
        ) : viewMode === 'timeline' ? (
          /* TIMELINE GROUP VIEW */
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([groupTitle, groupItems]) => {
              const isCollapsed = collapsedGroups[groupTitle] || false;
              return (
                <div key={groupTitle} className="space-y-3">
                  <button
                    onClick={() => toggleGroup(groupTitle)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider select-none outline-none focus:text-sky-400 cursor-pointer"
                  >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {groupTitle}
                    <span className="text-[10px] font-normal text-slate-550">({groupItems.length} items)</span>
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-2 border-l border-slate-850 pl-4 ml-2">
                      {groupItems.map((act) => {
                        const theme = getActivityTheme(act.activityType, act.severity);
                        return (
                          <div
                            key={act.id}
                            className="group flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl border border-slate-900/50 bg-slate-950/20 hover:border-slate-800 transition duration-150 relative"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 ${theme.style}`}>
                                {theme.icon}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-xs font-bold text-slate-200">
                                    {formatActivityName(act.activityType)}
                                  </h4>
                                  <span className={`text-[8px] font-bold border rounded px-1.5 ${
                                    act.severity === 'CRITICAL' ? 'border-rose-500/25 bg-rose-500/10 text-rose-455' :
                                    act.severity === 'WARNING' ? 'border-amber-500/25 bg-amber-500/10 text-amber-450' :
                                    'border-slate-800 text-slate-400 bg-slate-900'
                                  }`}>
                                    {act.severity}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5 leading-normal">{act.description}</p>
                                <span className="text-[10px] text-slate-550 block font-medium mt-1">
                                  {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() => setSelectedActivity(act)}
                                className="inline-flex items-center gap-1 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-1.5 text-[10px] font-semibold text-slate-450 hover:text-slate-200 transition"
                              >
                                <Eye className="h-3 w-3" />
                                Details
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* AUDIT TABLE VIEW */
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/10">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/30 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Message description</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {activities.map((act) => {
                  return (
                    <tr key={act.id} className="hover:bg-slate-900/20 transition">
                      <td className="px-6 py-4 text-slate-500 font-mono whitespace-nowrap">
                        {new Date(act.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-300">
                        {formatActivityName(act.activityType)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-[9px] font-bold border rounded-lg px-2 py-0.5 ${
                          act.severity === 'CRITICAL' ? 'border-rose-500/25 bg-rose-500/10 text-rose-455' :
                          act.severity === 'WARNING' ? 'border-amber-500/25 bg-amber-500/10 text-amber-450' :
                          'border-slate-800 text-slate-400 bg-slate-900'
                        }`}>
                          {act.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 max-w-[320px] truncate" title={act.description}>
                        {act.description}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedActivity(act)}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-850 pt-4">
            <span className="text-[10px] text-slate-500 font-medium">
              Page {page} of {totalPages} ({totalActivities} total logs)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-700 disabled:opacity-50 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-700 disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL OVERLAY */}
      {selectedActivity && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg border border-slate-800 bg-slate-900 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200">Activity Log Parameters</h3>
              <button
                onClick={() => setSelectedActivity(null)}
                className="rounded-lg p-1 text-slate-450 hover:bg-slate-800 hover:text-slate-200 transition"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 border-b border-slate-850 pb-2">
                <span className="text-slate-500 font-semibold">Action Type</span>
                <span className="col-span-2 text-slate-300 font-mono">{selectedActivity.activityType}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-850 pb-2">
                <span className="text-slate-500 font-semibold">Severity</span>
                <span className="col-span-2">
                  <span className={`inline-flex border rounded px-2 py-0.5 ${
                    selectedActivity.severity === 'CRITICAL' ? 'border-rose-500/25 bg-rose-500/10 text-rose-455' :
                    selectedActivity.severity === 'WARNING' ? 'border-amber-500/25 bg-amber-500/10 text-amber-450' :
                    'border-slate-800 text-slate-400 bg-slate-900'
                  }`}>
                    {selectedActivity.severity}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-850 pb-2">
                <span className="text-slate-500 font-semibold">Logged Timestamp</span>
                <span className="col-span-2 text-slate-350">{new Date(selectedActivity.createdAt).toLocaleString()}</span>
              </div>
              {selectedActivity.resourceId && (
                <div className="grid grid-cols-3 border-b border-slate-850 pb-2">
                  <span className="text-slate-500 font-semibold">Resource Target</span>
                  <span className="col-span-2 text-slate-350 font-mono truncate">{selectedActivity.resourceId}</span>
                </div>
              )}
              {selectedActivity.resourceType && (
                <div className="grid grid-cols-3 border-b border-slate-850 pb-2">
                  <span className="text-slate-500 font-semibold">Resource Type</span>
                  <span className="col-span-2 text-slate-350">{selectedActivity.resourceType}</span>
                </div>
              )}
              <div className="space-y-1 pt-1">
                <span className="text-slate-500 font-semibold block">Event Description</span>
                <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-850">
                  {selectedActivity.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
