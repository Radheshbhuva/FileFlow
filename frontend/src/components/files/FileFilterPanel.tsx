import { useFilterStore } from '../../stores/fileStore';
import type { FileType, SharedStatus, FileStatus } from '../../types/files';
import { RotateCcw } from 'lucide-react';

export default function FileFilterPanel() {
  const { filters, setFilters, resetFilters, filterPanelOpen } = useFilterStore();

  if (!filterPanelOpen) return null;

  const fileTypes: { label: string; value: FileType }[] = [
    { label: 'PDF Documents', value: 'pdf' },
    { label: 'Images', value: 'image' },
    { label: 'Spreadsheets', value: 'spreadsheet' },
    { label: 'Text / Code', value: 'text' },
    { label: 'Word Documents', value: 'document' },
    { label: 'Archives', value: 'archive' }
  ];

  const sharedStatuses: { label: string; value: SharedStatus }[] = [
    { label: 'Public Link', value: 'public' },
    { label: 'Shared with Team', value: 'team' },
    { label: 'Private Only', value: 'private' }
  ];

  const fileStatuses: { label: string; value: FileStatus }[] = [
    { label: 'Available', value: 'ready' },
    { label: 'Syncing', value: 'processing' },
    { label: 'Failed', value: 'failed' }
  ];

  const owners = ['Alex Morgan', 'Sarah Jenkins', 'John Smith'];

  const handleToggleType = (type: FileType) => {
    const current = filters.type || [];
    const next = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
    setFilters({ type: next });
  };

  const handleToggleShared = (status: SharedStatus) => {
    const current = filters.sharedStatus || [];
    const next = current.includes(status) ? current.filter((s) => s !== status) : [...current, status];
    setFilters({ sharedStatus: next });
  };

  const handleToggleStatus = (status: FileStatus) => {
    const current = filters.status || [];
    const next = current.includes(status) ? current.filter((s) => s !== status) : [...current, status];
    setFilters({ status: next });
  };

  const handleToggleOwner = (owner: string) => {
    const current = filters.owner || [];
    const next = current.includes(owner) ? current.filter((o) => o !== owner) : [...current, owner];
    setFilters({ owner: next });
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-soft animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-slate-100">Advanced Filters</h3>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-100 transition"
        >
          <RotateCcw className="h-3 w-3" />
          Reset Filters
        </button>
      </div>

      <div className="mt-4 grid gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 text-xs">
        {/* File Types */}
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-400 uppercase tracking-wider">File Type</h4>
          <div className="space-y-1.5">
            {fileTypes.map((t) => (
              <label key={t.value} className="flex items-center gap-2 text-slate-300 hover:text-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.type?.includes(t.value) || false}
                  onChange={() => handleToggleType(t.value)}
                  className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-sky-500/50"
                />
                <span>{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Shared Visibility */}
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-400 uppercase tracking-wider">Sharing Status</h4>
          <div className="space-y-1.5">
            {sharedStatuses.map((s) => (
              <label key={s.value} className="flex items-center gap-2 text-slate-300 hover:text-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.sharedStatus?.includes(s.value) || false}
                  onChange={() => handleToggleShared(s.value)}
                  className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-sky-500/50"
                />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Owner */}
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-400 uppercase tracking-wider">Owner</h4>
          <div className="space-y-1.5">
            {owners.map((owner) => (
              <label key={owner} className="flex items-center gap-2 text-slate-300 hover:text-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.owner?.includes(owner) || false}
                  onChange={() => handleToggleOwner(owner)}
                  className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-sky-500/50"
                />
                <span>{owner}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Security Score & Dates */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-400 uppercase tracking-wider">
              Min Security Score: {filters.minSecurityScore || 0}
            </h4>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.minSecurityScore || 0}
              onChange={(e) => setFilters({ minSecurityScore: parseInt(e.target.value) })}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              aria-label="Minimum security score"
            />
          </div>

          <label className="flex items-center gap-2 text-slate-300 hover:text-slate-100 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={filters.recentlyModified || false}
              onChange={(e) => setFilters({ recentlyModified: e.target.checked })}
              className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-sky-500/50"
            />
            <span>Modified last 7 days</span>
          </label>
        </div>

        {/* Date Ranges */}
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-400 uppercase tracking-wider">Modified Date Range</h4>
          <div className="space-y-2">
            <div>
              <label htmlFor="filter-start-date" className="block text-[10px] text-slate-500 mb-1">
                Start Date
              </label>
              <input
                id="filter-start-date"
                type="date"
                value={filters.dateRange?.start || ''}
                onChange={(e) =>
                  setFilters({ dateRange: { ...filters.dateRange, start: e.target.value } })
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-2 py-1 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="filter-end-date" className="block text-[10px] text-slate-500 mb-1">
                End Date
              </label>
              <input
                id="filter-end-date"
                type="date"
                value={filters.dateRange?.end || ''}
                onChange={(e) =>
                  setFilters({ dateRange: { ...filters.dateRange, end: e.target.value } })
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-2 py-1 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
