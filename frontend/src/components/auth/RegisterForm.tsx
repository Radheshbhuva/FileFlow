import { useId, useMemo, useState } from 'react';

type PasswordChecklist = {
  minLen: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
};

function validateFullName(name: string): string | null {
  if (!name.trim()) return 'Full name is required.';
  if (name.trim().length < 2) return 'Full name is too short.';
  return null;
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) return 'Enter a valid email address.';
  return null;
}

function buildPasswordChecklist(password: string): PasswordChecklist {
  return {
    minLen: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function passwordStrength(checklist: PasswordChecklist): { label: string; score: number } {
  const score = Object.values(checklist).filter(Boolean).length;
  if (score <= 2) return { label: 'Weak', score };
  if (score <= 3) return { label: 'Fair', score };
  if (score <= 4) return { label: 'Good', score };
  return { label: 'Strong', score };
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  // UI gives checklist; keep only generic error until checklist fails.
  if (password.length < 8) return 'Password must be at least 8 characters.';
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

export default function RegisterForm({
  onSubmit,
}: {
  onSubmit: (payload: { fullName: string; email: string; password: string }) => Promise<void>;
}) {
  const fullNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const checklist = useMemo(() => buildPasswordChecklist(password), [password]);
  const strength = useMemo(() => passwordStrength(checklist), [checklist]);

  const fullNameError = useMemo(
    () => (submitted ? validateFullName(fullName) : validateFullName(fullName)),
    [fullName, submitted]
  );
  const emailError = useMemo(() => (submitted ? validateEmail(email) : validateEmail(email)), [email, submitted]);
  const passwordError = useMemo(() => validatePassword(password), [password]);
  const confirmError = useMemo(() => validateConfirmPassword(password, confirm), [password, confirm]);

  const isFormValid =
    !validateFullName(fullName) && !validateEmail(email) && !validatePassword(password) && !validateConfirmPassword(password, confirm);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);
    setFormSuccess(null);

    if (!isFormValid) return;

    try {
      setIsLoading(true);
      await onSubmit({ fullName: fullName.trim(), email: email.trim(), password });
      setFormSuccess('Account created. Check your inbox for a verification email.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create account. Please try again.';
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section aria-label="Create account">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-100">Create Your Account</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Start securing and sharing files with FileFlow.</p>
      </header>

      <form className="mt-6" onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          <div>
            <label htmlFor={fullNameId} className="block text-sm font-medium text-slate-200">
              Full Name
            </label>
            <input
              id={fullNameId}
              name="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800/90 bg-slate-900/50 px-4 py-3 text-slate-100 shadow-soft placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
              aria-invalid={Boolean(fullNameError)}
              aria-describedby={fullNameError ? `${fullNameId}-error` : undefined}
              disabled={isLoading}
            />
            {fullNameError ? (
              <p id={`${fullNameId}-error`} className="mt-2 text-sm text-rose-400" role="alert">
                {fullNameError}
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

          <div>
            <label htmlFor={passwordId} className="block text-sm font-medium text-slate-200">
              Password
            </label>

            <div className="relative mt-2">
              <input
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-800/90 bg-slate-900/50 px-4 py-3 pr-14 text-slate-100 shadow-soft placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? `${passwordId}-error` : `${passwordId}-help`}
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
                  </svg>
                )}
              </button>
            </div>

            <div className="mt-3" aria-hidden="true">
              <div className="flex items-center justify-between gap-3">
                <p id={`${passwordId}-help`} className="text-sm text-slate-400">
                  Password strength: <span className="font-semibold text-slate-200">{strength.label}</span>
                </p>
                <p className="text-xs font-medium text-sky-300">{strength.score}/5</p>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-800/70">
                <div
                  className="h-2 rounded-full bg-sky-500 transition-[width]"
                  style={{ width: `${(strength.score / 5) * 100}%` }}
                />
              </div>

              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                <li className={`flex items-center gap-2 text-sm ${checklist.minLen ? 'text-emerald-300' : 'text-slate-400'}`}>
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-lg border ${checklist.minLen ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-slate-700 bg-slate-900/30'}`}>
                    {checklist.minLen ? (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                  Minimum 8 characters
                </li>
                <li className={`flex items-center gap-2 text-sm ${checklist.uppercase ? 'text-emerald-300' : 'text-slate-400'}`}>
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-lg border ${checklist.uppercase ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-slate-700 bg-slate-900/30'}`}>
                    {checklist.uppercase ? (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                  Uppercase letter
                </li>
                <li className={`flex items-center gap-2 text-sm ${checklist.lowercase ? 'text-emerald-300' : 'text-slate-400'}`}>
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-lg border ${checklist.lowercase ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-slate-700 bg-slate-900/30'}`}>
                    {checklist.lowercase ? (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                  Lowercase letter
                </li>
                <li className={`flex items-center gap-2 text-sm ${checklist.number ? 'text-emerald-300' : 'text-slate-400'}`}>
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-lg border ${checklist.number ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-slate-700 bg-slate-900/30'}`}>
                    {checklist.number ? (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                  Number
                </li>
                <li className={`flex items-center gap-2 text-sm sm:col-span-2 ${checklist.special ? 'text-emerald-300' : 'text-slate-400'}`}>
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-lg border ${checklist.special ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-slate-700 bg-slate-900/30'}`}>
                    {checklist.special ? (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                  Special character
                </li>
              </ul>
            </div>

            {passwordError ? (
              <p id={`${passwordId}-error`} className="mt-2 text-sm text-rose-400" role="alert">
                {passwordError}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={confirmId} className="block text-sm font-medium text-slate-200">
              Confirm Password
            </label>
            <input
              id={confirmId}
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800/90 bg-slate-900/50 px-4 py-3 text-slate-100 shadow-soft placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
              aria-invalid={Boolean(confirmError)}
              aria-describedby={confirmError ? `${confirmId}-error` : undefined}
              disabled={isLoading}
            />
            {confirmError ? (
              <p id={`${confirmId}-error`} className="mt-2 text-sm text-rose-400" role="alert">
                {confirmError}
              </p>
            ) : null}
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
            disabled={isLoading || !isFormValid}
            className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>

          <footer className="pt-1">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <a href="/login" className="font-semibold text-sky-300 hover:text-sky-200">
                Sign In
              </a>
            </p>
          </footer>
        </div>
      </form>
    </section>
  );
}

