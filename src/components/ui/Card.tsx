import type { ReactNode } from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  hover?: boolean;
  children?: ReactNode;
  className?: string;
}

export function Card({ title, subtitle, actions, hover, children, className = '' }: CardProps) {
  return (
    <div className={`card ${hover ? 'card--hover' : ''} ${className}`}>
      {(title || subtitle) && (
        <div>
          {title && <div className="card__title">{title}</div>}
          {subtitle && <div className="card__subtitle">{subtitle}</div>}
        </div>
      )}
      <div className={title ? 'mt-4' : ''}>{children}</div>
      {actions && <div className="card__actions">{actions}</div>}
    </div>
  );
}
