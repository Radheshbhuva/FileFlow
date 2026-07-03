import { useState, useId } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string | null;
  label?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  name?: string;
}

export default function PasswordField({
  value,
  onChange,
  disabled = false,
  error = null,
  label = 'Password',
  autoComplete = 'current-password',
  required = true,
  placeholder = '••••••••',
  name = 'password'
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = useId();

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between items-center">
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-350">
          {label}
        </label>
      </div>

      <div className="relative">
        {/* Left side lock icon */}
        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />

        <input
          id={inputId}
          name={name}
          type={showPassword ? 'text' : 'password'}
          required={required}
          disabled={disabled}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`w-full rounded-xl border bg-slate-950/60 py-2.5 pl-10 pr-11 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition duration-150 ${
            error
              ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
              : 'border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20'
          }`}
        />

        {/* Right side visibility trigger */}
        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          className="absolute inset-y-0 right-1 inline-flex items-center justify-center rounded-lg px-2.5 text-slate-500 hover:text-slate-300 transition focus:outline-none focus:ring-1 focus:ring-sky-500/40"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {error && (
        <p id={`${inputId}-error`} className="text-[10px] text-rose-450 font-semibold" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
