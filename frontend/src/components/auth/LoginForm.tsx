import { useId, useMemo, useState } from 'react';

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) return 'Enter a valid email address.';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  return null;
}

export default function LoginForm({
  onSubmit,
}: {
  onSubmit: (payload: { email: string; password: string; rememberMe: boolean }) => Promise<void>;
}) {
  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const emailError = useMemo(() => (submitted ? validateEmail(email) : validateEmail(email)), [email, submitted]);
  const passwordError = useMemo(() => (submitted ? validatePassword(password) : validatePassword(password)), [
    password,
    submitted
  ]);

  const isFormValid = !validateEmail(email) && !validatePassword(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);
    setFormSuccess(null);

    if (!isFormValid) return;

    try {
      setIsLoading(true);
      await onSubmit({ email: email.trim(), password, rememberMe });
      setFormSuccess('Signed in successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in. Please try again.';
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section aria-label="Sign in">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-100">Welcome Back</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Sign in to your FileFlow account.</p>
      </header>

      <form className="mt-6" onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
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

          <div>
            <label htmlFor={passwordId} className="block text-sm font-medium text-slate-200">
              Password
            </label>

            <div className="relative mt-2">
              <input
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-800/90 bg-slate-900/50 px-4 py-3 pr-14 text-slate-100 shadow-soft placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? `${passwordId}-error` : undefined}
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
                    <path
                      d="M3 3l18 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
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

            {passwordError ? (
              <p id={`${passwordId}-error`} className="mt-2 text-sm text-rose-400" role="alert">
                {passwordError}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
                disabled={isLoading}
              />
              Remember me
            </label>

            <a
              href="#"
              className="text-sm font-medium text-sky-300 hover:text-sky-200"
              onClick={(e) => e.preventDefault()}
            >
              Forgot Password?
            </a>
          </div>

          {formError ? (
            <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3">
              <p className="text-sm font-medium text-rose-200">{formError}</p>
            </div>
          ) : null}

          {formSuccess ? (
            <div role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
              <p className="text-sm font-medium text-emerald-200">{formSuccess}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </div>

        <footer className="mt-5">
          <p className="text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <a href="/register" className="font-semibold text-sky-300 hover:text-sky-200">
              Create Account
            </a>
          </p>
        </footer>
      </form>
    </section>
  );
}

