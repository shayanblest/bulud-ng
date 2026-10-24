import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders,
} from '@angular/core';

/** Global defaults for the native textarea autosize directive. */
export interface BuludTextareaAutosizeConfig {
  readonly minRows?: number | null;
  readonly maxRows?: number | null;
}

/** Global textarea autosize configuration. Omitted values use directive defaults. */
export const BULUD_TEXTAREA_AUTOSIZE_CONFIG =
  new InjectionToken<BuludTextareaAutosizeConfig>(
    'BULUD_TEXTAREA_AUTOSIZE_CONFIG',
    { factory: () => ({}) },
  );

/** Provides global textarea autosize defaults. */
export function provideBuludTextareaAutosize(
  config: BuludTextareaAutosizeConfig = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: BULUD_TEXTAREA_AUTOSIZE_CONFIG, useValue: config },
  ]);
}
