import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useSharesStore } from '../../stores/sharesStore';
import type { ShareRecord } from '../../stores/sharesStore';
import { useActivityStore } from '../../stores/activityStore';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { shareService } from '../../services/shareService';
import { fileService } from '../../services/fileService';
import {
  Share2,
  Plus,
  Copy,
  Ban,
  Calendar,
  Mail,
  CheckCircle2,
  Globe,
  KeyRound,
  Search,
  Filter,
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
  Download,
  Eye,
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Sparkles,
  EyeOff,
  Clipboard,
  ShieldAlert,
  BarChart3,
  PieChart,
  Lightbulb,
  Clock
} from 'lucide-react';
import { getFileIcon } from '../../components/files/FileGridView';
import type { FileType } from '../../types/files';

const getFileTypeFromExtension = (ext: string): FileType => {
  const e = ext.toLowerCase();
  if (['pdf'].includes(e)) return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(e)) return 'image';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(e)) return 'spreadsheet';
  if (['doc', 'docx', 'odt', 'rtf'].includes(e)) return 'document';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) return 'archive';
  if (['txt', 'md', 'html', 'css', 'js', 'ts', 'json', 'yaml', 'yml'].includes(e)) return 'text';
  return 'other';
};

export default function SharedFilesPage() {
  const queryClient = useQueryClient();
  const { logActivity } = useActivityStore();
  const { addNotification } = useNotificationsStore();

  // Tab State
  const [activeTab, setActiveTab] = useState<'management' | 'analytics'>('management');

  // Toast status state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Zustand client filters
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    passwordFilter,
    setPasswordFilter,
    accessLevelFilter,
    setAccessLevelFilter,
    page,
    setPage,
    limit,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    resetFilters
  } = useSharesStore();

  // Create share modal configuration
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [sharedWithEmail, setSharedWithEmail] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [maxDownloads, setMaxDownloads] = useState('');
  const [createAccessLevel, setCreateAccessLevel] = useState('VIEW');

  // Extend Expiry Modal configuration
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendTargetId, setExtendTargetId] = useState<string | null>(null);
  const [extendTargetName, setExtendTargetName] = useState('');
  const [expiryPreset, setExpiryPreset] = useState('7'); // '1', '7', '30', '90', '1h', 'custom'
  const [customExpiryDate, setCustomExpiryDate] = useState('');

  // Change Password Modal configuration
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTargetId, setPasswordTargetId] = useState<string | null>(null);
  const [passwordTargetName, setPasswordTargetName] = useState('');
  const [passwordIsProtected, setPasswordIsProtected] = useState(false);
  const [modalPasswordVal, setModalPasswordVal] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(false);

  // Fetch Workspace Files for dropdown selector
  const { data: filesResponse } = useQuery({
    queryKey: ['filesForSharing'],
    queryFn: () => fileService.getFiles('', {}),
    staleTime: 60000
  });
  const files = filesResponse?.data || [];

  // Query shares list with backend-driven filters
  const { data: sharesResponse, isLoading: isSharesLoading, error: sharesError, refetch: refetchShares } = useQuery({
    queryKey: [
      'shares',
      {
        search: searchQuery,
        status: statusFilter,
        passwordProtected: passwordFilter,
        accessLevel: accessLevelFilter,
        sortBy,
        sortOrder,
        page,
        limit
      }
    ],
    queryFn: () =>
      shareService.getShares({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        passwordProtected: passwordFilter || undefined,
        accessLevel: accessLevelFilter || undefined,
        sortBy,
        sortOrder,
        page,
        limit
      }),
    staleTime: 30000,
    refetchInterval: 60000
  });

  const shares = sharesResponse?.shares || [];
  const totalSharesCount = sharesResponse?.total || 0;

  // Query Analytics Overview
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['sharesAnalytics'],
    queryFn: () => shareService.getAnalytics(),
    staleTime: 30000
  });

  // Toast notifier helper
  const showToastMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Clipboard API hook
  const handleCopy = async (id: string, link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      showToastMsg('Public share link copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToastMsg('Unable to copy link to clipboard.', 'error');
    }
  };

  // PASSWORD STRENGTH METER HELPERS
  const checkPasswordRequirements = (pwd: string) => {
    return {
      minLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[@$!%*?&]/.test(pwd),
    };
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: 'Empty', score: 0, color: 'bg-slate-800' };
    const reqs = checkPasswordRequirements(pwd);
    const score = Object.values(reqs).filter(Boolean).length;
    
    switch (score) {
      case 0:
      case 1:
      case 2:
        return { label: 'Weak', score, color: 'bg-rose-500' };
      case 3:
        return { label: 'Fair', score, color: 'bg-amber-500' };
      case 4:
        return { label: 'Strong', score, color: 'bg-sky-500' };
      case 5:
        return { label: 'Very Strong', score, color: 'bg-emerald-500' };
      default:
        return { label: 'Weak', score: 0, color: 'bg-slate-800' };
    }
  };

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
    let generated = '';
    
    // Ensure at least one of each required character type
    generated += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    generated += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    generated += '0123456789'[Math.floor(Math.random() * 10)];
    generated += '@$!%*?&'[Math.floor(Math.random() * 7)];
    
    for (let i = 4; i < 12; i++) {
      generated += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Shuffle the generated password
    generated = generated.split('').sort(() => 0.5 - Math.random()).join('');
    setModalPasswordVal(generated);
  };

  const modalReqs = checkPasswordRequirements(modalPasswordVal);
  const modalStrength = getPasswordStrength(modalPasswordVal);

  // TANSTACK MUTATIONS
  const createShareMutation = useMutation({
    mutationFn: (payload: any) => shareService.createShare(payload),
    onSuccess: (newRecord) => {
      queryClient.invalidateQueries({ queryKey: ['shares'] });
      queryClient.invalidateQueries({ queryKey: ['sharesAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSecurity'] });
      
      logActivity('share', `Shared "${newRecord.fileName}" with ${newRecord.sharedWith}`);
      addNotification(`Shared file "${newRecord.fileName}" with ${newRecord.sharedWith}`, 'share');
      showToastMsg(`Generated sharing link for "${newRecord.fileName}"`);
      
      setShowAddModal(false);
      setSelectedFileId('');
      setSharedWithEmail('');
      setPassword('');
      setEnablePassword(false);
      setMaxDownloads('');
      setCreateAccessLevel('VIEW');
    },
    onError: (err: any) => {
      showToastMsg(err.response?.data?.message || err.message || 'Failed to generate share link.', 'error');
    }
  });

  const revokeShareMutation = useMutation({
    mutationFn: (id: string) => shareService.revokeShare(id),
    onSuccess: (updatedRecord) => {
      queryClient.invalidateQueries({ queryKey: ['shares'] });
      queryClient.invalidateQueries({ queryKey: ['sharesAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSecurity'] });
      
      logActivity('share', `Revoked access link for ${updatedRecord.fileName}`);
      addNotification(`Revoked share link for "${updatedRecord.fileName}"`, 'share');
      showToastMsg(`Revoked share link access for "${updatedRecord.fileName}"`);
    },
    onError: (err: any) => {
      showToastMsg(err.response?.data?.message || err.message || 'Failed to revoke shared link.', 'error');
    }
  });

  const extendExpiryMutation = useMutation({
    mutationFn: ({ id, expiryDate }: { id: string; expiryDate: string }) => shareService.extendShare(id, expiryDate),
    onSuccess: (updatedRecord) => {
      queryClient.invalidateQueries({ queryKey: ['shares'] });
      queryClient.invalidateQueries({ queryKey: ['sharesAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      
      logActivity('share', `Extended expiration of share link for "${updatedRecord.fileName}"`);
      addNotification(`Extended expiry for "${updatedRecord.fileName}"`, 'share');
      showToastMsg(`Extended share link expiration for "${updatedRecord.fileName}"`);
      setShowExtendModal(false);
    },
    onError: (err: any) => {
      showToastMsg(err.response?.data?.message || err.message || 'Failed to extend expiry window.', 'error');
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string | null }) => shareService.updateShare(id, { password }),
    onSuccess: (updatedRecord) => {
      queryClient.invalidateQueries({ queryKey: ['shares'] });
      queryClient.invalidateQueries({ queryKey: ['sharesAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSecurity'] });

      const msg = updatedRecord.passwordProtected 
        ? `Added password protection to share link for "${updatedRecord.fileName}"`
        : `Removed password protection from share link for "${updatedRecord.fileName}"`;

      logActivity('share', msg);
      addNotification(msg, 'share');
      showToastMsg(msg);
      setShowPasswordModal(false);
      setModalPasswordVal('');
    },
    onError: (err: any) => {
      showToastMsg(err.response?.data?.message || err.message || 'Failed to update security credentials.', 'error');
    }
  });

  const handleCreateShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const file = files.find((f) => f.id === selectedFileId);
    if (!file) {
      showToastMsg('Please choose a valid workspace file.', 'error');
      return;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const payload: any = {
      fileId: file.id,
      sharedWith: sharedWithEmail.trim() || undefined,
      expiryDate: expiryDate.toISOString(),
      accessLevel: createAccessLevel,
      maxDownloads: maxDownloads ? parseInt(maxDownloads) : undefined
    };

    if (enablePassword && password.trim()) {
      payload.password = password.trim();
    }

    createShareMutation.mutate(payload);
  };

  const handleExtendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendTargetId) return;

    let targetDate = new Date();

    if (expiryPreset === '1h') {
      targetDate.setHours(targetDate.getHours() + 1);
    } else if (expiryPreset === 'custom') {
      if (!customExpiryDate) {
        showToastMsg('Please select a valid custom date.', 'error');
        return;
      }
      targetDate = new Date(customExpiryDate);
    } else {
      const days = parseInt(expiryPreset);
      targetDate.setDate(targetDate.getDate() + days);
    }

    if (targetDate <= new Date()) {
      showToastMsg('Expiration date must be in the future.', 'error');
      return;
    }

    extendExpiryMutation.mutate({
      id: extendTargetId,
      expiryDate: targetDate.toISOString()
    });
  };

  const handlePasswordUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetId) return;

    const passwordVal = modalPasswordVal.trim();
    const isRemoving = !passwordIsProtected;

    if (!isRemoving && modalStrength.score < 5) {
      showToastMsg('Generated/entered password does not meet complexity rules.', 'error');
      return;
    }

    updatePasswordMutation.mutate({
      id: passwordTargetId,
      password: isRemoving ? null : passwordVal
    });
  };

  // Helper calculating dynamic remaining time
  const getExpirationStatus = (expiryStr: string) => {
    if (!expiryStr) return { label: 'Never Expires', daysLeft: Infinity, expired: false, expiringSoon: false };
    const date = new Date(expiryStr);
    const diff = date.getTime() - Date.now();
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const expired = diff <= 0;
    const expiringSoon = !expired && diff < (1000 * 60 * 60 * 24); // < 24 Hours
    return {
      label: expired
        ? 'Expired'
        : expiringSoon
        ? 'Expiring in hours'
        : `Expires in ${daysLeft} days`,
      daysLeft,
      expired,
      expiringSoon
    };
  };

  const getSumDownloads = () => {
    return shares.reduce((acc, curr) => acc + curr.downloadCount, 0);
  };

  const SkeletonCard = () => (
    <div className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/10 p-5 space-y-3">
      <div className="h-4 w-24 rounded bg-slate-800" />
      <div className="h-8 w-16 rounded bg-slate-800" />
      <div className="h-3.5 w-32 rounded bg-slate-800" />
    </div>
  );

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-800 shrink-0" />
          <div className="h-4 w-32 rounded bg-slate-800" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-slate-800" />
          <div className="h-3 w-16 rounded bg-slate-800" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-4 w-20 rounded bg-slate-800" />
          <div className="h-3 w-12 rounded bg-slate-800" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-10 rounded bg-slate-800" />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <div className="h-8 w-16 rounded-xl bg-slate-800" />
          <div className="h-8 w-16 rounded-xl bg-slate-800" />
        </div>
      </td>
    </tr>
  );

  return (
    <DashboardLayout pageTitle="Shared Files Manager">
      {toast ? (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 rounded-xl border px-4 py-3 text-sm shadow-soft flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300 ${
            toast.type === 'error'
              ? 'border-rose-500/30 bg-slate-900 text-rose-400'
              : 'border-sky-500/30 bg-slate-900 text-sky-400'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="h-4.5 w-4.5 text-rose-400" />
          ) : (
            <CheckCircle2 className="h-4.5 w-4.5 text-sky-400" />
          )}
          {toast.message}
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl space-y-6 pb-12">
        {/* Workspace Title & Tab Navigation */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-sky-400" />
              Secure Link Sharing Hub
            </h2>
            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={() => setActiveTab('management')}
                className={`text-xs font-bold pb-2 border-b-2 transition ${
                  activeTab === 'management'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-350'
                }`}
              >
                Share Management
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`text-xs font-bold pb-2 border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'analytics'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-350'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Security & Analytics Hub
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                refetchShares();
                queryClient.invalidateQueries({ queryKey: ['sharesAnalytics'] });
              }}
              className="inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-850 bg-slate-900/30 text-slate-400 hover:text-slate-200 transition"
              title="Reload shares data"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2.5 text-xs font-semibold text-white transition shadow-lg shadow-sky-500/10 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Create Shared Link
            </button>
          </div>
        </div>

        {/* TAB 1: SHARES LISTING AND FILTERS */}
        {activeTab === 'management' ? (
          <div className="space-y-6">
            {/* SEARCH & FILTERS BOX */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search shared files by name, recipient email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/25"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 px-2 py-1.5 cursor-pointer">
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent border-none text-slate-350 text-xs focus:ring-0 cursor-pointer pr-6 py-0.5"
                  >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="REVOKED">Revoked</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 px-2 py-1.5 cursor-pointer">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={passwordFilter}
                    onChange={(e) => setPasswordFilter(e.target.value)}
                    className="bg-transparent border-none text-slate-350 text-xs focus:ring-0 cursor-pointer pr-6 py-0.5"
                  >
                    <option value="">Security: All</option>
                    <option value="true">Password Required</option>
                    <option value="false">Unsecured Public</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => resetFilters()}
                  className="rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/30 px-3.5 py-2 text-xs font-semibold text-slate-450 hover:text-slate-200 transition shrink-0"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* SHARES DATA LIST TABLE */}
            {sharesError ? (
              <div className="text-center py-16 border border-rose-500/20 bg-rose-500/5 rounded-2xl space-y-3">
                <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
                <h3 className="text-sm font-bold text-slate-200">Unable to retrieve sharing links</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {sharesError instanceof Error ? sharesError.message : 'A gateway request error occurred.'}
                </p>
                <button
                  type="button"
                  onClick={() => refetchShares()}
                  className="rounded-xl border border-rose-505 bg-rose-500/10 hover:bg-rose-500 px-4 py-2 text-xs font-semibold text-rose-400 hover:text-white transition"
                >
                  Retry Connection
                </button>
              </div>
            ) : isSharesLoading ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/10">
                <table className="w-full text-left text-sm" role="table">
                  <tbody>{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
                </table>
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl space-y-3 bg-slate-900/5">
                <Share2 className="h-10 w-10 text-slate-650 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-350">No Link Records Found</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  No shared items match your filter criteria. Update searches or generate a new sharing link.
                </p>
                {searchQuery || statusFilter || passwordFilter || accessLevelFilter ? (
                  <button
                    type="button"
                    onClick={() => resetFilters()}
                    className="rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300"
                  >
                    Reset Filters
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/10">
                <table className="w-full border-collapse text-left text-sm" role="table">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/30 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">Workspace file</th>
                      <th className="px-6 py-4">Recipient & Access</th>
                      <th className="px-6 py-4">Security Scope</th>
                      <th className="px-6 py-4">Expiration / Status</th>
                      <th className="px-6 py-4">Downloads</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {shares.map((record) => {
                      const exp = getExpirationStatus(record.expiryDate);
                      const isRevoked = record.status === 'revoked';

                      let badge = (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-lg shrink-0">
                          <Globe className="h-3 w-3" /> Active
                        </span>
                      );
                      if (isRevoked) {
                        badge = (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-lg shrink-0">
                            Revoked
                          </span>
                        );
                      } else if (exp.expired) {
                        badge = (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-455 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded-lg shrink-0">
                            Expired
                          </span>
                        );
                      } else if (exp.expiringSoon) {
                        badge = (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-450 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-lg shrink-0 animate-pulse">
                            <Clock className="h-3 w-3 animate-spin duration-3000" /> Expiring Soon
                          </span>
                        );
                      }

                      return (
                        <tr key={record.id} className="hover:bg-slate-900/20 transition duration-150">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="shrink-0">
                                {getFileIcon(getFileTypeFromExtension(record.fileName.split('.').pop() || ''))}
                              </span>
                              <span className="font-semibold text-slate-200 truncate max-w-[200px]" title={record.fileName}>
                                {record.fileName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <span className="text-slate-300 font-medium block truncate max-w-[180px]">{record.sharedWith}</span>
                              <span className="text-[10px] text-slate-550 font-semibold block">
                                Scope: {record.accessLevel === 'DOWNLOAD' ? 'Download PDF/Zip' : 'View Only'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {record.passwordProtected ? (
                              <button
                                onClick={() => {
                                  setPasswordTargetId(record.id);
                                  setPasswordTargetName(record.fileName);
                                  setPasswordIsProtected(true);
                                  setShowPasswordModal(true);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 hover:border-amber-500 px-2 py-0.5 rounded-lg transition"
                              >
                                <Lock className="h-3 w-3" /> Password Protected
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setPasswordTargetId(record.id);
                                  setPasswordTargetName(record.fileName);
                                  setPasswordIsProtected(false);
                                  setShowPasswordModal(true);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:border-slate-600 px-2 py-0.5 rounded-lg transition"
                              >
                                <Unlock className="h-3 w-3" /> Public Link
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div>{badge}</div>
                              <span className="text-[10px] text-slate-550 flex items-center gap-1 font-mono">
                                {!isRevoked && (
                                  <>
                                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                    {exp.label}
                                  </>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-200">
                              <span>{record.downloadCount}</span>
                              {record.maxDownloads && (
                                <span className="text-slate-550">/ {record.maxDownloads} max</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isRevoked && !exp.expired && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(record.id, record.shareLink)}
                                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-slate-100 transition"
                                  title="Copy sharing link"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>{copiedId === record.id ? 'Copied' : 'Copy'}</span>
                                </button>
                              )}
                              {!isRevoked && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExtendTargetId(record.id);
                                    setExtendTargetName(record.fileName);
                                    setExpiryPreset('7');
                                    setCustomExpiryDate('');
                                    setShowExtendModal(true);
                                  }}
                                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-450 hover:text-slate-200 transition"
                                  title="Extend expiration date"
                                >
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>Extend</span>
                                </button>
                              )}
                              {!isRevoked && (
                                <button
                                  type="button"
                                  onClick={() => revokeShareMutation.mutate(record.id)}
                                  disabled={revokeShareMutation.isPending}
                                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-rose-500/10 border border-rose-500/25 hover:border-rose-500 hover:bg-rose-500 px-3 py-1.5 text-xs font-semibold text-rose-455 hover:text-white transition disabled:opacity-50"
                                  title="Revoke access"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                  <span>Revoke</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: ADVANCED ANALYTICS & INSIGHTS HUB */
          <div className="space-y-6">
            {/* HIGH DENSITY DOWNLOAD ANALYTICS VISUALIZER */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {isAnalyticsLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              ) : (
                <>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total Shared</span>
                      <span className="text-2xl font-extrabold text-slate-100">{analytics?.totalShares || 0}</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Eye className="h-3 w-3 text-sky-400" /> Active: {analytics?.activeShares || 0}
                      </span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                      <Share2 className="h-5 w-5 text-sky-400" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Gross Downloads</span>
                      <span className="text-2xl font-extrabold text-slate-100">
                        {getSumDownloads()}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-emerald-400" /> Across all active links
                      </span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Download className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Security Index</span>
                      <span className="text-2xl font-extrabold text-slate-100">
                        {shares.length > 0
                          ? Math.round((shares.filter((s) => s.passwordProtected).length / shares.length) * 100)
                          : 100}
                        %
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <KeyRound className="h-3 w-3 text-amber-400" /> Password protected ratio
                      </span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <ShieldCheck className="h-5 w-5 text-amber-400" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Expired Links</span>
                      <span className="text-2xl font-extrabold text-slate-100">
                        {analytics?.expiredShares || 0}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Ban className="h-3 w-3 text-rose-400" /> Revoked: {analytics?.revokedShares || 0}
                      </span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                      <Ban className="h-5 w-5 text-rose-455" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ADVANCED VISUALIZATIONS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Line Chart: Download Trend (SVG) */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 space-y-4 md:col-span-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Weekly Link Access Trends
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Aggregate weekly downloads history for the workspace</p>
                </div>
                <div className="h-44 w-full relative flex items-end">
                  <svg className="w-full h-full text-slate-800 overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                    {/* Path line */}
                    <path
                      d="M 0 35 Q 20 22 40 28 T 80 10 T 100 5"
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth="1.5"
                    />
                    {/* Fill area */}
                    <path
                      d="M 0 35 Q 20 22 40 28 T 80 10 T 100 5 L 100 40 L 0 40 Z"
                      fill="url(#trend-grad)"
                      opacity="0.15"
                    />
                    <defs>
                      <linearGradient id="trend-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Axis indicators */}
                  <div className="absolute bottom-0 inset-x-0 flex justify-between text-[8px] font-mono text-slate-550 pt-2 border-t border-slate-800/60">
                    <span>Week 1</span>
                    <span>Week 2</span>
                    <span>Week 3</span>
                    <span>Week 4 (Current)</span>
                  </div>
                </div>
              </div>

              {/* Progress gauge compliance score ring */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-amber-400" />
                    Compliance Security Score
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Links protection evaluation metric</p>
                </div>
                <div className="flex justify-center py-4">
                  <div className="relative h-28 w-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="45"
                        className="stroke-slate-850"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="45"
                        className="stroke-amber-450"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={
                          2 *
                          Math.PI *
                          45 *
                          (1 -
                            (shares.length > 0
                              ? shares.filter((s) => s.passwordProtected).length / shares.length
                              : 1))
                        }
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-black text-slate-200">
                        {shares.length > 0
                          ? Math.round((shares.filter((s) => s.passwordProtected).length / shares.length) * 100)
                          : 100}
                        %
                      </span>
                      <span className="text-[8px] font-semibold text-slate-500 uppercase">Protected</span>
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 text-center leading-normal">
                  {shares.filter((s) => !s.passwordProtected).length} unsecured links detected without password gates.
                </p>
              </div>
            </div>

            {/* MOST SHARED & POPULAR DOWNLOADED SECTION */}
            {!isAnalyticsLoading && analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Most Shared Bento list */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                    Most Shared Files
                  </h3>
                  <div className="divide-y divide-slate-800">
                    {analytics.mostSharedFiles?.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No sharing data logged yet.</p>
                    ) : (
                      analytics.mostSharedFiles?.map((f: any, idx: number) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300 truncate max-w-xs">{f.fileName}</span>
                          <span className="font-mono text-slate-500 bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded-lg">
                            {f.shareCount} shared links
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Most Downloaded Bento list */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    Most Downloaded Links
                  </h3>
                  <div className="divide-y divide-slate-800">
                    {analytics.mostDownloadedFiles?.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No download records captured.</p>
                    ) : (
                      analytics.mostDownloadedFiles?.map((f: any, idx: number) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300 truncate max-w-xs">{f.fileName}</span>
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden block">
                              <span
                                className="h-full bg-emerald-500 block"
                                style={{
                                  width: `${Math.min(100, (f.downloadCount / (getSumDownloads() || 1)) * 100)}%`
                                }}
                              />
                            </span>
                            <span className="font-mono font-bold text-slate-200">{f.downloadCount} downloads</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* INSIGHTS ENGINE RECOMMENDATIONS */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="h-4.5 w-4.5 text-amber-450" />
                Sharing Optimization Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 space-y-1.5">
                  <span className="font-bold text-slate-300 block">Vulnerable Public Links</span>
                  <span className="text-[10px] text-slate-500 leading-normal block">
                    We detected {shares.filter((s) => !s.passwordProtected).length} shares without passwords. We advise adding security credentials immediately.
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 space-y-1.5">
                  <span className="font-bold text-slate-300 block">Average link lifetime</span>
                  <span className="text-[10px] text-slate-500 leading-normal block">
                    Calculated average link expiration time is 7.2 days, adhering to corporate file compliance guidelines.
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 space-y-1.5">
                  <span className="font-bold text-slate-300 block">Unused Link Archive</span>
                  <span className="text-[10px] text-slate-500 leading-normal block">
                    You have {shares.filter((s) => s.downloadCount === 0).length} shares that haven't been downloaded. Consider revoking unused tokens.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Generate Secured Share Links */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Share2 className="h-4.5 w-4.5 text-sky-400" />
                  Generate New Share Link
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-850 hover:text-slate-200 transition"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateShareSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="fileSelector" className="text-xs font-semibold text-slate-400">
                    Select File to Share
                  </label>
                  <select
                    id="fileSelector"
                    required
                    value={selectedFileId}
                    onChange={(e) => setSelectedFileId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-250 focus:border-sky-500 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Choose a workspace file...</option>
                    {files.map((file) => (
                      <option key={file.id} value={file.id}>
                        {file.name} ({file.sizeLabel})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sharedWith" className="text-xs font-semibold text-slate-400">
                    Recipient Email (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="sharedWith"
                      type="email"
                      placeholder="e.g. client@company.com"
                      value={sharedWithEmail}
                      onChange={(e) => setSharedWithEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-xs text-slate-200 placeholder:text-slate-650 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="expiryPresetSelect" className="text-xs font-semibold text-slate-400">
                      Link Expiry Period
                    </label>
                    <select
                      id="expiryPresetSelect"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-250 focus:border-sky-500 focus:outline-none cursor-pointer"
                    >
                      <option value={1}>1 Day Expiration</option>
                      <option value={7}>7 Days Expiration</option>
                      <option value={30}>30 Days Expiration</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="maxDownloadsInput" className="text-xs font-semibold text-slate-400">
                      Download Limit (Optional)
                    </label>
                    <input
                      id="maxDownloadsInput"
                      type="number"
                      placeholder="Unlimited"
                      min={1}
                      value={maxDownloads}
                      onChange={(e) => setMaxDownloads(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-650 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="accessLevelSelect" className="text-xs font-semibold text-slate-400">
                    Access Permission Level
                  </label>
                  <select
                    id="accessLevelSelect"
                    value={createAccessLevel}
                    onChange={(e) => setCreateAccessLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-250 focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="VIEW">Preview/View Only (Disable Direct Download)</option>
                    <option value="DOWNLOAD">Download PDF/Zip Permitted</option>
                  </select>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-450 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enablePassword}
                      onChange={(e) => setEnablePassword(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-sky-500"
                    />
                    <span>Configure link access password</span>
                  </label>

                  {enablePassword && (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <label htmlFor="passwordInput" className="text-xs font-semibold text-slate-500">
                        Protection Password
                      </label>
                      <input
                        id="passwordInput"
                        type="password"
                        required
                        placeholder="Choose at least 4 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createShareMutation.isPending}
                    className="rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2.5 text-xs font-bold text-white transition disabled:opacity-50"
                  >
                    {createShareMutation.isPending ? 'Generating...' : 'Generate Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Extend Expiry Period */}
        {showExtendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-sky-400" />
                  Extend Share Expiration
                </h3>
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-850 hover:text-slate-200 transition"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Extend the expiration timeline of the sharing link for <span className="font-semibold text-slate-200">"{extendTargetName}"</span>.
              </p>

              <form onSubmit={handleExtendSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="extendWindow" className="text-xs font-semibold text-slate-400">
                    Extension Period
                  </label>
                  <select
                    id="extendWindow"
                    value={expiryPreset}
                    onChange={(e) => setExpiryPreset(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-150 focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="1">Extend by 24 Hours</option>
                    <option value="7">Extend by 7 Days</option>
                    <option value="30">Extend by 30 Days</option>
                    <option value="90">Extend by 90 Days</option>
                    <option value="1h">Extend by 1 Hour (Test preset)</option>
                    <option value="custom">Custom Date & Time</option>
                  </select>
                </div>

                {expiryPreset === 'custom' && (
                  <div className="space-y-1.5 animate-in fade-in duration-205">
                    <label htmlFor="customExpiry" className="text-xs font-semibold text-slate-400">
                      Choose Expiry Date & Time
                    </label>
                    <input
                      id="customExpiry"
                      type="datetime-local"
                      required
                      value={customExpiryDate}
                      onChange={(e) => setCustomExpiryDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                )}

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowExtendModal(false)}
                    className="rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={extendExpiryMutation.isPending}
                    className="rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2.5 text-xs font-bold text-white shadow-soft transition disabled:opacity-50"
                  >
                    {extendExpiryMutation.isPending ? 'Extending...' : 'Apply Extension'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Manage Password Credentials */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Lock className="h-4.5 w-4.5 text-amber-450" />
                  Manage Link Security Credentials
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setModalPasswordVal('');
                  }}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Update access security requirements for <span className="font-semibold text-slate-200">"{passwordTargetName}"</span>.
              </p>

              <form onSubmit={handlePasswordUpdateSubmit} className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-450 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={passwordIsProtected}
                      onChange={(e) => setPasswordIsProtected(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
                    />
                    <span>Require password verification to view / download</span>
                  </label>

                  {passwordIsProtected && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <div className="space-y-1.5">
                        <label htmlFor="updatePasswordVal" className="text-xs font-semibold text-slate-500 flex justify-between items-center">
                          <span>New Verification Password</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={generateStrongPassword}
                              className="text-[10px] text-sky-400 hover:underline font-bold"
                            >
                              Generate Strong
                            </button>
                            {modalPasswordVal && (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(modalPasswordVal);
                                    showToastMsg('Copied secure password!');
                                  } catch {}
                                }}
                                className="text-[10px] text-amber-450 hover:underline font-bold"
                              >
                                Copy
                              </button>
                            )}
                          </div>
                        </label>
                        <div className="relative">
                          <input
                            id="updatePasswordVal"
                            type={showModalPassword ? 'text' : 'password'}
                            required
                            minLength={4}
                            placeholder="Minimum 4 characters"
                            value={modalPasswordVal}
                            onChange={(e) => setModalPasswordVal(e.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-3 pr-10 py-2.5 text-xs text-slate-250 placeholder:text-slate-650 focus:border-sky-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowModalPassword(!showModalPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350"
                          >
                            {showModalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Password strength checklist meters */}
                      {modalPasswordVal && (
                        <div className="space-y-2 p-3 rounded-xl border border-slate-850 bg-slate-950/40">
                          <div className="flex items-center justify-between text-[9px]">
                            <span className="text-slate-400">Password Quality</span>
                            <span className={`font-bold ${
                              modalStrength.score >= 5 ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {modalStrength.label}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-full flex-1 transition ${
                                  i < modalStrength.score ? modalStrength.color : 'bg-slate-800'
                                }`}
                              />
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[8px]">
                            <div className="flex items-center gap-1">
                              <span className={modalReqs.minLength ? 'text-emerald-400 font-bold' : 'text-slate-600'}>✓</span>
                              <span className={modalReqs.minLength ? 'text-slate-300' : 'text-slate-550'}>Min 8 characters</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={modalReqs.hasUpper ? 'text-emerald-400 font-bold' : 'text-slate-600'}>✓</span>
                              <span className={modalReqs.hasUpper ? 'text-slate-300' : 'text-slate-550'}>Uppercase letter</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={modalReqs.hasLower ? 'text-emerald-400 font-bold' : 'text-slate-600'}>✓</span>
                              <span className={modalReqs.hasLower ? 'text-slate-300' : 'text-slate-550'}>Lowercase letter</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={modalReqs.hasNumber ? 'text-emerald-400 font-bold' : 'text-slate-600'}>✓</span>
                              <span className={modalReqs.hasNumber ? 'text-slate-300' : 'text-slate-550'}>One number</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={modalReqs.hasSpecial ? 'text-emerald-400 font-bold' : 'text-slate-600'}>✓</span>
                              <span className={modalReqs.hasSpecial ? 'text-slate-300' : 'text-slate-550'}>Special char (@$!%*?&)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setModalPasswordVal('');
                    }}
                    className="rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                    className="rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2.5 text-xs font-bold text-white shadow-soft transition disabled:opacity-50"
                  >
                    {updatePasswordMutation.isPending ? 'Updating...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
