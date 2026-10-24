import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludDonutChart } from './donut';
import { BuludProgress } from './progress';
describe('Chart extras', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('renders donut slices, empty/loading/error and bounded input', async () => {
    const f = TestBed.createComponent(BuludDonutChart);
    f.componentRef.setInput('caption', 'Distribution');
    f.componentRef.setInput('segments', [
      { label: 'One', value: 20 },
      { label: 'Two', value: 80 },
    ]);
    await f.whenStable();
    expect(f.nativeElement.querySelectorAll('circle.slice').length).toBe(2);
    expect(f.nativeElement.textContent).toContain('100');
    f.componentRef.setInput('segments', []);
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('No chart data');
    f.componentRef.setInput('loading', true);
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Loading');
    f.componentRef.setInput('loading', false);
    f.componentRef.setInput('segments', [{ label: 'Bad', value: -1 }]);
    await f.whenStable();
    expect(f.nativeElement.querySelector('svg')).toBeNull();
    expect(f.nativeElement.textContent).toContain('Invalid');
    f.componentRef.setInput(
      'segments',
      Array.from({ length: 65 }, () => ({ label: 'x', value: 1 })),
    );
    await f.whenStable();
    expect(f.nativeElement.querySelector('svg')).toBeNull();
    f.destroy();
  });
  it('supports bar and ring progress without misleading invalid or loading values', async () => {
    const f = TestBed.createComponent(BuludProgress);
    f.componentRef.setInput('label', 'Progress');
    f.componentRef.setInput('value', 65);
    await f.whenStable();
    expect(
      f.nativeElement
        .querySelector('[role=progressbar]')
        .getAttribute('aria-valuenow'),
    ).toBe('65');
    f.componentRef.setInput('variant', 'ring');
    await f.whenStable();
    expect(f.nativeElement.querySelector('svg')).not.toBeNull();
    f.componentRef.setInput('loading', true);
    await f.whenStable();
    expect(
      f.nativeElement
        .querySelector('[role=progressbar]')
        .hasAttribute('aria-valuenow'),
    ).toBeFalse();
    f.componentRef.setInput('loading', false);
    for (const value of [-1, 101, NaN, Infinity]) {
      f.componentRef.setInput('value', value);
      await f.whenStable();
      expect(f.nativeElement.querySelector('[role=progressbar]')).toBeNull();
    }
    f.destroy();
  });
});
