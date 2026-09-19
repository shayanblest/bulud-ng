import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgControl,
  ValidationErrors,
  Validator,
} from '@angular/forms';

let nextCheckboxId = 0;

/**
 * A native checkbox form control with projected label content.
 *
 * The native input owns keyboard and label activation, while this component
 * supplies typed Angular Forms integration and shared Bulud theming.
 */
@Component({
  selector: 'bulud-checkbox',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BuludCheckbox),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BuludCheckbox),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bulud-checkbox-host',
    '[attr.id]': 'null',
    '[class.bulud-checkbox-host--disabled]': 'isDisabled()',
    '[class.bulud-checkbox-host--invalid]': 'isInvalid()',
  },
  templateUrl: './bulud-checkbox.html',
  styleUrl: './bulud-checkbox.scss',
})
export class BuludCheckbox implements ControlValueAccessor, Validator {
  private readonly injector = inject(Injector);
  private readonly formDisabled = signal(false);
  private readonly generatedId = `bulud-checkbox-${nextCheckboxId++}`;
  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  constructor() {
    effect(() => {
      this.required();
      this.onValidatorChange();
    });
  }

  /** Current checked value. Use `[(checked)]` for controlled component state. */
  readonly checked = model(false);

  /** Native mixed state; two-way binding synchronizes native activation. */
  readonly indeterminate = model(false);

  /** Prevents interaction with the checkbox. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Adds the native required semantics and Forms required validation. */
  readonly required = input(false, { transform: booleanAttribute });

  /** Explicit invalid state for consumers not using Angular Forms. */
  readonly invalid = input(false, { transform: booleanAttribute });

  /** Optional native id for external labels and automated testing. */
  readonly id = input<string | null>(null);
  protected readonly inputId = computed(() => this.id() ?? this.generatedId);

  /** Optional accessible name when projected content is not the label. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  protected isDisabled(): boolean {
    return this.disabled() || this.formDisabled();
  }

  protected isInvalid(): boolean {
    const control = this.injector.get(NgControl, null, {
      self: true,
      optional: true,
    })?.control;
    return (
      this.invalid() ||
      Boolean(control?.invalid && (control.touched || control.dirty))
    );
  }

  protected handleChange(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    this.indeterminate.set(false);
    this.checked.set(input.checked);
    this.onChange(input.checked);
  }

  protected handleBlur(): void {
    this.onTouched();
  }

  writeValue(value: boolean | null): void {
    this.checked.set(value === true);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  validate(): ValidationErrors | null {
    return this.required() && !this.checked() ? { required: true } : null;
  }
}
