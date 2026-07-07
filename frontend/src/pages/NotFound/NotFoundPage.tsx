import { Link } from 'react-router-dom';

import AuthLayout from '../../components/auth/AuthLayout';

export default function NotFoundPage() {
  return (
    <AuthLayout>
      <section aria-label="Page not found">
        <div className="rounded-3xl border border-slate-800/90 bg-slate-900/40 p-6 shadow-soft sm:p-8">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-100">Page Not Found</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/20 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Hint</p>
                  <p className="mt-2 text-sm font-medium text-slate-200">Try the links below to continue your session.</p>
                </div>
                <div className="hidden sm:block">
                  <div className="h-12 w-12 rounded-2xl border border-slate-800/90 bg-slate-900/40" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/"
                className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 sm:w-auto"
              >
                Go Home
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-800/90 bg-slate-900/30 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-900/50 sm:w-auto"
              >
                Open Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AuthLayout>
  );
}

