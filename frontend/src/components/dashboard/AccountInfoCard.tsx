import type { DashboardUser } from '../../types/dashboard';

interface AccountInfoCardProps {
  user: DashboardUser;
  onManageAccount: () => void;
}

export default function AccountInfoCard({ user, onManageAccount }: AccountInfoCardProps) {
  return (
    <section aria-labelledby="account-info-heading" className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-6 shadow-soft">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 id="account-info-heading" className="text-base font-semibold text-slate-100">
            Account Information
          </h2>
          <p className="mt-1 text-sm text-slate-400">Your profile and plan details</p>
        </div>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sm font-semibold text-sky-300">
          {user.avatarInitials}
        </span>
      </header>

      <dl className="mt-6 space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-sm text-slate-500">Full Name</dt>
          <dd className="text-sm font-medium text-slate-100">{user.fullName}</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-sm text-slate-500">Email</dt>
          <dd className="text-sm font-medium text-slate-100">{user.email}</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-sm text-slate-500">Plan</dt>
          <dd className="text-sm font-medium text-slate-100">{user.plan}</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-sm text-slate-500">Account Created</dt>
          <dd className="text-sm font-medium text-slate-100">{user.accountCreated}</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-sm text-slate-500">Last Login</dt>
          <dd className="text-sm font-medium text-slate-100">{user.lastLogin}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onManageAccount}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 sm:w-auto"
      >
        Manage Account
      </button>
    </section>
  );
}
