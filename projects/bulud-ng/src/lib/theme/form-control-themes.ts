/** Theme tokens for native radio groups. All values accept CSS expressions. */
export interface BuludRadioTheme {
  readonly background: string;
  readonly border: string;
  readonly checked: string;
  readonly foreground: string;
  readonly focus: string;
  readonly size: string;
  readonly dotSize: string;
  readonly gap: string;
  readonly borderWidth: string;
  readonly focusWidth: string;
  readonly focusOffset: string;
  readonly disabledOpacity: string;
}

/** Calendar panel, trigger, day states and geometry. */
export interface BuludDatepickerTheme {
  readonly background: string;
  readonly foreground: string;
  readonly border: string;
  readonly muted: string;
  readonly hoverBackground: string;
  readonly selectedBackground: string;
  readonly selectedForeground: string;
  readonly rangeBackground: string;
  readonly rangeEndpointBackground: string;
  readonly rangeEndpointForeground: string;
  readonly yearBackground: string;
  readonly yearSelectedBackground: string;
  readonly focus: string;
  readonly radius: string;
  readonly daySize: string;
  readonly fontSize: string;
  readonly gap: string;
  readonly padding: string;
  readonly width: string;
  readonly borderWidth: string;
  readonly focusWidth: string;
  readonly focusOffset: string;
  readonly disabledOpacity: string;
}

export const FORM_CONTROL_THEME_DEFAULTS = {
  radio: {
    background: 'transparent',
    border: '#cbd5e1',
    checked: '#2563eb',
    foreground: '#0f172a',
    focus: '#93c5fd',
    size: '16px',
    dotSize: '8px',
    gap: '8px',
    borderWidth: '1px',
    focusWidth: '3px',
    focusOffset: '2px',
    disabledOpacity: '0.55',
  },
  datepicker: {
    background: '#ffffff',
    foreground: '#0f172a',
    border: '#cbd5e1',
    muted: '#64748b',
    hoverBackground: '#f1f5f9',
    selectedBackground: '#2563eb',
    selectedForeground: '#ffffff',
    rangeBackground: '#eff6ff',
    rangeEndpointBackground: '#2563eb',
    rangeEndpointForeground: '#ffffff',
    yearBackground: '#ffffff',
    yearSelectedBackground: '#e2e8f0',
    focus: '#93c5fd',
    radius: '8px',
    fontSize: '12px',
    daySize: '28px',
    gap: '4px',
    padding: '12px',
    width: '23.375rem',
    borderWidth: '1px',
    focusWidth: '3px',
    focusOffset: '2px',
    disabledOpacity: '0.55',
  },
} as const;

export function formThemeVariables(
  prefix: 'radio' | 'datepicker',
  theme: Partial<BuludRadioTheme | BuludDatepickerTheme>,
): Record<`--bulud-${string}`, string> {
  return Object.fromEntries(
    Object.entries(theme).map(([field, value]) => [
      `--bulud-${prefix}-${field.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase())}`,
      value,
    ]),
  );
}

export const FORM_CONTROL_GEOMETRY = new Set(
  [
    'size',
    'dotSize',
    'gap',
    'borderWidth',
    'focusWidth',
    'focusOffset',
    'disabledOpacity',
    'radius',
    'daySize',
    'fontSize',
    'padding',
    'width',
  ].map((field) =>
    field.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase()),
  ),
);
