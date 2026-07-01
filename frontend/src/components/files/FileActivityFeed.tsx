import type { FileActivity } from '../../types/files';
import { Upload, Download, Share2, Edit2, Trash2, Archive, Clock } from 'lucide-react';

interface FileActivityFeedProps {
  activities: FileActivity[];
  loading?: boolean;
}

const actionIcons = {
  uploaded: <Upload className="h-3.5 w-3.5 text-emerald-400" />,
  downloaded: <Download className="h-3.5 w-3.5 text-sky-400" />,
  shared: <Share2 className="h-3.5 w-3.5 text-indigo-400" />,
  renamed: <Edit2 className="h-3.5 w-3.5 text-amber-400" />,
  deleted: <Trash2 className="h-3.5 w-3.5 text-rose-400" />,
  archived: <Archive className="h-3.5 w-3.5 text-slate-400" />
};

export default function FileActivityFeed({ activities, loading = false }: FileActivityFeedProps) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-7 w-7 rounded-full bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-2 py-0.5">
              <div className="h-3 bg-slate-800 rounded w-3/4" />
              <div className="h-2 bg-slate-800 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <Clock className="h-6 w-6 text-slate-600 mx-auto mb-2" />
        <p className="text-xs text-slate-500">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="relative border-l border-slate-800 pl-4 ml-3 space-y-6">
      {activities.map((act) => {
        const icon = actionIcons[act.action] || <Clock className="h-3.5 w-3.5 text-slate-400" />;
        return (
          <div key={act.id} className="relative">
            <span
              className="absolute -left-[29px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 border border-slate-800"
              aria-hidden="true"
            >
              {icon}
            </span>
            <div className="text-xs">
              <p className="font-medium text-slate-200">
                {act.user} <span className="text-slate-400 font-normal">{act.action}</span> {act.fileName}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">{act.relativeTime}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
