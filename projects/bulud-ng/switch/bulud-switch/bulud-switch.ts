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
  output,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgControl,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { defer, EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';

let nextSwitchId = 0;

/** A native, form-ready switch with projected accessible label content. */
@Component({
  selector: 'bulud-switch',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BuludSwitch),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BuludSwitch),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bulud-switch-host',
    '[attr.id]': 'null',
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
    '[attr.aria-errormessage]': 'null',
    '[class.bulud-switch-host--disabled]': 'isDisabled()',
    '[class.bulud-switch-host--invalid]': 'isInvalid()',
  },
  templateUrl: './bulud-switch.html',
  styleUrl: './bulud-switch.scss',
})
export class BuludSwitch implements ControlValueAccessor, Validator {
  private readonly injector = inject(Injector);
  private readonly formDisabled = signal(false);
  private readonly formConnected = signal(false);
  protected readonly viewChecked = signal(false);
  private readonly formBindingVersion = signal<number | null>(null);
  private formBindingCount = 0;
  private readonly formEvents = toSignal(
    toObservable(this.formBindingVersion).pipe(
      switchMap((version) =>
        version === null
          ? EMPTY
          : defer(() => this.getFormControl()?.events ?? EMPTY),
      ),
    ),
    { initialValue: null },
  );
  private readonly generatedId = `bulud-switch-${nextSwitchId++}`;
  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  constructor() {
    effect(() => {
      if (!this.formConnected()) {
        this.viewChecked.set(this.checked());
      }
    });
    effect(() => {
      this.required();
      this.onValidatorChange();
    });
  }

  /** Current switch value. Use `[(checked)]` for controlled state. */
  readonly checked = input(false, { transform: booleanAttribute });

  /** Emits once when the user changes the native switch. */
  readonly checkedChange = output<boolean>();

  /** Prevents interaction with the switch. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Enables required validation for the on state. */
  readonly required = input(false, { transform: booleanAttribute });

  /** Explicit invalid state for consumers not using Angular Forms. */
  readonly invalid = input(false, { transform: booleanAttribute });

  /** Optional native id for external labels and automated testing. */
  readonly id = input<string | null>(null);
  protected readonly inputId = computed(() => this.id() ?? this.generatedId);

  /** Optional accessible name when projected content is not the label. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Optional description relationship forwarded to the native switch. */
  readonly ariaDescribedBy = input<string | null>(null, {
    // ARIA consumers use the standard hyphenated attribute name.
    // eslint-disable-next-line @angular-eslint/no-input-rename
    alias: 'aria-describedby',
  });

  /** Optional error message relationship forwarded to the native switch. */
  readonly ariaErrorMessage = input<string | null>(null, {
    // ARIA consumers use the standard hyphenated attribute name.
    // eslint-disable-next-line @angular-eslint/no-input-rename
    alias: 'aria-errormessage',
  });

  protected isDisabled(): boolean {
    return this.disabled() || this.formDisabled();
  }

  protected isInvalid(): boolean {
    this.formEvents();
    const control = this.getFormControl();
    return (
      this.invalid() ||
      Boolean(control?.invalid && (control.touched || control.dirty))
    );
  }

  private getFormControl() {
    return this.injector.get(NgControl, null, {
      self: true,
      optional: true,
    })?.control;
  }

  protected handleChange(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    this.viewChecked.set(input.checked);
    this.checkedChange.emit(input.checked);
    this.onChange(input.checked);
  }

  protected handleBlur(): void {
    this.onTouched();
  }

  writeValue(value: boolean | null): void {
    this.viewChecked.set(value === true);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
    this.formConnected.set(true);
    this.formBindingVersion.set(++this.formBindingCount);
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
    return this.required() && !this.viewChecked() ? { required: true } : null;
  }
}
