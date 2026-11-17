import { BuludSymbol } from 'bulud-ng/symbol';
import { BuludRuntime } from 'bulud-ng/runtime';
import { BuludFieldLabel } from 'bulud-ng/field-label';
import {
  ElementRef,
  DestroyRef,
  DOCUMENT,
  output,
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
  readonly day?: number;
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
  imports: [BuludFieldLabel, BuludSymbol],
  selector: 'bulud-period-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './period-picker.css',
  host: {
    '[style]': 'styles()',
    '[class.bulud-period-picker--fields]': "presentation()==='fields'",
    '[class.bulud-period-picker--grid]': "presentation()==='grid'",
    '[class.bulud-period-picker--navigation]': "presentation()==='navigation'",
    '[class.bulud-standalone]': "presentation()!=='fields'",
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
  template:
    '@if(presentation()===\'fields\'){<fieldset\n    [disabled]="isDisabled()"\n    [attr.aria-invalid]="invalid() || null"\n    [attr.aria-describedby]="describedBy() || null"\n  >\n    <legend buludFieldLabel [required]="required()">{{ label() }}</legend>\n    <div class="header">\n      <button [attr.id]="inputIdPrefix() ? inputIdPrefix() + \'_previous_year\' : null"\n        type="button"\n        [attr.aria-label]="previousYearLabel()"\n        [disabled]="!canMove(-1)"\n        (click)="move(-1)"\n      >\n        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">\n          <path d="m14 6-6 6 6 6" />\n        </svg></button\n      ><input\n [attr.id]="inputIdPrefix() ? inputIdPrefix() + \'_year\' : null"\n        type="number"\n        inputmode="numeric"\n        [attr.aria-label]="yearLabel()"\n        min="1"\n        [max]="calendarMode() === \'persian\' ? 9377 : 9999"\n        [value]="yearText()"\n        (change)="changeYear($event)"\n        (blur)="onTouched()"\n      /><button [attr.id]="inputIdPrefix() ? inputIdPrefix() + \'_next_year\' : null"\n        type="button"\n        [attr.aria-label]="nextYearLabel()"\n        [disabled]="!canMove(1)"\n        (click)="move(1)"\n      >\n        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">\n          <path d="m10 6 6 6-6 6" />\n        </svg>\n      </button>\n    </div>\n    @if (mode() === \'month\') {\n      <div class="months">\n        @for (month of months(); track month.number) {\n          <button [attr.id]="inputIdPrefix() ? inputIdPrefix() + \'_month_\' + month.number : null"\n            type="button"\n            [attr.aria-pressed]="selectedMonth(month.number)"\n            [disabled]="!allowed(month.number)"\n            (click)="choose(month.number)"\n          >\n            {{ month.label }}\n          </button>\n        }\n      </div>\n    }\n    <button [attr.id]="inputIdPrefix() ? inputIdPrefix() + \'_clear\' : null"\n      type="button"\n      class="clear"\n      [disabled]="value() === null"\n      (click)="clear()"\n    >\n      {{ clearLabel() }}\n    </button>\n  </fieldset>}@else if(presentation()===\'grid\'){ <div class="picker-wrapper">\n    <div\n      class="display" [attr.id]="inputIdPrefix() ? inputIdPrefix() + \'_trigger\' : null"\n      role="button"\n      tabindex="0"\n      [attr.aria-label]="label()"\n      [attr.aria-expanded]="isOpen()"\n      (click)="togglePicker()"\n      (keydown.enter)="togglePicker()"\n      (keydown.space)="$event.preventDefault(); togglePicker()"\n    >\n      <bulud-symbol\n        [legacy]="legacyIcons()"\n        name="calendar"\n        legacyClass="icon-calendar"\n      /><span>{{ gridLabel() }}</span\n      ><bulud-symbol\n        [legacy]="legacyIcons()"\n        [name]="isOpen() ? \'chevron-up\' : \'chevron-down\'"\n        [legacyClass]="isOpen() ? \'icon-chevron-up\' : \'icon-chevron-down\'"\n      />\n    </div>\n    <div\n      tabindex="-1"\n      class="month-picker end-0"\n      [class.closed]="!isOpen()"\n      [attr.inert]="!isOpen() ? \'\' : null"\n      (keydown.escape)="isOpen.set(false)"\n    >\n      <div class="header">\n        <button [attr.id]="inputIdPrefix() ? inputIdPrefix() + \'_previous_year\' : null"\n          type="button"\n          class="arrow"\n          [attr.aria-label]="runtime.text(\'PreviousYear\', \'Previous year\')"\n          (click)="prevYear()"\n        >\n          <bulud-symbol\n            [legacy]="legacyIcons()"\n            name="chevron-right"\n            legacyClass="icon-chevron-right"\n          />\n        </button>\n        <div class="year" aria-live="polite">{{ year() }}</div>\n        <button [attr.id]="inputIdPrefix() ? inputIdPrefix() + \'_next_year\' : null"\n          type="button"\n          class="arrow"\n          [attr.aria-label]="runtime.text(\'NextYear\', \'Next year\')"\n          (click)="nextYear()"\n        >\n          <bulud-symbol\n            [legacy]="legacyIcons()"\n            name="chevron-left"\n            legacyClass="icon-chevron-left"\n          />\n        </button>\n      </div>\n      <div class="months-grid bulud-ltr">\n        @for (month of months(); track $index; let i = $index) {\n          <button [attr.id]="inputIdPrefix() ? inputIdPrefix() + \'_month_\' + (i + 1) : null"\n            type="button"\n            class="bulud-padding-x-6 bulud-padding-y-4"\n            [disabled]="isMonthDisabled(i)"\n            (click)="selectMonth(i)"\n            [class.selected]="\n              selectedMonth(i+1)\n            "\n            [attr.aria-pressed]="\n              selectedMonth(i+1)\n            "\n          >\n            {{ month.label }}\n          </button>\n        }\n      </div>\n    </div>\n  </div>}@else{<div class="flex justify-between items-center">\n    <button [attr.id]="inputIdPrefix() ? inputIdPrefix() + \'_previous_month\' : null" type="button" class="bulud-action bulud-action-text bulud-type-6" [disabled]="!canShiftMonth(-1)" (click)="prevMonth()">\n      <bulud-symbol\n        [legacy]="legacyIcons()"\n        [name]="\n          runtime.direction() === \'rtl\' ? \'chevron-right\' : \'chevron-left\'\n        "\n        legacyClass="icon-chevron-right bulud-margin-e-4"\n      /><span>{{ runtime.text(\'PreviousMonth\', \'Previous month\') }}</span>\n    </button>\n    <div class="flex bulud-type-5">\n      <span class="bulud-margin-e-1">{{ navigationLabel() }}</span\n      ><span>{{ year() }}</span>\n    </div>\n    <button [attr.id]="inputIdPrefix() ? inputIdPrefix() + \'_next_month\' : null" type="button" class="bulud-action bulud-action-text bulud-type-6" [disabled]="!canShiftMonth(1)" (click)="nextMonth()">\n      <span>{{ runtime.text(\'NextMonth\', \'Next month\') }}</span\n      ><bulud-symbol\n        [legacy]="legacyIcons()"\n        [name]="\n          runtime.direction() === \'rtl\' ? \'chevron-left\' : \'chevron-right\'\n        "\n        legacyClass="icon-chevron-left bulud-margin-s-4"\n      />\n    </button>\n  </div>}',
})
export class BuludPeriodPicker implements ControlValueAccessor, Validator {
  /** Project-owned native control identifier; no prefix normalization. */
  readonly inputIdPrefix = input<string | null>(null);
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  private readonly formDisabled = signal(false);
  private readonly browseYear = signal<number | undefined>(undefined);
  private readonly today = signal(this.localToday());
  readonly presentation = input<'fields' | 'grid' | 'navigation'>('fields');
  readonly label = input('Period');
  private readonly runtime = inject(BuludRuntime);
  readonly legacyIcons = input(
    inject(BULUD_SHARED_UI_CONFIG).legacyIcons ?? false,
  );
  readonly referenceDate = input(new Date());
  readonly monthLabels = input<readonly string[]>();
  readonly staticLanguage = input(false);
  readonly legacyTimestamp = input(false);
  readonly monthSelected = output<string>();
  readonly dateChange = output<number>();
  readonly isOpen = signal(false);
  private previousReference: Date | undefined;
  readonly mode = input<'month' | 'year'>('month');
  readonly value = model<BuludPeriodValue | null>(null);
  readonly language = input<string>();
  private readonly resolvedLanguage = computed(() =>
    this.staticLanguage() ? 'en' : (this.language() ?? this.runtime.language()),
  );
  readonly calendar = input<BuludCalendar>();
  readonly min = input<string | Date | null>(null);
  private readonly minimum = computed(() => this.boundIso(this.min()));
  readonly max = input<string | Date | null>(null);
  private readonly maximum = computed(() => this.boundIso(this.max()));
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly describedBy = input<string>();
  readonly previousYearLabel = input('Previous year');
  readonly nextYearLabel = input('Next year');
  readonly yearLabel = input('Year');
  readonly clearLabel = input('Clear selection');
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly calendarMode = computed<BuludCalendar>(
    () =>
      this.calendar() ??
      (this.presentation() === 'grid'
        ? 'gregory'
        : this.presentation() === 'navigation'
          ? this.resolvedLanguage() === 'fa'
            ? 'persian'
            : 'gregory'
          : (this.value()?.calendar ??
            (this.resolvedLanguage() === 'fa' ? 'persian' : 'gregory'))),
  );
  readonly year = computed(
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
      (this.minimum() === null || !!buludParseIsoDate(this.minimum())) &&
      (this.maximum() === null || !!buludParseIsoDate(this.maximum())) &&
      (!this.minimum() ||
        !this.maximum() ||
        this.minimum()! <= this.maximum()!),
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
    return (
      this.presentation() === 'grid' && this.value()?.month !== undefined
        ? this.monthOutside(this.value()!.year, this.value()!.month!)
        : this.outside(range)
    )
      ? { periodRange: true }
      : null;
  });
  protected readonly months = computed(() => {
    const formatter = new Intl.DateTimeFormat(this.resolvedLanguage(), {
      calendar: this.calendarMode(),
      month: 'short',
      timeZone: 'UTC',
    });
    const year =
      Number.isInteger(this.year()) && this.year() > 0
        ? this.year()
        : buludCalendarParts(this.today(), this.calendarMode()).year;
    return Array.from({ length: 12 }, (_, i) => ({
      number: i + 1,
      label:
        this.monthLabels()?.[i] ??
        formatter.format(
          buludCalendarDate(year, i + 1, 1, this.calendarMode()) ??
            this.today(),
        ),
    }));
  });
  private onChange: (value: BuludPeriodValue | null) => void = () => {};
  protected onTouched: () => void = () => {};
  private validatorChange: () => void = () => {};
  constructor() {
    effect(() => {
      const presentation = this.presentation();
      if (presentation === 'fields') return;
      const reference = this.referenceDate(),
        calendar = this.calendarMode();
      if (!(reference instanceof Date) || !Number.isFinite(reference.getTime()))
        return;
      untracked(() => {
        const existing = this.value();
        if (
          presentation === 'navigation' ||
          existing === null ||
          existing.calendar !== calendar ||
          (this.previousReference !== undefined &&
            this.previousReference !== reference)
        ) {
          const noon = new Date(
            Date.UTC(
              reference.getFullYear(),
              reference.getMonth(),
              reference.getDate(),
              12,
            ),
          );
          const parts = buludCalendarParts(noon, calendar);
          this.value.set({
            calendar,
            year: parts.year,
            month: parts.month,
            ...(presentation === 'navigation' ? { day: parts.day } : {}),
          });
        }
        this.previousReference = reference;
        if (presentation === 'grid') this.emitMonth();
      });
    });
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
      document = inject(DOCUMENT);
    const outside = (event: Event) => {
      if (event.target instanceof Node && !element.contains(event.target))
        this.isOpen.set(false);
    };
    document.addEventListener('click', outside);
    inject(DestroyRef).onDestroy(() =>
      document.removeEventListener('click', outside),
    );

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
      (this.minimum() && range.from < this.minimum()!) ||
      (this.maximum() && range.to > this.maximum()!)
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
    if (this.presentation() === 'grid')
      return (
        !this.isDisabled() &&
        Number.isInteger(this.year() + delta) &&
        this.year() + delta >= 1 &&
        this.year() + delta <= 9999
      );
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
          (this.minimum() && range.to < this.minimum()!) ||
          (this.maximum() && range.from > this.maximum()!)
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
  private boundIso(value: string | Date | null): string | null {
    if (!(value instanceof Date)) return value;
    if (!Number.isFinite(value.getTime())) return 'Invalid date';
    return (
      String(value.getFullYear()).padStart(4, '0') +
      '-' +
      String(value.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(value.getDate()).padStart(2, '0')
    );
  }
  protected readonly gridLabel = computed(() => {
    const value = this.value();
    return (
      (this.months().find((month) => month.number === value?.month)?.label ??
        '') +
      ' - ' +
      (value?.year ?? this.year())
    );
  });
  togglePicker(): void {
    if (!this.isDisabled()) this.isOpen.update((open) => !open);
  }
  prevYear(): void {
    this.move(-1);
  }
  nextYear(): void {
    this.move(1);
  }
  private monthOutside(year: number, month: number): boolean {
    const date = buludCalendarDate(year, month, 1, this.calendarMode());
    if (!date) return true;
    const parts = (bound: string | null) =>
      bound
        ? buludCalendarParts(
            new Date(bound + 'T12:00:00Z'),
            this.calendarMode(),
          )
        : undefined;
    const min = parts(this.minimum()),
      max = parts(this.maximum()),
      index = year * 12 + month;
    return !!(
      (min && index < min.year * 12 + min.month) ||
      (max && index > max.year * 12 + max.month)
    );
  }
  isMonthDisabled(index: number): boolean {
    return (
      this.isDisabled() ||
      !this.validBounds() ||
      this.monthOutside(this.year(), index + 1)
    );
  }
  selectMonth(index: number): void {
    if (this.isMonthDisabled(index)) return;
    this.commit({
      calendar: this.calendarMode(),
      year: this.year(),
      month: index + 1,
    });
    this.onTouched();
    this.isOpen.set(false);
    this.emitMonth();
  }
  private emitMonth(): void {
    const value = this.value();
    if (value?.month !== undefined)
      this.monthSelected.emit(
        value.year + '-' + String(value.month).padStart(2, '0'),
      );
  }
  protected readonly navigationLabel = computed(() => {
    const value = this.value();
    if (!value?.month) return '';
    const fallback =
      this.monthLabels()?.[value.month - 1] ??
      new Intl.DateTimeFormat(this.resolvedLanguage(), {
        month: 'long',
        calendar: this.calendarMode(),
        timeZone: 'UTC',
      }).format(
        buludCalendarDate(value.year, value.month, 1, this.calendarMode())!,
      );
    return (
      this.monthLabels()?.[value.month - 1] ??
      this.runtime.text(
        'DATETIME.' +
          (this.staticLanguage() ? 'EnMonths.' : 'Months.') +
          value.month,
        fallback,
      )
    );
  });
  canShiftMonth(delta: number): boolean {
    if (this.isDisabled() || !this.validBounds()) return false;
    const value = this.value();
    if (!value?.month) return false;
    const index = value.month - 1 + delta,
      year = value.year + Math.floor(index / 12),
      month = (((index % 12) + 12) % 12) + 1,
      range = buludPeriodRange({ calendar: this.calendarMode(), year, month });
    return !!range && !this.outside(range);
  }
  prevMonth(): void {
    this.shiftMonth(-1);
  }
  nextMonth(): void {
    this.shiftMonth(1);
  }
  private shiftMonth(delta: number): void {
    if (!this.canShiftMonth(delta)) return;
    const old = this.value()!,
      index = old.month! - 1 + delta,
      value = {
        ...old,
        year: old.year + Math.floor(index / 12),
        month: (((index % 12) + 12) % 12) + 1,
      },
      day = old.day ?? this.referenceDate().getDate();
    this.commit(value);
    let date: Date;
    if (this.calendarMode() === 'persian') {
      const first = buludCalendarDate(value.year, value.month, 1, 'persian')!;
      first.setUTCDate(first.getUTCDate() + day);
      date = new Date(
        first.getUTCFullYear(),
        first.getUTCMonth(),
        first.getUTCDate(),
      );
      if (!this.legacyTimestamp()) date.setDate(date.getDate() - 1);
    } else
      date = new Date(
        value.year,
        value.month - (this.legacyTimestamp() ? 0 : 1),
        day + (this.legacyTimestamp() ? 1 : 0),
      );
    this.dateChange.emit(
      date.getTime() / 1000 - (this.legacyTimestamp() ? 86400 : 0),
    );
    this.onTouched();
  }
}
