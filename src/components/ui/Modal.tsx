import type { ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}

export function Modal({ open, title, onClose, children, footer, size = 'md' }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal ${size === 'lg' ? 'modal--lg' : ''}`}>
        <div className="row row--between">
          <div className="modal__title">{title}</div>
          <button className="btn btn--ghost btn--sm" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
