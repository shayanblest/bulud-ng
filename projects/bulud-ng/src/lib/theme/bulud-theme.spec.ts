import {
  createEnvironmentInjector,
  DOCUMENT,
  EnvironmentInjector,
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

  it('creates variables shared by components and Tailwind', () => {
    const variables = createBuludThemeVariables({
      colors: {
        primary: '#7c3aed',
      },
      shape: {
        controlRadius: '0.75rem',
      },
    });

    expect(variables['--bulud-color-primary']).toBe('#7c3aed');
    expect(variables['--bulud-radius-control']).toBe('0.75rem');
    expect(variables['--bulud-color-danger']).toBe(
      BULUD_DEFAULT_THEME.colors.danger,
    );
  });

  it('provides and applies the resolved theme at environment startup', () => {
    TestBed.configureTestingModule({});

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const document = TestBed.inject(DOCUMENT);
    const properties = Object.keys(createBuludThemeVariables());
    const originalValues = new Map(
      properties.map((property) => [
        property,
        document.documentElement.style.getPropertyValue(property),
      ]),
    );
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
        document.documentElement.style.getPropertyValue(
          '--bulud-color-primary',
        ),
      ).toBe('#7c3aed');
    } finally {
      environmentInjector.destroy();

      for (const [property, value] of originalValues) {
        if (value) {
          document.documentElement.style.setProperty(property, value);
        } else {
          document.documentElement.style.removeProperty(property);
        }
      }
    }
  });
});
