import { Link } from 'react-router-dom';

import AuthLayout from '../../components/auth/AuthLayout';
import ErrorState from '../../components/common/ErrorState';

export default function UnauthorizedPage() {
  return (
    <AuthLayout>
      <ErrorState
        title="Access Restricted"
        description="You do not have permission to access this resource."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 sm:w-auto"
            >
              Go To Dashboard
            </Link>
            <Link
              to="/"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-800/90 bg-slate-900/30 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-900/50 sm:w-auto"
            >
              Return Home
            </Link>
          </div>
        }
      />
    </AuthLayout>
  );
}

