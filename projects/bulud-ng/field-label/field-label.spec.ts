import { Type } from '@angular/core';
import { BuludOtp } from 'bulud-ng/otp';
import { BuludRating } from 'bulud-ng/rating';
import { BuludFileUpload } from 'bulud-ng/file-upload';
import { BuludPeriodPicker } from 'bulud-ng/period-picker';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { buludRequiredText } from 'bulud-ng/validators';
import { BuludFieldLabel } from './field-label';
describe('Automatic required label', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('keeps stars for valid required values and reacts to validator changes/control replacement', async () => {
    const f = TestBed.createComponent(BuludFieldLabel);
    const control = new FormControl('', Validators.required);
    f.componentRef.setInput('control', control);
    await f.whenStable();
    expect(f.nativeElement.querySelector('.marker')).not.toBeNull();
    control.setValue('Valid');
    await f.whenStable();
    expect(f.nativeElement.querySelector('.marker')).not.toBeNull();
    control.clearValidators();
    control.updateValueAndValidity();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.marker')).toBeNull();
    f.componentRef.setInput(
      'control',
      new FormControl('Name', buludRequiredText),
    );
    await f.whenStable();
    expect(f.nativeElement.querySelector('.marker')).not.toBeNull();
    f.componentRef.setInput('required', false);
    await f.whenStable();
    expect(f.nativeElement.querySelector('.marker')).toBeNull();
    f.destroy();
  });
  it('recognizes requiredTrue and supports explicit required for opaque rules', async () => {
    const f = TestBed.createComponent(BuludFieldLabel);
    f.componentRef.setInput(
      'control',
      new FormControl(true, Validators.requiredTrue),
    );
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('.marker').getAttribute('aria-hidden'),
    ).toBe('true');
    f.componentRef.setInput('control', null);
    f.componentRef.setInput('required', true);
    await f.whenStable();
    expect(f.nativeElement.querySelector('.marker')).not.toBeNull();
    f.destroy();
  });
  for (const type of [
    BuludOtp,
    BuludRating,
    BuludFileUpload,
    BuludPeriodPicker,
  ])
    it(`renders ${type.name} required metadata automatically`, async () => {
      const f = TestBed.createComponent(type as Type<unknown>);
      f.componentRef.setInput('label', 'Example');
      await f.whenStable();
      expect(f.nativeElement.querySelector('.marker')).toBeNull();
      f.componentRef.setInput('required', true);
      await f.whenStable();
      expect(
        f.nativeElement.querySelector('.marker').getAttribute('aria-hidden'),
      ).toBe('true');
      f.componentRef.setInput('required', false);
      await f.whenStable();
      expect(f.nativeElement.querySelector('.marker')).toBeNull();
      f.destroy();
    });
});
