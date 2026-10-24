import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludAvatar } from './avatar';
describe('BuludAvatar', () => {
  it('names initials and recovers from image failure without loops', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const f = TestBed.createComponent(BuludAvatar);
    f.componentRef.setInput('name', 'Bulud Library');
    await f.whenStable();
    expect(f.nativeElement.getAttribute('aria-label')).toBe('Bulud Library');
    expect(f.nativeElement.textContent).toContain('BL');
    f.componentRef.setInput('src', 'broken.png');
    await f.whenStable();
    f.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    await f.whenStable();
    expect(f.nativeElement.querySelector('img')).toBeNull();
    f.componentRef.setInput('src', 'other.png');
    await f.whenStable();
    expect(f.nativeElement.querySelector('img')).not.toBeNull();
    f.destroy();
  });
});
