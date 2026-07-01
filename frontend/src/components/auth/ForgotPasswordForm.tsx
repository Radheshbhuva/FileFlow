import { useId, useMemo, useState } from 'react';

import CooldownButton from './CooldownButton';

type ForgotPasswordRequestPayload = {
  username: string;
  email: string;
};

export default function ForgotPasswordForm({
  onSendResetLink,
}: {
  onSendResetLink: (payload: ForgotPasswordRequestPayload) => Promise<void>;
}) {
  const usernameId = useId();
  const emailId = useId();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [successState, setSuccessState] = useState(false);

  const normalizedUsername = username.trim();

  const usernameError = useMemo(() => {
    if (!submitted) return null;
    if (!normalizedUsername) return 'Username is required.';
    return null;
  }, [normalizedUsername, submitted]);

  const emailError = useMemo(() => {
    const emailValue = email.trim();
    if (!submitted) {
      if (!emailValue) return null;
      // Keep UI quiet until submit, but still allow browser to show required? We'll handle ourselves.
    }

    if (!emailValue) return submitted ? 'Email address is required.' : null;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailValue)) return 'Enter a valid email address.';
    return null;
  }, [email, submitted]);

  const isFormValid = !normalizedUsername ? false : (() => {
    const emailValue = email.trim();
    if (!emailValue) return false;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(emailValue);
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);

    if (!isFormValid || isLoading) return;

    const payload: ForgotPasswordRequestPayload = {
      username: normalizedUsername,
      email: email.trim(),
    };

    try {
      setIsLoading(true);
      // Frontend-only cooldown + disable while loading prevents double-submits.
      await onSendResetLink(payload);
      setSuccessState(true);
    } catch {
      // Avoid enumeration: never indicate whether username/email exists.
      setFormError('Unable to send reset link right now. Please try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section aria-label="Request password reset">
      {successState ? (
        <div
          className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6"
          role="status"
        >
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
              <p className="text-sm font-semibold text-emerald-200">Check Your Email</p>
              <p className="mt-1 text-sm leading-6 text-emerald-100">
                If the provided information matches an account, a password reset link has been sent to the
                registered email address.
              </p>
              {(() => {
                const resetToken = localStorage.getItem('fileflow_reset_token');
                if (!resetToken) return null;
                return (
                  <div className="mt-4 rounded-xl border border-sky-500/25 bg-slate-950/80 p-3 text-xs text-sky-450 font-normal">
                    <p className="font-bold text-sky-300">Development Helper (Reset Token):</p>
                    <code className="select-all block mt-1.5 break-all bg-slate-900/60 p-2 rounded border border-slate-850 text-[10.5px] font-mono">{resetToken}</code>
                    <a
                      href={`/reset-password?token=${resetToken}`}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-2.5 py-1 font-semibold text-sky-400 hover:bg-sky-500/20 transition decoration-none"
                    >
                      Go to Reset Password
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ) : (
        <>
          <header>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-100">Forgot Password</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Enter your details and we&apos;ll send you a reset link.
            </p>
          </header>

          <form className="mt-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor={usernameId} className="block text-sm font-medium text-slate-200">
                  Username
                </label>
                <input
                  id={usernameId}
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-800/90 bg-slate-900/50 px-4 py-3 text-slate-100 shadow-soft placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  aria-invalid={Boolean(usernameError)}
                  aria-describedby={usernameError ? `${usernameId}-error` : undefined}
                  disabled={isLoading}
                />
                {usernameError ? (
                  <p id={`${usernameId}-error`} className="mt-2 text-sm text-rose-400" role="alert">
                    {usernameError}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor={emailId} className="block text-sm font-medium text-slate-200">
                  Email Address
                </label>
                <input
                  id={emailId}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-800/90 bg-slate-900/50 px-4 py-3 text-slate-100 shadow-soft placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? `${emailId}-error` : undefined}
                  disabled={isLoading}
                />
                {emailError ? (
                  <p id={`${emailId}-error`} className="mt-2 text-sm text-rose-400" role="alert">
                    {emailError}
                  </p>
                ) : null}
              </div>

              {formError ? (
                <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3">
                  <p className="text-sm font-medium text-rose-200">{formError}</p>
                </div>
              ) : null}

              <CooldownButton
                cooldownSeconds={15}
                isBusy={isLoading}
                onClick={() => {
                  // Cooldown prevents repeated clicks; actual submit is handled by the form.
                }}

                type="submit"
                disabled={!isFormValid}
                className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send Reset Link
              </CooldownButton>





              <p className="text-xs text-slate-400">

                For your security, we don&apos;t reveal whether the username or email exists.
              </p>
            </div>
          </form>

          <footer className="mt-5">
            <p className="text-sm text-slate-400">
              <a href="/login" className="font-semibold text-sky-300 hover:text-sky-200">
                Back to Login
              </a>
            </p>
          </footer>
        </>
      )}
    </section>
  );
}

