import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludLoadingBar, BuludLoadingService } from './loading-bar';
describe('Page loading', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('tracks independent operations, clamps finite progress, and ignores stale handles', () => {
    const s = TestBed.inject(BuludLoadingService),
      a = s.start(20),
      b = s.start();
    expect(s.active()).toBeTrue();
    expect(s.progress()).toBeNull();
    s.update(b, 200);
    expect(s.progress()).toBe(60);
    s.finish(a);
    s.update(a, -100);
    expect(s.progress()).toBe(100);
    s.update(b, NaN);
    expect(s.progress()).toBeNull();
    s.finish(b);
    s.finish(b);
    expect(s.active()).toBeFalse();
  });
  it('cleans up rejected and throwing operations', async () => {
    const s = TestBed.inject(BuludLoadingService);
    await expectAsync(
      s.during(async () => {
        throw new Error('failure');
      }),
    ).toBeRejected();
    expect(s.active()).toBeFalse();
    expect(await s.during(async () => 42)).toBe(42);
    expect(s.active()).toBeFalse();
  });
  it('exposes real progress and explicit instance overrides', async () => {
    const f = TestBed.createComponent(BuludLoadingBar),
      s = TestBed.inject(BuludLoadingService);
    await f.whenStable();
    expect(f.nativeElement.getAttribute('role')).toBeNull();
    const id = s.start(45);
    await f.whenStable();
    expect(f.nativeElement.getAttribute('aria-valuenow')).toBe('45');
    f.componentRef.setInput('value', null);
    await f.whenStable();
    expect(f.nativeElement.hasAttribute('aria-valuenow')).toBeFalse();
    f.componentRef.setInput('active', false);
    await f.whenStable();
    expect(f.nativeElement.getAttribute('role')).toBeNull();
    s.finish(id);
  });
});
