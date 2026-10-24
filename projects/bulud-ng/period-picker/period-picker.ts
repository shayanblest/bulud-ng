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
  model,
  signal,
  untracked,
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
import {
  BuludCalendar,
  buludCalendarDate,
  buludCalendarParts,
  buludParseIsoDate,
} from 'bulud-ng/datepicker';
export interface BuludPeriodValue {
  readonly calendar: BuludCalendar;
  readonly year: number;
  readonly month?: number;
}
export interface BuludPeriodRange {
  readonly from: string;
  readonly to: string;
}
export function buludPeriodRange(value: unknown): BuludPeriodRange | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const period = value as Record<string, unknown>,
    year = period['year'],
    month = period['month'],
    calendar = period['calendar'];
  if (
    !Number.isInteger(year) ||
    typeof year !== 'number' ||
    year < 1 ||
    year > 9999 ||
    (calendar !== 'gregory' && calendar !== 'persian') ||
    (month !== undefined &&
      (!Number.isInteger(month) ||
        typeof month !== 'number' ||
        month < 1 ||
        month > 12))
  )
    return null;
  const start = buludCalendarDate(
      year,
      typeof month === 'number' ? month : 1,
      1,
      calendar,
    ),
    next = buludCalendarDate(
      month === undefined || month === 12 ? year + 1 : year,
      typeof month === 'number' && month < 12 ? month + 1 : 1,
      1,
      calendar,
    );
  if (!start || !next) return null;
  const from = start.toISOString().slice(0, 10),
    to = new Date(next.getTime() - 86400000).toISOString().slice(0, 10);
  return buludParseIsoDate(from) && buludParseIsoDate(to) ? { from, to } : null;
}
@Component({
  imports: [BuludFieldLabel],
  selector: 'bulud-period-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './period-picker.scss',
  host: {
    '[style]': 'styles()',
    '(focusin)': 'refreshToday()',
    '(pointerdown)': 'refreshToday()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BuludPeriodPicker),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BuludPeriodPicker),
      multi: true,
    },
  ],
  template: `<fieldset
    [disabled]="isDisabled()"
    [attr.aria-invalid]="invalid() || null"
    [attr.aria-describedby]="describedBy() || null"
  >
    <legend buludFieldLabel [required]="required()">{{ label() }}</legend>
    <div class="header">
      <button
        type="button"
        [attr.aria-label]="previousYearLabel()"
        [disabled]="!canMove(-1)"
        (click)="move(-1)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m14 6-6 6 6 6" />
        </svg></button
      ><input
        type="number"
        inputmode="numeric"
        [attr.aria-label]="yearLabel()"
        min="1"
        [max]="calendarMode() === 'persian' ? 9377 : 9999"
        [value]="yearText()"
        (change)="changeYear($event)"
        (blur)="onTouched()"
      /><button
        type="button"
        [attr.aria-label]="nextYearLabel()"
        [disabled]="!canMove(1)"
        (click)="move(1)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m10 6 6 6-6 6" />
        </svg>
      </button>
    </div>
    @if (mode() === 'month') {
      <div class="months">
        @for (month of months(); track month.number) {
          <button
            type="button"
            [attr.aria-pressed]="selectedMonth(month.number)"
            [disabled]="!allowed(month.number)"
            (click)="choose(month.number)"
          >
            {{ month.label }}
          </button>
        }
      </div>
    }
    <button
      type="button"
      class="clear"
      [disabled]="value() === null"
      (click)="clear()"
    >
      {{ clearLabel() }}
    </button>
  </fieldset>`,
})
export class BuludPeriodPicker implements ControlValueAccessor, Validator {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  private readonly formDisabled = signal(false);
  private readonly browseYear = signal<number | undefined>(undefined);
  private readonly today = signal(this.localToday());
  readonly label = input.required<string>();
  readonly mode = input<'month' | 'year'>('month');
  readonly value = model<BuludPeriodValue | null>(null);
  readonly language = input<'fa' | 'en'>('en');
  readonly calendar = input<BuludCalendar>();
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly describedBy = input<string>();
  readonly previousYearLabel = input('Previous year');
  readonly nextYearLabel = input('Next year');
  readonly yearLabel = input('Year');
  readonly clearLabel = input('Clear selection');
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly calendarMode = computed(
    () =>
      (this.calendar() === 'persian' || this.calendar() === 'gregory'
        ? this.calendar()
        : undefined) ??
      (this.value()?.calendar === 'persian' ||
      this.value()?.calendar === 'gregory'
        ? this.value()!.calendar
        : this.language() === 'fa'
          ? 'persian'
          : 'gregory'),
  );
  protected readonly year = computed(
    () =>
      this.browseYear() ??
      (typeof this.value()?.year === 'number'
        ? this.value()!.year
        : buludCalendarParts(this.today(), this.calendarMode()).year),
  );
  protected readonly yearText = computed(() =>
    Number.isFinite(this.year()) ? String(this.year()) : '',
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.formDisabled(),
  );
  protected readonly styles = computed(() =>
    buludSharedUiStyles('period-picker', this.config, this.theme()),
  );
  private readonly validBounds = computed(
    () =>
      (this.min() === null || !!buludParseIsoDate(this.min())) &&
      (this.max() === null || !!buludParseIsoDate(this.max())) &&
      (!this.min() || !this.max() || this.min()! <= this.max()!),
  );
  protected readonly errors = computed<ValidationErrors | null>(() => {
    if (
      (this.calendar() !== undefined &&
        this.calendar() !== 'persian' &&
        this.calendar() !== 'gregory') ||
      (this.mode() !== 'month' && this.mode() !== 'year')
    )
      return { periodConfig: true };
    if (!this.validBounds()) return { periodBounds: true };
    const value = this.value();
    if (value === null) return this.required() ? { required: true } : null;
    const range = buludPeriodRange(value);
    if (
      !range ||
      (this.mode() === 'month' && value?.month === undefined) ||
      (this.mode() === 'year' && value?.month !== undefined) ||
      (this.calendar() && value?.calendar !== this.calendarMode())
    )
      return { period: true };
    return this.outside(range) ? { periodRange: true } : null;
  });
  protected readonly months = computed(() => {
    const formatter = new Intl.DateTimeFormat(
      this.language() === 'fa' ? 'fa-IR' : 'en-US',
      { calendar: this.calendarMode(), month: 'short', timeZone: 'UTC' },
    );
    const year =
      Number.isInteger(this.year()) && this.year() > 0
        ? this.year()
        : buludCalendarParts(this.today(), this.calendarMode()).year;
    return Array.from({ length: 12 }, (_, i) => ({
      number: i + 1,
      label: formatter.format(
        buludCalendarDate(year, i + 1, 1, this.calendarMode()) ?? this.today(),
      ),
    }));
  });
  private onChange: (value: BuludPeriodValue | null) => void = () => {};
  protected onTouched: () => void = () => {};
  private validatorChange: () => void = () => {};
  constructor() {
    effect(() => {
      this.value();
      untracked(() => this.browseYear.set(undefined));
    });
    effect(() => {
      this.errors();
      untracked(() => this.validatorChange());
    });
  }
  private outside(range: BuludPeriodRange): boolean {
    return !!(
      (this.min() && range.from < this.min()!) ||
      (this.max() && range.to > this.max()!)
    );
  }
  protected selectedMonth(month: number): boolean {
    return (
      this.value()?.calendar === this.calendarMode() &&
      this.value()?.year === this.year() &&
      this.value()?.month === month
    );
  }
  protected allowed(month?: number): boolean {
    if (this.isDisabled() || !this.validBounds()) return false;
    const range = buludPeriodRange({
      calendar: this.calendarMode(),
      year: this.year(),
      ...(month === undefined ? {} : { month }),
    });
    return !!range && !this.outside(range);
  }
  protected canMove(delta: number): boolean {
    const year = this.year() + delta;
    if (
      this.isDisabled() ||
      !this.validBounds() ||
      !Number.isInteger(year) ||
      year < 1 ||
      year > (this.calendarMode() === 'persian' ? 9377 : 9999)
    )
      return false;
    const range = buludPeriodRange({ calendar: this.calendarMode(), year });
    if (!range) return false;
    return this.mode() === 'year'
      ? !this.outside(range)
      : !(
          (this.min() && range.to < this.min()!) ||
          (this.max() && range.from > this.max()!)
        );
  }

  private localToday(): Date {
    const date = new Date();
    return buludCalendarDate(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      'gregory',
    )!;
  }
  protected refreshToday(): void {
    const next = this.localToday();
    if (next.getTime() !== this.today().getTime()) this.today.set(next);
  }
  protected move(delta: number): void {
    this.refreshToday();
    if (!this.canMove(delta)) return;
    this.browseYear.set(this.year() + delta);
    if (this.mode() === 'year') this.choose();
  }
  protected changeYear(event: Event): void {
    this.refreshToday();
    if (this.isDisabled()) return;
    this.browseYear.set((event.target as HTMLInputElement).valueAsNumber);
    if (this.mode() === 'year')
      this.commit({ calendar: this.calendarMode(), year: this.year() });
    this.onTouched();
  }
  protected choose(month?: number): void {
    this.refreshToday();
    if (!this.allowed(month)) return;
    this.commit({
      calendar: this.calendarMode(),
      year: this.year(),
      ...(month === undefined ? {} : { month }),
    });
    this.onTouched();
  }
  clear(): void {
    this.refreshToday();
    if (this.isDisabled()) return;
    this.browseYear.set(undefined);
    this.commit(null);
    this.onTouched();
  }
  private commit(value: BuludPeriodValue | null): void {
    this.value.set(value);
    this.onChange(value);
  }
  writeValue(value: unknown): void {
    this.refreshToday();
    this.value.set((value ?? null) as BuludPeriodValue | null);
    this.browseYear.set(undefined);
  }
  registerOnChange(fn: (value: BuludPeriodValue | null) => void): void {
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
    return this.errors();
  }
}
