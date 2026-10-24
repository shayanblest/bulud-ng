import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludCountdown } from './countdown';
describe('BuludCountdown', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-10-21T00:00:00Z'));
  });
  afterEach(() => jasmine.clock().uninstall());
  it('uses wall-clock remaining time, expires once and cleans up restarted timers', async () => {
    const f = TestBed.createComponent(BuludCountdown);
    f.componentRef.setInput('label', 'Remaining');
    f.componentRef.setInput('deadline', Date.now() + 3000);
    const emit = spyOn(f.componentInstance.expired, 'emit');
    await f.whenStable();
    expect(f.nativeElement.textContent.trim()).toBe('00:00:03');
    jasmine.clock().tick(2000);
    await f.whenStable();
    expect(f.nativeElement.textContent.trim()).toBe('00:00:01');
    jasmine.clock().tick(3000);
    await f.whenStable();
    expect(emit).toHaveBeenCalledTimes(1);
    f.componentRef.setInput('deadline', Date.now() + 2000);
    await f.whenStable();
    f.destroy();
    jasmine.clock().tick(5000);
    expect(emit).toHaveBeenCalledTimes(1);
  });
  it('does not schedule invalid/empty deadlines or announce every tick', async () => {
    const f = TestBed.createComponent(BuludCountdown);
    f.componentRef.setInput('label', 'Timer');
    f.componentRef.setInput('deadline', NaN);
    const emit = spyOn(f.componentInstance.expired, 'emit');
    await f.whenStable();
    jasmine.clock().tick(5000);
    expect(emit).not.toHaveBeenCalled();
    expect(
      f.nativeElement.querySelector('[role=timer]').getAttribute('aria-live'),
    ).toBe('off');
  });
});
