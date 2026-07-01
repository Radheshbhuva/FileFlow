import type { StorageUsage } from '../../types/dashboard';

interface StorageUsageCardProps {
  storage: StorageUsage;
}

function StorageRing({ percentage }: { percentage: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative mx-auto h-36 w-36" role="img" aria-label={`Storage ${percentage}% used`}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-800" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-sky-500 transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-slate-100">{percentage}%</span>
        <span className="text-xs text-slate-500">Used</span>
      </div>
    </div>
  );
}

export default function StorageUsageCard({ storage }: StorageUsageCardProps) {
  return (
    <section aria-labelledby="storage-heading" className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-6 shadow-soft">
      <header>
        <h2 id="storage-heading" className="text-base font-semibold text-slate-100">
          Storage Usage
        </h2>
        <p className="mt-1 text-sm text-slate-400">Overview of your plan capacity</p>
      </header>

      <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
        <StorageRing percentage={storage.percentage} />

        <dl className="grid w-full flex-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Used</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-100">{storage.usedLabel}</dd>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Available</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-100">{storage.availableLabel}</dd>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Total</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-100">{storage.totalLabel}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{storage.usedLabel} used</span>
          <span>{storage.totalLabel} total</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
          <svg viewBox="0 0 100 4" className="h-2 w-full" preserveAspectRatio="none" aria-hidden="true">
            <rect x="0" y="0" width={storage.percentage} height="4" rx="2" className="fill-sky-500" />
          </svg>
        </div>
      </div>
    </section>
  );
}
