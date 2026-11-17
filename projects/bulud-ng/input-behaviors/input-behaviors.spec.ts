import {
  Component,
  provideZonelessChangeDetection,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  BuludOnlyNumbers,
  BuludNumberSeparator,
  BuludMaxLength,
  BuludInputFilter,
  BuludInputMask,
  BuludEnglishKeyboard,
  BuludButtonLoader,
  BuludButtonLoaderTheme,
  BULUD_INPUT_BEHAVIORS_CONFIG,
} from './public-api';
@Component({
  imports: [
    ReactiveFormsModule,
    BuludOnlyNumbers,
    BuludNumberSeparator,
    BuludMaxLength,
    BuludInputFilter,
    BuludInputMask,
    BuludEnglishKeyboard,
    BuludButtonLoader,
  ],
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection -- Mutable consumer fixture retained by the official Angular 22 migration.
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<input
      id="numbers"
      buludOnlyNumbers
      [decimalPlaces]="decimals()"
      [formControl]="numberControl"
    />
    <input
      id="separator"
      buludNumberSeparator
      [decimalPlaces]="decimals()"
      [formControl]="separatorControl"
    />
    <input id="length" [buludMaxLength]="3" />
    <input id="filter" buludInputFilter="[A-Z]" />
    <input
      id="mask"
      [buludInputMask]="mask()"
      [attr.aria-label]="maskLabel()"
    />
    <input
      id="keyboard"
      buludEnglishKeyboard
      (buludEnglishKeyboardChange)="converted.push($event)"
    />
    <button [buludButtonLoader]="loading()" [theme]="theme()">
      <span>Submit</span>
    </button>`,
})
class Host {
  readonly mask = signal('00-00');
  readonly maskLabel = signal<string | null>(null);
  readonly numberControl = new FormControl('');
  readonly separatorControl = new FormControl<number | null>(null);
  readonly decimals = signal(2);
  readonly converted: string[] = [];
  readonly loading = signal(false);
  readonly theme = signal<BuludButtonLoaderTheme | undefined>(undefined);
}
describe('BuludInputBehaviors native controls and form integration', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BULUD_INPUT_BEHAVIORS_CONFIG,
          useValue: {
            buttonLoader: {
              theme: { size: '18px', stroke: '2px' },
              defaults: { theme: { size: '22px' } },
            },
          },
        },
      ],
    }),
  );
  async function setup() {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    return {
      f,
      host: f.componentInstance,
      input: (id: string) =>
        f.nativeElement.querySelector('#' + id) as HTMLInputElement,
    };
  }
  function enter(
    element: HTMLInputElement,
    value: string,
    caret = value.length,
  ) {
    element.value = value;
    element.setSelectionRange(caret, caret);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
  it('keeps numeric form values and reacts to decimal limits', async () => {
    const { f, host, input } = await setup();
    enter(input('numbers'), '12.345');
    await f.whenStable();
    expect(input('numbers').value).toBe('12.34');
    expect(host.numberControl.value).toBe('12.34');
    host.decimals.set(0);
    await f.whenStable();
    enter(input('numbers'), '1a2.3');
    await f.whenStable();
    expect(input('numbers').value).toBe('123');
    expect(host.numberControl.value).toBe('123');
  });
  it('groups numeric form values while retaining fractions, caret, null and disabled/touched contracts', async () => {
    const { f, host, input } = await setup();
    const element = input('separator');
    enter(element, '12345.678', 4);
    await f.whenStable();
    expect(element.value).toBe('12,345.67');
    expect(host.separatorControl.value).toBe(12345.67);
    expect(element.selectionStart).toBe(5);
    element.dispatchEvent(new FocusEvent('blur'));
    await f.whenStable();
    expect(host.separatorControl.touched).toBeTrue();
    host.separatorControl.disable();
    await f.whenStable();
    expect(element.disabled).toBeTrue();
    host.separatorControl.enable();
    host.separatorControl.reset();
    await f.whenStable();
    expect(element.value).toBe('');
    enter(element, '.');
    await f.whenStable();
    expect(host.separatorControl.value).toBeNull();
  });
  it('skips grouping separators for both delete directions while preserving selected ranges', async () => {
    const { host, f, input } = await setup();
    host.separatorControl.setValue(1234);
    await f.whenStable();
    const element = input('separator');
    element.setSelectionRange(2, 2);
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    expect(element.selectionStart).toBe(1);
    element.setSelectionRange(1, 1);
    element.dispatchEvent(
      new InputEvent('beforeinput', { inputType: 'deleteContentForward' }),
    );
    expect(element.selectionStart).toBe(2);
    element.setSelectionRange(0, 3);
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    expect(element.selectionStart).toBe(0);
    expect(element.selectionEnd).toBe(3);
  });
  it('prevents excess keypresses but permits replacement of selected text', async () => {
    const { input } = await setup();
    const element = input('length');
    element.value = '123';
    element.setSelectionRange(3, 3);
    const blocked = new KeyboardEvent('keypress', {
      key: '4',
      cancelable: true,
    });
    element.dispatchEvent(blocked);
    expect(blocked.defaultPrevented).toBeTrue();
    element.setSelectionRange(0, 2);
    const replacement = new KeyboardEvent('keypress', {
      key: '4',
      cancelable: true,
    });
    element.dispatchEvent(replacement);
    expect(replacement.defaultPrevented).toBeFalse();
  });
  it('preserves the existing regex keypress and literal input replacement contract', async () => {
    const { input } = await setup();
    const element = input('filter');
    const blocked = new KeyboardEvent('keypress', {
      key: 'a',
      cancelable: true,
    });
    element.dispatchEvent(blocked);
    expect(blocked.defaultPrevented).toBeTrue();
    const allowed = new KeyboardEvent('keypress', {
      key: 'A',
      cancelable: true,
    });
    element.dispatchEvent(allowed);
    expect(allowed.defaultPrevented).toBeFalse();
    enter(element, 'x[A-Z]y');
    expect(element.value).toBe('xy');
  });
  it('applies the fixed digit mask and existing delete-last/caret behavior', async () => {
    const { input } = await setup();
    const element = input('mask');
    expect(element.placeholder).toBe('00-00');
    enter(element, '12345');
    expect(element.value).toBe('12-34');
    element.setSelectionRange(5, 5);
    const back = new KeyboardEvent('keydown', {
      key: 'Backspace',
      cancelable: true,
    });
    element.dispatchEvent(back);
    expect(back.defaultPrevented).toBeTrue();
    expect(element.value).toBe('12-3 ');
    expect(element.selectionStart).toBe(4);
  });
  it('preserves application-owned accessible names when the mask changes dynamically', async () => {
    const { f, host, input } = await setup();
    expect(input('mask').getAttribute('aria-label')).toBe(
      'Input with mask format 00-00',
    );
    host.maskLabel.set('شماره حساب');
    await f.whenStable();
    host.mask.set('000-000');
    await f.whenStable();
    expect(input('mask').getAttribute('aria-label')).toBe('شماره حساب');
    expect(input('mask').placeholder).toBe('000-000');
  });
  it('converts Persian/Arabic keyboard and digits with repeated caret restoration at the same position', async () => {
    const { f, host, input } = await setup();
    const element = input('keyboard');
    element.focus();
    enter(element, 'ش۱a', 1);
    await f.whenStable();
    expect(element.value).toBe('A1A');
    expect(element.selectionStart).toBe(1);
    enter(element, 'ش۲a', 1);
    await f.whenStable();
    expect(element.value).toBe('A2A');
    expect(element.selectionStart).toBe(1);
    expect(host.converted).toEqual(['A1A', 'A2A']);
  });
  it('adds/removes one spinner without replacing or disabling button content and cleans up', async () => {
    const { f, host } = await setup();
    const button = f.nativeElement.querySelector('button') as HTMLButtonElement;
    const content = button.querySelector('span');
    host.loading.set(true);
    await f.whenStable();
    const spinner = button.querySelector('i') as HTMLElement;
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
    expect(button.disabled).toBeFalse();
    expect(button.querySelector('span')).toBe(content);
    host.loading.set(false);
    await f.whenStable();
    expect(button.querySelector('i')).toBeNull();
    host.loading.set(true);
    await f.whenStable();
    expect(button.querySelectorAll('i').length).toBe(1);
    f.destroy();
    expect(spinner.parentElement).toBeNull();
  });
  it('resolves spinner theme precedence and restores component defaults when overrides are removed', async () => {
    const { f, host } = await setup();
    host.loading.set(true);
    await f.whenStable();
    const spinner = f.nativeElement.querySelector('button i') as HTMLElement;
    expect(spinner.style.getPropertyValue('--bulud-button-loader-size')).toBe(
      '22px',
    );
    expect(spinner.style.getPropertyValue('--bulud-button-loader-stroke')).toBe(
      '2px',
    );
    host.theme.set({ size: '30px' });
    await f.whenStable();
    expect(spinner.style.getPropertyValue('--bulud-button-loader-size')).toBe(
      '30px',
    );
    host.theme.set(undefined);
    await f.whenStable();
    expect(spinner.style.getPropertyValue('--bulud-button-loader-size')).toBe(
      '22px',
    );
  });
});
