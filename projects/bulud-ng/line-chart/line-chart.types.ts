export type BuludLineValue =
  | number
  | null
  | { readonly x: string | number | Date; readonly y: number | null };
export interface BuludLineSeries {
  readonly name?: string;
  readonly data: readonly BuludLineValue[];
  readonly color?: string;
}
export interface BuludLineAxisLabelStyle {
  readonly colors?: string | readonly string[];
  readonly fontSize?: string;
  readonly fontFamily?: string;
  readonly fontWeight?: string | number;
}
export interface BuludLineXAxis {
  readonly categories?: readonly unknown[];
  readonly labels?: {
    readonly show?: boolean;
    readonly offsetX?: number;
    readonly offsetY?: number;
    readonly style?: BuludLineAxisLabelStyle;
    readonly formatter?: (
      value: string,
      timestamp?: number,
      context?: { readonly i: number },
    ) => string | string[];
  };
  readonly axisBorder?: { readonly show?: boolean; readonly color?: string };
  readonly axisTicks?: { readonly show?: boolean; readonly color?: string };
}
export interface BuludLineYAxis {
  readonly show?: boolean;
  readonly min?: number | ((minimum: number) => number);
  readonly max?: number | ((maximum: number) => number);
  readonly tickAmount?: number;
  readonly labels?: {
    readonly show?: boolean;
    readonly offsetX?: number;
    readonly offsetY?: number;
    readonly style?: BuludLineAxisLabelStyle;
    readonly formatter?: (
      value: number,
      context?: { readonly index: number },
    ) => string | string[];
  };
}
export interface BuludLineChartTheme {
  readonly accent?: string;
  readonly grid?: string;
  readonly axis?: string;
  readonly fontFamily?: string;
  readonly tooltipBackground?: string;
  readonly tooltipForeground?: string;
  readonly tooltipBorder?: string;
  readonly tooltipTitleBackground?: string;
  readonly focus?: string;
}
export interface BuludLineChartConfig {
  /** Any BCP 47 locale. Labels remain supplied by the consuming application. */
  readonly locale?: string;
  readonly theme?: BuludLineChartTheme;
  readonly defaults?: {
    readonly locale?: string;
    readonly height?: number;
    readonly strokeWidth?: number;
    readonly dashArray?: number | readonly number[];
    readonly digits?: number;
    readonly theme?: BuludLineChartTheme;
  };
}
export interface BuludLineSelection {
  readonly seriesIndex: number;
  readonly pointIndex: number;
  readonly name: string;
  readonly label: string;
  readonly value: number;
}
