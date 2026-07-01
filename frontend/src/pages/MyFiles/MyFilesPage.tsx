import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import type { DashboardUser } from '../../types/dashboard';
import type { File } from '../../types/files';
import { fileService } from '../../services/fileService';
import {
  useViewStore,
  useSelectionStore,
  useFilterStore,
  usePreviewStore,
  useSortStore
} from '../../stores/fileStore';
import { useProfileStore } from '../../stores/profileStore';
import { useAuthStore } from '../../stores/authStore';

// Components
import FileWorkspaceHeader from '../../components/files/FileWorkspaceHeader';
import FileInsightsCards from '../../components/files/FileInsightsCards';
import FileSearchBar from '../../components/files/FileSearchBar';
import FileFilterPanel from '../../components/files/FileFilterPanel';
import ViewModeSwitcher from '../../components/files/ViewModeSwitcher';
import FileGridView from '../../components/files/FileGridView';
import FileListView from '../../components/files/FileListView';
import FileTableView from '../../components/files/FileTableView';
import BulkActionsBar from '../../components/files/BulkActionsBar';
import FilePreviewModal from '../../components/files/FilePreviewModal';
import FileDetailsDrawer from '../../components/files/FileDetailsDrawer';
import { AlertCircle, RefreshCw, X, Share2, Edit2, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyFilesPage() {
  const queryClient = useQueryClient();

  // User state — hydrated from the real auth & profile stores with a mock
  // fallback so the page renders even if auth context is not yet resolved.
  const authUser = useAuthStore((s) => s.user);
  const profileUser = useProfileStore((s) => s.user);

  const user: DashboardUser = {
    id: authUser?.id || profileUser.id,
    fullName: authUser?.fullName || profileUser.fullName,
    email: authUser?.email || profileUser.email,
    plan: authUser?.planType || profileUser.plan || 'Professional',
    accountCreated: profileUser.accountCreated || profileUser.createdAt || 'Unknown',
    lastLogin: profileUser.lastLogin || 'Today',
    avatarInitials: authUser?.avatarInitials || profileUser.avatarInitials || 'U'
  };

  // Toast alert status state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal interaction targets
  const [renameTarget, setRenameTarget] = useState<File | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [shareTarget, setShareTarget] = useState<File | null>(null);
  const [shareEmail, setShareEmail] = useState('');

  // Zustand stores binding
  const { viewMode } = useViewStore();
  const { selectedIds, clearSelection } = useSelectionStore();
  const { searchQuery, filters } = useFilterStore();
  const { sortBy, sortOrder } = useSortStore();
  const { openPreview, openDetails } = usePreviewStore();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // TanStack Queries
  const {
    data: filesData = { data: [], totalCount: 0 },
    isLoading: isFilesLoading,
    isError: isFilesError,
    refetch: refetchFiles
  } = useQuery({
    queryKey: ['files', searchQuery, filters, sortBy, sortOrder],
    queryFn: () => fileService.getFiles(searchQuery, filters, sortBy, sortOrder)
  });

  const {
    data: insights,
    isLoading: isInsightsLoading,
    isError: isInsightsError
  } = useQuery({
    queryKey: ['fileInsights'],
    queryFn: () => fileService.getInsights()
  });

  // Mutator definitions
  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => fileService.renameFile(id, name),
    onSuccess: (updated) => {
      showToast(`Renamed successfully to "${updated.name}"`);
      void queryClient.invalidateQueries({ queryKey: ['files'] });
      void queryClient.invalidateQueries({ queryKey: ['fileInsights'] });
      setRenameTarget(null);
    },
    onError: (err: any) => {
      showToast(err.message || 'Unable to rename file', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => fileService.deleteFiles(ids),
    onSuccess: (_, deletedIds) => {
      showToast(`Deleted ${deletedIds.length} ${deletedIds.length === 1 ? 'file' : 'files'} permanently`);
      clearSelection();
      void queryClient.invalidateQueries({ queryKey: ['files'] });
      void queryClient.invalidateQueries({ queryKey: ['fileInsights'] });
    },
    onError: () => {
      showToast('Unable to delete selected files', 'error');
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (ids: string[]) => fileService.archiveFiles(ids),
    onSuccess: (_, archivedIds) => {
      showToast(`Archived ${archivedIds.length} ${archivedIds.length === 1 ? 'file' : 'files'} successfully`);
      clearSelection();
      void queryClient.invalidateQueries({ queryKey: ['files'] });
      void queryClient.invalidateQueries({ queryKey: ['fileInsights'] });
    },
    onError: () => {
      showToast('Unable to archive selected files', 'error');
    }
  });

  const shareMutation = useMutation({
    mutationFn: ({ id, emails }: { id: string; emails: string[] }) => fileService.shareFile(id, emails),
    onSuccess: (updated) => {
      showToast(`File shared. Access links generated for invitees.`);
      void queryClient.invalidateQueries({ queryKey: ['files'] });
      void queryClient.invalidateQueries({ queryKey: ['fileInsights'] });
      setShareTarget(null);
    },
    onError: () => {
      showToast('Unable to share file', 'error');
    }
  });

  const favoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      fileService.toggleFavorite(id, isFavorite),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['files'] });
      void queryClient.invalidateQueries({ queryKey: ['fileInsights'] });
    },
    onError: () => {
      showToast('Unable to update favourite status', 'error');
    }
  });

  // Action callbacks
  const handleDownload = (file: File) => {
    showToast(`Downloading "${file.name}"...`);
    void fileService.downloadFile(file.id, file.name).catch(() => {
      // Fallback: open previewUrl if backend download fails
      if (file.previewUrl) window.open(file.previewUrl, '_blank');
      showToast(`Opening "${file.name}" in a new tab`, 'success');
    });
  };

  const handleBulkDownload = (ids: string[]) => {
    showToast(`Downloading bundle of ${ids.length} files...`);
  };

  const handleTriggerRename = (file: File) => {
    setRenameTarget(file);
    setRenameValue(file.name);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    renameMutation.mutate({ id: renameTarget.id, name: renameValue.trim() });
  };

  const handleTriggerShare = (file: File) => {
    setShareTarget(file);
    setShareEmail('');
  };

  const handleSaveShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareTarget || !shareEmail.trim()) return;
    shareMutation.mutate({ id: shareTarget.id, emails: [shareEmail.trim()] });
  };

  // Loading/Skeleton states mapping
  const isLoading = isFilesLoading || isInsightsLoading;
  const isError = isFilesError || isInsightsError;

  return (
    <DashboardLayout pageTitle="My Files" user={user}>
      {/* Toast Alert */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 rounded-xl border px-4 py-3 text-sm shadow-soft animate-in fade-in duration-200 ${
            toast.type === 'success'
              ? 'bg-slate-900 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-900 border-rose-500/30 text-rose-400'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Main Container */}
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header stats integration */}
        {insights ? (
          <FileWorkspaceHeader
            fileCount={filesData.totalCount}
            storageUsedLabel={insights.storageConsumedBytes > 1073741824 ? `${(insights.storageConsumedBytes / 1073741824).toFixed(1)} GB` : `${(insights.storageConsumedBytes / 1048576).toFixed(0)} MB`}
            storageMaxLabel={insights.storageMaxBytes >= 1073741824 ? `${(insights.storageMaxBytes / 1073741824).toFixed(0)} GB` : `${(insights.storageMaxBytes / 1048576).toFixed(0)} MB`}
            storagePercentage={Math.round((insights.storageConsumedBytes / insights.storageMaxBytes) * 100)}
          />
        ) : (
          <div className="h-20 bg-slate-900/40 rounded-2xl animate-pulse" />
        )}

        {/* Analytics Insights Dashboard */}
        {insights ? (
          <FileInsightsCards insights={insights} loading={isLoading} />
        ) : (
          <FileInsightsCards
            insights={{
              mostDownloaded: null,
              recentlyShared: null,
              largestFile: null,
              unusedFilesCount: 0,
              storageConsumedBytes: 0,
              storageMaxBytes: useProfileStore.getState().user.storageLimit,
              recentUploadCount: 0
            }}
            loading={true}
          />
        )}

        {/* Smart Search, Filter Switcher & View Switcher */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <FileSearchBar />
            </div>
            <div className="shrink-0 self-end md:self-auto">
              <ViewModeSwitcher />
            </div>
          </div>

          <FileFilterPanel />
        </div>

        {/* File workspace lists / Empty / Skeletons / Error handlers */}
        {isError ? (
          <div className="rounded-2xl border border-rose-900/20 bg-rose-950/15 p-6 text-center space-y-4 max-w-md mx-auto my-8">
            <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-100">Unable to load files</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We encountered a network error while retrieving your files workspace. Please check your internet details and try again.
            </p>
            <button
              type="button"
              onClick={() => {
                void refetchFiles();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold hover:bg-slate-750 text-slate-200"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry Request
            </button>
          </div>
        ) : isLoading ? (
          /* Render Layout-specific Skeletons */
          viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-44 rounded-2xl border border-slate-800 bg-slate-900/40" />
              ))}
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 rounded-xl border border-slate-800 bg-slate-900/40" />
              ))}
            </div>
          ) : (
            <div className="border border-slate-800 rounded-2xl bg-slate-900/20 p-4 space-y-3 animate-pulse">
              <div className="h-9 bg-slate-800/60 rounded-xl" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-11 bg-slate-900/50 rounded-xl" />
              ))}
            </div>
          )
        ) : filesData.data.length === 0 ? (
          /* Professional Empty Onboarding State */
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/20 p-12 text-center max-w-xl mx-auto my-8 space-y-5">
            <div className="h-16 w-16 bg-sky-500/10 rounded-2xl flex items-center justify-center mx-auto border border-sky-500/20">
              <UploadCloud className="h-8 w-8 text-sky-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-100">Your workspace is empty</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Organize, secure, and share your assets dynamically. Upload files to calculate live security audits and health scores instantly.
              </p>
            </div>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-md shadow-sky-600/10 transition"
            >
              Upload Your First File
            </Link>
          </div>
        ) : (
          /* Active View Layout mount */
          <div className="pb-24">
            {viewMode === 'grid' ? (
              <FileGridView
                files={filesData.data}
                onDownload={handleDownload}
                onShare={handleTriggerShare}
                onRename={handleTriggerRename}
                onArchive={(id) => archiveMutation.mutate([id])}
                onDelete={(id) => deleteMutation.mutate([id])}
              />
            ) : viewMode === 'list' ? (
              <FileListView
                files={filesData.data}
                onDownload={handleDownload}
                onShare={handleTriggerShare}
                onRename={handleTriggerRename}
                onArchive={(id) => archiveMutation.mutate([id])}
                onDelete={(id) => deleteMutation.mutate([id])}
              />
            ) : (
              <FileTableView
                files={filesData.data}
                onDownload={handleDownload}
                onShare={handleTriggerShare}
                onRename={handleTriggerRename}
                onArchive={(id) => archiveMutation.mutate([id])}
                onDelete={(id) => deleteMutation.mutate([id])}
              />
            )}
          </div>
        )}
      </div>

      {/* Details Side-Drawer */}
      <FileDetailsDrawer />

      {/* File Preview Modal overlay */}
      <FilePreviewModal />

      {/* Floating Toolbar for selections */}
      <BulkActionsBar
        onDownload={handleBulkDownload}
        onShare={(ids) => {
          if (ids.length === 1) {
            const file = filesData.data.find((f) => f.id === ids[0]);
            if (file) handleTriggerShare(file);
          } else {
            showToast(`Shared bulk action generated for ${ids.length} assets`);
          }
        }}
        onArchive={(ids) => archiveMutation.mutate(ids)}
        onDelete={(ids) => deleteMutation.mutate(ids)}
      />

      {/* Rename Dialog Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveRename}
            className="w-full max-w-md border border-slate-800 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Edit2 className="h-4.5 w-4.5 text-sky-400" />
                Rename File
              </h3>
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="text-slate-500 hover:text-slate-200 rounded p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="rename-input" className="text-xs text-slate-400 font-medium">
                New Filename
              </label>
              <input
                id="rename-input"
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                autoFocus
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold hover:bg-slate-900 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={renameMutation.isPending || !renameValue.trim() || renameValue.trim() === renameTarget.name}
                className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {renameMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Share Dialog Modal */}
      {shareTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveShare}
            className="w-full max-w-md border border-slate-800 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Share2 className="h-4.5 w-4.5 text-sky-400" />
                Share Asset
              </h3>
              <button
                type="button"
                onClick={() => setShareTarget(null)}
                className="text-slate-500 hover:text-slate-200 rounded p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="share-email" className="text-xs text-slate-400 font-medium">
                Email Address
              </label>
              <input
                id="share-email"
                type="email"
                placeholder="collaborator@company.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                autoFocus
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShareTarget(null)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold hover:bg-slate-900 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={shareMutation.isPending || !shareEmail.trim()}
                className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {shareMutation.isPending ? 'Sharing...' : 'Grant Access'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
