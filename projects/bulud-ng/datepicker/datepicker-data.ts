import {
  AfterViewInit,
  input,
  output,
  contentChild,
  DestroyRef,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  HostBinding,
  TemplateRef,
  ViewContainerRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { BuludRuntime } from 'bulud-ng/runtime';
import {
  BuludDatepicker,
  buludCalendarParts,
  buludParseIsoDate,
  type BuludDatepickerValue,
} from './datepicker-public-types';
import {
  displayDate,
  isoLocalDate,
  isoTimestamp,
  localDateIso,
  timestampIso,
} from './date-value';

/** Adapts Angour's seconds/range API; the published component owns the calendar. */
@Directive({
  selector: 'bulud-datepicker[buludDatepickerData]',
  standalone: true,
  exportAs: 'buludDatepickerData',
})
export class BuludDatepickerData
  implements ControlValueAccessor, AfterViewInit
{
  private readonly picker = inject(BuludDatepicker);
  private readonly control = inject(NgControl, { self: true, optional: true });
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly runtime = inject(BuludRuntime);
  private readonly translate = {
    instant: (key: string) => this.runtime.text(key, key),
  };
  private readonly views = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);
  readonly language = this.runtime.language;
  readonly calendar = computed(() =>
    this.language() === 'fa' ? ('persian' as const) : ('gregory' as const),
  );
  readonly isRange = input(false);
  readonly hasDefault = input(true);
  readonly dateRange = input<readonly Date[]>([]);
  readonly limitDateStart = input<Date | null>(null);
  readonly limitDateEnd = input<Date | null>(null);
  readonly disabledDate = input(false);
  readonly range = computed(() => this.isRange());
  private readonly defaultValue = computed(() => this.hasDefault());
  private readonly boundsStart = computed(() => this.limitDateStart());
  private readonly boundsEnd = computed(() => this.limitDateEnd());
  private readonly incomingRange = computed(() => this.dateRange());
  private readonly formValue = signal<unknown>(null);
  readonly selection = signal<Date[]>([]);
  readonly textStart = computed(() =>
    displayDate(localDateIso(this.selection()[0]), this.calendar()),
  );
  readonly textEnd = computed(() =>
    displayDate(localDateIso(this.selection()[1]), this.calendar()),
  );
  readonly hasDefaultDisplay = computed(
    () => this.defaultValue() && !timestampIso(this.formValue()),
  );
  readonly defaultPlaceholder = computed(() =>
    this.hasDefaultDisplay()
      ? displayDate(localDateIso(new Date()), this.calendar())
      : null,
  );
  readonly minimum = computed(() => {
    const fallback = new Date();
    fallback.setFullYear(fallback.getFullYear() - 80);
    const date = new Date(this.boundsStart() ?? fallback);
    if (
      date.getHours() ||
      date.getMinutes() ||
      date.getSeconds() ||
      date.getMilliseconds()
    )
      date.setDate(date.getDate() + 1);
    return localDateIso(date);
  });
  readonly maximum = computed(() => {
    const fallback = new Date();
    fallback.setFullYear(fallback.getFullYear() + 1);
    return localDateIso(this.boundsEnd() ?? fallback);
  });
  @HostBinding('class.angour-datepicker-range') get rangeClass() {
    return this.range();
  }
  @HostBinding('class.angour-datepicker-muted') get mutedClass() {
    return this.disabledDate();
  }
  @HostBinding('class.angour-datepicker-default') get defaultClass() {
    return this.hasDefaultDisplay();
  }
  readonly dateChange = output<number>();
  readonly rangeChange = output<Date[]>();
  readonly startChange = output<string>();
  readonly endChange = output<string>();
  private readonly footerTemplate =
    contentChild<TemplateRef<unknown>>('rangeFooter');
  get footer(): TemplateRef<unknown> | undefined {
    return this.footerTemplate();
  }
  private footerView?: EmbeddedViewRef<unknown>;
  private observer?: MutationObserver;
  private animationFrame = 0;
  private previousStartAtEnd = false;
  private visibleMonth: string | null = null;
  private restoreMonth: string | null = null;
  private previousLanguage: string | null = null;
  private lastRangeKey = '|';
  private onChange: (value: unknown) => void = () => {};
  private onTouched = () => {};

  constructor() {
    if (this.control) this.control.valueAccessor = this;
    // Existing forms own validation. Calendar bounds restrict user selection,
    // but loading an existing value must not add a new form-level error.
    this.picker.validate = () => null;
    this.picker.registerOnChange((value) => this.choose(value));
    this.picker.registerOnTouched(() => this.onTouched());
    effect(() => {
      const range = this.range();
      const dates = this.incomingRange();
      const scalar = this.formValue();
      const language = this.language();
      this.calendar();
      untracked(() => {
        if (this.previousLanguage !== language) {
          this.visibleMonth =
            (!range && timestampIso(scalar)) || localDateIso(new Date());
          this.previousLanguage = language;
        }
        if (range) {
          this.selection.set([...dates]);
          const first = localDateIso(dates[0]);
          const last = localDateIso(dates[1]);
          this.picker.writeValue(first ? [first, last] : null);
          this.emitRangeLabels();
        } else this.picker.writeValue(timestampIso(scalar));
      });
    });
    const capture = (event: Event) => {
      if ((event.target as HTMLElement).closest('.bulud-datepicker__trigger')) {
        this.restoreMonth = this.visibleMonth ?? localDateIso(new Date());
      }
      const day = (event.target as HTMLElement).closest<HTMLButtonElement>(
        '[data-date]',
      );
      if (!this.range() || !day || day.disabled) return;
      const current = this.picker.value();
      if (
        Array.isArray(current) &&
        current[1] === null &&
        !!day.dataset['date'] &&
        day.dataset['date']! < current[0]
      ) {
        // Angour starts a new range when the second date precedes the first.
        this.previousStartAtEnd = true;
        this.picker.writeValue(null);
      }
    };
    this.element.addEventListener('click', capture, true);
    this.destroyRef.onDestroy(() => {
      this.element.removeEventListener('click', capture, true);
      this.observer?.disconnect();
      cancelAnimationFrame(this.animationFrame);
      this.footerView?.destroy();
    });
  }

  writeValue(value: unknown): void {
    this.formValue.set(value);
    const date = timestampIso(value);
    if (date) this.visibleMonth = date;
    this.picker.writeValue(date);
  }
  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(value: boolean): void {
    this.picker.setDisabledState(value);
  }

  open(event?: Event): void {
    void event;
    this.element
      .querySelector<HTMLButtonElement>('.bulud-datepicker__trigger')
      ?.click();
  }
  close(): void {
    this.element
      .querySelector('.bulud-datepicker__panel')
      ?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
  }
  submit(): void {
    this.rangeChange.emit([...this.selection()]);
    this.close();
  }

  private choose(value: BuludDatepickerValue): void {
    if (this.range()) {
      if (Array.isArray(value)) {
        this.visibleMonth = value[1] ?? value[0];
        const previous = this.selection();
        const start =
          value[1] && localDateIso(previous[0]) === value[0]
            ? previous[0]
            : isoLocalDate(value[0], this.previousStartAtEnd);
        this.previousStartAtEnd = false;
        const dates = value[1]
          ? [start, isoLocalDate(value[1], true)]
          : [start];
        this.selection.set(dates);
        this.emitRangeLabels();
        if (dates.length === 2) this.rangeChange.emit([...dates]);
      }
      return;
    }
    const timestamp = typeof value === 'string' ? isoTimestamp(value) : null;
    if (typeof value === 'string') this.visibleMonth = value;
    this.formValue.set(timestamp);
    this.onChange(timestamp);
    if (timestamp !== null) this.dateChange.emit(timestamp);
  }

  private emitRangeLabels(): void {
    const key = `${this.textStart()}|${this.textEnd()}`;
    if (key === this.lastRangeKey) return;
    this.lastRangeKey = key;
    this.startChange.emit(this.textStart());
    this.endChange.emit(this.textEnd());
  }

  ngAfterViewInit(): void {
    (() => {
      this.observer = new MutationObserver(() => {
        if (this.animationFrame) return;
        this.animationFrame = requestAnimationFrame(() => {
          this.animationFrame = 0;
          this.skinCalendar();
        });
      });
      this.observer.observe(this.element, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: [
          'data-date',
          'aria-selected',
          'aria-pressed',
          'style',
        ],
      });
    })();
  }

  private skinCalendar(): void {
    const panel = this.element.querySelector<HTMLElement>(
      '.bulud-datepicker__panel',
    );
    if (!panel?.querySelector('.bulud-datepicker__layout')) {
      this.footerView?.destroy();
      this.footerView = undefined;
      return;
    }
    const day = panel.querySelector<HTMLButtonElement>('[data-date]');
    const date = buludParseIsoDate(day?.dataset['date']);
    if (date && this.restoreMonth) {
      const target = this.restoreMonth;
      this.restoreMonth = null;
      const targetDate = buludParseIsoDate(target);
      const currentParts = buludCalendarParts(date, this.calendar());
      const targetParts =
        targetDate && buludCalendarParts(targetDate, this.calendar());
      // A same-month restore does not mutate Angular's DOM. Continue applying
      // labels and anchor geometry instead of waiting for another mutation.
      if (
        targetParts &&
        (targetParts.year !== currentParts.year ||
          targetParts.month !== currentParts.month)
      ) {
        this.picker.showMonth(target);
        return;
      }
    }
    if (day) this.visibleMonth = day.dataset['date'] ?? null;
    const heading = panel.querySelector('.bulud-datepicker__heading');
    if (date && heading) {
      const { month, year } = buludCalendarParts(date, this.calendar());
      let monthLabel = heading.querySelector('.angour-date-heading-month');
      let yearLabel = heading.querySelector('.angour-date-heading-year');
      if (!monthLabel || !yearLabel) {
        // Keep Angular's original text node attached so month/year updates still
        // notify the observer. Separate labels preserve Angour's exact 4px gap.
        const source = this.element.ownerDocument.createElement('span');
        source.hidden = true;
        while (heading.firstChild) source.appendChild(heading.firstChild);
        monthLabel = this.element.ownerDocument.createElement('span');
        monthLabel.className = 'angour-date-heading-month';
        yearLabel = this.element.ownerDocument.createElement('span');
        yearLabel.className = 'angour-date-heading-year';
        heading.append(source, monthLabel, yearLabel);
      }
      const text = this.translate.instant('DATETIME.Months.' + month);
      if (monthLabel.textContent !== text) monthLabel.textContent = text;
      if (yearLabel && yearLabel.textContent !== String(year))
        yearLabel.textContent = String(year);
    }
    panel.querySelectorAll('thead abbr').forEach((label, index) => {
      const text = this.translate.instant('DATETIME.DaysOfWeek.' + (index + 1));
      if (label.firstChild && label.firstChild.nodeValue !== text)
        label.firstChild.nodeValue = text;
    });
    const dates = this.selection();
    const first = localDateIso(dates[0]);
    const last = localDateIso(dates[1]);
    panel
      .querySelectorAll<HTMLButtonElement>('[data-date]')
      .forEach((button) => {
        const start = this.range() && button.dataset['date'] === first;
        const lateStart = !!dates[0] && dates[0].getHours() !== 0;
        button.classList.toggle('angour-date-start', start && !lateStart);
        button.classList.toggle(
          'angour-date-unpainted-start',
          start && lateStart,
        );
        button.classList.toggle(
          'angour-date-end',
          this.range() && button.dataset['date'] === last,
        );
      });
    const firstYear = first
      ? buludCalendarParts(buludParseIsoDate(first)!, this.calendar()).year
      : null;
    const lastYear = last
      ? buludCalendarParts(buludParseIsoDate(last)!, this.calendar()).year
      : null;
    panel
      .querySelectorAll<HTMLButtonElement>('[data-year]')
      .forEach((button) => {
        const year = Number(button.dataset['year']);
        button.classList.toggle(
          'angour-date-year-start',
          this.range() && year === firstYear,
        );
        button.classList.toggle(
          'angour-date-year-end',
          this.range() && year === lastYear,
        );
        button.classList.toggle(
          'angour-date-year-range',
          this.range() &&
            firstYear !== null &&
            lastYear !== null &&
            year > firstYear &&
            year < lastYear,
        );
      });
    if (this.range() && this.footer && !this.footerView) {
      (() => {
        this.footerView = this.views.createEmbeddedView(this.footer);
        for (const node of this.footerView.rootNodes) panel.appendChild(node);
      })();
    }
    this.positionPanel(panel);
  }

  private positionPanel(panel: HTMLElement): void {
    const set = (key: string, value: number) => {
      const text = `${value}px`;
      if (panel.style.getPropertyValue(key) !== text)
        panel.style.setProperty(key, text);
    };
    const anchor = this.element.getBoundingClientRect();
    set('--angour-date-anchor-width', anchor.width);
    const bounds = panel.getBoundingClientRect();
    const rtl = getComputedStyle(this.element).direction === 'rtl';
    const above =
      !this.range() && window.innerHeight - anchor.bottom < bounds.height + 16;
    set('--angour-date-left', rtl ? anchor.right - bounds.width : anchor.left);
    set(
      '--angour-date-top',
      above ? anchor.top - bounds.height : anchor.bottom,
    );
  }
}
