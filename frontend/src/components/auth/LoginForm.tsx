import { useId, useMemo, useState } from 'react';
import { parseApiError } from '../../services/api/errorParser';
import { Mail, Loader2, ArrowRight } from 'lucide-react';
import PasswordField from './PasswordField';
import LoginErrorAlert from './LoginErrorAlert';

// Feature flags configuration for SSO / Social Providers
const FEATURE_FLAGS = {
  socialAuthEnabled: true, // Master switch
  google: true,
  github: true,
  microsoft: true,
  enterpriseSso: true
};

interface LoginFormProps {
  onSubmit: (payload: { email: string; password: string; rememberMe: boolean }) => Promise<void>;
  onSuccess?: () => void;
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email address is required.';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) return 'Enter a valid email address (e.g. name@domain.com).';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

export default function LoginForm({ onSubmit, onSuccess }: LoginFormProps) {
  const emailId = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Validation checks computed dynamically
  const emailError = useMemo(() => (submitted ? validateEmail(email) : null), [email, submitted]);
  const passwordError = useMemo(() => (submitted ? validatePassword(password) : null), [password, submitted]);

  const isFormValid = !validateEmail(email) && !validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);
    setFormSuccess(null);

    if (!isFormValid) return;

    try {
      setIsLoading(true);
      await onSubmit({ email: email.trim(), password, rememberMe });
      setFormSuccess('Session authenticated successfully.');
      setTimeout(() => {
        onSuccess?.();
      }, 300);
    } catch (err) {
      const message = parseApiError(err);
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section aria-label="Sign in form wrapper" className="space-y-6">
      {/* Title Header */}
      <header className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
          Sign in to your vault
        </h2>
        <p className="text-xs text-slate-400 leading-normal">
          Enter credentials below to access your FileFlow workspace.
        </p>
      </header>

      {/* Form Error alert messages */}
      <LoginErrorAlert error={formError} onClear={() => setFormError(null)} />

      {/* Success Banner */}
      {formSuccess && (
        <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 text-xs text-emerald-450 font-semibold">
          {formSuccess}
        </div>
      )}

      {/* Form Inputs */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-4">
          {/* Email input field */}
          <div className="space-y-1.5">
            <label htmlFor={emailId} className="text-xs font-semibold text-slate-350">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                id={emailId}
                name="email"
                type="email"
                required
                disabled={isLoading}
                autoFocus
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? `${emailId}-error` : undefined}
                placeholder="you@domain.com"
                className={`w-full rounded-xl border bg-slate-950/60 py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder:text-slate-650 focus:outline-none transition duration-150 ${
                  emailError
                    ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                    : 'border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20'
                }`}
              />
            </div>
            {emailError && (
              <p id={`${emailId}-error`} className="text-[10px] text-rose-450 font-semibold" role="alert">
                {emailError}
              </p>
            )}
          </div>

          {/* Password field */}
          <PasswordField
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            error={passwordError}
            autoComplete="current-password"
          />
        </div>

        {/* Checkbox remember me and forgot link */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <label className="flex items-center gap-2.5 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-sky-500 focus:outline-none cursor-pointer"
            />
            <span>Remember me</span>
          </label>

          <a
            href="/forgot-password"
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
          >
            Forgot Password?
          </a>
        </div>

        {/* Primary submit action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-soft transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Secondary sign up toggle link */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-400">
          Don&apos;t have an account?{' '}
          <a href="/register" className="font-bold text-sky-400 hover:text-sky-300 transition ml-0.5">
            Create Account
          </a>
        </p>
      </div>

      {/* Cognito SSO Placeholder list */}
      {FEATURE_FLAGS.socialAuthEnabled && (
        <div className="space-y-4 pt-4 border-t border-slate-850/80">
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-900/40 px-2.5 text-[10px] font-semibold text-slate-550 uppercase tracking-widest relative z-10">
              Or connect via SSO
            </span>
            <div className="absolute top-1/2 left-0 w-full border-t border-slate-850/60" aria-hidden="true" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {FEATURE_FLAGS.google && (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center rounded-xl border border-slate-850 bg-slate-950/20 px-3 py-2 text-[10.5px] font-semibold text-slate-400 hover:text-slate-300 transition cursor-not-allowed opacity-60"
                title="Google authentication (future Cognito integration)"
              >
                Google
              </button>
            )}
            {FEATURE_FLAGS.github && (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center rounded-xl border border-slate-850 bg-slate-950/20 px-3 py-2 text-[10.5px] font-semibold text-slate-400 hover:text-slate-300 transition cursor-not-allowed opacity-60"
                title="GitHub authentication (future Cognito integration)"
              >
                GitHub
              </button>
            )}
            {FEATURE_FLAGS.microsoft && (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center rounded-xl border border-slate-850 bg-slate-950/20 px-3 py-2 text-[10.5px] font-semibold text-slate-400 hover:text-slate-300 transition cursor-not-allowed opacity-60"
                title="Microsoft authentication (future Cognito integration)"
              >
                Microsoft
              </button>
            )}
          </div>

          {FEATURE_FLAGS.enterpriseSso && (
            <button
              type="button"
              disabled
              className="w-full inline-flex items-center justify-center rounded-xl border border-slate-850 bg-slate-950/20 py-2 text-[10.5px] font-semibold text-slate-450 cursor-not-allowed opacity-60"
            >
              Single Sign-On (SAML/OIDC)
            </button>
          )}
        </div>
      )}
    </section>
  );
}
