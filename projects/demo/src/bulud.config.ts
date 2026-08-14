import { defineBuludTheme } from 'bulud-ng';

/**
 * Consumer-owned theme configuration.
 *
 * Editing these values updates both Bulud components and `bulud-*` Tailwind
 * utilities used throughout the demo.
 */
export const buludTheme = defineBuludTheme({
  colors: {
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryActive: '#5b21b6',
    onPrimary: '#ffffff',
    surface: '#ffffff',
    surfaceHover: '#f5f3ff',
    surfaceActive: '#ede9fe',
    onSurface: '#1e1b4b',
    border: '#ddd6fe',
    danger: '#e11d48',
    dangerHover: '#be123c',
    dangerActive: '#9f1239',
    onDanger: '#ffffff',
    focus: '#c4b5fd',
    dangerFocus: '#fda4af',
  },
  shape: {
    controlRadius: '0.1rem',
  },
  button: {
    fontWeight: '700',
    gap: '0.5rem',
    medium: {
      height: '2.75rem',
      paddingInline: '1.125rem',
    },
  },
});
