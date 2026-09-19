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
  BuludButtonTheme,
  BuludTheme,
  createBuludThemeVariables,
  defineBuludTheme,
  provideBuludTheme,
  resolveBuludTheme,
} from './bulud-theme';

describe('Bulud theme', () => {
  const optionalButtonDefaults = {
    borderWidth: '1px',
    focusWidth: '3px',
    focusOffset: '2px',
    ghostBackground: 'transparent',
  };

  it('keeps optional button tokens absent from public defaults at runtime', () => {
    expect(Object.keys(BULUD_DEFAULT_THEME.button).sort()).toEqual([
      'disabledOpacity',
      'fontWeight',
      'gap',
      'large',
      'medium',
      'small',
    ]);
    for (const field of Object.keys(optionalButtonDefaults)) {
      expect(field in BULUD_DEFAULT_THEME.button).toBeFalse();
    }
    expect(resolveBuludTheme(BULUD_DEFAULT_THEME).button).toEqual({
      ...BULUD_DEFAULT_THEME.button,
      ...optionalButtonDefaults,
    });
    expect(createBuludThemeVariables(BULUD_DEFAULT_THEME)).toEqual(
      jasmine.objectContaining({
        '--bulud-button-border-width': '1px',
        '--bulud-button-focus-width': '3px',
        '--bulud-button-focus-offset': '2px',
        '--bulud-button-ghost-background': 'transparent',
      }),
    );
  });

  it('accepts legacy button and complete theme shapes and resolves new defaults', () => {
    const button: BuludButtonTheme = {
      disabledOpacity: '0.4',
      fontWeight: '700',
      gap: '1rem',
      small: { height: '2rem', fontSize: '1rem', paddingInline: '1rem' },
      medium: { height: '3rem', fontSize: '1rem', paddingInline: '1rem' },
      large: { height: '4rem', fontSize: '1rem', paddingInline: '1rem' },
    };
    const legacyTheme: BuludTheme = { ...BULUD_DEFAULT_THEME, button };
    const resolvedButton: Required<BuludButtonTheme> =
      resolveBuludTheme(legacyTheme).button;

    expect(defineBuludTheme(legacyTheme)).toBe(legacyTheme);
    expect(provideBuludTheme(legacyTheme)).toBeDefined();
    expect<BuludButtonTheme>(resolvedButton).toEqual({
      ...BULUD_DEFAULT_THEME.button,
      ...optionalButtonDefaults,
      ...button,
    });
  });

  it('accepts a legacy theme typed using typeof BULUD_DEFAULT_THEME', () => {
    const legacyTheme: typeof BULUD_DEFAULT_THEME = {
      ...BULUD_DEFAULT_THEME,
      button: {
        disabledOpacity: '0.4',
        fontWeight: '700',
        gap: '1rem',
        small: { height: '2rem', fontSize: '1rem', paddingInline: '1rem' },
        medium: { height: '3rem', fontSize: '1rem', paddingInline: '1rem' },
        large: { height: '4rem', fontSize: '1rem', paddingInline: '1rem' },
      },
    };
    const resolvedButton: Required<BuludButtonTheme> =
      resolveBuludTheme(legacyTheme).button;

    expect(provideBuludTheme(legacyTheme)).toBeDefined();
    expect<BuludButtonTheme>(resolvedButton).toEqual({
      ...BULUD_DEFAULT_THEME.button,
      ...optionalButtonDefaults,
      ...legacyTheme.button,
    });
  });

  it('keeps checkbox optional for legacy consumer theme objects', () => {
    const { checkbox, ...legacyShape } = BULUD_DEFAULT_THEME;
    const legacyTheme: BuludTheme = legacyShape;

    expect(checkbox).toBeDefined();
    expect(legacyTheme.checkbox).toBeUndefined();
    expect(resolveBuludTheme(legacyTheme).checkbox).toEqual(
      resolveBuludTheme().checkbox,
    );
  });

  it('resolves checkbox focus geometry defaults and configured values', () => {
    expect(resolveBuludTheme().checkbox.focusWidth).toBe('3px');
    expect(resolveBuludTheme().checkbox.focusOffset).toBe('2px');
    expect(resolveBuludTheme().checkbox.gap).toBe('0.625rem');

    const variables = createBuludThemeVariables({
      checkbox: { focusWidth: '4px', focusOffset: '6px', gap: '1rem' },
    });

    expect(variables['--bulud-checkbox-focus-width']).toBe('4px');
    expect(variables['--bulud-checkbox-focus-offset']).toBe('6px');
    expect(variables['--bulud-checkbox-gap']).toBe('1rem');
  });

  it('provides concrete defaults through the injection token factory', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const button: Required<BuludButtonTheme> =
      TestBed.inject(BULUD_THEME).button;

    expect<BuludButtonTheme>(button).not.toBe(BULUD_DEFAULT_THEME.button);
    expect(button.borderWidth).toBe('1px');
    expect(button.focusWidth).toBe('3px');
    expect(button.focusOffset).toBe('2px');
    expect(button.ghostBackground).toBe('transparent');
  });

  it('uses concrete defaults for explicitly undefined optional button tokens', () => {
    const button: Required<BuludButtonTheme> = resolveBuludTheme({
      button: {
        borderWidth: undefined,
        focusWidth: undefined,
        focusOffset: undefined,
        ghostBackground: undefined,
      },
    }).button;

    expect<BuludButtonTheme>(button).toEqual({
      ...BULUD_DEFAULT_THEME.button,
      ...optionalButtonDefaults,
    });
  });

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
      tabs: {
        activeBorder: '#7c3aed',
      },
      accordion: {
        hoverBackground: '#ede9fe',
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
    expect(theme.tabs.activeBorder).toBe('#7c3aed');
    expect(theme.tabs.foreground).toBe(BULUD_DEFAULT_THEME.tabs.foreground);
    expect(theme.accordion.hoverBackground).toBe('#ede9fe');
    expect(theme.accordion.focus).toBe(BULUD_DEFAULT_THEME.accordion.focus);
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
      tabs: {
        activeBorder: '#7c3aed',
      },
      accordion: {
        icon: '#7c3aed',
      },
    });

    expect(variables['--bulud-color-primary']).toBe('#7c3aed');
    expect(variables['--bulud-radius-control']).toBe('0.75rem');
    expect(variables['--bulud-dropdown-border']).toBe('#f97316');
    expect(variables['--bulud-badge-danger-foreground']).toBe('#881337');
    expect(variables['--bulud-tabs-active-border']).toBe('#7c3aed');
    expect(variables['--bulud-accordion-icon']).toBe('#7c3aed');
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
          tabs: {
            activeBorder: '#7c3aed',
          },
        }),
      ],
      parentInjector,
    );

    try {
      expect(environmentInjector.get(BULUD_THEME).colors.primary).toBe(
        '#7c3aed',
      );
      expect(environmentInjector.get(BULUD_THEME).tabs.activeBorder).toBe(
        '#7c3aed',
      );
      expect(
        document.defaultView
          ?.getComputedStyle(document.documentElement)
          .getPropertyValue('--bulud-color-primary'),
      ).toBe('#7c3aed');
      expect(
        document.defaultView
          ?.getComputedStyle(document.documentElement)
          .getPropertyValue('--bulud-tabs-active-border'),
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

  it('keeps a tabs instance custom property above global theme values', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const document = TestBed.inject(DOCUMENT);
    const root = document.documentElement;
    root.style.setProperty('--bulud-tabs-active-border', '#f97316');

    const instance = document.createElement('bulud-tabs');
    instance.style.setProperty('--bulud-tabs-active-border', '#22c55e');
    root.append(instance);

    try {
      expect(
        instance.style.getPropertyValue('--bulud-tabs-active-border'),
      ).toBe('#22c55e');
      expect(root.style.getPropertyValue('--bulud-tabs-active-border')).toBe(
        '#f97316',
      );
    } finally {
      instance.remove();
      root.style.removeProperty('--bulud-tabs-active-border');
    }
  });

  it('resolves accordion theme from defaults through global and instance overrides', () => {
    expect(resolveBuludTheme().accordion.icon).toBe(
      BULUD_DEFAULT_THEME.accordion.icon,
    );

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
          accordion: {
            icon: '#7c3aed',
          },
        }),
      ],
      parentInjector,
    );
    const instance = document.createElement('bulud-accordion');
    instance.style.setProperty('--bulud-accordion-icon', '#22c55e');
    document.body.append(instance);

    try {
      expect(environmentInjector.get(BULUD_THEME).accordion.icon).toBe(
        '#7c3aed',
      );
      expect(
        document.defaultView
          ?.getComputedStyle(instance)
          .getPropertyValue('--bulud-accordion-icon'),
      ).toBe('#22c55e');
    } finally {
      instance.remove();
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

  for (const darkMode of [
    {
      name: ':root.dark',
      apply: (root: HTMLElement) => root.classList.add('dark'),
      remove: (root: HTMLElement) => root.classList.remove('dark'),
    },
    {
      name: ":root[data-theme='dark']",
      apply: (root: HTMLElement) => root.setAttribute('data-theme', 'dark'),
      remove: (root: HTMLElement) => root.removeAttribute('data-theme'),
    },
  ]) {
    it(`keeps custom badge geometry available in ${darkMode.name}`, () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });

      const parentInjector = TestBed.inject(EnvironmentInjector);
      const document = TestBed.inject(DOCUMENT);
      const root = document.documentElement;
      const existingStyle = document.head.querySelector(
        'style[data-bulud-theme]',
      );
      const originalStyleText = existingStyle?.textContent ?? null;
      const environmentInjector = createEnvironmentInjector(
        [
          provideBuludTheme({
            colors: { primary: '#7c3aed' },
            badge: {
              heightSmall: '3.25rem',
              fontSizeMedium: '1.125rem',
            },
            checkbox: {
              size: '2rem',
              radius: '0.75rem',
              disabledOpacity: '0.3',
              focusWidth: '4px',
              focusOffset: '6px',
              gap: '1rem',
            },
          }),
        ],
        parentInjector,
      );

      darkMode.apply(root);

      try {
        const styleText = document.head.querySelector(
          'style[data-bulud-theme]',
        )?.textContent;

        expect(styleText).toContain(':root {');
        expect(styleText).toContain('--bulud-badge-height-small: 3.25rem;');
        expect(styleText).toContain('--bulud-checkbox-size: 2rem;');
        expect(styleText).toContain('--bulud-checkbox-radius: 0.75rem;');
        expect(styleText).toContain('--bulud-checkbox-disabled-opacity: 0.3;');
        expect(styleText).toContain('--bulud-checkbox-focus-width: 4px;');
        expect(styleText).toContain('--bulud-checkbox-focus-offset: 6px;');
        expect(styleText).toContain('--bulud-checkbox-gap: 1rem;');
        expect(styleText).toContain(
          '--bulud-badge-font-size-medium: 1.125rem;',
        );
        expect(styleText).toContain(
          ":root:not(.dark):not([data-theme='dark'])",
        );
        expect(styleText).toContain('--bulud-color-primary: #7c3aed;');
        expect(
          document.defaultView
            ?.getComputedStyle(root)
            .getPropertyValue('--bulud-badge-height-small'),
        ).toBe('3.25rem');
        expect(
          document.defaultView
            ?.getComputedStyle(root)
            .getPropertyValue('--bulud-badge-font-size-medium'),
        ).toBe('1.125rem');
        expect(
          document.defaultView
            ?.getComputedStyle(root)
            .getPropertyValue('--bulud-checkbox-size'),
        ).toBe('2rem');
        expect(
          document.defaultView
            ?.getComputedStyle(root)
            .getPropertyValue('--bulud-checkbox-radius'),
        ).toBe('0.75rem');
        expect(
          document.defaultView
            ?.getComputedStyle(root)
            .getPropertyValue('--bulud-checkbox-disabled-opacity'),
        ).toBe('0.3');
        expect(
          document.defaultView
            ?.getComputedStyle(root)
            .getPropertyValue('--bulud-checkbox-focus-width'),
        ).toBe('4px');
        expect(
          document.defaultView
            ?.getComputedStyle(root)
            .getPropertyValue('--bulud-checkbox-focus-offset'),
        ).toBe('6px');
        expect(
          document.defaultView
            ?.getComputedStyle(root)
            .getPropertyValue('--bulud-checkbox-gap'),
        ).toBe('1rem');
        expect(
          document.defaultView
            ?.getComputedStyle(root)
            .getPropertyValue('--bulud-color-primary'),
        ).not.toBe('#7c3aed');
      } finally {
        darkMode.remove(root);
        environmentInjector.destroy();

        if (existingStyle) {
          existingStyle.textContent = originalStyleText;
        } else {
          document.head.querySelector('style[data-bulud-theme]')?.remove();
        }
      }
    });
  }

  it('preserves consumer root checkbox variables when provider options are omitted', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const parentInjector = TestBed.inject(EnvironmentInjector);
    const document = TestBed.inject(DOCUMENT);
    const root = document.documentElement;
    const existingStyle = document.head.querySelector(
      'style[data-bulud-theme]',
    );
    const originalStyleText = existingStyle?.textContent ?? null;
    root.style.setProperty('--bulud-checkbox-size', '3rem');

    const environmentInjector = createEnvironmentInjector(
      [provideBuludTheme()],
      parentInjector,
    );

    try {
      expect(
        document.head.querySelector('style[data-bulud-theme]')?.textContent,
      ).not.toContain('--bulud-checkbox-size:');
      expect(
        document.head.querySelector('style[data-bulud-theme]')?.textContent,
      ).not.toContain('--bulud-checkbox-focus-width:');
      expect(
        document.head.querySelector('style[data-bulud-theme]')?.textContent,
      ).not.toContain('--bulud-checkbox-gap:');
      expect(
        document.defaultView
          ?.getComputedStyle(root)
          .getPropertyValue('--bulud-checkbox-size'),
      ).toBe('3rem');
    } finally {
      root.style.removeProperty('--bulud-checkbox-size');
      environmentInjector.destroy();
      if (existingStyle) {
        existingStyle.textContent = originalStyleText;
      } else {
        document.head.querySelector('style[data-bulud-theme]')?.remove();
      }
    }
  });

  it('emits explicitly configured checkbox variables with provider precedence', () => {
    const variables = createBuludThemeVariables({
      checkbox: { size: '2rem', gap: '1rem' },
    });

    expect(variables['--bulud-checkbox-size']).toBe('2rem');
    expect(variables['--bulud-checkbox-gap']).toBe('1rem');
    expect(createBuludThemeVariables()['--bulud-checkbox-size']).toBe(
      resolveBuludTheme().checkbox.size,
    );
  });
});
