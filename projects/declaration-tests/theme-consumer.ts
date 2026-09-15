import { inject } from '@angular/core';
import { BULUD_THEME, resolveBuludTheme } from 'bulud-ng';

// Keep these inferred: downstream declaration emit must be able to name the
// resolved type without consumers adding explicit return/value annotations.
export const resolvedTheme = resolveBuludTheme();

export function injectTheme() {
  return inject(BULUD_THEME);
}
