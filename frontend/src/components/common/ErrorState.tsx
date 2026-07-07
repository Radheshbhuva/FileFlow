import type { ReactNode } from 'react';

export default function ErrorState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-400/10 text-rose-300">
            {icon}
          </div>
        ) : null}
        <div className="flex-1">
          <p className="text-sm font-semibold text-rose-200">{title}</p>
          {description ? <p className="mt-2 text-sm leading-6 text-rose-100">{description}</p> : null}
          {action ? <div className="mt-5">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

