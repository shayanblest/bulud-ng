export interface BuludRadialChartTheme {
  readonly accent?: string;
  readonly focus?: string;
  readonly track?: string;
  readonly foreground?: string;
  readonly fontFamily?: string;
  readonly labelSize?: string;
  readonly valueSize?: string;
  readonly fontWeight?: string;
}
export interface BuludRadialChartConfig {
  readonly theme?: BuludRadialChartTheme;
  readonly locale?: string;
  readonly defaults?: {
    readonly theme?: BuludRadialChartTheme;
    readonly locale?: string;
  };
}
