import { useState } from 'react';
import type { FileSecurity } from '../../types/files';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface SecurityScoreBadgeProps {
  security: FileSecurity;
  showTooltip?: boolean;
}

export default function SecurityScoreBadge({ security, showTooltip = true }: SecurityScoreBadgeProps) {
  const { score, label, factors } = security;
  const [show, setShow] = useState(false);

  let colorClasses = '';
  let icon = null;

  if (score >= 90) {
    colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    icon = <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />;
  } else if (score >= 75) {
    colorClasses = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    icon = <Shield className="h-3.5 w-3.5 text-sky-400" />;
  } else if (score >= 50) {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    icon = <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />;
  } else {
    colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    icon = <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />;
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${colorClasses} focus:outline-none focus:ring-1 focus:ring-sky-500/50`}
        aria-haspopup="true"
        aria-expanded={show}
      >
        {icon}
        <span>{score}</span>
        <span className="opacity-85" aria-hidden="true">•</span>
        <span>{label}</span>
      </button>

      {show && showTooltip && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl text-xs text-slate-300 animate-in fade-in slide-in-from-bottom-1 duration-150"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-100">Security Details</span>
            <span className="font-mono font-bold text-slate-200">{score}/100</span>
          </div>

          <div
            className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-3"
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="File security score"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                score >= 90
                  ? 'bg-emerald-500'
                  : score >= 75
                  ? 'bg-sky-500'
                  : score >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>

          <p className="text-slate-400 mb-2 font-medium">Risk Factors & Controls:</p>
          <ul className="space-y-1 text-[11px] text-slate-400 list-none pl-0">
            {factors.map((factor, index) => (
              <li key={index} className="flex items-start gap-1.5">
                <span className="text-sky-400 shrink-0 select-none">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
