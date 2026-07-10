import { useRef } from 'react';
import { useUploadStore } from '../../stores/uploadStore';
import { useFilesStore } from '../../stores/fileStore';
import { uploadService } from '../../services/uploadService';
import { CloudUpload, BarChart2, CheckCircle, Clock, Plus } from 'lucide-react';

export default function UploadHeader() {
  const { queue } = useUploadStore();
  const { files } = useFilesStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate metrics dynamically
  const pendingCount = queue.filter((x) => x.status === 'pending' || x.status === 'uploading').length;
  
  const todayStr = new Date().toDateString();
  const uploadedTodayCount = files.filter((f) => new Date(f.uploadDate).toDateString() === todayStr).length;

  const totalFilesCount = files.length;

  const analytics = uploadService.getUploadAnalytics();

  const handleBrowseTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadService.selectFiles(Array.from(e.target.files));
      e.target.value = ''; // Reset file input
    }
  };

  const metrics = [
    {
      label: 'Uploaded Today',
      value: `${uploadedTodayCount} Files`,
      description: 'Ingested in this session',
      icon: <Clock className="h-4.5 w-4.5 text-sky-400" />,
      bg: 'bg-sky-500/10'
    },
    {
      label: 'Total Workspace Files',
      value: `${totalFilesCount}`,
      description: 'Active database assets',
      icon: <BarChart2 className="h-4.5 w-4.5 text-teal-400" />,
      bg: 'bg-teal-500/10'
    },
    {
      label: 'Upload Success Rate',
      value: `${analytics.uploadSuccessRate}%`,
      description: 'Ingestion health score',
      icon: <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />,
      bg: 'bg-emerald-500/10'
    },
    {
      label: 'Pending Queue',
      value: `${pendingCount} Items`,
      description: 'Waiting in transmission',
      icon: <CloudUpload className="h-4.5 w-4.5 text-indigo-400" />,
      bg: 'bg-indigo-500/10',
      highlight: pendingCount > 0
    }
  ];

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Upload Ingestion Workspace</h2>
        <p className="text-xs text-slate-500 leading-normal">
          Securely stage, validate compliance factors, monitor chunk progress, and analyze sizes before files enter your S3 buckets.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={handleBrowseTrigger}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2.5 text-xs font-semibold text-white shadow-soft transition"
        >
          <Plus className="h-4.5 w-4.5" />
          Browse Files
        </button>
      </div>

      {/* Grid of micro stats cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 w-full md:hidden pt-4">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className={`rounded-xl border p-3.5 flex items-center justify-between ${
              m.highlight ? 'border-sky-500/30 bg-sky-500/5' : 'border-slate-800/80 bg-slate-900/30'
            }`}
          >
            <div className="space-y-1">
              <span className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider block">
                {m.label}
              </span>
              <span className="text-base font-bold text-slate-200 block">
                {m.value}
              </span>
            </div>
            <div className={`rounded-lg p-2 ${m.bg}`}>
              {m.icon}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
