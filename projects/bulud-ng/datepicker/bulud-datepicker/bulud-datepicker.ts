import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  Renderer2,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  signal,
  untracked,
  viewChild,
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
import {
  BULUD_DEFAULT_LOCALE,
  BULUD_LOCALE,
  resolveBuludLocale,
  type BuludDatepickerTheme,
} from 'bulud-ng';
import {
  BULUD_DATEPICKER_CONFIG,
  BuludCalendar,
  BuludDatepickerMode,
  BuludDatepickerValue,
} from './datepicker-config';
import {
  addDays,
  calendarDate,
  daysInMonth,
  iso,
  parseDate,
  parts,
  shiftMonth,
} from '../internal/calendar';

interface Day {
  readonly iso: string;
  readonly label: string;
  readonly number: string;
  readonly disabled: boolean;
}
let nextId = 0;

/** Accessible date-only control with Persian/Gregorian display and native Angular Forms integration. */
@Component({
  selector: 'bulud-datepicker',
  templateUrl: './bulud-datepicker.html',
  styleUrl: './bulud-datepicker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BuludDatepicker),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BuludDatepicker),
      multi: true,
    },
  ],
  host: {
    '[attr.id]': 'null',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
    '[attr.aria-errormessage]': 'null',
    '[style]': 'themeStyles()',
    '(focusout)': 'focusOut($event)',
  },
})
export class BuludDatepicker implements ControlValueAccessor, Validator {
  private readonly config = inject(BULUD_DATEPICKER_CONFIG);
  private readonly injectedLocale = inject(BULUD_LOCALE);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly formDisabled = signal(false);
  private readonly binding = signal(0);
  private readonly events = toSignal(
    toObservable(this.binding).pipe(
      switchMap(() => this.control()?.events ?? EMPTY),
    ),
    { initialValue: null },
  );
  protected readonly todayValue = signal(this.localToday());
  protected readonly uid = `bulud-datepicker-${nextId++}`;
  private readonly formatters = new Map<string, Intl.DateTimeFormat>();
  private readonly focusRequest = signal<string | null>(null);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly yearList = viewChild<ElementRef<HTMLElement>>('yearList');
  protected readonly panelDirection = signal<'ltr' | 'rtl'>('ltr');
  private readonly yearAnchor = signal(0);
  private restoreFocus = false;
  private readonly grid = viewChild<ElementRef<HTMLElement>>('grid');
  private onChange: (value: BuludDatepickerValue) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  readonly value = model<BuludDatepickerValue>(null);
  readonly calendar = input<BuludCalendar | undefined>(undefined);
  readonly language = input<string | undefined>(undefined);
  readonly mode = input<BuludDatepickerMode | undefined>(undefined);
  readonly firstDayOfWeek = input<number | undefined>(undefined);
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly placeholder = input<string | undefined>(undefined);
  readonly id = input<string | null>(null);
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
  readonly theme = input<Partial<BuludDatepickerTheme>>({});

  protected readonly open = signal(false);
  protected readonly viewDate = signal(this.todayValue());
  protected readonly localeLanguage = computed(
    () => this.language() ?? this.injectedLocale.language,
  );
  protected readonly labels = computed(
    () =>
      (this.language()
        ? resolveBuludLocale({ language: this.language() }).datepicker
        : this.injectedLocale.datepicker) ?? BULUD_DEFAULT_LOCALE.datepicker!,
  );
  protected readonly resolvedCalendar = computed(
    () =>
      this.calendar() ??
      this.config.calendar ??
      (this.localeLanguage().startsWith('fa') ? 'persian' : 'gregory'),
  );
  protected readonly resolvedMode = computed(
    () => this.mode() ?? this.config.mode ?? 'single',
  );
  protected readonly firstWeekday = computed(() => {
    const value = this.firstDayOfWeek() ?? this.config.firstDayOfWeek;
    return value !== undefined &&
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 6
      ? value
      : this.resolvedCalendar() === 'persian'
        ? 6
        : 0;
  });
  protected readonly bounds = computed(() => {
    const earliest =
      this.resolvedCalendar() === 'persian' ? '0622-03-22' : '0001-01-01';
    const requestedMin = parseDate(this.min()) ? this.min()! : earliest;
    return {
      min: requestedMin < earliest ? earliest : requestedMin,
      max: parseDate(this.max()) ? this.max()! : '9999-12-31',
    };
  });
  private readonly validBounds = computed(
    () =>
      (this.min() === null || !!parseDate(this.min())) &&
      (this.max() === null || !!parseDate(this.max())) &&
      this.bounds().min <= this.bounds().max,
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.formDisabled(),
  );
  protected readonly isInvalid = computed(() => {
    this.events();
    const c = this.control();
    return this.invalid() || !!(c?.invalid && (c.touched || c.dirty));
  });
  protected readonly view = computed(() =>
    parts(parseDate(this.viewDate())!, this.resolvedCalendar()),
  );
  protected readonly heading = computed(
    () =>
      `${this.format(this.viewDate(), { month: 'long' })} ${this.view().year}`,
  );
  protected readonly years = computed(() => {
    const calendar = this.resolvedCalendar();
    const min = parts(parseDate(this.bounds().min)!, calendar).year;
    const max = parts(parseDate(this.bounds().max)!, calendar).year;
    const current = this.view().year;
    const anchor = Math.max(this.yearAnchor(), current);
    const upper = Math.min(max, anchor, current + 79);
    const lower = Math.max(min, Math.min(current, upper - 79));
    return Array.from(
      { length: Math.max(0, upper - lower + 1) },
      (_, i) => upper - i,
    );
  });
  protected readonly weekdays = computed(() =>
    Array.from({ length: 7 }, (_, index) => {
      const date = addDays('2024-01-07', (this.firstWeekday() + index) % 7);
      return {
        short: (this.localeLanguage().startsWith('fa')
          ? ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']
          : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'])[
          (this.firstWeekday() + index) % 7
        ],
        full: this.format(date, { weekday: 'long' }),
      };
    }),
  );
  protected readonly weeks = computed(() => {
    const { year, month } = this.view();
    const first = calendarDate(year, month, 1, this.resolvedCalendar())!;
    const offset = (first.getUTCDay() - this.firstWeekday() + 7) % 7;
    const count = daysInMonth(year, month, this.resolvedCalendar());
    const cells = Array.from({ length: 42 }, (_, index): Day | null => {
      const number = index - offset + 1;
      if (number < 1 || number > count) return null;
      const value = addDays(iso(first), number - 1);
      if (!parseDate(value)) return null;
      return {
        iso: value,
        number: String(number),
        label: this.format(value, { dateStyle: 'full' }),
        disabled: !this.allowed(value),
      };
    });
    return Array.from({ length: Math.ceil((offset + count) / 7) }, (_, index) =>
      cells.slice(index * 7, index * 7 + 7),
    );
  });
  protected readonly displayValue = computed(() => {
    const value = this.value();
    const display = (date: string) => {
      if (!parseDate(date)) return '';
      const { year, month, day } = parts(
        parseDate(date)!,
        this.resolvedCalendar(),
      );
      return `${year}/${month}/${day}`;
    };
    return typeof value === 'string'
      ? display(value)
      : Array.isArray(value)
        ? value
            .filter((day): day is string => typeof day === 'string')
            .map(display)
            .filter(Boolean)
            .join(' – ')
        : '';
  });
  protected readonly status = computed(() =>
    this.resolvedMode() === 'range'
      ? Array.isArray(this.value()) && !this.value()?.[1]
        ? this.labels().rangeEnd
        : this.labels().rangeStart
      : '',
  );
  protected readonly themeStyles = computed(() =>
    Object.fromEntries(
      Object.entries({ ...this.config.theme, ...this.theme() }).map(
        ([key, value]) => [
          `--bulud-datepicker-${key.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase())}`,
          value,
        ],
      ),
    ),
  );
  constructor() {
    const renderer = inject(Renderer2);
    afterRenderEffect((onCleanup) => {
      const panel = this.panel()?.nativeElement;
      if (!panel) return;
      if (!this.open()) {
        if (panel.matches(':popover-open')) panel.hidePopover();
        if (this.restoreFocus) {
          this.restoreFocus = false;
          this.host.nativeElement
            .querySelector<HTMLButtonElement>('.bulud-datepicker__trigger')
            ?.focus({ preventScroll: true });
        }
        return;
      }
      this.panelDirection.set(
        this.document.defaultView?.getComputedStyle(this.host.nativeElement)
          .direction === 'rtl'
          ? 'rtl'
          : 'ltr',
      );
      const stopPointer = renderer.listen(
        this.document,
        'pointerdown',
        (event: PointerEvent) => {
          if (
            this.open() &&
            event.target instanceof Node &&
            !this.host.nativeElement.contains(event.target)
          )
            this.closeCalendar(false);
        },
      );
      panel.showPopover();
      const position = () => this.positionPanel();
      position();
      const stopScroll = renderer.listen(this.document, 'scroll', position, {
        capture: true,
      });
      const stopResize = renderer.listen('window', 'resize', position);
      const observer = new ResizeObserver(position);
      observer.observe(panel);
      observer.observe(this.host.nativeElement);
      // Earlier content (including content-visibility sections) can move the
      // anchor without resizing the trigger or dispatching a scroll event.
      observer.observe(this.document.body);
      onCleanup(() => {
        stopPointer();
        stopScroll();
        stopResize();
        observer.disconnect();
      });
    });
    afterRenderEffect(() => {
      if (!this.open()) return;
      const year = this.view().year;
      const list = this.yearList()?.nativeElement;
      const active = list?.querySelector<HTMLElement>(`[data-year="${year}"]`);
      if (list && active)
        list.scrollTop =
          active.offsetTop -
          list.offsetTop -
          (list.clientHeight - active.offsetHeight) / 2;
    });
    effect(() => {
      this.required();
      this.min();
      this.max();
      this.resolvedMode();
      this.resolvedCalendar();
      untracked(() => this.onValidatorChange());
    });
    effect(() => {
      const value = this.value();
      const selected = typeof value === 'string' ? value : value?.[0];
      this.resolvedCalendar();
      untracked(() => {
        if (selected && parseDate(selected))
          this.viewDate.set(this.clamp(selected));
      });
    });
    effect(() => {
      const bounds = this.bounds();
      const valid = this.validBounds();
      untracked(() => {
        if (!valid || bounds.min > bounds.max) {
          this.open.set(false);
          return;
        }
        const current = this.viewDate();
        const clamped = this.clamp(current);
        if (current !== clamped) {
          this.viewDate.set(clamped);
          if (this.open()) this.focusRequest.set(clamped);
        }
      });
    });
    effect(() => {
      if (this.isDisabled()) untracked(() => this.open.set(false));
    });
    afterRenderEffect(() => {
      const value = this.focusRequest();
      if (!value || !this.open()) return;
      this.grid()
        ?.nativeElement.querySelector<HTMLButtonElement>(
          `[data-date="${value}"]:not(:disabled)`,
        )
        ?.focus({ preventScroll: true });
      this.positionPanel();
    });
  }
  private control() {
    return this.injector.get(NgControl, null, { self: true, optional: true })
      ?.control;
  }
  private format(value: string, options: Intl.DateTimeFormatOptions): string {
    const key = JSON.stringify([
      this.localeLanguage(),
      this.resolvedCalendar(),
      options,
    ]);
    let formatter = this.formatters.get(key);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat(this.localeLanguage(), {
        ...options,
        calendar: this.resolvedCalendar(),
        numberingSystem: 'latn',
        timeZone: 'UTC',
      });
      this.formatters.set(key, formatter);
    }
    return formatter.format(parseDate(value)!);
  }
  protected allowed(value: string): boolean {
    return (
      this.validBounds() &&
      !!parseDate(value) &&
      value >= this.bounds().min &&
      value <= this.bounds().max
    );
  }
  private clamp(value: string): string {
    return value < this.bounds().min
      ? this.bounds().min
      : value > this.bounds().max
        ? this.bounds().max
        : value;
  }
  protected selected(value: string): boolean {
    const current = this.value();
    return (
      current === value ||
      (Array.isArray(current) && (current[0] === value || current[1] === value))
    );
  }
  protected inRange(value: string): boolean {
    const current = this.value();
    return (
      Array.isArray(current) &&
      !!current[1] &&
      value > current[0] &&
      value < current[1]
    );
  }
  private localToday(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  private refreshToday(): void {
    this.todayValue.set(this.localToday());
  }
  protected openCalendar(): void {
    if (this.open()) {
      this.closeCalendar();
      return;
    }
    if (this.isDisabled() || !this.validBounds()) return;
    this.refreshToday();
    const value = this.value();
    const selected = typeof value === 'string' ? value : value?.[0];
    this.viewDate.set(
      this.clamp(
        selected && parseDate(selected) ? selected : this.todayValue(),
      ),
    );
    this.yearAnchor.set(
      Math.max(
        this.view().year,
        parts(parseDate(this.todayValue())!, this.resolvedCalendar()).year,
      ),
    );
    this.focusRequest.set(this.viewDate());
    this.open.set(true);
  }
  protected closeCalendar(restoreFocus = true): void {
    this.restoreFocus = restoreFocus;
    this.open.set(false);
    this.onTouched();
  }
  protected blur(): void {
    if (!this.open()) this.onTouched();
  }
  protected choose(value: string): void {
    if (this.isDisabled() || !this.allowed(value)) return;
    if (this.resolvedMode() === 'range') {
      const current = this.value();
      if (!Array.isArray(current) || current[1] !== null)
        this.commit([value, null]);
      else {
        this.commit(
          value < current[0] ? [value, current[0]] : [current[0], value],
        );
        this.closeCalendar();
      }
    } else {
      this.commit(value);
      this.closeCalendar();
    }
  }
  protected clear(): void {
    if (!this.isDisabled()) {
      this.commit(null);
      this.closeCalendar();
    }
  }
  protected today(): void {
    this.refreshToday();
    this.choose(this.todayValue());
  }
  protected todayAllowed(): boolean {
    return this.allowed(this.todayValue());
  }
  private commit(value: BuludDatepickerValue): void {
    this.value.set(value);
    this.onChange(value);
  }
  protected canMove(amount: number): boolean {
    const next = shiftMonth(this.viewDate(), amount, this.resolvedCalendar());
    if (!next) return false;
    const clamped = this.clamp(next);
    const p = parts(parseDate(clamped)!, this.resolvedCalendar());
    return p.year !== this.view().year || p.month !== this.view().month;
  }
  protected moveMonth(amount: number): void {
    const value = shiftMonth(this.viewDate(), amount, this.resolvedCalendar());
    if (value) this.viewDate.set(this.clamp(value));
  }
  protected changeYear(year: number): void {
    const current = this.view();
    const date = calendarDate(
      year,
      current.month,
      Math.min(
        current.day,
        daysInMonth(year, current.month, this.resolvedCalendar()),
      ),
      this.resolvedCalendar(),
    );
    if (date && parseDate(iso(date))) this.viewDate.set(this.clamp(iso(date)));
  }
  protected yearKeydown(event: KeyboardEvent, year: number): void {
    const years = this.years();
    const index = years.indexOf(year);
    const target =
      event.key === 'ArrowUp'
        ? years[index - 1]
        : event.key === 'ArrowDown'
          ? years[index + 1]
          : event.key === 'Home'
            ? years[0]
            : event.key === 'End'
              ? years.at(-1)
              : undefined;
    if (target === undefined) return;
    event.preventDefault();
    this.changeYear(target);
    this.yearList()
      ?.nativeElement.querySelector<HTMLButtonElement>(
        `[data-year="${target}"]`,
      )
      ?.focus({ preventScroll: true });
  }
  protected popoverToggle(event: Event): void {
    if (
      (event as ToggleEvent).newState === 'closed' &&
      this.open() &&
      !this.panel()?.nativeElement.matches(':popover-open')
    )
      this.closeCalendar();
  }
  protected panelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeCalendar();
    }
  }
  protected triggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) this.panelKeydown(event);
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.clear();
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.open()) this.openCalendar();
    }
  }
  protected focusOut(event: FocusEvent): void {
    if (
      this.open() &&
      event.relatedTarget instanceof Node &&
      !this.host.nativeElement.contains(event.relatedTarget)
    )
      this.closeCalendar(false);
  }
  private positionPanel(): void {
    const panel = this.panel()?.nativeElement;
    const win = this.document.defaultView;
    if (!panel || !win || !this.open()) return;
    const trigger = this.host.nativeElement.querySelector<HTMLElement>(
      '.bulud-datepicker__trigger',
    );
    if (!trigger) return;
    const anchor = trigger.getBoundingClientRect();
    const rect = panel.getBoundingClientRect();
    const margin = 8;
    const below = win.innerHeight - anchor.bottom - margin;
    const above = anchor.top - margin;
    const top =
      below >= rect.height || below >= above
        ? anchor.bottom
        : anchor.top - rect.height;
    const left =
      this.panelDirection() === 'rtl' ? anchor.right - rect.width : anchor.left;
    panel.style.top = `${Math.max(margin, Math.min(top, win.innerHeight - rect.height - margin))}px`;
    panel.style.left = `${Math.max(margin, Math.min(left, win.innerWidth - rect.width - margin))}px`;
  }
  protected keydown(event: KeyboardEvent, value: string): void {
    this.refreshToday();
    const date = parseDate(value)!;
    const rtl =
      this.document.defaultView?.getComputedStyle(this.host.nativeElement)
        .direction === 'rtl';
    let target: string | null;
    if (event.ctrlKey && event.key === 'Home') {
      event.preventDefault();
      const target = this.clamp(this.todayValue());
      this.viewDate.set(target);
      this.focusRequest.set(target);
      return;
    }
    switch (event.key) {
      case 'ArrowLeft':
        target = addDays(value, rtl ? 1 : -1);
        break;
      case 'ArrowRight':
        target = addDays(value, rtl ? -1 : 1);
        break;
      case 'ArrowUp':
        target = addDays(value, -7);
        break;
      case 'ArrowDown':
        target = addDays(value, 7);
        break;
      case 'Home':
        target = addDays(
          value,
          -((date.getUTCDay() - this.firstWeekday() + 7) % 7),
        );
        break;
      case 'End':
        target = addDays(
          value,
          6 - ((date.getUTCDay() - this.firstWeekday() + 7) % 7),
        );
        break;
      case 'PageUp':
        target = shiftMonth(
          value,
          event.shiftKey ? -12 : -1,
          this.resolvedCalendar(),
        );
        break;
      case 'PageDown':
        target = shiftMonth(
          value,
          event.shiftKey ? 12 : 1,
          this.resolvedCalendar(),
        );
        break;
      default:
        return;
    }
    event.preventDefault();
    if (!target || !parseDate(target)) return;
    target = this.clamp(target);
    this.viewDate.set(target);
    this.focusRequest.set(target);
  }
  writeValue(value: BuludDatepickerValue): void {
    this.value.set(value ?? null);
  }
  registerOnChange(fn: (value: BuludDatepickerValue) => void): void {
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
    if (!this.validBounds()) return { dateBounds: true };
    if (value === null || value === '')
      return this.required() ? { required: true } : null;
    const dates =
      typeof value === 'string' ? [value] : Array.isArray(value) ? value : [];
    if (
      this.resolvedMode() === 'range' &&
      (!Array.isArray(value) ||
        value.length !== 2 ||
        value[1] === null ||
        value[0] > value[1])
    )
      return { dateRange: true };
    if (this.resolvedMode() === 'single' && typeof value !== 'string')
      return { date: true };
    if (!dates.length || dates.some((date) => !parseDate(date)))
      return { date: true };
    if (dates.some((date) => date! < this.bounds().min))
      return { minDate: { min: this.bounds().min, actual: value } };
    if (dates.some((date) => date! > this.bounds().max))
      return { maxDate: { max: this.bounds().max, actual: value } };
    return null;
  }
}
