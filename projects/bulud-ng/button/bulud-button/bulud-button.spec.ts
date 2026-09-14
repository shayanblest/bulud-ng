import {
  Component,
  createEnvironmentInjector,
  EnvironmentInjector,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  BULUD_THEME,
  createBuludThemeVariables,
  provideBuludTheme,
} from '../../src/lib/theme/bulud-theme';

import {
  BuludButton,
  BuludButtonType,
  BuludButtonSize,
  BuludButtonVariant,
} from './bulud-button';

@Component({
  imports: [BuludButton],
  template: `
    <bulud-button
      aria-label="Save changes"
      [disabled]="disabled()"
      [type]="type()"
      [fullWidth]="fullWidth()"
      [loading]="loading()"
      [loadingLabel]="loadingLabel()"
      [size]="size()"
      [variant]="variant()"
      (click)="clickCount.set(clickCount() + 1)"
    >
      Save
    </bulud-button>
  `,
})
class TestHost {
  readonly clickCount = signal(0);
  readonly disabled = signal(false);
  readonly fullWidth = signal(false);
  readonly loading = signal(false);
  readonly loadingLabel = signal('Saving');
  readonly size = signal<BuludButtonSize>('medium');
  readonly variant = signal<BuludButtonVariant>('primary');
  readonly type = signal<BuludButtonType>('button');
}

describe('BuludButton', () => {
  let fixture: ComponentFixture<TestHost>;

  const getHost = (): HTMLElement => {
    const host = fixture.nativeElement.querySelector('bulud-button');

    if (!(host instanceof HTMLElement)) {
      throw new Error('Expected a bulud-button host element.');
    }

    return host;
  };

  const getButton = (): HTMLButtonElement => {
    const button = fixture.nativeElement.querySelector('button');

    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('Expected a native button element.');
    }

    return button;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
  });

  it('renders projected content in a native button', () => {
    const button = getButton();

    expect(button.type).toBe('button');
    expect(button.textContent).toContain('Save');
    expect(button.getAttribute('aria-label')).toBe('Save changes');
  });

  it('emits a native click from the projected button', () => {
    getButton().click();

    expect(fixture.componentInstance.clickCount()).toBe(1);
  });

  it('prevents interaction when disabled', async () => {
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();

    const button = getButton();
    button.click();

    expect(button.disabled).toBeTrue();
    expect(fixture.componentInstance.clickCount()).toBe(0);
  });

  it('exposes loading state and prevents repeated interaction', async () => {
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();

    const button = getButton();

    expect(button.disabled).toBeTrue();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(getHost().querySelector('[role="status"]')?.textContent).toContain(
      'Saving',
    );
    expect(button.querySelector('.bulud-button__spinner')).not.toBeNull();

    button.click();
    expect(fixture.componentInstance.clickCount()).toBe(0);
  });

  it('applies the requested visual variant and size', async () => {
    fixture.componentInstance.variant.set('danger');
    fixture.componentInstance.size.set('large');
    await fixture.whenStable();

    expect(getButton().classList).toContain('bulud-button--danger');
    expect(getButton().classList).toContain('bulud-button--large');
  });

  it('supports full-width layout on the host', async () => {
    fixture.componentInstance.fullWidth.set(true);
    await fixture.whenStable();

    expect(getHost().classList).toContain('bulud-button-host--full-width');
  });

  it('renders every supported variant and size reactively', async () => {
    for (const variant of [
      'primary',
      'secondary',
      'danger',
      'ghost',
    ] as const) {
      for (const size of ['small', 'medium', 'large'] as const) {
        fixture.componentInstance.variant.set(variant);
        fixture.componentInstance.size.set(size);
        await fixture.whenStable();
        expect(getButton().classList).toContain(`bulud-button--${variant}`);
        expect(getButton().classList).toContain(`bulud-button--${size}`);
      }
    }
  });

  it('forwards the native button type', async () => {
    fixture.componentInstance.type.set('submit');
    await fixture.whenStable();
    expect(getButton().type).toBe('submit');
  });
  it('clears busy state and restores interaction without overriding disabled', async () => {
    const state = fixture.componentInstance;
    state.loading.set(true);
    await fixture.whenStable();
    expect(getButton().querySelector('[aria-hidden="true"]')).not.toBeNull();
    state.loadingLabel.set('Still saving');
    await fixture.whenStable();
    expect(getHost().querySelector('[role="status"]')?.textContent).toContain(
      'Still saving',
    );
    state.disabled.set(true);
    state.loading.set(false);
    await fixture.whenStable();
    expect(getButton().disabled).toBeTrue();
    expect(getButton().hasAttribute('aria-busy')).toBeFalse();
    expect(
      getHost().querySelector('[role="status"]')?.textContent?.trim(),
    ).toBe('');
    expect(getButton().querySelector('.bulud-button__spinner')).toBeNull();
    state.disabled.set(false);
    await fixture.whenStable();
    getButton().click();
    expect(state.clickCount()).toBe(1);
  });

  it('adds and removes an explicit accessible name reactively', async () => {
    const buttonFixture = TestBed.createComponent(BuludButton);
    await buttonFixture.whenStable();
    const button: HTMLButtonElement =
      buttonFixture.nativeElement.querySelector('button');
    expect(button.hasAttribute('aria-label')).toBeFalse();
    buttonFixture.componentRef.setInput('aria-label', 'Icon action');
    await buttonFixture.whenStable();
    expect(button.getAttribute('aria-label')).toBe('Icon action');
    buttonFixture.componentRef.setInput('aria-label', null);
    await buttonFixture.whenStable();
    expect(button.hasAttribute('aria-label')).toBeFalse();
  });
  it('resolves library, provider, scoped component and instance theme values', async () => {
    const host = getHost();
    const button = getButton();
    button.style.transition = 'none';
    expect(getComputedStyle(button).backgroundColor).toBe('rgb(37, 99, 235)');
    const previous = document.head.querySelector('style[data-bulud-theme]');
    const previousText = previous?.textContent ?? null;
    const injector = createEnvironmentInjector(
      [
        provideBuludTheme({
          colors: { primary: '#123456' },
          button: { medium: { height: '51px' } },
        }),
      ],
      TestBed.inject(EnvironmentInjector),
    );
    try {
      expect(getComputedStyle(button).backgroundColor).toBe('rgb(18, 52, 86)');
      expect(getComputedStyle(button).height).toBe('51px');
      fixture.nativeElement.style.setProperty(
        '--bulud-button-background',
        '#234567',
      );
      expect(getComputedStyle(button).backgroundColor).toBe('rgb(35, 69, 103)');
      host.style.setProperty('--bulud-button-background', '#345678');
      host.style.setProperty('--bulud-button-focus-width', '5px');
      host.style.setProperty('--bulud-button-focus-offset', '4px');
      host.style.setProperty('--bulud-button-border-width', '2px');
      expect(getComputedStyle(button).backgroundColor).toBe('rgb(52, 86, 120)');
      expect(getComputedStyle(button).borderTopWidth).toBe('2px');
      fixture.componentInstance.variant.set('ghost');
      host.style.setProperty('--bulud-button-ghost-background', '#456789');
      await fixture.whenStable();
      expect(getComputedStyle(button).backgroundColor).toBe(
        'rgb(69, 103, 137)',
      );
    } finally {
      injector.destroy();
      if (previous) previous.textContent = previousText;
      else document.head.querySelector('style[data-bulud-theme]')?.remove();
    }
  });
  for (const token of [
    {
      field: 'borderWidth',
      variable: '--bulud-button-border-width',
      property: 'border-top-width',
      fallback: '1px',
      global: '2px',
      scoped: '3px',
      instance: '4px',
    },
    {
      field: 'focusWidth',
      variable: '--bulud-button-focus-width',
      property: 'outline-width',
      fallback: '3px',
      global: '4px',
      scoped: '5px',
      instance: '6px',
    },
    {
      field: 'focusOffset',
      variable: '--bulud-button-focus-offset',
      property: 'outline-offset',
      fallback: '2px',
      global: '3px',
      scoped: '4px',
      instance: '5px',
    },
    {
      field: 'ghostBackground',
      variable: '--bulud-button-ghost-background',
      property: 'background-color',
      fallback: 'transparent',
      global: 'rgb(18, 52, 86)',
      scoped: 'rgb(35, 69, 103)',
      instance: 'rgb(52, 86, 120)',
    },
  ] as const) {
    it(`resolves ${token.field} through library, typed global, scoped and instance values`, async () => {
      fixture.componentInstance.variant.set('ghost');
      await fixture.whenStable();
      const button = getButton();
      const host = getHost();
      const scope: HTMLElement = fixture.nativeElement;
      button.style.transition = 'none';
      button.focus();
      expect(button.matches(':focus-visible')).toBeTrue();
      const value = () =>
        getComputedStyle(button).getPropertyValue(token.property);
      expect(createBuludThemeVariables()[token.variable]).toBe(token.fallback);
      expect(value()).toBe(
        token.field === 'ghostBackground' ? 'rgba(0, 0, 0, 0)' : token.fallback,
      );
      const previous = document.head.querySelector('style[data-bulud-theme]');
      const previousText = previous?.textContent ?? null;
      const injector = createEnvironmentInjector(
        [provideBuludTheme({ button: { [token.field]: token.global } })],
        TestBed.inject(EnvironmentInjector),
      );
      try {
        expect(injector.get(BULUD_THEME).button[token.field]).toBe(
          token.global,
        );
        expect(value()).toBe(token.global);
        scope.style.setProperty(token.variable, token.scoped);
        expect(value()).toBe(token.scoped);
        host.style.setProperty(token.variable, token.instance);
        expect(value()).toBe(token.instance);
        host.style.removeProperty(token.variable);
        expect(value()).toBe(token.scoped);
        scope.style.removeProperty(token.variable);
        expect(value()).toBe(token.global);
      } finally {
        host.style.removeProperty(token.variable);
        scope.style.removeProperty(token.variable);
        button.blur();
        injector.destroy();
        if (previous) previous.textContent = previousText;
        else document.head.querySelector('style[data-bulud-theme]')?.remove();
      }
    });
  }
});
