import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludSkeleton } from './skeleton';
describe('BuludSkeleton', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  for (const [value, count] of [
    [-2, 1],
    [0, 1],
    [2.9, 2],
    [999999, 12],
    [NaN, 3],
    [Infinity, 3],
  ]) {
    it(`bounds row allocation for ${value}`, async () => {
      const f = TestBed.createComponent(BuludSkeleton);
      f.componentRef.setInput('lines', value);
      await f.whenStable();
      expect(f.nativeElement.querySelectorAll('.line').length).toBe(count);
    });
  }
  it('reacts to shapes and makes announcement opt-in', async () => {
    const f = TestBed.createComponent(BuludSkeleton);
    await f.whenStable();
    expect(f.nativeElement.getAttribute('aria-hidden')).toBe('true');
    for (const shape of ['circle', 'thumbnail', 'card']) {
      f.componentRef.setInput('shape', shape);
      await f.whenStable();
      expect(
        f.nativeElement
          .querySelector('[data-shape]')
          .getAttribute('data-shape'),
      ).toBe(shape);
    }
    f.componentRef.setInput('announce', true);
    f.componentRef.setInput('label', 'Loading profile');
    f.componentRef.setInput('animated', false);
    await f.whenStable();
    expect(f.nativeElement.getAttribute('role')).toBe('status');
    expect(f.nativeElement.getAttribute('aria-label')).toBe('Loading profile');
    expect(f.nativeElement.hasAttribute('aria-hidden')).toBeFalse();
    expect(f.nativeElement.querySelector('.still')).not.toBeNull();
  });
});
