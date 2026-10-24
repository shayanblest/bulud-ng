import { InjectionToken } from '@angular/core';
export interface BuludSharedUiTheme {
  readonly positive?: string;
  readonly negative?: string;
  readonly grid?: string;
  readonly background: string;
  readonly foreground: string;
  readonly border: string;
  readonly accent: string;
  readonly muted: string;
  readonly radius: string;
  readonly padding: string;
  readonly gap: string;
  readonly focus: string;
  readonly disabledOpacity: string;
}
export type BuludSharedUiFeature =
  | 'skeleton'
  | 'confirm'
  | 'chat'
  | 'field-label'
  | 'avatar'
  | 'empty-state'
  | 'period-picker'
  | 'donut'
  | 'progress'
  | 'charts'
  | 'loading-bar'
  | 'textarea'
  | 'table-filters'
  | 'table'
  | 'otp'
  | 'file-upload'
  | 'tooltip'
  | 'feedback'
  | 'rating'
  | 'stepper'
  | 'carousel'
  | 'countdown';
export interface BuludSharedUiConfig {
  readonly theme?: Partial<BuludSharedUiTheme>;
  readonly components?: Partial<
    Record<BuludSharedUiFeature, Partial<BuludSharedUiTheme>>
  >;
}
/** Theme configuration only; behavior belongs to explicit inputs and consumer state. */
export const BULUD_SHARED_UI_CONFIG = new InjectionToken<BuludSharedUiConfig>(
  'BULUD_SHARED_UI_CONFIG',
  { providedIn: 'root', factory: () => ({}) },
);
/** Undefined fields stay absent so scoped CSS and imported light/dark palettes keep working. */
export function buludSharedUiStyles(
  feature: BuludSharedUiFeature,
  config: BuludSharedUiConfig,
  instance: Partial<BuludSharedUiTheme> | undefined,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const layer of [config.theme, config.components?.[feature], instance]) {
    for (const [key, value] of Object.entries(layer ?? {})) {
      if (typeof value === 'string')
        result[
          `--bulud-${feature}-${key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`
        ] = value;
    }
  }
  return result;
}
