import {
  DOCUMENT,
  EnvironmentProviders,
  InjectionToken,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  RendererFactory2,
  RendererStyleFlags2,
} from '@angular/core';

/** Color tokens shared by Bulud components and Tailwind utilities. */
export interface BuludColorTheme {
  readonly primary: string;
  readonly primaryHover: string;
  readonly primaryActive: string;
  readonly onPrimary: string;
  readonly surface: string;
  readonly surfaceHover: string;
  readonly surfaceActive: string;
  readonly onSurface: string;
  readonly border: string;
  readonly danger: string;
  readonly dangerHover: string;
  readonly dangerActive: string;
  readonly onDanger: string;
  readonly focus: string;
  readonly dangerFocus: string;
}

/** Shape tokens shared by Bulud components and Tailwind utilities. */
export interface BuludShapeTheme {
  readonly controlRadius: string;
}

/** Size tokens for a button size. */
export interface BuludButtonSizeTheme {
  readonly height: string;
  readonly fontSize: string;
  readonly paddingInline: string;
}

/** Button-specific tokens that are not general color or shape decisions. */
export interface BuludButtonTheme {
  readonly disabledOpacity: string;
  readonly fontWeight: string;
  readonly gap: string;
  readonly small: BuludButtonSizeTheme;
  readonly medium: BuludButtonSizeTheme;
  readonly large: BuludButtonSizeTheme;
}

/** Fully resolved Bulud theme available through dependency injection. */
export interface BuludTheme {
  readonly colors: BuludColorTheme;
  readonly shape: BuludShapeTheme;
  readonly button: BuludButtonTheme;
}

/** Consumer overrides accepted by {@link provideBuludTheme}. */
export interface BuludThemeConfig {
  readonly colors?: Partial<BuludColorTheme>;
  readonly shape?: Partial<BuludShapeTheme>;
  readonly button?: Partial<Omit<BuludButtonTheme, 'small' | 'medium' | 'large'>> & {
    readonly small?: Partial<BuludButtonSizeTheme>;
    readonly medium?: Partial<BuludButtonSizeTheme>;
    readonly large?: Partial<BuludButtonSizeTheme>;
  };
}

/** CSS custom properties emitted by the Bulud theme provider. */
export type BuludThemeCssVariable = `--bulud-${string}`;

/** Default theme used for every token omitted by a consumer configuration. */
export const BULUD_DEFAULT_THEME: BuludTheme = {
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryActive: '#1e40af',
    onPrimary: '#ffffff',
    surface: '#ffffff',
    surfaceHover: '#f8fafc',
    surfaceActive: '#f1f5f9',
    onSurface: '#0f172a',
    border: '#cbd5e1',
    danger: '#dc2626',
    dangerHover: '#b91c1c',
    dangerActive: '#991b1b',
    onDanger: '#ffffff',
    focus: '#93c5fd',
    dangerFocus: '#fca5a5',
  },
  shape: {
    controlRadius: '0.5rem',
  },
  button: {
    disabledOpacity: '0.55',
    fontWeight: '600',
    gap: '0.5rem',
    small: {
      height: '2rem',
      fontSize: '0.8125rem',
      paddingInline: '0.75rem',
    },
    medium: {
      height: '2.5rem',
      fontSize: '0.875rem',
      paddingInline: '1rem',
    },
    large: {
      height: '3rem',
      fontSize: '1rem',
      paddingInline: '1.25rem',
    },
  },
};

/** Resolved theme injectable for advanced consumer integrations. */
export const BULUD_THEME = new InjectionToken<BuludTheme>('BULUD_THEME', {
  factory: () => BULUD_DEFAULT_THEME,
});

/**
 * Provides type inference for a consumer-owned `bulud.config.ts` without
 * changing the configuration object.
 */
export function defineBuludTheme<const Config extends BuludThemeConfig>(
  config: Config,
): Config {
  return config;
}

/**
 * Resolves partial consumer configuration against Bulud defaults.
 */
export function resolveBuludTheme(config: BuludThemeConfig = {}): BuludTheme {
  return {
    colors: {
      ...BULUD_DEFAULT_THEME.colors,
      ...config.colors,
    },
    shape: {
      ...BULUD_DEFAULT_THEME.shape,
      ...config.shape,
    },
    button: {
      ...BULUD_DEFAULT_THEME.button,
      ...config.button,
      small: {
        ...BULUD_DEFAULT_THEME.button.small,
        ...config.button?.small,
      },
      medium: {
        ...BULUD_DEFAULT_THEME.button.medium,
        ...config.button?.medium,
      },
      large: {
        ...BULUD_DEFAULT_THEME.button.large,
        ...config.button?.large,
      },
    },
  };
}

/**
 * Converts a consumer theme into the CSS variables consumed by Bulud
 * components and the optional Tailwind bridge.
 */
export function createBuludThemeVariables(
  config: BuludThemeConfig = {},
): Readonly<Record<BuludThemeCssVariable, string>> {
  const theme = resolveBuludTheme(config);

  return {
    '--bulud-color-primary': theme.colors.primary,
    '--bulud-color-primary-hover': theme.colors.primaryHover,
    '--bulud-color-primary-active': theme.colors.primaryActive,
    '--bulud-color-on-primary': theme.colors.onPrimary,
    '--bulud-color-surface': theme.colors.surface,
    '--bulud-color-surface-hover': theme.colors.surfaceHover,
    '--bulud-color-surface-active': theme.colors.surfaceActive,
    '--bulud-color-on-surface': theme.colors.onSurface,
    '--bulud-color-border': theme.colors.border,
    '--bulud-color-danger': theme.colors.danger,
    '--bulud-color-danger-hover': theme.colors.dangerHover,
    '--bulud-color-danger-active': theme.colors.dangerActive,
    '--bulud-color-on-danger': theme.colors.onDanger,
    '--bulud-color-focus': theme.colors.focus,
    '--bulud-color-danger-focus': theme.colors.dangerFocus,
    '--bulud-radius-control': theme.shape.controlRadius,
    '--bulud-button-disabled-opacity': theme.button.disabledOpacity,
    '--bulud-button-font-weight': theme.button.fontWeight,
    '--bulud-button-gap': theme.button.gap,
    '--bulud-button-height-small': theme.button.small.height,
    '--bulud-button-font-size-small': theme.button.small.fontSize,
    '--bulud-button-padding-inline-small': theme.button.small.paddingInline,
    '--bulud-button-height-medium': theme.button.medium.height,
    '--bulud-button-font-size-medium': theme.button.medium.fontSize,
    '--bulud-button-padding-inline-medium': theme.button.medium.paddingInline,
    '--bulud-button-height-large': theme.button.large.height,
    '--bulud-button-font-size-large': theme.button.large.fontSize,
    '--bulud-button-padding-inline-large': theme.button.large.paddingInline,
  };
}

/**
 * Registers a consumer theme and applies its CSS custom properties to the
 * document root during Angular environment initialization.
 *
 * The injected `DOCUMENT` and renderer abstractions keep this compatible with
 * browser rendering, server rendering, and zoneless applications.
 */
export function provideBuludTheme(
  config: BuludThemeConfig = {},
): EnvironmentProviders {
  const theme = resolveBuludTheme(config);

  return makeEnvironmentProviders([
    {
      provide: BULUD_THEME,
      useValue: theme,
    },
    provideEnvironmentInitializer(() => {
      const document = inject(DOCUMENT);
      const renderer = inject(RendererFactory2).createRenderer(null, null);
      const variables = createBuludThemeVariables(theme);

      for (const [property, value] of Object.entries(variables)) {
        renderer.setStyle(
          document.documentElement,
          property,
          value,
          RendererStyleFlags2.DashCase,
        );
      }
    }),
  ]);
}
