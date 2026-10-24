import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BuludRadio, BuludRadioGroup, BuludRadioValue } from './bulud-radio';

@Component({
  imports: [ReactiveFormsModule, BuludRadio, BuludRadioGroup],
  template: `<bulud-radio-group
    [formControl]="control"
    requireOption
    aria-errormessage="plan-error"
    required
    aria-label="Plan"
    ><bulud-radio [value]="0">Zero</bulud-radio
    ><bulud-radio value="pro">Pro</bulud-radio
    ><bulud-radio value="off" disabled>Disabled</bulud-radio></bulud-radio-group
  >`,
})
class RadioHost {
  readonly control = new FormControl<BuludRadioValue | null>(null);
}

describe('BuludRadioGroup', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('uses a shared native name, projected labels and one selected value', async () => {
    const f = TestBed.createComponent(RadioHost);
    await f.whenStable();
    const radios = [
      ...f.nativeElement.querySelectorAll('input'),
    ] as HTMLInputElement[];
    expect(new Set(radios.map((r) => r.name)).size).toBe(1);
    expect(radios[2].disabled).toBeTrue();
    expect(f.nativeElement.querySelector('label').htmlFor).toBe(radios[0].id);
    radios[0].click();
    await f.whenStable();
    expect(f.componentInstance.control.value).toBe(0);
    expect(f.componentInstance.control.valid).toBeTrue();
    radios[1].click();
    await f.whenStable();
    expect(f.componentInstance.control.value).toBe('pro');
    expect(radios[0].checked).toBeFalse();
    expect(radios[1].checked).toBeTrue();
  });
  it('propagates form reset, disabled and required state', async () => {
    const f = TestBed.createComponent(RadioHost);
    await f.whenStable();
    const c = f.componentInstance.control;
    expect(c.hasError('required')).toBeTrue();
    c.setValue('pro');
    await f.whenStable();
    c.disable();
    await f.whenStable();
    expect(
      [...f.nativeElement.querySelectorAll('input')].every(
        (i) => (i as HTMLInputElement).disabled,
      ),
    ).toBeTrue();
    c.enable();
    c.reset();
    await f.whenStable();
    expect(c.hasError('required')).toBeTrue();
    expect(
      [...f.nativeElement.querySelectorAll('input')].every(
        (i) => !(i as HTMLInputElement).checked,
      ),
    ).toBeTrue();
  });
  it('does not report programmatic writes as user changes, and notifies on blur', async () => {
    const f = TestBed.createComponent(BuludRadioGroup);
    await f.whenStable();
    const c = f.componentInstance;
    const change = jasmine.createSpy('change');
    const touch = jasmine.createSpy('touch');
    c.registerOnChange(change);
    c.registerOnTouched(touch);
    c.writeValue(0);
    expect(change).not.toHaveBeenCalled();
    expect(c.validate()).toBeNull();
    c.select('pro');
    c.select('pro');
    c.touch();
    expect(change).toHaveBeenCalledOnceWith('pro');
    expect(touch).toHaveBeenCalledTimes(1);
  });
  it('reacts to required changes and supports numeric zero', async () => {
    const f = TestBed.createComponent(BuludRadioGroup);
    const validate = jasmine.createSpy('validator');
    f.componentInstance.registerOnValidatorChange(validate);
    f.componentRef.setInput('required', true);
    await f.whenStable();
    expect(validate).toHaveBeenCalled();
    expect(f.componentInstance.validate()).toEqual({ required: true });
    f.componentInstance.writeValue(0);
    expect(f.componentInstance.validate()).toBeNull();
  });
  it('validates membership without losing the supplied value and exposes the error relationship', async () => {
    const f = TestBed.createComponent(RadioHost);
    await f.whenStable();
    const c = f.componentInstance.control;
    c.setValue('missing');
    await f.whenStable();
    expect(c.hasError('option')).toBeTrue();
    expect(c.value).toBe('missing');
    expect(
      f.nativeElement
        .querySelector('bulud-radio-group')
        .getAttribute('aria-errormessage'),
    ).toBe('plan-error');
    c.setValue(0);
    await f.whenStable();
    expect(c.valid).toBeTrue();
  });
});
