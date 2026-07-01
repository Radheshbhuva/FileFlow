import { useFilterStore } from '../../stores/fileStore';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export default function FileSearchBar() {
  const { searchQuery, setSearchQuery, filterPanelOpen, toggleFilterPanel, filters } = useFilterStore();

  let activeFilterCount = 0;
  if (filters.type && filters.type.length > 0) activeFilterCount++;
  if (filters.status && filters.status.length > 0) activeFilterCount++;
  if (filters.sharedStatus && filters.sharedStatus.length > 0) activeFilterCount++;
  if (filters.minSecurityScore && filters.minSecurityScore > 0) activeFilterCount++;
  if (filters.recentlyModified) activeFilterCount++;
  if (filters.dateRange?.start || filters.dateRange?.end) activeFilterCount++;
  if (filters.minSize || filters.maxSize) activeFilterCount++;

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by filename, extension, tags, or owner..."
          className="w-full rounded-xl border border-slate-800 bg-slate-900/40 py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:bg-slate-900/60 focus:outline-none transition duration-150"
          aria-label="Search files"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 focus:text-slate-200"
            aria-label="Clear search input"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={toggleFilterPanel}
        aria-expanded={filterPanelOpen}
        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition duration-150 relative ${
          filterPanelOpen || activeFilterCount > 0
            ? 'border-sky-500 bg-sky-500/10 text-sky-400'
            : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:text-slate-100'
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Filters</span>
        {activeFilterCount > 0 ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white leading-none">
            {activeFilterCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
