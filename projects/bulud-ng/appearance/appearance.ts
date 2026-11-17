import {
  DestroyRef,
  DOCUMENT,
  inject,
  Injectable,
  InjectionToken,
  signal,
} from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
export type BuludThemeName = string;
export type BuludSidebarState = 'opened' | 'closed' | 'minimized';
export interface BuludAppearanceConfig {
  readonly themes?: readonly BuludThemeName[];
  readonly defaultTheme?: BuludThemeName;
  readonly themeAttribute?: string;
  readonly readTheme?: () => BuludThemeName | undefined;
  readonly writeTheme?: (theme: BuludThemeName) => void;
  /** Account/API persistence stays in the consuming application's provider. */
  readonly persistTheme?: (theme: BuludThemeName) => void | Promise<void>;
  readonly onPersistenceError?: (error: unknown) => void;
}
export const BULUD_APPEARANCE_CONFIG =
  new InjectionToken<BuludAppearanceConfig>('BULUD_APPEARANCE_CONFIG', {
    providedIn: 'root',
    factory: () => ({}),
  });
@Injectable({ providedIn: 'root' })
export class BuludAppearance {
  private readonly config = inject(BULUD_APPEARANCE_CONFIG);
  private readonly document = inject(DOCUMENT);
  private readonly modes = this.config.themes?.length
    ? [...new Set(this.config.themes)]
    : ['light', 'dark'];
  readonly defaultMode = this.config.defaultTheme ?? this.modes[0];
  private readonly state = signal(this.defaultMode);
  readonly theme = this.state.asReadonly();
  private readonly themeMode$ = new BehaviorSubject<BuludThemeName>(
    this.defaultMode,
  );
  private readonly sidebar$ = new BehaviorSubject<BuludSidebarState>('closed');
  get themeMode(): BuludThemeName {
    return this.state();
  }
  constructor() {
    const stored = this.config.readTheme?.();
    const initial =
      stored && this.modes.includes(stored) ? stored : this.defaultMode;
    this.apply(initial);
    inject(DestroyRef).onDestroy(() => {
      this.themeMode$.complete();
      this.sidebar$.complete();
    });
  }
  private apply(theme: BuludThemeName): void {
    this.state.set(theme);
    this.themeMode$.next(theme);
    this.document.documentElement.setAttribute(
      this.config.themeAttribute ?? 'data-bs-theme',
      theme,
    );
  }
  setTheme(theme: BuludThemeName): void {
    if (!this.modes.includes(theme)) return;
    void this.changeTheme(theme);
    this.config.writeTheme?.(theme);
    this.apply(theme);
  }
  toggleThemeMode(): void {
    this.setTheme(
      this.modes[(this.modes.indexOf(this.state()) + 1) % this.modes.length],
    );
  }
  getThemeMode(): Observable<BuludThemeName> {
    return this.themeMode$.asObservable();
  }
  /** Preserves the existing persistence-only method; setTheme also updates UI. */
  async changeTheme(theme: BuludThemeName): Promise<void> {
    try {
      await this.config.persistTheme?.(theme);
    } catch (error) {
      this.config.onPersistenceError?.(error);
    }
  }
  getSideBarState(): Observable<BuludSidebarState> {
    return this.sidebar$.asObservable();
  }
  showSideBar(): void {
    this.sidebar$.next('opened');
  }
  hideSideBar(): void {
    this.sidebar$.next('closed');
  }
  minimizeSideBar(): void {
    this.sidebar$.next('minimized');
  }
}
