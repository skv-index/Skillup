import type { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export function Badge({
  variant = 'default',
  children,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
}) {
  return <span className={`badge ${variant !== 'default' ? `badge--${variant}` : ''}`}>{children}</span>;
}
