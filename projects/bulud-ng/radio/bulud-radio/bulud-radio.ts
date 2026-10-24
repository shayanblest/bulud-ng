import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  InjectionToken,
  Injector,
  input,
  model,
  signal,
  untracked,
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
import { EMPTY, switchMap } from 'rxjs';
import type { BuludRadioTheme } from 'bulud-ng';

export type BuludRadioValue = string | number;
interface RadioContext {
  readonly name: string;
  readonly value: () => BuludRadioValue | null;
  readonly required: () => boolean;
  readonly isDisabled: () => boolean;
  readonly isInvalid: () => boolean;
  readonly select: (value: BuludRadioValue) => void;
  readonly touch: () => void;
}
const RADIO_GROUP = new InjectionToken<RadioContext>('BULUD_RADIO_GROUP');
let nextGroup = 0;
let nextRadio = 0;

/** A projected native radio group. Native radio semantics own arrow-key navigation. */
@Component({
  selector: 'bulud-radio-group',
  template: '<ng-content />',
  styleUrl: './bulud-radio-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: RADIO_GROUP, useExisting: forwardRef(() => BuludRadioGroup) },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BuludRadioGroup),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BuludRadioGroup),
      multi: true,
    },
  ],
  host: {
    role: 'radiogroup',
    '[style]': 'themeStyles()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledby()',
    '[attr.aria-describedby]': 'ariaDescribedby()',
    '[attr.aria-errormessage]': 'ariaErrormessage()',
    '[attr.aria-required]': 'required()',
    '[attr.aria-disabled]': 'isDisabled()',
    '[attr.aria-invalid]': 'isInvalid() ? "true" : null',
  },
})
export class BuludRadioGroup
  implements RadioContext, ControlValueAccessor, Validator
{
  readonly name = `bulud-radio-group-${nextGroup++}`;
  readonly value = model<BuludRadioValue | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly requireOption = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly theme = input<Partial<BuludRadioTheme>>({});
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | null>(null, {
    alias: 'aria-labelledby',
  });
  readonly ariaDescribedby = input<string | null>(null, {
    alias: 'aria-describedby',
  });
  readonly ariaErrormessage = input<string | null>(null, {
    alias: 'aria-errormessage',
  });
  private readonly radios = contentChildren<BuludRadio>(
    forwardRef(() => BuludRadio),
    { descendants: true },
  );
  private readonly injector = inject(Injector);
  private readonly formDisabled = signal(false);
  private readonly binding = signal(0);
  private readonly events = toSignal(
    toObservable(this.binding).pipe(
      switchMap(() => this.control()?.events ?? EMPTY),
    ),
    { initialValue: null },
  );
  private onChange: (value: BuludRadioValue | null) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};
  protected readonly themeStyles = computed(() =>
    Object.fromEntries(
      Object.entries(this.theme()).map(([key, value]) => [
        `--bulud-radio-${key.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase())}`,
        value,
      ]),
    ),
  );

  constructor() {
    effect(() => {
      this.required();
      this.requireOption();
      this.radios()
        .filter((radio) => radio.belongsTo(this))
        .map((radio) => radio.value());
      untracked(() => this.onValidatorChange());
    });
  }
  private control() {
    return this.injector.get(NgControl, null, { self: true, optional: true })
      ?.control;
  }
  isDisabled = (): boolean => this.disabled() || this.formDisabled();
  isInvalid = (): boolean => {
    this.events();
    const control = this.control();
    return (
      this.invalid() ||
      !!(control?.invalid && (control.touched || control.dirty))
    );
  };
  select = (value: BuludRadioValue): void => {
    if (this.isDisabled() || Object.is(this.value(), value)) return;
    this.value.set(value);
    this.onChange(value);
  };
  touch = (): void => this.onTouched();
  writeValue(value: BuludRadioValue | null): void {
    this.value.set(
      typeof value === 'string' || typeof value === 'number' ? value : null,
    );
  }
  registerOnChange(fn: (value: BuludRadioValue | null) => void): void {
    this.onChange = fn;
    this.binding.update((value) => value + 1);
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }
  setDisabledState(value: boolean): void {
    this.formDisabled.set(value);
  }
  validate(): ValidationErrors | null {
    const value = this.value();
    if (value === null) return this.required() ? { required: true } : null;
    if (typeof value === 'number' && !Number.isFinite(value))
      return { radioValue: true };
    return !this.requireOption() ||
      this.radios().some(
        (radio) => radio.belongsTo(this) && Object.is(radio.value(), value),
      )
      ? null
      : { option: true };
  }
}

/** Place inside BuludRadioGroup; project text as the accessible label. */
@Component({
  selector: 'bulud-radio',
  templateUrl: './bulud-radio.html',
  styleUrl: './bulud-radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.id]': 'null',
    '[attr.aria-label]': 'null',
    '[class.bulud-radio--disabled]': 'isDisabled()',
  },
})
export class BuludRadio {
  protected readonly group = inject(RADIO_GROUP);
  readonly value = input.required<BuludRadioValue>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly id = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  readonly ariaDescribedby = input<string | null>(null, {
    alias: 'aria-describedby',
  });
  private readonly generatedId = `bulud-radio-${nextRadio++}`;
  protected readonly inputId = computed(() => this.id() ?? this.generatedId);
  protected readonly checked = computed(() =>
    Object.is(this.group.value(), this.value()),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.group.isDisabled(),
  );
  belongsTo(group: BuludRadioGroup): boolean {
    return this.group === group;
  }
  protected change(): void {
    if (!this.isDisabled()) this.group.select(this.value());
  }
}
