import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideBuludLocale } from 'bulud-ng';
import { BuludDatepicker } from './bulud-datepicker';
import {
  BuludDatepickerValue,
  provideBuludDatepicker,
} from './datepicker-config';

@Component({
  imports: [ReactiveFormsModule, BuludDatepicker],
  template: `<bulud-datepicker
    [formControl]="control"
    required
    calendar="gregory"
    aria-label="Birthday"
    min="2025-03-01"
    max="2025-04-30"
  />`,
})
class DateHost {
  readonly control = new FormControl<BuludDatepickerValue>(null);
}

describe('BuludDatepicker', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  for (const calendar of ['gregory', 'persian'] as const) {
    it(`opens an existing empty ${calendar} picker on the new local day after midnight`, async () => {
      jasmine.clock().mockDate(new Date(2026, 11, 31, 23, 59));
      const f = TestBed.createComponent(BuludDatepicker);
      try {
        f.componentRef.setInput('calendar', calendar);
        await f.whenStable();
        jasmine.clock().mockDate(new Date(2027, 0, 1, 0, 1));
        (f.nativeElement.querySelector('button') as HTMLButtonElement).click();
        await f.whenStable();
        const today = f.nativeElement.querySelector(
          '[data-date="2027-01-01"]',
        ) as HTMLButtonElement;
        expect(today?.getAttribute('aria-current')).toBe('date');
        expect(today?.getAttribute('tabindex')).toBe('0');
        expect(
          f.nativeElement.querySelectorAll('[aria-current="date"]').length,
        ).toBe(1);
        today.click();
        await f.whenStable();
        expect(f.componentInstance.value()).toBe('2027-01-01');
      } finally {
        f.destroy();
        jasmine.clock().uninstall();
      }
    });
    it(`refreshes today for Ctrl+Home in an open ${calendar} picker across midnight`, async () => {
      jasmine.clock().mockDate(new Date(2026, 11, 31, 23, 59));
      const f = TestBed.createComponent(BuludDatepicker);
      try {
        f.componentRef.setInput('calendar', calendar);
        await f.whenStable();
        (f.nativeElement.querySelector('button') as HTMLButtonElement).click();
        await f.whenStable();
        const previousDay = f.nativeElement.querySelector(
          '[data-date="2026-12-31"]',
        ) as HTMLButtonElement;
        expect(previousDay.getAttribute('aria-current')).toBe('date');
        jasmine.clock().mockDate(new Date(2027, 0, 1, 0, 1));
        previousDay.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Home',
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
          }),
        );
        await f.whenStable();
        const today = f.nativeElement.querySelector(
          '[data-date="2027-01-01"]',
        ) as HTMLButtonElement;
        expect(today?.getAttribute('aria-current')).toBe('date');
        expect(today?.getAttribute('tabindex')).toBe('0');
        expect(
          f.nativeElement.querySelectorAll('[aria-current="date"]').length,
        ).toBe(1);
        expect(f.componentInstance.value()).toBeNull();
      } finally {
        f.destroy();
        jasmine.clock().uninstall();
      }
    });
  }
  it('refreshes the today marker without replacing a selection or bypassing maximum bounds', async () => {
    jasmine.clock().mockDate(new Date(2026, 11, 31, 23, 59));
    const f = TestBed.createComponent(BuludDatepicker);
    try {
      f.componentRef.setInput('calendar', 'gregory');
      f.componentRef.setInput('max', '2026-12-31');
      f.componentInstance.writeValue('2026-12-30');
      await f.whenStable();
      jasmine.clock().mockDate(new Date(2027, 0, 1, 0, 1));
      (f.nativeElement.querySelector('button') as HTMLButtonElement).click();
      await f.whenStable();
      const selected = f.nativeElement.querySelector(
        '[data-date="2026-12-30"]',
      ) as HTMLButtonElement;
      expect(
        selected.closest('[role="gridcell"]')!.getAttribute('aria-selected'),
      ).toBe('true');
      expect(
        f.nativeElement.querySelectorAll('[aria-current="date"]').length,
      ).toBe(0);
      selected.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Home',
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
      await f.whenStable();
      expect(
        f.nativeElement
          .querySelector('[data-date="2026-12-31"]')
          .getAttribute('tabindex'),
      ).toBe('0');
      expect(
        f.nativeElement.querySelectorAll('[aria-current="date"]').length,
      ).toBe(0);
      expect(f.componentInstance.value()).toBe('2026-12-30');
    } finally {
      f.destroy();
      jasmine.clock().uninstall();
    }
  });
  for (const mode of ['single', 'range'] as const)
    it(`clears a ${mode} value with the named pointer action and restores trigger focus`, async () => {
      const f = TestBed.createComponent(BuludDatepicker);
      f.componentRef.setInput('mode', mode);
      f.componentRef.setInput('language', 'en');
      f.componentRef.setInput('required', true);
      f.componentInstance.writeValue(
        mode === 'single' ? '2026-10-24' : ['2026-10-24', '2026-10-25'],
      );
      const change = jasmine.createSpy('change'),
        touched = jasmine.createSpy('touched');
      f.componentInstance.registerOnChange(change);
      f.componentInstance.registerOnTouched(touched);
      await f.whenStable();
      const trigger = f.nativeElement.querySelector(
        '.bulud-datepicker__trigger',
      ) as HTMLButtonElement;
      trigger.click();
      await f.whenStable();
      const clear = f.nativeElement.querySelector(
        '.bulud-datepicker__clear',
      ) as HTMLButtonElement;
      expect(clear.textContent!.trim()).toBe('Clear date');
      clear.click();
      await f.whenStable();
      expect(change).toHaveBeenCalledOnceWith(null);
      expect(touched).toHaveBeenCalled();
      expect(f.componentInstance.validate()).toEqual({ required: true });
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(trigger);
      trigger.click();
      await f.whenStable();
      expect(
        f.nativeElement.querySelector('.bulud-datepicker__clear'),
      ).toBeNull();
      f.destroy();
    });
  it('writes, resets and disables through Angular Forms without changing the ISO value', async () => {
    const f = TestBed.createComponent(DateHost);
    await f.whenStable();
    const c = f.componentInstance.control;
    expect(c.hasError('required')).toBeTrue();
    c.setValue('2025-03-21');
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('.bulud-datepicker__trigger').textContent,
    ).toContain('2025/3/21');
    c.disable();
    await f.whenStable();
    expect(f.nativeElement.querySelector('button').disabled).toBeTrue();
    c.enable();
    c.reset();
    await f.whenStable();
    expect(c.hasError('required')).toBeTrue();
  });
  it('keeps the same date when changing display calendar and locale', async () => {
    const f = TestBed.createComponent(BuludDatepicker);
    f.componentRef.setInput('value', '2025-03-21');
    f.componentRef.setInput('language', 'fa');
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('1404');
    f.componentRef.setInput('language', 'en');
    await f.whenStable();
    expect(f.componentInstance.value()).toBe('2025-03-21');
    expect(f.nativeElement.textContent).toContain('2025/3/21');
  });
  it('validates malformed, out-of-bounds and incomplete/reversed ranges', async () => {
    const f = TestBed.createComponent(BuludDatepicker);
    f.componentRef.setInput('min', '2025-03-01');
    f.componentRef.setInput('max', '2025-04-30');
    await f.whenStable();
    const c = f.componentInstance;
    c.writeValue('2025-02-30');
    expect(c.validate()).toEqual({ date: true });
    c.writeValue('2025-02-28');
    expect(c.validate()?.['minDate']).toBeDefined();
    c.writeValue('2025-05-01');
    expect(c.validate()?.['maxDate']).toBeDefined();
    f.componentRef.setInput('mode', 'range');
    c.writeValue(['2025-03-21', null]);
    await f.whenStable();
    expect(c.validate()).toEqual({ dateRange: true });
    c.writeValue(['2025-03-22', '2025-03-21']);
    expect(c.validate()).toEqual({ dateRange: true });
    c.writeValue(['2025-03-21', '2025-03-22']);
    expect(c.validate()).toBeNull();
  });
  it('does not emit user change on writeValue and reacts to validator input changes', async () => {
    const f = TestBed.createComponent(BuludDatepicker);
    const c = f.componentInstance;
    const change = jasmine.createSpy('change');
    const validate = jasmine.createSpy('validator');
    c.registerOnChange(change);
    c.registerOnValidatorChange(validate);
    c.writeValue('2025-03-21');
    f.componentRef.setInput('required', true);
    f.componentRef.setInput('min', '2025-04-01');
    await f.whenStable();
    expect(change).not.toHaveBeenCalled();
    expect(validate).toHaveBeenCalled();
    expect(c.validate()?.['minDate']).toBeDefined();
  });
  it('applies component defaults, then explicit calendar/mode/weekday/theme inputs', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideBuludLocale({ language: 'en' }),
        provideBuludDatepicker({
          calendar: 'persian',
          mode: 'range',
          firstDayOfWeek: 6,
          theme: { selectedBackground: '#123456' },
        }),
      ],
    });
    const f = TestBed.createComponent(BuludDatepicker);
    f.componentRef.setInput('value', '2025-03-21');
    await f.whenStable();
    expect(
      f.nativeElement.style.getPropertyValue(
        '--bulud-datepicker-selected-background',
      ),
    ).toBe('#123456');
    expect(f.nativeElement.textContent).toContain('1404');
    f.componentRef.setInput('calendar', 'gregory');
    f.componentRef.setInput('mode', 'single');
    f.componentRef.setInput('firstDayOfWeek', 1);
    f.componentRef.setInput('theme', { selectedBackground: '#654321' });
    await f.whenStable();
    expect(
      f.nativeElement.style.getPropertyValue(
        '--bulud-datepicker-selected-background',
      ),
    ).toBe('#654321');
    const trigger = f.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    trigger.click();
    await f.whenStable();
    expect(f.nativeElement.querySelector('th').textContent.trim()).toBe('Mo');
    const day = f.nativeElement.querySelector(
      '[data-date="2025-03-22"]',
    ) as HTMLButtonElement;
    day.click();
    await f.whenStable();
    expect(f.componentInstance.value()).toBe('2025-03-22');
  });
  it('emits a partial range then orders both endpoints and closes', async () => {
    const f = TestBed.createComponent(BuludDatepicker);
    f.componentRef.setInput('mode', 'range');
    f.componentRef.setInput('calendar', 'gregory');
    f.componentRef.setInput('value', ['2025-03-21', '2025-03-25']);
    await f.whenStable();
    const change = jasmine.createSpy('change');
    const touch = jasmine.createSpy('touch');
    f.componentInstance.registerOnChange(change);
    f.componentInstance.registerOnTouched(touch);
    (f.nativeElement.querySelector('button') as HTMLButtonElement).click();
    await f.whenStable();
    (
      f.nativeElement.querySelector(
        '[data-date="2025-03-23"]',
      ) as HTMLButtonElement
    ).click();
    await f.whenStable();
    expect(f.componentInstance.value()).toEqual(['2025-03-23', null]);
    (
      f.nativeElement.querySelector(
        '[data-date="2025-03-21"]',
      ) as HTMLButtonElement
    ).click();
    await f.whenStable();
    expect(f.componentInstance.value()).toEqual(['2025-03-21', '2025-03-23']);
    expect(change).toHaveBeenCalledTimes(2);
    expect(touch).toHaveBeenCalled();
  });
  it('clamps an open view after bounds change without changing the stored date', async () => {
    const f = TestBed.createComponent(BuludDatepicker);
    f.componentRef.setInput('calendar', 'gregory');
    f.componentRef.setInput('value', '2025-03-21');
    await f.whenStable();
    (f.nativeElement.querySelector('button') as HTMLButtonElement).click();
    await f.whenStable();
    f.componentRef.setInput('min', '2025-03-25');
    await f.whenStable();
    expect(f.componentInstance.value()).toBe('2025-03-21');
    expect(
      f.nativeElement
        .querySelector('[data-date="2025-03-25"]')
        .getAttribute('tabindex'),
    ).toBe('0');
    expect(
      f.nativeElement.querySelector('[data-date="2025-03-24"]').disabled,
    ).toBeTrue();
    f.componentRef.setInput('disabled', true);
    await f.whenStable();
    expect(
      f.nativeElement
        .querySelector('.bulud-datepicker__trigger')
        .getAttribute('aria-expanded'),
    ).toBe('false');
  });
  it('navigates years without committing, clamps leap day, and closes from the trigger with Escape', async () => {
    const f = TestBed.createComponent(BuludDatepicker);
    f.componentRef.setInput('calendar', 'gregory');
    f.componentRef.setInput('value', '2024-02-29');
    f.componentRef.setInput('min', '2023-01-01');
    f.componentRef.setInput('max', '2025-12-31');
    const change = jasmine.createSpy('change');
    f.componentInstance.registerOnChange(change);
    await f.whenStable();
    const trigger = f.nativeElement.querySelector(
      '.bulud-datepicker__trigger',
    ) as HTMLButtonElement;
    trigger.click();
    await f.whenStable();
    (
      f.nativeElement.querySelector('[data-year="2023"]') as HTMLButtonElement
    ).click();
    await f.whenStable();
    expect(f.componentInstance.value()).toBe('2024-02-29');
    expect(change).not.toHaveBeenCalled();
    expect(
      f.nativeElement
        .querySelector('[data-year="2023"]')
        .getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      f.nativeElement
        .querySelector('[data-date="2023-02-28"]')
        .getAttribute('tabindex'),
    ).toBe('0');
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    );
    await f.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
  it('guards Persian era boundaries even if an earlier minimum is supplied', async () => {
    const f = TestBed.createComponent(BuludDatepicker);
    f.componentRef.setInput('calendar', 'persian');
    f.componentRef.setInput('min', '0001-01-01');
    f.componentInstance.writeValue('0622-03-21');
    await f.whenStable();
    expect(f.componentInstance.validate()?.['minDate']).toBeDefined();
  });
  it('uses distinct compact weekday labels with full names and respects the configured week start', async () => {
    const f = TestBed.createComponent(BuludDatepicker);
    f.componentRef.setInput('language', 'fa');
    f.componentRef.setInput('calendar', 'persian');
    f.componentRef.setInput('firstDayOfWeek', 6);
    await f.whenStable();
    f.nativeElement.querySelector('.bulud-datepicker__trigger').click();
    await f.whenStable();
    const headers = () =>
      Array.from(
        f.nativeElement.querySelectorAll('th'),
      ) as HTMLTableCellElement[];
    expect(headers().map((el) => el.textContent!.trim())).toEqual([
      'ش',
      'ی',
      'د',
      'س',
      'چ',
      'پ',
      'ج',
    ]);
    for (const header of headers()) {
      expect(header.getAttribute('aria-label')).toBe(
        header.querySelector('abbr')!.title,
      );
      expect(header.getAttribute('aria-label')!.length).toBeGreaterThan(1);
    }
    f.componentRef.setInput('firstDayOfWeek', 1);
    await f.whenStable();
    expect(headers()[0].textContent!.trim()).toBe('د');
    f.componentRef.setInput('language', 'en');
    f.componentRef.setInput('calendar', 'gregory');
    f.componentRef.setInput('firstDayOfWeek', 0);
    await f.whenStable();
    expect(headers().map((el) => el.textContent!.trim())).toEqual([
      'Su',
      'Mo',
      'Tu',
      'We',
      'Th',
      'Fr',
      'Sa',
    ]);
    expect(headers()[0].getAttribute('aria-label')).toBe('Sunday');
  });
});
