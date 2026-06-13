function SocialProofMetrics() {
  const metrics = [
    { value: '99.99%', label: 'Uptime' },
    { value: 'SOC 2', label: 'Controls-ready' },
    { value: '50M+', label: 'Files shared' },
    { value: '0.5s', label: 'Median download' }
  ];

  return (
    <section aria-label="Social proof metrics" className="mt-14 sm:mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-[2rem] border border-slate-800/90 bg-slate-900/70 p-6 shadow-soft sm:p-10 md:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="text-center">
              <div className="text-4xl font-semibold tracking-tight text-slate-100">{m.value}</div>
              <div className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-slate-400">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SocialProofMetrics;

