import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useSearchStore } from '../../stores/searchStore';
import { usePreviewStore } from '../../stores/fileStore';
import { searchService } from '../../services/searchService';
import { fileService } from '../../services/fileService';
import { useActivityStore } from '../../stores/activityStore';
import { useNotificationsStore } from '../../stores/notificationsStore';
import {
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  Clock,
  Database,
  FileText,
  AlertTriangle,
  FolderLock,
  ChevronDown,
  ArrowUpDown,
  History,
  X,
  Keyboard,
  Info,
  CheckCircle2,
  Lock,
  Eye,
  Download,
  Share2,
  Trash2,
  Archive,
  RefreshCcw,
  SlidersHorizontal
} from 'lucide-react';
import { getFileIcon } from '../../components/files/FileGridView';
import FilePreviewModal from '../../components/files/FilePreviewModal';
import FileDetailsDrawer from '../../components/files/FileDetailsDrawer';
import type { File } from '../../types/files';

export default function SearchCenterPage() {
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { logActivity } = useActivityStore();
  const { addNotification } = useNotificationsStore();

  const [toast, setToast] = useState<string | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'trending'>('discover');

  // Preview / Detail Targets
  const { openPreview, openDetails } = usePreviewStore();

  // Zustand State selectors
  const {
    query,
    setQuery,
    filters,
    updateFilters,
    resetFilters,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    page,
    setPage,
    limit
  } = useSearchStore();

  // Local state for debounced search suggestions
  const [focused, setFocused] = useState(false);
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  // Debounce helper
  useEffect(() => {
    const handler = setTimeout(() => {
      setQuery(localQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [localQuery, setQuery]);

  // Keyboard shortcut listener: focus with "/" or "Ctrl+K"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || e.key === '/') {
        // Prevent default browser search behavior
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch search suggestions matching input query
  const { data: suggestionsData } = useQuery({
    queryKey: ['searchSuggestions', query],
    queryFn: () => searchService.getSuggestions(query),
    enabled: query.length > 0,
    staleTime: 10000
  });

  // Query actual filtered search results from backend
  const { data: resultsResponse, isLoading: isSearchLoading, error: searchError } = useQuery({
    queryKey: ['searchResults', { query, filters, sortBy, sortOrder, page, limit }],
    queryFn: () =>
      searchService.searchFiles({
        query: query || undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        sort: { field: sortBy, order: sortOrder },
        page,
        limit
      }),
    enabled: query.length > 0 || Object.keys(filters).length > 0,
    staleTime: 30000
  });

  const searchResults = resultsResponse?.files || [];
  const totalResults = resultsResponse?.total || 0;

  // Query Workspace Discovery data
  const { data: discoverData, isLoading: isDiscoverLoading } = useQuery({
    queryKey: ['searchDiscovery'],
    queryFn: () => searchService.getDiscovery(),
    staleTime: 30000
  });

  // Query Workspace Trending metrics
  const { data: trendingData, isLoading: isTrendingLoading } = useQuery({
    queryKey: ['searchTrending'],
    queryFn: () => searchService.getTrending(),
    staleTime: 30000
  });

  // MUTATIONS (Quick actions)
  const favoriteMutation = useMutation({
    mutationFn: ({ id, fav }: { id: string; fav: boolean }) => fileService.toggleFavorite(id, fav),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['searchResults'] });
      queryClient.invalidateQueries({ queryKey: ['searchDiscovery'] });
      queryClient.invalidateQueries({ queryKey: ['searchTrending'] });
      queryClient.invalidateQueries({ queryKey: ['fileInsights'] });
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
    onSuccess: (_, fileId) => {
      queryClient.invalidateQueries({ queryKey: ['searchResults'] });
      queryClient.invalidateQueries({ queryKey: ['searchDiscovery'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      
      logActivity('profile', `Archived workspace file`);
      addNotification(`Archived file`, 'upload');
      showToastMsg(`File successfully archived.`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fileService.deleteFiles([id]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchResults'] });
      queryClient.invalidateQueries({ queryKey: ['searchDiscovery'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['fileInsights'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      
      logActivity('profile', `Deleted file from workspace`);
      addNotification(`Deleted file`, 'upload');
      showToastMsg(`File permanently deleted.`);
    }
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      addRecentSearch(localQuery.trim());
      setQuery(localQuery.trim());
    }
  };

  const getDiscoverySectionTitle = (key: string) => {
    switch (key) {
      case 'recentlyModified': return 'Recently Modified';
      case 'frequentlyAccessed': return 'Frequently Accessed';
      case 'recentlyShared': return 'Recently Shared';
      case 'favorites': return 'Workspace Favorites';
      case 'largeFiles': return 'Large Files (>100MB)';
      case 'needsAttention': return 'Needs Attention';
      default: return key;
    }
  };

  const SkeletonCard = () => (
    <div className="animate-pulse rounded-2xl border border-slate-805 bg-slate-900/10 p-5 space-y-4">
      <div className="h-4 w-24 bg-slate-800 rounded" />
      <div className="space-y-2 pt-2">
        <div className="h-3 w-full bg-slate-800 rounded" />
        <div className="h-3 w-5/6 bg-slate-800 rounded" />
      </div>
    </div>
  );

  const DiscoveryBlock = ({ title, files, icon }: { title: string; files: File[]; icon: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {icon}
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{title}</h3>
      </div>
      {files.length === 0 ? (
        <p className="text-xs text-slate-500 py-3 text-center">No cataloged files.</p>
      ) : (
        <div className="space-y-3">
          {files.slice(0, 4).map((file) => (
            <div key={file.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="shrink-0">{getFileIcon(file.type)}</span>
                <span
                  onClick={() => openDetails(file)}
                  className="text-xs font-medium text-slate-350 hover:text-sky-400 truncate cursor-pointer transition"
                  title={file.name}
                >
                  {file.name}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono group-hover:text-slate-400 transition shrink-0 ml-2">
                {file.sizeLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout pageTitle="Enterprise Search Center">
      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 rounded-xl border border-sky-500/30 bg-slate-900 px-4 py-3 text-sm text-sky-400 shadow-soft flex items-center gap-2 animate-in fade-in duration-350"
        >
          <CheckCircle2 className="h-4.5 w-4.5 text-sky-400" />
          {toast}
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl space-y-6 pb-12">
        {/* Header Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Search className="h-5 w-5 text-sky-400" />
              Unified Knowledge Search
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-normal">
              Locate files across workspaces using metadata queries, advanced filters, and discovery widgets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowFilterDrawer((d) => !d)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition shrink-0 ${
              showFilterDrawer 
                ? 'border-sky-500/30 bg-sky-500/10 text-sky-450' 
                : 'border-slate-800 bg-slate-900/30 text-slate-300 hover:border-slate-700'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Advanced Filters
          </button>
        </div>

        {/* SEARCH BAR AREA */}
        <div className="relative">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={localQuery}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder='Search by filename, owner name, security tags... (Press "/" or "Ctrl+K" to focus)'
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3.5 pl-12 pr-16 text-sm text-slate-200 placeholder:text-slate-650 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/25"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-mono text-slate-600 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                <Keyboard className="h-3.5 w-3.5 text-slate-600" />
                Ctrl+K
              </div>
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-sky-500 hover:bg-sky-400 px-6 py-3.5 text-xs font-semibold text-white transition shadow-lg shadow-sky-500/10"
            >
              Search
            </button>
          </form>

          {/* Suggestions Dropdown */}
          {focused && (localQuery || suggestionsData) && (
            <div className="absolute left-0 right-0 z-45 mt-2 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl space-y-4 animate-in slide-in-from-top-2 duration-150">
              {suggestionsData?.recentSearches && suggestionsData.recentSearches.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recent Searches</span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestionsData.recentSearches.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setLocalQuery(q);
                          setQuery(q);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-sky-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-850 transition"
                      >
                        <History className="h-3 w-3 text-slate-500" />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {suggestionsData?.suggestedFiles && suggestionsData.suggestedFiles.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Matching Files</span>
                  <div className="space-y-1.5">
                    {suggestionsData.suggestedFiles.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => {
                          openDetails(file);
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-950 cursor-pointer transition text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.type)}
                          <span className="font-semibold text-slate-200">{file.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{file.sizeLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ADVANCED FILTER DRAWER */}
        {showFilterDrawer && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-3 duration-250">
            <div className="space-y-1.5">
              <label htmlFor="filterType" className="text-xs font-bold text-slate-400 uppercase tracking-wider block">File Category</label>
              <select
                id="filterType"
                value={filters.fileType || ''}
                onChange={(e) => updateFilters({ fileType: e.target.value || undefined })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="">All Formats</option>
                <option value="pdf">PDF Documents</option>
                <option value="image">Images</option>
                <option value="spreadsheet">Spreadsheets</option>
                <option value="document">Text Docs</option>
                <option value="archive">Archives</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="filterSize" className="text-xs font-bold text-slate-400 uppercase tracking-wider block">File Size bounds</label>
              <select
                id="filterSize"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'small') updateFilters({ minSize: 0, maxSize: 1048576 });
                  else if (val === 'medium') updateFilters({ minSize: 1048576, maxSize: 104857600 });
                  else if (val === 'large') updateFilters({ minSize: 104857600, maxSize: undefined });
                  else updateFilters({ minSize: undefined, maxSize: undefined });
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="">Any Size</option>
                <option value="small">Small (&lt; 1MB)</option>
                <option value="medium">Medium (1MB - 100MB)</option>
                <option value="large">Large (&gt; 100MB)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="filterSecurity" className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Safety Rating</label>
              <select
                id="filterSecurity"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'secure') updateFilters({ minSecurityScore: 90, maxSecurityScore: 100 });
                  else if (val === 'attention') updateFilters({ minSecurityScore: 0, maxSecurityScore: 89 });
                  else updateFilters({ minSecurityScore: undefined, maxSecurityScore: undefined });
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="">Any Safety Index</option>
                <option value="secure">Highly Secure (90+ Score)</option>
                <option value="attention">Needs Review (&lt; 90 Score)</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => resetFilters()}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900/60 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition"
              >
                Clear Settings
              </button>
            </div>
          </div>
        )}

        {/* RESULTS PANEL */}
        {query || Object.keys(filters).length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200">Search Results</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Sorting:</span>
                <button
                  onClick={() => setSortBy(sortBy === 'relevance' ? 'recently_modified' : sortBy === 'recently_modified' ? 'file_size' : 'relevance')}
                  className="font-semibold text-slate-300 underline cursor-pointer"
                >
                  {sortBy === 'relevance' ? 'Relevance' : sortBy === 'recently_modified' ? 'Recently Modified' : 'File Size'}
                </button>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1 rounded bg-slate-950 text-slate-400 hover:text-slate-200 transition"
                >
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </div>
            </div>

            {isSearchLoading ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/10">
                <table className="w-full text-left text-sm" role="table">
                  <tbody>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-slate-800" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-slate-800" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-slate-800" /></td>
                        <td className="px-6 py-4 text-right"><div className="h-8 w-16 rounded bg-slate-800 justify-end ml-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-20 border border-slate-800 rounded-2xl bg-slate-900/5 space-y-3">
                <AlertTriangle className="h-10 w-10 text-slate-650 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-350">No Matching Files</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  We couldn't locate any records matching your search queries. Try resetting filters or terms.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setLocalQuery('');
                    resetFilters();
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300"
                >
                  Reset Search
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/10">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/30 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">File parameters</th>
                      <th className="px-6 py-4">Size</th>
                      <th className="px-6 py-4">Safety Index</th>
                      <th className="px-6 py-4">Modified date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {searchResults.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-900/20 transition duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="shrink-0">{getFileIcon(file.type)}</span>
                            <div className="min-w-0">
                              <span
                                onClick={() => openDetails(file)}
                                className="font-semibold text-slate-200 hover:text-sky-400 cursor-pointer block truncate max-w-[240px]"
                                title={file.name}
                              >
                                {file.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium block">
                                Owner: {file.owner.name} ({file.owner.initials})
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-350">{file.sizeLabel}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center text-[10px] font-bold border rounded-lg px-2 py-0.5 ${
                              file.security.score >= 90
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                : 'text-amber-450 bg-amber-500/10 border-amber-500/20'
                            }`}
                          >
                            Score: {file.security.score}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(file.lastModified).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openPreview(file)}
                              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
                              title="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (file.previewUrl) window.open(file.previewUrl);
                              }}
                              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => favoriteMutation.mutate({ id: file.id, fav: !file.isFavorite })}
                              className={`p-2 rounded-xl border transition ${
                                file.isFavorite 
                                  ? 'bg-amber-500/10 border-amber-550 text-amber-400 hover:bg-amber-500 hover:text-slate-950' 
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              ★
                            </button>
                            <button
                              type="button"
                              onClick={() => archiveMutation.mutate(file.id)}
                              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
                              title="Archive"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMutation.mutate(file.id)}
                              className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-450 hover:bg-rose-500 hover:text-white transition"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
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
        ) : (
          /* DISCOVERY & TRENDING SWITCH FEED */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex border-b border-slate-800 gap-4">
              <button
                onClick={() => setActiveTab('discover')}
                className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition ${
                  activeTab === 'discover' 
                    ? 'border-sky-500 text-sky-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-350'
                }`}
              >
                Workspace Discovery
              </button>
              <button
                onClick={() => setActiveTab('trending')}
                className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition ${
                  activeTab === 'trending' 
                    ? 'border-sky-500 text-sky-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-350'
                }`}
              >
                Trending Analysis
              </button>
            </div>

            {activeTab === 'discover' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isDiscoverLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                  <>
                    <DiscoveryBlock
                      title="Recently Modified"
                      files={discoverData?.recentlyModified || []}
                      icon={<Clock className="h-4.5 w-4.5 text-sky-400" />}
                    />
                    <DiscoveryBlock
                      title="Frequently Accessed"
                      files={discoverData?.frequentlyAccessed || []}
                      icon={<TrendingUp className="h-4.5 w-4.5 text-emerald-450" />}
                    />
                    <DiscoveryBlock
                      title="Workspace Favorites"
                      files={discoverData?.favorites || []}
                      icon={<Sparkles className="h-4.5 w-4.5 text-amber-450" />}
                    />
                    <DiscoveryBlock
                      title="Large Files"
                      files={discoverData?.largeFiles || []}
                      icon={<Database className="h-4.5 w-4.5 text-indigo-400" />}
                    />
                    <DiscoveryBlock
                      title="Needs Attention"
                      files={discoverData?.needsAttention || []}
                      icon={<AlertTriangle className="h-4.5 w-4.5 text-rose-455" />}
                    />
                    <DiscoveryBlock
                      title="Recently Shared"
                      files={discoverData?.recentlyShared || []}
                      icon={<Share2 className="h-4.5 w-4.5 text-sky-400" />}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-4.5 w-4.5 text-emerald-450" />
                    Top Downloaded Links
                  </h3>
                  <div className="divide-y divide-slate-850">
                    {trendingData?.mostDownloaded?.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No downloads logged.</p>
                    ) : (
                      trendingData?.mostDownloaded.map((f) => (
                        <div key={f.id} className="py-3 flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-300">{f.name}</span>
                          <span className="font-mono text-slate-500">{f.sizeLabel}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Share2 className="h-4.5 w-4.5 text-sky-400" />
                    Frequently Shared Files
                  </h3>
                  <div className="divide-y divide-slate-850">
                    {trendingData?.mostShared?.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No shares logged.</p>
                    ) : (
                      trendingData?.mostShared.map((f) => (
                        <div key={f.id} className="py-3 flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-300">{f.name}</span>
                          <span className="font-mono text-slate-500 bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded-lg">
                            Active links
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FILE PREVIEW MODAL */}
      <FilePreviewModal />

      {/* FILE DETAILS DRAWER */}
      <FileDetailsDrawer />
    </DashboardLayout>
  );
}
