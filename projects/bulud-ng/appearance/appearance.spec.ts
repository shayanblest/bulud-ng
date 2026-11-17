import { TestBed } from '@angular/core/testing';
import { BULUD_APPEARANCE_CONFIG, BuludAppearance } from './appearance';
describe('BuludAppearance project-independent preferences', () => {
  let previousTheme: string | null;
  beforeEach(() => {
    previousTheme = document.documentElement.getAttribute('data-bs-theme');
  });
  afterEach(() => {
    if (previousTheme === null)
      document.documentElement.removeAttribute('data-bs-theme');
    else document.documentElement.setAttribute('data-bs-theme', previousTheme);
  });
  it('restores a configured theme and cycles any number of project-defined themes without locale or account dependencies', () => {
    const stored: string[] = [];
    const persisted: string[] = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BULUD_APPEARANCE_CONFIG,
          useValue: {
            themes: ['light', 'dark', 'contrast'],
            readTheme: () => 'dark',
            writeTheme: (theme: string) => stored.push(theme),
            persistTheme: (theme: string) => {
              persisted.push(theme);
            },
          },
        },
      ],
    });
    const service = TestBed.inject(BuludAppearance),
      values: string[] = [];
    service.getThemeMode().subscribe((value) => values.push(value));
    expect(service.theme()).toBe('dark');
    service.toggleThemeMode();
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe(
      'contrast',
    );
    service.toggleThemeMode();
    expect(service.themeMode).toBe('light');
    service.setTheme('unknown');
    expect(service.themeMode).toBe('light');
    expect(values).toEqual(['dark', 'contrast', 'light']);
    expect(stored).toEqual(['contrast', 'light']);
    expect(persisted).toEqual(['contrast', 'light']);
  });
  it('falls back from an unknown stored mode, keeps persistence-only changes separate, reports failures and preserves sidebar states', async () => {
    const errors: unknown[] = [];
    const failure = new Error('offline');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BULUD_APPEARANCE_CONFIG,
          useValue: {
            readTheme: () => 'missing',
            persistTheme: () => Promise.reject(failure),
            onPersistenceError: (error: unknown) => errors.push(error),
          },
        },
      ],
    });
    const service = TestBed.inject(BuludAppearance);
    expect(service.themeMode).toBe('light');
    await service.changeTheme('dark');
    expect(service.themeMode).toBe('light');
    expect(errors).toEqual([failure]);
    const states: string[] = [];
    service.getSideBarState().subscribe((value) => states.push(value));
    service.showSideBar();
    service.minimizeSideBar();
    service.hideSideBar();
    expect(states).toEqual(['closed', 'opened', 'minimized', 'closed']);
  });
});
