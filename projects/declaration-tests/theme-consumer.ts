import { inject } from '@angular/core';
import {
  BULUD_DEFAULT_THEME,
  BULUD_THEME,
  provideBuludTheme,
  resolveBuludTheme,
} from 'bulud-ng';

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
