import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { createBuludThemeVariables } from '../../src/lib/theme/bulud-theme';
import { BuludCheckbox } from './bulud-checkbox';

@Component({
  imports: [BuludCheckbox, ReactiveFormsModule],
  template: `
    <bulud-checkbox
      id="terms"
      [aria-label]="ariaLabel()"
      [disabled]="disabled()"
      [(indeterminate)]="indeterminate"
      [invalid]="explicitInvalid()"
      [required]="required()"
      [formControl]="control"
    >
      Accept terms
    </bulud-checkbox>
    <label for="terms" id="external-label">External label</label>
  `,
})
class TestHost {
  readonly ariaLabel = signal<string | null>(null);
  readonly disabled = signal(false);
  readonly indeterminate = signal(false);
  readonly explicitInvalid = signal(false);
  readonly required = signal(true);
  readonly control = new FormControl(false);
}

describe('BuludCheckbox', () => {
  let fixture: ComponentFixture<TestHost>;

  const getHost = (): HTMLElement =>
    fixture.nativeElement.querySelector('bulud-checkbox');
  const getInput = (): HTMLInputElement => {
    const input = fixture.nativeElement.querySelector('input');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Expected a native checkbox input.');
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

  it('uses a native checkbox with a semantic projected label', () => {
    const input = getInput();
    const label = fixture.nativeElement.querySelector('label');

    expect(input.type).toBe('checkbox');
    expect(input.id).toBe('terms');
    expect(label?.textContent).toContain('Accept terms');
    expect(input.required).toBeTrue();
    expect(input.getAttribute('aria-label')).toBeNull();
    expect(getHost().getAttribute('id')).toBeNull();
  });

  it('forwards the requested id only to the native input for external labels', async () => {
    const input = getInput();
    const externalLabel = fixture.nativeElement.querySelector(
      '#external-label',
    ) as HTMLLabelElement;
    let changes = 0;
    fixture.componentInstance.control.valueChanges.subscribe(() => changes++);

    expect(input.id).toBe('terms');
    expect(externalLabel.htmlFor).toBe('terms');

    externalLabel.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.control.value).toBeTrue();
    expect(changes).toBe(1);
  });

  it('toggles exactly once through native input and label activation', async () => {
    const input = getInput();
    const label = fixture.nativeElement.querySelector('label');

    input.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBeTrue();

    label?.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBeFalse();
  });

  it('supports checked, indeterminate, explicit invalid and aria-label state', async () => {
    const state = fixture.componentInstance;
    state.control.setValue(true);
    state.indeterminate.set(true);
    state.explicitInvalid.set(true);
    state.ariaLabel.set('Accept terms');
    await fixture.whenStable();

    const input = getInput();
    expect(input.checked).toBeTrue();
    expect(input.indeterminate).toBeTrue();
    expect(input.getAttribute('aria-label')).toBe('Accept terms');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(getHost().classList).toContain('bulud-checkbox-host--invalid');
  });

  it('marks the Angular control touched on blur and validates required state', async () => {
    const state = fixture.componentInstance;
    expect(state.control.errors).toEqual({ required: true });

    getInput().focus();
    getInput().blur();
    await fixture.whenStable();
    expect(state.control.touched).toBeTrue();

    state.control.setValue(true);
    await fixture.whenStable();
    expect(state.control.errors).toBeNull();
  });

  it('revalidates when required changes dynamically', async () => {
    const state = fixture.componentInstance;

    expect(state.control.errors).toEqual({ required: true });
    state.required.set(false);
    await fixture.whenStable();
    expect(state.control.errors).toBeNull();

    state.required.set(true);
    await fixture.whenStable();
    expect(state.control.errors).toEqual({ required: true });
  });

  it('synchronizes indeterminate state after native activation', async () => {
    const state = fixture.componentInstance;
    state.indeterminate.set(true);
    await fixture.whenStable();

    const input = getInput();
    let checkedChanges = 0;
    fixture.componentInstance.control.valueChanges.subscribe(
      () => checkedChanges++,
    );
    input.click();
    await fixture.whenStable();

    expect(input.indeterminate).toBeFalse();
    expect(state.indeterminate()).toBeFalse();
    expect(checkedChanges).toBe(1);
  });

  it('does not call the Forms change callback from writeValue', async () => {
    const component = fixture.debugElement.query(By.directive(BuludCheckbox))
      .componentInstance as BuludCheckbox;
    let changeCalls = 0;
    component.registerOnChange(() => changeCalls++);

    component.writeValue(true);
    await fixture.whenStable();

    expect(getInput().checked).toBeTrue();
    expect(changeCalls).toBe(0);
  });

  it('propagates disabled state from both the input and Angular Forms', async () => {
    const state = fixture.componentInstance;
    state.disabled.set(true);
    await fixture.whenStable();
    expect(getInput().disabled).toBeTrue();

    state.disabled.set(false);
    state.control.disable();
    await fixture.whenStable();
    expect(getInput().disabled).toBeTrue();
    expect(getHost().classList).toContain('bulud-checkbox-host--disabled');
  });

  it('resolves configured and instance theme values through CSS variables', async () => {
    const variables = createBuludThemeVariables({
      checkbox: { checkedBackground: '#123456' },
    });
    expect(variables['--bulud-checkbox-checked-background']).toBe('#123456');
    expect(variables['--bulud-checkbox-focus-width']).toBe('3px');
    expect(variables['--bulud-checkbox-focus-offset']).toBe('2px');
    expect(variables['--bulud-checkbox-gap']).toBe('0.625rem');

    getHost().style.setProperty(
      '--bulud-checkbox-checked-background',
      '#234567',
    );
    getHost().style.setProperty('--bulud-checkbox-gap', '1rem');
    expect(
      getComputedStyle(getHost()).getPropertyValue(
        '--bulud-checkbox-checked-background',
      ),
    ).toContain('#234567');
    expect(
      getComputedStyle(getHost()).getPropertyValue('--bulud-checkbox-gap'),
    ).toContain('1rem');
  });

  it('scales checked and indeterminate glyph geometry with checkbox size', async () => {
    const state = fixture.componentInstance;
    const input = getInput();
    getHost().style.setProperty('--bulud-checkbox-size', '2.5rem');

    state.control.setValue(true);
    await fixture.whenStable();
    const checkedGlyph = getComputedStyle(input, '::after');
    expect(checkedGlyph.height).toBe('20px');
    expect(checkedGlyph.width).toBe('10px');

    state.control.setValue(false);
    state.indeterminate.set(true);
    await fixture.whenStable();
    const indeterminateGlyph = getComputedStyle(input, '::after');
    expect(indeterminateGlyph.height).toBe('4px');
    expect(indeterminateGlyph.width).toBe('20px');
  });
});
