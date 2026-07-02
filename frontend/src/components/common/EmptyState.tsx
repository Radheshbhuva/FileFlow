import type { ReactNode } from 'react';

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 p-6 text-center">
      {icon ? <div className="mx-auto h-10 w-10">{icon}</div> : null}
      <p className="mt-2 text-sm font-semibold text-slate-100">{title}</p>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

