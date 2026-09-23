import { tokens } from './tokens';

export const theme = {
  colors: {
    primary: tokens.colors.primary,
    accent: tokens.colors.accent,
    bg: 'var(--color-bg)',
    surface: 'var(--color-surface)',
    border: 'var(--color-border)',
    text: 'var(--color-text)',
    muted: 'var(--color-text-muted)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    info: 'var(--color-info)',
  },
  fonts: tokens.fonts,
  fontSizes: tokens.fontSizes,
  spacing: tokens.spacing,
  radius: tokens.radius,
  shadows: tokens.shadows,
  layout: tokens.layout,
} as const;

export type Theme = typeof theme;
