import {
  Component,
  createEnvironmentInjector,
  EnvironmentInjector,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import {
  BULUD_THEME,
  BuludSwitchTheme,
  createBuludThemeVariables,
  provideBuludTheme,
  resolveBuludTheme,
} from '../../src/lib/theme/bulud-theme';
import { BuludSwitch } from './bulud-switch';

@Component({
  imports: [BuludSwitch, ReactiveFormsModule],
  template: `
    <bulud-switch
      id="notifications"
      [aria-label]="ariaLabel()"
      [aria-describedby]="ariaDescribedBy()"
      [aria-errormessage]="ariaErrorMessage()"
      [invalid]="explicitInvalid()"
      [required]="required()"
      [formControl]="control"
    >
      Notifications
    </bulud-switch>
    <bulud-switch id="standalone-disabled" [disabled]="disabled()">
      Standalone disabled switch
    </bulud-switch>
  `,
})
class TestHost {
  readonly ariaLabel = signal<string | null>(null);
  readonly ariaDescribedBy = signal<string | null>(null);
  readonly ariaErrorMessage = signal<string | null>(null);
  readonly disabled = signal(false);
  readonly explicitInvalid = signal(false);
  readonly required = signal(true);
  readonly control = new FormControl(false);
}

const switchThemeTokens = [
  {
    field: 'background',
    variable: '--bulud-switch-background',
    property: 'custom-property',
    selector: '.bulud-switch__track',
    fallback: '#ffffff',
    fallbackComputed: '#ffffff',
    global: '#123456',
    globalComputed: '#123456',
    scoped: '#234567',
    scopedComputed: '#234567',
    instance: '#345678',
    instanceComputed: '#345678',
  },
  {
    field: 'backgroundHover',
    variable: '--bulud-switch-background-hover',
    property: 'custom-property',
    selector: '.bulud-switch__track',
    fallback: '#f8fafc',
    fallbackComputed: '#f8fafc',
    global: '#123456',
    globalComputed: '#123456',
    scoped: '#234567',
    scopedComputed: '#234567',
    instance: '#345678',
    instanceComputed: '#345678',
  },
  {
    field: 'border',
    variable: '--bulud-switch-border',
    property: 'custom-property',
    selector: '.bulud-switch__track',
    fallback: '#cbd5e1',
    fallbackComputed: '#cbd5e1',
    global: '#654321',
    globalComputed: '#654321',
    scoped: '#765432',
    scopedComputed: '#765432',
    instance: '#876543',
    instanceComputed: '#876543',
  },
  {
    field: 'borderWidth',
    variable: '--bulud-switch-border-width',
    property: 'border-top-width',
    selector: '.bulud-switch__track',
    fallback: '1px',
    fallbackComputed: '1px',
    global: '3px',
    globalComputed: '3px',
    scoped: '5px',
    scopedComputed: '5px',
    instance: '7px',
    instanceComputed: '7px',
  },
  {
    field: 'checkedBackground',
    variable: '--bulud-switch-checked-background',
    property: 'custom-property',
    selector: '.bulud-switch__track',
    state: 'checked',
    fallback: '#2563eb',
    fallbackComputed: '#2563eb',
    global: '#112233',
    globalComputed: '#112233',
    scoped: '#223344',
    scopedComputed: '#223344',
    instance: '#334455',
    instanceComputed: '#334455',
  },
  {
    field: 'checkedThumb',
    variable: '--bulud-switch-checked-thumb',
    property: 'custom-property',
    selector: '.bulud-switch__thumb',
    state: 'checked',
    fallback: '#ffffff',
    fallbackComputed: '#ffffff',
    global: '#fef3c7',
    globalComputed: '#fef3c7',
    scoped: '#fde68a',
    scopedComputed: '#fde68a',
    instance: '#fcd34d',
    instanceComputed: '#fcd34d',
  },
  {
    field: 'disabledOpacity',
    variable: '--bulud-switch-disabled-opacity',
    property: 'custom-property',
    selector: 'bulud-switch',
    state: 'disabled',
    fallback: '0.55',
    fallbackComputed: '0.55',
    global: '0.4',
    globalComputed: '0.4',
    scoped: '0.45',
    scopedComputed: '0.45',
    instance: '0.5',
    instanceComputed: '0.5',
  },
  {
    field: 'focus',
    variable: '--bulud-switch-focus',
    property: 'custom-property',
    selector: '.bulud-switch__track',
    state: 'focus',
    fallback: '#93c5fd',
    fallbackComputed: '#93c5fd',
    global: '#111827',
    globalComputed: '#111827',
    scoped: '#374151',
    scopedComputed: '#374151',
    instance: '#4b5563',
    instanceComputed: '#4b5563',
  },
  {
    field: 'focusWidth',
    variable: '--bulud-switch-focus-width',
    property: 'outline-width',
    selector: '.bulud-switch__track',
    state: 'focus',
    fallback: '3px',
    fallbackComputed: '3px',
    global: '4px',
    globalComputed: '4px',
    scoped: '5px',
    scopedComputed: '5px',
    instance: '6px',
    instanceComputed: '6px',
  },
  {
    field: 'focusOffset',
    variable: '--bulud-switch-focus-offset',
    property: 'outline-offset',
    selector: '.bulud-switch__track',
    state: 'focus',
    fallback: '2px',
    fallbackComputed: '2px',
    global: '3px',
    globalComputed: '3px',
    scoped: '4px',
    scopedComputed: '4px',
    instance: '5px',
    instanceComputed: '5px',
  },
  {
    field: 'foreground',
    variable: '--bulud-switch-foreground',
    property: 'custom-property',
    selector: 'bulud-switch',
    fallback: '#0f172a',
    fallbackComputed: '#0f172a',
    global: '#111111',
    globalComputed: '#111111',
    scoped: '#222222',
    scopedComputed: '#222222',
    instance: '#333333',
    instanceComputed: '#333333',
  },
  {
    field: 'gap',
    variable: '--bulud-switch-gap',
    property: 'gap',
    selector: '.bulud-switch__label',
    fallback: '0.625rem',
    fallbackComputed: '10px',
    global: '12px',
    globalComputed: '12px',
    scoped: '14px',
    scopedComputed: '14px',
    instance: '16px',
    instanceComputed: '16px',
  },
  {
    field: 'height',
    variable: '--bulud-switch-height',
    property: 'height',
    selector: '.bulud-switch__track',
    fallback: '1.5rem',
    fallbackComputed: '24px',
    global: '28px',
    globalComputed: '28px',
    scoped: '30px',
    scopedComputed: '30px',
    instance: '32px',
    instanceComputed: '32px',
  },
  {
    field: 'labelLineHeight',
    variable: '--bulud-switch-label-line-height',
    property: 'line-height',
    selector: '.bulud-switch__label',
    fallback: '1.5',
    fallbackComputed: '24px',
    global: '1.75',
    globalComputed: '28px',
    scoped: '2',
    scopedComputed: '32px',
    instance: '2.25',
    instanceComputed: '36px',
  },
  {
    field: 'padding',
    variable: '--bulud-switch-padding',
    property: 'padding-top',
    selector: '.bulud-switch__track',
    fallback: '0.125rem',
    fallbackComputed: '2px',
    global: '3px',
    globalComputed: '3px',
    scoped: '4px',
    scopedComputed: '4px',
    instance: '5px',
    instanceComputed: '5px',
  },
  {
    field: 'radius',
    variable: '--bulud-switch-radius',
    property: 'border-radius',
    selector: '.bulud-switch__track',
    fallback: '999px',
    fallbackComputed: '999px',
    global: '10px',
    globalComputed: '10px',
    scoped: '12px',
    scopedComputed: '12px',
    instance: '14px',
    instanceComputed: '14px',
  },
  {
    field: 'thumb',
    variable: '--bulud-switch-thumb',
    property: 'custom-property',
    selector: '.bulud-switch__thumb',
    fallback: '#64748b',
    fallbackComputed: '#64748b',
    global: '#475569',
    globalComputed: '#475569',
    scoped: '#334155',
    scopedComputed: '#334155',
    instance: '#1e293b',
    instanceComputed: '#1e293b',
  },
  {
    field: 'thumbSize',
    variable: '--bulud-switch-thumb-size',
    property: 'width',
    selector: '.bulud-switch__thumb',
    fallback: '1.125rem',
    fallbackComputed: '18px',
    global: '20px',
    globalComputed: '20px',
    scoped: '22px',
    scopedComputed: '22px',
    instance: '24px',
    instanceComputed: '24px',
  },
  {
    field: 'width',
    variable: '--bulud-switch-width',
    property: 'width',
    selector: '.bulud-switch__track',
    fallback: '2.75rem',
    fallbackComputed: '44px',
    global: '48px',
    globalComputed: '48px',
    scoped: '50px',
    scopedComputed: '50px',
    instance: '52px',
    instanceComputed: '52px',
  },
] as const;

describe('BuludSwitch', () => {
  let fixture: ComponentFixture<TestHost>;

  const getHost = (): HTMLElement =>
    fixture.nativeElement.querySelector('bulud-switch');
  const getInput = (id = 'notifications'): HTMLInputElement => {
    const input = fixture.nativeElement.querySelector(`input#${id}`);
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Expected a native switch input.');
    }
    return input;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
  });

  it('uses native checkbox behavior with switch semantics and projected content', () => {
    const input = getInput();
    expect(input.type).toBe('checkbox');
    expect(input.getAttribute('role')).toBe('switch');
    expect(input.id).toBe('notifications');
    expect(input.getAttribute('aria-label')).toBeNull();
    expect(getHost().textContent).toContain('Notifications');
  });

  it('supports checked state, disabled state, and pointer interaction', async () => {
    const state = fixture.componentInstance;
    const input = getInput();

    state.control.setValue(true);
    await fixture.whenStable();
    expect(input.checked).toBeTrue();

    input.focus();
    input.click();
    await fixture.whenStable();
    expect(state.control.value).toBeFalse();

    state.disabled.set(true);
    await fixture.whenStable();
    const standaloneInput = getInput('standalone-disabled');
    expect(standaloneInput.disabled).toBeTrue();
    standaloneInput.click();
    await fixture.whenStable();
    expect(state.control.value).toBeFalse();
  });

  it('implements the full ControlValueAccessor contract', async () => {
    const component = fixture.componentRef.location.nativeElement
      .querySelector('bulud-switch')
      ?.getAttribute('id');
    expect(component).toBeNull();

    const instance = fixture.debugElement.children[0]
      .componentInstance as BuludSwitch;
    let changeValue: boolean | null = null;
    let touched = 0;
    instance.registerOnChange((value) => (changeValue = value));
    instance.registerOnTouched(() => touched++);

    instance.writeValue(true);
    await fixture.whenStable();
    expect(getInput().checked).toBeTrue();
    expect(changeValue).toBeNull();

    getInput().focus();
    getInput().click();
    getInput().blur();
    await fixture.whenStable();
    expect(changeValue).toBeFalse();
    expect(touched).toBe(1);

    instance.setDisabledState(true);
    await fixture.whenStable();
    expect(getInput().disabled).toBeTrue();
  });

  it('validates required state and revalidates when required changes', async () => {
    const state = fixture.componentInstance;
    expect(state.control.errors).toEqual({ required: true });

    state.control.setValue(true);
    await fixture.whenStable();
    expect(state.control.errors).toBeNull();

    state.control.setValue(false);
    state.required.set(false);
    await fixture.whenStable();
    expect(state.control.errors).toBeNull();
  });

  it('propagates accessible relationships and invalid state', async () => {
    const state = fixture.componentInstance;
    state.ariaLabel.set('Enable notifications');
    state.ariaDescribedBy.set('notifications-help');
    state.ariaErrorMessage.set('notifications-error');
    state.explicitInvalid.set(true);
    await fixture.whenStable();

    const input = getInput();
    expect(input.getAttribute('aria-label')).toBe('Enable notifications');
    expect(input.getAttribute('aria-describedby')).toBe('notifications-help');
    expect(input.getAttribute('aria-errormessage')).toBe('notifications-error');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(getHost().classList).toContain('bulud-switch-host--invalid');
  });

  it('reacts to touched form errors and disabled Forms state', async () => {
    const state = fixture.componentInstance;
    state.control.setErrors({ server: true });
    await fixture.whenStable();
    expect(getInput().getAttribute('aria-invalid')).toBeNull();

    state.control.markAsTouched();
    await fixture.whenStable();
    expect(getInput().getAttribute('aria-invalid')).toBe('true');

    state.control.disable();
    await fixture.whenStable();
    expect(getInput().disabled).toBeTrue();
  });

  it('keeps the invalid border visible when checked', async () => {
    const state = fixture.componentInstance;
    state.control.setValue(true);
    state.explicitInvalid.set(true);
    await fixture.whenStable();

    expect(getInput().checked).toBeTrue();
    expect(getInput().getAttribute('aria-invalid')).toBe('true');
    expect(
      getComputedStyle(
        getHost().querySelector<HTMLElement>('.bulud-switch__track')!,
      ).borderTopColor,
    ).toBe('rgb(220, 38, 38)');
  });

  it('keeps default track geometry and checked travel inside the border box', async () => {
    const state = fixture.componentInstance;
    const host = getHost();
    const track = host.querySelector<HTMLElement>('.bulud-switch__track')!;
    const thumb = host.querySelector<HTMLElement>('.bulud-switch__thumb')!;
    document.body.append(fixture.nativeElement);
    thumb.style.transition = 'none';

    try {
      const trackStyle = getComputedStyle(track);
      expect(trackStyle.boxSizing).toBe('border-box');
      expect(track.getBoundingClientRect().width).toBeCloseTo(44, 0);
      expect(track.getBoundingClientRect().height).toBeCloseTo(24, 0);
      expect(getComputedStyle(thumb).boxSizing).toBe('border-box');

      state.control.setValue(false);
      await fixture.whenStable();
      const uncheckedThumb = thumb.getBoundingClientRect();
      state.control.setValue(true);
      await fixture.whenStable();
      const checkedThumb = thumb.getBoundingClientRect();

      expect(checkedThumb.left - uncheckedThumb.left).toBeCloseTo(20, 0);
      expect(
        uncheckedThumb.left - track.getBoundingClientRect().left,
      ).toBeCloseTo(3, 0);
      expect(
        track.getBoundingClientRect().right - checkedThumb.right,
      ).toBeCloseTo(3, 0);
    } finally {
      thumb.style.removeProperty('transition');
      fixture.nativeElement.remove();
    }
  });

  it('includes custom border width in LTR checked travel', async () => {
    const state = fixture.componentInstance;
    const host = getHost();
    const track = host.querySelector<HTMLElement>('.bulud-switch__track')!;
    const thumb = host.querySelector<HTMLElement>('.bulud-switch__thumb')!;
    document.body.append(fixture.nativeElement);
    host.style.setProperty('--bulud-switch-border-width', '5px');
    thumb.style.transition = 'none';

    try {
      state.control.setValue(false);
      await fixture.whenStable();
      const uncheckedThumb = thumb.getBoundingClientRect();
      state.control.setValue(true);
      await fixture.whenStable();
      const checkedThumb = thumb.getBoundingClientRect();

      expect(checkedThumb.left - uncheckedThumb.left).toBeCloseTo(12, 0);
      expect(
        uncheckedThumb.left - track.getBoundingClientRect().left,
      ).toBeCloseTo(7, 0);
      expect(
        track.getBoundingClientRect().right - checkedThumb.right,
      ).toBeCloseTo(7, 0);
    } finally {
      thumb.style.removeProperty('transition');
      host.style.removeProperty('--bulud-switch-border-width');
      fixture.nativeElement.remove();
    }
  });

  it('keeps custom width, thumb, padding, and border geometry symmetric in LTR and RTL', async () => {
    const state = fixture.componentInstance;
    const host = getHost();
    const track = host.querySelector<HTMLElement>('.bulud-switch__track')!;
    const thumb = host.querySelector<HTMLElement>('.bulud-switch__thumb')!;
    const root = document.documentElement;
    const previousDirection = root.getAttribute('dir');
    document.body.append(fixture.nativeElement);
    host.style.setProperty('--bulud-switch-width', '80px');
    host.style.setProperty('--bulud-switch-thumb-size', '20px');
    host.style.setProperty('--bulud-switch-padding', '4px');
    host.style.setProperty('--bulud-switch-border-width', '3px');
    thumb.style.transition = 'none';

    try {
      root.removeAttribute('dir');
      state.control.setValue(false);
      await fixture.whenStable();
      const uncheckedLtr = thumb.getBoundingClientRect();
      state.control.setValue(true);
      await fixture.whenStable();
      const checkedLtr = thumb.getBoundingClientRect();
      expect(checkedLtr.left - uncheckedLtr.left).toBeCloseTo(46, 0);
      expect(
        uncheckedLtr.left - track.getBoundingClientRect().left,
      ).toBeCloseTo(7, 0);
      expect(
        track.getBoundingClientRect().right - checkedLtr.right,
      ).toBeCloseTo(7, 0);

      root.setAttribute('dir', 'rtl');
      state.control.setValue(false);
      await fixture.whenStable();
      const uncheckedRtl = thumb.getBoundingClientRect();
      state.control.setValue(true);
      await fixture.whenStable();
      const checkedRtl = thumb.getBoundingClientRect();
      expect(checkedRtl.left - uncheckedRtl.left).toBeCloseTo(-46, 0);
      expect(
        track.getBoundingClientRect().right - uncheckedRtl.right,
      ).toBeCloseTo(7, 0);
      expect(checkedRtl.left - track.getBoundingClientRect().left).toBeCloseTo(
        7,
        0,
      );
    } finally {
      thumb.style.removeProperty('transition');
      host.style.removeProperty('--bulud-switch-width');
      host.style.removeProperty('--bulud-switch-thumb-size');
      host.style.removeProperty('--bulud-switch-padding');
      host.style.removeProperty('--bulud-switch-border-width');
      if (previousDirection === null) root.removeAttribute('dir');
      else root.setAttribute('dir', previousDirection);
      fixture.nativeElement.remove();
    }
  });

  for (const token of switchThemeTokens) {
    it(`resolves ${token.field} through library, global, scoped, and instance values`, async () => {
      const state = fixture.componentInstance;
      const host = getHost();
      const scope = fixture.nativeElement as HTMLElement;
      document.body.append(scope);
      const target =
        token.selector === 'bulud-switch'
          ? host
          : host.querySelector<HTMLElement>(token.selector)!;
      const input = getInput();

      if ('state' in token) {
        if (token.state === 'checked') {
          state.control.setValue(true);
        } else if (token.state === 'disabled') {
          state.control.disable();
        } else if (token.state === 'focus') {
          input.focus();
        }
      }
      await fixture.whenStable();

      const readValue = () => {
        if (token.property === 'custom-property') {
          return (
            getComputedStyle(host).getPropertyValue(token.variable).trim() ||
            token.fallbackComputed
          );
        }
        return getComputedStyle(target).getPropertyValue(token.property).trim();
      };
      const previous = document.head.querySelector('style[data-bulud-theme]');
      const previousText = previous?.textContent ?? null;
      const root = document.documentElement;
      const previousDark = root.classList.contains('dark');
      const previousTheme = root.getAttribute('data-theme');
      root.classList.remove('dark');
      root.removeAttribute('data-theme');
      const rootStyle = document.createElement('style');
      let globalInjector: EnvironmentInjector | undefined;
      let fallbackInjector: EnvironmentInjector | undefined;

      try {
        expect(resolveBuludTheme().switch[token.field]).toBe(token.fallback);
        expect(createBuludThemeVariables()[token.variable]).toBe(
          token.fallback,
        );
        expect(readValue()).toBe(token.fallbackComputed);

        const globalConfig: Partial<BuludSwitchTheme> = {
          [token.field]: token.global,
        };
        globalInjector = createEnvironmentInjector(
          [provideBuludTheme({ switch: globalConfig })],
          TestBed.inject(EnvironmentInjector),
        );
        expect(globalInjector.get(BULUD_THEME).switch[token.field]).toBe(
          token.global,
        );
        expect(readValue()).toBe(token.globalComputed);

        scope.style.setProperty(token.variable, token.scoped);
        expect(readValue()).toBe(token.scopedComputed);

        host.style.setProperty(token.variable, token.instance);
        expect(readValue()).toBe(token.instanceComputed);

        host.style.removeProperty(token.variable);
        expect(readValue()).toBe(token.scopedComputed);
        scope.style.removeProperty(token.variable);
        expect(readValue()).toBe(token.globalComputed);

        globalInjector.destroy();
        globalInjector = undefined;
        const providerStyle = document.head.querySelector(
          'style[data-bulud-theme]',
        );
        if (providerStyle) {
          if (previous) previous.textContent = previousText;
          else providerStyle.remove();
        }

        rootStyle.textContent = `:root { ${token.variable}: ${token.scoped}; }`;
        document.head.append(rootStyle);
        fallbackInjector = createEnvironmentInjector(
          [provideBuludTheme()],
          TestBed.inject(EnvironmentInjector),
        );
        expect(
          document.head.querySelector('style[data-bulud-theme]')?.textContent,
        ).not.toContain(`${token.variable}:`);
        expect(readValue()).toBe(token.scopedComputed);
        rootStyle.remove();
        expect(readValue()).toBe(token.fallbackComputed);
      } finally {
        globalInjector?.destroy();
        fallbackInjector?.destroy();
        rootStyle.remove();
        host.style.removeProperty(token.variable);
        scope.style.removeProperty(token.variable);
        scope.remove();
        if (previous) {
          previous.textContent = previousText;
        } else {
          document.head.querySelector('style[data-bulud-theme]')?.remove();
        }
        if (previousDark) root.classList.add('dark');
        if (previousTheme === null) root.removeAttribute('data-theme');
        else root.setAttribute('data-theme', previousTheme);
      }
    });
  }
});
