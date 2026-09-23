import type { SelectHTMLAttributes } from 'react';
import { FieldShell } from './Input';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  hint,
  error,
  options,
  placeholder = 'Select…',
  className = '',
  ...rest
}: SelectProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      <select className={`select ${error ? 'select--error' : ''} ${className}`} {...rest}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
