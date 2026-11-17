// projects/bulud-ng/src/lib/theme/angour-theme.ts
var BULUD_ANGOUR_TOKENS = {
  spacing: {
    0: "0px",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "24px",
    6: "32px",
    7: "40px",
    8: "48px"
  },
  radius: {
    control: "8px",
    small: "6px",
    medium: "8px",
    large: "10px",
    extraLarge: "12px",
    pill: "50px"
  },
  font: {
    sans: "'Montserrat', system-ui, sans-serif",
    persian: "'Peyda', Tahoma, sans-serif",
    arabic: "'Ravi', Tahoma, sans-serif",
    size: {
      1: "24px",
      2: "22px",
      3: "20px",
      4: "18px",
      5: "16px",
      6: "14px",
      7: "12px",
      8: "10px"
    }
  },
  shadow: {
    small: "0 2px 4px rgb(0 0 0 / 0.075)",
    medium: "0 8px 16px rgb(0 0 0 / 0.15)",
    large: "0 16px 48px rgb(0 0 0 / 0.175)"
  },
  light: {
    primary: "#0C2340",
    primaryHover: "#0b203a",
    primaryActive: "#0a1c33",
    onPrimary: "#FFFFFF",
    secondary: "#FDB515",
    success: "#2E7D32",
    info: "#541ADB",
    warning: "#FFCC19",
    danger: "#A11729",
    dangerText: "#A11729",
    body: "#F3F6F9",
    foreground: "#000000",
    surface: "#FFFFFF",
    surfaceHover: "#f3f6f9",
    surfaceActive: "#e5e9ed",
    border: "rgba(30, 30, 38, 0.3)",
    muted: "rgba(30, 30, 38, 0.7)",
    subtle: "rgba(30, 30, 38, 0.15)",
    focus: "#0C2340",
    dangerHover: "#911525",
    dangerActive: "#811221"
  },
  dark: {
    primary: "#FDB515",
    primaryHover: "#fdbc2c",
    primaryActive: "#fdc444",
    onPrimary: "#000000",
    secondary: "#0C2340",
    success: "#26D07C",
    info: "#7D4CF1",
    warning: "#FFCC19",
    danger: "#D33030",
    dangerText: "#FF8080",
    body: "#000000",
    foreground: "#FFFFFF",
    surface: "#1E1E26",
    surfaceHover: "#34343c",
    surfaceActive: "#4b4b51",
    border: "rgba(213, 213, 213, 0.3)",
    muted: "rgba(213, 213, 213, 0.7)",
    subtle: "rgba(213, 213, 213, 0.15)",
    focus: "#FDB515",
    dangerHover: "#d74545",
    dangerActive: "#dc5959"
  }
};
function angourTheme(mode) {
  const palette = BULUD_ANGOUR_TOKENS[mode];
  const {
    primary,
    primaryHover,
    primaryActive,
    onPrimary,
    surface,
    surfaceHover,
    surfaceActive,
    foreground,
    border,
    focus,
    muted
  } = palette;
  const badge = (background, color = "#FFFFFF") => ({
    background,
    border: "transparent",
    foreground: color
  });
  return {
    colors: {
      primary,
      primaryHover,
      primaryActive,
      onPrimary,
      surface,
      surfaceHover,
      surfaceActive,
      onSurface: foreground,
      border,
      danger: palette.danger,
      dangerHover: palette.dangerHover,
      dangerActive: palette.dangerActive,
      onDanger: "#FFFFFF",
      focus,
      dangerFocus: palette.danger
    },
    shape: { controlRadius: BULUD_ANGOUR_TOKENS.radius.control },
    button: {
      fontWeight: "400",
      gap: "8px",
      secondaryBackground: palette.secondary,
      secondaryBackgroundHover: mode === "light" ? "#e4a313" : "#243952",
      secondaryBackgroundActive: mode === "light" ? "#ca9111" : "#3d4f66",
      secondaryBorder: "transparent",
      secondaryForeground: mode === "light" ? "#000000" : "#FFFFFF",
      ghostForeground: primary,
      disabledOpacity: "1",
      disabledBackground: palette.subtle,
      disabledForeground: mode === "light" ? "rgba(30, 30, 38, 0.5)" : "rgba(213, 213, 213, 0.5)",
      activeShadow: mode === "light" ? "0 0 0 0.4rem rgba(12, 35, 64, 0.2)" : "0 0 0 0.4rem rgba(253, 181, 21, 0.25)",
      dangerActiveShadow: mode === "light" ? "0 0 0 0.4rem rgba(161, 23, 41, 0.1)" : "0 0 0 0.4rem rgba(211, 48, 48, 0.1)",
      small: { height: "32px", fontSize: "12px", paddingInline: "8px" },
      medium: { height: "40px", fontSize: "14px", paddingInline: "12px" },
      large: { height: "48px", fontSize: "16px", paddingInline: "16px" }
    },
    dropdown: {
      background: palette.body,
      border,
      invalidBorder: palette.danger,
      borderHover: primary,
      foreground,
      focus,
      placeholder: muted,
      clearForeground: muted,
      clearHoverBackground: surfaceHover,
      clearHoverForeground: foreground,
      panelBackground: palette.body,
      searchBorder: border,
      searchIcon: muted,
      optionForeground: foreground,
      optionHoverBackground: surfaceHover,
      optionSelectedForeground: primary,
      optionBorder: border,
      optionSelectedBackground: primary,
      messageForeground: muted,
      radius: "8px",
      shadow: BULUD_ANGOUR_TOKENS.shadow.medium
    },
    badge: {
      neutral: badge(surfaceHover, foreground),
      primary: badge(primary, onPrimary),
      success: badge(palette.success, mode === "light" ? "#FFFFFF" : "#000000"),
      warning: badge(palette.warning, "#000000"),
      danger: badge(
        palette.dangerText,
        mode === "light" ? "#FFFFFF" : "#000000"
      ),
      radius: "6px",
      fontWeight: "600",
      heightSmall: "20px",
      fontSizeSmall: "10px",
      paddingInlineSmall: "6px",
      heightMedium: "24px",
      fontSizeMedium: "12px",
      paddingInlineMedium: "8px",
      heightLarge: "28px",
      fontSizeLarge: "14px",
      paddingInlineLarge: "10px",
      dotSize: "4px",
      dotGap: "6px",
      dismissHoverBackground: palette.subtle
    },
    tabs: {
      background: surface,
      border,
      foreground: muted,
      activeForeground: primary,
      hoverBackground: surfaceHover,
      activeBorder: primary,
      panelBackground: surface,
      focus,
      radius: "8px"
    },
    accordion: {
      background: surface,
      border,
      foreground,
      hoverBackground: surfaceHover,
      panelBackground: surface,
      icon: primary,
      focus,
      radius: "8px"
    },
    radio: {
      background: "transparent",
      border: mode === "light" ? "rgba(30, 30, 38, 0.5)" : "rgba(213, 213, 213, 0.5)",
      checked: primary,
      foreground,
      focus,
      size: "16px",
      dotSize: "8px",
      gap: "8px"
    },
    datepicker: {
      background: palette.body,
      foreground,
      border,
      muted,
      hoverBackground: surfaceHover,
      selectedBackground: palette.subtle,
      selectedForeground: foreground,
      yearBackground: surface,
      yearSelectedBackground: palette.subtle,
      rangeEndpointBackground: primary,
      rangeEndpointForeground: onPrimary,
      rangeBackground: mode === "light" ? "rgba(12, 35, 64, 0.2)" : "rgba(253, 181, 21, 0.25)",
      focus,
      radius: "8px",
      padding: "12px",
      daySize: "28px",
      gap: "4px",
      width: "23.375rem"
    },
    checkbox: {
      background: "transparent",
      backgroundHover: surfaceHover,
      border: foreground,
      checkedBackground: primary,
      checkedForeground: onPrimary,
      foreground,
      focus,
      radius: "4px",
      size: "16px",
      gap: "8px"
    },
    switch: {
      background: surface,
      backgroundHover: surfaceHover,
      border,
      checkedBackground: primary,
      checkedThumb: onPrimary,
      foreground,
      focus,
      thumb: muted
    },
    dialog: {
      background: surface,
      foreground,
      border,
      focus,
      radius: "12px",
      padding: "24px",
      shadow: BULUD_ANGOUR_TOKENS.shadow.large,
      backdrop: "rgb(0 0 0 / 0.6)"
    },
    pagination: {
      background: surface,
      backgroundHover: surfaceHover,
      activeBackground: primary,
      border,
      foreground,
      activeForeground: onPrimary,
      mutedForeground: muted,
      focus,
      radius: "8px"
    }
  };
}
var BULUD_ANGOUR_LIGHT_THEME = /* @__PURE__ */ angourTheme("light");
var BULUD_ANGOUR_DARK_THEME = /* @__PURE__ */ angourTheme("dark");

// projects/bulud-ng/src/lib/theme/form-control-themes.ts
var FORM_CONTROL_THEME_DEFAULTS = {
  radio: {
    background: "transparent",
    border: "#cbd5e1",
    checked: "#2563eb",
    foreground: "#0f172a",
    focus: "#93c5fd",
    size: "16px",
    dotSize: "8px",
    gap: "8px",
    borderWidth: "1px",
    focusWidth: "3px",
    focusOffset: "2px",
    disabledOpacity: "0.55"
  },
  datepicker: {
    background: "#ffffff",
    foreground: "#0f172a",
    border: "#cbd5e1",
    muted: "#64748b",
    hoverBackground: "#f1f5f9",
    selectedBackground: "#2563eb",
    selectedForeground: "#ffffff",
    rangeBackground: "#eff6ff",
    rangeEndpointBackground: "#2563eb",
    rangeEndpointForeground: "#ffffff",
    yearBackground: "#ffffff",
    yearSelectedBackground: "#e2e8f0",
    focus: "#93c5fd",
    radius: "8px",
    fontSize: "12px",
    daySize: "28px",
    gap: "4px",
    padding: "12px",
    width: "23.375rem",
    borderWidth: "1px",
    focusWidth: "3px",
    focusOffset: "2px",
    disabledOpacity: "0.55"
  }
};
function formThemeVariables(prefix, theme) {
  return Object.fromEntries(
    Object.entries(theme).map(([field, value]) => [
      `--bulud-${prefix}-${field.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase())}`,
      value
    ])
  );
}
var FORM_CONTROL_GEOMETRY = new Set(
  [
    "size",
    "dotSize",
    "gap",
    "borderWidth",
    "focusWidth",
    "focusOffset",
    "disabledOpacity",
    "radius",
    "daySize",
    "fontSize",
    "padding",
    "width"
  ].map(
    (field) => field.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase())
  )
);

// projects/bulud-ng/src/lib/theme/bulud-theme.ts
import {
  DOCUMENT,
  InjectionToken,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  RendererFactory2
} from "@angular/core";
var BASE_DEFAULT_THEME = {
  ...FORM_CONTROL_THEME_DEFAULTS,
  colors: {
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    primaryActive: "#1e40af",
    onPrimary: "#ffffff",
    surface: "#ffffff",
    surfaceHover: "#f8fafc",
    surfaceActive: "#f1f5f9",
    onSurface: "#0f172a",
    border: "#cbd5e1",
    danger: "#dc2626",
    dangerHover: "#b91c1c",
    dangerActive: "#991b1b",
    onDanger: "#ffffff",
    focus: "#93c5fd",
    dangerFocus: "#fca5a5"
  },
  shape: {
    controlRadius: "0.5rem"
  },
  button: {
    secondaryBackground: "var(--bulud-color-surface, #ffffff)",
    secondaryBackgroundHover: "var(--bulud-color-surface-hover, #f8fafc)",
    secondaryBackgroundActive: "var(--bulud-color-surface-active, #f1f5f9)",
    secondaryBorder: "var(--bulud-color-border, #cbd5e1)",
    secondaryForeground: "var(--bulud-color-on-surface, #0f172a)",
    ghostForeground: "var(--bulud-color-on-surface, #0f172a)",
    disabledBackground: "var(--_background)",
    disabledForeground: "var(--_foreground)",
    activeShadow: "none",
    dangerActiveShadow: "var(--bulud-button-active-shadow, none)",
    borderWidth: "1px",
    focusWidth: "3px",
    focusOffset: "2px",
    ghostBackground: "transparent",
    disabledOpacity: "0.55",
    fontWeight: "600",
    gap: "0.5rem",
    small: {
      height: "2rem",
      fontSize: "0.8125rem",
      paddingInline: "0.75rem"
    },
    medium: {
      height: "2.5rem",
      fontSize: "0.875rem",
      paddingInline: "1rem"
    },
    large: {
      height: "3rem",
      fontSize: "1rem",
      paddingInline: "1.25rem"
    }
  },
  dropdown: {
    fontSize: "var(--bulud-font-size-control,12px)",
    lineHeight: "1.5",
    fontWeight: "400",
    minHeight: "0px",
    paddingBlock: "12px",
    paddingInline: "12px",
    gap: "8px",
    optionMinHeight: "0px",
    optionPadding: "12px",
    optionGap: "8px",
    background: "#ffffff",
    border: "#cbd5e1",
    invalidBorder: "#dc2626",
    borderHover: "#2563eb",
    foreground: "#0f172a",
    focus: "#93c5fd",
    placeholder: "#64748b",
    clearForeground: "#94a3b8",
    clearHoverBackground: "#f1f5f9",
    clearHoverForeground: "#334155",
    panelBackground: "#ffffff",
    searchBorder: "#e2e8f0",
    searchIcon: "#64748b",
    optionForeground: "#0f172a",
    optionHoverBackground: "#eff6ff",
    optionSelectedForeground: "#1d4ed8",
    optionBorder: "#cbd5e1",
    optionSelectedBackground: "#2563eb",
    messageForeground: "#64748b",
    disabledOpacity: "0.55",
    radius: "0.5rem",
    shadow: "0 1rem 2.5rem rgb(15 23 42 / 0.16)"
  },
  badge: {
    heightSmall: "1.625rem",
    fontSizeSmall: "0.8125rem",
    paddingInlineSmall: "0.75rem",
    heightMedium: "2rem",
    fontSizeMedium: "0.875rem",
    paddingInlineMedium: "0.875rem",
    heightLarge: "2.25rem",
    fontSizeLarge: "0.9375rem",
    paddingInlineLarge: "1rem",
    borderWidth: "1px",
    lineHeight: "1.25",
    dotSize: "0.4375rem",
    dotGap: "0.625rem",
    dismissSize: "1.5rem",
    dismissGap: "0.375rem",
    dismissMargin: "-0.375rem",
    dismissPadding: "0.125rem",
    dismissIconSize: "0.875rem",
    focusWidth: "2px",
    focusOffset: "2px",
    neutral: {
      background: "#f8fafc",
      border: "#cbd5e1",
      foreground: "#1e293b"
    },
    primary: {
      background: "#eff6ff",
      border: "#bfdbfe",
      foreground: "#1d4ed8"
    },
    success: {
      background: "#dcfce7",
      border: "#bbf7d0",
      foreground: "#15803d"
    },
    warning: {
      background: "#fef3c7",
      border: "#fde68a",
      foreground: "#a16207"
    },
    danger: { background: "#ffe4e6", border: "#fecdd3", foreground: "#be123c" },
    radius: "999px",
    fontWeight: "500",
    dismissHoverBackground: "rgb(15 23 42 / 0.1)",
    focus: "currentColor"
  },
  tabs: {
    background: "#ffffff",
    border: "#cbd5e1",
    foreground: "#475569",
    activeForeground: "#1d4ed8",
    hoverBackground: "#eff6ff",
    activeBorder: "#2563eb",
    panelBackground: "#ffffff",
    disabledOpacity: "0.55",
    radius: "0.5rem",
    gap: "0.25rem",
    focus: "#93c5fd"
  },
  accordion: {
    background: "#ffffff",
    border: "#cbd5e1",
    foreground: "#0f172a",
    hoverBackground: "#f8fafc",
    panelBackground: "#ffffff",
    icon: "#2563eb",
    focus: "#93c5fd",
    disabledOpacity: "0.55",
    radius: "0.5rem"
  },
  checkbox: {
    background: "#ffffff",
    backgroundHover: "#f8fafc",
    border: "#cbd5e1",
    borderWidth: "1px",
    checkedBackground: "#2563eb",
    checkedForeground: "#ffffff",
    foreground: "#0f172a",
    focus: "#93c5fd",
    focusWidth: "3px",
    focusOffset: "2px",
    disabledOpacity: "0.55",
    radius: "0.25rem",
    size: "1.25rem",
    gap: "0.625rem",
    labelLineHeight: "1.5"
  },
  switch: {
    background: "#ffffff",
    backgroundHover: "#f8fafc",
    border: "#cbd5e1",
    borderWidth: "1px",
    checkedBackground: "#2563eb",
    checkedThumb: "#ffffff",
    disabledOpacity: "0.55",
    focus: "#93c5fd",
    focusWidth: "3px",
    focusOffset: "2px",
    foreground: "#0f172a",
    gap: "0.625rem",
    height: "1.5rem",
    labelLineHeight: "1.5",
    padding: "0.125rem",
    radius: "999px",
    thumb: "#64748b",
    thumbSize: "1.125rem",
    width: "2.75rem"
  },
  dialog: {
    backdrop: "rgb(15 23 42 / 0.6)",
    background: "#ffffff",
    foreground: "#0f172a",
    border: "#cbd5e1",
    borderWidth: "1px",
    radius: "0.75rem",
    shadow: "0 1.5rem 4rem rgb(15 23 42 / 0.24)",
    padding: "1.5rem",
    maxWidth: "32rem",
    focus: "#93c5fd",
    focusWidth: "3px",
    focusOffset: "2px",
    viewportGutter: "1rem",
    stackBase: "1000"
  },
  pagination: {
    background: "#ffffff",
    backgroundHover: "#f8fafc",
    activeBackground: "#2563eb",
    border: "#cbd5e1",
    foreground: "#0f172a",
    activeForeground: "#ffffff",
    mutedForeground: "#64748b",
    focus: "#93c5fd",
    disabledOpacity: "0.55",
    radius: "0.5rem",
    size: "2.5rem",
    pagePadding: "0.5rem",
    directionIconSize: "1.5em",
    gap: "0.25rem",
    borderWidth: "1px",
    focusWidth: "3px",
    focusOffset: "2px",
    fontWeight: "600"
  }
};
var RESOLVED_DEFAULT_THEME = {
  ...BASE_DEFAULT_THEME,
  radio: { ...BASE_DEFAULT_THEME.radio, ...BULUD_ANGOUR_LIGHT_THEME.radio },
  datepicker: {
    ...BASE_DEFAULT_THEME.datepicker,
    ...BULUD_ANGOUR_LIGHT_THEME.datepicker
  },
  colors: { ...BASE_DEFAULT_THEME.colors, ...BULUD_ANGOUR_LIGHT_THEME.colors },
  shape: { ...BASE_DEFAULT_THEME.shape, ...BULUD_ANGOUR_LIGHT_THEME.shape },
  dropdown: {
    ...BASE_DEFAULT_THEME.dropdown,
    ...BULUD_ANGOUR_LIGHT_THEME.dropdown
  },
  tabs: { ...BASE_DEFAULT_THEME.tabs, ...BULUD_ANGOUR_LIGHT_THEME.tabs },
  accordion: {
    ...BASE_DEFAULT_THEME.accordion,
    ...BULUD_ANGOUR_LIGHT_THEME.accordion
  },
  checkbox: {
    ...BASE_DEFAULT_THEME.checkbox,
    ...BULUD_ANGOUR_LIGHT_THEME.checkbox
  },
  switch: { ...BASE_DEFAULT_THEME.switch, ...BULUD_ANGOUR_LIGHT_THEME.switch },
  dialog: { ...BASE_DEFAULT_THEME.dialog, ...BULUD_ANGOUR_LIGHT_THEME.dialog },
  pagination: {
    ...BASE_DEFAULT_THEME.pagination,
    ...BULUD_ANGOUR_LIGHT_THEME.pagination
  },
  button: {
    ...BASE_DEFAULT_THEME.button,
    ...BULUD_ANGOUR_LIGHT_THEME.button,
    small: {
      ...BASE_DEFAULT_THEME.button.small,
      ...BULUD_ANGOUR_LIGHT_THEME.button.small
    },
    medium: {
      ...BASE_DEFAULT_THEME.button.medium,
      ...BULUD_ANGOUR_LIGHT_THEME.button.medium
    },
    large: {
      ...BASE_DEFAULT_THEME.button.large,
      ...BULUD_ANGOUR_LIGHT_THEME.button.large
    }
  },
  badge: {
    ...BASE_DEFAULT_THEME.badge,
    ...BULUD_ANGOUR_LIGHT_THEME.badge,
    neutral: {
      ...BASE_DEFAULT_THEME.badge.neutral,
      ...BULUD_ANGOUR_LIGHT_THEME.badge.neutral
    },
    primary: {
      ...BASE_DEFAULT_THEME.badge.primary,
      ...BULUD_ANGOUR_LIGHT_THEME.badge.primary
    },
    success: {
      ...BASE_DEFAULT_THEME.badge.success,
      ...BULUD_ANGOUR_LIGHT_THEME.badge.success
    },
    warning: {
      ...BASE_DEFAULT_THEME.badge.warning,
      ...BULUD_ANGOUR_LIGHT_THEME.badge.warning
    },
    danger: {
      ...BASE_DEFAULT_THEME.badge.danger,
      ...BULUD_ANGOUR_LIGHT_THEME.badge.danger
    }
  }
};
var BULUD_DEFAULT_THEME = {
  colors: RESOLVED_DEFAULT_THEME.colors,
  shape: RESOLVED_DEFAULT_THEME.shape,
  dropdown: RESOLVED_DEFAULT_THEME.dropdown,
  tabs: RESOLVED_DEFAULT_THEME.tabs,
  accordion: RESOLVED_DEFAULT_THEME.accordion,
  checkbox: RESOLVED_DEFAULT_THEME.checkbox,
  switch: RESOLVED_DEFAULT_THEME.switch,
  badge: {
    neutral: RESOLVED_DEFAULT_THEME.badge.neutral,
    primary: RESOLVED_DEFAULT_THEME.badge.primary,
    success: RESOLVED_DEFAULT_THEME.badge.success,
    warning: RESOLVED_DEFAULT_THEME.badge.warning,
    danger: RESOLVED_DEFAULT_THEME.badge.danger,
    radius: RESOLVED_DEFAULT_THEME.badge.radius,
    fontWeight: RESOLVED_DEFAULT_THEME.badge.fontWeight,
    dismissHoverBackground: RESOLVED_DEFAULT_THEME.badge.dismissHoverBackground,
    focus: RESOLVED_DEFAULT_THEME.badge.focus
  },
  button: {
    disabledOpacity: RESOLVED_DEFAULT_THEME.button.disabledOpacity,
    fontWeight: RESOLVED_DEFAULT_THEME.button.fontWeight,
    gap: RESOLVED_DEFAULT_THEME.button.gap,
    small: RESOLVED_DEFAULT_THEME.button.small,
    medium: RESOLVED_DEFAULT_THEME.button.medium,
    large: RESOLVED_DEFAULT_THEME.button.large
  }
};
var BULUD_THEME = new InjectionToken(
  "BULUD_THEME",
  {
    factory: () => RESOLVED_DEFAULT_THEME
  }
);
function resolveBuludTheme(config = {}) {
  const dropdownInvalidBorder = config.dropdown?.invalidBorder ?? RESOLVED_DEFAULT_THEME.dropdown.invalidBorder;
  return {
    radio: { ...RESOLVED_DEFAULT_THEME.radio, ...config.radio },
    datepicker: { ...RESOLVED_DEFAULT_THEME.datepicker, ...config.datepicker },
    colors: {
      ...BULUD_DEFAULT_THEME.colors,
      ...config.colors
    },
    shape: {
      ...BULUD_DEFAULT_THEME.shape,
      ...config.shape
    },
    button: {
      ...BULUD_DEFAULT_THEME.button,
      ...config.button,
      secondaryBackground: config.button?.secondaryBackground ?? RESOLVED_DEFAULT_THEME.button.secondaryBackground,
      secondaryBackgroundHover: config.button?.secondaryBackgroundHover ?? RESOLVED_DEFAULT_THEME.button.secondaryBackgroundHover,
      secondaryBackgroundActive: config.button?.secondaryBackgroundActive ?? RESOLVED_DEFAULT_THEME.button.secondaryBackgroundActive,
      secondaryBorder: config.button?.secondaryBorder ?? RESOLVED_DEFAULT_THEME.button.secondaryBorder,
      secondaryForeground: config.button?.secondaryForeground ?? RESOLVED_DEFAULT_THEME.button.secondaryForeground,
      ghostForeground: config.button?.ghostForeground ?? RESOLVED_DEFAULT_THEME.button.ghostForeground,
      disabledBackground: config.button?.disabledBackground ?? RESOLVED_DEFAULT_THEME.button.disabledBackground,
      disabledForeground: config.button?.disabledForeground ?? RESOLVED_DEFAULT_THEME.button.disabledForeground,
      activeShadow: config.button?.activeShadow ?? RESOLVED_DEFAULT_THEME.button.activeShadow,
      dangerActiveShadow: config.button?.dangerActiveShadow ?? RESOLVED_DEFAULT_THEME.button.dangerActiveShadow,
      borderWidth: config.button?.borderWidth ?? RESOLVED_DEFAULT_THEME.button.borderWidth,
      focusWidth: config.button?.focusWidth ?? RESOLVED_DEFAULT_THEME.button.focusWidth,
      focusOffset: config.button?.focusOffset ?? RESOLVED_DEFAULT_THEME.button.focusOffset,
      ghostBackground: config.button?.ghostBackground ?? RESOLVED_DEFAULT_THEME.button.ghostBackground,
      small: {
        ...BULUD_DEFAULT_THEME.button.small,
        ...config.button?.small
      },
      medium: {
        ...BULUD_DEFAULT_THEME.button.medium,
        ...config.button?.medium
      },
      large: {
        ...BULUD_DEFAULT_THEME.button.large,
        ...config.button?.large
      }
    },
    dropdown: {
      ...RESOLVED_DEFAULT_THEME.dropdown,
      ...config.dropdown,
      invalidBorder: dropdownInvalidBorder
    },
    badge: {
      ...BULUD_DEFAULT_THEME.badge,
      ...config.badge,
      heightSmall: config.badge?.heightSmall ?? RESOLVED_DEFAULT_THEME.badge.heightSmall,
      fontSizeSmall: config.badge?.fontSizeSmall ?? RESOLVED_DEFAULT_THEME.badge.fontSizeSmall,
      paddingInlineSmall: config.badge?.paddingInlineSmall ?? RESOLVED_DEFAULT_THEME.badge.paddingInlineSmall,
      heightMedium: config.badge?.heightMedium ?? RESOLVED_DEFAULT_THEME.badge.heightMedium,
      fontSizeMedium: config.badge?.fontSizeMedium ?? RESOLVED_DEFAULT_THEME.badge.fontSizeMedium,
      paddingInlineMedium: config.badge?.paddingInlineMedium ?? RESOLVED_DEFAULT_THEME.badge.paddingInlineMedium,
      heightLarge: config.badge?.heightLarge ?? RESOLVED_DEFAULT_THEME.badge.heightLarge,
      fontSizeLarge: config.badge?.fontSizeLarge ?? RESOLVED_DEFAULT_THEME.badge.fontSizeLarge,
      paddingInlineLarge: config.badge?.paddingInlineLarge ?? RESOLVED_DEFAULT_THEME.badge.paddingInlineLarge,
      borderWidth: config.badge?.borderWidth ?? RESOLVED_DEFAULT_THEME.badge.borderWidth,
      lineHeight: config.badge?.lineHeight ?? RESOLVED_DEFAULT_THEME.badge.lineHeight,
      dotSize: config.badge?.dotSize ?? RESOLVED_DEFAULT_THEME.badge.dotSize,
      dotGap: config.badge?.dotGap ?? RESOLVED_DEFAULT_THEME.badge.dotGap,
      dismissSize: config.badge?.dismissSize ?? RESOLVED_DEFAULT_THEME.badge.dismissSize,
      dismissGap: config.badge?.dismissGap ?? RESOLVED_DEFAULT_THEME.badge.dismissGap,
      dismissMargin: config.badge?.dismissMargin ?? RESOLVED_DEFAULT_THEME.badge.dismissMargin,
      dismissPadding: config.badge?.dismissPadding ?? RESOLVED_DEFAULT_THEME.badge.dismissPadding,
      dismissIconSize: config.badge?.dismissIconSize ?? RESOLVED_DEFAULT_THEME.badge.dismissIconSize,
      focusWidth: config.badge?.focusWidth ?? RESOLVED_DEFAULT_THEME.badge.focusWidth,
      focusOffset: config.badge?.focusOffset ?? RESOLVED_DEFAULT_THEME.badge.focusOffset,
      neutral: {
        ...BULUD_DEFAULT_THEME.badge.neutral,
        ...config.badge?.neutral
      },
      primary: {
        ...BULUD_DEFAULT_THEME.badge.primary,
        ...config.badge?.primary
      },
      success: {
        ...BULUD_DEFAULT_THEME.badge.success,
        ...config.badge?.success
      },
      warning: {
        ...BULUD_DEFAULT_THEME.badge.warning,
        ...config.badge?.warning
      },
      danger: { ...BULUD_DEFAULT_THEME.badge.danger, ...config.badge?.danger }
    },
    tabs: {
      ...BULUD_DEFAULT_THEME.tabs,
      ...config.tabs
    },
    accordion: {
      ...BULUD_DEFAULT_THEME.accordion,
      ...config.accordion
    },
    checkbox: {
      ...RESOLVED_DEFAULT_THEME.checkbox,
      ...config.checkbox
    },
    switch: {
      ...RESOLVED_DEFAULT_THEME.switch,
      ...config.switch
    },
    dialog: {
      ...RESOLVED_DEFAULT_THEME.dialog,
      ...config.dialog
    },
    pagination: {
      ...RESOLVED_DEFAULT_THEME.pagination,
      ...config.pagination
    }
  };
}
function createBuludThemeVariables(config = {}) {
  const theme = resolveBuludTheme(config);
  return {
    ...formThemeVariables("radio", theme.radio),
    ...formThemeVariables("datepicker", theme.datepicker),
    "--bulud-color-primary": theme.colors.primary,
    "--bulud-color-primary-hover": theme.colors.primaryHover,
    "--bulud-color-primary-active": theme.colors.primaryActive,
    "--bulud-color-on-primary": theme.colors.onPrimary,
    "--bulud-color-surface": theme.colors.surface,
    "--bulud-color-surface-hover": theme.colors.surfaceHover,
    "--bulud-color-surface-active": theme.colors.surfaceActive,
    "--bulud-color-on-surface": theme.colors.onSurface,
    "--bulud-color-border": theme.colors.border,
    "--bulud-color-danger": theme.colors.danger,
    "--bulud-color-danger-hover": theme.colors.dangerHover,
    "--bulud-color-danger-active": theme.colors.dangerActive,
    "--bulud-color-on-danger": theme.colors.onDanger,
    "--bulud-color-focus": theme.colors.focus,
    "--bulud-color-danger-focus": theme.colors.dangerFocus,
    "--bulud-radius-control": theme.shape.controlRadius,
    "--bulud-button-border-width": theme.button.borderWidth,
    "--bulud-button-focus-width": theme.button.focusWidth,
    "--bulud-button-focus-offset": theme.button.focusOffset,
    "--bulud-button-ghost-background": theme.button.ghostBackground,
    "--bulud-button-disabled-opacity": theme.button.disabledOpacity,
    "--bulud-button-font-weight": theme.button.fontWeight,
    "--bulud-button-secondary-background": theme.button.secondaryBackground,
    "--bulud-button-secondary-background-hover": theme.button.secondaryBackgroundHover,
    "--bulud-button-secondary-background-active": theme.button.secondaryBackgroundActive,
    "--bulud-button-secondary-border": theme.button.secondaryBorder,
    "--bulud-button-secondary-foreground": theme.button.secondaryForeground,
    "--bulud-button-ghost-foreground": theme.button.ghostForeground,
    "--bulud-button-disabled-background": theme.button.disabledBackground,
    "--bulud-button-disabled-foreground": theme.button.disabledForeground,
    "--bulud-button-active-shadow": theme.button.activeShadow,
    "--bulud-button-danger-active-shadow": theme.button.dangerActiveShadow,
    "--bulud-button-gap": theme.button.gap,
    "--bulud-button-height-small": theme.button.small.height,
    "--bulud-button-font-size-small": theme.button.small.fontSize,
    "--bulud-button-padding-inline-small": theme.button.small.paddingInline,
    "--bulud-button-height-medium": theme.button.medium.height,
    "--bulud-button-font-size-medium": theme.button.medium.fontSize,
    "--bulud-button-padding-inline-medium": theme.button.medium.paddingInline,
    "--bulud-button-height-large": theme.button.large.height,
    "--bulud-button-font-size-large": theme.button.large.fontSize,
    "--bulud-button-padding-inline-large": theme.button.large.paddingInline,
    "--bulud-dropdown-font-size": theme.dropdown.fontSize,
    "--bulud-dropdown-line-height": theme.dropdown.lineHeight,
    "--bulud-dropdown-font-weight": theme.dropdown.fontWeight,
    "--bulud-dropdown-min-height": theme.dropdown.minHeight,
    "--bulud-dropdown-padding-block": theme.dropdown.paddingBlock,
    "--bulud-dropdown-padding-inline": theme.dropdown.paddingInline,
    "--bulud-dropdown-gap": theme.dropdown.gap,
    "--bulud-dropdown-option-min-height": theme.dropdown.optionMinHeight,
    "--bulud-dropdown-option-padding": theme.dropdown.optionPadding,
    "--bulud-dropdown-option-gap": theme.dropdown.optionGap,
    "--bulud-dropdown-background": theme.dropdown.background,
    "--bulud-dropdown-border": theme.dropdown.border,
    "--bulud-dropdown-invalid-border": theme.dropdown.invalidBorder,
    "--bulud-dropdown-border-hover": theme.dropdown.borderHover,
    "--bulud-dropdown-foreground": theme.dropdown.foreground,
    "--bulud-dropdown-focus": theme.dropdown.focus,
    "--bulud-dropdown-placeholder": theme.dropdown.placeholder,
    "--bulud-dropdown-clear-foreground": theme.dropdown.clearForeground,
    "--bulud-dropdown-clear-hover-background": theme.dropdown.clearHoverBackground,
    "--bulud-dropdown-clear-hover-foreground": theme.dropdown.clearHoverForeground,
    "--bulud-dropdown-panel-background": theme.dropdown.panelBackground,
    "--bulud-dropdown-search-border": theme.dropdown.searchBorder,
    "--bulud-dropdown-search-icon": theme.dropdown.searchIcon,
    "--bulud-dropdown-option-foreground": theme.dropdown.optionForeground,
    "--bulud-dropdown-option-hover-background": theme.dropdown.optionHoverBackground,
    "--bulud-dropdown-option-selected-foreground": theme.dropdown.optionSelectedForeground,
    "--bulud-dropdown-option-border": theme.dropdown.optionBorder,
    "--bulud-dropdown-option-selected-background": theme.dropdown.optionSelectedBackground,
    "--bulud-dropdown-message-foreground": theme.dropdown.messageForeground,
    "--bulud-dropdown-disabled-opacity": theme.dropdown.disabledOpacity,
    "--bulud-dropdown-radius": theme.dropdown.radius,
    "--bulud-dropdown-shadow": theme.dropdown.shadow,
    "--bulud-badge-neutral-background": theme.badge.neutral.background,
    "--bulud-badge-neutral-border": theme.badge.neutral.border,
    "--bulud-badge-neutral-foreground": theme.badge.neutral.foreground,
    "--bulud-badge-primary-background": theme.badge.primary.background,
    "--bulud-badge-primary-border": theme.badge.primary.border,
    "--bulud-badge-primary-foreground": theme.badge.primary.foreground,
    "--bulud-badge-success-background": theme.badge.success.background,
    "--bulud-badge-success-border": theme.badge.success.border,
    "--bulud-badge-success-foreground": theme.badge.success.foreground,
    "--bulud-badge-warning-background": theme.badge.warning.background,
    "--bulud-badge-warning-border": theme.badge.warning.border,
    "--bulud-badge-warning-foreground": theme.badge.warning.foreground,
    "--bulud-badge-danger-background": theme.badge.danger.background,
    "--bulud-badge-danger-border": theme.badge.danger.border,
    "--bulud-badge-danger-foreground": theme.badge.danger.foreground,
    "--bulud-badge-height-small": theme.badge.heightSmall,
    "--bulud-badge-font-size-small": theme.badge.fontSizeSmall,
    "--bulud-badge-padding-inline-small": theme.badge.paddingInlineSmall,
    "--bulud-badge-height-medium": theme.badge.heightMedium,
    "--bulud-badge-font-size-medium": theme.badge.fontSizeMedium,
    "--bulud-badge-padding-inline-medium": theme.badge.paddingInlineMedium,
    "--bulud-badge-height-large": theme.badge.heightLarge,
    "--bulud-badge-font-size-large": theme.badge.fontSizeLarge,
    "--bulud-badge-padding-inline-large": theme.badge.paddingInlineLarge,
    "--bulud-badge-border-width": theme.badge.borderWidth,
    "--bulud-badge-line-height": theme.badge.lineHeight,
    "--bulud-badge-dot-size": theme.badge.dotSize,
    "--bulud-badge-dot-gap": theme.badge.dotGap,
    "--bulud-badge-dismiss-size": theme.badge.dismissSize,
    "--bulud-badge-dismiss-gap": theme.badge.dismissGap,
    "--bulud-badge-dismiss-margin": theme.badge.dismissMargin,
    "--bulud-badge-dismiss-padding": theme.badge.dismissPadding,
    "--bulud-badge-dismiss-icon-size": theme.badge.dismissIconSize,
    "--bulud-badge-focus-width": theme.badge.focusWidth,
    "--bulud-badge-focus-offset": theme.badge.focusOffset,
    "--bulud-badge-radius": theme.badge.radius,
    "--bulud-badge-font-weight": theme.badge.fontWeight,
    "--bulud-badge-dismiss-hover-background": theme.badge.dismissHoverBackground,
    "--bulud-badge-focus": theme.badge.focus,
    "--bulud-tabs-background": theme.tabs.background,
    "--bulud-tabs-border": theme.tabs.border,
    "--bulud-tabs-foreground": theme.tabs.foreground,
    "--bulud-tabs-active-foreground": theme.tabs.activeForeground,
    "--bulud-tabs-hover-background": theme.tabs.hoverBackground,
    "--bulud-tabs-active-border": theme.tabs.activeBorder,
    "--bulud-tabs-panel-background": theme.tabs.panelBackground,
    "--bulud-tabs-disabled-opacity": theme.tabs.disabledOpacity,
    "--bulud-tabs-radius": theme.tabs.radius,
    "--bulud-tabs-gap": theme.tabs.gap,
    "--bulud-tabs-focus": theme.tabs.focus,
    "--bulud-accordion-background": theme.accordion.background,
    "--bulud-accordion-border": theme.accordion.border,
    "--bulud-accordion-foreground": theme.accordion.foreground,
    "--bulud-accordion-hover-background": theme.accordion.hoverBackground,
    "--bulud-accordion-panel-background": theme.accordion.panelBackground,
    "--bulud-accordion-icon": theme.accordion.icon,
    "--bulud-accordion-focus": theme.accordion.focus,
    "--bulud-accordion-disabled-opacity": theme.accordion.disabledOpacity,
    "--bulud-accordion-radius": theme.accordion.radius,
    "--bulud-checkbox-background": theme.checkbox.background,
    "--bulud-checkbox-background-hover": theme.checkbox.backgroundHover,
    "--bulud-checkbox-border": theme.checkbox.border,
    "--bulud-checkbox-border-width": theme.checkbox.borderWidth,
    "--bulud-checkbox-checked-background": theme.checkbox.checkedBackground,
    "--bulud-checkbox-checked-foreground": theme.checkbox.checkedForeground,
    "--bulud-checkbox-foreground": theme.checkbox.foreground,
    "--bulud-checkbox-focus": theme.checkbox.focus,
    "--bulud-checkbox-focus-width": theme.checkbox.focusWidth,
    "--bulud-checkbox-focus-offset": theme.checkbox.focusOffset,
    "--bulud-checkbox-disabled-opacity": theme.checkbox.disabledOpacity,
    "--bulud-checkbox-radius": theme.checkbox.radius,
    "--bulud-checkbox-size": theme.checkbox.size,
    "--bulud-checkbox-gap": theme.checkbox.gap,
    "--bulud-checkbox-label-line-height": theme.checkbox.labelLineHeight,
    "--bulud-switch-background": theme.switch.background,
    "--bulud-switch-background-hover": theme.switch.backgroundHover,
    "--bulud-switch-border": theme.switch.border,
    "--bulud-switch-border-width": theme.switch.borderWidth,
    "--bulud-switch-checked-background": theme.switch.checkedBackground,
    "--bulud-switch-checked-thumb": theme.switch.checkedThumb,
    "--bulud-switch-disabled-opacity": theme.switch.disabledOpacity,
    "--bulud-switch-focus": theme.switch.focus,
    "--bulud-switch-focus-width": theme.switch.focusWidth,
    "--bulud-switch-focus-offset": theme.switch.focusOffset,
    "--bulud-switch-foreground": theme.switch.foreground,
    "--bulud-switch-gap": theme.switch.gap,
    "--bulud-switch-height": theme.switch.height,
    "--bulud-switch-label-line-height": theme.switch.labelLineHeight,
    "--bulud-switch-padding": theme.switch.padding,
    "--bulud-switch-radius": theme.switch.radius,
    "--bulud-switch-thumb": theme.switch.thumb,
    "--bulud-switch-thumb-size": theme.switch.thumbSize,
    "--bulud-switch-width": theme.switch.width,
    "--bulud-dialog-backdrop": theme.dialog.backdrop,
    "--bulud-dialog-background": theme.dialog.background,
    "--bulud-dialog-foreground": theme.dialog.foreground,
    "--bulud-dialog-border": theme.dialog.border,
    "--bulud-dialog-border-width": theme.dialog.borderWidth,
    "--bulud-dialog-radius": theme.dialog.radius,
    "--bulud-dialog-shadow": theme.dialog.shadow,
    "--bulud-dialog-padding": theme.dialog.padding,
    "--bulud-dialog-max-width": theme.dialog.maxWidth,
    "--bulud-dialog-focus": theme.dialog.focus,
    "--bulud-dialog-focus-width": theme.dialog.focusWidth,
    "--bulud-dialog-focus-offset": theme.dialog.focusOffset,
    "--bulud-dialog-viewport-gutter": theme.dialog.viewportGutter,
    "--bulud-dialog-stack-base": theme.dialog.stackBase,
    "--bulud-pagination-background": theme.pagination.background,
    "--bulud-pagination-background-hover": theme.pagination.backgroundHover,
    "--bulud-pagination-active-background": theme.pagination.activeBackground,
    "--bulud-pagination-border": theme.pagination.border,
    "--bulud-pagination-foreground": theme.pagination.foreground,
    "--bulud-pagination-active-foreground": theme.pagination.activeForeground,
    "--bulud-pagination-muted-foreground": theme.pagination.mutedForeground,
    "--bulud-pagination-focus": theme.pagination.focus,
    "--bulud-pagination-disabled-opacity": theme.pagination.disabledOpacity,
    "--bulud-pagination-radius": theme.pagination.radius,
    "--bulud-pagination-size": theme.pagination.size,
    "--bulud-pagination-page-padding": theme.pagination.pagePadding,
    "--bulud-pagination-direction-icon-size": theme.pagination.directionIconSize,
    "--bulud-pagination-gap": theme.pagination.gap,
    "--bulud-pagination-border-width": theme.pagination.borderWidth,
    "--bulud-pagination-focus-width": theme.pagination.focusWidth,
    "--bulud-pagination-focus-offset": theme.pagination.focusOffset,
    "--bulud-pagination-font-weight": theme.pagination.fontWeight
  };
}
export {
  BULUD_ANGOUR_DARK_THEME,
  BULUD_ANGOUR_LIGHT_THEME,
  BULUD_ANGOUR_TOKENS,
  createBuludThemeVariables
};
