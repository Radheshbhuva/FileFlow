function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/95 px-4 py-10 text-slate-400 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
        <div>
          <p className="text-base font-semibold text-slate-100">FileFlow</p>
          <p className="mt-3 max-w-md text-sm leading-6">
            A Nest for File Securing & Sharing Across Teams and Various Platforms
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Product</p>
          <ul className="mt-4 space-y-2 text-sm leading-6">
            <li>
              <a className="text-slate-300 transition hover:text-white" href="#security">
                Security
              </a>
            </li>
            <li>
              <a className="text-slate-300 transition hover:text-white" href="#pricing">
                Pricing
              </a>
            </li>
            <li>
              <a className="text-slate-300 transition hover:text-white" href="#faq">
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Built with</p>
          <ul className="mt-4 space-y-2 text-sm leading-6">
            <li>React + TypeScript</li>
            <li>Tailwind CSS</li>
            <li>AWS-managed services</li>
          </ul>
        </div>
      </div>

      <div className="mt-10 border-t border-slate-800/80 pt-6 text-sm text-slate-500 sm:flex sm:items-center sm:justify-between">
        <p>© 2026 FileFlow. All rights reserved.</p>
        <a
          href="https://github.com/Radheshbhuva/aws-file-sharing-system.git"
          className="mt-4 inline-block text-slate-300 transition hover:text-white sm:mt-0"
          aria-label="GitHub repository"
          target="_blank"
          rel="noreferrer"
        >
          GitHub Repository
        </a>
      </div>
    </footer>
  );
}

export default Footer;
