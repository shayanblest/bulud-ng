import {
  createEnvironmentInjector,
  DOCUMENT,
  EnvironmentInjector,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  BULUD_DEFAULT_THEME,
  BULUD_THEME,
  createBuludThemeVariables,
  defineBuludTheme,
  provideBuludTheme,
  resolveBuludTheme,
} from './bulud-theme';

describe('Bulud theme', () => {
  it('preserves a consumer configuration for type-safe config files', () => {
    const config = {
      colors: {
        primary: '#7c3aed',
      },
    } as const;

    expect(defineBuludTheme(config)).toBe(config);
  });

  it('merges nested overrides without losing default values', () => {
    const theme = resolveBuludTheme({
      colors: {
        primary: '#7c3aed',
      },
      button: {
        medium: {
          height: '2.75rem',
        },
      },
    });

    expect(theme.colors.primary).toBe('#7c3aed');
    expect(theme.colors.primaryHover).toBe(
      BULUD_DEFAULT_THEME.colors.primaryHover,
    );
    expect(theme.button.medium.height).toBe('2.75rem');
    expect(theme.button.medium.fontSize).toBe(
      BULUD_DEFAULT_THEME.button.medium.fontSize,
    );
  });

  it('resolves component tokens after global values and library defaults', () => {
    const theme = resolveBuludTheme({
      colors: { primary: '#7c3aed' },
      dropdown: { border: '#f97316' },
      badge: {
        success: { background: '#14532d' },
        fontWeight: '700',
      },
    });

    expect(theme.colors.primary).toBe('#7c3aed');
    expect(theme.dropdown.border).toBe('#f97316');
    expect(theme.dropdown.foreground).toBe(
      BULUD_DEFAULT_THEME.dropdown.foreground,
    );
    expect(theme.badge.success.background).toBe('#14532d');
    expect(theme.badge.success.border).toBe(
      BULUD_DEFAULT_THEME.badge.success.border,
    );
    expect(theme.badge.fontWeight).toBe('700');
  });

  it('creates variables shared by components and Tailwind', () => {
    const variables = createBuludThemeVariables({
      colors: {
        primary: '#7c3aed',
      },
      shape: {
        controlRadius: '0.75rem',
      },
      dropdown: {
        border: '#f97316',
      },
      badge: {
        danger: {
          foreground: '#881337',
        },
      },
    });

    expect(variables['--bulud-color-primary']).toBe('#7c3aed');
    expect(variables['--bulud-radius-control']).toBe('0.75rem');
    expect(variables['--bulud-dropdown-border']).toBe('#f97316');
    expect(variables['--bulud-badge-danger-foreground']).toBe('#881337');
    expect(variables['--bulud-color-danger']).toBe(
      BULUD_DEFAULT_THEME.colors.danger,
    );
  });

  it('keeps instance custom properties available above provider values', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const document = TestBed.inject(DOCUMENT);
    const root = document.documentElement;
    root.style.setProperty('--bulud-dropdown-border', '#f97316');

    const instance = document.createElement('bulud-dropdown');
    instance.style.setProperty('--bulud-dropdown-border', '#22c55e');
    root.append(instance);

    try {
      expect(instance.style.getPropertyValue('--bulud-dropdown-border')).toBe(
        '#22c55e',
      );
      expect(root.style.getPropertyValue('--bulud-dropdown-border')).toBe(
        '#f97316',
      );
    } finally {
      instance.remove();
      root.style.removeProperty('--bulud-dropdown-border');
    }
  });

  it('provides and applies the resolved theme at environment startup', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const document = TestBed.inject(DOCUMENT);
    const existingStyle = document.head.querySelector(
      'style[data-bulud-theme]',
    );
    const originalStyleText = existingStyle?.textContent ?? null;
    const environmentInjector = createEnvironmentInjector(
      [
        provideBuludTheme({
          colors: {
            primary: '#7c3aed',
          },
        }),
      ],
      parentInjector,
    );

    try {
      expect(environmentInjector.get(BULUD_THEME).colors.primary).toBe(
        '#7c3aed',
      );
      expect(
        document.defaultView
          ?.getComputedStyle(document.documentElement)
          .getPropertyValue('--bulud-color-primary'),
      ).toBe('#7c3aed');
    } finally {
      environmentInjector.destroy();

      if (existingStyle) {
        existingStyle.textContent = originalStyleText;
      } else {
        document.head.querySelector('style[data-bulud-theme]')?.remove();
      }
    }
  });

  it('lets an explicit dark ancestor override global light-mode variables', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const document = TestBed.inject(DOCUMENT);
    const existingStyle = document.head.querySelector(
      'style[data-bulud-theme]',
    );
    const originalStyleText = existingStyle?.textContent ?? null;
    const environmentInjector = createEnvironmentInjector(
      [
        provideBuludTheme({
          colors: {
            primary: '#7c3aed',
          },
        }),
      ],
      parentInjector,
    );

    try {
      document.documentElement.setAttribute('data-theme', 'dark');

      expect(
        document.defaultView
          ?.getComputedStyle(document.documentElement)
          .getPropertyValue('--bulud-color-primary'),
      ).not.toBe('#7c3aed');
      expect(
        document.head.querySelector('style[data-bulud-theme]')?.textContent,
      ).toContain(":root:not(.dark):not([data-theme='dark'])");
    } finally {
      document.documentElement.removeAttribute('data-theme');
      environmentInjector.destroy();

      if (existingStyle) {
        existingStyle.textContent = originalStyleText;
      } else {
        document.head.querySelector('style[data-bulud-theme]')?.remove();
      }
    }
  });
});
