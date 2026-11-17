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
  styleUrl: './rating.css',
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
  template:
    '<fieldset\n    [disabled]="isDisabled()"\n    [attr.aria-describedby]="describedBy() || null"\n    [attr.aria-invalid]="invalid() || null"\n  >\n    <legend buludFieldLabel [required]="required()">{{ label() }}</legend>\n    <div class="actions">\n      @for (star of stars; track star) {\n        <label class="star"\n          ><input\n            type="radio" [attr.id]="inputIdPrefix() ? inputIdPrefix() + \'_\' + star : null"\n            [name]="name"\n            [value]="star"\n            [checked]="value() === star"\n            [required]="required()"\n            (change)="choose(star)"\n            (blur)="onTouched()"\n          /><span aria-hidden="true" [class.filled]="isFilled(star)">★</span\n          ><span class="sr">{{ star }} / 5</span></label\n        >\n      }\n    </div>\n  </fieldset>',
})
export class BuludRating implements ControlValueAccessor, Validator {
  /** Project-owned native control identifier; no prefix normalization. */
  readonly inputIdPrefix = input<string | null>(null);
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
