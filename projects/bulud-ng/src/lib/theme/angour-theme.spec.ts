import { DOCUMENT, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  BULUD_THEME,
  createBuludThemeVariables,
  provideBuludTheme,
  resolveBuludTheme,
} from './bulud-theme';
import {
  BULUD_ANGOUR_TOKENS,
  BULUD_ANGOUR_LIGHT_THEME,
  BULUD_ANGOUR_DARK_THEME,
} from './angour-theme';

describe('Angour theme presets', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });
  afterEach(() => {
    TestBed.inject(DOCUMENT)
      .head.querySelector('style[data-bulud-theme]')
      ?.remove();
  });

  it('registers an Angour preset through the existing public provider', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideBuludTheme(BULUD_ANGOUR_LIGHT_THEME),
      ],
    });
    const theme = TestBed.inject(BULUD_THEME);
    expect(theme.colors.primary).toBe('#0C2340');
    expect(theme.dropdown.panelBackground).toBe('#F3F6F9');
    expect(theme.dropdown.background).toBe('#F3F6F9');
    expect(theme.checkbox.checkedBackground).toBe(theme.colors.primary);
    expect(theme.button.medium.height).toBe('40px');
    expect(
      TestBed.inject(DOCUMENT).head.querySelector('style[data-bulud-theme]')
        ?.textContent,
    ).toContain('--bulud-color-primary: #0C2340');
  });

  it('keeps caller overrides ahead of preset values without changing either preset', () => {
    const customized = resolveBuludTheme({
      ...BULUD_ANGOUR_LIGHT_THEME,
      colors: { ...BULUD_ANGOUR_LIGHT_THEME.colors, primary: '#7c3aed' },
    });
    expect(customized.colors.primary).toBe('#7c3aed');
    expect(customized.colors.onPrimary).toBe('#FFFFFF');
    expect(BULUD_ANGOUR_LIGHT_THEME.colors.primary).toBe('#0C2340');
    expect(BULUD_ANGOUR_DARK_THEME.colors.primary).toBe('#FDB515');
  });

  it('maps all component surfaces and selection tokens in dark mode', () => {
    const variables = createBuludThemeVariables(BULUD_ANGOUR_DARK_THEME);
    for (const key of [
      '--bulud-color-surface',
      '--bulud-tabs-panel-background',
      '--bulud-accordion-panel-background',
      '--bulud-switch-background',
      '--bulud-dialog-background',
    ] as const) {
      expect(variables[key]).withContext(key).toBe('#1E1E26');
    }
    expect(variables['--bulud-dropdown-panel-background']).toBe('#000000');
    expect(variables['--bulud-pagination-background']).toBe('#1E1E26');
    expect(variables['--bulud-checkbox-background']).toBe('transparent');
    expect(variables['--bulud-checkbox-size']).toBe('16px');
    expect(variables['--bulud-pagination-active-foreground']).toBe('#000000');
    expect(variables['--bulud-pagination-active-background']).toBe('#FDB515');
    expect(variables['--bulud-badge-success-background']).toBe('#26D07C');
    expect(variables['--bulud-badge-success-foreground']).toBe('#000000');
  });
  it('keeps small error and danger badge text above 4.5:1 contrast in both modes', () => {
    const luminance = (hex: string) => {
      const rgb = [1, 3, 5]
        .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    };
    for (const preset of [BULUD_ANGOUR_LIGHT_THEME, BULUD_ANGOUR_DARK_THEME]) {
      const theme = resolveBuludTheme(preset);
      for (const variant of [
        'neutral',
        'primary',
        'success',
        'warning',
        'danger',
      ] as const) {
        const pair = [
          luminance(theme.badge[variant].background),
          luminance(theme.badge[variant].foreground),
        ].sort((a, b) => a - b);
        expect((pair[1] + 0.05) / (pair[0] + 0.05))
          .withContext(variant)
          .toBeGreaterThanOrEqual(4.5);
      }
    }
    for (const palette of [
      BULUD_ANGOUR_TOKENS.light,
      BULUD_ANGOUR_TOKENS.dark,
    ]) {
      const values = [
        luminance(palette.dangerText),
        luminance(palette.surface),
      ].sort((a, b) => a - b);
      expect((values[1] + 0.05) / (values[0] + 0.05)).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });
  it('keeps badges compact and secondary buttons on the ITB secondary brand', () => {
    for (const preset of [BULUD_ANGOUR_LIGHT_THEME, BULUD_ANGOUR_DARK_THEME]) {
      const resolved = resolveBuludTheme(preset);
      expect(resolved.badge.heightMedium).toBe('24px');
      expect(resolved.badge.radius).toBe('6px');
      expect(resolved.button.disabledOpacity).toBe('1');
    }
    expect(
      resolveBuludTheme(BULUD_ANGOUR_LIGHT_THEME).button.secondaryBackground,
    ).toBe('#FDB515');
    expect(
      resolveBuludTheme(BULUD_ANGOUR_DARK_THEME).button.secondaryBackground,
    ).toBe('#0C2340');
  });
  it('maps optional button overrides without forcing omitted values over scoped styles', () => {
    const overrides = {
      secondaryBackground: '#123456',
      secondaryBackgroundHover: '#234567',
      secondaryBackgroundActive: '#345678',
      secondaryBorder: '#456789',
      secondaryForeground: '#567890',
      ghostForeground: '#678901',
      disabledBackground: '#789012',
      disabledForeground: '#890123',
      activeShadow: '0 0 0 4px red',
      dangerActiveShadow: '0 0 0 4px blue',
    };
    const variables = createBuludThemeVariables({ button: overrides });
    for (const [key, value] of Object.entries(overrides)) {
      const cssKey = ('--bulud-button-' +
        key.replace(
          /[A-Z]/g,
          (char) => '-' + char.toLowerCase(),
        )) as keyof typeof variables;
      expect(variables[cssKey]).withContext(key).toBe(value);
    }
    TestBed.configureTestingModule({
      providers: [provideBuludTheme({ button: overrides })],
    });
    const css = TestBed.inject(DOCUMENT).head.querySelector(
      'style[data-bulud-theme]',
    )!.textContent!;
    expect(css).toContain('--bulud-button-secondary-background: #123456');
    expect(
      css.split('--bulud-button-secondary-background: #123456').length,
    ).toBe(3);
  });
  it('leaves omitted optional button colors available to scope CSS overrides', () => {
    TestBed.configureTestingModule({ providers: [provideBuludTheme({})] });
    const css = TestBed.inject(DOCUMENT).head.querySelector(
      'style[data-bulud-theme]',
    )!.textContent!;
    expect(css).not.toContain('--bulud-button-secondary-background:');
    expect(css).not.toContain('--bulud-button-disabled-background:');
  });
});
