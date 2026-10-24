import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BuludOtp } from './otp';
@Component({
  imports: [BuludOtp, ReactiveFormsModule],
  template: `<bulud-otp
    label="Code"
    required
    [length]="length"
    [formControl]="control"
  />`,
})
class Host {
  control = new FormControl('');
  length = 6;
}
describe('BuludOtp', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('normalizes Persian/Arabic pasted digits, integrates CVA and emits only complete codes', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    expect(f.componentInstance.control.hasError('required')).toBeTrue();
    input.value = '۱۲٣۴۵۶';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new FocusEvent('blur'));
    await f.whenStable();
    expect(input.value).toBe('123456');
    expect(f.componentInstance.control.value).toBe('123456');
    expect(f.componentInstance.control.valid).toBeTrue();
    expect(f.componentInstance.control.touched).toBeTrue();
  });
  it('rejects malformed external values and reacts to length changes and reset', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    f.componentInstance.control.setValue('123');
    await f.whenStable();
    expect(f.componentInstance.control.hasError('otp')).toBeTrue();
    f.componentInstance.length = 3;
    f.changeDetectorRef.markForCheck();
    await f.whenStable();
    expect(f.componentInstance.control.valid).toBeTrue();
    f.componentInstance.length = 0;
    f.changeDetectorRef.markForCheck();
    await f.whenStable();
    expect(f.componentInstance.control.hasError('otpLengthConfig')).toBeTrue();
    f.componentInstance.control.reset();
    await f.whenStable();
    expect(f.nativeElement.querySelector('input').value).toBe('');
  });
  it('disables the actual autofill-capable input through Angular Forms', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    f.componentInstance.control.disable();
    await f.whenStable();
    expect(f.nativeElement.querySelector('input').disabled).toBeTrue();
    expect(f.nativeElement.querySelector('input').autocomplete).toBe(
      'one-time-code',
    );
  });
});
