import {
  computed,
  DestroyRef,
  DOCUMENT,
  inject,
  Injectable,
  InjectionToken,
  Signal,
  signal,
} from '@angular/core';
export type BuludRuntimeDirection = 'ltr' | 'rtl';
export interface BuludLanguageOption {
  readonly id?: string | number;
  readonly code: string;
  readonly label: string;
  readonly direction?: BuludRuntimeDirection;
  readonly flag?: string;
}
export interface BuludRuntimeConfig {
  readonly language?: Signal<string>;
  readonly direction?: Signal<BuludRuntimeDirection>;
  readonly languages?: Signal<readonly BuludLanguageOption[]>;
  readonly translationRevision?: Signal<unknown>;
  readonly translate?: (
    key: string,
    params?: Readonly<Record<string, unknown>>,
  ) => string;
  readonly setLanguage?: (language: string) => void | Promise<void>;
  /** Optional hook for project-owned URL policy, including a locked locale. */
  readonly displayedLanguage?: (language: string) => void;
}
export const BULUD_RUNTIME_CONFIG = new InjectionToken<BuludRuntimeConfig>(
  'BULUD_RUNTIME_CONFIG',
  { providedIn: 'root', factory: () => ({}) },
);
/** Shared live locale/viewport context. One document observer and resize listener
 * per injector, with no translation, router, JWT, cookie or account dependency. */
@Injectable({ providedIn: 'root' })
export class BuludRuntime {
  private readonly config = inject(BULUD_RUNTIME_CONFIG);
  private readonly document = inject(DOCUMENT);
  private readonly attributes = signal(this.readAttributes());
  private readonly width = signal(
    this.document.defaultView?.innerWidth ?? 1024,
  );
  readonly appearanceRevision = signal(0);
  readonly viewportWidth = this.width.asReadonly();
  readonly language = computed(
    () => this.config.language?.() ?? this.attributes().language,
  );
  readonly direction = computed(
    () => this.config.direction?.() ?? this.attributes().direction,
  );
  readonly languages = computed(() => this.config.languages?.() ?? []);
  constructor() {
    const win = this.document.defaultView;
    if (!win) return;
    const resize = () => this.width.set(win.innerWidth);
    win.addEventListener('resize', resize, { passive: true });
    const Observer = (
      win as Window & { MutationObserver?: typeof MutationObserver }
    ).MutationObserver;
    const observer = Observer
      ? new Observer(() => {
          this.attributes.set(this.readAttributes());
          this.appearanceRevision.update((value) => value + 1);
        })
      : undefined;
    observer?.observe(this.document.documentElement, {
      attributes: true,
      attributeFilter: ['lang', 'dir', 'data-bs-theme', 'data-theme', 'class'],
    });
    inject(DestroyRef).onDestroy(() => {
      win.removeEventListener('resize', resize);
      observer?.disconnect();
    });
  }
  private readAttributes(): {
    language: string;
    direction: BuludRuntimeDirection;
  } {
    const element = this.document.documentElement;
    return {
      language: element.lang || 'en',
      direction: element.dir === 'rtl' ? 'rtl' : 'ltr',
    };
  }
  text(
    key: string,
    fallback: string,
    params?: Readonly<Record<string, unknown>>,
  ): string {
    this.language();
    this.config.translationRevision?.();
    if (!key) return fallback;
    const translated = this.config.translate?.(key, params);
    return translated && translated !== key ? translated : fallback;
  }
  setLanguage(code: string): void {
    void this.config.setLanguage?.(code);
  }
  displayedLanguage(code: string): void {
    this.config.displayedLanguage?.(code);
  }
}
