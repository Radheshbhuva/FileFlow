import React from 'react';
import { Check, X, Shield, Sparkles, Database, Activity, LayoutGrid, Zap } from 'lucide-react';

export default function ComparisonSection() {
  const comparisonRows = [
    {
      feature: 'Security Score Scans',
      icon: Shield,
      traditional: 'None (Manual verification)',
      fileflow: 'Continuous real-time scans (98/100 average)',
      isBetter: true
    },
    {
      feature: 'Smart File Insights',
      icon: Sparkles,
      traditional: 'Raw files (No index parser)',
      fileflow: 'Metadata extraction & instant content summaries',
      isBetter: true
    },
    {
      feature: 'Storage Analytics',
      icon: Database,
      traditional: 'Simple MB counter',
      fileflow: 'Deep breakdowns by format, duplicate lists, archiving options',
      isBetter: true
    },
    {
      feature: 'Activity Tracking Feed',
      icon: Activity,
      traditional: 'Obscure console audit sheets',
      fileflow: 'Real-time interactive team action dashboard logs',
      isBetter: true
    },
    {
      feature: 'Smart Collections',
      icon: LayoutGrid,
      traditional: 'Static manual directory trees',
      fileflow: 'Automatic tags grouping & pinned folders playlists',
      isBetter: true
    },
    {
      feature: 'Max File Size Support',
      icon: Zap,
      traditional: 'Typically restricted to 100MB-500MB',
      fileflow: 'Up to 10GB uploads via chunked ingress stream',
      isBetter: true
    }
  ];

  return (
    <section id="difference" className="py-24 bg-slate-950 border-t border-slate-900 relative">
      <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-indigo-900/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">The Difference</h2>
          <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Traditional Storage vs. FileFlow Workspace
          </p>
          <p className="mt-4 text-base text-slate-400">
            See how FileFlow goes beyond typical drive storage to deliver a comprehensive collaborative ecosystem.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 shadow-xl">
          {/* Header Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-800 bg-slate-900/50 p-6 text-sm font-bold text-slate-200 gap-4">
            <div className="md:col-span-1">Workspace Feature</div>
            <div className="text-slate-500 hidden md:block">Traditional Cloud Drive</div>
            <div className="text-indigo-400 hidden md:block">FileFlow Workspace</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-850">
            {comparisonRows.map((row, idx) => {
              const Icon = row.icon;
              return (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 p-6 items-center gap-4 hover:bg-slate-900/10 transition-colors">
                  {/* Feature Title (Mobile + Desktop) */}
                  <div className="flex items-center space-x-3 text-sm font-bold text-slate-200">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-450">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{row.feature}</span>
                  </div>

                  {/* Traditional Drive */}
                  <div className="text-xs text-slate-500 flex items-center space-x-2 md:col-span-1 pl-9 md:pl-0">
                    <X className="w-4.5 h-4.5 text-red-500/50 shrink-0 hidden md:block" />
                    <div>
                      <span className="font-bold md:hidden text-slate-600 block mb-0.5">Traditional Drive:</span>
                      <span>{row.traditional}</span>
                    </div>
                  </div>

                  {/* FileFlow Workspace */}
                  <div className="text-xs text-slate-350 flex items-center space-x-2 md:col-span-1 pl-9 md:pl-0">
                    <Check className="w-4.5 h-4.5 text-indigo-400 shrink-0 hidden md:block" />
                    <div>
                      <span className="font-bold md:hidden text-indigo-400 block mb-0.5">FileFlow:</span>
                      <span>{row.fileflow}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Callout box */}
        <div className="max-w-4xl mx-auto mt-12 p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 text-center text-xs text-indigo-300 font-semibold leading-normal">
          ⭐️ FileFlow saves enterprise teams an average of 4.5 hours per engineer, per week, by unifying assets.
        </div>
      </div>
    </section>
  );
}
