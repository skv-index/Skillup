/**
 * JS mirror of CSS tokens — use when you need values in TS
 * (charts, canvas, inline styles). For CSS, prefer var(--...).
 */
export const tokens = {
  colors: {
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    accent: { 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' },
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#0284c7',
  },
  fonts: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  spacing: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 },
  radius: { sm: 6, md: 10, lg: 16, xl: 24, full: 9999 },
  shadows: {
    sm: '0 1px 2px rgba(15,23,42,.06)',
    md: '0 4px 12px rgba(15,23,42,.08)',
    lg: '0 12px 32px rgba(15,23,42,.12)',
  },
  layout: { sidebarWidth: 264, headerHeight: 64, contentMax: 1200 },
} as const;

export type Tokens = typeof tokens;
