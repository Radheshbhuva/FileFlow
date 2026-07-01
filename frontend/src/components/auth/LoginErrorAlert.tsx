import { AlertCircle, X, RefreshCw, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LoginErrorAlertProps {
  error: string | null;
  onClear: () => void;
}

export default function LoginErrorAlert({ error, onClear }: LoginErrorAlertProps) {
  if (!error) return null;

  const isLocked = error.toLowerCase().includes('locked');
  const isUnverified = error.toLowerCase().includes('verification');

  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-900/35 bg-rose-950/10 p-3.5 flex items-start justify-between gap-3 text-xs animate-shake"
    >
      <div className="flex gap-2.5 min-w-0">
        <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5 min-w-0 flex-1">
          <span className="font-bold text-slate-100 block">
            {isLocked ? 'Account Restricted' : isUnverified ? 'Email Verification Pending' : 'Sign In Issue'}
          </span>
          <p className="text-slate-400 leading-normal font-normal">
            {error}
          </p>

          {/* Quick resolution shortcuts based on error context */}
          {isLocked && (
            <div className="flex gap-3 pt-1">
              <Link
                to="/forgot-password"
                className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1 bg-sky-500/10 px-2 py-0.5 rounded transition"
              >
                <KeyRound className="h-3 w-3" /> Unlock Account
              </Link>
            </div>
          )}

          {isUnverified && (
            <div className="flex gap-3 pt-1">
              <Link
                to="/verify-email"
                className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1 bg-sky-500/10 px-2 py-0.5 rounded transition"
              >
                <RefreshCw className="h-3 w-3" /> Resend Verification Code
              </Link>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        className="rounded-lg p-1 text-slate-500 hover:bg-slate-900 hover:text-slate-350 transition shrink-0"
        aria-label="Dismiss alert"
      >
        <X className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}
