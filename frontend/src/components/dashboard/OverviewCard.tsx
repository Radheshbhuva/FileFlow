import type { OverviewMetric } from '../../types/dashboard';

const iconMap = {
  files: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  storage: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  shares: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  team: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
};

interface OverviewCardProps {
  metric: OverviewMetric;
}

export default function OverviewCard({ metric }: OverviewCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
          {iconMap[metric.icon]}
        </div>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-100">{metric.value}</p>
      <h3 className="mt-1 text-sm font-medium text-slate-300">{metric.label}</h3>
      <p className="mt-2 text-xs leading-5 text-slate-500">{metric.supportingText}</p>
      {metric.progress !== undefined ? (
        <div className="mt-4">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-valuenow={metric.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${metric.label} progress`}
          >
            <svg viewBox="0 0 100 4" className="h-1.5 w-full" preserveAspectRatio="none" aria-hidden="true">
              <rect x="0" y="0" width={metric.progress} height="4" rx="2" className="fill-sky-500" />
            </svg>
          </div>
        </div>
      ) : null}
    </article>
  );
}
