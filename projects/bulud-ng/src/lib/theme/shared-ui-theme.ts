import { InjectionToken } from '@angular/core';
export interface BuludSharedUiTheme {
  readonly borderWidth?: string;
  readonly maxWidth?: string;
  readonly minHeight?: string;
  readonly cardGap?: string;
  readonly actionSize?: string;
  readonly balanceSize?: string;
  readonly disabledPadding?: string;
  readonly footerPadding?: string;
  readonly imageGap?: string;
  readonly labelSize?: string;
  readonly titleLineHeight?: string;
  readonly titleSize?: string;
  readonly titleWeight?: string;

  readonly arrowSize?: string;
  readonly duration?: string;
  readonly fontSize?: string;
  readonly headBackground?: string;
  readonly headerGap?: string;
  readonly headerPadding?: string;
  readonly iconSize?: string;
  readonly monthPadding?: string;
  readonly mqDemo?: string;
  readonly mqDemoForeground?: string;
  readonly mqReal?: string;
  readonly mqRealForeground?: string;
  readonly mtDemo?: string;
  readonly mtReal?: string;
  readonly popupPadding?: string;
  readonly progressGap?: string;
  readonly progressHeight?: string;
  readonly progressPadding?: string;
  readonly shadow?: string;
  readonly success?: string;
  readonly successGap?: string;
  readonly successHeight?: string;
  readonly tooltipWidth?: string;
  readonly walletBackground?: string;
  readonly width?: string;
  readonly zIndex?: string;

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
  | 'language-switch'
  | 'account-card'
  | 'tabs'
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
  /** Optional project icon font; layouts and visual styles are owned by this library. */
  readonly legacyIcons?: boolean;
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
