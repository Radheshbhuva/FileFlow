import type { BenefitItem } from '../../types/landing';

const benefits: BenefitItem[] = [
  {
    title: 'Secure by Design',
    description: 'Built with encrypted storage, identity-based access controls, and AWS-managed security best practices.'
  },
  {
    title: 'Global Scalability',
    description: 'Scale seamlessly with AWS serverless services without infrastructure bottlenecks.'
  },
  {
    title: 'Low Operational Cost',
    description: 'Reduce infrastructure overhead with event-driven compute and managed storage services.'
  },
  {
    title: 'Infrastructure as Code',
    description: 'Support repeatable deployment with templated AWS resources and CloudFormation best practices.'
  },
  {
    title: 'Serverless Deployment',
    description: 'Avoid server maintenance and keep the architecture lean with Lambda and managed APIs.'
  },
  {
    title: 'High Availability',
    description: 'Leverage AWS durability and edge delivery to deliver resilient file sharing worldwide.'
  }
];

function BenefitsSection() {
  return (
    <section aria-labelledby="benefits-heading" className="mt-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Benefits</p>
        <h2 id="benefits-heading" className="mt-4 text-3xl font-semibold text-slate-100 sm:text-4xl">
          Business and technical outcomes for cloud-native file sharing
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-400">
          Demonstrate a production-ready architecture that balances security, scalability, and operational efficiency for enterprise-grade workloads.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {benefits.map((benefit) => (
          <div key={benefit.title} className="rounded-[2rem] border border-slate-800/90 bg-slate-900/90 p-6 shadow-soft">
            <h3 className="text-xl font-semibold text-slate-100">{benefit.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">{benefit.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default BenefitsSection;
