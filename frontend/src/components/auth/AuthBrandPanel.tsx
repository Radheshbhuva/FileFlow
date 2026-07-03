import { ShieldCheck, Share2, Users, Database, BarChart3, Globe } from 'lucide-react';

export default function AuthBrandPanel() {
  const highlights = [
    {
      title: 'Secure File Ingestion',
      desc: 'Antivirus scan checks and executable file segregation policies protect your cloud workspaces.',
      icon: <ShieldCheck className="h-5 w-5 text-sky-400" />
    },
    {
      title: 'Real-Time Insights Dashboard',
      desc: 'command intelligence hub automatically calculates capacity limits, recent activity maps, and shares.',
      icon: <BarChart3 className="h-5 w-5 text-teal-400" />
    },
    {
      title: 'Team Shared Spaces',
      desc: 'Seamless collaboration spaces and encrypted shareable link networks.',
      icon: <Users className="h-5 w-5 text-indigo-400" />
    }
  ];

  return (
    <div className="relative flex flex-col justify-between h-full p-8 lg:p-12 z-10 text-slate-100 select-none">
      {/* Absolute background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(1000px_circle_at_80%_10%,rgba(99,102,241,0.16),transparent_50%)] pointer-events-none" />

      {/* Brand Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-sky-500/10 p-2 border border-sky-500/20 shrink-0">
            <Share2 className="h-5 w-5 text-sky-400" />
          </div>
          <span className="text-sm font-bold uppercase tracking-[0.32em] text-sky-400">
            FileFlow
          </span>
        </div>
        <div className="space-y-2.5">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-100 leading-tight">
            Security that feels effortless
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md">
            FileFlow — A Nest for File Securing & Sharing Across Teams and Various Platforms. Securely upload, manage, and share files across teams and platforms with confidence.
          </p>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="mt-8 lg:mt-12 space-y-5">
        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
          Flagship capabilities
        </h2>
        <div className="space-y-4">
          {highlights.map((h, index) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 transition duration-200"
            >
              <div className="mt-0.5 rounded-xl bg-slate-950 p-2.5 border border-slate-850 shrink-0">
                {h.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">{h.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-450">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust indicators & System Status */}
      <div className="mt-8 lg:mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="grid grid-cols-2 gap-6 sm:gap-10">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Files Ingested
            </span>
            <span className="text-base font-extrabold text-slate-200 block mt-1 font-mono">
              2.4M+
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Encryption standard
            </span>
            <span className="text-base font-extrabold text-sky-400 block mt-1 font-mono">
              AES-256
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-850 bg-slate-950/40 px-3.5 py-2 flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 items-center justify-center shrink-0">
            <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10px] font-semibold text-emerald-400">
            All services active
          </span>
        </div>
      </div>
    </div>
  );
}
