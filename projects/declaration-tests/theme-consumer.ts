import { inject } from '@angular/core';
import {
  BULUD_DEFAULT_THEME,
  BULUD_THEME,
  type BuludBadgeTheme,
  provideBuludTheme,
  resolveBuludTheme,
} from 'bulud-ng';
import { provideBuludLocale } from 'bulud-ng';

// Keep these inferred: downstream declaration emit must be able to name the
// resolved type without consumers adding explicit return/value annotations.
export const resolvedTheme = resolveBuludTheme();

export function injectTheme() {
  return inject(BULUD_THEME);
}

// Public defaults retain their legacy type while spread configurations remain
// accepted by the packaged provider and downstream declaration emitter.
export const legacyDefaults: typeof BULUD_DEFAULT_THEME = {
  ...BULUD_DEFAULT_THEME,
  button: {
    disabledOpacity: '0.55',
    fontWeight: '600',
    gap: '0.5rem',
    small: BULUD_DEFAULT_THEME.button.small,
    medium: BULUD_DEFAULT_THEME.button.medium,
    large: BULUD_DEFAULT_THEME.button.large,
  },
};
export const defaultThemeProvider = provideBuludTheme({
  ...legacyDefaults,
  colors: { ...legacyDefaults.colors, primary: '#7c3aed' },
});

export const partialPaginationLocaleProvider = provideBuludLocale({
  pagination: { previousPageLabel: 'Previous' },
});

// Existing complete Badge objects need no geometry/focus additions.
export const legacyBadge: BuludBadgeTheme = {
  neutral: BULUD_DEFAULT_THEME.badge.neutral,
  primary: BULUD_DEFAULT_THEME.badge.primary,
  success: BULUD_DEFAULT_THEME.badge.success,
  warning: BULUD_DEFAULT_THEME.badge.warning,
  danger: BULUD_DEFAULT_THEME.badge.danger,
  radius: '999px',
  fontWeight: '500',
  dismissHoverBackground: 'transparent',
  focus: 'currentColor',
};
export const legacyBadgeProvider = provideBuludTheme({ badge: legacyBadge });
export const resolvedBadgeFocus: string = resolveBuludTheme({
  badge: legacyBadge,
}).badge.focusWidth;
