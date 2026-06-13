import type { ReactNode } from 'react';

function TrustIndicator({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4">
      <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function Highlight({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-800/90 bg-slate-900/60 px-4 py-3">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <p className="text-sm font-medium text-slate-200">{children}</p>
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-2">
        {/* Left panel */}
        <aside className="relative overflow-hidden border-b border-slate-800/80 lg:border-b-0 lg:border-r lg:border-slate-800/80">
          <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(1000px_circle_at_80%_10%,rgba(99,102,241,0.16),transparent_50%)]" />
          <div className="relative p-6 sm:p-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-400">FileFlow</p>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Security that feels effortless</h1>
                <p className="mt-4 max-w-md text-base leading-7 text-slate-400">
                  A Nest for File Securing & Sharing Across Teams and Various Platforms
                </p>
              </div>
              <div className="hidden rounded-2xl border border-slate-800/90 bg-slate-900/60 px-4 py-3 sm:block">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Status</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  <p className="text-sm font-semibold text-emerald-300">All systems operational</p>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <Highlight>Secure File Sharing</Highlight>
              <Highlight>Team Collaboration</Highlight>
              <Highlight>Protected Access</Highlight>
              <Highlight>Cloud-Native Reliability</Highlight>
            </div>

            <div className="mt-8 space-y-4">
              <TrustIndicator
                title="End-to-end trust"
                description="Modern authentication flows designed for security, clarity, and fewer support tickets."
              />
              <TrustIndicator
                title="Built for teams"
                description="Role-based collaboration patterns and protected access—ready for real SaaS usage."
              />
            </div>

            <div className="mt-8 rounded-3xl border border-slate-800/90 bg-slate-900/40 p-5">
              <p className="text-sm font-semibold text-slate-100">Why you’ll like it</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>Subtle loading and error states—always predictable.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>Keyboard-first accessibility with clear focus states.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>Real-time validation for a smoother sign-up experience.</span>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Right panel */}
        <main className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}

