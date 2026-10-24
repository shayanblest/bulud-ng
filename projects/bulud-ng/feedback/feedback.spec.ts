import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  BuludAlert,
  BuludNotifications,
  BuludNotificationService,
} from './feedback';
describe('Bulud feedback', () => {
  it('renders every semantic variant with optional title and icon without unsafe HTML', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const f = TestBed.createComponent(BuludAlert);
    f.componentRef.setInput('title', '<img src=x>');
    for (const kind of [
      'info',
      'success',
      'warning',
      'danger',
      'primary',
      'secondary',
      'neutral',
      'light',
      'dark',
    ]) {
      f.componentRef.setInput('kind', kind);
      await f.whenStable();
      expect(
        f.nativeElement.querySelector('.notice').getAttribute('data-kind'),
      ).toBe(kind);
      expect(f.nativeElement.querySelector('strong').textContent).toBe(
        '<img src=x>',
      );
      expect(f.nativeElement.querySelector('img')).toBeNull();
    }
    f.componentRef.setInput('showIcon', false);
    f.componentRef.setInput('announce', false);
    await f.whenStable();
    expect(f.nativeElement.querySelector('.notice-icon')).toBeNull();
    expect(
      f.nativeElement.querySelector('[role=status], [role=alert]'),
    ).toBeNull();
  });
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('stores immutable notices with unique IDs and removes only matching notices', () => {
    const s = TestBed.inject(BuludNotificationService),
      one = s.show('First'),
      before = s.notices();
    const two = s.show('Second', 'danger');
    expect(one).not.toBe(two);
    expect(before.length).toBe(1);
    s.dismiss(one);
    expect(s.notices().map((n) => n.message)).toEqual(['Second']);
    s.dismiss(-1);
    expect(s.notices().length).toBe(1);
    s.clear();
    expect(s.notices()).toEqual([]);
  });
  it('renders untrusted messages as text and dismisses with native buttons', async () => {
    const f = TestBed.createComponent(BuludNotifications);
    await f.whenStable();
    TestBed.inject(BuludNotificationService).show(
      '<img src=x onerror=alert(1)>',
    );
    await f.whenStable();
    expect(f.nativeElement.querySelector('img')).toBeNull();
    expect(f.nativeElement.textContent).toContain('<img');
    (f.nativeElement.querySelector('button') as HTMLButtonElement).click();
    await f.whenStable();
    expect(TestBed.inject(BuludNotificationService).notices()).toEqual([]);
  });
  it('keeps one live region and moves focus to a stable outlet after dismissing its focused button', async () => {
    const f = TestBed.createComponent(BuludNotifications);
    await f.whenStable();
    TestBed.inject(BuludNotificationService).show('Saved');
    await f.whenStable();
    expect(
      f.nativeElement.querySelectorAll('[role=status], [role=alert]').length,
    ).toBe(0);
    const button = f.nativeElement.querySelector('button') as HTMLButtonElement;
    button.focus();
    button.click();
    await f.whenStable();
    expect(document.activeElement).toBe(
      f.nativeElement.querySelector('[role=group]'),
    );
  });
  it('uses alert for errors, status otherwise and leaves projected removal to consumers', async () => {
    const f = TestBed.createComponent(BuludAlert);
    f.componentRef.setInput('kind', 'danger');
    f.componentRef.setInput('dismissible', true);
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role=alert]')).not.toBeNull();
    const emit = spyOn(f.componentInstance.dismissed, 'emit');
    (f.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(emit).toHaveBeenCalledTimes(1);
  });
});
