import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PasswordStrengthMeter from './PasswordStrengthMeter';

type ResetPasswordRequestPayload = {
  token: string;
  newPassword: string;
};

type ResetPasswordErrorCode = 'InvalidToken' | 'ExpiredToken' | 'TooManyAttempts';

function validatePasswordRequirements(password: string): string | null {
  if (password.length < 12) return 'Password must be at least 12 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include a number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include a special character.';
  return null;
}

function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return 'Please confirm your password.';
  if (confirm !== password) return 'Passwords do not match.';
  return null;
}

function mapErrorToMessage(code: ResetPasswordErrorCode | null): string {
  switch (code) {
    case 'TooManyAttempts':
      return 'Too many attempts. Please wait a bit and try again.';
    case 'ExpiredToken':
      return 'Invalid or expired password reset link.';
    case 'InvalidToken':
      return 'Invalid or expired password reset link.';
    default:
      return 'Unable to reset password right now. Please try again.';
  }
}

export default function ResetPasswordForm({
  token,
  onResetPassword,
  onInvalidToken,
}: {
  token: string;
  onResetPassword: (payload: ResetPasswordRequestPayload) => Promise<void>;
  onInvalidToken: (message: string) => void;
}) {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const newPasswordError = useMemo(() => {
    if (!submitted && !newPassword) return null;
    return validatePasswordRequirements(newPassword);
  }, [newPassword, submitted]);

  const confirmError = useMemo(() => {
    if (!submitted && !confirmPassword) return null;
    return validateConfirmPassword(newPassword, confirmPassword);
  }, [confirmPassword, newPassword, submitted]);

  const isFormValid = useMemo(() => {
    return (
      !validatePasswordRequirements(newPassword) &&
      !validateConfirmPassword(newPassword, confirmPassword)
    );
  }, [confirmPassword, newPassword]);

  useEffect(() => {
    return () => {
      // Clear sensitive state on unmount.
      setNewPassword('');
      setConfirmPassword('');
    };
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);

    if (!isFormValid || isLoading) return;

    try {
      setIsLoading(true);
      await onResetPassword({ token, newPassword });

      // Clear sensitive form state immediately after success.
      setNewPassword('');
      setConfirmPassword('');

      setSuccessOpen(true);
    } catch (err) {
      // Avoid exposing backend details.
      const code = (err instanceof Error ? (err.message as ResetPasswordErrorCode) : null) ?? null;
      setFormError(mapErrorToMessage(code));
      onInvalidToken(mapErrorToMessage(code));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section aria-label="Reset password">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-100">Reset Your Password</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Choose a strong password. You&apos;ll be able to sign in with it immediately.
        </p>
      </header>

      <form className="mt-6" onSubmit={handleReset} noValidate>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200" htmlFor="newPassword">
              New Password
            </label>

            <div className="relative mt-2">
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-800/90 bg-slate-900/50 px-4 py-3 pr-14 text-slate-100 shadow-soft placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                aria-invalid={Boolean(newPasswordError)}
                aria-describedby={newPasswordError ? 'newPassword-error' : 'newPassword-help'}
                disabled={isLoading}
              />

              <button
                type="button"
                className="absolute inset-y-0 right-2 inline-flex items-center rounded-lg px-2 text-slate-400 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={isLoading}
              >
                <span className="sr-only">Toggle password visibility</span>
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                    <path
                      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path
                      d="M2 12s3.5-7 10-7c2 0 3.7.6 5.1 1.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M22 12s-3.5 7-10 7c-2 0-3.7-.6-5.1-1.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.9 9.9a3 3 0 0 0 4.2 4.2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>

            <PasswordStrengthMeter password={newPassword} />

            {newPasswordError ? (
              <p id="newPassword-error" className="mt-2 text-sm text-rose-400" role="alert">
                {newPasswordError}
              </p>
            ) : (
              <p id="newPassword-help" className="mt-2 text-sm text-slate-400">
                Minimum 12 characters and includes uppercase, lowercase, number, and special character.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800/90 bg-slate-900/50 px-4 py-3 text-slate-100 shadow-soft placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
              aria-invalid={Boolean(confirmError)}
              aria-describedby={confirmError ? 'confirmPassword-error' : undefined}
              disabled={isLoading}
            />
            {confirmError ? (
              <p id="confirmPassword-error" className="mt-2 text-sm text-rose-400" role="alert">
                {confirmError}
              </p>
            ) : null}
          </div>

          {formError ? (
            <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3">
              <p className="text-sm font-medium text-rose-200">{formError}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-slate-200 hover:text-white"
            >
              Return to Login
            </button>
          </div>
        </div>
      </form>

      {successOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Password reset successful"
        >
          <div
            className="absolute inset-0 bg-slate-950/70"
            onClick={() => {
              // Keep modal deterministic: user can close but we still auto-redirect.
              setSuccessOpen(false);
            }}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-emerald-400/30 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-emerald-200">Password Reset Successful</p>
                <p className="mt-1 text-sm leading-6 text-emerald-100">
                  Your password has been updated successfully. You can now sign in using your new password.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-400">Redirecting to login in 3 seconds...</p>
            </div>

            <div className="mt-5">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-400"
                onClick={() => {
                  setSuccessOpen(false);
                  navigate('/login');
                }}
              >
                Go to Login Now
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Auto redirect */}
      {successOpen ? (
        <AutoRedirect onDone={() => navigate('/login')} />
      ) : null}
    </section>
  );
}

function AutoRedirect({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(() => {
      onDone();
    }, 3000);
    return () => window.clearTimeout(t);
  }, [onDone]);
  return null;
}

