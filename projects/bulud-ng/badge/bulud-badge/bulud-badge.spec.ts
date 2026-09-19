import {
  Component,
  createEnvironmentInjector,
  EnvironmentInjector,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  BULUD_DEFAULT_THEME,
  BuludBadgeTheme,
  createBuludThemeVariables,
  resolveBuludTheme,
  provideBuludTheme,
} from '../../src/lib/theme/bulud-theme';
import { BuludBadge } from './bulud-badge';

@Component({
  standalone: true,
  imports: [BuludBadge],
  template: `
    <bulud-badge
      [variant]="variant()"
      [size]="size()"
      [dot]="dot()"
      [dismissible]="dismissible()"
      [dismissLabel]="dismissLabel()"
      (dismissed)="dismissed = true"
    >
      Published
    </bulud-badge>
  `,
})
class HostComponent {
  dismissed = false;
  readonly variant = signal<
    'neutral' | 'primary' | 'success' | 'warning' | 'danger'
  >('success');
  readonly size = signal<'small' | 'medium' | 'large'>('medium');
  readonly dot = signal(true);
  readonly dismissible = signal(true);
  readonly dismissLabel = signal('Remove badge');
}

describe('BuludBadge', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
  });

  it('renders projected content and a status dot', () => {
    expect(fixture.nativeElement.textContent).toContain('Published');
    expect(
      fixture.nativeElement.querySelector('.bulud-badge__dot'),
    ).not.toBeNull();
  });

  it('emits when dismissed', () => {
    fixture.nativeElement.querySelector('.bulud-badge__dismiss').click();
    expect(fixture.componentInstance.dismissed).toBeTrue();
  });

  it('renders every supported variant and size reactively', async () => {
    for (const variant of [
      'neutral',
      'primary',
      'success',
      'warning',
      'danger',
    ] as const) {
      for (const size of ['small', 'medium', 'large'] as const) {
        fixture.componentInstance.variant.set(variant);
        fixture.componentInstance.size.set(size);
        await fixture.whenStable();
        const badge = fixture.nativeElement.querySelector('.bulud-badge');
        expect(badge.classList).toContain(`bulud-badge--${variant}`);
        expect(badge.classList).toContain(`bulud-badge--${size}`);
      }
    }
  });

  it('exposes a custom accessible dismiss name and hides the action when disabled', async () => {
    fixture.componentInstance.dismissLabel.set('Remove published badge');
    await fixture.whenStable();
    expect(
      fixture.nativeElement
        .querySelector('.bulud-badge__dismiss')
        ?.getAttribute('aria-label'),
    ).toBe('Remove published badge');

    fixture.componentInstance.dismissible.set(false);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('.bulud-badge__dismiss'),
    ).toBeNull();
  });
  it('uses passive text semantics and a native non-submit dismiss action', () => {
    const host: HTMLElement = fixture.nativeElement;
    const badge = host.querySelector('.bulud-badge')!;
    const button = host.querySelector('button')!;
    expect(badge.tagName).toBe('SPAN');
    expect(badge.hasAttribute('role')).toBeFalse();
    expect(badge.hasAttribute('tabindex')).toBeFalse();
    expect(button.type).toBe('button');
    expect(button.querySelector('svg')!.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(
      host.querySelector('.bulud-badge__dot')!.getAttribute('aria-hidden'),
    ).toBe('true');
    const bubbled = jasmine.createSpy('parent click');
    host.addEventListener('click', bubbled);
    button.click();
    expect(bubbled).not.toHaveBeenCalled();
    expect(host.querySelector('button')).toBe(button);
  });

  it('keeps a nonempty dismiss name and updates the decorative dot reactively', async () => {
    fixture.componentInstance.dismissLabel.set('  ');
    fixture.componentInstance.dot.set(false);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('button').getAttribute('aria-label'),
    ).toBe('Remove badge');
    expect(fixture.nativeElement.querySelector('.bulud-badge__dot')).toBeNull();
  });

  it('renders every dot in its variant foreground', async () => {
    for (const variant of [
      'neutral',
      'primary',
      'success',
      'warning',
      'danger',
    ] as const) {
      fixture.componentInstance.variant.set(variant);
      await fixture.whenStable();
      const dot: HTMLElement =
        fixture.nativeElement.querySelector('.bulud-badge__dot');
      expect(getComputedStyle(dot).backgroundColor).toBe(
        getComputedStyle(dot).color,
      );
    }
  });

  it('resolves library, typed global, scoped component and instance theme precedence', () => {
    const host: HTMLElement =
      fixture.nativeElement.querySelector('bulud-badge');
    const badge = host.querySelector('.bulud-badge')!;
    const original = document.head.querySelector(
      'style[data-bulud-theme]',
    )?.textContent;
    const injector = createEnvironmentInjector(
      [
        provideBuludTheme({
          badge: { success: { background: '#123456' }, fontWeight: '700' },
        }),
      ],
      TestBed.inject(EnvironmentInjector),
    );
    try {
      expect(getComputedStyle(badge).backgroundColor).toBe('rgb(18, 52, 86)');
      expect(getComputedStyle(badge).fontWeight).toBe('700');
      expect(getComputedStyle(badge).color).toBe('rgb(21, 128, 61)');
      const scope: HTMLElement = fixture.nativeElement;
      scope.style.setProperty('--bulud-badge-success-background', '#234567');
      expect(getComputedStyle(badge).backgroundColor).toBe('rgb(35, 69, 103)');
      host.style.setProperty('--bulud-badge-success-background', '#345678');
      expect(getComputedStyle(badge).backgroundColor).toBe('rgb(52, 86, 120)');
      host.style.removeProperty('--bulud-badge-success-background');
      scope.style.removeProperty('--bulud-badge-success-background');
      expect(getComputedStyle(badge).backgroundColor).toBe('rgb(18, 52, 86)');
      document.head.querySelector('style[data-bulud-theme]')!.textContent = '';
      expect(getComputedStyle(badge).backgroundColor).toBe(
        'rgb(220, 252, 231)',
      );
    } finally {
      injector.destroy();
      const style = document.head.querySelector('style[data-bulud-theme]')!;
      if (original === undefined) style.remove();
      else style.textContent = original;
    }
  });
});

describe('Badge geometry theme precedence', () => {
  const tokens = [
    {
      field: 'heightSmall',
      variable: '--bulud-badge-height-small',
      fallback: '1.625rem',
      computed: '26px',
      size: 'small',
      selector: '.bulud-badge',
      property: 'min-block-size',
    },
    {
      field: 'fontSizeSmall',
      variable: '--bulud-badge-font-size-small',
      fallback: '0.8125rem',
      computed: '13px',
      size: 'small',
      selector: '.bulud-badge',
      property: 'font-size',
    },
    {
      field: 'paddingInlineSmall',
      variable: '--bulud-badge-padding-inline-small',
      fallback: '0.75rem',
      computed: '12px',
      size: 'small',
      selector: '.bulud-badge',
      property: 'padding-inline-start',
    },
    {
      field: 'heightMedium',
      variable: '--bulud-badge-height-medium',
      fallback: '2rem',
      computed: '32px',
      size: 'medium',
      selector: '.bulud-badge',
      property: 'min-block-size',
    },
    {
      field: 'fontSizeMedium',
      variable: '--bulud-badge-font-size-medium',
      fallback: '0.875rem',
      computed: '14px',
      size: 'medium',
      selector: '.bulud-badge',
      property: 'font-size',
    },
    {
      field: 'paddingInlineMedium',
      variable: '--bulud-badge-padding-inline-medium',
      fallback: '0.875rem',
      computed: '14px',
      size: 'medium',
      selector: '.bulud-badge',
      property: 'padding-inline-start',
    },
    {
      field: 'heightLarge',
      variable: '--bulud-badge-height-large',
      fallback: '2.25rem',
      computed: '36px',
      size: 'large',
      selector: '.bulud-badge',
      property: 'min-block-size',
    },
    {
      field: 'fontSizeLarge',
      variable: '--bulud-badge-font-size-large',
      fallback: '0.9375rem',
      computed: '15px',
      size: 'large',
      selector: '.bulud-badge',
      property: 'font-size',
    },
    {
      field: 'paddingInlineLarge',
      variable: '--bulud-badge-padding-inline-large',
      fallback: '1rem',
      computed: '16px',
      size: 'large',
      selector: '.bulud-badge',
      property: 'padding-inline-start',
    },
    {
      field: 'borderWidth',
      variable: '--bulud-badge-border-width',
      fallback: '1px',
      computed: '1px',
      size: 'medium',
      selector: '.bulud-badge',
      property: 'border-top-width',
    },
    {
      field: 'lineHeight',
      variable: '--bulud-badge-line-height',
      fallback: '1.25',
      computed: '17.5px',
      size: 'medium',
      selector: '.bulud-badge',
      property: 'line-height',
    },
    {
      field: 'dotSize',
      variable: '--bulud-badge-dot-size',
      fallback: '0.4375rem',
      computed: '7px',
      size: 'medium',
      selector: '.bulud-badge__dot',
      property: 'width',
    },
    {
      field: 'dotGap',
      variable: '--bulud-badge-dot-gap',
      fallback: '0.625rem',
      computed: '10px',
      size: 'medium',
      selector: '.bulud-badge__dot',
      property: 'margin-inline-end',
    },
    {
      field: 'dismissSize',
      variable: '--bulud-badge-dismiss-size',
      fallback: '1.5rem',
      computed: '24px',
      size: 'medium',
      selector: 'button',
      property: 'min-width',
    },
    {
      field: 'dismissGap',
      variable: '--bulud-badge-dismiss-gap',
      fallback: '0.375rem',
      computed: '6px',
      size: 'medium',
      selector: 'button',
      property: 'margin-inline-start',
    },
    {
      field: 'dismissMargin',
      variable: '--bulud-badge-dismiss-margin',
      fallback: '-0.375rem',
      computed: '-6px',
      size: 'medium',
      selector: 'button',
      property: 'margin-inline-end',
    },
    {
      field: 'dismissPadding',
      variable: '--bulud-badge-dismiss-padding',
      fallback: '0.125rem',
      computed: '2px',
      size: 'medium',
      selector: 'button',
      property: 'padding-top',
    },
    {
      field: 'dismissIconSize',
      variable: '--bulud-badge-dismiss-icon-size',
      fallback: '0.875rem',
      computed: '14px',
      size: 'medium',
      selector: 'svg',
      property: 'width',
    },
    {
      field: 'focusWidth',
      variable: '--bulud-badge-focus-width',
      fallback: '2px',
      computed: '2px',
      size: 'medium',
      selector: 'button',
      property: 'outline-width',
    },
    {
      field: 'focusOffset',
      variable: '--bulud-badge-focus-offset',
      fallback: '2px',
      computed: '2px',
      size: 'medium',
      selector: 'button',
      property: 'outline-offset',
    },
  ] as const;

  for (const token of tokens) {
    it(`resolves ${token.field} through fallback, global, scope and instance`, async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [provideZonelessChangeDetection()],
      }).compileComponents();
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.size.set(token.size);
      await fixture.whenStable();
      const scope: HTMLElement = fixture.nativeElement;
      const host = scope.querySelector<HTMLElement>('bulud-badge')!;
      const target = host.querySelector<HTMLElement>(token.selector)!;
      host.querySelector('button')!.focus();
      const original = document.head.querySelector(
        'style[data-bulud-theme]',
      )?.textContent;
      document.head.querySelector('style[data-bulud-theme]')?.remove();
      const rootStyle = document.createElement('style');
      const injectors: EnvironmentInjector[] = [];
      const provide = (badge: Partial<BuludBadgeTheme>) => {
        injectors.push(
          createEnvironmentInjector(
            [
              provideBuludTheme({
                ...BULUD_DEFAULT_THEME,
                badge: { ...BULUD_DEFAULT_THEME.badge, ...badge },
              }),
            ],
            TestBed.inject(EnvironmentInjector),
          ),
        );
      };
      try {
        expect(getComputedStyle(target).getPropertyValue(token.property)).toBe(
          token.computed,
        );
        expect(resolveBuludTheme().badge[token.field]).toBe(token.fallback);
        expect(createBuludThemeVariables()[token.variable]).toBe(
          token.fallback,
        );
        expect(token.field in BULUD_DEFAULT_THEME.badge).toBeFalse();
        expect(
          resolveBuludTheme({ badge: { [token.field]: undefined } }).badge[
            token.field
          ],
        ).toBe(token.fallback);
        rootStyle.textContent = `:root { ${token.variable}: 19px; }`;
        document.head.appendChild(rootStyle);
        provide({});
        expect(
          document.head.querySelector('style[data-bulud-theme]')!.textContent,
        ).not.toContain(token.variable + ':');
        expect(getComputedStyle(target).getPropertyValue(token.property)).toBe(
          '19px',
        );
        rootStyle.remove();
        expect(getComputedStyle(target).getPropertyValue(token.property)).toBe(
          token.computed,
        );
        provide({ [token.field]: '20px' });
        expect(
          createBuludThemeVariables({ badge: { [token.field]: '20px' } })[
            token.variable
          ],
        ).toBe('20px');
        expect(getComputedStyle(target).getPropertyValue(token.property)).toBe(
          '20px',
        );
        scope.style.setProperty(token.variable, '21px');
        expect(getComputedStyle(target).getPropertyValue(token.property)).toBe(
          '21px',
        );
        host.style.setProperty(token.variable, '22px');
        expect(getComputedStyle(target).getPropertyValue(token.property)).toBe(
          '22px',
        );
        host.style.removeProperty(token.variable);
        scope.style.removeProperty(token.variable);
        expect(getComputedStyle(target).getPropertyValue(token.property)).toBe(
          '20px',
        );
      } finally {
        rootStyle.remove();
        injectors.forEach((injector) => injector.destroy());
        const style = document.head.querySelector('style[data-bulud-theme]');
        if (original === undefined) style?.remove();
        else if (style) style.textContent = original;
        fixture.destroy();
      }
    });
  }
});
