/**
 * Shared icon set — inline SVG, no dependency.
 * Parts must reuse these instead of bringing their own icon lib.
 */
import type { ReactNode, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...rest }: P, path: ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {path}
    </svg>
  );
}

export const Icons = {
  dashboard: (p: P) => base(p, <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" />),
  skills: (p: P) => base(p, <path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" />),
  learn: (p: P) => base(p, <path d="M2 4h6a4 4 0 014 4v12a3 3 0 00-3-3H2zM22 4h-6a4 4 0 00-4 4v12a3 3 0 013-3h7z" />),
  challenge: (p: P) => base(p, <path d="M13 2L3 14h7l-1 8 10-12h-7z" />),
  verified: (p: P) => base(p, <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />),
  career: (p: P) => base(p, <path d="M3 7h18v13H3zM8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />),
  jobs: (p: P) => base(p, <path d="M3 7h18v13H3zM8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18" />),
  profile: (p: P) => base(p, <path d="M20 21a8 8 0 00-16 0M12 11a4 4 0 100-8 4 4 0 000 8z" />),
  settings: (p: P) => base(p, <path d="M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 01-.1 1.2l2 1.6-2 3.4-2.4-1a7 7 0 01-2 1.2L14 20h-4l-.5-2.6a7 7 0 01-2-1.2l-2.4 1-2-3.4 2-1.6A7 7 0 015 12a7 7 0 01.1-1.2l-2-1.6 2-3.4 2.4 1a7 7 0 012-1.2L10 2h4l.5 2.6a7 7 0 012 1.2l2.4-1 2 3.4-2 1.6c.06.4.1.8.1 1.2z" />),
  admin: (p: P) => base(p, <path d="M3 3h18v18H3zM9 3v18M3 9h6M3 15h6" />),
  graph: (p: P) => base(p, <path d="M6 6a2 2 0 100-4 2 2 0 000 4zM18 20a2 2 0 100-4 2 2 0 000 4zM6 20a2 2 0 100-4 2 2 0 000 4zM6 4v12M6 16l9-5" />),
  gap: (p: P) => base(p, <path d="M3 12h4l3 8 4-16 3 8h4" />),
  bell: (p: P) => base(p, <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21a2 2 0 004 0" />),
  search: (p: P) => base(p, <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3" />),
  menu: (p: P) => base(p, <path d="M3 6h18M3 12h18M3 18h18" />),
};
