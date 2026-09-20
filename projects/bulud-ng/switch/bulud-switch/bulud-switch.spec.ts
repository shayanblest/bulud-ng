import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { createBuludThemeVariables } from '../../src/lib/theme/bulud-theme';
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

  it('supports global and instance theme CSS variables', () => {
    const variables = createBuludThemeVariables({
      switch: { checkedBackground: '#123456' },
    });
    expect(variables['--bulud-switch-checked-background']).toBe('#123456');
    expect(variables['--bulud-switch-focus-width']).toBe('3px');

    getHost().style.setProperty('--bulud-switch-checked-background', '#234567');
    expect(
      getComputedStyle(getHost()).getPropertyValue(
        '--bulud-switch-checked-background',
      ),
    ).toContain('#234567');
  });
});
