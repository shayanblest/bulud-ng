import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludCountdown } from './countdown';
describe('BuludCountdown Unix seconds lifecycle', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2024-01-01T00:00:00Z'));
  });
  afterEach(() => jasmine.clock().uninstall());
  async function setup() {
    const f = TestBed.createComponent(BuludCountdown);
    f.componentRef.setInput('label', 'Remaining time');f.componentRef.setInput('format','mm:ss');
    await f.whenStable();
    return f;
  }
  it('renders separate minute/second fields and expires once on the exact second', async () => {
    const f = await setup();
    let events = 0;
    f.componentInstance.expired.subscribe(() => events++);
    f.componentInstance.start(Date.now() / 1000 + 62);
    await f.whenStable();
    expect(f.nativeElement.textContent).toBe('01:02');
    expect(
      f.nativeElement.querySelector('[role=timer]').getAttribute('aria-label'),
    ).toBe('Remaining time');
    jasmine.clock().tick(62000);
    await f.whenStable();
    expect(f.nativeElement.textContent).toBe('00:00');
    expect(events).toBe(1);
    jasmine.clock().tick(10000);
    expect(events).toBe(1);
  });
  it('stops old intervals on stop, restart and destroy without stale expiry callbacks', async () => {
    const f = await setup();
    let events = 0;
    f.componentInstance.expired.subscribe(() => events++);
    f.componentInstance.start(Date.now() / 1000 + 3);
    f.componentInstance.stop();
    jasmine.clock().tick(5000);
    await f.whenStable();
    expect(events).toBe(0);
    expect(f.nativeElement.textContent).toBe('00:03');
    f.componentInstance.start(Date.now() / 1000 + 3);
    f.componentInstance.start(Date.now() / 1000 + 10);
    jasmine.clock().tick(3000);
    await f.whenStable();
    expect(events).toBe(0);
    expect(f.nativeElement.textContent).toBe('00:07');
    f.destroy();
    jasmine.clock().tick(20000);
    expect(events).toBe(0);
  });
});
