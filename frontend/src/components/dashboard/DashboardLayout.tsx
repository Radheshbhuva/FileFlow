import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { DashboardUser, NavItem } from '../../types/dashboard';
import { useProfileStore } from '../../stores/profileStore';
import { useNotificationsStore, type NotificationItem } from '../../stores/notificationsStore';
import { Bell, Check, ShieldAlert, Share2, Database, User, Circle, Trash2, Search, Activity, FolderOpen } from 'lucide-react';
import { authService } from '../../services/authService';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboardService';

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { id: 'files', label: 'My Files', href: '/my-files', icon: 'files' },
  { id: 'upload', label: 'Upload Files', href: '/upload', icon: 'upload' },
  { id: 'shared', label: 'Shared Files', href: '/shared', icon: 'shared' },
  { id: 'search', label: 'Search Center', href: '/search', icon: 'search' },
  { id: 'notifications', label: 'Notifications', href: '/notifications', icon: 'bell' },
  { id: 'activity', label: 'Activity Center', href: '/activity', icon: 'activity' },
  { id: 'collections', label: 'Smart Collections', href: '/collections', icon: 'collections' },

  { id: 'team', label: 'Team Workspace', href: '/dashboard#team', icon: 'team', badge: 'Soon', disabled: true }
];


const navIcons: Record<NavItem['icon'], JSX.Element> = {
  dashboard: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  files: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 16V4m-4 4 4-4 4 4M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  shared: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  team: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <Search className="h-5 w-5" />
  ),
  bell: (
    <Bell className="h-5 w-5" />
  ),
  activity: (
    <Activity className="h-5 w-5" />
  ),
  collections: (
    <FolderOpen className="h-5 w-5" />
  )
};

interface DashboardLayoutProps {
  pageTitle: string;
  user?: DashboardUser;
  children: ReactNode;
}

function SidebarNav({
  collapsed,
  onNavigate
}: {
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const { data: backendNotifications = [] } = useQuery({
    queryKey: ['dashboardNotifications'],
    queryFn: dashboardService.getNotifications,
    staleTime: 30_000
  });

  const unreadCount = backendNotifications.filter((bn: any) => bn.status === 'UNREAD').length;

  return (
    <nav aria-label="Dashboard navigation">
      <ul className="space-y-1">
        {navItems.map((item) => (
          <li key={item.id}>
            {item.disabled ? (
              <span
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 ${
                  collapsed ? 'justify-center' : ''
                }`}
                aria-disabled="true"
                title={item.label}
              >
                <span className="shrink-0 text-slate-600">{navIcons[item.icon]}</span>
                {!collapsed ? (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {item.badge}
                      </span>
                    ) : null}
                  </>
                ) : null}
              </span>
            ) : (
              <Link
                to={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-350 transition hover:bg-slate-800/80 hover:text-slate-100 ${
                  window.location.pathname === item.href ? 'bg-slate-800/60 text-slate-100' : ''
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="shrink-0 text-sky-300">{navIcons[item.icon]}</span>
                {!collapsed ? (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.id === 'notifications' && unreadCount > 0 && (
                      <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[9px] font-bold text-white shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </>
                ) : null}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

const alertIcons: Record<string, JSX.Element> = {
  security: <ShieldAlert className="h-3.5 w-3.5 text-rose-450" />,
  share: <Share2 className="h-3.5 w-3.5 text-indigo-450" />,
  storage: <Database className="h-3.5 w-3.5 text-amber-450" />,
  profile: <User className="h-3.5 w-3.5 text-teal-450" />,
  upload: <Circle className="h-3.5 w-3.5 text-sky-400 fill-sky-500/20" />
};

function getRelativeTime(dateString: string | Date): string {
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

function NotificationsDropdown() {
  const dropdownId = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotificationsStore();
  
  const { data: backendNotifications = [] } = useQuery({
    queryKey: ['dashboardNotifications'],
    queryFn: dashboardService.getNotifications,
    staleTime: 30_000,
    refetchInterval: 60_000
  });

  const mappedBackend: NotificationItem[] = backendNotifications.map((bn) => ({
    id: bn.id,
    title: `${bn.title}: ${bn.message}`,
    type: bn.type === 'CRITICAL' ? 'security' : bn.type === 'WARNING' ? 'storage' : 'upload',
    read: false,
    timestamp: new Date(bn.createdAt).toISOString(),
    relativeTime: getRelativeTime(bn.createdAt)
  }));

  const allNotifications = [...mappedBackend, ...notifications];
  const unreadCount = allNotifications.filter((n) => !n.read).length;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [close]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={`${dropdownId}-trigger`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${dropdownId}-menu`}
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-slate-300 transition hover:border-slate-600 hover:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-sky-500 text-[9px] font-bold text-white shadow-soft leading-none animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id={`${dropdownId}-menu`}
          role="menu"
          aria-labelledby={`${dropdownId}-trigger`}
          className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-950 p-4.5 shadow-2xl flex flex-col gap-3.5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-105">Alerts & Notifications</span>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[9px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded transition"
                >
                  <Check className="h-2.5 w-2.5" /> Mark all read
                </button>
              )}
              {allNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearNotifications}
                  className="text-[9px] font-semibold text-slate-450 hover:text-rose-450 flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded transition"
                >
                  <Trash2 className="h-2.5 w-2.5" /> Clear all
                </button>
              )}
            </div>
          </div>

          {/* List items */}
          {allNotifications.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-850 rounded-xl">
              <p className="text-xs text-slate-500">No active alerts.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {allNotifications.map((n) => {
                const icon = alertIcons[n.type] || <Bell className="h-3.5 w-3.5 text-slate-400" />;
                const isBackendAlert = n.id.startsWith('notify-');
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.read && !isBackendAlert) {
                        markAsRead(n.id);
                      }
                    }}
                    className={`flex items-start gap-2.5 rounded-xl border p-2.5 transition duration-150 relative ${
                      n.read
                        ? 'border-slate-850/60 bg-slate-950/10 opacity-60'
                        : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 cursor-pointer'
                    }`}
                  >
                    <span className="shrink-0 rounded-lg bg-slate-950 p-1.5 border border-slate-850 mt-0.5">
                      {icon}
                    </span>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className={`text-[10.5px] leading-normal text-slate-350 ${!n.read ? 'font-semibold text-slate-200' : ''}`}>
                        {n.title}
                      </p>
                      <p className="text-[9px] text-slate-500">{n.relativeTime}</p>
                    </div>
                    {!n.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0 mt-2" aria-hidden="true" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileDropdown({
  user,
  onLogout
}: {
  user: DashboardUser;
  onLogout: () => void;
}) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [close]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={`${menuId}-trigger`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${menuId}-menu`}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-2 py-1.5 text-sm transition hover:border-slate-600"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-xs font-semibold text-sky-300">
          {user.avatarInitials}
        </span>
        <span className="hidden text-slate-200 sm:inline">{user.fullName.split(' ')[0]}</span>
        <svg viewBox="0 0 20 20" className="hidden h-4 w-4 text-slate-400 sm:block" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
        </svg>
      </button>

      {open ? (
        <div
          id={`${menuId}-menu`}
          role="menu"
          aria-labelledby={`${menuId}-trigger`}
          className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-950 py-2 shadow-xl"
        >
          <div className="border-b border-slate-800 px-4 py-3">
            <p className="text-sm font-medium text-slate-100">{user.fullName}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <Link
            to="/profile"
            role="menuitem"
            className="block w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800"
            onClick={() => {
              close();
            }}
          >
            Account Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2 text-left text-sm text-rose-300 hover:bg-slate-800"
            onClick={() => {
              close();
              onLogout();
            }}
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardLayout({ pageTitle, user: _passedUser, children }: DashboardLayoutProps) {
  const storeUser = useProfileStore((s) => s.user);
  const user = storeUser;
  const navigate = useNavigate();
  const searchId = useId();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  function closeMobileSidebar() {
    setSidebarOpen(false);
  }

  function handleLogout() {
    authService.logout().finally(() => {
      navigate('/login');
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          aria-label="Close sidebar overlay"
          onClick={closeMobileSidebar}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800/90 bg-slate-950 transition-all duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}`}
        aria-label="Sidebar"
      >
        <div className={`flex h-16 items-center border-b border-slate-800/90 px-4 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed ? (
            <Link to="/dashboard" className="text-lg font-semibold tracking-tight text-slate-100" onClick={closeMobileSidebar}>
              FileFlow
            </Link>
          ) : (
            <span className="text-sm font-bold text-sky-400" aria-label="FileFlow">
              FF
            </span>
          )}
          <button
            type="button"
            className="hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:inline-flex"
            onClick={() => setSidebarCollapsed((current) => !current)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              {sidebarCollapsed ? (
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav collapsed={sidebarCollapsed} onNavigate={closeMobileSidebar} />
        </div>

        <div className="border-t border-slate-800/90 p-3">
          {!sidebarCollapsed ? (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/50 px-3 py-2.5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-xs font-semibold text-sky-300">
                {user.avatarInitials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-100">{user.fullName}</p>
                <p className="truncate text-xs text-slate-500">{user.plan} Plan</p>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-rose-300 ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title="Logout"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {!sidebarCollapsed ? <span>Logout</span> : null}
          </button>
        </div>
      </aside>

      <div className={`flex min-h-screen flex-col transition-all duration-200 ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-slate-950/95 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
            <button
              type="button"
              className="inline-flex rounded-lg border border-slate-800 p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
              aria-label="Open sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <h1 className="text-lg font-semibold text-slate-100 sm:text-xl">{pageTitle}</h1>

            <div className="ml-auto flex items-center gap-3">
              <label htmlFor={searchId} className="sr-only">
                Search files
              </label>
              <div className="relative hidden sm:block">
                <svg
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                  id={searchId}
                  type="search"
                  placeholder="Search files..."
                  className="w-48 rounded-xl border border-slate-800 bg-slate-900/60 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none lg:w-64"
                />
              </div>

              <NotificationsDropdown />

              <ProfileDropdown user={user} onLogout={handleLogout} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
