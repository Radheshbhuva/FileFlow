import type { ReactNode } from 'react';

export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="w-full rounded-3xl border border-slate-800/90 bg-slate-900/40 p-6 shadow-soft sm:p-8">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-100">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p> : null}
      </header>
      <div className="mt-6">{children}</div>
      {footer ? <footer className="mt-6">{footer}</footer> : null}
    </div>
  );
}

