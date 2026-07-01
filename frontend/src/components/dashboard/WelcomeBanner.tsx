interface WelcomeBannerProps {
  userName: string;
  onUpload: () => void;
  onViewFiles: () => void;
}

function formatCurrentDate(): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());
}

export default function WelcomeBanner({ userName, onUpload, onViewFiles }: WelcomeBannerProps) {
  return (
    <section
      aria-labelledby="welcome-heading"
      className="rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 shadow-soft sm:p-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-sky-400">Dashboard</p>
          <h1 id="welcome-heading" className="mt-2 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
            Welcome back, {userName}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Manage, secure, and share your files with confidence.
          </p>
          <time dateTime={new Date().toISOString()} className="mt-3 inline-block text-xs text-slate-500">
            {formatCurrentDate()}
          </time>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onUpload}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M12 16V4m-4 4 4-4 4 4M4 20h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Upload File
          </button>
          <button
            type="button"
            onClick={onViewFiles}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
          >
            View Files
          </button>
        </div>
      </div>
    </section>
  );
}
