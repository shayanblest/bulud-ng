import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludPeriodPicker, buludPeriodRange } from './period-picker';
describe('BuludPeriodPicker', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('converts Gregorian and Persian inclusive ranges and rejects malformed values', () => {
    expect(
      buludPeriodRange({ calendar: 'gregory', year: 2024, month: 2 }),
    ).toEqual({ from: '2024-02-01', to: '2024-02-29' });
    expect(
      buludPeriodRange({ calendar: 'persian', year: 1403, month: 1 }),
    ).toEqual({ from: '2024-03-20', to: '2024-04-19' });
    expect(buludPeriodRange({ calendar: 'gregory', year: 2024 })).toEqual({
      from: '2024-01-01',
      to: '2024-12-31',
    });
    for (const value of [
      null,
      [],
      {},
      { calendar: 'bad', year: 2024 },
      { calendar: 'persian', year: 0 },
      { calendar: 'gregory', year: 2024, month: 13 },
    ])
      expect(buludPeriodRange(value)).toBeNull();
  });
  it('keeps terminal Gregorian ranges within four-digit ISO dates', () => {
    expect(buludPeriodRange({ calendar: 'gregory', year: 9999 })).toEqual({
      from: '9999-01-01',
      to: '9999-12-31',
    });
    expect(
      buludPeriodRange({ calendar: 'gregory', year: 9999, month: 12 }),
    ).toEqual({
      from: '9999-12-01',
      to: '9999-12-31',
    });
    expect(
      buludPeriodRange({ calendar: 'gregory', year: 1, month: 2 }),
    ).toEqual({
      from: '0001-02-01',
      to: '0001-02-28',
    });
    expect(buludPeriodRange({ calendar: 'gregory', year: 10000 })).toBeNull();
    expect(buludPeriodRange({ calendar: 'persian', year: 9999 })).toBeNull();
  });
  for (const mode of ['month', 'year'] as const)
    it(`selects the terminal Gregorian ${mode} and stops forward navigation`, async () => {
      const f = TestBed.createComponent(BuludPeriodPicker);
      f.componentRef.setInput('label', 'Period');
      f.componentRef.setInput('calendar', 'gregory');
      f.componentRef.setInput('mode', mode);
      f.componentRef.setInput('max', '9999-12-31');
      f.componentInstance.writeValue({
        calendar: 'gregory',
        year: 9998,
        ...(mode === 'month' ? { month: 12 } : {}),
      });
      let changed: unknown;
      f.componentInstance.registerOnChange((value) => (changed = value));
      await f.whenStable();
      const next = f.nativeElement.querySelector(
        '[aria-label="Next year"]',
      ) as HTMLButtonElement;
      expect(next.disabled).toBeFalse();
      next.click();
      await f.whenStable();
      if (mode === 'month') {
        const december = f.nativeElement.querySelectorAll(
          '.months button',
        )[11] as HTMLButtonElement;
        expect(december.disabled).toBeFalse();
        december.click();
        await f.whenStable();
      }
      expect(changed).toEqual({
        calendar: 'gregory',
        year: 9999,
        ...(mode === 'month' ? { month: 12 } : {}),
      });
      expect(f.componentInstance.validate()).toBeNull();
      expect(next.disabled).toBeTrue();
      next.click();
      await f.whenStable();
      expect(f.componentInstance.value()?.year).toBe(9999);
      f.componentRef.setInput('max', '9999-12-30');
      await f.whenStable();
      expect(f.componentInstance.validate()).toEqual({ periodRange: true });
      f.destroy();
    });
  for (const calendar of ['gregory', 'persian'] as const) {
    const before =
      calendar === 'gregory'
        ? new Date(2026, 11, 31, 23, 59)
        : new Date(2026, 2, 20, 23, 59);
    const after =
      calendar === 'gregory'
        ? new Date(2027, 0, 1, 0, 1)
        : new Date(2026, 2, 21, 0, 1);
    it(`refreshes the empty ${calendar} year on interaction after New Year`, async () => {
      jasmine.clock().mockDate(before);
      const f = TestBed.createComponent(BuludPeriodPicker);
      try {
        f.componentRef.setInput('label', 'Period');
        f.componentRef.setInput('calendar', calendar);
        await f.whenStable();
        const year = f.nativeElement.querySelector('input') as HTMLInputElement;
        const expected = calendar === 'gregory' ? 2027 : 1405;
        expect(year.valueAsNumber).toBe(calendar === 'gregory' ? 2026 : 1404);
        jasmine.clock().mockDate(after);
        f.nativeElement.dispatchEvent(
          new FocusEvent('focusin', { bubbles: true }),
        );
        await f.whenStable();
        expect(year.valueAsNumber).toBe(expected);
        expect(f.componentInstance.value()).toBeNull();
        year.value = calendar === 'gregory' ? '2000' : '1400';
        year.dispatchEvent(new Event('change'));
        await f.whenStable();
        f.componentInstance.clear();
        await f.whenStable();
        expect(year.valueAsNumber).toBe(expected);
      } finally {
        f.destroy();
        jasmine.clock().uninstall();
      }
    });
    it(`clears a selected ${calendar} period to the fresh local year after New Year`, async () => {
      jasmine.clock().mockDate(before);
      const f = TestBed.createComponent(BuludPeriodPicker);
      try {
        f.componentRef.setInput('label', 'Period');
        f.componentRef.setInput('calendar', calendar);
        f.componentInstance.writeValue({
          calendar,
          year: calendar === 'gregory' ? 2026 : 1404,
          month: 1,
        });
        await f.whenStable();
        jasmine.clock().mockDate(after);
        f.componentInstance.clear();
        await f.whenStable();
        expect(f.componentInstance.value()).toBeNull();
        expect(
          (f.nativeElement.querySelector('input') as HTMLInputElement)
            .valueAsNumber,
        ).toBe(calendar === 'gregory' ? 2027 : 1405);
      } finally {
        f.destroy();
        jasmine.clock().uninstall();
      }
    });
  }
  it('supports required, bounds, selection, touched, reset and disabled', async () => {
    const f = TestBed.createComponent(BuludPeriodPicker);
    f.componentRef.setInput('label', 'Month');
    f.componentRef.setInput('required', true);
    f.componentRef.setInput('calendar', 'gregory');
    await f.whenStable();
    expect(f.componentInstance.validate()).toEqual({ required: true });
    let changed: unknown,
      touched = 0;
    f.componentInstance.registerOnChange((v) => (changed = v));
    f.componentInstance.registerOnTouched(() => touched++);
    f.componentInstance.writeValue({
      calendar: 'gregory',
      year: 2024,
      month: 2,
    });
    await f.whenStable();
    expect(f.componentInstance.validate()).toBeNull();
    f.componentRef.setInput('min', '2024-02-01');
    f.componentRef.setInput('max', '2024-03-31');
    await f.whenStable();
    const months = f.nativeElement.querySelectorAll(
      '.months button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(months[0].disabled).toBeTrue();
    months[2].click();
    await f.whenStable();
    expect(changed).toEqual({ calendar: 'gregory', year: 2024, month: 3 });
    expect(touched).toBe(1);
    f.componentInstance.setDisabledState(true);
    await f.whenStable();
    expect(f.nativeElement.querySelector('fieldset').disabled).toBeTrue();
    f.componentInstance.clear();
    expect(changed).not.toBeNull();
    f.componentInstance.setDisabledState(false);
    f.componentInstance.clear();
    await f.whenStable();
    expect(changed).toBeNull();
    expect(f.componentInstance.validate()).toEqual({ required: true });
    f.componentInstance.writeValue({
      calendar: 'gregory',
      year: 2023,
      month: 2,
    });
    expect(f.componentInstance.validate()).toEqual({ periodRange: true });
    f.componentRef.setInput('max', 'bad');
    await f.whenStable();
    expect(f.componentInstance.validate()).toEqual({ periodBounds: true });
    f.destroy();
  });
  it('validates year mode and runtime configuration without throwing', async () => {
    const f = TestBed.createComponent(BuludPeriodPicker);
    f.componentRef.setInput('label', 'Year');
    f.componentRef.setInput('mode', 'year');
    f.componentRef.setInput('calendar', 'gregory');
    f.componentInstance.writeValue({
      calendar: 'gregory',
      year: 2024,
      month: 2,
    });
    await f.whenStable();
    expect(f.componentInstance.validate()).toEqual({ period: true });
    expect(f.nativeElement.querySelector('.months')).toBeNull();
    f.componentRef.setInput('calendar', 'bad');
    await f.whenStable();
    expect(f.componentInstance.validate()).toEqual({ periodConfig: true });
    f.destroy();
  });
});
