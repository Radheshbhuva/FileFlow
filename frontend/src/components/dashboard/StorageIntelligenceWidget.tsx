import { Database, Circle } from 'lucide-react';
import { getFileIcon } from '../files/FileGridView';
import type { FileType } from '../../types/files';

interface StorageInsightsProps {
  data: {
    storageUsed: number;
    storageAvailable: number;
    usagePercentage: number;
    largestFiles: Array<{ id: string; fileName: string; fileSize: number }>;
    storageTrends: Array<{ month: string; bytesUsed: number }>;
    topFileTypes: Array<{ extension: string; count: number; bytes: number }>;
    monthlyGrowthEstimate: number;
  };
}

const categoryColors: Record<string, string> = {
  PDF: 'bg-rose-500',
  IMAGE: 'bg-emerald-500',
  SPREADSHEET: 'bg-teal-500',
  TEXT: 'bg-indigo-500',
  DOCUMENT: 'bg-blue-500',
  ARCHIVE: 'bg-amber-500',
  OTHER: 'bg-slate-500'
};

const categoryTextColors: Record<string, string> = {
  PDF: 'text-rose-400',
  IMAGE: 'text-emerald-400',
  SPREADSHEET: 'text-teal-400',
  TEXT: 'text-indigo-400',
  DOCUMENT: 'text-blue-400',
  ARCHIVE: 'text-amber-400',
  OTHER: 'text-slate-400'
};

function formatSize(bytes: number): string {
  if (bytes >= 1_073_741_824) {
    return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  }
  if (bytes >= 1_048_576) {
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${bytes} B`;
}

// Maps file extensions to category types
function mapExtensionToCategory(ext: string): string {
  const extension = ext.toLowerCase().replace('.', '');
  if (['pdf'].includes(extension)) return 'PDF';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension)) return 'IMAGE';
  if (['xlsx', 'xls', 'csv', 'ods'].includes(extension)) return 'SPREADSHEET';
  if (['docx', 'doc', 'odt', 'rtf'].includes(extension)) return 'DOCUMENT';
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(extension)) return 'ARCHIVE';
  if (['txt', 'md', 'json', 'js', 'ts', 'html', 'css'].includes(extension)) return 'TEXT';
  return 'OTHER';
}

function mapExtensionToType(ext: string): FileType {
  const e = ext.toLowerCase().replace('.', '');
  if (['pdf'].includes(e)) return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(e)) return 'image';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(e)) return 'spreadsheet';
  if (['doc', 'docx', 'odt', 'rtf'].includes(e)) return 'document';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) return 'archive';
  if (['txt', 'md', 'html', 'css', 'js', 'ts', 'json', 'yaml', 'yml'].includes(e)) return 'text';
  return 'other';
}

export default function StorageIntelligenceWidget({ data }: StorageInsightsProps) {
  const storageUsed = formatSize(data.storageUsed);
  const storageMaxBytes = data.storageUsed + data.storageAvailable;
  const storageMax = formatSize(storageMaxBytes);
  const availableStorage = formatSize(data.storageAvailable);
  const storagePercentage = Math.round(data.usagePercentage);

  // Group top file types into category insights
  const categoryMap = new Map<string, { bytes: number; count: number }>();
  data.topFileTypes.forEach((t) => {
    const category = mapExtensionToCategory(t.extension);
    const existing = categoryMap.get(category) || { bytes: 0, count: 0 };
    existing.bytes += t.bytes;
    existing.count += t.count;
    categoryMap.set(category, existing);
  });

  const categoryInsights = Array.from(categoryMap.entries()).map(([name, val]) => {
    const percentage = data.storageUsed > 0 ? (val.bytes / data.storageUsed) * 100 : 0;
    return {
      name,
      sizeBytes: val.bytes,
      sizeLabel: formatSize(val.bytes),
      count: val.count,
      percentage: Math.round(percentage)
    };
  }).sort((a, b) => b.sizeBytes - a.sizeBytes);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-soft flex flex-col justify-between h-auto space-y-4">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Database className="h-4.5 w-4.5 text-sky-400" />
          Storage Intelligence
        </h3>
        <span className="text-xs font-mono font-semibold text-sky-450 bg-sky-500/5 px-2 py-0.5 rounded-lg border border-sky-500/10">
          {storagePercentage}% Allocated
        </span>
      </div>

      {/* Multi-segmented Horizontal Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-[10.5px] font-semibold text-slate-400">
          <span>Used: {storageUsed}</span>
          <span>Max Cap: {storageMax}</span>
        </div>
        <div className="h-2.5 w-full bg-slate-850 rounded-full overflow-hidden flex" role="img" aria-label={`Storage allocation: ${storageUsed} of ${storageMax}`}>
          {categoryInsights.map((cat) => {
            if (cat.percentage === 0) return null;
            const color = categoryColors[cat.name] || 'bg-slate-500';
            return (
              <div
                key={cat.name}
                className={`${color} h-full transition-all`}
                style={{ width: `${(cat.sizeBytes / storageMaxBytes) * 100}%` }}
                title={`${cat.name}: ${cat.sizeLabel} (${cat.percentage}%)`}
              />
            );
          })}
          {/* Remaining Capacity Segment */}
          <div
            className="bg-slate-850 h-full flex-1"
            title={`Available: ${availableStorage}`}
          />
        </div>
      </div>

      {/* Categories Grid - High density list */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {categoryInsights.slice(0, 4).map((cat) => {
          const textColor = categoryTextColors[cat.name] || 'text-slate-400';
          if (cat.count === 0) return null;

          return (
            <div key={cat.name} className="rounded-xl border border-slate-850 bg-slate-950/20 p-2.5 flex items-center gap-2">
              <Circle className={`h-2 w-2 fill-current ${textColor} shrink-0`} />
              <div className="min-w-0 leading-tight">
                <p className="font-semibold text-slate-200 uppercase text-[9px]">
                  {cat.name}
                </p>
                <p className="text-slate-500 text-[10px] mt-0.5">
                  {cat.sizeLabel} • {cat.count} files
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ranked list of largest files */}
      <div className="space-y-2 pt-1 border-t border-slate-850/60">
        <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Ranked Storage Items (Largest)
        </h4>
        <div className="space-y-1.5">
          {data.largestFiles.slice(0, 3).map((file, i) => {
            const ext = file.fileName.split('.').pop() || '';
            return (
              <div
                key={file.id}
                className="flex items-center justify-between text-xs py-1.5 border-b border-slate-850/40 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0 pr-4">
                  <span className="text-[10px] text-slate-600 font-bold font-mono">#{i + 1}</span>
                  <span className="shrink-0">{getFileIcon(mapExtensionToType(ext))}</span>
                  <span className="font-semibold text-slate-300 truncate" title={file.fileName}>
                    {file.fileName}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 shrink-0">
                  {formatSize(file.fileSize)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

