import {
  ChangeDetectionStrategy,
  Component,
  createEnvironmentInjector,
  EnvironmentInjector,
  provideZonelessChangeDetection,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  BuludButton,
  BuludButtonSize,
  BuludButtonVariant,
} from '../../../button/bulud-button/bulud-button';
import {
  BuludBadge,
  BuludBadgeVariant,
} from '../../../badge/bulud-badge/bulud-badge';
import { BuludDropdown } from '../../../dropdown/bulud-dropdown/bulud-dropdown';
import {
  BuludTab,
  BuludTabPanel,
  BuludTabs,
} from '../../../tabs/bulud-tabs/bulud-tabs';
import {
  BuludBadgeTheme,
  BuludBadgeVariantTheme,
  BuludColorTheme,
  BuludDropdownTheme,
  BuludTabsTheme,
  BuludThemeConfig,
  BuludThemeCssVariable,
  provideBuludTheme,
} from './bulud-theme';
import { activateStateStyle } from './theme-test-helpers';

@Component({
  imports: [
    BuludButton,
    BuludBadge,
    BuludDropdown,
    BuludTabs,
    BuludTab,
    BuludTabPanel,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <bulud-button
      [variant]="buttonVariant()"
      [size]="buttonSize()"
      [disabled]="buttonDisabled()"
      >Save</bulud-button
    >
    <bulud-badge [variant]="badgeVariant()" dot dismissible
      >Published</bulud-badge
    >
    <bulud-dropdown
      aria-label="Choose frameworks"
      multiple
      searchable
      [options]="options"
      [formControl]="control"
      [loading]="loading()"
    />
    <bulud-tabs aria-label="Sections">
      <button type="button" buludTab="overview">Overview</button>
      <button type="button" buludTab="details">Details</button>
      <button type="button" buludTab="disabled" disabled>Disabled</button>
      <section buludTabPanel="overview">Overview content</section>
      <section buludTabPanel="details">Details content</section>
    </bulud-tabs>
  `,
})
class ThemeHost {
  readonly buttonVariant = signal<BuludButtonVariant>('primary');
  readonly buttonSize = signal<BuludButtonSize>('medium');
  readonly buttonDisabled = signal(false);
  readonly badgeVariant = signal<BuludBadgeVariant>('success');
  readonly options = ['Angular', 'React'];
  readonly control = new FormControl<readonly string[]>([], {
    nonNullable: true,
  });
  readonly loading = signal(false);
}

@Component({
  template: '',
  styleUrl: '../../../theme.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ShippedThemeStyles {}

type Feature = 'button' | 'badge' | 'dropdown' | 'tabs';
interface ThemeCase {
  readonly feature: Feature;
  readonly variable: BuludThemeCssVariable;
  readonly selector: string;
  readonly property: string;
  readonly fallback: string;
  readonly values: readonly [string, string, string];
  readonly config?: (value: string) => BuludThemeConfig;
  readonly setup?: (host: ThemeHost) => void;
  readonly state?: 'hover' | 'active' | 'focus';
  readonly open?: boolean;
}

const colors = [
  'rgb(18, 52, 86)',
  'rgb(35, 69, 103)',
  'rgb(52, 86, 120)',
] as const;
const lengths = ['20px', '21px', '22px'] as const;
const cases: ThemeCase[] = [];

// The existing Button spec covers borderWidth, focusWidth, focusOffset and
// ghostBackground; the Badge spec covers all twenty geometry hooks.
for (const [field, property, fallback, values] of [
  ['disabledOpacity', 'opacity', '0.55', ['0.6', '0.7', '0.8']],
  ['fontWeight', 'font-weight', '600', ['700', '800', '900']],
  ['gap', 'column-gap', '8px', lengths],
] as const) {
  cases.push({
    feature: 'button',
    variable: `--bulud-button-${field === 'disabledOpacity' ? 'disabled-opacity' : field === 'fontWeight' ? 'font-weight' : field}`,
    selector: 'button',
    property,
    fallback,
    values,
    config: (value) => ({ button: { [field]: value } }),
    setup: (host) => host.buttonDisabled.set(field === 'disabledOpacity'),
  });
}
for (const [size, defaults] of [
  ['small', ['32px', '13px', '12px']],
  ['medium', ['40px', '14px', '16px']],
  ['large', ['48px', '16px', '20px']],
] as const) {
  for (const [index, field, suffix, property] of [
    [0, 'height', 'height', 'height'],
    [1, 'fontSize', 'font-size', 'font-size'],
    [2, 'paddingInline', 'padding-inline', 'padding-inline-start'],
  ] as const) {
    cases.push({
      feature: 'button',
      variable: `--bulud-button-${suffix}-${size}`,
      selector: 'button',
      property,
      fallback: defaults[index],
      values: lengths,
      config: (value) => ({ button: { [size]: { [field]: value } } }),
      setup: (host) => host.buttonSize.set(size),
    });
  }
}
const buttonColors: readonly (readonly [
  BuludButtonVariant,
  string,
  keyof BuludColorTheme,
  string,
  string,
  ThemeCase['state']?,
])[] = [
  ['primary', 'background', 'primary', 'background-color', 'rgb(37, 99, 235)'],
  [
    'primary',
    'background-hover',
    'primaryHover',
    'background-color',
    'rgb(29, 78, 216)',
    'hover',
  ],
  [
    'primary',
    'background-active',
    'primaryActive',
    'background-color',
    'rgb(30, 64, 175)',
    'active',
  ],
  ['primary', 'foreground', 'onPrimary', 'color', 'rgb(255, 255, 255)'],
  [
    'primary',
    'focus-ring',
    'focus',
    'outline-color',
    'rgb(147, 197, 253)',
    'focus',
  ],
  [
    'secondary',
    'background',
    'surface',
    'background-color',
    'rgb(255, 255, 255)',
  ],
  [
    'secondary',
    'background-hover',
    'surfaceHover',
    'background-color',
    'rgb(248, 250, 252)',
    'hover',
  ],
  [
    'secondary',
    'background-active',
    'surfaceActive',
    'background-color',
    'rgb(241, 245, 249)',
    'active',
  ],
  ['secondary', 'border', 'border', 'border-top-color', 'rgb(203, 213, 225)'],
  ['secondary', 'foreground', 'onSurface', 'color', 'rgb(15, 23, 42)'],
  ['danger', 'background', 'danger', 'background-color', 'rgb(220, 38, 38)'],
  [
    'danger',
    'background-hover',
    'dangerHover',
    'background-color',
    'rgb(185, 28, 28)',
    'hover',
  ],
  [
    'danger',
    'background-active',
    'dangerActive',
    'background-color',
    'rgb(153, 27, 27)',
    'active',
  ],
  ['danger', 'foreground', 'onDanger', 'color', 'rgb(255, 255, 255)'],
  [
    'danger',
    'focus-ring',
    'dangerFocus',
    'outline-color',
    'rgb(252, 165, 165)',
    'focus',
  ],
  [
    'ghost',
    'background-hover',
    'surfaceHover',
    'background-color',
    'rgb(241, 245, 249)',
    'hover',
  ],
  [
    'ghost',
    'background-active',
    'surfaceActive',
    'background-color',
    'rgb(226, 232, 240)',
    'active',
  ],
  ['ghost', 'foreground', 'onSurface', 'color', 'rgb(15, 23, 42)'],
];
for (const [
  variant,
  suffix,
  field,
  property,
  fallback,
  state,
] of buttonColors) {
  cases.push({
    feature: 'button',
    variable: `--bulud-button-${variant === 'primary' ? '' : `${variant}-`}${suffix}`,
    selector: 'button',
    property,
    fallback,
    values: colors,
    state,
    config: (value) => ({ colors: { [field]: value } }),
    setup: (host) => host.buttonVariant.set(variant),
  });
}
cases.push(
  {
    feature: 'button',
    variable: '--bulud-button-radius',
    selector: 'button',
    property: 'border-top-left-radius',
    fallback: '8px',
    values: lengths,
    config: (value) => ({ shape: { controlRadius: value } }),
  },
  // The primary border is a CSS-only hook with a transparent fallback. There
  // is no typed provider field for it, unlike the secondary border.
  {
    feature: 'button',
    variable: '--bulud-button-border',
    selector: 'button',
    property: 'border-top-color',
    fallback: 'rgba(0, 0, 0, 0)',
    values: colors,
  },
);

for (const variant of [
  'neutral',
  'primary',
  'success',
  'warning',
  'danger',
] as const) {
  const defaults = {
    neutral: ['rgb(248, 250, 252)', 'rgb(203, 213, 225)', 'rgb(30, 41, 59)'],
    primary: ['rgb(239, 246, 255)', 'rgb(191, 219, 254)', 'rgb(29, 78, 216)'],
    success: ['rgb(220, 252, 231)', 'rgb(187, 247, 208)', 'rgb(21, 128, 61)'],
    warning: ['rgb(254, 243, 199)', 'rgb(253, 230, 138)', 'rgb(161, 98, 7)'],
    danger: ['rgb(255, 228, 230)', 'rgb(254, 205, 211)', 'rgb(190, 18, 60)'],
  } as const;
  const fields: readonly (readonly [keyof BuludBadgeVariantTheme, string])[] = [
    ['background', 'background-color'],
    ['border', 'border-top-color'],
    ['foreground', 'color'],
  ];
  fields.forEach(([field, property], index) =>
    cases.push({
      feature: 'badge',
      variable: `--bulud-badge-${variant}-${field}`,
      selector: '.bulud-badge',
      property,
      fallback: defaults[variant][index],
      values: colors,
      config: (value) => ({ badge: { [variant]: { [field]: value } } }),
      setup: (host) => host.badgeVariant.set(variant),
    }),
  );
}
const badgeFields: readonly (readonly [
  keyof BuludBadgeTheme,
  string,
  string,
  string,
  ThemeCase['state']?,
  ThemeCase['values']?,
])[] = [
  [
    'radius',
    '.bulud-badge',
    'border-top-left-radius',
    '999px',
    undefined,
    lengths,
  ],
  [
    'fontWeight',
    '.bulud-badge',
    'font-weight',
    '500',
    undefined,
    ['700', '800', '900'],
  ],
  [
    'dismissHoverBackground',
    'button',
    'background-color',
    'rgba(15, 23, 42, 0.1)',
    'hover',
  ],
  ['focus', 'button', 'outline-color', 'rgb(21, 128, 61)', 'focus'],
];
for (const [
  field,
  selector,
  property,
  fallback,
  state,
  values = colors,
] of badgeFields) {
  const suffix = field.replace(
    /[A-Z]/g,
    (letter) => `-${letter.toLowerCase()}`,
  );
  cases.push({
    feature: 'badge',
    variable: `--bulud-badge-${suffix}`,
    selector,
    property,
    fallback,
    values,
    state,
    config: (value) => ({ badge: { [field]: value } }),
  });
}

const dropdownFields: readonly (readonly [
  keyof BuludDropdownTheme,
  string,
  string,
  string,
  ThemeCase['state']?,
])[] = [
  [
    'background',
    '.bulud-dropdown__trigger',
    'background-color',
    'rgb(255, 255, 255)',
  ],
  [
    'border',
    '.bulud-dropdown__trigger',
    'border-top-color',
    'rgb(203, 213, 225)',
  ],
  [
    'invalidBorder',
    '.bulud-dropdown__trigger',
    'border-top-color',
    'rgb(220, 38, 38)',
  ],
  [
    'borderHover',
    '.bulud-dropdown__trigger',
    'border-top-color',
    'rgb(37, 99, 235)',
    'hover',
  ],
  ['foreground', '.bulud-dropdown__trigger', 'color', 'rgb(15, 23, 42)'],
  [
    'focus',
    '.bulud-dropdown__trigger',
    'outline-color',
    'rgb(147, 197, 253)',
    'focus',
  ],
  [
    'placeholder',
    '.bulud-dropdown__placeholder',
    'color',
    'rgb(100, 116, 139)',
  ],
  ['clearForeground', '.bulud-dropdown__clear', 'color', 'rgb(148, 163, 184)'],
  [
    'clearHoverBackground',
    '.bulud-dropdown__clear',
    'background-color',
    'rgb(241, 245, 249)',
    'hover',
  ],
  [
    'clearHoverForeground',
    '.bulud-dropdown__clear',
    'color',
    'rgb(51, 65, 85)',
    'hover',
  ],
  [
    'panelBackground',
    '.bulud-dropdown__panel',
    'background-color',
    'rgb(255, 255, 255)',
  ],
  [
    'searchBorder',
    '.bulud-dropdown__search',
    'border-bottom-color',
    'rgb(226, 232, 240)',
  ],
  ['searchIcon', '.bulud-dropdown__search-icon', 'color', 'rgb(100, 116, 139)'],
  [
    'optionForeground',
    '.bulud-dropdown__option:last-child',
    'color',
    'rgb(15, 23, 42)',
  ],
  [
    'optionHoverBackground',
    '.bulud-dropdown__option:first-child',
    'background-color',
    'rgb(239, 246, 255)',
  ],
  [
    'optionSelectedForeground',
    '.bulud-dropdown__option:first-child',
    'color',
    'rgb(29, 78, 216)',
  ],
  [
    'optionBorder',
    '.bulud-dropdown__option:last-child .bulud-dropdown__check',
    'border-top-color',
    'rgb(203, 213, 225)',
  ],
  [
    'optionSelectedBackground',
    '.bulud-dropdown__check--selected',
    'background-color',
    'rgb(37, 99, 235)',
  ],
  [
    'messageForeground',
    '.bulud-dropdown__message',
    'color',
    'rgb(100, 116, 139)',
  ],
  ['disabledOpacity', '.bulud-dropdown__trigger', 'opacity', '0.55'],
  ['radius', '.bulud-dropdown__trigger', 'border-top-left-radius', '8px'],
  [
    'shadow',
    '.bulud-dropdown__panel',
    'box-shadow',
    'rgba(15, 23, 42, 0.16) 0px 16px 40px 0px',
  ],
];
for (const [field, selector, property, fallback, state] of dropdownFields) {
  const suffix = field.replace(
    /[A-Z]/g,
    (letter) => `-${letter.toLowerCase()}`,
  );
  const values =
    field === 'disabledOpacity'
      ? (['0.6', '0.7', '0.8'] as const)
      : field === 'radius'
        ? lengths
        : field === 'shadow'
          ? ([
              'rgb(18, 52, 86) 1px 2px 3px 0px',
              'rgb(35, 69, 103) 2px 3px 4px 0px',
              'rgb(52, 86, 120) 3px 4px 5px 0px',
            ] as const)
          : colors;
  cases.push({
    feature: 'dropdown',
    variable: `--bulud-dropdown-${suffix}`,
    selector,
    property,
    fallback,
    values,
    state,
    config: (value) => ({ dropdown: { [field]: value } }),
    open:
      selector !== '.bulud-dropdown__trigger' &&
      selector !== '.bulud-dropdown__placeholder' &&
      !selector.startsWith('.bulud-dropdown__clear'),
    setup: (host) => {
      if (
        selector.startsWith('.bulud-dropdown__clear') ||
        field === 'optionSelectedBackground'
      )
        host.control.setValue(['Angular']);
      if (field === 'disabledOpacity') host.control.disable();
      if (field === 'messageForeground') host.loading.set(true);
      if (field === 'invalidBorder') {
        host.control.addValidators(Validators.required);
        host.control.markAsTouched();
        host.control.updateValueAndValidity();
      }
    },
  });
}

const tabsFields: readonly (readonly [
  keyof BuludTabsTheme,
  string,
  string,
  string,
  ThemeCase['state']?,
])[] = [
  ['background', '.bulud-tabs', 'background-color', 'rgb(255, 255, 255)'],
  ['border', '.bulud-tabs', 'border-top-color', 'rgb(203, 213, 225)'],
  ['foreground', '[buludTab="details"]', 'color', 'rgb(71, 85, 105)'],
  ['activeForeground', '[buludTab="overview"]', 'color', 'rgb(29, 78, 216)'],
  [
    'hoverBackground',
    '[buludTab="details"]',
    'background-color',
    'rgb(239, 246, 255)',
    'hover',
  ],
  [
    'activeBorder',
    '[buludTab="overview"]',
    'border-bottom-color',
    'rgb(37, 99, 235)',
  ],
  [
    'panelBackground',
    '.bulud-tabs__panels',
    'background-color',
    'rgb(255, 255, 255)',
  ],
  ['disabledOpacity', '[buludTab="disabled"]', 'opacity', '0.55'],
  ['radius', '.bulud-tabs', 'border-top-left-radius', '8px'],
  ['gap', '.bulud-tabs__list', 'column-gap', '4px'],
  [
    'focus',
    '[buludTab="overview"]',
    'outline-color',
    'rgb(147, 197, 253)',
    'focus',
  ],
];
for (const [field, selector, property, fallback, state] of tabsFields) {
  const suffix = field.replace(
    /[A-Z]/g,
    (letter) => `-${letter.toLowerCase()}`,
  );
  cases.push({
    feature: 'tabs',
    variable: `--bulud-tabs-${suffix}`,
    selector,
    property,
    fallback,
    state,
    values:
      field === 'disabledOpacity'
        ? ['0.6', '0.7', '0.8']
        : field === 'radius' || field === 'gap'
          ? lengths
          : colors,
    config: (value) => ({ tabs: { [field]: value } }),
  });
}

describe('Existing component theme precedence', () => {
  for (const token of cases) {
    it(`resolves ${token.variable} through library, ${token.config ? 'global, ' : ''}component scope and instance`, async () => {
      await TestBed.configureTestingModule({
        imports: [ThemeHost, ShippedThemeStyles],
        providers: [provideZonelessChangeDetection()],
      }).compileComponents();
      const previous = document.head.querySelector('style[data-bulud-theme]');
      const previousText = previous?.textContent ?? null;
      if (previous) previous.textContent = '';
      const defaults =
        token.feature === 'tabs'
          ? TestBed.createComponent(ShippedThemeStyles)
          : undefined;
      const fixture = TestBed.createComponent(ThemeHost);
      const injectors: EnvironmentInjector[] = [];
      let restoreState = () => {};
      const provide = (config: BuludThemeConfig) =>
        injectors.push(
          createEnvironmentInjector(
            [provideBuludTheme(config)],
            TestBed.inject(EnvironmentInjector),
          ),
        );
      try {
        token.setup?.(fixture.componentInstance);
        await fixture.whenStable();
        const scope: HTMLElement = fixture.nativeElement;
        const host = scope.querySelector<HTMLElement>(
          `bulud-${token.feature}`,
        )!;
        if (token.open) {
          host
            .querySelector<HTMLButtonElement>('.bulud-dropdown__trigger')!
            .click();
          await fixture.whenStable();
        }
        const target = host.querySelector<HTMLElement>(token.selector)!;
        expect(target).not.toBeNull();
        target.style.transition = 'none';
        if (token.state === 'focus') {
          target.focus();
          expect(document.activeElement).toBe(target);
          restoreState = activateStateStyle(target, 'focus-visible');
        } else if (token.state) {
          restoreState = activateStateStyle(target, token.state);
        }
        const value = () =>
          getComputedStyle(target).getPropertyValue(token.property);
        expect(value())
          .withContext('library default without provider')
          .toBe(token.fallback);
        const [global, component, instance] = token.values;
        if (token.config) {
          provide(token.config(global));
          expect(value())
            .withContext('global provider overrides library')
            .toBe(global);
        }
        scope.style.setProperty(token.variable, component);
        expect(value())
          .withContext('component scope overrides global')
          .toBe(component);
        host.style.setProperty(token.variable, instance);
        expect(value())
          .withContext('instance overrides component scope')
          .toBe(instance);
        host.style.removeProperty(token.variable);
        expect(value())
          .withContext('removing instance reveals component scope')
          .toBe(component);
        scope.style.removeProperty(token.variable);
        expect(value())
          .withContext('removing component scope reveals global')
          .toBe(token.config ? global : token.fallback);
        if (token.config) {
          provide({});
          // Ghost hover/active have different literal CSS fallbacks from the
          // shared color defaults emitted by an empty provider configuration.
          const providerDefault =
            token.variable === '--bulud-button-ghost-background-hover'
              ? 'rgb(248, 250, 252)'
              : token.variable === '--bulud-button-ghost-background-active'
                ? 'rgb(241, 245, 249)'
                : token.fallback;
          expect(value())
            .withContext('omitted provider override resolves library default')
            .toBe(providerDefault);
        }
        document.head.querySelector('style[data-bulud-theme]')?.remove();
        expect(value())
          .withContext('removing provider reveals CSS library default')
          .toBe(token.fallback);
      } finally {
        restoreState();
        injectors.forEach((injector) => injector.destroy());
        fixture.destroy();
        defaults?.destroy();
        document.head.querySelector('style[data-bulud-theme]')?.remove();
        if (previous) {
          previous.textContent = previousText;
          document.head.append(previous);
        }
      }
    });
  }
});
