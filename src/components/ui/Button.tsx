import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  leftIcon,
  children,
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  const cls = [
    'btn',
    `btn--${variant}`,
    size !== 'md' ? `btn--${size}` : '',
    block ? 'btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading ? <span className="spinner" aria-label="loading" /> : leftIcon}
      {children}
    </button>
  );
}
