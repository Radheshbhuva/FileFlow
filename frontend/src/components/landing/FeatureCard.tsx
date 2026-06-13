import type { ReactNode } from 'react';

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <article className="rounded-3xl border border-slate-800/90 bg-slate-900/90 p-6 shadow-soft transition hover:-translate-y-1 hover:border-slate-700">
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-sky-400">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  );
}

export default FeatureCard;
