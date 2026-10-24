import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludEmptyState } from './empty-state';
describe('BuludEmptyState', () => {
  it('names the state and updates its description', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const f = TestBed.createComponent(BuludEmptyState);
    f.componentRef.setInput('title', 'No results');
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('section').getAttribute('aria-label'),
    ).toBe('No results');
    expect(f.nativeElement.querySelector('p')).toBeNull();
    f.componentRef.setInput('description', 'Try another filter');
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Try another filter');
    f.destroy();
  });
});
