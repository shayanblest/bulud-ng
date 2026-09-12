import {
  DOCUMENT,
  EnvironmentProviders,
  InjectionToken,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  RendererFactory2,
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

/** Theme tokens for dropdown controls. */
export interface BuludDropdownTheme {
  readonly background: string;
  readonly border: string;
  readonly borderHover: string;
  readonly foreground: string;
  readonly focus: string;
  readonly placeholder: string;
  readonly clearForeground: string;
  readonly clearHoverBackground: string;
  readonly clearHoverForeground: string;
  readonly panelBackground: string;
  readonly searchBorder: string;
  readonly searchIcon: string;
  readonly optionForeground: string;
  readonly optionHoverBackground: string;
  readonly optionSelectedForeground: string;
  readonly optionBorder: string;
  readonly optionSelectedBackground: string;
  readonly messageForeground: string;
  readonly disabledOpacity: string;
  readonly radius: string;
  readonly shadow: string;
}

/** Theme tokens for badges and their dismiss action. */
export interface BuludBadgeVariantTheme {
  readonly background: string;
  readonly border: string;
  readonly foreground: string;
}

export interface BuludBadgeTheme {
  readonly neutral: BuludBadgeVariantTheme;
  readonly primary: BuludBadgeVariantTheme;
  readonly success: BuludBadgeVariantTheme;
  readonly warning: BuludBadgeVariantTheme;
  readonly danger: BuludBadgeVariantTheme;
  readonly radius: string;
  readonly fontWeight: string;
  readonly dismissHoverBackground: string;
  readonly focus: string;
}

/** Theme tokens for the tabs component and its projected tab controls. */
export interface BuludTabsTheme {
  readonly background: string;
  readonly border: string;
  readonly foreground: string;
  readonly activeForeground: string;
  readonly hoverBackground: string;
  readonly activeBorder: string;
  readonly panelBackground: string;
  readonly disabledOpacity: string;
  readonly radius: string;
  readonly gap: string;
  readonly focus: string;
}

/** Fully resolved Bulud theme available through dependency injection. */
export interface BuludTheme {
  readonly colors: BuludColorTheme;
  readonly shape: BuludShapeTheme;
  readonly button: BuludButtonTheme;
  readonly dropdown: BuludDropdownTheme;
  readonly badge: BuludBadgeTheme;
  readonly tabs: BuludTabsTheme;
}

/** Consumer overrides accepted by {@link provideBuludTheme}. */
export interface BuludThemeConfig {
  readonly colors?: Partial<BuludColorTheme>;
  readonly shape?: Partial<BuludShapeTheme>;
  readonly button?: Partial<
    Omit<BuludButtonTheme, 'small' | 'medium' | 'large'>
  > & {
    readonly small?: Partial<BuludButtonSizeTheme>;
    readonly medium?: Partial<BuludButtonSizeTheme>;
    readonly large?: Partial<BuludButtonSizeTheme>;
  };
  readonly dropdown?: Partial<BuludDropdownTheme>;
  readonly badge?: Partial<
    Omit<
      BuludBadgeTheme,
      'neutral' | 'primary' | 'success' | 'warning' | 'danger'
    >
  > & {
    readonly neutral?: Partial<BuludBadgeVariantTheme>;
    readonly primary?: Partial<BuludBadgeVariantTheme>;
    readonly success?: Partial<BuludBadgeVariantTheme>;
    readonly warning?: Partial<BuludBadgeVariantTheme>;
    readonly danger?: Partial<BuludBadgeVariantTheme>;
  };
  readonly tabs?: Partial<BuludTabsTheme>;
}

/** CSS custom properties emitted by the Bulud theme provider. */
export type BuludThemeCssVariable = `--bulud-${string}`;

const BULUD_THEME_STYLE_ATTRIBUTE = 'data-bulud-theme';
const BULUD_THEME_SCOPE = ":root:not(.dark):not([data-theme='dark'])";

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
  dropdown: {
    background: '#ffffff',
    border: '#cbd5e1',
    borderHover: '#2563eb',
    foreground: '#0f172a',
    focus: '#93c5fd',
    placeholder: '#64748b',
    clearForeground: '#94a3b8',
    clearHoverBackground: '#f1f5f9',
    clearHoverForeground: '#334155',
    panelBackground: '#ffffff',
    searchBorder: '#e2e8f0',
    searchIcon: '#64748b',
    optionForeground: '#0f172a',
    optionHoverBackground: '#eff6ff',
    optionSelectedForeground: '#1d4ed8',
    optionBorder: '#cbd5e1',
    optionSelectedBackground: '#2563eb',
    messageForeground: '#64748b',
    disabledOpacity: '0.55',
    radius: '0.5rem',
    shadow: '0 1rem 2.5rem rgb(15 23 42 / 0.16)',
  },
  badge: {
    neutral: {
      background: '#f8fafc',
      border: '#cbd5e1',
      foreground: '#1e293b',
    },
    primary: {
      background: '#eff6ff',
      border: '#bfdbfe',
      foreground: '#1d4ed8',
    },
    success: {
      background: '#dcfce7',
      border: '#bbf7d0',
      foreground: '#15803d',
    },
    warning: {
      background: '#fef3c7',
      border: '#fde68a',
      foreground: '#a16207',
    },
    danger: { background: '#ffe4e6', border: '#fecdd3', foreground: '#be123c' },
    radius: '999px',
    fontWeight: '500',
    dismissHoverBackground: 'rgb(15 23 42 / 0.1)',
    focus: 'currentColor',
  },
  tabs: {
    background: '#ffffff',
    border: '#cbd5e1',
    foreground: '#475569',
    activeForeground: '#1d4ed8',
    hoverBackground: '#eff6ff',
    activeBorder: '#2563eb',
    panelBackground: '#ffffff',
    disabledOpacity: '0.55',
    radius: '0.5rem',
    gap: '0.25rem',
    focus: '#93c5fd',
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
    dropdown: {
      ...BULUD_DEFAULT_THEME.dropdown,
      ...config.dropdown,
    },
    badge: {
      ...BULUD_DEFAULT_THEME.badge,
      ...config.badge,
      neutral: {
        ...BULUD_DEFAULT_THEME.badge.neutral,
        ...config.badge?.neutral,
      },
      primary: {
        ...BULUD_DEFAULT_THEME.badge.primary,
        ...config.badge?.primary,
      },
      success: {
        ...BULUD_DEFAULT_THEME.badge.success,
        ...config.badge?.success,
      },
      warning: {
        ...BULUD_DEFAULT_THEME.badge.warning,
        ...config.badge?.warning,
      },
      danger: { ...BULUD_DEFAULT_THEME.badge.danger, ...config.badge?.danger },
    },
    tabs: {
      ...BULUD_DEFAULT_THEME.tabs,
      ...config.tabs,
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
    '--bulud-dropdown-background': theme.dropdown.background,
    '--bulud-dropdown-border': theme.dropdown.border,
    '--bulud-dropdown-border-hover': theme.dropdown.borderHover,
    '--bulud-dropdown-foreground': theme.dropdown.foreground,
    '--bulud-dropdown-focus': theme.dropdown.focus,
    '--bulud-dropdown-placeholder': theme.dropdown.placeholder,
    '--bulud-dropdown-clear-foreground': theme.dropdown.clearForeground,
    '--bulud-dropdown-clear-hover-background':
      theme.dropdown.clearHoverBackground,
    '--bulud-dropdown-clear-hover-foreground':
      theme.dropdown.clearHoverForeground,
    '--bulud-dropdown-panel-background': theme.dropdown.panelBackground,
    '--bulud-dropdown-search-border': theme.dropdown.searchBorder,
    '--bulud-dropdown-search-icon': theme.dropdown.searchIcon,
    '--bulud-dropdown-option-foreground': theme.dropdown.optionForeground,
    '--bulud-dropdown-option-hover-background':
      theme.dropdown.optionHoverBackground,
    '--bulud-dropdown-option-selected-foreground':
      theme.dropdown.optionSelectedForeground,
    '--bulud-dropdown-option-border': theme.dropdown.optionBorder,
    '--bulud-dropdown-option-selected-background':
      theme.dropdown.optionSelectedBackground,
    '--bulud-dropdown-message-foreground': theme.dropdown.messageForeground,
    '--bulud-dropdown-disabled-opacity': theme.dropdown.disabledOpacity,
    '--bulud-dropdown-radius': theme.dropdown.radius,
    '--bulud-dropdown-shadow': theme.dropdown.shadow,
    '--bulud-badge-neutral-background': theme.badge.neutral.background,
    '--bulud-badge-neutral-border': theme.badge.neutral.border,
    '--bulud-badge-neutral-foreground': theme.badge.neutral.foreground,
    '--bulud-badge-primary-background': theme.badge.primary.background,
    '--bulud-badge-primary-border': theme.badge.primary.border,
    '--bulud-badge-primary-foreground': theme.badge.primary.foreground,
    '--bulud-badge-success-background': theme.badge.success.background,
    '--bulud-badge-success-border': theme.badge.success.border,
    '--bulud-badge-success-foreground': theme.badge.success.foreground,
    '--bulud-badge-warning-background': theme.badge.warning.background,
    '--bulud-badge-warning-border': theme.badge.warning.border,
    '--bulud-badge-warning-foreground': theme.badge.warning.foreground,
    '--bulud-badge-danger-background': theme.badge.danger.background,
    '--bulud-badge-danger-border': theme.badge.danger.border,
    '--bulud-badge-danger-foreground': theme.badge.danger.foreground,
    '--bulud-badge-radius': theme.badge.radius,
    '--bulud-badge-font-weight': theme.badge.fontWeight,
    '--bulud-badge-dismiss-hover-background':
      theme.badge.dismissHoverBackground,
    '--bulud-badge-focus': theme.badge.focus,
    '--bulud-tabs-background': theme.tabs.background,
    '--bulud-tabs-border': theme.tabs.border,
    '--bulud-tabs-foreground': theme.tabs.foreground,
    '--bulud-tabs-active-foreground': theme.tabs.activeForeground,
    '--bulud-tabs-hover-background': theme.tabs.hoverBackground,
    '--bulud-tabs-active-border': theme.tabs.activeBorder,
    '--bulud-tabs-panel-background': theme.tabs.panelBackground,
    '--bulud-tabs-disabled-opacity': theme.tabs.disabledOpacity,
    '--bulud-tabs-radius': theme.tabs.radius,
    '--bulud-tabs-gap': theme.tabs.gap,
    '--bulud-tabs-focus': theme.tabs.focus,
  };
}

function createBuludThemeCss(
  variables: Readonly<Record<BuludThemeCssVariable, string>>,
): string {
  const declarations = Object.entries(variables)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n');

  return `${BULUD_THEME_SCOPE} {\n${declarations}\n}`;
}

/**
 * Registers a consumer theme and applies its CSS custom properties to the
 * document root during Angular environment initialization. The generated
 * stylesheet is scoped out while the root is in dark mode so the explicitly
 * imported dark theme can take precedence over global light-mode overrides.
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

      let styleElement = document.head.querySelector<HTMLStyleElement>(
        `style[${BULUD_THEME_STYLE_ATTRIBUTE}]`,
      );

      if (!styleElement) {
        styleElement = renderer.createElement('style') as HTMLStyleElement;
        renderer.setAttribute(styleElement, BULUD_THEME_STYLE_ATTRIBUTE, '');
        renderer.appendChild(document.head, styleElement);
      }

      renderer.setProperty(
        styleElement,
        'textContent',
        createBuludThemeCss(variables),
      );
    }),
  ]);
}
