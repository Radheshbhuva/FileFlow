import type { ReactNode } from 'react';
import AuthBrandPanel from './AuthBrandPanel';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden font-sans">
      <div className="mx-auto w-full max-w-[1440px] grid min-h-screen grid-cols-1 lg:grid-cols-12">
        {/* Left Side: Brand Experience Panel (Spans 5 columns on desktop, hidden on mobile/tablet) */}
        <aside className="hidden lg:block lg:col-span-5 relative border-r border-slate-800 bg-slate-950">
          <AuthBrandPanel />
        </aside>

        {/* Right Side: Authentication Panel (Spans 7 columns on desktop, 12 on mobile) */}
        <main className="col-span-12 lg:col-span-7 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-950 to-slate-900/40 relative">
          {/* Subtle decoration elements for right side background */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full filter blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full filter blur-[80px] pointer-events-none" />

          {/* Form wrapper container */}
          <div className="w-full max-w-[420px] relative z-10 space-y-6">
            {/* Small compact header logo for mobile screens only */}
            <div className="flex items-center gap-2 lg:hidden mb-6 justify-center">
              <div className="rounded-xl bg-sky-500/10 p-1.5 border border-sky-500/20 shrink-0">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-sky-400" fill="none" aria-hidden="true">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-sm font-bold uppercase tracking-[0.25em] text-sky-400">
                FileFlow
              </span>
            </div>

            {/* Render children form */}
            <div className="rounded-2xl border border-slate-850 bg-slate-900/35 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
