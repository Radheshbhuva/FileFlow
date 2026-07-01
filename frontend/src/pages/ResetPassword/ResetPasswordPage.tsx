import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import AuthLayout from '../../components/auth/AuthLayout';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm';
import { authService } from '../../services/authService';

type ResetPasswordRequestPayload = {
  token: string;
  newPassword: string;
};

function getTokenFromQuery(search: string): string | null {
  const params = new URLSearchParams(search);
  const token = params.get('token');
  if (!token) return null;
  const trimmed = token.trim();
  return trimmed ? trimmed : null;
}

export default function ResetPasswordPage() {
  const location = useLocation();

  const token = useMemo(() => getTokenFromQuery(location.search), [location.search]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setErrorMessage(null);
  }, [location.search]);

  return (
    <AuthLayout>
      {token ? (
        <ResetPasswordForm
          token={token}
          onInvalidToken={(message) => {
            setErrorMessage(message);
          }}
          onResetPassword={async (payload) => {
            await authService.resetPassword({
              token: payload.token,
              password: payload.newPassword,
              confirmPassword: payload.newPassword
            });
            localStorage.removeItem('fileflow_reset_token');
          }}
        />
      ) : (
        <section aria-label="Invalid password reset link">
          <div
            className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6"
            role="alert"
          >
            <p className="text-sm font-semibold text-rose-200">Invalid or expired password reset link.</p>
            <p className="mt-2 text-sm leading-6 text-rose-100">
              Please request a new password reset link.
            </p>
          </div>

          <div className="mt-5">
            <a
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-400"
            >
              Return to Login
            </a>
          </div>
        </section>
      )}

      {errorMessage ? (
        <div className="sr-only" role="status" aria-live="polite">
          {errorMessage}
        </div>
      ) : null}
    </AuthLayout>
  );
}

