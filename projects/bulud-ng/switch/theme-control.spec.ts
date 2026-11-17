import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludSwitch } from './bulud-switch/bulud-switch';
import { BULUD_APPEARANCE_CONFIG, BuludAppearance } from 'bulud-ng/appearance';
import { BuludThemeControl } from './theme-control';
@Component({
  imports: [BuludSwitch, BuludThemeControl],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template:
    '<bulud-switch buludThemeControl appearance="theme" aria-label="Theme" />',
})
class Host {}
describe('BuludThemeControl preference connection', () => {
  let previousTheme: string | null;
  beforeEach(() => {
    previousTheme = document.documentElement.getAttribute('data-bs-theme');
  });
  afterEach(() => {
    if (previousTheme === null)
      document.documentElement.removeAttribute('data-bs-theme');
    else document.documentElement.setAttribute('data-bs-theme', previousTheme);
  });
  let saved: string[];
  beforeEach(() => {
    saved = [];
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BULUD_APPEARANCE_CONFIG,
          useValue: {
            readTheme: () => 'dark',
            writeTheme: (theme: string) => saved.push(theme),
          },
        },
      ],
    });
  });
  it('restores the existing preference without persisting and saves exactly once per click', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.checked).toBeTrue();
    expect(saved).toEqual([]);
    input.click();
    await f.whenStable();
    expect(input.checked).toBeFalse();
    expect(TestBed.inject(BuludAppearance).theme()).toBe('light');
    expect(saved).toEqual(['light']);
  });
  it('reacts to external preference changes and stops synchronizing a destroyed view', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const service = TestBed.inject(BuludAppearance),
      input = f.nativeElement.querySelector('input') as HTMLInputElement;
    service.setTheme('light');
    await f.whenStable();
    expect(input.checked).toBeFalse();
    f.destroy();
    service.setTheme('dark');
    expect(input.checked).toBeFalse();
  });
});
