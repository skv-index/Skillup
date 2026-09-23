import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

export interface FieldShellProps {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export function FieldShell({ label, hint, error, children }: FieldShellProps) {
  return (
    <div className="field">
      {label && <label className="field__label">{label}</label>}
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className = '', ...rest }: InputProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      <input className={`input ${error ? 'input--error' : ''} ${className}`} {...rest} />
    </FieldShell>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, className = '', ...rest }: TextareaProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      <textarea className={`textarea ${className}`} {...rest} />
    </FieldShell>
  );
}
