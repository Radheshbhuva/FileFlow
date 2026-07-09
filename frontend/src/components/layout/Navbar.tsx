import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const navLinks = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Security', href: '#security' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' }
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  function goAuth(path: string) {
    setIsOpen(false);
    navigate(path);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8" aria-label="Primary navigation">
        <a href="#top" className="text-lg font-semibold tracking-tight text-slate-100">
          FileFlow
        </a>

        <button
          type="button"
          className="inline-flex items-center rounded-md border border-slate-700 bg-slate-900/90 p-2 text-slate-200 transition hover:border-slate-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 md:hidden"
          aria-controls="primary-navigation"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className="sr-only">Toggle navigation menu</span>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M3 5h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div className={`flex-1 items-center justify-end md:flex ${isOpen ? 'block' : 'hidden'}`} id="primary-navigation">
          <ul className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/95 p-4 text-sm shadow-xl shadow-slate-950/20 md:ml-8 md:flex md:space-y-0 md:space-x-6 md:border-none md:bg-transparent md:p-0 md:shadow-none">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-xl px-3 py-2 text-slate-200 transition hover:bg-slate-800/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 md:px-0 md:py-0"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}

            <li>
              <a
                href="#cta"
                className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 md:w-auto"
                onClick={() => setIsOpen(false)}
              >
                Get Started
              </a>
            </li>

            <li className="md:ml-2">
              <button
                type="button"
                onClick={() => goAuth('/login')}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 md:w-auto"
              >
                Log In
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={() => goAuth('/register')}
                className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 md:w-auto"
              >
                Create Account
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;

