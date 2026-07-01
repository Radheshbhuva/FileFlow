import { useViewStore } from '../../stores/fileStore';
import { LayoutGrid, List, TableProperties } from 'lucide-react';

export default function ViewModeSwitcher() {
  const { viewMode, setViewMode } = useViewStore();

  return (
    <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/40 p-1" role="tablist" aria-label="File layout view modes">
      <button
        type="button"
        role="tab"
        aria-selected={viewMode === 'grid'}
        onClick={() => setViewMode('grid')}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          viewMode === 'grid' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
        }`}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Grid</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={viewMode === 'list'}
        onClick={() => setViewMode('list')}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          viewMode === 'list' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
        }`}
        aria-label="List view"
      >
        <List className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">List</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={viewMode === 'table'}
        onClick={() => setViewMode('table')}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          viewMode === 'table' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
        }`}
        aria-label="Table view"
      >
        <TableProperties className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Table</span>
      </button>
    </div>
  );
}
