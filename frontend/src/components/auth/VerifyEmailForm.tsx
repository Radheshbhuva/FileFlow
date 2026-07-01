import { useId, useState } from 'react';

function sanitizeCode(value: string): string {
  return value.replace(/\s/g, '').toUpperCase();
}

export default function VerifyEmailForm({
  onVerify,
  onResend,
  onBackToLogin,
  initialCode = '',
}: {
  onVerify: (payload: { code: string }) => Promise<void>;
  onResend: () => Promise<void>;
  onBackToLogin: () => void;
  initialCode?: string;
}) {
  const codeId = useId();

  const [code, setCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successState, setSuccessState] = useState(false);

  const codeValue = sanitizeCode(code);
  const codeError = submitted && !codeValue ? 'Verification code is required.' : null;

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);

    if (!codeValue) return;

    try {
      setIsLoading(true);
      await onVerify({ code: codeValue });
      setSuccessState(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to verify code. Please try again.';
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setFormError(null);
    try {
      setIsResending(true);
      await onResend();
    } catch {
      // Keep message generic.
      setFormError('Unable to resend code. Please try again in a moment.');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <section aria-label="Verify email">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-100">Verify Your Email</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          We&apos;ve sent a verification code to your email address.
        </p>
      </header>

      {successState ? (
        <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4" role="status">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-200">Email Verified Successfully</p>
              <p className="mt-1 text-sm leading-6 text-emerald-100">
                Redirect instructions placeholder.
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-400"
              onClick={onBackToLogin}
            >
              Back to Login
            </button>
          </div>
        </div>
      ) : (
        <form className="mt-6" onSubmit={handleVerify} noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor={codeId} className="block text-sm font-medium text-slate-200">
                Verification Code
              </label>
              <input
                id={codeId}
                name="code"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-800/90 bg-slate-900/50 px-4 py-3 text-slate-100 shadow-soft placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                aria-invalid={Boolean(codeError)}
                aria-describedby={codeError ? `${codeId}-error` : undefined}
                disabled={isLoading}
              />
              {codeError ? (
                <p id={`${codeId}-error`} className="mt-2 text-sm text-rose-400" role="alert">
                  {codeError}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-400">Enter the code exactly as shown in your email.</p>
              )}
            </div>

            {formError ? (
              <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3">
                <p className="text-sm font-medium text-rose-200">{formError}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                disabled={isLoading || isResending}
                onClick={handleResend}
                className="text-sm font-medium text-sky-300 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResending ? 'Resending...' : 'Resend Code'}
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={onBackToLogin}
                className="text-sm font-medium text-slate-200 hover:text-white"
              >
                Back to Login
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}

