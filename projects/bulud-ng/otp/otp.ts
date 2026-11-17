import { BuludFieldLabel } from 'bulud-ng/field-label';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  inject,
  InjectionToken,
  input,
  output,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
export interface BuludOtpTheme extends Partial<BuludSharedUiTheme> {
  readonly background?: string;
  readonly foreground?: string;
  readonly border?: string;
  readonly error?: string;
  readonly focus?: string;
  readonly radius?: string;
  readonly width?: string;
  readonly gap?: string;
  readonly padding?: string;
}
export interface BuludOtpConfig {
  readonly theme?: BuludOtpTheme;
  readonly defaults?: { readonly theme?: BuludOtpTheme };
}
export const BULUD_OTP_CONFIG = new InjectionToken<BuludOtpConfig>(
  'BULUD_OTP_CONFIG',
  { providedIn: 'root', factory: () => ({}) },
);
export function normalizeBuludOtp(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (char) =>
    String(char.charCodeAt(0) - (char >= '۰' ? 1776 : 1632)),
  );
}
@Component({
  selector: 'bulud-otp',
  standalone: true,
  imports: [BuludFieldLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './otp.css',
  host: {
    '[style]': 'styles()',
    '[class.bulud-otp--unstyled]': 'unstyled()',
    '[class.bulud-otp--separate]': "layout()==='separate'",
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BuludOtp),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BuludOtp),
      multi: true,
    },
  ],
  template:
    '@if(layout()===\'single\'){<label\n    ><span buludFieldLabel [required]="required()">{{ label() }}</span\n    ><input\n [attr.id]="inputId()"\n      dir="ltr"\n      type="text"\n      inputmode="numeric"\n      autocomplete="one-time-code"\n      spellcheck="false"\n      [value]="display()"\n      [disabled]="isDisabled()"\n      [required]="required()"\n      [attr.aria-invalid]="invalid() || null"\n      [attr.aria-describedby]="describedBy() || null"\n      [attr.maxlength]="validLength() ? length() : null"\n      (input)="changeSingle($event)"\n      (blur)="singleBlur()"\n  /></label>}@else{<div\n    class="bulud-otp-group"\n    [class]="containerClass()"\n    role="group"\n    [attr.aria-label]="label()"\n  >\n    @for (digit of digits(); track $index; let i = $index) {\n      <input\n        #digitInput\n [attr.id]="inputId() ? inputId() + \'_\' + (i + 1) : null"\n        type="text"\n        maxlength="1"\n        inputmode="numeric"\n        pattern="[0-9]*"\n        class="bulud-otp-digit"\n        [class]="inputClass()"\n        [class.is-invalid]="digitInvalid(i)"\n        [attr.aria-invalid]="digitInvalid(i) || null"\n        [attr.aria-label]="label() + \' \' + (i + 1)"\n        [disabled]="isDisabled()"\n        [value]="digit"\n        [autocomplete]="autocomplete()"\n        spellcheck="false"\n        (input)="change($event, i)"\n        (keydown)="keydown($event, i)"\n        (focus)="focus(i)"\n        (blur)="blur(i)"\n        (paste)="paste($event)"\n      />\n    }\n  </div>}',
})
export class BuludOtp implements ControlValueAccessor, Validator {
  /** Project-owned native control identifier; no prefix normalization. */
  readonly inputId = input<string | null>(null);
  private readonly config = inject(BULUD_OTP_CONFIG);
  readonly layout = input<'single' | 'separate'>('single');
  readonly describedBy = input<string>();
  readonly label = input.required<string>();
  readonly length = input(6);
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly digitMode = input<'ascii' | 'localized'>('localized');
  readonly touchOnBlur = input(true, { transform: booleanAttribute });
  readonly autocomplete = input('one-time-code');
  readonly unstyled = input(false, { transform: booleanAttribute });
  /** Consumer-owned CSS hooks; they do not generate Tailwind utility names. */
  readonly containerClass = input('');
  readonly inputClass = input('');
  readonly theme = input<BuludOtpTheme>();
  readonly completed = output<string>();
  private readonly currentValue = signal<unknown>('');
  private readonly formDisabled = signal(false);
  protected readonly digits = signal<readonly string[]>([]);
  private readonly touched = signal<readonly boolean[]>([]);
  private readonly inputs =
    viewChildren<ElementRef<HTMLInputElement>>('digitInput');
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private validatorChange: () => void = () => {};
  protected readonly isDisabled = computed(
    () => this.disabled() || this.formDisabled(),
  );
  protected readonly validLength = computed(
    () =>
      Number.isSafeInteger(this.length()) &&
      this.length() >= 1 &&
      this.length() <= 32,
  );
  private readonly sharedConfig = inject(BULUD_SHARED_UI_CONFIG);
  protected readonly display = computed(() =>
    typeof this.currentValue() === 'string'
      ? (this.currentValue() as string)
      : '',
  );
  protected readonly styles = computed(() => {
    const styles: Record<string, string> = {
      ...buludSharedUiStyles('otp', this.sharedConfig, undefined),
    };
    for (const layer of [
      this.config.theme,
      this.config.defaults?.theme,
      this.theme(),
    ])
      for (const [key, value] of Object.entries(layer ?? {}))
        if (value !== undefined)
          styles[
            '--bulud-otp-' +
              key.replace(/[A-Z]/g, (char) => '-' + char.toLowerCase())
          ] = value;
    return styles;
  });
  constructor() {
    effect(() => {
      this.length();
      untracked(() => this.writeDigits(this.currentValue()));
    });
    effect(() => {
      this.length();
      this.required();
      this.validatorChange();
    });
  }
  private writeDigits(value: unknown): void {
    const length = this.validLength() ? this.length() : 0,
      text = typeof value === 'string' ? value : '';
    this.digits.set(Array.from({ length }, (_, i) => text[i] ?? ''));
    this.touched.set(Array.from({ length }, () => !!text));
  }
  writeValue(value: unknown): void {
    this.currentValue.set(value);
    this.writeDigits(value);
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange = fn;
  }
  setDisabledState(value: boolean): void {
    this.formDisabled.set(value);
  }
  validate(): ValidationErrors | null {
    if (!this.validLength()) return { otpLengthConfig: true };
    const value = this.currentValue();
    if (value === null || value === undefined || value === '')
      return this.required() ? { required: true } : null;
    return typeof value === 'string' &&
      new RegExp('^[0-9]{' + this.length() + '}$').test(value)
      ? null
      : { otp: { length: this.length() } };
  }
  protected digitInvalid(index: number): boolean {
    return this.invalid() || (!!this.touched()[index] && !this.digits()[index]);
  }
  private touch(index: number): void {
    this.touched.update((values) =>
      values.map((value, i) => (i === index ? true : value)),
    );
  }
  private normalize(value: string): string {
    return (
      this.digitMode() === 'ascii' ? value : normalizeBuludOtp(value)
    ).replace(/[^0-9]/g, '');
  }
  private emit(): void {
    const value = this.digits().join('');
    this.currentValue.set(value);
    this.onChange(value);
    if (
      this.validLength() &&
      value.length === this.length() &&
      !this.digits().includes('')
    )
      this.completed.emit(value);
  }
  protected singleBlur(): void {
    this.onTouched();
  }
  protected changeSingle(event: Event): void {
    if (this.isDisabled()) return;
    const element = event.target as HTMLInputElement;
    const value = this.normalize(element.value).slice(
      0,
      this.validLength() ? this.length() : 32,
    );
    element.value = value;
    this.writeDigits(value);
    this.emit();
  }
  protected change(event: Event, index: number): void {
    if (this.isDisabled()) return;
    const input = event.target as HTMLInputElement,
      value = this.normalize(input.value)[0] ?? '';
    this.digits.update((values) =>
      values.map((digit, i) => (i === index ? value : digit)),
    );
    this.touch(index);
    if (value && index < this.length() - 1)
      this.inputs()[index + 1]?.nativeElement.focus();
    this.emit();
    input.value = value;
  }
  protected keydown(event: KeyboardEvent, index: number): void {
    if (this.isDisabled() || event.key !== 'Backspace') return;
    this.touch(index);
    const previous = !this.digits()[index] && index > 0,
      indexToClear = previous ? index - 1 : index;
    if (previous) {
      this.inputs()[index - 1]?.nativeElement.focus();
      this.touch(index - 1);
    }
    this.digits.update((values) =>
      values.map((digit, i) => (i === indexToClear ? '' : digit)),
    );
    this.emit();
    event.preventDefault();
  }
  protected focus(index: number): void {
    this.inputs()[index]?.nativeElement.setSelectionRange(0, 0);
  }
  protected blur(index: number): void {
    this.touch(index);
    if (this.touchOnBlur()) this.onTouched();
  }
  protected paste(event: ClipboardEvent): void {
    if (this.isDisabled()) return;
    event.preventDefault();
    const digits = this.normalize(event.clipboardData?.getData('text') ?? '');
    if (!digits) return;
    const inputs = this.inputs(),
      active = inputs.findIndex(
        (input) =>
          input.nativeElement ===
          input.nativeElement.ownerDocument.activeElement,
      );
    let index = active >= 0 ? active : 0;
    const values = [...this.digits()],
      touched = [...this.touched()];
    for (const digit of digits) {
      if (index >= this.length()) break;
      values[index] = digit;
      touched[index] = true;
      index++;
    }
    this.digits.set(values);
    this.touched.set(touched);
    this.emit();
    if (index < this.length()) inputs[index]?.nativeElement.focus();
    else inputs[this.length() - 1]?.nativeElement.blur();
  }
  clear(): void {
    this.currentValue.set('');
    this.digits.set(Array(this.validLength() ? this.length() : 0).fill(''));
    this.touched.set(this.digits().map(() => false));
    this.onChange('');
    this.onTouched();
    for (const input of this.inputs()) input.nativeElement.value = '';
  }
}
