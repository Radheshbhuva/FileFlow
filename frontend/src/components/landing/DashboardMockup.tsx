function DashboardMockup() {
  return (
    <section id="dashboard" aria-labelledby="dashboard-heading" className="mt-16 sm:mt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Dashboard</p>
            <h2 id="dashboard-heading" className="mt-4 text-3xl font-semibold text-slate-100 sm:text-4xl">
              Give admins visibility in seconds
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              A clean, role-aware view of usage, access activity, and sharing status—built for fast reviews.
            </p>
          </div>

          <div className="w-full lg:max-w-xl">
            <div className="rounded-[2rem] border border-slate-800/90 bg-slate-950/60 p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-sm font-medium text-slate-300">Workspace Admin</div>
                <div className="h-8 w-8 rounded-xl bg-slate-800" aria-hidden="true" />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4">
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Active shares</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-100">1,284</div>
                  <div className="mt-2 text-sm text-slate-400">+8% this week</div>
                </div>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4">
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Revoked links</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-100">43</div>
                  <div className="mt-2 text-sm text-slate-400">Policy enforcement</div>
                </div>
                <div className="sm:col-span-2 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Recent activity</div>
                      <div className="mt-2 text-sm font-semibold text-slate-100">Access events</div>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 px-3 py-1 text-xs text-slate-300">Last 24h</div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between gap-4 rounded-xl border border-slate-800/60 bg-slate-950/30 px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-slate-800" aria-hidden="true" />
                          <div>
                            <div className="text-sm font-medium text-slate-100">alex@company.com</div>
                            <div className="text-xs text-slate-400">Downloaded report_v{i}.pdf</div>
                          </div>
                        </div>
                        <div className="text-xs font-medium text-emerald-300">Success</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-400">Export audit logs • Alerts • Access reviews</div>
                <button className="rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                  Review compliance
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardMockup;

