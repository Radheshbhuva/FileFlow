function CallToAction() {
  return (
    <section id="cta" aria-labelledby="cta-heading" className="mt-20 rounded-[2rem] border border-slate-800/90 bg-slate-950/95 px-6 py-10 shadow-soft sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Ready for the next step?</p>
          <h2 id="cta-heading" className="mt-4 text-3xl font-semibold text-slate-100 sm:text-4xl">
            Ready to Explore Cloud-Native File Sharing?
          </h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="#top"
            className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            Get Started
          </a>
          <a
            href="https://github.com/Radheshbhuva/aws-file-sharing-system.git"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-transparent px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            target="_blank"
            rel="noreferrer"
          >
            View GitHub Repository
          </a>
        </div>
      </div>
    </section>
  );
}

export default CallToAction;
