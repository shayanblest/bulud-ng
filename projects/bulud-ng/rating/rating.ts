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
let nextId = 0;
@Component({
  imports: [BuludFieldLabel],
  selector: 'bulud-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './rating.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BuludRating),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BuludRating),
      multi: true,
    },
  ],
  host: { '[style]': 'styles()' },
  template: `<fieldset
    [disabled]="isDisabled()"
    [attr.aria-describedby]="describedBy() || null"
    [attr.aria-invalid]="invalid() || null"
  >
    <legend buludFieldLabel [required]="required()">{{ label() }}</legend>
    <div class="actions">
      @for (star of stars; track star) {
        <label class="star"
          ><input
            type="radio"
            [name]="name"
            [value]="star"
            [checked]="value() === star"
            [required]="required()"
            (change)="choose(star)"
            (blur)="onTouched()"
          /><span aria-hidden="true" [class.filled]="isFilled(star)">★</span
          ><span class="sr">{{ star }} / 5</span></label
        >
      }
    </div>
  </fieldset>`,
})
export class BuludRating implements ControlValueAccessor, Validator {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  protected readonly name = `bulud-rating-${nextId++}`;
  protected readonly stars = [1, 2, 3, 4, 5];
  readonly label = input.required<string>();
  readonly describedBy = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly value = signal<unknown>(0);
  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(
    () => this.disabled() || this.formDisabled(),
  );
  protected readonly styles = computed(() =>
    buludSharedUiStyles('rating', this.config, this.theme()),
  );
  private onChange: (value: number) => void = () => {};
  protected onTouched: () => void = () => {};
  private validatorChange: () => void = () => {};
  constructor() {
    effect(() => {
      this.required();
      this.validatorChange();
    });
  }
  writeValue(value: unknown): void {
    this.value.set(value ?? 0);
  }
  registerOnChange(fn: (value: number) => void): void {
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
    const value = this.value();
    if (value === 0) return this.required() ? { required: true } : null;
    return typeof value === 'number' &&
      Number.isInteger(value) &&
      value >= 1 &&
      value <= 5
      ? null
      : { rating: true };
  }
  protected isFilled(star: number): boolean {
    return typeof this.value() === 'number' && star <= (this.value() as number);
  }
  protected choose(star: number): void {
    if (this.isDisabled()) return;
    this.value.set(star);
    this.onChange(star);
  }
}
