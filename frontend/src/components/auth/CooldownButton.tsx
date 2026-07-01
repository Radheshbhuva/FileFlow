import { useEffect, useState } from 'react';

export default function CooldownButton({
  cooldownSeconds,
  isBusy,
  onClick,
  className,
  children,
  type,
  disabled,
  'aria-label': ariaLabel,
}: {
  cooldownSeconds: number;
  isBusy: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  'aria-label'?: string;
}) {
  const [cooldownLeft, setCooldownLeft] = useState(0);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const t = window.setInterval(() => {
      setCooldownLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [cooldownLeft]);

  const isCooldownActive = cooldownLeft > 0;
  const isDisabled = Boolean(disabled || isBusy || isCooldownActive);

  return (
    <button
      type={type ?? 'button'}
      className={className}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
    >
      {isCooldownActive ? `Sending... (${cooldownLeft}s)` : children}
    </button>
  );
}

