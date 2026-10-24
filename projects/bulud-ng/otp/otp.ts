import { BuludFieldLabel } from 'bulud-ng/field-label';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
export function normalizeBuludOtp(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (char) =>
    String(char.charCodeAt(0) - (char >= '۰' ? 1776 : 1632)),
  );
}
@Component({
  imports: [BuludFieldLabel],
  selector: 'bulud-otp',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './otp.scss',
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
  host: { '[style]': 'styles()' },
  template: `<label
    ><span buludFieldLabel [required]="required()">{{ label() }}</span
    ><input
      dir="ltr"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      spellcheck="false"
      [value]="display()"
      [disabled]="isDisabled()"
      [required]="required()"
      [attr.aria-invalid]="invalid() || null"
      [attr.aria-describedby]="describedBy() || null"
      [attr.maxlength]="validLength() ? length() : null"
      (input)="change($event)"
      (blur)="onTouched()"
  /></label>`,
})
export class BuludOtp implements ControlValueAccessor, Validator {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly label = input.required<string>();
  readonly describedBy = input<string>();
  readonly length = input(6);
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  readonly completed = output<string>();
  private readonly value = signal<unknown>('');
  private readonly formDisabled = signal(false);
  protected readonly display = computed(() =>
    typeof this.value() === 'string' ? (this.value() as string) : '',
  );
  protected readonly validLength = computed(
    () =>
      Number.isSafeInteger(this.length()) &&
      this.length() >= 1 &&
      this.length() <= 32,
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.formDisabled(),
  );
  protected readonly styles = computed(() =>
    buludSharedUiStyles('otp', this.config, this.theme()),
  );
  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};
  private validatorChange: () => void = () => {};
  constructor() {
    effect(() => {
      this.length();
      this.required();
      this.validatorChange();
    });
  }
  writeValue(value: unknown): void {
    this.value.set(value);
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
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
  validate(): ValidationErrors | null {
    if (!this.validLength()) return { otpLengthConfig: true };
    const value = this.value();
    if (value == null || value === '')
      return this.required() ? { required: true } : null;
    return typeof value === 'string' &&
      new RegExp(`^[0-9]{${this.length()}}$`).test(value)
      ? null
      : { otp: { length: this.length() } };
  }
  protected change(event: Event): void {
    if (this.isDisabled()) return;
    const el = event.target as HTMLInputElement;
    const value = normalizeBuludOtp(el.value)
      .replace(/[^0-9]/g, '')
      .slice(0, this.validLength() ? this.length() : 32);
    el.value = value;
    this.value.set(value);
    this.onChange(value);
    if (value.length === this.length() && this.validLength())
      this.completed.emit(value);
  }
}
