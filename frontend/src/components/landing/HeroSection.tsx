import type { ReactNode } from 'react';

const services: string[] = ['AWS S3', 'Amazon Cognito', 'AWS Lambda', 'Amazon DynamoDB', 'Amazon CloudFront'];

function ServiceBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-800/90 bg-slate-900/90 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
      {label}
    </span>
  );
}

function InfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-sky-400">{icon}</div>
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <p className="mt-1 font-semibold text-slate-100">{value}</p>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section id="top" className="mt-8 sm:mt-12">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-sky-400">FileFlow</p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-100 sm:text-5xl lg:text-6xl">
            FileFlow — A Nest for File Securing & Sharing Across Teams and Various Platforms
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">
            Securely store, manage, and share files across teams, devices, and platforms through a modern cloud-native experience designed for productivity, collaboration, and trust.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href="#cta"
              className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Get Started
            </a>
            <a
              href="#architecture"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/95 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
            >
              View Architecture
            </a>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {services.map((service) => (
              <ServiceBadge key={service} label={service} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Architecture preview</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-100">Serverless AWS flow</h2>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-slate-950">AWS</span>
            </div>

            <div className="mt-7 space-y-4">
              <InfoCard
                icon={
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                    <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                }
                label="API gateway"
                value="Managed request routing"
              />
              <InfoCard
                icon={
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                    <path d="M4 7h16M4 12h8m-8 5h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                }
                label="Authentication"
                value="Cognito identity management"
              />
              <InfoCard
                icon={
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                    <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M9 9h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                }
                label="Storage"
                value="Encrypted S3 assets"
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-6 text-slate-300 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Why this architecture matters</p>
            <ul className="mt-6 space-y-4 text-sm leading-7">
              <li>• Edge-delivered frontend with CloudFront for fast global access.</li>
              <li>• Serverless APIs powered by Lambda and Amazon API Gateway.</li>
              <li>• Secure file metadata and access control through DynamoDB and Cognito.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
