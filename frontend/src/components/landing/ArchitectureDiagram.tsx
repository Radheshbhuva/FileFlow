type ArchitectureNodeProps = {
  title: string;
  subtitle: string;
};

function ArchitectureNode({ title, subtitle }: ArchitectureNodeProps) {
  return (
    <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 px-6 py-5 text-center shadow-soft">
      <p className="text-sm uppercase tracking-[0.2em] text-sky-300">{title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{subtitle}</p>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex h-10 items-center justify-center" aria-hidden="true">
      <span className="h-px w-14 bg-slate-600"></span>
      <span className="ml-2 inline-block h-3 w-3 rotate-45 border-r border-b border-slate-600" />
    </div>
  );
}

function ArchitectureDiagram() {
  return (
    <section id="architecture" aria-labelledby="architecture-heading" className="mt-16 rounded-[2rem] border border-slate-800/90 bg-slate-950/90 p-6 shadow-soft sm:p-8">
      <div className="mb-8 max-w-3xl">
        <h2 id="architecture-heading" className="text-3xl font-semibold text-slate-100 sm:text-4xl">
          Cloud architecture flow
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
          Visualize how requests move through the AWS file sharing system, from secure edge routing to serverless compute, storage, and identity management.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <ArchitectureNode title="User" subtitle="Secure browser access" />
        <Arrow />
        <ArchitectureNode title="CloudFront" subtitle="Global content delivery" />
        <Arrow />
        <ArchitectureNode title="React Frontend" subtitle="Serverless site hosted at the edge" />
        <Arrow />
        <ArchitectureNode title="API Gateway" subtitle="Managed HTTP API layer" />
        <Arrow />
        <ArchitectureNode title="Lambda" subtitle="Serverless business logic" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <ArchitectureNode title="S3" subtitle="Encrypted object storage" />
        <ArchitectureNode title="DynamoDB" subtitle="Fast metadata persistence" />
        <ArchitectureNode title="Cognito" subtitle="Secure user authentication" />
      </div>
    </section>
  );
}

export default ArchitectureDiagram;
