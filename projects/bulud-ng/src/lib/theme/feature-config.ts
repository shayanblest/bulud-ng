import { InjectionToken, type Type } from '@angular/core';
import type { AbstractControl } from '@angular/forms';

/** Configuration tokens live in the configuration-only root entry so global providers do not eagerly load component renderers. Feature entries re-export the same token instances. */
export interface BuludAccountCardConfig {
  readonly navigate?: (cardType: string, id: string | undefined) => void;
}
export const BULUD_ACCOUNT_CARD_CONFIG =
  new InjectionToken<BuludAccountCardConfig>('BULUD_ACCOUNT_CARD_CONFIG', {
    providedIn: 'root',
    factory: () => ({}),
  });

export interface BuludUploadIssue {
  readonly kind: 'csv' | 'clipboard' | 'image';
  readonly message: string;
  readonly cause?: unknown;
}
export interface BuludFileUploadConfig {
  readonly onIssue?: (issue: BuludUploadIssue) => void;
  readonly maxWidth?: number;
  readonly maxHeight?: number;
  readonly quality?: number;
}
export const BULUD_FILE_UPLOAD_CONFIG =
  new InjectionToken<BuludFileUploadConfig>('BULUD_FILE_UPLOAD_CONFIG', {
    providedIn: 'root',
    factory: () => ({}),
  });

export interface BuludDropdownDataConfig {
  readonly childControl?: (
    control: AbstractControl,
    item: unknown,
  ) => AbstractControl | null;
}
export const BULUD_DROPDOWN_DATA_CONFIG =
  new InjectionToken<BuludDropdownDataConfig>('BULUD_DROPDOWN_DATA_CONFIG', {
    providedIn: 'root',
    factory: () => ({}),
  });

export interface BuludChartEngineConfig {
  readonly load: () => Promise<Type<unknown>>;
}
export const BULUD_CHART_ENGINE_CONFIG =
  new InjectionToken<BuludChartEngineConfig>('BULUD_CHART_ENGINE_CONFIG');
