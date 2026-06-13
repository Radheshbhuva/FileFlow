type Step = {
  title: string;
  description: string;
  time: string;
};

function HowItWorksTimeline() {
  const steps: Step[] = [
    {
      title: 'Connect your team',
      description: 'Sign in with identity providers and set role-based access rules for every workspace.',
      time: 'Setup in minutes'
    },
    {
      title: 'Share securely',
      description: 'Upload files, generate share links, and apply expiration + policy-based permissions.',
      time: 'Instant sharing'
    },
    {
      title: 'Track & manage',
      description: 'Audit who accessed what, revoke access instantly, and monitor usage for compliance.',
      time: 'Real-time visibility'
    }
  ];

  return (
    <section id="how-it-works" aria-labelledby="how-it-works-heading" className="mt-16 sm:mt-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">How it works</p>
          <h2 id="how-it-works-heading" className="mt-4 text-3xl font-semibold text-slate-100 sm:text-4xl">
            A faster path from upload to secure sharing
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Designed for enterprise workflows—without the operational overhead.
          </p>
        </div>

        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, idx) => (
            <li key={step.title} className="relative rounded-[2rem] border border-slate-800/90 bg-slate-900/90 p-6 shadow-soft">
              <div className="mb-4 inline-flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-slate-950 font-semibold">
                  {idx + 1}
                </span>
                <span className="text-sm uppercase tracking-[0.18em] text-slate-400">{step.time}</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-100">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default HowItWorksTimeline;

