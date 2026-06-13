import { useId, useState } from 'react';

type FAQ = {
  q: string;
  a: string;
};

function FAQAccordion() {
  const faq: FAQ[] = [
    {
      q: 'Is my data encrypted?',
      a: 'Yes. Files are encrypted at rest and protected in transit. Access is enforced via identity-aware permissions.'
    },
    {
      q: 'Can I revoke access after sharing?',
      a: 'Absolutely. You can revoke share links instantly or set expiration policies so access ends automatically.'
    },
    {
      q: 'Do you support audit logs?',
      a: 'Yes. Admins can review access history and export audit-ready logs for compliance and investigations.'
    },
    {
      q: 'How does role-based access work?',
      a: 'Workspace roles determine who can view, upload, download, and share content. Policies are enforced consistently across the system.'
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section id="faq" aria-labelledby="faq-heading" className="mt-16 sm:mt-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">FAQ</p>
          <h2 id="faq-heading" className="mt-4 text-3xl font-semibold text-slate-100 sm:text-4xl">
            Questions, answered
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Everything you need to know about secure sharing and enterprise control.
          </p>
        </div>

        <div className="mt-10 grid gap-4">
          {faq.map((item, idx) => {
            const isOpen = openIndex === idx;
            const panelId = `${baseId}-panel-${idx}`;
            const buttonId = `${baseId}-button-${idx}`;

            return (
              <div key={item.q} className="rounded-[2rem] border border-slate-800/90 bg-slate-900/90 p-4 shadow-soft">
                <button
                  id={buttonId}
                  type="button"
                  className="flex w-full items-center justify-between gap-4 text-left"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex((current) => (current === idx ? null : idx))}
                >
                  <span className="text-base font-semibold text-slate-100">{item.q}</span>
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-800/90 bg-slate-950/30 text-slate-200 transition ${
                      isOpen ? 'rotate-180 bg-slate-800' : ''
                    }`}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>

                {isOpen && (
                  <div id={panelId} role="region" aria-labelledby={buttonId} className="mt-3 text-sm leading-7 text-slate-400">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQAccordion;

