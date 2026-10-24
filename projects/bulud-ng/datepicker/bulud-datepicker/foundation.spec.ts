import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludDatepicker } from './bulud-datepicker';
describe('Datepicker bounds regression', () => {
  it('rejects malformed and reversed constraints even for an empty optional value', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const f = TestBed.createComponent(BuludDatepicker);
    f.componentRef.setInput('min', '2025-02-30');
    await f.whenStable();
    expect(f.componentInstance.validate()).toEqual({ dateBounds: true });
    f.componentRef.setInput('min', '2025-04-01');
    f.componentRef.setInput('max', '2025-03-01');
    await f.whenStable();
    expect(f.componentInstance.validate()).toEqual({ dateBounds: true });
  });
  it('does not construct day or year DOM while closed', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const f = TestBed.createComponent(BuludDatepicker);
    await f.whenStable();
    expect(
      f.nativeElement.querySelectorAll('[data-date],[data-year]').length,
    ).toBe(0);
    const trigger = f.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    trigger.click();
    await f.whenStable();
    expect(
      f.nativeElement.querySelectorAll('[data-date]').length,
    ).toBeGreaterThan(27);
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await f.whenStable();
    expect(
      f.nativeElement.querySelectorAll('[data-date],[data-year]').length,
    ).toBe(0);
  });
});
