import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '../../stores/fileStore';
import { UploadCloud, Folder, Share2, User, Star, ShieldAlert, Sparkles } from 'lucide-react';

export default function QuickActionsWidget() {
  const navigate = useNavigate();
  const { resetFilters, setFilters } = useFilterStore();

  const handleSmartCollection = (filter: any) => {
    resetFilters();
    setFilters(filter);
    navigate('/my-files');
  };

  const actions = [
    {
      label: 'Upload Files',
      description: 'Upload files to secure buckets',
      icon: <UploadCloud className="h-5 w-5 text-sky-400" />,
      onClick: () => navigate('/upload')
    },
    {
      label: 'View Files',
      description: 'Open files explorer workspace',
      icon: <Folder className="h-5 w-5 text-teal-400" />,
      onClick: () => navigate('/my-files')
    },
    {
      label: 'Shared Links',
      description: 'Manage generated file shares',
      icon: <Share2 className="h-5 w-5 text-indigo-400" />,
      onClick: () => navigate('/shared')
    },
    {
      label: 'Edit Profile',
      description: 'Adjust security and details',
      icon: <User className="h-5 w-5 text-teal-400" />,
      onClick: () => navigate('/profile')
    },
    {
      label: 'View Favorites',
      description: 'List favorited starred items',
      icon: <Star className="h-5 w-5 text-amber-400" />,
      onClick: () => handleSmartCollection({ isFavorite: true })
    },
    {
      label: 'Security Issues',
      description: 'Review access risk flags',
      icon: <ShieldAlert className="h-5 w-5 text-rose-400" />,
      onClick: () => handleSmartCollection({ maxSecurityScore: 69 })
    }
  ];

  const handleKeyDown = (e: React.KeyboardEvent, onClick: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-soft flex flex-col justify-between h-auto space-y-4">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-sky-400" />
          Quick Actions Hub
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">Operations</span>
      </div>

      {/* Grid of Action Tiles */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {actions.map((act, idx) => (
          <div
            key={idx}
            tabIndex={0}
            role="button"
            onClick={act.onClick}
            onKeyDown={(e) => handleKeyDown(e, act.onClick)}
            className="flex items-center gap-3 rounded-xl border border-slate-850 bg-slate-950/20 p-3 text-left transition duration-200 hover:border-slate-700 hover:bg-slate-900/50 hover:shadow-soft group cursor-pointer focus:outline-none focus:ring-1.5 focus:ring-sky-500/50"
            aria-label={`${act.label}: ${act.description}`}
          >
            <div className="rounded-lg bg-slate-950 p-2 border border-slate-850 shrink-0 group-hover:scale-105 transition duration-200">
              {act.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[11.5px] font-bold text-slate-250 group-hover:text-sky-400 transition leading-tight">
                {act.label}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 truncate leading-none">
                {act.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
