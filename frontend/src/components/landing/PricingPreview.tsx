type PricingTier = {
  name: string;
  price: string;
  description: string;
  highlight?: boolean;
  features: string[];
};

function PricingPreview() {
  const tiers: PricingTier[] = [
    {
      name: 'Starter',
      price: '$0',
      description: 'For individuals and small teams getting started.',
      features: ['Up to 3 workspaces', 'Encrypted storage', 'Share links with expiration']
    },
    {
      name: 'Business',
      price: '$12',
      description: 'For growing orgs that need control and auditability.',
      highlight: true,
      features: ['Role-based access control', 'Audit logs & exports', 'Admin dashboard & alerts', 'Priority support']
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large teams with advanced compliance requirements.',
      features: ['Custom retention policies', 'SSO/SAML integration', 'Dedicated compliance review support', 'SLA & onboarding']
    }
  ];

  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="mt-16 sm:mt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Pricing</p>
          <h2 id="pricing-heading" className="mt-4 text-3xl font-semibold text-slate-100 sm:text-4xl">
            Simple plans that scale with your organization
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Start free, then unlock enterprise security and visibility when you need it.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={`relative rounded-[2rem] border p-6 shadow-soft transition ${
                tier.highlight
                  ? 'border-sky-500/70 bg-slate-950/40'
                  : 'border-slate-800/90 bg-slate-900/90'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-6 rounded-full bg-sky-500 px-4 py-1 text-xs font-semibold text-slate-950">
                  Most popular
                </div>
              )}
              <h3 className="text-xl font-semibold text-slate-100">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <div className="text-4xl font-semibold tracking-tight text-slate-100">{tier.price}</div>
                <div className="text-sm text-slate-400">{tier.price === '$0' ? 'forever' : '/ user / mo'}</div>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-400">{tier.description}</p>

              <ul className="mt-6 space-y-3 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-slate-300">
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-lg bg-slate-800">
                      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-sky-400" aria-hidden="true">
                        <path d="M16.5 5.5l-8 8-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`mt-7 w-full rounded-2xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  tier.highlight
                    ? 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                    : 'border border-slate-700 bg-transparent text-slate-100 hover:border-slate-500 hover:bg-slate-900/60'
                }`}
              >
                Choose {tier.name}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PricingPreview;

