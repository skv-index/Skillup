import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface DropdownItem {
  key: string;
  label: string;
  onClick?: () => void;
}

export function Dropdown({ trigger, items }: { trigger: ReactNode; items: DropdownItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="dropdown" ref={ref}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div className="dropdown__menu">
          {items.map((i) => (
            <button
              key={i.key}
              className="dropdown__item"
              onClick={() => {
                i.onClick?.();
                setOpen(false);
              }}
            >
              {i.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
