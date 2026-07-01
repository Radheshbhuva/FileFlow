import { useMemo } from 'react';

type StrengthLabel = 'Weak' | 'Fair' | 'Good' | 'Strong';

type PasswordChecklist = {
  minLen: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
};

function buildPasswordChecklist(password: string): PasswordChecklist {
  return {
    minLen: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function passwordStrength(checklist: PasswordChecklist): { label: StrengthLabel; score: number } {
  const score = Object.values(checklist).filter(Boolean).length;
  if (score <= 2) return { label: 'Weak', score };
  if (score <= 3) return { label: 'Fair', score };
  if (score <= 4) return { label: 'Good', score };
  return { label: 'Strong', score };
}

export default function PasswordStrengthMeter({ password }: { password: string }) {
  const checklist = useMemo(() => buildPasswordChecklist(password), [password]);
  const strength = useMemo(() => passwordStrength(checklist), [checklist]);

  const progressPercent = (strength.score / 5) * 100;

  return (
    <div className="mt-3" aria-label="Password strength">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Password strength: <span className="font-semibold text-slate-200">{strength.label}</span>
        </p>
        <p className="text-xs font-medium text-sky-300">{strength.score}/5</p>
      </div>

      <div className="mt-2 h-2 w-full rounded-full bg-slate-800/70" aria-hidden="true">
        <div
          className="h-2 rounded-full bg-sky-500 transition-[width]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        <li
          className={`flex items-center gap-2 text-sm ${checklist.minLen ? 'text-emerald-300' : 'text-slate-400'}`}
        >
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-lg border ${
              checklist.minLen
                ? 'border-emerald-400/60 bg-emerald-400/10'
                : 'border-slate-700 bg-slate-900/30'
            }`}
            aria-hidden="true"
          >
            {checklist.minLen ? (
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
          Minimum 12 characters
        </li>

        <li
          className={`flex items-center gap-2 text-sm ${checklist.uppercase ? 'text-emerald-300' : 'text-slate-400'}`}
        >
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-lg border ${
              checklist.uppercase
                ? 'border-emerald-400/60 bg-emerald-400/10'
                : 'border-slate-700 bg-slate-900/30'
            }`}
            aria-hidden="true"
          >
            {checklist.uppercase ? (
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
          Uppercase letter
        </li>

        <li
          className={`flex items-center gap-2 text-sm ${checklist.lowercase ? 'text-emerald-300' : 'text-slate-400'}`}
        >
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-lg border ${
              checklist.lowercase
                ? 'border-emerald-400/60 bg-emerald-400/10'
                : 'border-slate-700 bg-slate-900/30'
            }`}
            aria-hidden="true"
          >
            {checklist.lowercase ? (
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
          Lowercase letter
        </li>

        <li
          className={`flex items-center gap-2 text-sm ${checklist.number ? 'text-emerald-300' : 'text-slate-400'}`}
        >
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-lg border ${
              checklist.number
                ? 'border-emerald-400/60 bg-emerald-400/10'
                : 'border-slate-700 bg-slate-900/30'
            }`}
            aria-hidden="true"
          >
            {checklist.number ? (
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
          Number
        </li>

        <li
          className={`flex items-center gap-2 text-sm sm:col-span-2 ${checklist.special ? 'text-emerald-300' : 'text-slate-400'}`}
        >
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-lg border ${
              checklist.special
                ? 'border-emerald-400/60 bg-emerald-400/10'
                : 'border-slate-700 bg-slate-900/30'
            }`}
            aria-hidden="true"
          >
            {checklist.special ? (
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
          Special character
        </li>
      </ul>
    </div>
  );
}

