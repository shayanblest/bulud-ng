import { InjectionToken } from '@angular/core';
export interface BuludTourStep {
  readonly id: string;
  readonly targetId: string;
  readonly descriptionKey?: string;
  readonly description?: string;
  readonly titleKey?: string;
  readonly title?: string;
  readonly previousLabelKey?: string;
  readonly previousLabel?: string;
  readonly nextLabelKey?: string;
  readonly nextLabel?: string;
  readonly closeLabelKey?: string;
  readonly closeLabel?: string;
  readonly position?: 'top' | 'bottom' | 'left' | 'right';
  readonly showBackdrop?: boolean;
}
export interface BuludTourTheme {
  readonly background?: string;
  readonly foreground?: string;
  readonly border?: string;
  readonly borderWidth?: string;
  readonly radius?: string;
  readonly padding?: string;
  readonly shadow?: string;
  readonly backdrop?: string;
  readonly accent?: string;
  readonly onAccent?: string;
  readonly muted?: string;
  readonly focus?: string;
  readonly width?: string;
  readonly zIndex?: string;
  readonly gap?: string;
  readonly duration?: string;
}
export interface BuludTourConfig {
  readonly startDelay?: number;
  readonly targetTimeout?: number;
  readonly theme?: BuludTourTheme;
  readonly defaults?: { readonly theme?: BuludTourTheme };
  /** Project-owned navigation/menu preparation. No application DOM assumptions are built in. */
  readonly prepareTarget?: (
    element: HTMLElement,
    step: BuludTourStep,
  ) => void | Promise<void>;
}
export const BULUD_TOUR_CONFIG = new InjectionToken<BuludTourConfig>(
  'BULUD_TOUR_CONFIG',
  { providedIn: 'root', factory: () => ({}) },
);
export function buludTourStyles(
  config: BuludTourConfig,
  instance?: BuludTourTheme,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const layer of [config.theme, config.defaults?.theme, instance])
    for (const [key, value] of Object.entries(layer ?? {}))
      if (typeof value === 'string')
        result[
          '--bulud-tour-' + key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
        ] = value;
  return result;
}
