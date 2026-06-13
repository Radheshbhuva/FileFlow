function SecurityBenefits() {
  const benefits = [
    {
      title: 'Encrypted sharing',
      description: 'Files are protected end-to-end with encryption at rest and in transit, plus policy-based access.'
    },
    {
      title: 'Role-based access control',
      description: 'Use identity-aware permissions so users only see and share what they’re authorized to access.'
    },
    {
      title: 'Expiring links & revocation',
      description: 'Set expiration rules and revoke access instantly—no manual cleanup needed.'
    },
    {
      title: 'Audit logs for compliance',
      description: 'Track access events with searchable audit trails aligned to security reviews and governance.'
    },
    {
      title: 'Secure-by-default workflows',
      description: 'Templates enforce least-privilege sharing practices for teams at every stage.'
    },
    {
      title: 'Resilient serverless ops',
      description: 'Event-driven services reduce infrastructure overhead while maintaining reliable performance.'
    }
  ];

  return (
    <section id="security" aria-labelledby="security-heading" className="mt-16 sm:mt-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Security</p>
          <h2 id="security-heading" className="mt-4 text-3xl font-semibold text-slate-100 sm:text-4xl">
            Security teams get full control—without slowing users
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Built to support enterprise security expectations: encrypted storage, identity-based access control, and audit-ready logs.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-[2rem] border border-slate-800/90 bg-slate-900/90 p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-slate-100">{b.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SecurityBenefits;

