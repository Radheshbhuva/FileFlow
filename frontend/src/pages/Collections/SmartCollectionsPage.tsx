import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useCollectionsStore } from '../../stores/collectionsStore';
import { collectionService } from '../../services/collectionService';
import { fileService, mapBackendFileToFrontendFile } from '../../services/fileService';
import { usePreviewStore } from '../../stores/fileStore';
import { useActivityStore } from '../../stores/activityStore';
import { useNotificationsStore } from '../../stores/notificationsStore';
import {
  FolderOpen,
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Clock,
  Share2,
  Sparkles,
  Database,
  AlertTriangle,
  Eye,
  Download,
  Trash2,
  Archive,
  RefreshCcw,
  Shield,
  FileText,
  User as UserIcon,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { getFileIcon } from '../../components/files/FileGridView';
import FilePreviewModal from '../../components/files/FilePreviewModal';
import FileDetailsDrawer from '../../components/files/FileDetailsDrawer';
import type { File } from '../../types/files';

const formatBytes = (bytes: number) => {
  if (bytes > 1048576) {
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
};

export default function SmartCollectionsPage() {
  const queryClient = useQueryClient();
  const { openPreview, openDetails } = usePreviewStore();
  const { logActivity } = useActivityStore();
  const { addNotification } = useNotificationsStore();

  const [toast, setToast] = useState<string | null>(null);

  // Zustand State hooks
  const {
    activeCollectionId,
    setActiveCollectionId,
    filters,
    setFilters,
    resetFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
  } = useCollectionsStore();

  const [searchText, setSearchText] = useState(filters.searchText);

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters({ searchText });
    }, 450);
    return () => clearTimeout(handler);
  }, [searchText, setFilters]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Queries for Collections lists and summary
  const { data: collections = [], isLoading: isListLoading, refetch: refetchCollections } = useQuery({
    queryKey: ['collectionsList'],
    queryFn: () => collectionService.getCollectionsList(),
    staleTime: 20000
  });

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['collectionSummary'],
    queryFn: () => collectionService.getCollectionSummary(),
    staleTime: 20000
  });

  // Query actual files inside the expanded collection
  const { data: collectionFiles = [], isLoading: isFilesLoading } = useQuery({
    queryKey: ['collectionFiles', activeCollectionId],
    queryFn: async () => {
      if (!activeCollectionId) return [];
      switch (activeCollectionId) {
        case 'recently-modified':
          return collectionService.getRecentlyModified();
        case 'shared-recently': {
          const items = await collectionService.getSharedRecently();
          // Map to custom file records or adapt representation
          return items.map((item) => ({
            id: item.id,
            name: item.fileName,
            sizeLabel: formatBytes(item.fileSize),
            type: item.fileType,
            lastModified: item.updatedAt,
            security: { score: item.securityScore },
            isFavorite: false,
            owner: { name: 'Workspace Owner', initials: 'WO' },
            shareCount: item.shareCount,
            downloadCount: item.downloadCount,
            lastSharedDate: item.lastSharedDate
          })) as any[];
        }
        case 'favorites': {
          const res = await collectionService.getFavorites();
          return res.files;
        }
        case 'large-files': {
          const res = await collectionService.getLargeFiles();
          return res.files.map((item) => ({
            id: item.id,
            name: item.fileName,
            sizeLabel: formatBytes(item.fileSize),
            type: item.fileType,
            lastModified: item.updatedAt,
            security: { score: item.securityScore },
            isFavorite: false,
            owner: { name: 'Workspace Owner', initials: 'WO' },
            storageImpact: item.storageImpact
          })) as any[];
        }
        case 'needs-attention': {
          const items = await collectionService.getNeedsAttention();
          return items.map((item) => ({
            ...mapBackendFileToFrontendFile(item.file as any),
            reasons: item.reasons,
            riskLevel: item.riskLevel
          }));
        }
        default:
          return [];
      }
    },
    enabled: !!activeCollectionId,
    staleTime: 15000
  });

  // AI recommendations recommendations query
  const { data: aiRecommendations = [] } = useQuery({
    queryKey: ['aiRecommendations'],
    queryFn: () => collectionService.getAIRecommendations(),
    staleTime: 30000
  });

  // MUTATIONS (Favoriting, Archiving, Deletions)
  const favoriteMutation = useMutation({
    mutationFn: ({ id, fav }: { id: string; fav: boolean }) => fileService.toggleFavorite(id, fav),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['collectionFiles'] });
      queryClient.invalidateQueries({ queryKey: ['collectionSummary'] });
      queryClient.invalidateQueries({ queryKey: ['collectionsList'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      
      const msg = updated.isFavorite 
        ? `Added "${updated.name}" to favorites`
        : `Removed "${updated.name}" from favorites`;
      
      logActivity('profile', msg);
      showToastMsg(msg);
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => fileService.archiveFiles([id]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionFiles'] });
      queryClient.invalidateQueries({ queryKey: ['collectionSummary'] });
      queryClient.invalidateQueries({ queryKey: ['collectionsList'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      
      logActivity('profile', `Archived collection file`);
      addNotification(`Archived file from dynamic collection`, 'upload');
      showToastMsg(`File successfully archived.`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fileService.deleteFiles([id]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionFiles'] });
      queryClient.invalidateQueries({ queryKey: ['collectionSummary'] });
      queryClient.invalidateQueries({ queryKey: ['collectionsList'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      
      logActivity('profile', `Permanently deleted file from smart collection`);
      addNotification(`Deleted file`, 'upload');
      showToastMsg(`File permanently deleted.`);
    }
  });

  const getCollectionIcon = (id: string) => {
    switch (id) {
      case 'recently-modified': return <Clock className="h-5 w-5 text-sky-400" />;
      case 'shared-recently': return <Share2 className="h-5 w-5 text-indigo-400" />;
      case 'favorites': return <Sparkles className="h-5 w-5 text-amber-450" />;
      case 'large-files': return <Database className="h-5 w-5 text-purple-400" />;
      case 'needs-attention': return <AlertTriangle className="h-5 w-5 text-rose-455" />;
      default: return <FolderOpen className="h-5 w-5 text-slate-400" />;
    }
  };

  const getCollectionBadge = (id: string) => {
    switch (id) {
      case 'needs-attention': return 'Risk Audited';
      case 'large-files': return 'Impact Alert';
      case 'favorites': return 'Pinned';
      default: return 'Automated';
    }
  };

  // Filter & Search helper mapping
  const filteredFiles = collectionFiles.filter((f) => {
    if (filters.searchText.trim()) {
      const q = filters.searchText.toLowerCase();
      if (!f.name.toLowerCase().includes(q)) return false;
    }
    if (filters.fileType && f.type !== filters.fileType) {
      return false;
    }
    return true;
  });

  return (
    <DashboardLayout pageTitle="Smart Collections Center">
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 rounded-xl border border-sky-500/30 bg-slate-900 px-4 py-3 text-sm text-sky-400 shadow-soft flex items-center gap-2 animate-in fade-in duration-300"
        >
          <CheckCircle className="h-4.5 w-4.5 text-sky-400" />
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-6 pb-12">
        {/* Breadcrumb / Category Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="cursor-pointer hover:text-slate-350" onClick={() => setActiveCollectionId(null)}>
                Smart Collections
              </span>
              {activeCollectionId && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="text-slate-300 capitalize">{activeCollectionId.replace(/-/g, ' ')}</span>
                </>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 mt-1.5">
              <FolderOpen className="h-5 w-5 text-sky-400" />
              {activeCollectionId ? activeCollectionId.replace(/-/g, ' ').toUpperCase() : 'Intelligent Storage Organization'}
            </h2>
          </div>
          {activeCollectionId ? (
            <button
              onClick={() => setActiveCollectionId(null)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-805 bg-slate-900/30 hover:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Collections
            </button>
          ) : (
            <button
              onClick={() => refetchCollections()}
              className="inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-850 bg-slate-900/30 text-slate-400 hover:text-slate-200 transition"
              title="Sync storage counts"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* DEFAULT OVERVIEW VIEW */}
        {!activeCollectionId ? (
          <div className="space-y-6">
            {/* Health & Distribution summary board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isSummaryLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-28 border border-slate-800 bg-slate-900/10 rounded-2xl" />
                ))
              ) : (
                <>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Security Index</span>
                      <span className="text-2xl font-extrabold text-emerald-450">{summary?.healthIndicators.averageSecurityScore || 100}%</span>
                      <span className="text-[10px] text-slate-500 block">Workspace compliance average</span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Shield className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Needs Attention</span>
                      <span className="text-2xl font-extrabold text-rose-455">{summary?.collectionCounts.needsAttention || 0}</span>
                      <span className="text-[10px] text-slate-500 block">Vulnerable/Unsecured items</span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                      <AlertTriangle className="h-5 w-5 text-rose-455" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Large Files Share</span>
                      <span className="text-2xl font-extrabold text-purple-400">
                        {summary?.collectionCounts.largeFiles || 0} files
                      </span>
                      <span className="text-[10px] text-slate-500 block">Consume {Math.round((summary?.collectionMetrics.largeFilesRatio || 0) * 100)}% of quota</span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                      <Database className="h-5 w-5 text-purple-400" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* COLLECTIONS CARDS GRID */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dynamic Smart Views</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {isListLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse h-40 border border-slate-850 rounded-2xl bg-slate-900/10" />
                  ))
                ) : (
                  collections.map((col) => {
                    const icon = getCollectionIcon(col.id);
                    const badge = getCollectionBadge(col.id);
                    return (
                      <div
                        key={col.id}
                        onClick={() => setActiveCollectionId(col.id)}
                        className="group rounded-2xl border border-slate-850 bg-slate-950/15 p-5 flex flex-col justify-between hover:border-slate-700 hover:bg-slate-950/40 cursor-pointer transition duration-200"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-sky-500/40 transition">
                              {icon}
                            </div>
                            <span className="text-[8px] font-bold text-slate-550 border border-slate-850 rounded-lg px-2 py-0.5">
                              {badge}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200 group-hover:text-sky-400 transition leading-tight">
                              {col.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal line-clamp-2">
                              {col.description}
                            </p>
                          </div>
                        </div>
                        <div className="border-t border-slate-850 pt-3 mt-4 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-slate-250 transition">
                          <span>{col.count} items</span>
                          <span>→</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* AI RECOMMENDATIONS FEED */}
            {aiRecommendations.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-amber-450" />
                  AI Suggested Archive Recommendations
                </h3>
                <div className="divide-y divide-slate-850">
                  {aiRecommendations.map((rec) => (
                    <div key={rec.fileId} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-semibold text-slate-200 block">{rec.fileName}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">{rec.recommendationReason}</span>
                      </div>
                      <span className="font-mono text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl shrink-0">
                        {Math.round(rec.confidenceScore * 100)}% Match
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* DETAILED EXPANDED LIST VIEW */
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-550" />
                <input
                  type="text"
                  placeholder={`Search matching files inside this collection...`}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/25"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-955 px-2 py-1 cursor-pointer">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={filters.fileType}
                    onChange={(e) => setFilters({ fileType: e.target.value })}
                    className="bg-transparent border-none text-slate-350 text-xs focus:ring-0 cursor-pointer pr-6 py-1.5"
                  >
                    <option value="">All Formats</option>
                    <option value="pdf">PDF Documents</option>
                    <option value="image">Images</option>
                    <option value="spreadsheet">Spreadsheets</option>
                    <option value="document">Text Docs</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    setSearchText('');
                    resetFilters();
                  }}
                  className="rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/30 px-3.5 py-2 text-xs font-semibold text-slate-450 hover:text-slate-200 transition shrink-0"
                >
                  Reset
                </button>
              </div>
            </div>

            {isFilesLoading ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/10">
                <table className="w-full text-left text-sm" role="table">
                  <tbody>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-slate-800" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-slate-800" /></td>
                        <td className="px-6 py-4 text-right"><div className="h-8 w-16 rounded bg-slate-800 ml-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-20 border border-slate-800 rounded-2xl bg-slate-900/5 space-y-3">
                <FileText className="h-10 w-10 text-slate-650 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-350">No files in view</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  We couldn't locate any records in this smart collection matching your filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/10">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/30 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">Filename</th>
                      <th className="px-6 py-4">File size</th>
                      <th className="px-6 py-4">Safety Index</th>
                      {activeCollectionId === 'large-files' && <th className="px-6 py-4">Storage impact</th>}
                      {activeCollectionId === 'shared-recently' && <th className="px-6 py-4">Share Stats</th>}
                      {activeCollectionId === 'needs-attention' && <th className="px-6 py-4">Attention trigger reasons</th>}
                      <th className="px-6 py-4">Last modified</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-900/20 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="shrink-0">{getFileIcon(file.type)}</span>
                            <div className="min-w-0">
                              <span
                                onClick={() => openDetails(file)}
                                className="font-semibold text-slate-200 hover:text-sky-400 cursor-pointer block truncate max-w-[200px]"
                                title={file.name}
                              >
                                {file.name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-350">{file.sizeLabel}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center text-[9px] font-bold border rounded-lg px-2 py-0.5 ${
                            file.security.score >= 90
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : 'text-amber-450 bg-amber-500/10 border-amber-500/20'
                          }`}>
                            Score: {file.security.score}
                          </span>
                        </td>
                        {activeCollectionId === 'large-files' && (
                          <td className="px-6 py-4 text-purple-400 font-semibold font-mono">
                            {file.storageImpact}%
                          </td>
                        )}
                        {activeCollectionId === 'shared-recently' && (
                          <td className="px-6 py-4 text-indigo-400 font-semibold">
                            {file.downloadCount} DLs ({file.shareCount} links)
                          </td>
                        )}
                        {activeCollectionId === 'needs-attention' && (
                          <td className="px-6 py-4 space-y-1 max-w-[200px]">
                            {file.reasons?.map((r: string, idx: number) => (
                              <span key={idx} className="inline-block text-[8px] font-bold bg-rose-500/10 text-rose-455 border border-rose-500/20 rounded-md px-1.5 py-0.5 mr-1 mb-1">
                                {r.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </td>
                        )}
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(file.lastModified).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openPreview(file)}
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
                              title="Preview file content"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => favoriteMutation.mutate({ id: file.id, fav: !file.isFavorite })}
                              className={`p-1.5 rounded-lg border transition ${
                                file.isFavorite 
                                  ? 'bg-amber-500/10 border-amber-550 text-amber-400 hover:bg-amber-500 hover:text-slate-950' 
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-250'
                              }`}
                            >
                              ★
                            </button>
                            <button
                              type="button"
                              onClick={() => archiveMutation.mutate(file.id)}
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
                              title="Archive File"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMutation.mutate(file.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-455 hover:bg-rose-500 hover:text-white transition"
                              title="Permanently Delete File"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* REUSED MODALS */}
      <FilePreviewModal />
      <FileDetailsDrawer />
    </DashboardLayout>
  );
}
