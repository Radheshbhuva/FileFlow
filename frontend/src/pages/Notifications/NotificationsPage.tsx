import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { notificationService, type NotificationRecord } from '../../services/notificationService';
import { useActivityStore } from '../../stores/activityStore';
import { useAuthStore } from '../../stores/authStore';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Database,
  Share2,
  User,
  ShieldAlert,
  Archive,
  Eye,
  Trash2,
  Mail,
  RefreshCcw,
  Sparkles,
  Info,
  Clock,
  Search,
  Filter
} from 'lucide-react';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const { logActivity } = useActivityStore();

  const [toast, setToast] = useState<string | null>(null);

  // Zustand Filters
  const { filters, setFilters, resetFilters } = useNotificationsStore();
  const [searchText, setSearchText] = useState('');

  // Fetch Notifications List
  const { data: notifications = [], isLoading, error: fetchError, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', filters.status],
    queryFn: () => notificationService.getNotifications({ status: filters.status }),
    staleTime: 15000
  });

  // Fetch Notifications Summary Statistics
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['notificationsSummary'],
    queryFn: () => notificationService.getSummary(),
    staleTime: 15000
  });

  // REAL-TIME SERVER-SENT EVENTS (SSE) LISTENER ARCHITECTURE SETUP
  useEffect(() => {
    if (!token) return;

    // Establish connection to backend real-time event-stream
    const apiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api/v1';
    const sseUrl = `${apiUrl}/realtime/sse?token=${token}`;
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(sseUrl);

      // Listen to generic notification creation bridge event
      eventSource.addEventListener('NOTIFICATION_CREATED', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          // Invalidate queries to fetch fresh notifications list & summaries
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['notificationsSummary'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardNotifications'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
          
          // Hydrate dynamic alert toast
          setToast(`New notification: ${data.title}`);
          setTimeout(() => setToast(null), 3000);
        } catch (err) {
          console.error('Failed to parse SSE notification payload:', err);
        }
      });

      eventSource.onerror = (err) => {
        console.warn('SSE connection interrupted. Reconnecting automatically...', err);
      };
    } catch (err) {
      console.error('Error establishing SSE subscriber connection:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [token, queryClient]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // MUTATIONS (Mark read, archive, mark all read)
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      showToastMsg(`Marked "${updated.title}" as read.`);
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => notificationService.archiveNotification(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      showToastMsg(`Notification archived successfully.`);
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      
      logActivity('profile', `Marked all notifications as read`);
      showToastMsg(`All notifications marked as read.`);
    }
  });

  // Categories helper styling mapper
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'security':
        return {
          icon: <ShieldAlert className="h-5 w-5 text-rose-455" />,
          style: 'border-rose-500/25 bg-rose-500/10 text-rose-400'
        };
      case 'storage':
        return {
          icon: <Database className="h-5 w-5 text-amber-450" />,
          style: 'border-amber-500/25 bg-amber-500/10 text-amber-400'
        };
      case 'share':
        return {
          icon: <Share2 className="h-5 w-5 text-indigo-400" />,
          style: 'border-indigo-500/25 bg-indigo-500/10 text-indigo-400'
        };
      case 'profile':
        return {
          icon: <User className="h-5 w-5 text-teal-450" />,
          style: 'border-teal-500/25 bg-teal-500/10 text-teal-400'
        };
      case 'upload':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-sky-400" />,
          style: 'border-sky-500/25 bg-sky-500/10 text-sky-400'
        };
      default:
        return {
          icon: <Bell className="h-5 w-5 text-slate-400" />,
          style: 'border-slate-800 bg-slate-900 text-slate-300'
        };
    }
  };

  // Filter & Search helper queries matching frontend
  const filteredNotifications = notifications.filter((n) => {
    // Apply Category Filter
    if (filters.category !== 'ALL' && n.type.toUpperCase() !== filters.category) {
      return false;
    }
    // Apply Severity Filter
    if (filters.severity !== 'ALL' && n.severity !== filters.severity) {
      return false;
    }
    // Apply Query search parameters
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchMsg = n.message.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg) return false;
    }
    return true;
  });

  const SkeletonCard = () => (
    <div className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/10 p-5 space-y-3">
      <div className="h-4 w-32 rounded bg-slate-800" />
      <div className="h-8 w-16 rounded bg-slate-800" />
      <div className="h-3 w-40 rounded bg-slate-800" />
    </div>
  );

  return (
    <DashboardLayout pageTitle="Notifications Center">
      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 rounded-xl border border-sky-500/30 bg-slate-900 px-4 py-3 text-sm text-sky-400 shadow-soft flex items-center gap-2 animate-in fade-in duration-300"
        >
          <Bell className="h-4.5 w-4.5 text-sky-400" />
          {toast}
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl space-y-6 pb-12">
        {/* Workspace Title & Stats Summary */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Bell className="h-5 w-5 text-sky-400 animate-swing" />
              Central Communications Hub
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-normal">
              Display and archive important security events, workspace invitations, and sharing notifications inside FileFlow.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || notifications.filter(n => n.status === 'UNREAD').length === 0}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 transition disabled:opacity-50 shrink-0"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-450" />
              Mark All Read
            </button>
            <button
              type="button"
              onClick={() => refetchNotifications()}
              className="inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-850 bg-slate-900/30 text-slate-400 hover:text-slate-200 transition"
              title="Refresh feed list"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* HIGH DENSITY STATS BOARD */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isSummaryLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total Logs</span>
                  <span className="text-2xl font-extrabold text-slate-100">{summary?.totalNotifications || 0}</span>
                  <span className="text-[10px] text-slate-500">Gross historic messages</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-slate-400" />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-850 bg-slate-900/15 p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Unread Alerts</span>
                  <span className="text-2xl font-extrabold text-sky-400">{summary?.unreadCount || 0}</span>
                  <span className="text-[10px] text-slate-550 flex items-center gap-1 font-semibold">
                    <Clock className="h-3.5 w-3.5" /> Requires attention
                  </span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                  <Info className="h-5 w-5 text-sky-400" />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Critical Threats</span>
                  <span className="text-2xl font-extrabold text-rose-455">{summary?.criticalAlertsCount || 0}</span>
                  <span className="text-[10px] text-slate-550 flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-500" /> Vulnerabilities audited
                  </span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <ShieldAlert className="h-5 w-5 text-rose-455" />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">In-App Preference</span>
                  <span className="text-2xl font-extrabold text-slate-100">Active</span>
                  <span className="text-[10px] text-slate-500">Real-Time connection SSE: OK</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Sparkles className="h-5 w-5 text-emerald-450" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search notification messages..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-955 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-650 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 px-2 py-1 cursor-pointer">
                <Filter className="h-3.5 w-3.5 text-slate-500" />
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ status: e.target.value as any })}
                  className="bg-transparent border-none text-slate-300 text-xs focus:ring-0 cursor-pointer pr-6 py-1.5"
                >
                  <option value="ALL">All Status</option>
                  <option value="UNREAD">Unread Logs</option>
                  <option value="READ">Read Logs</option>
                  <option value="ARCHIVED">Archived Logs</option>
                </select>
              </div>

              <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 px-2 py-1 cursor-pointer">
                <Filter className="h-3.5 w-3.5 text-slate-500" />
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ category: e.target.value as any })}
                  className="bg-transparent border-none text-slate-300 text-xs focus:ring-0 cursor-pointer pr-6 py-1.5"
                >
                  <option value="ALL">All Categories</option>
                  <option value="UPLOAD">Upload Actions</option>
                  <option value="SHARE">Share Linkages</option>
                  <option value="SECURITY">Security audits</option>
                  <option value="STORAGE">Storage alerts</option>
                  <option value="PROFILE">Profile updates</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => resetFilters()}
                className="rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/30 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition shrink-0"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS TIMELINE FEED */}
        {fetchError ? (
          <div className="text-center py-16 border border-rose-500/20 bg-rose-500/5 rounded-2xl space-y-3">
            <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">Unable to sync notification feeds</h3>
            <button
              type="button"
              onClick={() => refetchNotifications()}
              className="rounded-xl border border-rose-505 bg-rose-500/10 hover:bg-rose-500 px-4 py-2 text-xs font-semibold text-rose-455 hover:text-white transition"
            >
              Retry Connection
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
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
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-20 border border-slate-800 rounded-2xl bg-slate-900/5 space-y-3">
            <Bell className="h-10 w-10 text-slate-650 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-350">Notifications Inbox Clean</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              No notifications match your current selection filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((n) => {
              const theme = getCategoryTheme(n.type);
              const isUnread = n.status === 'UNREAD';

              return (
                <div
                  key={n.id}
                  className={`rounded-2xl border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:border-slate-700 ${
                    isUnread
                      ? 'border-slate-800 bg-slate-900/30 shadow-sm shadow-sky-500/5'
                      : 'border-slate-850 bg-slate-950/20 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center border shrink-0 ${theme.style}`}>
                      {theme.icon}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-200">{n.title}</h4>
                        {isUnread && (
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
                        )}
                        <span className={`text-[8.5px] font-semibold border rounded px-1.5 ${
                          n.severity === 'CRITICAL' ? 'border-rose-500/30 text-rose-455 bg-rose-500/10' :
                          n.severity === 'WARNING' ? 'border-amber-500/30 text-amber-450 bg-amber-500/10' :
                          'border-slate-800 text-slate-400 bg-slate-900'
                        }`}>
                          {n.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed break-words">{n.message}</p>
                      <span className="text-[10px] text-slate-550 block font-medium">
                        {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => markReadMutation.mutate(n.id)}
                        disabled={markReadMutation.isPending}
                        className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-slate-100 transition disabled:opacity-50"
                      >
                        Mark Read
                      </button>
                    )}
                    {n.status !== 'ARCHIVED' && (
                      <button
                        type="button"
                        onClick={() => archiveMutation.mutate(n.id)}
                        disabled={archiveMutation.isPending}
                        className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition disabled:opacity-50"
                        title="Archive Notification"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
