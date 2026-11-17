import {
  Component,
  provideZonelessChangeDetection,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  BuludOtp,
  BULUD_OTP_CONFIG,
  BuludOtpTheme,
} from './otp';
@Component({
  imports: [BuludOtp, ReactiveFormsModule],
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection -- Mutable consumer fixture retained by the official Angular 22 migration.
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<bulud-otp layout="separate"
    label="Verification code"
    required
    [length]="length()"
    [formControl]="control"
    [digitMode]="mode()"
    [theme]="theme()"
    (completed)="completed.push($event)"
  />`,
})
class Host {
  readonly control = new FormControl('');
  readonly length = signal(4);
  readonly mode = signal<'ascii' | 'localized'>('localized');
  readonly theme = signal<BuludOtpTheme | undefined>(undefined);
  readonly otp = viewChild.required(BuludOtp);
  readonly completed: string[] = [];
}
describe('BuludOtp form and keyboard contract', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BULUD_OTP_CONFIG,
          useValue: {
            theme: { gap: '3px', width: '30px' },
            defaults: { theme: { gap: '5px' } },
          },
        },
      ],
    }),
  );
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return {
      fixture,
      host: fixture.componentInstance,
      inputs: () =>
        Array.from(
          fixture.nativeElement.querySelectorAll('input'),
        ) as HTMLInputElement[],
    };
  }
  function input(element: HTMLInputElement, value: string) {
    element.value = value;
    element.dispatchEvent(new Event('input'));
  }
  it('renders separately named digit inputs, integrates required validation and advances real focus', async () => {
    const { fixture, host, inputs } = await setup();
    expect(inputs().length).toBe(4);
    expect(host.control.hasError('required')).toBeTrue();
    expect(
      fixture.nativeElement
        .querySelector('[role=group]')
        .getAttribute('aria-label'),
    ).toBe('Verification code');
    inputs().forEach((element, i) =>
      expect(element.getAttribute('aria-label')).toBe(
        'Verification code ' + (i + 1),
      ),
    );
    inputs()[0].focus();
    input(inputs()[0], '۱');
    await fixture.whenStable();
    expect(host.control.value).toBe('1');
    expect(document.activeElement).toBe(inputs()[1]);
    expect(host.completed).toEqual([]);
    for (let i = 1; i < 4; i++) input(inputs()[i], String(i + 1));
    await fixture.whenStable();
    expect(host.control.value).toBe('1234');
    expect(host.control.valid).toBeTrue();
    expect(host.completed).toEqual(['1234']);
  });
  it('pastes at the focused digit, filters characters and preserves the existing middle-input focus', async () => {
    const { fixture, host, inputs } = await setup();
    host.control.setValue('1');
    await fixture.whenStable();
    inputs()[1].focus();
    const data = new DataTransfer();
    data.setData('text', '۲a٣۴۵');
    inputs()[1].dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, cancelable: true }),
    );
    await fixture.whenStable();
    expect(inputs().map((el) => el.value)).toEqual(['1', '2', '3', '4']);
    expect(host.control.value).toBe('1234');
    expect(document.activeElement).toBe(inputs()[1]);
    expect(host.completed).toEqual(['1234']);
  });
  it('keeps ASCII-only compatibility and handles backspace in populated and empty cells', async () => {
    const { fixture, host, inputs } = await setup();
    host.mode.set('ascii');
    await fixture.whenStable();
    input(inputs()[0], '۱');
    await fixture.whenStable();
    expect(host.control.value).toBe('');
    host.control.setValue('12');
    await fixture.whenStable();
    inputs()[1].focus();
    inputs()[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true }),
    );
    await fixture.whenStable();
    expect(host.control.value).toBe('1');
    inputs()[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true }),
    );
    await fixture.whenStable();
    expect(host.control.value).toBe('');
    expect(document.activeElement).toBe(inputs()[0]);
  });
  it('reacts to external values, length changes and reset without emitting completion', async () => {
    const { fixture, host, inputs } = await setup();
    host.control.setValue('123');
    await fixture.whenStable();
    expect(host.control.hasError('otp')).toBeTrue();
    host.length.set(3);
    await fixture.whenStable();
    expect(inputs().length).toBe(3);
    expect(host.control.valid).toBeTrue();
    host.length.set(0);
    await fixture.whenStable();
    expect(host.control.hasError('otpLengthConfig')).toBeTrue();
    expect(inputs().length).toBe(0);
    host.length.set(4);
    host.control.reset();
    await fixture.whenStable();
    expect(inputs().map((el) => el.value)).toEqual(['', '', '', '']);
    expect(host.completed).toEqual([]);
  });
  it('disables every native input through Angular forms and clear resets form and touched state', async () => {
    const { fixture, host, inputs } = await setup();
    host.control.setValue('1234');
    host.control.disable();
    await fixture.whenStable();
    expect(inputs().every((el) => el.disabled)).toBeTrue();
    expect(inputs()[0].autocomplete).toBe('one-time-code');
    input(inputs()[0], '8');
    await fixture.whenStable();
    expect(host.control.value).toBe('1234');
    host.control.enable();
    host.otp().clear();
    await fixture.whenStable();
    expect(host.control.value).toBe('');
    expect(host.control.touched).toBeTrue();
    expect(inputs().every((el) => el.value === '')).toBeTrue();
  });
  it('resolves theme through global, component defaults and instance, then restores fallback', async () => {
    const { fixture, host } = await setup();
    const element = fixture.nativeElement.querySelector(
      'bulud-otp',
    ) as HTMLElement;
    expect(element.style.getPropertyValue('--bulud-otp-width')).toBe(
      '30px',
    );
    expect(element.style.getPropertyValue('--bulud-otp-gap')).toBe(
      '5px',
    );
    host.theme.set({ gap: '9px' });
    await fixture.whenStable();
    expect(element.style.getPropertyValue('--bulud-otp-gap')).toBe(
      '9px',
    );
    host.theme.set(undefined);
    await fixture.whenStable();
    expect(element.style.getPropertyValue('--bulud-otp-gap')).toBe(
      '5px',
    );
  });
});
